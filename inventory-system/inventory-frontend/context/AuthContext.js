'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/axios';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // CRITICAL: start as TRUE
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('token');
                const savedUser = localStorage.getItem('user');

                if (!token || !savedUser) {
                    // No token at all — not logged in
                    setLoading(false);
                    return;
                }

                // Token exists in localStorage — verify it's still valid with backend
                try {
                    const res = await api.get('/user');
                    // Backend confirmed token is valid — use fresh user data
                    setUser(res.data);
                    localStorage.setItem('user', JSON.stringify(res.data));
                } catch (err) {
                    if (err.response?.status === 401) {
                        // Token expired or invalid — clear everything
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setUser(null);
                    } else {
                        // Network error — fall back to cached user so app still works offline
                        setUser(JSON.parse(savedUser));
                    }
                }
            } catch (e) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            } finally {
                setLoading(false); // Only set false AFTER check is done
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
