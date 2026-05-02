'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Home() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return; // Wait for auth check
        if (user) {
            router.push('/dashboard');
        } else {
            router.push('/login');
        }
    }, [user, loading]);

    // Show spinner while checking
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0d0f1a',
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
                <p style={{ color: '#475569', fontSize: '14px', fontFamily: 'sans-serif' }}>Loading...</p>
            </div>
        </div>
    );
}
