import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../utils/apiConfig';
import { LayoutGrid, Plus, ArrowUpRight, ShieldCheck, Home } from 'lucide-react';

interface Listing {
    id: string;
    title: string;
    status: string;
    category: string;
    createdAt: string;
}

export default function ListingDashboard() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchListings = async () => {
            try {
                const res = await fetch(`${API_BASE_URL.BACKEND}/listings`);
                if (res.ok) {
                    const data = await res.json();
                    setListings(data);
                }
            } catch (err) {
                console.error('Failed to fetch listings:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchListings();
    }, []);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full shadow-lg"></div>
                <p className="text-slate-400 font-medium animate-pulse">Synchronizing Services...</p>
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            {/* Minimalist Top Nav Segment */}
            <div className="flex items-center justify-between mb-16">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2 flex items-center gap-3">
                        <LayoutGrid className="text-indigo-600" size={32} />
                        Property Hub
                    </h1>
                    <p className="text-slate-500 font-medium flex items-center gap-2">
                        <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        {listings.length} Active Listings across 3 repositories
                    </p>
                </div>
                <Link to="/create" className="group flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98]">
                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    New Property
                </Link>
            </div>

            {/* Premium Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {listings.length > 0 ? listings.map((item) => (
                    <Link 
                        key={item.id} 
                        to={`/listings/${item.id}`}
                        className="group relative bg-white rounded-[2rem] p-8 border border-slate-100 hover:border-indigo-200 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(79,70,229,0.1)] overflow-hidden"
                    >
                        {/* Background Decorative Accent */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[100px] -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 blur-2xl"></div>
                        
                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-6">
                                <div className="h-14 w-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                    <Home size={28} />
                                </div>
                                <div className="flex gap-2">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-indigo-50 text-indigo-600 shadow-sm`}>
                                        {item.category || 'URBAN'}
                                    </span>
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase ${
                                        item.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                    } shadow-sm`}>
                                        {item.status}
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors">
                                {item.title}
                            </h3>
                            
                            <div className="flex items-center gap-4 py-4 border-t border-slate-50 mt-4">
                                <div className="flex items-center gap-1.5 text-slate-400 text-sm font-medium">
                                    <ShieldCheck size={16} className="text-indigo-400/60" />
                                    Secure Logic
                                </div>
                                <div className="h-1 w-1 bg-slate-200 rounded-full"></div>
                                <div className="text-slate-400 text-sm font-medium">
                                    {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-8 right-8 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300">
                            <ArrowUpRight size={24} />
                        </div>
                    </Link>
                )) : (
                    <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50/30">
                        <div className="inline-flex items-center justify-center h-20 w-20 bg-white rounded-3xl shadow-sm mb-6">
                            <Plus className="text-slate-300" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-400 mb-2">No Properties Found</h2>
                        <p className="text-slate-400 max-w-xs mx-auto mb-8 font-medium italic">
                            Start by seeding your database or creating a new entry manually.
                        </p>
                        <Link to="/create" className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
                            Create First Listing
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
