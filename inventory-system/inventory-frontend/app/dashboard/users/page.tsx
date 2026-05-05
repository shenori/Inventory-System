'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../../lib/axios';
import Link from 'next/link';

export default function UsersPage() {
    const { user, logout, loading: authLoading } = useAuth();
    const router = useRouter();

    // ✅ Load instantly from cache
    const [users, setUsers] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            try {
                return JSON.parse(localStorage.getItem('cache_users') || '[]');
            } catch {
                return [];
            }
        }
        return [];
    });

    // ✅ Show loader ONLY if no cache
    const [loading, setLoading] = useState(users.length === 0);

    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });

    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.push('/login'); return; }
        if (user.role !== 'admin') { router.push('/dashboard'); return; }

        fetchUsers(); // 🔥 background refresh
    }, [user, authLoading]);

    // ✅ Fetch + update cache
    const fetchUsers = async () => {
        try {
            setLoading(users.length === 0); // only show loader if empty

            const res = await api.get('/users');

            setUsers(res.data);

            // ✅ Save to cache
            if (typeof window !== 'undefined') {
                localStorage.setItem('cache_users', JSON.stringify(res.data));
            }

        } catch (err: any) {
            console.error('fetchUsers error:', err?.response?.status, err?.response?.data);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        setError('');
        try {
            await api.post('/users', form);
            setShowModal(false);
            setForm({ name: '', email: '', password: '', role: 'staff' });

            fetchUsers(); // refresh + update cache
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong');
        }
    };

    const handleDelete = async (id: number) => {
        if (id === user?.id) { alert('You cannot delete yourself'); return; }
        if (!confirm('Delete this user?')) return;

        try {
            await api.delete(`/users/${id}`);
            fetchUsers(); // refresh + update cache
        } catch (err: any) {
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

    const filtered = users.filter((u: any) =>
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

    if (authLoading) return <div style={{ minHeight: '100vh', background: '#0d0f1a' }} />;
    if (!user) return null;

    return (
        <>
            {/* 👉 KEEP YOUR EXISTING STYLES (unchanged) */}
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
                        <Link key={item.href} href={item.href} className="nav-link">
                            <div className="nav-icon-wrap">{item.icon}</div>
                            <span className="nav-label">{item.label}</span>
                        </Link>
                    ))}

                    <div className="nav-section-label" style={{ marginTop: '14px' }}>Admin</div>
                    <Link href="/dashboard/users" className="nav-link active">
                        <div className="nav-icon-wrap">👥</div>
                        <span className="nav-label">Users</span>
                    </Link>

                    <div className="nav-spacer" />

                    <button className="logout-btn" onClick={logout}>
                        <div className="logout-icon">🚪</div>
                        <span className="logout-label">Logout</span>
                    </button>
                </aside>

                <main className="main-content">
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">👥 Users</h1>
                            <p className="page-sub">Manage system access and roles</p>
                        </div>

                        <button className="add-btn" onClick={() => setShowModal(true)}>
                            ➕ Add User
                        </button>
                    </div>

                    {/* SEARCH */}
                    <div className="search-wrap">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    {/* TABLE */}
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="empty-state">
                                            ⏳ Loading users...
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="empty-state">
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((u: any, idx: number) => (
                                        <tr key={u.id}>
                                            <td>
                                                <div className="user-cell">
                                                    <div
                                                        className="row-avatar"
                                                        style={{ background: avatarColors[idx % avatarColors.length] }}
                                                    >
                                                        {u.name?.charAt(0)?.toUpperCase()}
                                                    </div>
                                                    {u.name}
                                                </div>
                                            </td>

                                            <td>{u.email}</td>

                                            <td>{u.role}</td>

                                            <td>
                                                {u.created_at
                                                    ? new Date(u.created_at).toLocaleDateString()
                                                    : '—'}
                                            </td>

                                            <td>
                                                {u.id === user?.id ? (
                                                    'You'
                                                ) : (
                                                    <button onClick={() => handleDelete(u.id)}>
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>
        </>
    );
}