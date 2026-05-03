'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';
import Link from 'next/link';

export default function Dashboard() {
    const { user, logout, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({ items: 0, borrowings: 0, cupboards: 0, places: 0 });

    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.push('/login'); return; }
        // Load stats silently in background — don't block page render
        fetchStats();
    }, [user, authLoading]);

    const fetchStats = async () => {
        try {
            // Fire all requests simultaneously but don't block UI
            const [items, borrowings, cupboards, places] = await Promise.all([
                api.get('/items'),
                api.get('/borrowings'),
                api.get('/cupboards'),
                api.get('/places'),
            ]);
            setStats({
                items: items.data.length,
                borrowings: borrowings.data.length,
                cupboards: cupboards.data.length,
                places: places.data.length,
            });
        } catch (err) {
            console.error(err);
        }
    };

    const navItems = [
        { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
        { label: 'Items', href: '/dashboard/items', icon: '📦' },
        { label: 'Borrowings', href: '/dashboard/borrowings', icon: '🤝' },
        { label: 'Storage', href: '/dashboard/storage', icon: '🗄️' },
        { label: 'Audit Logs', href: '/dashboard/audit-logs', icon: '📋' },
    ];

    const statCards = [
        { label: 'Total Items', value: stats.items, accent: '#6366f1', icon: '📦', href: '/dashboard/items' },
        { label: 'Borrowings', value: stats.borrowings, accent: '#f59e0b', icon: '🤝', href: '/dashboard/borrowings' },
        { label: 'Cupboards', value: stats.cupboards, accent: '#10b981', icon: '🗄️', href: '/dashboard/storage' },
        { label: 'Places', value: stats.places, accent: '#8b5cf6', icon: '📍', href: '/dashboard/storage' },
    ];

    const quickActions = [
        { label: 'Add New Item', href: '/dashboard/items', accent: '#6366f1', icon: '📦' },
        { label: 'Borrow Item', href: '/dashboard/borrowings', accent: '#f59e0b', icon: '🤝' },
        { label: 'Manage Storage', href: '/dashboard/storage', accent: '#10b981', icon: '🗄️' },
        { label: 'View Audit Logs', href: '/dashboard/audit-logs', accent: '#64748b', icon: '📋' },
    ];
    if (user?.role === 'admin') quickActions.push({ label: 'Manage Users', href: '/dashboard/users', accent: '#8b5cf6', icon: '👥' });

    // Show blank dark screen while auth loads — no spinner, no flash
    if (authLoading) {
        return <div style={{ minHeight: '100vh', background: '#0d0f1a' }} />;
    }

    // If no user after auth check, show nothing (redirect will happen)
    if (!user) return null;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'DM Sans', sans-serif; }
                .page-root { display: flex; min-height: 100vh; background: #0d0f1a; }

                .sidebar {
                    width: 210px; min-height: 100vh; position: fixed; top: 0; left: 0; z-index: 100;
                    background: linear-gradient(180deg, #0d0f1a 0%, #111827 100%);
                    border-right: 1px solid rgba(255,255,255,0.06);
                    padding: 20px 12px; display: flex; flex-direction: column;
                }
                .sidebar-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; padding: 0 6px; }
                .logo-icon {
                    width: 38px; height: 38px; border-radius: 12px;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 18px; box-shadow: 0 4px 16px rgba(99,102,241,0.4); flex-shrink: 0;
                }
                .logo-text { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 14px; color: #f1f5f9; line-height: 1.2; }
                .logo-sub { font-size: 10px; color: #475569; }

                .user-chip {
                    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 12px; padding: 10px 12px; margin-bottom: 24px;
                    display: flex; align-items: center; gap: 10px;
                }
                .user-avatar {
                    width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
                    background: linear-gradient(135deg, #f093fb, #f5576c);
                    display: flex; align-items: center; justify-content: center;
                    color: white; font-weight: 800; font-size: 14px;
                }
                .user-name { font-size: 13px; font-weight: 600; color: #e2e8f0; }
                .user-role-badge {
                    font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 20px;
                    background: rgba(99,102,241,0.2); color: #a5b4fc;
                    border: 1px solid rgba(99,102,241,0.3); display: inline-block;
                    text-transform: uppercase; letter-spacing: 0.5px; margin-top: 3px;
                }

                .nav-section-label {
                    font-size: 9px; font-weight: 700; color: #334155;
                    text-transform: uppercase; letter-spacing: 1px;
                    margin: 0 0 6px 8px;
                }
                .nav-link {
                    display: flex; align-items: center; gap: 9px;
                    padding: 9px 10px; border-radius: 10px; margin-bottom: 2px;
                    text-decoration: none; transition: all 0.15s;
                    border: 1px solid transparent;
                }
                .nav-link:hover { background: rgba(255,255,255,0.05); }
                .nav-link.active { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.2); }
                .nav-icon-wrap {
                    width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
                    display: flex; align-items: center; justify-content: center; font-size: 15px;
                }
                .nav-label { font-size: 13px; font-weight: 500; color: #64748b; }
                .nav-link.active .nav-label { color: #e2e8f0; font-weight: 600; }
                .nav-link:hover .nav-label { color: #94a3b8; }
                .nav-spacer { flex: 1; }

                .logout-btn {
                    display: flex; align-items: center; gap: 9px; padding: 9px 10px;
                    border-radius: 10px; width: 100%;
                    background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15);
                    cursor: pointer; transition: all 0.2s;
                }
                .logout-btn:hover { background: rgba(239,68,68,0.15); }
                .logout-icon { width: 30px; height: 30px; border-radius: 8px; background: rgba(239,68,68,0.12); display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
                .logout-label { color: #fca5a5; font-size: 13px; font-weight: 500; font-family: 'DM Sans', sans-serif; }

                .main-content { margin-left: 210px; flex: 1; padding: 36px 40px; }
                .page-header { margin-bottom: 32px; }
                .page-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #f1f5f9; margin: 0 0 4px; }
                .page-sub { color: #475569; font-size: 14px; margin: 0; }

                .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
                .stat-card {
                    border-radius: 16px; padding: 22px;
                    border: 1px solid rgba(255,255,255,0.06);
                    background: rgba(255,255,255,0.02);
                    position: relative; overflow: hidden; transition: transform 0.2s;
                    text-decoration: none; display: block; cursor: pointer;
                }
                .stat-card:hover { transform: translateY(-2px); }
                .stat-glow { position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; border-radius: 50%; filter: blur(30px); opacity: 0.28; }
                .stat-icon { font-size: 20px; margin-bottom: 14px; }
                .stat-value { font-family: 'Syne', sans-serif; font-size: 38px; font-weight: 800; line-height: 1; margin-bottom: 6px; }
                .stat-label { font-size: 12px; color: #64748b; font-weight: 500; }

                .panel { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 22px; }
                .panel-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #f1f5f9; margin-bottom: 14px; }
                .actions-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
                .action-card {
                    display: flex; align-items: center; gap: 10px;
                    padding: 14px 16px; border-radius: 10px;
                    text-decoration: none; font-size: 13px; font-weight: 500;
                    border: 1px solid rgba(255,255,255,0.06);
                    background: rgba(255,255,255,0.02);
                    color: #94a3b8; transition: all 0.2s;
                }
                .action-card:hover { background: rgba(255,255,255,0.05); color: #e2e8f0; transform: translateY(-1px); }

                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                .fade-in { animation: fadeIn 0.3s ease forwards; }
                @keyframes countUp { from { opacity: 0.3; } to { opacity: 1; } }
                .count-anim { animation: countUp 0.5s ease forwards; }
            `}</style>

            <div className="page-root">
                <aside className="sidebar">
                    <div className="sidebar-logo">
                        <div className="logo-icon">📦</div>
                        <div>
                            <div className="logo-text">Inventory</div>
                            <div className="logo-sub">Management System</div>
                        </div>
                    </div>

                    <div className="user-chip">
                        <div className="user-avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
                        <div>
                            <div className="user-name">{user?.name}</div>
                            <span className="user-role-badge">{user?.role}</span>
                        </div>
                    </div>

                    <div className="nav-section-label">Main Menu</div>
                    {navItems.map(item => (
                        <Link key={item.href} href={item.href} className={`nav-link${item.href === '/dashboard' ? ' active' : ''}`}>
                            <div className="nav-icon-wrap" style={{ background: item.href === '/dashboard' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)' }}>
                                {item.icon}
                            </div>
                            <span className="nav-label">{item.label}</span>
                        </Link>
                    ))}

                    {user?.role === 'admin' && (
                        <>
                            <div className="nav-section-label" style={{ marginTop: '14px' }}>Admin</div>
                            <Link href="/dashboard/users" className="nav-link">
                                <div className="nav-icon-wrap" style={{ background: 'rgba(255,255,255,0.05)' }}>👥</div>
                                <span className="nav-label">Users</span>
                            </Link>
                        </>
                    )}

                    <div className="nav-spacer" />

                    <button className="logout-btn" onClick={logout}>
                        <div className="logout-icon">🚪</div>
                        <span className="logout-label">Logout</span>
                    </button>
                </aside>

                <main className="main-content fade-in">
                    <div className="page-header">
                        <h1 className="page-title">Dashboard</h1>
                        <p className="page-sub">Welcome back, {user?.name}. Here's what's happening.</p>
                    </div>

                    {/* Stats load in background — page shows immediately with 0s then updates */}
                    <div className="stats-grid">
                        {statCards.map(card => (
                            <Link key={card.label} href={card.href} className="stat-card" style={{ borderColor: `${card.accent}22` }}>
                                <div className="stat-glow" style={{ background: card.accent }} />
                                <div className="stat-icon">{card.icon}</div>
                                <div className="stat-value count-anim" style={{ color: card.accent }}>{card.value}</div>
                                <div className="stat-label">{card.label}</div>
                            </Link>
                        ))}
                    </div>

                    <div className="panel">
                        <div className="panel-title">Quick Actions</div>
                        <div className="actions-grid">
                            {quickActions.map(btn => (
                                <Link key={btn.href} href={btn.href} className="action-card">
                                    <span style={{ fontSize: '16px', color: btn.accent }}>{btn.icon}</span>
                                    {btn.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
