'use client';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children, adminOnly = false }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return; // Wait until auth check is complete
        if (!user) {
            router.push('/login');
            return;
        }
        if (adminOnly && user.role !== 'admin') {
            router.push('/dashboard');
        }
    }, [user, loading, adminOnly]);

    // Show loading spinner while checking auth - NEVER redirect prematurely
    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0d0f1a',
                fontFamily: 'sans-serif',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        border: '3px solid rgba(99,102,241,0.2)',
                        borderTop: '3px solid #6366f1',
                        animation: 'spin 0.8s linear infinite',
                        margin: '0 auto 16px',
                    }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render children if not authenticated
    if (!user) return null;
    if (adminOnly && user.role !== 'admin') return null;

    return children;
}
