import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../utils/apiConfig';
import { MapPin, Search } from 'lucide-react';

export default function CustomerListings() {
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');

    useEffect(() => {
        fetchListings();
    }, []);

    const fetchListings = async () => {
        try {
            const res = await fetch(`${API_BASE_URL.BACKEND}/listings?role=CUSTOMER`);
            const data = await res.json();
            setListings(data);
        } catch (e) {} finally { setLoading(false); }
    };

    const filtered = listings.filter(l => {
        const matchesSearch = l.title.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = filterCategory === 'ALL' || l.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const categoryIcons: Record<string, string> = {
        LUXURY: '🏰', ECONOMY: '🏠', WATERFRONT: '🌊', URBAN: '🏙️'
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

    return (
        <div className="space-y-6">
            {/* Hero */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
                <h1 className="text-3xl font-bold">Find Your Perfect Rental</h1>
                <p className="text-blue-100 mt-2">Browse verified properties with real-time availability</p>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search listings by title..."
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
                </div>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                    className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="ALL">All Categories</option>
                    <option value="LUXURY">🏰 Luxury</option>
                    <option value="ECONOMY">🏠 Economy</option>
                    <option value="WATERFRONT">🌊 Waterfront</option>
                    <option value="URBAN">🏙️ Urban</option>
                </select>
            </div>

            {/* Results */}
            <p className="text-sm text-slate-500">Showing {filtered.length} {filtered.length === 1 ? 'property' : 'properties'}</p>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(listing => (
                    <Link key={listing.id} to={`/customer/listing/${listing.id}`}
                        className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        {/* Image placeholder */}
                        <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative">
                            <span className="text-5xl">{categoryIcons[listing.category] || '🏠'}</span>
                            <span className="absolute top-3 left-3 bg-green-500 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                                ✓ Verified
                            </span>
                            <span className="absolute top-3 right-3 bg-white/90 text-slate-700 text-xs px-2.5 py-1 rounded-full font-medium">
                                {listing.category}
                            </span>
                        </div>
                        <div className="p-5">
                            <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors">{listing.title}</h3>
                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" /> Available for booking
                            </p>
                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-blue-600 font-semibold text-sm">View Details →</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-16">
                    <p className="text-slate-400 text-lg">No properties found matching your search.</p>
                </div>
            )}
        </div>
    );
}
