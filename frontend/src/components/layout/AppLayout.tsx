import { Outlet, Link } from 'react-router-dom';
import { Home, PlusSquare } from 'lucide-react';

export default function AppLayout() {
    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/" className="flex items-center space-x-2">
                            <span className="font-bold text-xl text-primary-600">RentalOps</span>
                        </Link>

                        <nav className="flex items-center space-x-4">
                            <Link
                                to="/"
                                className="flex items-center space-x-1 text-slate-600 hover:text-primary-600 font-medium transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                <span>Dashboard</span>
                            </Link>
                            <Link
                                to="/create"
                                className="flex items-center space-x-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
                            >
                                <PlusSquare className="w-4 h-4" />
                                <span>New Listing</span>
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
}
