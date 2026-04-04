import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/RoleContext';
import { API_BASE_URL } from '../utils/apiConfig';
import { ArrowLeft, Calendar, MessageSquare, Send, CheckCircle } from 'lucide-react';

export default function CustomerListingDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const [listing, setListing] = useState<any>(null);
    const [blocks, setBlocks] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'availability' | 'chat'>('availability');
    const [loading, setLoading] = useState(true);

    // Booking form
    const [bookForm, setBookForm] = useState({ startDate: '', endDate: '' });
    const [bookMsg, setBookMsg] = useState('');
    const [bookError, setBookError] = useState('');
    const [booking, setBooking] = useState(false);

    // Chat
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

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        setBookError(''); setBookMsg(''); setBooking(true);
        try {
            const res = await fetch(`${API_BASE_URL.BACKEND}/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ listingId: id, customerId: user?.id, startDate: bookForm.startDate, endDate: bookForm.endDate }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setBookMsg('✅ Booking Confirmed! Your dates have been successfully locked.');
            setBookForm({ startDate: '', endDate: '' });
            fetchData(); // Instantly refresh the calendar blocks
        } catch (err: any) { setBookError(err.message); } finally { setBooking(false); }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatText.trim()) return;
        try {
            const res = await fetch(`${API_BASE_URL.BACKEND}/chat/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ listingId: id, senderId: user?.id, senderRole: 'CUSTOMER', messageText: chatText }),
            });
            if (res.ok) {
                const msg = await res.json();
                setMessages([...messages, msg]);
                setChatText('');
            }
        } catch (e) {}
    };

    const categoryIcons: Record<string, string> = { LUXURY: '🏰', ECONOMY: '🏠', WATERFRONT: '🌊', URBAN: '🏙️' };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;
    if (!listing) return <p className="text-center text-red-500 py-12">Listing not found.</p>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <Link to="/customer" className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm">
                <ArrowLeft className="w-4 h-4" /> Back to listings
            </Link>

            {/* Listing Hero Images */}
            {listing.imageUrls && listing.imageUrls.length > 0 ? (
                <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px] rounded-2xl overflow-hidden mb-6">
                    <div className="col-span-2 row-span-2 overflow-hidden bg-slate-100">
                        <img src={listing.imageUrls[0]} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                    {listing.imageUrls.slice(1, 5).map((url: string, idx: number) => (
                        <div key={idx} className="overflow-hidden bg-slate-100">
                            <img src={url} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                        </div>
                    ))}
                    {/* Fill empty spots if less than 5 images */}
                    {Array.from({ length: Math.max(0, 4 - (listing.imageUrls.length - 1)) }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-slate-100 h-full w-full"></div>
                    ))}
                </div>
            ) : (
                <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                    <span className="text-8xl">{categoryIcons[listing.category] || '🏠'}</span>
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-8">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        <div>
                            <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">✓ Verified Listing</span>
                            <h1 className="text-3xl font-bold text-slate-800 mt-3">{listing.title}</h1>
                            <p className="text-slate-500 mt-2">{listing.description || 'Experience exceptional living with premium amenities and a prime location.'}</p>
                            <div className="flex gap-3 mt-4">
                                <span className="bg-slate-100 text-slate-600 text-sm px-3 py-1 rounded-full">{listing.category}</span>
                                <span className="bg-blue-50 text-blue-600 text-sm px-3 py-1 rounded-full">Min. Stay: 2 Nights</span>
                            </div>
                        </div>

                        {/* Booking Card */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 w-full lg:w-80 shrink-0">
                            <h3 className="font-semibold text-slate-800 mb-1">BOOKING INFO</h3>
                            <p className="text-2xl font-bold text-slate-800 mb-4">₹145 <span className="text-sm font-normal text-slate-500">/ night</span></p>
                            
                            {bookMsg && <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-lg mb-3">{bookMsg}</div>}
                            {bookError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-3">{bookError}</div>}

                            <form onSubmit={handleBook} className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">CHECK-IN</label>
                                    <input type="date" required value={bookForm.startDate} onChange={e => setBookForm({ ...bookForm, startDate: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">CHECK-OUT</label>
                                    <input type="date" required value={bookForm.endDate} onChange={e => setBookForm({ ...bookForm, endDate: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <button type="submit" disabled={booking}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/20">
                                    {booking ? 'Submitting...' : '📅 Book Now'}
                                </button>
                            </form>
                            <p className="text-xs text-slate-400 mt-3 text-center">✨ Instant Booking Confirmation</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
                <button onClick={() => setActiveTab('availability')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'availability' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                    <Calendar className="w-4 h-4" /> Availability Calendar
                </button>
                <button onClick={() => setActiveTab('chat')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'chat' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                    <MessageSquare className="w-4 h-4" /> Contact Operator
                </button>
            </div>

            {/* Calendar View (read-only) */}
            {activeTab === 'availability' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-800">Availability Overview</h3>
                        <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-100 border border-slate-300"></span> Available</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-200 border border-red-300"></span> Blocked</span>
                        </div>
                    </div>
                    {blocks.length === 0 ? (
                        <div className="text-center py-10">
                            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                            <p className="text-green-600 font-medium">All dates are currently available!</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {blocks.map((block: any, i: number) => (
                                <div key={block.id || i} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                                    <div>
                                        <p className="text-sm font-medium text-red-800">
                                            {new Date(block.startDate).toLocaleDateString()} → {new Date(block.endDate).toLocaleDateString()}
                                        </p>
                                        <p className="text-xs text-red-400 mt-0.5">Reserved / Blocked</p>
                                    </div>
                                    <span className="text-xs bg-red-200 text-red-700 px-2 py-0.5 rounded-full">Blocked</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                        <p className="text-sm text-amber-700">
                            <strong>Important Note:</strong> This calendar is for viewing purposes only. Dates marked as "Blocked" are reserved. 
                            Contact the operator to confirm availability for specific date ranges.
                        </p>
                    </div>
                </div>
            )}

            {/* Chat */}
            {activeTab === 'chat' && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="h-80 overflow-y-auto p-6 space-y-4">
                        {messages.length === 0 && <p className="text-center text-slate-400 py-12">No messages yet. Start a conversation!</p>}
                        {messages.map((msg: any, i: number) => (
                            <div key={msg.id || i} className={`flex ${msg.senderRole === 'CUSTOMER' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-md px-4 py-3 rounded-2xl ${
                                    msg.senderRole === 'CUSTOMER' ? 'bg-blue-500 text-white rounded-br-md' : 'bg-slate-100 text-slate-800 rounded-bl-md'
                                }`}>
                                    <p className={`text-xs font-semibold mb-1 ${msg.senderRole === 'CUSTOMER' ? 'text-blue-100' : 'text-slate-500'}`}>
                                        {msg.senderRole === 'CUSTOMER' ? 'You' : 'Operator'}
                                    </p>
                                    <p className="text-sm">{msg.messageText}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleSendMessage} className="border-t border-slate-200 p-4 flex gap-2">
                        <input type="text" value={chatText} onChange={e => setChatText(e.target.value)}
                            placeholder="Type your message..."
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
