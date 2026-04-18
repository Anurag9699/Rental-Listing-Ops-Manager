import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'MIDDLEMAN' | 'CUSTOMER';
    token?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (user: User) => void;
    logout: () => void;
    isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    login: () => {},
    logout: () => {},
    isLoggedIn: false,
});

const USER_KEY = 'rentalops_user';
const TOKEN_KEY = 'rentalops_token';
const EXPIRY_KEY = 'rentalops_expiry';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const expiry = localStorage.getItem(EXPIRY_KEY);
            if (expiry && Date.now() > parseInt(expiry, 10)) {
                // Session has expired — clear storage
                localStorage.removeItem(USER_KEY);
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(EXPIRY_KEY);
                return null;
            }
            const saved = localStorage.getItem(USER_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    const [token, setToken] = useState<string | null>(() => {
        try {
            const expiry = localStorage.getItem(EXPIRY_KEY);
            if (expiry && Date.now() > parseInt(expiry, 10)) return null;
            return localStorage.getItem(TOKEN_KEY);
        } catch {
            return null;
        }
    });

    // Auto-logout when session expires while the tab is open
    useEffect(() => {
        const expiryStr = localStorage.getItem(EXPIRY_KEY);
        if (!expiryStr) return;
        const remaining = parseInt(expiryStr, 10) - Date.now();
        if (remaining <= 0) {
            logout();
            return;
        }
        const timer = setTimeout(() => logout(), remaining);
        return () => clearTimeout(timer);
    }, [user]);

    const login = (userData: User) => {
        const { token: userToken, ...userWithoutToken } = userData;
        setUser(userWithoutToken);
        setToken(userToken || null);
        const expiry = Date.now() + SESSION_DURATION_MS;
        try {
            localStorage.setItem(USER_KEY, JSON.stringify(userWithoutToken));
            if (userToken) localStorage.setItem(TOKEN_KEY, userToken);
            localStorage.setItem(EXPIRY_KEY, expiry.toString());
        } catch { /* storage might be unavailable in some browsers */ }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        try {
            localStorage.removeItem(USER_KEY);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(EXPIRY_KEY);
        } catch {}
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoggedIn: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
