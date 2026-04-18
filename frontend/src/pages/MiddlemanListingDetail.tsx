import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/RoleContext';
import { API_BASE_URL } from '../utils/apiConfig';
import { apiFetch } from '../utils/apiFetch';
import { ArrowLeft, Calendar, MessageSquare, Send, MapPin, Trash2 } from 'lucide-react';

export default function MiddlemanListingDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const [listing, setListing] = useState<any>(null);
    const [blocks, setBlocks] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'availability' | 'chat'>('availability');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

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
            const listingRes = await apiFetch(`${API_BASE_URL.BACKEND}/listings/${id}`);
            if (listingRes.ok) setListing(await listingRes.json());
        } catch (e) { console.error("Failed to fetch listing"); }

        try {
            const blocksRes = await apiFetch(`${API_BASE_URL.AVAILABILITY}/availability/${id}`);
            if (blocksRes.ok) setBlocks(await blocksRes.json());
        } catch (e) { console.error("Failed to fetch availability"); }

        try {
            const chatRes = await apiFetch(`${API_BASE_URL.BACKEND}/chat/${id}`);
            if (chatRes.ok) setMessages(await chatRes.json());
        } catch (e) { console.error("Failed to fetch chat"); }
        
        setLoading(false);
    };

    const handleDeleteListing = async () => {
        if (!window.confirm('Are you sure you want to permanently delete this listing?')) return;
        try {
            const res = await apiFetch(`${API_BASE_URL.BACKEND}/listings/${id}?ownerId=${user?.id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                navigate('/middleman');
            } else {
                const err = await res.json();
                alert(`Error deleting listing: ${err.error}`);
            }
        } catch (e) {
            alert('Failed to delete listing due to network error.');
        }
    };

    const handleBlockDates = async (e: React.FormEvent) => {
        e.preventDefault();
        setBlockError('');
        try {
            const res = await apiFetch(`${API_BASE_URL.AVAILABILITY}/availability/block`, {
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
            const res = await apiFetch(`${API_BASE_URL.BACKEND}/chat/message`, {
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
            {/* Header Actions */}
            <div className="flex justify-between items-center mb-4">
                <Link to="/middleman" className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back to listings
                </Link>
                <button onClick={handleDeleteListing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-sm rounded-lg text-sm font-medium transition-colors">
                    <Trash2 className="w-4 h-4" /> Delete Property
                </button>
            </div>

            {/* Listing Hero Images */}
            {listing.imageUrls && listing.imageUrls.length > 0 ? (
                <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px] rounded-2xl overflow-hidden mb-6">
                    <div className="col-span-2 row-span-2 overflow-hidden bg-slate-100">
                        <img src={listing.imageUrls[0]} onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400/e2e8f0/64748b?text=Unavailable'; }} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                    {listing.imageUrls.slice(1, 5).map((url: string, idx: number) => (
                        <div key={idx} className="overflow-hidden bg-slate-100">
                            <img src={url} onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400/e2e8f0/64748b?text=Unavailable'; }} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                        </div>
                    ))}
                    {Array.from({ length: Math.max(0, 4 - (listing.imageUrls.length - 1)) }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-slate-100 h-full w-full"></div>
                    ))}
                </div>
            ) : (
                <div className="h-40 bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-200">
                    <span className="text-slate-400">No images provided</span>
                </div>
            )}

            {/* Header / Info block */}
            <div className="flex flex-col gap-2 mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-slate-800">{listing.title}</h1>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[listing.status] || 'bg-slate-100 text-slate-700'}`}>{listing.status}</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 text-sm text-slate-500">
                    <p>ID: #{listing.id?.substring(0, 8)}</p>
                    <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>{listing.city || 'Location not specified'}{listing.address ? `, ${listing.address}` : ''}</span>
                    </div>
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
