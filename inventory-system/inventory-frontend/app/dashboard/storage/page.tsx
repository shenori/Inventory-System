'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../../lib/axios';
import Link from 'next/link';

export default function StoragePage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [cupboards, setCupboards] = useState([]);
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'cupboards' | 'places'>('cupboards');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'cupboard' | 'place'>('cupboard');
    const [editItem, setEditItem] = useState<any>(null);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [cupboardForm, setCupboardForm] = useState({ name: '', location: '' });
    const [placeForm, setPlaceForm] = useState({ name: '', cupboard_id: '' });

    useEffect(() => {
        if (!user) { router.push('/login'); return; }
        fetchAll();
    }, [user]);

    const fetchAll = async () => {
        try {
            const [c, p] = await Promise.all([api.get('/cupboards'), api.get('/places')]);
            setCupboards(c.data);
            setPlaces(p.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const openCupboardModal = (item?: any) => {
        setModalType('cupboard');
        setEditItem(item || null);
        setCupboardForm({ name: item?.name || '', location: item?.location || '' });
        setError('');
        setShowModal(true);
    };

    const openPlaceModal = (item?: any) => {
        setModalType('place');
        setEditItem(item || null);
        setPlaceForm({ name: item?.name || '', cupboard_id: item?.cupboard_id || '' });
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async () => {
        setError('');
        try {
            if (modalType === 'cupboard') {
                if (editItem) await api.put(`/cupboards/${editItem.id}`, cupboardForm);
                else await api.post('/cupboards', cupboardForm);
            } else {
                if (editItem) await api.put(`/places/${editItem.id}`, placeForm);
                else await api.post('/places', placeForm);
            }
            setShowModal(false);
            fetchAll();
        } catch (err: any) { setError(err.response?.data?.message || 'Something went wrong'); }
    };

    const handleDelete = async (type: 'cupboard' | 'place', id: any) => {
        if (!confirm(`Delete this ${type}?`)) return;
        try {
            if (type === 'cupboard') await api.delete(`/cupboards/${id}`);
            else await api.delete(`/places/${id}`);
            fetchAll();
        } catch { alert('Cannot delete — it may have items assigned to it.'); }
    };

    const navItems = [
        { label: 'Dashboard',  href: '/dashboard',            icon: '🏠' },
        { label: 'Items',      href: '/dashboard/items',      icon: '📦' },
        { label: 'Borrowings', href: '/dashboard/borrowings', icon: '🤝' },
        { label: 'Storage',    href: '/dashboard/storage',    icon: '🗄️', active: true },
        { label: 'Audit Logs', href: '/dashboard/audit-logs', icon: '📋' },
    ];

    const filteredCupboards = (cupboards as any[]).filter(c =>
        !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.location?.toLowerCase().includes(search.toLowerCase())
    );

    const filteredPlaces = (places as any[]).filter(p =>
        !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.cupboard?.name?.toLowerCase().includes(search.toLowerCase())
    );

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
                .add-btn { background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; border-radius: 14px; padding: 12px 22px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; box-shadow: 0 6px 20px rgba(16,185,129,0.35); transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
                .add-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(16,185,129,0.45); }

                /* ── Stats ── */
                .stats-row { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
                .stat-chip { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 10px 16px; display: flex; align-items: center; gap: 10px; }

                /* ── Tabs ── */
                .tabs { display: flex; gap: 6px; margin-bottom: 20px; }
                .tab { padding: 8px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: all 0.2s; color: #475569; background: none; font-family: inherit; }
                .tab.active { background: rgba(16,185,129,0.12); color: #34d399; border-color: rgba(16,185,129,0.2); }
                .tab:hover:not(.active) { background: rgba(255,255,255,0.04); color: #e2e8f0; }

                /* ── Search ── */
                .search-wrap { position: relative; margin-bottom: 20px; max-width: 380px; }
                .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 16px; }
                .search-input { width: 100%; padding: 11px 16px 11px 42px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; font-size: 13px; color: #e2e8f0; outline: none; font-family: inherit; transition: all 0.2s; }
                .search-input:focus { border-color: #10b981; background: rgba(16,185,129,0.06); }
                .search-input::placeholder { color: #334155; }

                /* ── Table ── */
                .table-wrap { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; overflow: hidden; }
                .table-head { background: rgba(16,185,129,0.08); border-bottom: 1px solid rgba(255,255,255,0.07); }
                .th { padding: 14px 20px; text-align: left; font-size: 11px; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 0.8px; }
                .tr { border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.15s; }
                .tr:hover { background: rgba(255,255,255,0.03); }
                .td { padding: 14px 20px; font-size: 13px; color: #94a3b8; vertical-align: middle; }
                .td-primary { font-weight: 700; color: #e2e8f0; font-size: 14px; }

                /* ── Badges ── */
                .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
                .b-green  { background: rgba(16,185,129,0.12); color: #34d399; border: 1px solid rgba(16,185,129,0.2); }
                .b-indigo { background: rgba(99,102,241,0.15); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.2); }

                /* ── Action btns ── */
                .action-btn { padding: 7px 13px; border-radius: 9px; border: none; font-weight: 700; cursor: pointer; font-size: 12px; font-family: inherit; transition: all 0.15s; }
                .edit-btn { background: rgba(139,92,246,0.15); color: #c4b5fd; }
                .edit-btn:hover { background: rgba(139,92,246,0.25); }
                .del-btn { background: rgba(239,68,68,0.12); color: #f87171; }
                .del-btn:hover { background: rgba(239,68,68,0.22); }

                /* ── Cupboard icon ── */
                .cupboard-icon { width: 40px; height: 40px; border-radius: 12px; background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.2); display: flex; align-items: center; justify-content: center; font-size: 20px; }
                .place-icon { width: 40px; height: 40px; border-radius: 12px; background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.2); display: flex; align-items: center; justify-content: center; font-size: 20px; }

                .empty-state { text-align: center; padding: 64px; color: #334155; }
                .loading-state { display: flex; align-items: center; justify-content: center; padding: 80px; color: #475569; font-size: 14px; gap: 10px; }

                /* ── Modal ── */
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(6px); }
                .modal { background: #111827; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 32px; width: 100%; max-width: 420px; box-shadow: 0 25px 60px rgba(0,0,0,0.6); }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .modal-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: #f1f5f9; margin: 0; }
                .close-btn { background: rgba(255,255,255,0.07); border: none; border-radius: 10px; width: 32px; height: 32px; cursor: pointer; color: #94a3b8; font-size: 16px; transition: all 0.2s; }
                .close-btn:hover { background: rgba(255,255,255,0.12); color: #f1f5f9; }
                .field-label-m { display: block; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
                .field-input-m { width: 100%; padding: 11px 14px; font-size: 13px; font-family: inherit; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; outline: none; color: #e2e8f0; transition: all 0.2s; box-sizing: border-box; }
                .field-input-m:focus { border-color: #10b981; background: rgba(16,185,129,0.06); }
                .field-input-m::placeholder { color: #334155; }
                .field-input-m option { background: #1e2937; }
                .error-box-m { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); color: #f87171; font-size: 13px; padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; }
                .submit-btn-m { flex: 1; padding: 13px; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; box-shadow: 0 6px 20px rgba(16,185,129,0.35); transition: all 0.2s; }
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

                {/* Main */}
                <main className="main-content">
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">🗄️ Storage</h1>
                            <p className="page-sub">Manage cupboards and storage places</p>
                        </div>
                        <button className="add-btn" onClick={() => activeTab === 'cupboards' ? openCupboardModal() : openPlaceModal()}>
                            ➕ Add {activeTab === 'cupboards' ? 'Cupboard' : 'Place'}
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="stats-row">
                        {[
                            { label: 'Cupboards',    count: (cupboards as any[]).length, color: '#34d399', bg: 'rgba(16,185,129,0.1)' },
                            { label: 'Places',       count: (places as any[]).length,    color: '#a5b4fc', bg: 'rgba(99,102,241,0.1)' },
                        ].map((s, i) => (
                            <div key={i} className="stat-chip">
                                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: s.bg, color: s.color }}>{s.label}</span>
                                <span style={{ fontWeight: '800', color: '#f1f5f9', fontSize: '20px' }}>{s.count}</span>
                            </div>
                        ))}
                    </div>

                    {/* Tabs */}
                    <div className="tabs">
                        <button className={`tab ${activeTab === 'cupboards' ? 'active' : ''}`} onClick={() => { setActiveTab('cupboards'); setSearch(''); }}>
                            🗄️ Cupboards
                        </button>
                        <button className={`tab ${activeTab === 'places' ? 'active' : ''}`} onClick={() => { setActiveTab('places'); setSearch(''); }}>
                            📍 Places
                        </button>
                    </div>

                    {/* Search */}
                    <div className="search-wrap">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="loading-state">⏳ Loading storage...</div>
                    ) : activeTab === 'cupboards' ? (
                        <div className="table-wrap">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead className="table-head">
                                    <tr>{['Cupboard', 'Location', 'Places', 'Actions'].map(h => <th key={h} className="th">{h}</th>)}</tr>
                                </thead>
                                <tbody>
                                    {filteredCupboards.length === 0 ? (
                                        <tr><td colSpan={4}><div className="empty-state"><div style={{ fontSize: '48px' }}>🗄️</div><p style={{ marginTop: '12px' }}>No cupboards found</p></div></td></tr>
                                    ) : filteredCupboards.map((c: any) => (
                                        <tr key={c.id} className="tr">
                                            <td className="td">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div className="cupboard-icon">🗄️</div>
                                                    <span className="td-primary">{c.name}</span>
                                                </div>
                                            </td>
                                            <td className="td" style={{ color: '#64748b' }}>📍 {c.location || '—'}</td>
                                            <td className="td">
                                                <span className="badge b-indigo">
                                                    {(places as any[]).filter(p => p.cupboard_id === c.id).length} places
                                                </span>
                                            </td>
                                            <td className="td">
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="action-btn edit-btn" onClick={() => openCupboardModal(c)}>✏️ Edit</button>
                                                    <button className="action-btn del-btn" onClick={() => handleDelete('cupboard', c.id)}>🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="table-wrap">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead className="table-head">
                                    <tr>{['Place', 'Cupboard', 'Actions'].map(h => <th key={h} className="th">{h}</th>)}</tr>
                                </thead>
                                <tbody>
                                    {filteredPlaces.length === 0 ? (
                                        <tr><td colSpan={3}><div className="empty-state"><div style={{ fontSize: '48px' }}>📍</div><p style={{ marginTop: '12px' }}>No places found</p></div></td></tr>
                                    ) : filteredPlaces.map((p: any) => (
                                        <tr key={p.id} className="tr">
                                            <td className="td">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div className="place-icon">📍</div>
                                                    <span className="td-primary">{p.name}</span>
                                                </div>
                                            </td>
                                            <td className="td">
                                                <span className="badge b-green">🗄️ {p.cupboard?.name || '—'}</span>
                                            </td>
                                            <td className="td">
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="action-btn edit-btn" onClick={() => openPlaceModal(p)}>✏️ Edit</button>
                                                    <button className="action-btn del-btn" onClick={() => handleDelete('place', p.id)}>🗑️</button>
                                                </div>
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
                            <h3 className="modal-title">
                                {editItem
                                    ? `✏️ Edit ${modalType === 'cupboard' ? 'Cupboard' : 'Place'}`
                                    : `➕ New ${modalType === 'cupboard' ? 'Cupboard' : 'Place'}`}
                            </h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        {error && <div className="error-box-m">⚠️ {error}</div>}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {modalType === 'cupboard' ? (
                                <>
                                    <div>
                                        <label className="field-label-m">Cupboard Name *</label>
                                        <input type="text" value={cupboardForm.name} className="field-input-m" placeholder="e.g. Cabinet A"
                                            onChange={e => setCupboardForm({ ...cupboardForm, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="field-label-m">Location</label>
                                        <input type="text" value={cupboardForm.location} className="field-input-m" placeholder="e.g. Lab Room 1"
                                            onChange={e => setCupboardForm({ ...cupboardForm, location: e.target.value })} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="field-label-m">Place Name *</label>
                                        <input type="text" value={placeForm.name} className="field-input-m" placeholder="e.g. Shelf A1"
                                            onChange={e => setPlaceForm({ ...placeForm, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="field-label-m">Cupboard *</label>
                                        <select value={placeForm.cupboard_id} className="field-input-m"
                                            onChange={e => setPlaceForm({ ...placeForm, cupboard_id: e.target.value })}>
                                            <option value="">Select cupboard...</option>
                                            {(cupboards as any[]).map(c => (
                                                <option key={c.id} value={c.id}>{c.name} — {c.location}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <button className="submit-btn-m" onClick={handleSubmit}>
                                {editItem ? '✏️ Update' : '➕ Create'}
                            </button>
                            <button className="cancel-btn-m" onClick={() => setShowModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
