'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../../lib/axios';
import Link from 'next/link';

export default function AuditLogsPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!user) { router.push('/login'); return; }
        fetchLogs();
    }, [user]);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/audit-logs');
            setLogs(res.data.data || res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const actionStyle = (action) => {
        if (!action) return { cls: 'b-gray', icon: '❓' };
        if (action.includes('created'))  return { cls: 'b-green',  icon: '➕' };
        if (action.includes('updated') || action.includes('quantity')) return { cls: 'b-blue', icon: '✏️' };
        if (action.includes('deleted'))  return { cls: 'b-red',    icon: '🗑️' };
        if (action.includes('borrowed')) return { cls: 'b-yellow', icon: '📤' };
        if (action.includes('returned')) return { cls: 'b-purple', icon: '✅' };
        return { cls: 'b-gray', icon: '❓' };
    };

    const navItems = [
        { label: 'Dashboard',  href: '/dashboard',            icon: '🏠' },
        { label: 'Items',      href: '/dashboard/items',      icon: '📦' },
        { label: 'Borrowings', href: '/dashboard/borrowings', icon: '🤝' },
        { label: 'Storage',    href: '/dashboard/storage',    icon: '🗄️' },
        { label: 'Audit Logs', href: '/dashboard/audit-logs', icon: '📋', active: true },
    ];

    const filtered = logs.filter(l =>
        !search ||
        l.action?.toLowerCase().includes(search.toLowerCase()) ||
        l.user?.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'DM Sans', sans-serif; }
                .page-root { display: flex; min-height: 100vh; background: #0d0f1a; }

                .sidebar { width: 240px; min-height: 100vh; position: fixed; top: 0; left: 0; z-index: 100; background: linear-gradient(180deg, #0d0f1a 0%, #111827 100%); border-right: 1px solid rgba(255,255,255,0.06); padding: 24px 14px; display: flex; flex-direction: column; }
                .sidebar-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; padding: 0 8px; }
                .logo-icon { width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 16px rgba(99,102,241,0.4); }
                .logo-text { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 15px; color: #f1f5f9; }
                .logo-sub { font-size: 11px; color: #475569; }
                .user-chip { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 12px 14px; margin-bottom: 28px; display: flex; align-items: center; gap: 10px; }
                .user-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #f093fb, #f5576c); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 15px; }
                .user-name { font-size: 13px; font-weight: 600; color: #e2e8f0; }
                .user-role { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: rgba(99,102,241,0.2); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.3); display: inline-block; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
                .nav-section { font-size: 10px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 8px; }
                .nav-link { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; margin-bottom: 3px; text-decoration: none; transition: all 0.2s; border: 1px solid transparent; }
                .nav-link:hover { background: rgba(255,255,255,0.05); }
                .nav-link.active { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.2); }
                .nav-icon { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
                .nav-label { font-size: 13px; font-weight: 500; color: #64748b; }
                .nav-link.active .nav-label { color: #e2e8f0; font-weight: 600; }
                .logout-btn { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; width: 100%; margin-top: auto; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15); cursor: pointer; transition: all 0.2s; }
                .logout-btn:hover { background: rgba(239,68,68,0.15); }

                .main-content { margin-left: 240px; flex: 1; padding: 36px 40px; }
                .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
                .page-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #f1f5f9; margin: 0 0 4px; }
                .page-sub { color: #475569; font-size: 14px; margin: 0; }
                .refresh-btn { background: rgba(255,255,255,0.05); color: #94a3b8; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 10px 18px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
                .refresh-btn:hover { background: rgba(255,255,255,0.09); color: #e2e8f0; }

                .stats-row { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
                .stat-chip { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 10px 16px; display: flex; align-items: center; gap: 10px; }

                .search-wrap { position: relative; margin-bottom: 20px; max-width: 380px; }
                .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 16px; }
                .search-input { width: 100%; padding: 11px 16px 11px 42px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; font-size: 13px; color: #e2e8f0; outline: none; font-family: inherit; transition: all 0.2s; }
                .search-input:focus { border-color: #6366f1; background: rgba(99,102,241,0.06); }
                .search-input::placeholder { color: #334155; }

                .table-wrap { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; overflow: hidden; }
                .table-head { background: rgba(99,102,241,0.08); border-bottom: 1px solid rgba(255,255,255,0.07); }
                .th { padding: 14px 20px; text-align: left; font-size: 11px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.8px; }
                .tr { border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.15s; }
                .tr:hover { background: rgba(255,255,255,0.03); }
                .td { padding: 13px 20px; font-size: 13px; color: #94a3b8; vertical-align: middle; }
                .td-primary { font-weight: 700; color: #e2e8f0; }

                .badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 11px; border-radius: 20px; font-size: 11px; font-weight: 700; }
                .b-green  { background: rgba(74,222,128,0.12);  color: #4ade80; }
                .b-blue   { background: rgba(96,165,250,0.12);  color: #60a5fa; }
                .b-red    { background: rgba(248,113,113,0.12); color: #f87171; }
                .b-yellow { background: rgba(251,191,36,0.12);  color: #fbbf24; }
                .b-purple { background: rgba(196,181,253,0.12); color: #c4b5fd; }
                .b-gray   { background: rgba(148,163,184,0.12); color: #94a3b8; }

                .user-cell { display: flex; align-items: center; gap: 8px; }
                .user-dot { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 12px; flex-shrink: 0; }
                .mono { font-family: monospace; font-size: 11px; color: #475569; white-space: pre-wrap; word-break: break-all; max-width: 160px; line-height: 1.5; }
                .empty-state { text-align: center; padding: 64px; color: #334155; }
                .loading-state { display: flex; align-items: center; justify-content: center; padding: 80px; color: #475569; font-size: 14px; gap: 10px; }
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
                            <span className="user-role">{user?.role}</span>
                        </div>
                    </div>
                    <div className="nav-section">Main Menu</div>
                    {navItems.map(item => (
                        <Link key={item.href} href={item.href} className={`nav-link ${item.active ? 'active' : ''}`}>
                            <div className="nav-icon" style={{ background: item.active ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)' }}>{item.icon}</div>
                            <span className="nav-label">{item.label}</span>
                        </Link>
                    ))}
                    {user?.role === 'admin' && (
                        <>
                            <div className="nav-section" style={{ marginTop: '16px' }}>Admin</div>
                            <Link href="/dashboard/users" className="nav-link">
                                <div className="nav-icon" style={{ background: 'rgba(255,255,255,0.05)' }}>👥</div>
                                <span className="nav-label">Users</span>
                            </Link>
                        </>
                    )}
                    <div style={{ flex: 1 }} />
                    <button className="logout-btn" onClick={logout}>
                        <div className="nav-icon" style={{ background: 'rgba(239,68,68,0.12)' }}>🚪</div>
                        <span style={{ color: '#fca5a5', fontSize: '13px', fontWeight: '500' }}>Logout</span>
                    </button>
                </aside>

                <main className="main-content">
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">📋 Audit Logs</h1>
                            <p className="page-sub">Complete history of all system activity</p>
                        </div>
                        <button className="refresh-btn" onClick={fetchLogs}>🔄 Refresh</button>
                    </div>

                    <div className="stats-row">
                        {[
                            { label: 'Total Logs', count: logs.length,                                             color: '#a5b4fc', bg: 'rgba(99,102,241,0.1)' },
                            { label: 'Created',    count: logs.filter(l => l.action?.includes('created')).length,  color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
                            { label: 'Updated',    count: logs.filter(l => l.action?.includes('updated')).length,  color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
                            { label: 'Deleted',    count: logs.filter(l => l.action?.includes('deleted')).length,  color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
                        ].map((s, i) => (
                            <div key={i} className="stat-chip">
                                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: s.bg, color: s.color }}>{s.label}</span>
                                <span style={{ fontWeight: '800', color: '#f1f5f9', fontSize: '20px' }}>{s.count}</span>
                            </div>
                        ))}
                    </div>

                    <div className="search-wrap">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search by action or user..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    {loading ? (
                        <div className="loading-state">⏳ Loading audit logs...</div>
                    ) : (
                        <div className="table-wrap">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead className="table-head">
                                    <tr>
                                        {['Action', 'User', 'Model', 'Old Values', 'New Values', 'Timestamp'].map(h => (
                                            <th key={h} className="th">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={6}>
                                                <div className="empty-state">
                                                    <div style={{ fontSize: '48px' }}>📭</div>
                                                    <p style={{ marginTop: '12px' }}>No audit logs found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filtered.map((log) => {
                                        const a = actionStyle(log.action);
                                        return (
                                            <tr key={log.id} className="tr">
                                                <td className="td">
                                                    <span className={`badge ${a.cls}`}>
                                                        {a.icon} {log.action}
                                                    </span>
                                                </td>
                                                <td className="td">
                                                    <div className="user-cell">
                                                        <div className="user-dot">
                                                            {(log.user?.name || 'S')[0].toUpperCase()}
                                                        </div>
                                                        <span className="td-primary">{log.user?.name || 'System'}</span>
                                                    </div>
                                                </td>
                                                <td className="td" style={{ color: '#64748b' }}>
                                                    {log.auditable_type?.split('\\').pop()}
                                                    <span style={{ opacity: 0.5 }}> #{log.auditable_id}</span>
                                                </td>
                                                <td className="td">
                                                    {log.old_values
                                                        ? <pre className="mono">{JSON.stringify(log.old_values, null, 1)}</pre>
                                                        : <span style={{ color: '#334155' }}>—</span>}
                                                </td>
                                                <td className="td">
                                                    {log.new_values
                                                        ? <pre className="mono">{JSON.stringify(log.new_values, null, 1)}</pre>
                                                        : <span style={{ color: '#334155' }}>—</span>}
                                                </td>
                                                <td className="td" style={{ whiteSpace: 'nowrap', fontSize: '12px' }}>
                                                    {new Date(log.created_at).toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}
