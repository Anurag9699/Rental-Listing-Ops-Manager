import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/RoleContext';
import { API_BASE_URL } from '../utils/apiConfig';
import { ArrowLeft, Calendar, MessageSquare, Send } from 'lucide-react';

export default function MiddlemanListingDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const [listing, setListing] = useState<any>(null);
    const [blocks, setBlocks] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'availability' | 'chat'>('availability');
    const [loading, setLoading] = useState(true);

    // Block dates form
    const [blockForm, setBlockForm] = useState({ startDate: '', endDate: '', blockReason: '' });
    const [blockError, setBlockError] = useState('');

    // Chat form
    const [chatText, setChatText] = useState('');

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [listingRes, blocksRes, chatRes] = await Promise.all([
                fetch(`${API_BASE_URL.BACKEND}/listings/${id}`),
                fetch(`${API_BASE_URL.AVAILABILITY}/availability/${id}`),
                fetch(`${API_BASE_URL.BACKEND}/chat/${id}`),
            ]);
            setListing(await listingRes.json());
            setBlocks(await blocksRes.json());
            setMessages(await chatRes.json());
        } catch (e) {} finally { setLoading(false); }
    };

    const handleBlockDates = async (e: React.FormEvent) => {
        e.preventDefault();
        setBlockError('');
        try {
            const res = await fetch(`${API_BASE_URL.AVAILABILITY}/availability/block`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ listingId: id, ...blockForm }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setBlocks([...blocks, data]);
            setBlockForm({ startDate: '', endDate: '', blockReason: '' });
        } catch (err: any) { setBlockError(err.message); }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatText.trim()) return;
        try {
            const res = await fetch(`${API_BASE_URL.BACKEND}/chat/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ listingId: id, senderId: user?.id, senderRole: 'MIDDLEMAN', messageText: chatText }),
            });
            if (res.ok) {
                const msg = await res.json();
                setMessages([...messages, msg]);
                setChatText('');
            }
        } catch (e) {}
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;
    if (!listing) return <p className="text-center text-red-500 py-12">Listing not found.</p>;

    const statusColor: Record<string, string> = {
        DRAFT: 'bg-gray-100 text-gray-700', PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
        ACTIVE: 'bg-green-100 text-green-700', PAUSED: 'bg-blue-100 text-blue-700',
        REJECTED: 'bg-red-100 text-red-700', DISABLED: 'bg-slate-200 text-slate-500',
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/middleman" className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5" /></Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-800">{listing.title}</h1>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[listing.status]}`}>{listing.status}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">ID: #{listing.id?.substring(0, 8)}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
                <button onClick={() => setActiveTab('availability')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'availability' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                    <Calendar className="w-4 h-4" /> Availability
                </button>
                <button onClick={() => setActiveTab('chat')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'chat' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                    <MessageSquare className="w-4 h-4" /> Chat
                </button>
            </div>

            {/* Availability Tab */}
            {activeTab === 'availability' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <div className="bg-white border border-slate-200 rounded-xl p-6">
                            <h3 className="font-semibold text-slate-800 mb-4">Blocked Date Ranges</h3>
                            {blocks.length === 0 ? (
                                <p className="text-slate-400 text-center py-8">No availability blocks configured.</p>
                            ) : (
                                <div className="space-y-2">
                                    {blocks.map((block: any, i: number) => (
                                        <div key={block.id || i} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                                            <div>
                                                <p className="text-sm font-medium text-red-800">
                                                    {new Date(block.startDate).toLocaleDateString()} → {new Date(block.endDate).toLocaleDateString()}
                                                </p>
                                                {block.blockReason && <p className="text-xs text-red-500 mt-0.5">{block.blockReason}</p>}
                                            </div>
                                            <span className="text-xs bg-red-200 text-red-700 px-2 py-0.5 rounded-full">Blocked</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <div className="bg-white border border-slate-200 rounded-xl p-6">
                            <h3 className="font-semibold text-slate-800 mb-4">Block Dates</h3>
                            {blockError && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded">{blockError}</p>}
                            <form onSubmit={handleBlockDates} className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">START DATE</label>
                                    <input type="date" required value={blockForm.startDate} onChange={e => setBlockForm({ ...blockForm, startDate: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">END DATE</label>
                                    <input type="date" required value={blockForm.endDate} onChange={e => setBlockForm({ ...blockForm, endDate: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">BLOCK REASON</label>
                                    <textarea value={blockForm.blockReason} onChange={e => setBlockForm({ ...blockForm, blockReason: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-20"
                                        placeholder="e.g. Owner stay, maintenance..." />
                                </div>
                                <button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg font-medium text-sm transition-colors">
                                    Confirm Block
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Tab */}
            {activeTab === 'chat' && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="h-96 overflow-y-auto p-6 space-y-4">
                        {messages.length === 0 && <p className="text-center text-slate-400 py-12">No messages yet.</p>}
                        {messages.map((msg: any, i: number) => (
                            <div key={msg.id || i} className={`flex ${msg.senderRole === 'MIDDLEMAN' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-md px-4 py-3 rounded-2xl ${
                                    msg.senderRole === 'MIDDLEMAN' ? 'bg-blue-500 text-white rounded-br-md' : 'bg-slate-100 text-slate-800 rounded-bl-md'
                                }`}>
                                    <p className={`text-xs font-semibold mb-1 ${msg.senderRole === 'MIDDLEMAN' ? 'text-blue-100' : 'text-slate-500'}`}>
                                        {msg.senderRole}
                                    </p>
                                    <p className="text-sm">{msg.messageText}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleSendMessage} className="border-t border-slate-200 p-4 flex gap-2">
                        <input type="text" value={chatText} onChange={e => setChatText(e.target.value)}
                            placeholder="Type your message as Operator..."
                            className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg transition-colors">
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
