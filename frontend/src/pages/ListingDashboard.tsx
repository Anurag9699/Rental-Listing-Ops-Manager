import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../utils/apiConfig';
import { Eye, CheckCircle, XCircle, Search } from 'lucide-react';

export default function ListingDashboard() {
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [search, setSearch] = useState('');

    useEffect(() => { fetchListings(); }, []);

    const fetchListings = async () => {
        try {
            const res = await fetch(`${API_BASE_URL.BACKEND}/listings?role=ADMIN`);
            setListings(await res.json());
        } catch (e) {} finally { setLoading(false); }
    };

    const handleStateChange = async (listingId: string, newStatus: string) => {
        try {
            await fetch(`${API_BASE_URL.BACKEND}/listings/${listingId}/state`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, role: 'ADMIN' }),
            });
            fetchListings();
        } catch (e) {}
    };

    const filtered = listings.filter(l => {
        const matchesFilter = filter === 'ALL' || l.status === filter;
        const matchesSearch = l.title.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const statusColor: Record<string, string> = {
        DRAFT: 'bg-gray-100 text-gray-700', PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
        ACTIVE: 'bg-green-100 text-green-700', PAUSED: 'bg-blue-100 text-blue-700',
        REJECTED: 'bg-red-100 text-red-700', DISABLED: 'bg-slate-200 text-slate-500',
    };

    const pendingCount = listings.filter(l => l.status === 'PENDING_APPROVAL').length;

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Listing Management Dashboard</h1>
                <p className="text-slate-500 text-sm">Centralized hub for managing all property rental listings</p>
            </div>

            {/* Pending Approval Alert */}
            {pendingCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                    <span className="bg-amber-500 text-white text-sm px-3 py-1 rounded-full font-bold">{pendingCount}</span>
                    <p className="text-amber-800 font-medium">listings are awaiting your approval</p>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search listings by title or ID..."
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <select value={filter} onChange={e => setFilter(e.target.value)}
                    className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING_APPROVAL">⏳ Pending Approval</option>
                    <option value="ACTIVE">✅ Active</option>
                    <option value="DRAFT">📝 Draft</option>
                    <option value="PAUSED">⏸ Paused</option>
                    <option value="REJECTED">❌ Rejected</option>
                    <option value="DISABLED">🚫 Disabled</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Listing Title</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Owner</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Created</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map(listing => (
                            <tr key={listing.id} className={`hover:bg-slate-50 transition-colors ${listing.status === 'PENDING_APPROVAL' ? 'bg-amber-50/50' : ''}`}>
                                <td className="px-6 py-4">
                                    <p className="font-medium text-slate-800">{listing.title}</p>
                                    <p className="text-xs text-slate-400">#{listing.id?.substring(0, 8)}</p>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">{listing.owner?.name || listing.ownerId?.substring(0, 8) || '—'}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[listing.status]}`}>{listing.status}</span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">{new Date(listing.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Link to={`/admin/listing/${listing.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                                            <Eye className="w-3.5 h-3.5" /> View
                                        </Link>
                                        {listing.status === 'PENDING_APPROVAL' && (
                                            <>
                                                <button onClick={() => handleStateChange(listing.id, 'ACTIVE')}
                                                    className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center gap-1 ml-2">
                                                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                                                </button>
                                                <button onClick={() => handleStateChange(listing.id, 'REJECTED')}
                                                    className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1 ml-1">
                                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No listings match your filters.</td></tr>
                        )}
                    </tbody>
                </table>
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-sm text-slate-500">
                    Showing {filtered.length} of {listings.length} listings
                </div>
            </div>

            {/* Status Guide */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <h3 className="font-semibold text-blue-800 text-sm mb-2">ℹ️ Operational Status Guide</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-blue-700">
                    <span><strong>Draft:</strong> Initial setup by Middleman</span>
                    <span><strong>Pending:</strong> Awaiting Admin approval</span>
                    <span><strong>Active:</strong> Live and bookable</span>
                    <span><strong>Paused:</strong> Temporarily hidden</span>
                    <span><strong>Rejected:</strong> Sent back to Middleman</span>
                    <span><strong>Disabled:</strong> Permanently archived</span>
                </div>
            </div>
        </div>
    );
}
