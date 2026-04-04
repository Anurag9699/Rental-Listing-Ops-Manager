import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/RoleContext';
import { API_BASE_URL } from '../utils/apiConfig';
import { Plus, Eye, Clock, Send, ImageIcon, X } from 'lucide-react';

export default function MiddlemanDashboard() {
    const { user } = useAuth();
    const [listings, setListings] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'listings' | 'bookings'>('listings');

    // Create listing form
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ 
        title: '', 
        description: '', 
        category: 'URBAN',
        address: '',
        city: '',
        latitude: '',
        longitude: ''
    });
    const [imageUrls, setImageUrls] = useState<string[]>(['']);
    const [creating, setCreating] = useState(false);
    const [isLocatingProperty, setIsLocatingProperty] = useState(false);

    useEffect(() => {
        fetchListings();
    }, []);

    const fetchListings = async () => {
        try {
            const res = await fetch(`${API_BASE_URL.BACKEND}/listings?role=MIDDLEMAN&ownerId=${user?.id}`);
            const data = await res.json();
            setListings(data);

            // Fetch bookings for all listings
            const allBookings: any[] = [];
            for (const listing of data) {
                try {
                    const bRes = await fetch(`${API_BASE_URL.BACKEND}/bookings/${listing.id}`);
                    const bData = await bRes.json();
                    allBookings.push(...bData.map((b: any) => ({ ...b, listingTitle: listing.title })));
                } catch (e) {}
            }
            setBookings(allBookings);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const validImageUrls = imageUrls.filter(url => url.trim() !== '');
            const res = await fetch(`${API_BASE_URL.BACKEND}/listings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    ...form, 
                    ownerId: user?.id, 
                    imageUrls: validImageUrls,
                    latitude: form.latitude ? parseFloat(form.latitude) : null,
                    longitude: form.longitude ? parseFloat(form.longitude) : null
                }),
            });
            if (res.ok) {
                setShowCreate(false);
                setForm({ title: '', description: '', category: 'URBAN', address: '', city: '', latitude: '', longitude: '' });
                setImageUrls(['']);
                fetchListings();
            }
        } catch (e) {} finally { setCreating(false); }
    };

    const handleAutoLocateProperty = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }
        setIsLocatingProperty(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setForm(f => ({
                    ...f,
                    latitude: pos.coords.latitude.toFixed(6),
                    longitude: pos.coords.longitude.toFixed(6)
                }));
                setIsLocatingProperty(false);
            },
            () => {
                alert('Could not get location. Please check your browser permissions.');
                setIsLocatingProperty(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const submitForApproval = async (listingId: string) => {
        try {
            await fetch(`${API_BASE_URL.BACKEND}/listings/${listingId}/state`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'PENDING_APPROVAL', role: 'MIDDLEMAN' }),
            });
            fetchListings();
        } catch (e) {}
    };



    const statusColor: Record<string, string> = {
        DRAFT: 'bg-gray-100 text-gray-700',
        PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
        ACTIVE: 'bg-green-100 text-green-700',
        PAUSED: 'bg-blue-100 text-blue-700',
        REJECTED: 'bg-red-100 text-red-700',
        DISABLED: 'bg-slate-200 text-slate-500',
    };

    const recentBookings = bookings.filter(b => b.status === 'CONFIRMED');

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">My Listings</h1>
                    <p className="text-slate-500 text-sm">Manage your rental properties</p>
                </div>
                <button onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20">
                    <Plus className="w-4 h-4" /> Create Listing
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
                <button onClick={() => setActiveTab('listings')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'listings' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    My Properties ({listings.length})
                </button>
                <button onClick={() => setActiveTab('bookings')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'bookings' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    Confirmed Bookings {recentBookings.length > 0 && <span className="ml-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">{recentBookings.length}</span>}
                </button>
            </div>

            {/* Listings Tab */}
            {activeTab === 'listings' && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Title</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Category</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {listings.map(listing => (
                                <tr key={listing.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-800">{listing.title}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{listing.category}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[listing.status]}`}>{listing.status}</span>
                                    </td>
                                    <td className="px-6 py-4 space-x-2">
                                        <Link to={`/middleman/listing/${listing.id}`}
                                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium">
                                            <Eye className="w-3.5 h-3.5" /> View
                                        </Link>
                                        {listing.status === 'DRAFT' && (
                                            <button onClick={() => submitForApproval(listing.id)}
                                                className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-800 text-sm font-medium ml-2">
                                                <Send className="w-3.5 h-3.5" /> Submit for Approval
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {listings.length === 0 && (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">No listings yet. Create your first property!</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
                <div className="space-y-3">
                    {bookings.length === 0 && <p className="text-slate-400 text-center py-12">No bookings yet.</p>}
                    {bookings.map(booking => (
                        <div key={booking.id} className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
                            <div>
                                <p className="font-medium text-slate-800">{booking.listingTitle || booking.listingId}</p>
                                <p className="text-sm text-slate-500 mt-1">
                                    {new Date(booking.startDate).toLocaleDateString()} — {new Date(booking.endDate).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Booked on {new Date(booking.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                                    booking.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                }`}>{booking.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Create New Listing</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Listing Title *</label>
                                <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="e.g. Modern Downtown Loft - Unit 402" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-24"
                                    placeholder="Describe the property..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                                    <option value="URBAN">Urban</option>
                                    <option value="LUXURY">Luxury</option>
                                    <option value="WATERFRONT">Waterfront</option>
                                    <option value="ECONOMY">Economy</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                                    <input type="text" required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        placeholder="e.g. Mumbai" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                    <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        placeholder="Full address..." />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">📍 Property GPS Location</label>
                                {form.latitude && form.longitude ? (
                                    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                                        <span className="text-green-700 text-sm flex-1">
                                            ✅ Location captured: <strong>{form.latitude}</strong>, <strong>{form.longitude}</strong>
                                        </span>
                                        <button type="button"
                                            onClick={() => setForm({ ...form, latitude: '', longitude: '' })}
                                            className="text-xs text-red-500 hover:text-red-700 font-medium underline">
                                            Clear
                                        </button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={handleAutoLocateProperty} disabled={isLocatingProperty}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 hover:border-blue-500 transition-all font-medium disabled:opacity-50">
                                        {isLocatingProperty
                                            ? <><div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" /> Detecting location...</>
                                            : <>📍 Auto-Locate Property (Use GPS)</>}
                                    </button>
                                )}
                                <p className="text-xs text-slate-400 mt-1.5">Click the button while at the property to auto-capture GPS coordinates.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    <span className="flex items-center gap-1.5"><ImageIcon className="w-4 h-4" /> Property Photos (optional)</span>
                                </label>
                                <div className="space-y-2">
                                    {imageUrls.map((url, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                type="url"
                                                value={url}
                                                onChange={e => {
                                                    const updated = [...imageUrls];
                                                    updated[idx] = e.target.value;
                                                    setImageUrls(updated);
                                                }}
                                                placeholder={`Image URL ${idx + 1} (e.g. https://...)`}
                                                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            {imageUrls.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== idx))}
                                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {imageUrls.length < 5 && (
                                        <button
                                            type="button"
                                            onClick={() => setImageUrls([...imageUrls, ''])}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Add another photo
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Paste direct image links (Unsplash, Imgur, etc.) — up to 5 photos.</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                                ℹ️ Listing starts in <strong>Draft</strong> state. Submit for Admin approval to go live.
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={creating}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50">
                                    {creating ? 'Saving...' : 'Save Listing'}
                                </button>
                                <button type="button" onClick={() => setShowCreate(false)}
                                    className="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
