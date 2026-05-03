'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../../lib/axios';
import Link from 'next/link';

export default function BorrowingsPage() {
    const { user, logout, loading: authLoading } = useAuth();
    const router = useRouter();
    const [borrowings, setBorrowings] = useState([]);
    const [items, setItems] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({
        item_id: '', borrower_name: '', contact: '',
        borrow_date: '', expected_return_date: '', quantity_borrowed: 1,
    });

    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.push('/login'); return; }
        fetchAll();
    }, [user, authLoading]);

    const fetchAll = async () => {
        try {
            const [b, i] = await Promise.all([api.get('/borrowings'), api.get('/items')]);
            setBorrowings(b.data);
            setItems(i.data.filter((item) => item.quantity > 0));
        } catch (err) { console.error(err); }
    };

    const handleSubmit = async () => {
        setError('');
        try {
            await api.post('/borrowings', form);
            setShowModal(false);
            setForm({ item_id: '', borrower_name: '', contact: '', borrow_date: '', expected_return_date: '', quantity_borrowed: 1 });
            fetchAll();
        } catch (err) { setError(err.response?.data?.message || 'Something went wrong'); }
    };

    const handleReturn = async (id) => {
        if (!confirm('Mark this as returned?')) return;
        try { await api.patch(`/borrowings/${id}/return`); fetchAll(); }
        catch { alert('Error processing return'); }
    };

    const today = new Date().toISOString().split('T')[0];

    const navItems = [
        { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
        { label: 'Items', href: '/dashboard/items', icon: '📦' },
        { label: 'Borrowings', href: '/dashboard/borrowings', icon: '🤝' },
        { label: 'Storage', href: '/dashboard/storage', icon: '🗄️' },
        { label: 'Audit Logs', href: '/dashboard/audit-logs', icon: '📋' },
    ];

    const statusInfo = (s) => {
        const map = {
            'active':   { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', label: '📤 Active' },
            'returned': { bg: 'rgba(74,222,128,0.12)',  color: '#4ade80', label: '✅ Returned' },
            'overdue':  { bg: 'rgba(248,113,113,0.12)', color: '#f87171', label: '⚠️ Overdue' },
        };
        return map[s] || { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', label: s };
    };

    const filtered = borrowings.filter((b) =>
        b.borrower_name?.toLowerCase().includes(search.toLowerCase()) ||
        b.item?.name?.toLowerCase().includes(search.toLowerCase())
    );

    if (authLoading) {
        return <div style={{ minHeight: '100vh', background: '#0d0f1a' }} />;
    }

    if (!user) return null;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'DM Sans', sans-serif; }
                .page-root { display: flex; min-height: 100vh; background: #0d0f1a; }

                /* ── Sidebar (matches dashboard exactly) ── */
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
                    text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px 8px;
                }
                .nav-link {
                    display: flex; align-items: center; gap: 9px;
                    padding: 9px 10px; border-radius: 10px; margin-bottom: 2px;
                    text-decoration: none; transition: all 0.15s; border: 1px solid transparent;
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

                /* ── Main ── */
                .main-content { margin-left: 210px; flex: 1; padding: 36px 40px; }
                .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
                .page-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #f1f5f9; margin: 0 0 4px; }
                .page-sub { color: #475569; font-size: 14px; margin: 0; }
                .add-btn {
                    background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff;
                    border: none; border-radius: 12px; padding: 11px 20px;
                    font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit;
                    box-shadow: 0 6px 20px rgba(245,158,11,0.3); transition: all 0.2s;
                    display: flex; align-items: center; gap: 7px; white-space: nowrap;
                }
                .add-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 28px rgba(245,158,11,0.4); }

                /* ── Stat chips ── */
                .stats-row { display: flex; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; }
                .stat-chip {
                    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 10px; padding: 9px 14px;
                    display: flex; align-items: center; gap: 10px;
                }
                .stat-chip-label { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
                .stat-chip-count { font-weight: 800; color: #f1f5f9; font-size: 18px; }

                /* ── Search ── */
                .search-wrap { position: relative; margin-bottom: 18px; max-width: 360px; }
                .search-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); font-size: 14px; }
                .search-input {
                    width: 100%; padding: 10px 14px 10px 38px;
                    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 10px; font-size: 13px; color: #e2e8f0;
                    outline: none; font-family: inherit; transition: all 0.2s;
                }
                .search-input:focus { border-color: #f59e0b; background: rgba(245,158,11,0.05); }
                .search-input::placeholder { color: #334155; }

                /* ── Table ── */
                .table-wrap {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 16px; overflow: hidden;
                }
                table { width: 100%; border-collapse: collapse; }
                thead { background: rgba(245,158,11,0.07); }
                th {
                    padding: 12px 16px; text-align: left;
                    font-size: 10px; font-weight: 700; color: #f59e0b;
                    text-transform: uppercase; letter-spacing: 0.8px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                td { padding: 13px 16px; font-size: 13px; color: #94a3b8; vertical-align: middle; border-bottom: 1px solid rgba(255,255,255,0.03); }
                tr:last-child td { border-bottom: none; }
                tr:hover td { background: rgba(255,255,255,0.02); }
                .td-primary { font-weight: 700; color: #e2e8f0; font-size: 13px; }
                .badge { display: inline-block; padding: 4px 11px; border-radius: 20px; font-size: 11px; font-weight: 700; }
                .return-btn {
                    background: rgba(16,185,129,0.12); color: #34d399;
                    border: none; padding: 5px 12px; border-radius: 8px;
                    font-size: 12px; font-weight: 700; cursor: pointer;
                    font-family: inherit; transition: all 0.15s;
                }
                .return-btn:hover { background: rgba(16,185,129,0.22); }
                .empty-state { text-align: center; padding: 56px; color: #334155; }
                .empty-icon { font-size: 40px; margin-bottom: 10px; opacity: 0.35; }

                /* ── Modal ── */
                .modal-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.75);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 1000; backdrop-filter: blur(6px);
                }
                .modal {
                    background: #111827; border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 20px; padding: 28px; width: 100%; max-width: 450px;
                    max-height: 90vh; overflow-y: auto;
                    box-shadow: 0 25px 60px rgba(0,0,0,0.6);
                }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; }
                .modal-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: #f1f5f9; margin: 0; }
                .close-btn {
                    background: rgba(255,255,255,0.07); border: none; border-radius: 8px;
                    width: 30px; height: 30px; cursor: pointer; color: #94a3b8; font-size: 14px;
                    transition: all 0.2s; display: flex; align-items: center; justify-content: center;
                }
                .close-btn:hover { background: rgba(255,255,255,0.12); color: #f1f5f9; }
                .form-fields { display: flex; flex-direction: column; gap: 13px; }
                .field-label-m { display: block; font-size: 10px; font-weight: 700; color: #475569; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
                .field-input-m {
                    width: 100%; padding: 10px 13px; font-size: 13px; font-family: inherit;
                    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 9px; outline: none; color: #e2e8f0; transition: all 0.2s;
                }
                .field-input-m:focus { border-color: #f59e0b; background: rgba(245,158,11,0.05); }
                .field-input-m::placeholder { color: #334155; }
                .field-input-m option { background: #1e2937; }
                .error-box-m {
                    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
                    color: #f87171; font-size: 13px; padding: 11px 14px;
                    border-radius: 9px; margin-bottom: 14px;
                }
                .modal-actions { display: flex; gap: 10px; margin-top: 22px; }
                .submit-btn-m {
                    flex: 1; padding: 12px; background: linear-gradient(135deg, #f59e0b, #d97706);
                    color: white; border: none; border-radius: 10px;
                    font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit;
                    box-shadow: 0 6px 20px rgba(245,158,11,0.3); transition: all 0.2s;
                }
                .submit-btn-m:hover { transform: translateY(-1px); }
                .cancel-btn-m {
                    flex: 1; padding: 12px; background: rgba(255,255,255,0.06);
                    color: #94a3b8; border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 10px; font-size: 13px; font-weight: 600;
                    cursor: pointer; font-family: inherit; transition: all 0.2s;
                }
                .cancel-btn-m:hover { background: rgba(255,255,255,0.1); }

                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                .fade-in { animation: fadeIn 0.3s ease forwards; }
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
                            <span className="user-role-badge">{user?.role}</span>
                        </div>
                    </div>

                    <div className="nav-section-label">Main Menu</div>
                    {navItems.map(item => (
                        <Link key={item.href} href={item.href} className={`nav-link${item.href === '/dashboard/borrowings' ? ' active' : ''}`}>
                            <div className="nav-icon-wrap" style={{ background: item.href === '/dashboard/borrowings' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)' }}>
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

                {/* Main */}
                <main className="main-content fade-in">
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">🤝 Borrowings</h1>
                            <p className="page-sub">Track items borrowed and their return status</p>
                        </div>
                        <button className="add-btn" onClick={() => { setShowModal(true); setError(''); }}>
                            ➕ New Borrowing
                        </button>
                    </div>

                    {/* Live stat chips — load silently in background */}
                    <div className="stats-row">
                        {[
                            { label: 'Active',   count: borrowings.filter(b => b.status === 'active').length,   color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
                            { label: 'Returned', count: borrowings.filter(b => b.status === 'returned').length, color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
                            { label: 'Overdue',  count: borrowings.filter(b => b.status === 'overdue').length,  color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
                        ].map((s, i) => (
                            <div key={i} className="stat-chip">
                                <span className="stat-chip-label" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                                <span className="stat-chip-count">{s.count}</span>
                            </div>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="search-wrap">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search by borrower or item..."
                            className="search-input"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Table — renders immediately, fills in as data loads */}
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    {['Item', 'Borrower', 'Contact', 'Qty', 'Borrow Date', 'Expected Return', 'Status', 'Action'].map(h => (
                                        <th key={h}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={8}>
                                            <div className="empty-state">
                                                <div className="empty-icon">📭</div>
                                                <p>{search ? 'No results found' : 'No borrowings recorded yet'}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filtered.map(b => {
                                    const s = statusInfo(b.status);
                                    return (
                                        <tr key={b.id}>
                                            <td><span className="td-primary">{b.item?.name || '—'}</span></td>
                                            <td>{b.borrower_name}</td>
                                            <td style={{ color: '#64748b' }}>{b.contact}</td>
                                            <td>{b.quantity_borrowed}</td>
                                            <td>{b.borrow_date}</td>
                                            <td>{b.expected_return_date}</td>
                                            <td>
                                                <span className="badge" style={{ background: s.bg, color: s.color }}>
                                                    {s.label}
                                                </span>
                                            </td>
                                            <td>
                                                {b.status === 'active' || b.status === 'overdue'
                                                    ? <button className="return-btn" onClick={() => handleReturn(b.id)}>✅ Return</button>
                                                    : <span style={{ color: '#334155' }}>—</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3 className="modal-title">➕ New Borrowing</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        {error && <div className="error-box-m">⚠️ {error}</div>}
                        <div className="form-fields">
                            <div>
                                <label className="field-label-m">Item *</label>
                                <select value={form.item_id} className="field-input-m" onChange={e => setForm({ ...form, item_id: e.target.value })}>
                                    <option value="">Select item...</option>
                                    {items.map(i => <option key={i.id} value={i.id}>{i.name} (Qty: {i.quantity})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="field-label-m">Borrower Name *</label>
                                <input type="text" value={form.borrower_name} className="field-input-m" placeholder="Full name" onChange={e => setForm({ ...form, borrower_name: e.target.value })} />
                            </div>
                            <div>
                                <label className="field-label-m">Contact *</label>
                                <input type="text" value={form.contact} className="field-input-m" placeholder="Phone or email" onChange={e => setForm({ ...form, contact: e.target.value })} />
                            </div>
                            <div>
                                <label className="field-label-m">Quantity *</label>
                                <input type="number" min={1} value={form.quantity_borrowed} className="field-input-m" onChange={e => setForm({ ...form, quantity_borrowed: parseInt(e.target.value) })} />
                            </div>
                            <div>
                                <label className="field-label-m">Borrow Date *</label>
                                <input type="date" value={form.borrow_date} min={today} className="field-input-m" onChange={e => setForm({ ...form, borrow_date: e.target.value })} />
                            </div>
                            <div>
                                <label className="field-label-m">Expected Return Date *</label>
                                <input type="date" value={form.expected_return_date} min={form.borrow_date || today} className="field-input-m" onChange={e => setForm({ ...form, expected_return_date: e.target.value })} />
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="submit-btn-m" onClick={handleSubmit}>➕ Create</button>
                            <button className="cancel-btn-m" onClick={() => setShowModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
