import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

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
    extendSession: () => void;
    isLoggedIn: boolean;
    sessionExpiresAt: number | null; // Unix ms timestamp
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    login: () => {},
    logout: () => {},
    extendSession: () => {},
    isLoggedIn: false,
    sessionExpiresAt: null,
});

const USER_KEY    = 'rentalops_user';
const TOKEN_KEY   = 'rentalops_token';
const EXPIRY_KEY  = 'rentalops_expiry';

// ─── Session config ─────────────────────────────────────────────────────────
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000;  // 2 hours
const WARN_BEFORE_MS      = 5 * 60 * 1000;        // warn 5 min before expiry

function readExpiry(): number | null {
    try {
        const v = localStorage.getItem(EXPIRY_KEY);
        return v ? parseInt(v, 10) : null;
    } catch { return null; }
}

function clearStorage() {
    try {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EXPIRY_KEY);
    } catch {}
}

function isSessionAlive(expiry: number | null): boolean {
    return expiry !== null && Date.now() < expiry;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const expiry = readExpiry();
            if (!isSessionAlive(expiry)) { clearStorage(); return null; }
            const saved = localStorage.getItem(USER_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });

    const [token, setToken] = useState<string | null>(() => {
        try {
            const expiry = readExpiry();
            if (!isSessionAlive(expiry)) return null;
            return localStorage.getItem(TOKEN_KEY);
        } catch { return null; }
    });

    const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(() => {
        const expiry = readExpiry();
        return isSessionAlive(expiry) ? expiry : null;
    });

    // ── logout ──────────────────────────────────────────────────────────────
    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        setSessionExpiresAt(null);
        clearStorage();
    }, []);

    // ── login ───────────────────────────────────────────────────────────────
    const login = (userData: User) => {
        const { token: userToken, ...userWithoutToken } = userData;
        const expiry = Date.now() + SESSION_DURATION_MS;
        setUser(userWithoutToken);
        setToken(userToken || null);
        setSessionExpiresAt(expiry);
        try {
            localStorage.setItem(USER_KEY, JSON.stringify(userWithoutToken));
            if (userToken) localStorage.setItem(TOKEN_KEY, userToken);
            localStorage.setItem(EXPIRY_KEY, expiry.toString());
        } catch {}
    };

    // ── extendSession — reset the 2-hour clock ───────────────────────────────
    const extendSession = useCallback(() => {
        if (!user) return;
        const expiry = Date.now() + SESSION_DURATION_MS;
        setSessionExpiresAt(expiry);
        try { localStorage.setItem(EXPIRY_KEY, expiry.toString()); } catch {}
    }, [user]);

    // ── Auto-logout timer ────────────────────────────────────────────────────
    useEffect(() => {
        if (!sessionExpiresAt) return;
        const remaining = sessionExpiresAt - Date.now();
        if (remaining <= 0) { logout(); return; }
        const timer = setTimeout(() => logout(), remaining);
        return () => clearTimeout(timer);
    }, [sessionExpiresAt, logout]);

    // ── Guard: also check expiry on every window focus ───────────────────────
    useEffect(() => {
        const onFocus = () => {
            const expiry = readExpiry();
            if (user && !isSessionAlive(expiry)) logout();
        };
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [user, logout]);

    return (
        <AuthContext.Provider value={{ user, token, login, logout, extendSession, isLoggedIn: !!user, sessionExpiresAt }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
export { WARN_BEFORE_MS };
