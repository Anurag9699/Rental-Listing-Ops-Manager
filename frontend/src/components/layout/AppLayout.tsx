import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth, WARN_BEFORE_MS } from '../../contexts/RoleContext';
import { Home, LogOut, Search, Shield, Users, ShoppingBag, AlertTriangle } from 'lucide-react';

export default function AppLayout() {
    const { user, logout, sessionExpiresAt, extendSession } = useAuth();
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    useEffect(() => {
        if (!sessionExpiresAt) {
            setTimeLeft(null);
            return;
        }
        const interval = setInterval(() => {
            const remaining = sessionExpiresAt - Date.now();
            if (remaining <= 0) {
                setTimeLeft(0);
                clearInterval(interval);
            } else {
                setTimeLeft(Math.floor(remaining / 1000));
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [sessionExpiresAt]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isWarning = timeLeft !== null && timeLeft <= Math.floor(WARN_BEFORE_MS / 1000);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const roleConfig: Record<string, { label: string; color: string; icon: any; links: { to: string; label: string; icon: any }[] }> = {
        ADMIN: {
            label: 'Operations Manager',
            color: 'text-red-500',
            icon: Shield,
            links: [
                { to: '/admin', label: 'Dashboard', icon: Home },
            ]
        },
        MIDDLEMAN: {
            label: 'Rental Lister',
            color: 'text-amber-500',
            icon: Users,
            links: [
                { to: '/middleman', label: 'My Listings', icon: Home },
            ]
        },
        CUSTOMER: {
            label: 'Customer',
            color: 'text-green-500',
            icon: ShoppingBag,
            links: [
                { to: '/customer', label: 'Browse Listings', icon: Search },
            ]
        }
    };

    const config = roleConfig[user?.role || 'CUSTOMER'];
    const RoleIcon = config.icon;

    return (
        <div className="min-h-screen flex flex-col">
            {/* Session Expiry Warning Banner */}
            {isWarning && timeLeft > 0 && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 animate-pulse" />
                        <span className="font-medium text-sm">
                            Your session will expire in <span className="font-bold">{formatTime(timeLeft)}</span> due to inactivity.
                        </span>
                    </div>
                    <button 
                        onClick={() => extendSession()}
                        className="bg-white text-red-600 hover:bg-red-50 text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap shadow-sm"
                    >
                        Stay Logged In
                    </button>
                </div>
            )}

            <div className="flex flex-1">
                {/* Sidebar */}
            <aside className="w-56 bg-white border-r border-slate-200 flex flex-col fixed h-screen">
                {/* Brand */}
                <div className="p-5 border-b border-slate-200">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">R</span>
                        </div>
                        <span className="font-bold text-lg text-slate-800">RentalOps</span>
                    </Link>
                </div>

                {/* Role Badge */}
                <div className="px-5 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <RoleIcon className={`w-4 h-4 ${config.color}`} />
                        <span className={`text-xs font-semibold uppercase tracking-wider ${config.color}`}>
                            {config.label}
                        </span>
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 p-4 space-y-1">
                    {config.links.map(link => {
                        const Icon = link.icon;
                        return (
                            <Link key={link.to} to={link.to}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                <Icon className="w-4 h-4" />
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Info + Logout */}
                <div className="p-4 border-t border-slate-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-slate-600">{user?.name?.[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{user?.name}</p>
                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <LogOut className="w-4 h-4" /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 ml-56">
                {/* Top bar */}
                <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <RoleIcon className={`w-5 h-5 ${config.color}`} />
                        <span className="font-semibold text-slate-700">{config.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500">{user?.name}</span>
                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-semibold text-slate-600">{user?.name?.[0]}</span>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-8">
                    <Outlet />
                </main>
            </div>
            </div>
        </div>
    );
}
