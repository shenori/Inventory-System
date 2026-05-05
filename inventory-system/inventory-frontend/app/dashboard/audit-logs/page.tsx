'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../../lib/axios';
import Link from 'next/link';

export default function AuditLogsPage() {
    const { user, logout, loading: authLoading } = useAuth();
    const router = useRouter();

    // ✅ Load from cache instantly, update in background
    const [logs, setLogs] = useState(() => {
        if (typeof window !== 'undefined') {
            try {
                const cached = JSON.parse(localStorage.getItem('cache_logs') || '[]');
                // Handle both array and paginated {data: [...]} format
                return Array.isArray(cached) ? cached : (cached.data || []);
            }
            catch { return []; }
        }
        return [];
    });

    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.push('/login'); return; }
        fetchLogs();
    }, [user, authLoading]);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/audit-logs');
            const data = res.data.data || res.data;
            setLogs(data);
            localStorage.setItem('cache_logs', JSON.stringify(data)); // ✅ cache
        } catch (err) { console.error(err); }
    };

    const navItems = [
        { label: 'Dashboard',  href: '/dashboard',            icon: '🏠' },
        { label: 'Items',      href: '/dashboard/items',      icon: '📦' },
        { label: 'Borrowings', href: '/dashboard/borrowings', icon: '🤝' },
        { label: 'Storage',    href: '/dashboard/storage',    icon: '🗄️' },
        { label: 'Audit Logs', href: '/dashboard/audit-logs', icon: '📋' },
    ];

    const actionBadge = (action) => {
        if (action.includes('created'))  return { bg: 'rgba(16,185,129,0.12)',  color: '#34d399' };
        if (action.includes('updated') || action.includes('quantity')) return { bg: 'rgba(99,102,241,0.12)', color: '#818cf8' };
        if (action.includes('deleted'))  return { bg: 'rgba(239,68,68,0.12)',   color: '#f87171' };
        if (action.includes('borrowed')) return { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24' };
        if (action.includes('returned')) return { bg: 'rgba(139,92,246,0.12)',  color: '#a78bfa' };
        if (action.includes('login'))    return { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8' };
        return { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8' };
    };

    if (authLoading) return <div style={{ minHeight: '100vh', background: '#0d0f1a' }} />;
    if (!user) return null;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'DM Sans', sans-serif; }
                .page-root { display: flex; min-height: 100vh; background: #0d0f1a; }
                .sidebar { width: 210px; min-height: 100vh; position: fixed; top: 0; left: 0; z-index: 100; background: linear-gradient(180deg, #0d0f1a 0%, #111827 100%); border-right: 1px solid rgba(255,255,255,0.06); padding: 20px 12px; display: flex; flex-direction: column; }
                .sidebar-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; padding: 0 6px; }
                .logo-icon { width: 38px; height: 38px; border-radius: 12px; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 16px rgba(99,102,241,0.4); flex-shrink: 0; }
                .logo-text { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 14px; color: #f1f5f9; line-height: 1.2; }
                .logo-sub { font-size: 10px; color: #475569; }
                .user-chip { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 10px 12px; margin-bottom: 24px; display: flex; align-items: center; gap: 10px; }
                .user-avatar { width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, #f093fb, #f5576c); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 14px; }
                .user-name { font-size: 13px; font-weight: 600; color: #e2e8f0; }
                .user-role-badge { font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 20px; background: rgba(99,102,241,0.2); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.3); display: inline-block; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 3px; }
                .nav-section-label { font-size: 9px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px 8px; }
                .nav-link { display: flex; align-items: center; gap: 9px; padding: 9px 10px; border-radius: 10px; margin-bottom: 2px; text-decoration: none; transition: all 0.15s; border: 1px solid transparent; }
                .nav-link:hover { background: rgba(255,255,255,0.05); }
                .nav-link.active { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.2); }
                .nav-icon-wrap { width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 15px; }
                .nav-label { font-size: 13px; font-weight: 500; color: #64748b; }
                .nav-link.active .nav-label { color: #e2e8f0; font-weight: 600; }
                .nav-link:hover .nav-label { color: #94a3b8; }
                .nav-spacer { flex: 1; }
                .logout-btn { display: flex; align-items: center; gap: 9px; padding: 9px 10px; border-radius: 10px; width: 100%; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15); cursor: pointer; transition: all 0.2s; }
                .logout-btn:hover { background: rgba(239,68,68,0.15); }
                .logout-icon { width: 30px; height: 30px; border-radius: 8px; background: rgba(239,68,68,0.12); display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
                .logout-label { color: #fca5a5; font-size: 13px; font-weight: 500; font-family: 'DM Sans', sans-serif; }
                .main-content { margin-left: 210px; flex: 1; padding: 36px 40px; }
                .page-header { margin-bottom: 28px; }
                .page-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #f1f5f9; margin: 0 0 4px; }
                .page-sub { color: #475569; font-size: 14px; margin: 0; }
                .table-wrap { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; overflow: hidden; }
                table { width: 100%; border-collapse: collapse; font-size: 13px; }
                thead { background: rgba(255,255,255,0.02); }
                th { text-align: left; padding: 12px 16px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.9px; color: #334155; border-bottom: 1px solid rgba(255,255,255,0.05); }
                td { padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.03); color: #94a3b8; vertical-align: middle; }
                tr:last-child td { border-bottom: none; }
                tr:hover td { background: rgba(255,255,255,0.018); }
                .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; white-space: nowrap; }
                .user-cell { display: flex; align-items: center; gap: 8px; }
                .mini-avatar { width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, #f093fb, #f5576c); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; color: white; }
                .model-cell { color: #475569; font-size: 12px; }
                .model-id { opacity: 0.45; }
                .mono { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: #475569; white-space: pre-wrap; max-width: 130px; line-height: 1.5; display: block; }
                .ts-cell { white-space: nowrap; font-size: 11.5px; color: #475569; }
                .empty-state { text-align: center; padding: 64px 20px; }
                .empty-icon { font-size: 36px; margin-bottom: 12px; opacity: 0.35; }
                .empty-text { font-size: 14px; color: #334155; }

                /* ── Skeleton loading ── */
                @keyframes shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
                .skeleton { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%); background-size: 600px 100%; animation: shimmer 1.4s infinite; border-radius: 8px; }
                .skeleton-line { height: 12px; border-radius: 6px; }
                .skeleton-badge { height: 22px; width: 80px; border-radius: 100px; }

                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                .fade-in { animation: fadeIn 0.3s ease forwards; }
            `}</style>

            <div className="page-root">
                <aside className="sidebar">
                    <div className="sidebar-logo">
                        <div className="logo-icon">📦</div>
                        <div><div className="logo-text">Inventory</div><div className="logo-sub">Management System</div></div>
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
                        <Link key={item.href} href={item.href} className={`nav-link${item.href === '/dashboard/audit-logs' ? ' active' : ''}`}>
                            <div className="nav-icon-wrap" style={{ background: item.href === '/dashboard/audit-logs' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)' }}>{item.icon}</div>
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
                        <h1 className="page-title">📋 Audit Logs</h1>
                        <p className="page-sub">Complete history of all system activity</p>
                    </div>

                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Action</th>
                                    <th>User</th>
                                    <th>Model</th>
                                    <th>Old Values</th>
                                    <th>New Values</th>
                                    <th>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length === 0 ? (
                                    <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">📋</div><div className="empty-text">No audit logs yet</div></div></td></tr>
                                ) : logs.map((log) => {
                                    const badge = actionBadge(log.action);
                                    return (
                                        <tr key={log.id}>
                                            <td><span className="badge" style={{ background: badge.bg, color: badge.color }}>{log.action}</span></td>
                                            <td>
                                                <div className="user-cell">
                                                    <div className="mini-avatar">{log.user?.name?.[0]?.toUpperCase() || 'S'}</div>
                                                    {log.user?.name || 'System'}
                                                </div>
                                            </td>
                                            <td className="model-cell">
                                                {log.auditable_type?.split('\\').pop()}
                                                <span className="model-id"> #{log.auditable_id}</span>
                                            </td>
                                            <td>{log.old_values ? <code className="mono">{JSON.stringify(log.old_values, null, 1)}</code> : <span style={{ color: '#1e293b' }}>—</span>}</td>
                                            <td>{log.new_values ? <code className="mono">{JSON.stringify(log.new_values, null, 1)}</code> : <span style={{ color: '#1e293b' }}>—</span>}</td>
                                            <td className="ts-cell">{new Date(log.created_at).toLocaleString()}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>
        </>
    );
}
