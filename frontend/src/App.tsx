import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/RoleContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';

// Admin
import ListingDashboard from './pages/ListingDashboard';
import ListingDetail from './pages/ListingDetail';

// Middleman
import MiddlemanDashboard from './pages/MiddlemanDashboard';
import MiddlemanListingDetail from './pages/MiddlemanListingDetail';

// Customer
import CustomerListings from './pages/CustomerListings';
import CustomerListingDetail from './pages/CustomerListingDetail';

function AppRoutes() {
    const { user, isLoggedIn } = useAuth();

    if (!isLoggedIn) {
        return (
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    return (
        <Routes>
            <Route path="/" element={<AppLayout />}>
                {/* Admin Routes */}
                <Route path="admin" element={<ListingDashboard />} />
                <Route path="admin/listing/:id" element={<ListingDetail />} />

                {/* Middleman Routes */}
                <Route path="middleman" element={<MiddlemanDashboard />} />
                <Route path="middleman/listing/:id" element={<MiddlemanListingDetail />} />

                {/* Customer Routes */}
                <Route path="customer" element={<CustomerListings />} />
                <Route path="customer/listing/:id" element={<CustomerListingDetail />} />

                {/* Default redirect based on role */}
                <Route path="/" element={
                    <Navigate to={
                        user?.role === 'ADMIN' ? '/admin' :
                        user?.role === 'MIDDLEMAN' ? '/middleman' : '/customer'
                    } replace />
                } />
                <Route path="*" element={
                    <Navigate to={
                        user?.role === 'ADMIN' ? '/admin' :
                        user?.role === 'MIDDLEMAN' ? '/middleman' : '/customer'
                    } replace />
                } />
            </Route>
            <Route path="/login" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
