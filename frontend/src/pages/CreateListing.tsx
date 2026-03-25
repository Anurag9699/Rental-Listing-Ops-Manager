import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../utils/apiConfig';
import { ChevronLeft, Plus, Building2, Tag, Info } from 'lucide-react';

export default function CreateListing() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        title: '',
        category: 'URBAN',
        status: 'DRAFT'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL.BACKEND}/listings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                alert('Property Created Successfully!');
                navigate('/');
            } else {
                alert('Failed to create property');
            }
        } catch (err) {
            alert('Error connecting to backend');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-8">
            <div className="max-w-2xl mx-auto">
                <Link to="/" className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 font-medium transition mb-8">
                    <ChevronLeft size={20} /> Back to Dashboard
                </Link>

                <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200 border border-slate-100 relative overflow-hidden">
                    {/* Decorative Header Accent */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                    
                    <div className="mb-10">
                        <h1 className="text-3xl font-black text-slate-900 mb-2">Create New Listing</h1>
                        <p className="text-slate-400 font-medium italic">Onboard a new property to the management fleet.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Title Input */}
                        <div className="space-y-3">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Building2 size={14} className="text-indigo-500" />
                                Property Title
                            </label>
                            <input 
                                type="text" 
                                required
                                placeholder="e.g. Skyline Executive Penthouse"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all font-semibold text-slate-700 placeholder:text-slate-300"
                                value={form.title}
                                onChange={e => setForm({...form, title: e.target.value})}
                            />
                        </div>

                        {/* Category & Status Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Tag size={14} className="text-indigo-500" />
                                    Classification
                                </label>
                                <select 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all font-semibold text-slate-700 appearance-none cursor-pointer"
                                    value={form.category}
                                    onChange={e => setForm({...form, category: e.target.value})}
                                >
                                    <option value="URBAN">URBAN</option>
                                    <option value="LUXURY">LUXURY</option>
                                    <option value="WATERFRONT">WATERFRONT</option>
                                    <option value="ECONOMY">ECONOMY</option>
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Info size={14} className="text-indigo-500" />
                                    Initial Status
                                </label>
                                <select 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all font-semibold text-slate-700 appearance-none cursor-pointer"
                                    value={form.status}
                                    onChange={e => setForm({...form, status: e.target.value})}
                                >
                                    <option value="DRAFT">DRAFT (Internal)</option>
                                    <option value="ACTIVE">ACTIVE (Published)</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-lg hover:bg-indigo-600 transition-all duration-300 shadow-2xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : (
                                    <>
                                        <Plus size={24} />
                                        Launch Property
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
