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
                // No token — not logged in
                setUser(null);
                setLoading(false);
                return;
            }

            // ── We already set user from cache above ──
            // Now verify in background silently
            setLoading(false); // Don't block the UI

            try {
                const res = await api.get('/me');
                // Update with fresh data from server
                setUser(res.data);
                localStorage.setItem('user', JSON.stringify(res.data));
            } catch (err) {
                if (err.response?.status === 401) {
                    // Token truly expired — log out
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setUser(null);
                    router.push('/login');
                }
                // Network error — keep using cached user (offline support)
            }
        };

        checkAuth();
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/login', { email, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        router.push('/dashboard');
    };

    const logout = async () => {
        try { await api.post('/logout'); } catch {}
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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
