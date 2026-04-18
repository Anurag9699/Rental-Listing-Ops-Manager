import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/RoleContext';
import { API_BASE_URL } from '../utils/apiConfig';
import { apiFetch } from '../utils/apiFetch';
import { ArrowLeft, Calendar, MessageSquare, Send, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CustomerListingDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const [listing, setListing] = useState<any>(null);
    const [blockedRanges, setBlockedRanges] = useState<{ start: Date; end: Date; type: 'booked' | 'blocked'; label?: string }[]>([]);
    const [myBookings, setMyBookings] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'availability' | 'chat'>('availability');
    const [loading, setLoading] = useState(true);
    // Calendar navigation
    const [calMonth, setCalMonth] = useState(() => {
        const d = new Date(); d.setDate(1); return d;
    });

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
            const listingRes = await apiFetch(`${API_BASE_URL.BACKEND}/listings/${id}`);
            if (listingRes.ok) setListing(await listingRes.json());
        } catch (e) { console.error("Failed to fetch listing"); }

        const merged: { start: Date; end: Date; type: 'booked' | 'blocked'; label?: string }[] = [];

        // Source 1: Manual blocks by middleman from Availability Engine
        try {
            const blocksRes = await apiFetch(`${API_BASE_URL.AVAILABILITY}/availability/${id}`);
            if (blocksRes.ok) {
                const data = await blocksRes.json();
                for (const b of data) {
                    merged.push({ start: new Date(b.startDate), end: new Date(b.endDate), type: 'blocked', label: b.blockReason || 'Blocked by operator' });
                }
            }
        } catch (e) { console.error("Failed to fetch availability blocks"); }

        // Source 2: Confirmed bookings from Backend DB (most reliable source)
        try {
            const bookingsRes = await apiFetch(`${API_BASE_URL.BACKEND}/bookings/${id}`);
            if (bookingsRes.ok) {
                const data = await bookingsRes.json();
                const mine: any[] = [];
                for (const b of data) {
                    if (b.status === 'CONFIRMED') {
                        merged.push({ start: new Date(b.startDate), end: new Date(b.endDate), type: 'booked', label: 'Reserved by guest' });
                    }
                    if (b.customerId === user?.id) {
                        mine.push(b);
                    }
                }
                setMyBookings(mine);
            }
        } catch (e) { console.error("Failed to fetch bookings"); }

        setBlockedRanges(merged);

        try {
            if (user?.id) {
                const chatRes = await apiFetch(`${API_BASE_URL.BACKEND}/chat/${id}?customerId=${user.id}`);
                if (chatRes.ok) setMessages(await chatRes.json());
            }
        } catch (e) { console.error("Failed to fetch chat"); }
        
        setLoading(false);
    };

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        setBookError(''); setBookMsg(''); 

        // Client-side validation: prevent past dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = new Date(bookForm.startDate);
        const end = new Date(bookForm.endDate);
        if (start < today) {
            return setBookError('Check-in date cannot be in the past.');
        }
        if (end <= start) {
            return setBookError('Check-out date must be after check-in date.');
        }

        setBooking(true);
        try {
            const res = await apiFetch(`${API_BASE_URL.BACKEND}/bookings`, {
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
            const res = await apiFetch(`${API_BASE_URL.BACKEND}/chat/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ listingId: id, customerId: user?.id, senderId: user?.id, senderRole: 'CUSTOMER', messageText: chatText }),
            });
            if (res.ok) {
                const msg = await res.json();
                setMessages([...messages, msg]);
                setChatText('');
            }
        } catch (e) {}
    };

    const handleCancelBooking = async (bookingId: string) => {
        if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return;
        try {
            const res = await apiFetch(`${API_BASE_URL.BACKEND}/bookings/${bookingId}`, { method: 'DELETE' });
            if (res.ok) {
                alert('Booking cancelled successfully.');
                fetchData();
            } else {
                const data = await res.json();
                alert(`Failed to cancel booking: ${data.error}`);
            }
        } catch (e) {
            alert('Error cancelling booking.');
        }
    };

    // Helper: check if a given date falls in any blocked range
    const getDayStatus = useMemo(() => (date: Date): 'booked' | 'blocked' | 'available' => {
        const d = new Date(date); d.setHours(0, 0, 0, 0);
        for (const range of blockedRanges) {
            const s = new Date(range.start); s.setHours(0, 0, 0, 0);
            const e = new Date(range.end); e.setHours(0, 0, 0, 0);
            if (d >= s && d <= e) return range.type;
        }
        return 'available';
    }, [blockedRanges]);

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
                        <img src={listing.imageUrls[0]} onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400/e2e8f0/64748b?text=Unavailable'; }} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                    {listing.imageUrls.slice(1, 5).map((url: string, idx: number) => (
                        <div key={idx} className="overflow-hidden bg-slate-100">
                            <img src={url} onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400/e2e8f0/64748b?text=Unavailable'; }} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
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
                            <p className="text-2xl font-bold text-slate-800 mb-4">₹{listing.pricePerNight?.toLocaleString('en-IN') || '0'} <span className="text-sm font-normal text-slate-500">/ night</span></p>
                            
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

                            {/* User's Bookings List */}
                            {myBookings.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-slate-200">
                                    <h4 className="font-semibold text-slate-800 text-sm mb-3">YOUR BOOKINGS</h4>
                                    <div className="space-y-3">
                                        {myBookings.map((b: any) => (
                                            <div key={b.id} className="bg-white border border-slate-200 rounded-lg p-3 text-xs flex justify-between items-center shadow-sm">
                                                <div>
                                                    <p className="font-medium text-slate-700">
                                                        {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                                                    </p>
                                                    <p className={`font-semibold mt-0.5 ${b.status === 'CONFIRMED' ? 'text-green-600' : 'text-amber-600'}`}>
                                                        {b.status}
                                                    </p>
                                                </div>
                                                <button onClick={() => handleCancelBooking(b.id)} className="text-red-500 hover:text-red-700 font-medium px-2.5 py-1.5 bg-red-50 hover:bg-red-100 rounded-md transition-colors">
                                                    Cancel
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
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

            {/* Calendar View */}
            {activeTab === 'availability' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-slate-800">Availability Calendar</h3>
                        <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300"></span> Available</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-200 border border-blue-300"></span> Booked</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-200 border border-red-300"></span> Blocked</span>
                        </div>
                    </div>

                    {/* Month navigator */}
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => { const d = new Date(calMonth); d.setMonth(d.getMonth() - 1); setCalMonth(d); }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                            <ChevronLeft className="w-4 h-4 text-slate-500" />
                        </button>
                        <span className="font-semibold text-slate-700 text-sm">
                            {calMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={() => { const d = new Date(calMonth); d.setMonth(d.getMonth() + 1); setCalMonth(d); }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                        </button>
                    </div>

                    {/* Day grid */}
                    {(() => {
                        const year = calMonth.getFullYear();
                        const month = calMonth.getMonth();
                        const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        const today = new Date(); today.setHours(0, 0, 0, 0);
                        const cells: React.ReactNode[] = [];

                        // Empty leading cells
                        for (let i = 0; i < firstDay; i++) {
                            cells.push(<div key={`e-${i}`} />);
                        }

                        for (let day = 1; day <= daysInMonth; day++) {
                            const date = new Date(year, month, day);
                            const isPast = date < today;
                            const status = isPast ? 'past' : getDayStatus(date);

                            const colorClass =
                                isPast ? 'bg-slate-50 text-slate-300 cursor-not-allowed' :
                                status === 'booked'  ? 'bg-blue-100 text-blue-700 border border-blue-300 font-semibold' :
                                status === 'blocked' ? 'bg-red-100 text-red-700 border border-red-300 font-semibold' :
                                'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer transition-colors';

                            cells.push(
                                <div key={day} title={isPast ? 'Past date' : status === 'booked' ? 'Reserved by guest' : status === 'blocked' ? 'Blocked by operator' : 'Available'}
                                    className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium ${colorClass}`}>
                                    {day}
                                </div>
                            );
                        }

                        return (
                            <div>
                                {/* Day labels */}
                                <div className="grid grid-cols-7 gap-1 mb-1">
                                    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                                        <div key={d} className="text-center text-xs text-slate-400 font-medium py-1">{d}</div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">{cells}</div>
                            </div>
                        );
                    })()}

                    {/* Blocked ranges summary */}
                    {blockedRanges.length > 0 && (
                        <div className="mt-6 space-y-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reserved Periods</p>
                            {blockedRanges.map((r, i) => (
                                <div key={i} className={`flex items-center justify-between rounded-lg px-4 py-2.5 ${
                                    r.type === 'booked' ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'
                                }`}>
                                    <div>
                                        <p className={`text-sm font-medium ${r.type === 'booked' ? 'text-blue-800' : 'text-red-800'}`}>
                                            {new Date(r.start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            {' → '}
                                            {new Date(r.end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                        <p className={`text-xs mt-0.5 ${r.type === 'booked' ? 'text-blue-500' : 'text-red-500'}`}>{r.label}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                        r.type === 'booked' ? 'bg-blue-200 text-blue-700' : 'bg-red-200 text-red-700'
                                    }`}>{r.type === 'booked' ? 'Booked' : 'Blocked'}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {blockedRanges.length === 0 && (
                        <div className="text-center py-8 mt-4 bg-emerald-50 rounded-xl">
                            <p className="text-emerald-600 font-medium text-sm">✅ All dates are currently available!</p>
                        </div>
                    )}

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                        <p className="text-sm text-amber-700">
                            <strong>Note:</strong> Blue dates are reserved by guests. Red dates are manually blocked by the operator.
                            Contact the operator to confirm availability for edge cases.
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
