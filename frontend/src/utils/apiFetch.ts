/**
 * apiFetch — A drop-in replacement for `fetch()` that automatically:
 *  1. Attaches the JWT Authorization header from localStorage
 *  2. Sets Content-Type: application/json by default
 *  3. On 401 Unauthorized: clears the session and redirects to login
 *
 * Usage:
 *   import { apiFetch } from '../utils/apiFetch';
 *   const res = await apiFetch('/api/auth/users');
 */
const TOKEN_KEY = 'rentalops_token';
const USER_KEY = 'rentalops_user';
const EXPIRY_KEY = 'rentalops_expiry';

function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    // Redirect to login — force a full page reload to reset React state
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem(TOKEN_KEY);

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

    // Auto-logout on 401 (token expired or invalid)
    if (response.status === 401) {
        clearSession();
    }

    return response;
}
