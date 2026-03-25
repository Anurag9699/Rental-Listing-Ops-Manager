import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_BASE_URL } from '../utils/apiConfig';
import { Calendar, Info, CheckCircle, ChevronLeft, Lock, ArrowUpRight } from 'lucide-react';

interface Listing {
    id: string;
    title: string;
    status: string;
    category: string;
}

interface AvailabilityBlock {
    id: string;
    startDate: string;
    endDate: string;
    blockReason: string | null;
}

export default function ListingDetail() {
    const { id } = useParams();
    const [listing, setListing] = useState<Listing | null>(null);
    const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        startDate: '',
        endDate: '',
        blockReason: ''
    });

    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [activeTab, setActiveTab] = useState<'availability' | 'chat'>('availability');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch Listing from Backend
                const listingRes = await fetch(`${API_BASE_URL.BACKEND}/listings/${id}`);
                if (listingRes.ok) {
                    const data = await listingRes.json();
                    setListing(data);
                }

                // Fetch Availability from Engine
                const availabilityRes = await fetch(`${API_BASE_URL.AVAILABILITY}/availability/${id}`);
                if (availabilityRes.ok) {
                    const data = await availabilityRes.json();
                    setBlocks(data);
                }

                // Fetch Chat History
                const chatRes = await fetch(`${API_BASE_URL.BACKEND}/chat/${id}`);
                if (chatRes.ok) {
                    const data = await chatRes.json();
                    setMessages(data);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const res = await fetch(`${API_BASE_URL.BACKEND}/chat/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    listingId: id, 
                    senderRole: 'CUSTOMER', // Defaulting to customer for UI demo
                    messageText: newMessage 
                })
            });
            if (res.ok) {
                const sentMsg = await res.json();
                setMessages([...messages, sentMsg]);
                setNewMessage('');
            }
        } catch (err) {
            alert('Failed to send message');
        }
    };

    const handleBlockDates = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL.AVAILABILITY}/availability/block`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ listingId: id, ...form })
            });
            if (res.ok) {
                const newBlock = await res.json();
                setBlocks([...blocks, newBlock]);
                setForm({ startDate: '', endDate: '', blockReason: '' });
                alert('Success: Dates blocked!');
            }
        } catch (err: any) {
            alert('Failed to block dates: ' + err.message);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-center p-6">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 max-w-md">
                <div className="text-red-500 mb-4 inline-block p-3 bg-red-50 rounded-full">
                    <Info size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h2>
                <p className="text-slate-600 mb-6">{error}</p>
                <Link to="/" className="inline-flex items-center gap-2 px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition font-medium">
                    <ChevronLeft size={18} /> Go Back
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-white to-indigo-50/30">
            <div className="max-w-5xl mx-auto px-6 py-12">
                {/* Header Section */}
                <div className="mb-12">
                    <Link to="/" className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 font-medium transition mb-4">
                        <ChevronLeft size={20} /> Dashboard
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-indigo-100 text-indigo-700`}>
                                    {listing?.category || 'URBAN'}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${
                                    listing?.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                                }`}>
                                    {listing?.status || 'Active'}
                                </span>
                                <span className="text-slate-400 text-sm flex items-center gap-1">
                                    <CheckCircle size={14} className="text-indigo-500" />
                                    Verified Property
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
                                {listing?.title || 'Listing Detail'}
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Main Content (Tabs) */}
                    <div className="lg:col-span-7">
                        <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/40 shadow-2xl shadow-indigo-100/50 overflow-hidden">
                            {/* Tab Switcher */}
                            <div className="flex border-b border-slate-100 bg-slate-50/50">
                                <button 
                                    onClick={() => setActiveTab('availability')}
                                    className={`flex-1 py-4 font-bold transition-all flex items-center justify-center gap-2 ${
                                        activeTab === 'availability' ? 'text-indigo-600 bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    <Calendar size={18} /> Availability
                                </button>
                                <button 
                                    onClick={() => setActiveTab('chat')}
                                    className={`flex-1 py-4 font-bold transition-all flex items-center justify-center gap-2 ${
                                        activeTab === 'chat' ? 'text-indigo-600 bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    <Info size={18} /> Chat Rooms
                                </button>
                            </div>

                            <div className="p-8 min-h-[400px]">
                                {activeTab === 'availability' ? (
                                    <>
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-2xl font-bold text-slate-800">Operational Timeline</h3>
                                            <span className="bg-indigo-50 text-indigo-600 text-sm font-bold px-4 py-1.5 rounded-full">
                                                {blocks.length} Entries
                                            </span>
                                        </div>
                                        <div className="space-y-6">
                                            {blocks.length > 0 ? (
                                                <div className="grid gap-4">
                                                    {blocks.map((block, idx) => (
                                                        <div key={block.id} className="group relative flex gap-6 p-6 bg-white/50 hover:bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all duration-300 shadow-indigo-50 hover:shadow-lg">
                                                            <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 font-bold shrink-0">
                                                                #{idx + 1}
                                                            </div>
                                                            <div className="flex flex-col justify-center">
                                                                <div className="flex items-center gap-2 mb-1 text-slate-800 font-bold text-lg">
                                                                    {new Date(block.startDate).toLocaleDateString()} → {new Date(block.endDate).toLocaleDateString()}
                                                                </div>
                                                                <p className="text-slate-500 text-sm font-medium">{block.blockReason || 'Manual Block'}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-16 text-center text-slate-300">
                                                    <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                                                    <p className="text-lg font-medium">No blocked dates scheduled</p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col h-full">
                                        <div className="flex-1 space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2">
                                            {messages.length > 0 ? messages.map((msg) => (
                                                <div key={msg.id} className={`flex ${msg.senderRole === 'CUSTOMER' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                                                        msg.senderRole === 'CUSTOMER' 
                                                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                                                            : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                                                    }`}>
                                                        <p className="text-sm font-medium">{msg.messageText}</p>
                                                        <span className={`text-[10px] mt-1 block opacity-60 ${msg.senderRole === 'CUSTOMER' ? 'text-indigo-100' : 'text-slate-400'}`}>
                                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="py-16 text-center text-slate-300">
                                                    <Info size={48} className="mx-auto mb-4 opacity-20" />
                                                    <p className="text-lg font-medium">Start conversation regarding availability</p>
                                                </div>
                                            )}
                                        </div>
                                        <form onSubmit={handleSendMessage} className="flex gap-3">
                                            <input 
                                                type="text" 
                                                placeholder="Type your question..."
                                                className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-slate-700"
                                                value={newMessage}
                                                onChange={e => setNewMessage(e.target.value)}
                                            />
                                            <button 
                                                type="submit"
                                                className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
                                            >
                                                <ArrowUpRight size={24} />
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Task Card (sidebar) */}
                    <div className="lg:col-span-5">
                        <div className="sticky top-8">
                            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                                    <Lock className="text-indigo-400" />
                                    Reserve / Block Dates
                                </h3>
                                <form onSubmit={handleBlockDates} className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Check In</label>
                                            <input 
                                                type="date" 
                                                required 
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:bg-white/10 outline-none transition"
                                                value={form.startDate} 
                                                onChange={e => setForm({...form, startDate: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Check Out</label>
                                            <input 
                                                type="date" 
                                                required 
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:bg-white/10 outline-none transition"
                                                value={form.endDate} 
                                                onChange={e => setForm({...form, endDate: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Reason</label>
                                        <input 
                                            type="text" 
                                            placeholder="Booking confirmation"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:bg-white/10 outline-none transition"
                                            value={form.blockReason} 
                                            onChange={e => setForm({...form, blockReason: e.target.value})}
                                        />
                                    </div>
                                    <button 
                                        type="submit" 
                                        className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-black text-lg hover:bg-indigo-400 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-500/20 mt-4"
                                    >
                                        Apply Block
                                    </button>
                                </form>
                                <p className="mt-6 text-center text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                                    Enforced by Availability Engine &bull; Port 3002
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
