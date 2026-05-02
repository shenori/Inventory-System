'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../../lib/axios';
import Link from 'next/link';

export default function UsersPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });

    useEffect(() => {
        if (!user) { router.push('/login'); return; }
        if (user.role !== 'admin') { router.push('/dashboard'); return; }
        fetchUsers();
    }, [user]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleSubmit = async () => {
        setError('');
        try {
            await api.post('/users', form);
            setShowModal(false);
            setForm({ name: '', email: '', password: '', role: 'staff' });
            fetchUsers();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong');
        }
    };

    const handleDelete = async (id: any) => {
        if (id === user?.id) { alert('You cannot delete yourself'); return; }
        if (!confirm('Delete this user?')) return;
        try { await api.delete(`/users/${id}`); fetchUsers(); }
        catch (err) { console.error(err); }
    };

    const navItems = [
        { label: 'Dashboard',  href: '/dashboard',            icon: '🏠' },
        { label: 'Items',      href: '/dashboard/items',      icon: '📦' },
        { label: 'Borrowings', href: '/dashboard/borrowings', icon: '🤝' },
        { label: 'Storage',    href: '/dashboard/storage',    icon: '🗄️' },
        { label: 'Audit Logs', href: '/dashboard/audit-logs', icon: '📋' },
    ];

    const filtered = (users as any[]).filter(u =>
        !search ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    const avatarColors = [
        'linear-gradient(135deg,#6366f1,#8b5cf6)',
        'linear-gradient(135deg,#f093fb,#f5576c)',
        'linear-gradient(135deg,#10b981,#059669)',
        'linear-gradient(135deg,#f59e0b,#d97706)',
        'linear-gradient(135deg,#3b82f6,#2563eb)',
    ];

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'DM Sans', sans-serif; }
                .page-root { display: flex; min-height: 100vh; background: #0d0f1a; }

                /* ── Sidebar ── */
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

                /* ── Main ── */
                .main-content { margin-left: 240px; flex: 1; padding: 36px 40px; }
                .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
                .page-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #f1f5f9; margin: 0 0 4px; }
                .page-sub { color: #475569; font-size: 14px; margin: 0; }
                .add-btn { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: #fff; border: none; border-radius: 14px; padding: 12px 22px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; box-shadow: 0 6px 20px rgba(139,92,246,0.35); transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
                .add-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(139,92,246,0.45); }

                /* ── Stats ── */
                .stats-row { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
                .stat-chip { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 10px 16px; display: flex; align-items: center; gap: 10px; }

                /* ── Search ── */
                .search-wrap { position: relative; margin-bottom: 20px; max-width: 380px; }
                .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 16px; }
                .search-input { width: 100%; padding: 11px 16px 11px 42px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; font-size: 13px; color: #e2e8f0; outline: none; font-family: inherit; transition: all 0.2s; }
                .search-input:focus { border-color: #8b5cf6; background: rgba(139,92,246,0.06); }
                .search-input::placeholder { color: #334155; }

                /* ── Table ── */
                .table-wrap { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; overflow: hidden; }
                .table-head { background: rgba(139,92,246,0.08); border-bottom: 1px solid rgba(255,255,255,0.07); }
                .th { padding: 14px 20px; text-align: left; font-size: 11px; font-weight: 700; color: #8b5cf6; text-transform: uppercase; letter-spacing: 0.8px; }
                .tr { border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.15s; }
                .tr:hover { background: rgba(255,255,255,0.03); }
                .td { padding: 14px 20px; font-size: 13px; color: #94a3b8; vertical-align: middle; }
                .td-primary { font-weight: 700; color: #e2e8f0; font-size: 14px; }

                /* ── User cell ── */
                .user-cell { display: flex; align-items: center; gap: 10px; }
                .row-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 14px; flex-shrink: 0; }

                /* ── Badges ── */
                .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
                .b-purple { background: rgba(196,181,253,0.15); color: #c4b5fd; border: 1px solid rgba(139,92,246,0.25); }
                .b-blue   { background: rgba(96,165,250,0.12);  color: #60a5fa; border: 1px solid rgba(59,130,246,0.2); }

                /* ── Action btns ── */
                .action-btn { padding: 7px 13px; border-radius: 9px; border: none; font-weight: 700; cursor: pointer; font-size: 12px; font-family: inherit; transition: all 0.15s; }
                .del-btn { background: rgba(239,68,68,0.12); color: #f87171; }
                .del-btn:hover { background: rgba(239,68,68,0.22); }
                .you-badge { background: rgba(16,185,129,0.12); color: #34d399; padding: 5px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; }

                .empty-state { text-align: center; padding: 64px; color: #334155; }
                .loading-state { display: flex; align-items: center; justify-content: center; padding: 80px; color: #475569; font-size: 14px; gap: 10px; }

                /* ── Modal ── */
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(6px); }
                .modal { background: #111827; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 32px; width: 100%; max-width: 440px; box-shadow: 0 25px 60px rgba(0,0,0,0.6); }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .modal-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: #f1f5f9; margin: 0; }
                .close-btn { background: rgba(255,255,255,0.07); border: none; border-radius: 10px; width: 32px; height: 32px; cursor: pointer; color: #94a3b8; font-size: 16px; transition: all 0.2s; }
                .close-btn:hover { background: rgba(255,255,255,0.12); color: #f1f5f9; }
                .field-label-m { display: block; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
                .field-input-m { width: 100%; padding: 11px 14px; font-size: 13px; font-family: inherit; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; outline: none; color: #e2e8f0; transition: all 0.2s; box-sizing: border-box; }
                .field-input-m:focus { border-color: #8b5cf6; background: rgba(139,92,246,0.06); }
                .field-input-m::placeholder { color: #334155; }
                .field-input-m option { background: #1e2937; }
                .error-box-m { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); color: #f87171; font-size: 13px; padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; }
                .submit-btn-m { flex: 1; padding: 13px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; box-shadow: 0 6px 20px rgba(139,92,246,0.35); transition: all 0.2s; }
                .submit-btn-m:hover { transform: translateY(-1px); }
                .cancel-btn-m { flex: 1; padding: 13px; background: rgba(255,255,255,0.06); color: #94a3b8; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; }
                .cancel-btn-m:hover { background: rgba(255,255,255,0.1); }
            `}</style>

            <div className="page-root">
                {/* Sidebar */}
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
                        <Link key={item.href} href={item.href} className="nav-link">
                            <div className="nav-icon" style={{ background: 'rgba(255,255,255,0.05)' }}>{item.icon}</div>
                            <span className="nav-label">{item.label}</span>
                        </Link>
                    ))}
                    <div className="nav-section" style={{ marginTop: '16px' }}>Admin</div>
                    <Link href="/dashboard/users" className="nav-link active">
                        <div className="nav-icon" style={{ background: 'rgba(99,102,241,0.2)' }}>👥</div>
                        <span className="nav-label">Users</span>
                    </Link>
                    <div style={{ flex: 1 }} />
                    <button className="logout-btn" onClick={logout}>
                        <div className="nav-icon" style={{ background: 'rgba(239,68,68,0.12)' }}>🚪</div>
                        <span style={{ color: '#fca5a5', fontSize: '13px', fontWeight: '500' }}>Logout</span>
                    </button>
                </aside>

                {/* Main */}
                <main className="main-content">
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">👥 Users</h1>
                            <p className="page-sub">Manage system access and roles</p>
                        </div>
                        <button className="add-btn" onClick={() => { setShowModal(true); setError(''); }}>➕ Add User</button>
                    </div>

                    {/* Stats */}
                    <div className="stats-row">
                        {[
                            { label: 'Total Users', count: (users as any[]).length,                                    color: '#c4b5fd', bg: 'rgba(139,92,246,0.1)' },
                            { label: 'Admins',      count: (users as any[]).filter(u => u.role === 'admin').length,   color: '#a5b4fc', bg: 'rgba(99,102,241,0.1)'  },
                            { label: 'Staff',       count: (users as any[]).filter(u => u.role === 'staff').length,   color: '#60a5fa', bg: 'rgba(59,130,246,0.1)'  },
                        ].map((s, i) => (
                            <div key={i} className="stat-chip">
                                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: s.bg, color: s.color }}>{s.label}</span>
                                <span style={{ fontWeight: '800', color: '#f1f5f9', fontSize: '20px' }}>{s.count}</span>
                            </div>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="search-wrap">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="loading-state">⏳ Loading users...</div>
                    ) : (
                        <div className="table-wrap">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead className="table-head">
                                    <tr>
                                        {['User', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                                            <th key={h} className="th">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={5}>
                                                <div className="empty-state">
                                                    <div style={{ fontSize: '48px' }}>👤</div>
                                                    <p style={{ marginTop: '12px' }}>No users found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filtered.map((u: any, idx: number) => (
                                        <tr key={u.id} className="tr">
                                            <td className="td">
                                                <div className="user-cell">
                                                    <div className="row-avatar" style={{ background: avatarColors[idx % avatarColors.length] }}>
                                                        {u.name?.charAt(0)?.toUpperCase()}
                                                    </div>
                                                    <span className="td-primary">{u.name}</span>
                                                </div>
                                            </td>
                                            <td className="td" style={{ color: '#64748b' }}>{u.email}</td>
                                            <td className="td">
                                                <span className={`badge ${u.role === 'admin' ? 'b-purple' : 'b-blue'}`}>
                                                    {u.role === 'admin' ? '👑 Admin' : '👤 Staff'}
                                                </span>
                                            </td>
                                            <td className="td" style={{ fontSize: '12px', color: '#475569' }}>
                                                {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="td">
                                                {u.id === user?.id
                                                    ? <span className="you-badge">✅ You</span>
                                                    : <button className="action-btn del-btn" onClick={() => handleDelete(u.id)}>🗑️ Delete</button>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3 className="modal-title">➕ Add New User</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        {error && <div className="error-box-m">⚠️ {error}</div>}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label className="field-label-m">Full Name *</label>
                                <input type="text" value={form.name} className="field-input-m" placeholder="e.g. John Silva"
                                    onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="field-label-m">Email Address *</label>
                                <input type="email" value={form.email} className="field-input-m" placeholder="john@company.com"
                                    onChange={e => setForm({ ...form, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="field-label-m">Password *</label>
                                <input type="password" value={form.password} className="field-input-m" placeholder="Min. 8 characters"
                                    onChange={e => setForm({ ...form, password: e.target.value })} />
                            </div>
                            <div>
                                <label className="field-label-m">Role *</label>
                                <select value={form.role} className="field-input-m" onChange={e => setForm({ ...form, role: e.target.value })}>
                                    <option value="staff">👤 Staff</option>
                                    <option value="admin">👑 Admin</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <button className="submit-btn-m" onClick={handleSubmit}>➕ Create User</button>
                            <button className="cancel-btn-m" onClick={() => setShowModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
