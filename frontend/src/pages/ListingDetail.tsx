import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils/apiConfig';
import { ChevronLeft, CheckCircle, XCircle, Building2, Tag, Clock, Info, MapPin } from 'lucide-react';

interface Listing {
    id: string;
    title: string;
    description: string | null;
    status: string;
    category: string;
    createdAt: string;
    owner?: { id: string; name: string; email: string };
    imageUrls?: string[];
    city?: string | null;
    address?: string | null;
}

const STATUS_COLORS: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
    DRAFT: 'bg-slate-100 text-slate-600',
    REJECTED: 'bg-red-100 text-red-600',
    PAUSED: 'bg-blue-100 text-blue-600',
    DISABLED: 'bg-gray-100 text-gray-500',
};

const CATEGORY_COLORS: Record<string, string> = {
    LUXURY: 'bg-purple-100 text-purple-700',
    ECONOMY: 'bg-teal-100 text-teal-700',
    WATERFRONT: 'bg-cyan-100 text-cyan-700',
    URBAN: 'bg-indigo-100 text-indigo-700',
};

export default function ListingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [listing, setListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const fetchListing = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${API_BASE_URL.BACKEND}/listings/${id}`);
                if (res.ok) {
                    setListing(await res.json());
                } else {
                    setMessage({ type: 'error', text: 'Listing not found.' });
                }
            } catch {
                setMessage({ type: 'error', text: 'Failed to fetch listing details.' });
            } finally {
                setLoading(false);
            }
        };
        fetchListing();
    }, [id]);

    const handleStateChange = async (newStatus: 'ACTIVE' | 'REJECTED') => {
        setActionLoading(true);
        setMessage(null);
        try {
            const res = await fetch(`${API_BASE_URL.BACKEND}/listings/${id}/state`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, role: 'ADMIN' }),
            });
            const data = await res.json();
            if (res.ok) {
                setListing(prev => prev ? { ...prev, status: newStatus } : prev);
                setMessage({
                    type: 'success',
                    text: newStatus === 'ACTIVE'
                        ? '✅ Listing approved and is now ACTIVE.'
                        : '❌ Listing has been rejected.',
                });
            } else {
                setMessage({ type: 'error', text: data.error || 'Action failed.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Failed to perform action.' });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
    );

    if (!listing) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <Info size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500 text-lg">Listing not found.</p>
                <Link to="/admin" className="mt-4 inline-block text-indigo-600 hover:underline">← Back to Dashboard</Link>
            </div>
        </div>
    );

    const isPendingApproval = listing.status === 'PENDING_APPROVAL';

    return (
        <div className="max-w-3xl mx-auto px-6 py-10">
            {/* Back Link */}
            <Link to="/admin" className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 font-medium transition mb-8">
                <ChevronLeft size={20} /> Back to Dashboard
            </Link>

            {/* Listing Hero Images */}
            {listing.imageUrls && listing.imageUrls.length > 0 ? (
                <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px] rounded-2xl overflow-hidden mb-8">
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
                <div className="h-40 bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl flex items-center justify-center mb-8 border border-slate-200">
                    <span className="text-slate-400">No images provided</span>
                </div>
            )}

            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-6">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${CATEGORY_COLORS[listing.category] || 'bg-slate-100 text-slate-600'}`}>
                        {listing.category}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${STATUS_COLORS[listing.status] || 'bg-slate-100 text-slate-600'}`}>
                        {listing.status.replace('_', ' ')}
                    </span>
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-2">{listing.title}</h1>
                <p className="text-slate-500 text-sm">
                    {listing.description || 'No description provided for this listing.'}
                </p>
            </div>

            {/* Property Details */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-6">
                <h2 className="text-lg font-bold text-slate-800 mb-5">Property Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                            <Building2 size={18} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider mb-0.5">Category</p>
                            <p className="font-semibold text-slate-800">{listing.category}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                            <Tag size={18} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider mb-0.5">Status</p>
                            <p className="font-semibold text-slate-800">{listing.status.replace('_', ' ')}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                            <CheckCircle size={18} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider mb-0.5">Listed by</p>
                            <p className="font-semibold text-slate-800">{listing.owner?.name || 'Unknown'}</p>
                            <p className="text-xs text-slate-400">{listing.owner?.email}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                            <Clock size={18} className="text-slate-500" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider mb-0.5">Submitted</p>
                            <p className="font-semibold text-slate-800">
                                {new Date(listing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
                            <MapPin size={18} className="text-cyan-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider mb-0.5">Location</p>
                            <p className="font-semibold text-slate-800">{listing.city || 'Not specified'}</p>
                            <p className="text-xs text-slate-400">{listing.address || ''}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feedback Message */}
            {message && (
                <div className={`rounded-xl px-5 py-3 mb-6 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            {/* Admin Action Panel */}
            {isPendingApproval ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8">
                    <h2 className="text-lg font-bold text-amber-800 mb-2">⏳ Awaiting Your Decision</h2>
                    <p className="text-amber-700 text-sm mb-6">
                        This listing is pending your review. Once approved, it will become visible to all customers. Rejected listings will be returned to the Middleman.
                    </p>
                    <div className="flex gap-4">
                        <button
                            onClick={() => handleStateChange('ACTIVE')}
                            disabled={actionLoading}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition disabled:opacity-50"
                        >
                            <CheckCircle size={18} /> Approve Listing
                        </button>
                        <button
                            onClick={() => handleStateChange('REJECTED')}
                            disabled={actionLoading}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition disabled:opacity-50"
                        >
                            <XCircle size={18} /> Reject Listing
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-sm">
                    This listing has already been reviewed. Current status: <span className="font-bold text-slate-700">{listing.status.replace('_', ' ')}</span>.
                    <br />
                    <button onClick={() => navigate('/admin')} className="mt-4 inline-flex items-center gap-1 text-indigo-600 hover:underline font-medium">
                        <ChevronLeft size={16} /> Return to Dashboard
                    </button>
                </div>
            )}
        </div>
    );
}
