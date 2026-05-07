'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/axios';
import { useRouter } from 'next/navigation';
 
const AuthContext = createContext(null);
 
export function AuthProvider({ children }) {
    const router = useRouter();
 
    // ── Load cached user INSTANTLY — no waiting for API ──
    const [user, setUser] = useState(() => {
        if (typeof window !== 'undefined') {
            try {
                const savedUser = localStorage.getItem('user');
                return savedUser ? JSON.parse(savedUser) : null;
            } catch { return null; }
        }
        return null;
    });
 
    // ── loading is false immediately if we have cached user ──
    const [loading, setLoading] = useState(() => {
        if (typeof window !== 'undefined') {
            return !localStorage.getItem('token'); // only loading if no token
        }
        return true;
    });
 
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            const savedUser = localStorage.getItem('user');
 
            if (!token || !savedUser) {
                setUser(null);
                setLoading(false);
                return;
            }
 
            // Already set user from cache above — don't block UI
            setLoading(false);
 
            try {
                const res = await api.get('/me');
                setUser(res.data);
                localStorage.setItem('user', JSON.stringify(res.data));
            } catch (err) {
                if (err.response?.status === 401) {
                    // Token expired — clear everything and redirect
                    clearAllCache();
                    setUser(null);
                    router.push('/login');
                }
                // Network error — keep using cached user (offline support)
            }
        };
 
        checkAuth();
    }, []);
 
    // ✅ Helper to clear ALL cached data
    const clearAllCache = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('cache_dashboard_stats'); // dashboard stats cache
        localStorage.removeItem('cache_items');           // items cache (if any)
        localStorage.removeItem('cache_borrowings');      // borrowings cache (if any)
    };
 
    const login = async (email, password) => {
        const res = await api.post('/login', { email, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        router.push('/dashboard');
    };
 
    const logout = async () => {
        try { await api.post('/logout'); } catch {}
        clearAllCache(); // ✅ clears ALL cache including dashboard stats
        setUser(null);
        router.push('/login');
    };
 
    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
 
export const useAuth = () => useContext(AuthContext);
 