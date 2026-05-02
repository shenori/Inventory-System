'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../../lib/axios';
import Link from 'next/link';

export default function ItemsPage() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [items, setItems] = useState([]);
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [form, setForm] = useState({ name: '', code: '', quantity: 0, serial_number: '', description: '', place_id: '', status: 'in-store' });
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    // ✅ Fix: base URL for images (strips /api suffix)
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/api$/, '');

    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.push('/login'); return; }
        fetchItems();
        fetchPlaces();
    }, [user, authLoading]);

    const fetchItems = async () => {
        try { const res = await api.get('/items'); setItems(res.data); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchPlaces = async () => {
        try { const res = await api.get('/places'); setPlaces(res.data); }
        catch (err) { console.error(err); }
    };

    const openCreate = () => {
        setEditItem(null); setImageFile(null);
        setForm({ name: '', code: '', quantity: 0, serial_number: '', description: '', place_id: '', status: 'in-store' });
        setError(''); setShowModal(true);
    };

    const openEdit = (item) => {
        setEditItem(item); setImageFile(null);
        setForm({ name: item.name, code: item.code, quantity: item.quantity, serial_number: item.serial_number || '', description: item.description || '', place_id: item.place_id, status: item.status });
        setError(''); setShowModal(true);
    };

    const handleSubmit = async () => {
        setError('');
        try {
            const fd = new FormData();
            Object.keys(form).forEach(k => { if (form[k] !== null && form[k] !== undefined) fd.append(k, form[k]); });
            if (imageFile) fd.append('image', imageFile);
            if (editItem) {
                fd.append('_method', 'PUT');
                await api.post(`/items/${editItem.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                await api.post('/items', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            setShowModal(false); fetchItems();
        } catch (err) { setError(err.response?.data?.message || 'Something went wrong'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this item?')) return;
        try { await api.delete(`/items/${id}`); fetchItems(); } catch {}
    };

    const handleQty = async (item, type) => {
        try { await api.patch(`/items/${item.id}/quantity`, { type, amount: 1 }); fetchItems(); }
        catch (err) { alert(err.response?.data?.message || 'Error updating quantity'); }
    };

    const filtered = items.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.code.toLowerCase().includes(search.toLowerCase())
    );

    const statusInfo = (s) => {
        const map = {
            'in-store': { bg: '#d1fae5', color: '#065f46', label: '✅ In Store' },
            'borrowed': { bg: '#fef3c7', color: '#92400e', label: '📤 Borrowed' },
            'damaged': { bg: '#fee2e2', color: '#991b1b', label: '⚠️ Damaged' },
            'missing': { bg: '#f3f4f6', color: '#374151', label: '❓ Missing' },
        };
        return map[s] || map['missing'];
    };

    if (authLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0f1a' }}>
                <div style={{ textAlign: 'center', color: '#6366f1' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                    <p style={{ fontWeight: '600', color: '#94a3b8' }}>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
                * { box-sizing: border-box; }
                body { font-family: 'DM Sans', sans-serif; }
                .page-root { display: flex; min-height: 100vh; background: #0d0f1a; }
                .sidebar {
                    width: 240px; min-height: 100vh; position: fixed; top: 0; left: 0; z-index: 100;
                    background: linear-gradient(180deg, #0d0f1a 0%, #111827 100%);
                    border-right: 1px solid rgba(255,255,255,0.06);
                    padding: 24px 14px; display: flex; flex-direction: column;
                }
                .sidebar-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; padding: 0 8px; }
                .logo-icon {
                    width: 40px; height: 40px; border-radius: 12px;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 20px; box-shadow: 0 4px 16px rgba(99,102,241,0.4);
                }
                .logo-text { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 15px; color: #f1f5f9; }
                .logo-sub { font-size: 11px; color: #475569; }
                .user-chip {
                    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 14px; padding: 12px 14px; margin-bottom: 28px;
                    display: flex; align-items: center; gap: 10px;
                }
                .user-avatar {
                    width: 36px; height: 36px; border-radius: 50%;
                    background: linear-gradient(135deg, #f093fb, #f5576c);
                    display: flex; align-items: center; justify-content: center;
                    color: white; font-weight: 800; font-size: 15px;
                }
                .user-name { font-size: 13px; font-weight: 600; color: #e2e8f0; }
                .user-role {
                    font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px;
                    background: rgba(99,102,241,0.2); color: #a5b4fc;
                    border: 1px solid rgba(99,102,241,0.3); display: inline-block;
                    text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px;
                }
                .nav-section { font-size: 10px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 8px; }
                .nav-link {
                    display: flex; align-items: center; gap: 10px;
                    padding: 10px 12px; border-radius: 12px; margin-bottom: 3px;
                    text-decoration: none; transition: all 0.2s; cursor: pointer;
                }
                .nav-link:hover { background: rgba(255,255,255,0.05); }
                .nav-link.active { background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.2); }
                .nav-icon { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
                .nav-label { font-size: 13px; font-weight: 500; color: #64748b; }
                .nav-link.active .nav-label { color: #e2e8f0; font-weight: 600; }
                .logout-btn {
                    display: flex; align-items: center; gap: 10px; padding: 10px 12px;
                    border-radius: 12px; width: 100%; margin-top: auto;
                    background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15);
                    cursor: pointer; transition: all 0.2s;
                }
                .logout-btn:hover { background: rgba(239,68,68,0.15); }
                .main-content { margin-left: 240px; flex: 1; padding: 32px; }
                .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
                .page-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #f1f5f9; margin: 0 0 4px; }
                .page-sub { color: #475569; font-size: 14px; margin: 0; }
                .add-btn {
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    color: white; border: none; border-radius: 14px; padding: 12px 22px;
                    font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit;
                    box-shadow: 0 6px 20px rgba(99,102,241,0.4); transition: all 0.2s;
                    display: flex; align-items: center; gap: 8px;
                }
                .add-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(99,102,241,0.5); }
                .stats-row { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
                .stat-chip {
                    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 12px; padding: 10px 16px; display: flex; align-items: center; gap: 10px;
                }
                .search-wrap { position: relative; margin-bottom: 20px; max-width: 380px; }
                .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 16px; }
                .search-input {
                    width: 100%; padding: 11px 16px 11px 42px;
                    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px; font-size: 13px; color: #e2e8f0; outline: none;
                    font-family: inherit; transition: all 0.2s;
                }
                .search-input:focus { border-color: #6366f1; background: rgba(99,102,241,0.08); }
                .search-input::placeholder { color: #334155; }
                .table-wrap {
                    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 20px; overflow: hidden;
                }
                .table-head { background: rgba(99,102,241,0.1); border-bottom: 1px solid rgba(255,255,255,0.07); }
                .th { padding: 14px 20px; text-align: left; font-size: 11px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.8px; }
                .tr { border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.15s; }
                .tr:hover { background: rgba(255,255,255,0.03); }
                .td { padding: 14px 20px; }
                .item-name { font-weight: 700; color: #e2e8f0; font-size: 14px; }
                .item-desc { color: #475569; font-size: 12px; margin-top: 2px; }
                .code-badge {
                    background: rgba(99,102,241,0.15); color: #a5b4fc;
                    padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 700;
                    font-family: monospace; border: 1px solid rgba(99,102,241,0.2);
                }
                .qty-wrap { display: flex; align-items: center; gap: 8px; }
                .qty-btn { width: 28px; height: 28px; border-radius: 8px; border: none; font-weight: 800; cursor: pointer; font-size: 16px; transition: all 0.15s; }
                .qty-dec { background: rgba(239,68,68,0.15); color: #f87171; }
                .qty-dec:hover { background: rgba(239,68,68,0.25); }
                .qty-inc { background: rgba(34,197,94,0.15); color: #4ade80; }
                .qty-inc:hover { background: rgba(34,197,94,0.25); }
                .qty-val { font-weight: 800; color: #f1f5f9; font-size: 18px; min-width: 32px; text-align: center; }
                .status-badge { padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
                .place-text { color: #64748b; font-size: 13px; }
                .action-btn { padding: 7px 13px; border-radius: 9px; border: none; font-weight: 700; cursor: pointer; font-size: 12px; font-family: inherit; transition: all 0.15s; }
                .edit-btn { background: rgba(139,92,246,0.15); color: #c4b5fd; }
                .edit-btn:hover { background: rgba(139,92,246,0.25); }
                .del-btn { background: rgba(239,68,68,0.12); color: #f87171; }
                .del-btn:hover { background: rgba(239,68,68,0.22); }
                .img-thumb { width: 44px; height: 44px; border-radius: 12px; object-fit: cover; border: 1px solid rgba(255,255,255,0.1); }
                .img-placeholder { width: 44px; height: 44px; border-radius: 12px; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; font-size: 20px; }
                .empty-state { text-align: center; padding: 64px; color: #334155; }
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(6px); }
                .modal { background: #111827; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 32px; width: 100%; max-width: 460px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 60px rgba(0,0,0,0.6); }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .modal-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: #f1f5f9; margin: 0; }
                .close-btn { background: rgba(255,255,255,0.07); border: none; border-radius: 10px; width: 32px; height: 32px; cursor: pointer; color: #94a3b8; font-size: 16px; transition: all 0.2s; }
                .close-btn:hover { background: rgba(255,255,255,0.12); color: #f1f5f9; }
                .field-label-m { display: block; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
                .field-input-m { width: 100%; padding: 11px 14px; font-size: 13px; font-family: inherit; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; outline: none; color: #e2e8f0; transition: all 0.2s; box-sizing: border-box; }
                .field-input-m:focus { border-color: #6366f1; background: rgba(99,102,241,0.08); }
                .field-input-m::placeholder { color: #334155; }
                .field-input-m option { background: #1e2937; }
                .error-box-m { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); color: #f87171; font-size: 13px; padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; }
                .submit-btn-m { flex: 1; padding: 13px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; box-shadow: 0 6px 20px rgba(99,102,241,0.4); transition: all 0.2s; }
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
                    {[
                        { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
                        { label: 'Items', href: '/dashboard/items', icon: '📦', active: true },
                        { label: 'Borrowings', href: '/dashboard/borrowings', icon: '🤝' },
                        { label: 'Storage', href: '/dashboard/storage', icon: '🗄️' },
                        { label: 'Audit Logs', href: '/dashboard/audit-logs', icon: '📋' },
                    ].map(item => (
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
                            <h1 className="page-title">📦 Items</h1>
                            <p className="page-sub">{items.length} items in inventory</p>
                        </div>
                        <button className="add-btn" onClick={openCreate}>➕ Add Item</button>
                    </div>

                    {/* Status chips */}
                    <div className="stats-row">
                        {[
                            { label: 'In Store', count: items.filter(i => i.status === 'in-store').length, color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
                            { label: 'Borrowed', count: items.filter(i => i.status === 'borrowed').length, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
                            { label: 'Damaged', count: items.filter(i => i.status === 'damaged').length, color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
                            { label: 'Missing', count: items.filter(i => i.status === 'missing').length, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
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
                        <input type="text" placeholder="Search by name or code..." value={search} onChange={e => setSearch(e.target.value)} className="search-input" />
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="empty-state"><div style={{ fontSize: '48px', marginBottom: '12px' }}>⏳</div><p>Loading items...</p></div>
                    ) : (
                        <div className="table-wrap">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead className="table-head">
                                    <tr>{['Image', 'Name', 'Code', 'Quantity', 'Status', 'Place', 'Actions'].map(h => <th key={h} className="th">{h}</th>)}</tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr><td colSpan={7} className="empty-state"><div style={{ fontSize: '48px' }}>📭</div><p style={{ marginTop: '12px' }}>No items found</p></td></tr>
                                    ) : filtered.map(item => {
                                        const ss = statusInfo(item.status);
                                        return (
                                            <tr key={item.id} className="tr">
                                                <td className="td">
                                                    {/* ✅ Fixed: uses env var instead of hardcoded localhost */}
                                                    {item.image
                                                        ? <img src={`${baseUrl}/storage/${item.image}`} alt={item.name} className="img-thumb" />
                                                        : <div className="img-placeholder">📦</div>
                                                    }
                                                </td>
                                                <td className="td">
                                                    <div className="item-name">{item.name}</div>
                                                    {item.description && <div className="item-desc">{item.description.substring(0, 35)}...</div>}
                                                </td>
                                                <td className="td"><span className="code-badge">{item.code}</span></td>
                                                <td className="td">
                                                    <div className="qty-wrap">
                                                        <button className="qty-btn qty-dec" onClick={() => handleQty(item, 'decrement')}>−</button>
                                                        <span className="qty-val">{item.quantity}</span>
                                                        <button className="qty-btn qty-inc" onClick={() => handleQty(item, 'increment')}>+</button>
                                                    </div>
                                                </td>
                                                <td className="td">
                                                    <span className="status-badge" style={{ background: ss.bg, color: ss.color }}>{ss.label}</span>
                                                </td>
                                                <td className="td"><span className="place-text">📍 {item.place?.name || '—'}</span></td>
                                                <td className="td">
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button className="action-btn edit-btn" onClick={() => openEdit(item)}>✏️ Edit</button>
                                                        <button className="action-btn del-btn" onClick={() => handleDelete(item.id)}>🗑️</button>
                                                    </div>
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

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3 className="modal-title">{editItem ? '✏️ Edit Item' : '➕ New Item'}</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        {error && <div className="error-box-m">⚠️ {error}</div>}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {[
                                { label: 'Item Name *', field: 'name', type: 'text', ph: 'e.g. Screwdriver' },
                                { label: 'Unique Code *', field: 'code', type: 'text', ph: 'e.g. TOOL-001' },
                                { label: 'Quantity *', field: 'quantity', type: 'number', ph: '0' },
                                { label: 'Serial Number', field: 'serial_number', type: 'text', ph: 'Optional' },
                            ].map(f => (
                                <div key={f.field}>
                                    <label className="field-label-m">{f.label}</label>
                                    <input type={f.type} value={form[f.field]} placeholder={f.ph} className="field-input-m"
                                        onChange={e => setForm({ ...form, [f.field]: f.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value })} />
                                </div>
                            ))}
                            <div>
                                <label className="field-label-m">Image</label>
                                <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="field-input-m"
                                    style={{ padding: '8px 14px' }}
                                    onChange={e => { if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]); }} />
                                {imageFile && <p style={{ color: '#4ade80', fontSize: '12px', margin: '4px 0 0' }}>✓ {imageFile.name}</p>}
                                {editItem?.image && !imageFile && (
                                    <div style={{ marginTop: '8px' }}>
                                        <img src={`${baseUrl}/storage/${editItem.image}`} alt="current" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                                        <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0' }}>Current image kept if none selected</p>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="field-label-m">Description</label>
                                <textarea value={form.description} rows={2} className="field-input-m" style={{ resize: 'vertical' }}
                                    onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div>
                                <label className="field-label-m">Storage Place *</label>
                                <select value={form.place_id} className="field-input-m" onChange={e => setForm({ ...form, place_id: e.target.value })}>
                                    <option value="">Select a place...</option>
                                    {places.map(p => <option key={p.id} value={p.id}>{p.name} ({p.cupboard?.name})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="field-label-m">Status</label>
                                <select value={form.status} className="field-input-m" onChange={e => setForm({ ...form, status: e.target.value })}>
                                    <option value="in-store">✅ In Store</option>
                                    <option value="borrowed">📤 Borrowed</option>
                                    <option value="damaged">⚠️ Damaged</option>
                                    <option value="missing">❓ Missing</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <button className="submit-btn-m" onClick={handleSubmit}>{editItem ? '✏️ Update' : '➕ Create'}</button>
                            <button className="cancel-btn-m" onClick={() => setShowModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
