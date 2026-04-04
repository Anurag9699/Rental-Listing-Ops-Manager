import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../utils/apiConfig';
import { MapPin, Search } from 'lucide-react';
import ImageCarousel from '../components/ui/ImageCarousel';
export default function CustomerListings() {
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchCity, setSearchCity] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [isLocating, setIsLocating] = useState(false);

    useEffect(() => {
        fetchListings();
    }, [filterCategory]);

    const fetchListings = async (city?: string, coords?: { lat: number, lng: number }) => {
        setLoading(true);
        try {
            let url = `${API_BASE_URL.BACKEND}/listings?role=CUSTOMER`;
            if (city) url += `&city=${encodeURIComponent(city)}`;
            if (coords) url += `&lat=${coords.lat}&lng=${coords.lng}&radius=50`;
            
            const res = await fetch(url);
            const data = await res.json();
            setListings(data);
        } catch (e) {
            console.error("Fetch error:", e);
        } finally { setLoading(false); }
    };

    const handleNearMe = () => {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                fetchListings(undefined, { lat: latitude, lng: longitude });
                setIsLocating(false);
                setSearchCity('Near Me');
            },
            () => {
                alert("Could not get your location. Please check your browser permissions.");
                setIsLocating(false);
            }
        );
    };

    const handleCitySearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchListings(searchCity);
    };

    const filtered = listings.filter(l => {
        const matchesSearch = l.title.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = filterCategory === 'ALL' || l.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const categoryIcons: Record<string, string> = {
        LUXURY: '🏰', ECONOMY: '🏠', WATERFRONT: '🌊', URBAN: '🏙️'
    };

    if (loading && listings.length === 0) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

    return (
        <div className="space-y-6">
            {/* Hero */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
                <h1 className="text-3xl font-bold">Find Your Perfect Rental</h1>
                <p className="text-blue-100 mt-2">Browse verified properties with real-time availability</p>
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <form onSubmit={handleCitySearch} className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-[2]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Property title..."
                            className="w-full pl-10 pr-4 py-3 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 transition-all" />
                    </div>
                    
                    <div className="relative flex-[1.5]">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" value={searchCity} onChange={e => setSearchCity(e.target.value)}
                            placeholder="City name..."
                            className="w-full pl-10 pr-4 py-3 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 transition-all" />
                    </div>

                    <button type="button" onClick={handleNearMe} disabled={isLocating}
                        className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50 text-slate-600 font-medium">
                        {isLocating ? <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" /> : <MapPin className="w-4 h-4 text-blue-500" />}
                        Near Me
                    </button>

                    <button type="submit" 
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-200 active:scale-95">
                        Search
                    </button>
                    
                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                        className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-slate-700">
                        <option value="ALL">All Type</option>
                        <option value="LUXURY">🏰 Luxury</option>
                        <option value="ECONOMY">🏠 Economy</option>
                        <option value="WATERFRONT">🌊 Waterfront</option>
                        <option value="URBAN">🏙️ Urban</option>
                    </select>
                </form>
            </div>

            {/* Results */}
            <p className="text-sm text-slate-500">Showing {filtered.length} {filtered.length === 1 ? 'property' : 'properties'}</p>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(listing => (
                    <Link key={listing.id} to={`/customer/listing/${listing.id}`}
                        className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        {/* Image Carousel */}
                        <div className="relative h-56">
                            <ImageCarousel images={listing.imageUrls} className="w-full h-full" />
                            <span className="absolute top-3 left-3 bg-green-500 text-white text-xs px-2.5 py-1 rounded-full font-medium shadow-sm z-20">
                                ✓ Verified
                            </span>
                            <span className="absolute top-3 right-3 bg-white/90 text-slate-700 text-xs px-2.5 py-1 rounded-full font-medium shadow-sm z-20">
                                {categoryIcons[listing.category]} {listing.category}
                            </span>
                        </div>
                        <div className="p-5">
                            <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{listing.title}</h3>
                            <div className="mt-2 space-y-1.5">
                                <p className="text-sm text-slate-500 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-blue-500" /> 
                                    {listing.city || 'Available Location'}
                                    {listing.distance !== undefined && (
                                        <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md font-semibold ml-1">
                                            {listing.distance < 1 ? '<1 km' : `${Math.round(listing.distance)} km away`}
                                        </span>
                                    )}
                                </p>
                                <p className="text-xs text-slate-400 line-clamp-1 italic">{listing.address}</p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-blue-600 font-bold text-sm group-hover:translate-x-1 transition-transform">View Details →</span>
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
