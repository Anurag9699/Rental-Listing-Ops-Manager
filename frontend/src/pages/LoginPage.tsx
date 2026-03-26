import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/RoleContext';
import { API_BASE_URL } from '../utils/apiConfig';

export default function LoginPage() {
    const [isRegister, setIsRegister] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CUSTOMER' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = isRegister ? '/auth/register' : '/auth/login';
            const body = isRegister ? form : { email: form.email, password: form.password };

            const res = await fetch(`${API_BASE_URL.BACKEND}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Something went wrong');

            login(data);

            // Route based on role
            if (data.role === 'ADMIN') navigate('/admin');
            else if (data.role === 'MIDDLEMAN') navigate('/middleman');
            else navigate('/customer');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                        Rental<span className="text-blue-400">Ops</span>
                    </h1>
                    <p className="text-blue-200 mt-2 text-sm">Operational Management System</p>
                </div>

                {/* Card */}
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-2xl font-semibold text-white mb-6">
                        {isRegister ? 'Create Account' : 'Welcome Back'}
                    </h2>

                    {error && (
                        <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isRegister && (
                            <div>
                                <label className="block text-blue-200 text-sm font-medium mb-1">Full Name</label>
                                <input
                                    type="text" required value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    placeholder="e.g. Rahul Sharma"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-blue-200 text-sm font-medium mb-1">Email</label>
                            <input
                                type="email" required value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-blue-200 text-sm font-medium mb-1">Password</label>
                            <input
                                type="password" required value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder="••••••••"
                            />
                        </div>

                        {isRegister && (
                            <div>
                                <label className="block text-blue-200 text-sm font-medium mb-1">Role</label>
                                <select
                                    value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                                    className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                >
                                    <option value="CUSTOMER" className="bg-slate-800">Customer</option>
                                    <option value="MIDDLEMAN" className="bg-slate-800">Rental Lister (Middleman)</option>
                                    <option value="ADMIN" className="bg-slate-800">Admin</option>
                                </select>
                            </div>
                        )}

                        <button
                            type="submit" disabled={loading}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
                        >
                            {loading ? 'Processing...' : (isRegister ? 'Create Account' : 'Sign In')}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => { setIsRegister(!isRegister); setError(''); }}
                            className="text-blue-300 hover:text-white text-sm transition-colors"
                        >
                            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
                        </button>
                    </div>

                    {/* Quick Login Buttons */}
                    {!isRegister && (
                        <div className="mt-6 pt-6 border-t border-white/10">
                            <p className="text-xs text-blue-300 text-center mb-3">Quick Demo Login</p>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => setForm({ ...form, email: 'admin@rentalops.com', password: 'admin123' })}
                                    className="bg-red-500/20 hover:bg-red-500/40 text-red-200 text-xs py-2 rounded-lg transition-colors border border-red-400/30">
                                    Admin
                                </button>
                                <button onClick={() => setForm({ ...form, email: 'rahul@rentalops.com', password: 'rahul123' })}
                                    className="bg-amber-500/20 hover:bg-amber-500/40 text-amber-200 text-xs py-2 rounded-lg transition-colors border border-amber-400/30">
                                    Middleman
                                </button>
                                <button onClick={() => setForm({ ...form, email: 'alex@gmail.com', password: 'alex123' })}
                                    className="bg-green-500/20 hover:bg-green-500/40 text-green-200 text-xs py-2 rounded-lg transition-colors border border-green-400/30">
                                    Customer
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
