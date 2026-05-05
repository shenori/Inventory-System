'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../../lib/axios';
import Link from 'next/link';

export default function ItemsPage() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();

    const [items, setItems] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            try { return JSON.parse(localStorage.getItem('cache_items') || '[]'); }
            catch { return []; }
        }
        return [];
    });

    const [places, setPlaces] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [form, setForm] = useState({ name: '', code: '', quantity: 0, serial_number: '', description: '', place_id: '', status: 'in-store' });
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    const baseUrl = 'http://127.0.0.1:8000';

    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.push('/login'); return; }
        fetchItems();
        fetchPlaces();
    }, [user, authLoading]);

    const fetchItems = async () => {
        try {
            const res = await api.get('/items');
            setItems(res.data);
            localStorage.setItem('cache_items', JSON.stringify(res.data));
        } catch (err) { console.error(err); }
    };

    const fetchPlaces = async () => {
        try {
            const res = await api.get('/places');
            setPlaces(res.data);
        } catch (err) { console.error(err); }
    };

    const openCreate = () => {
        setEditItem(null); setImageFile(null);
        setForm({ name: '', code: '', quantity: 0, serial_number: '', description: '', place_id: '', status: 'in-store' });
        setError(''); setShowModal(true);
    };

    const openEdit = (item: any) => {
        setEditItem(item); setImageFile(null);
        setForm({ name: item.name, code: item.code, quantity: item.quantity, serial_number: item.serial_number || '', description: item.description || '', place_id: item.place_id, status: item.status });
        setError(''); setShowModal(true);
    };

    const handleSubmit = async () => {
        setError('');
        try {
            const fd = new FormData();
            Object.keys(form).forEach(k => {
                const val = (form as any)[k];
                if (val !== null && val !== undefined) fd.append(k, val);
            });
            if (imageFile) fd.append('image', imageFile);
            if (editItem) {
                fd.append('_method', 'PUT');
                await api.post(`/items/${editItem.id}`, fd);
            } else {
                await api.post('/items', fd);
            }
            setShowModal(false); fetchItems();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this item?')) return;
        try { await api.delete(`/items/${id}`); fetchItems(); } catch {}
    };

    const handleQty = async (item: any, type: string) => {
        try {
            await api.patch(`/items/${item.id}/quantity`, { type, amount: 1 });
            fetchItems();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error updating quantity');
        }
    };

    const filtered = items.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.code.toLowerCase().includes(search.toLowerCase())
    );

    const statusInfo = (s: string) => {
        const map: any = {
            'in-store': { bg: 'rgba(74,222,128,0.12)',  color: '#4ade80', label: '✅ In Store' },
            'borrowed': { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', label: '📤 Borrowed' },
            'damaged':  { bg: 'rgba(248,113,113,0.12)', color: '#f87171', label: '⚠️ Damaged' },
            'missing':  { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', label: '❓ Missing' },
        };
        return map[s] || map['missing'];
    };

    const navItems = [
        { label: 'Dashboard',  href: '/dashboard',            icon: '🏠' },
        { label: 'Items',      href: '/dashboard/items',      icon: '📦' },
        { label: 'Borrowings', href: '/dashboard/borrowings', icon: '🤝' },
        { label: 'Storage',    href: '/dashboard/storage',    icon: '🗄️' },
        { label: 'Audit Logs', href: '/dashboard/audit-logs', icon: '📋' },
    ];

    if (authLoading) return <div style={{ minHeight: '100vh', background: '#0d0f1a' }} />;
    if (!user) return null;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
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
                .main-content { margin-left: 210px; flex: 1; padding: 36px 32px; }
                .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
                .page-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #f1f5f9; margin: 0 0 4px; }
                .page-sub { color: #475569; font-size: 14px; margin: 0; }
                .add-btn { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; border-radius: 12px; padding: 11px 20px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; box-shadow: 0 6px 20px rgba(99,102,241,0.35); transition: all 0.2s; display: flex; align-items: center; gap: 7px; white-space: nowrap; }
                .add-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 28px rgba(99,102,241,0.45); }
                .stats-row { display: flex; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; }
                .stat-chip { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 9px 14px; display: flex; align-items: center; gap: 10px; }
                .stat-chip-label { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
                .stat-chip-count { font-weight: 800; color: #f1f5f9; font-size: 18px; }
                .search-wrap { position: relative; margin-bottom: 18px; max-width: 360px; }
                .search-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); font-size: 14px; }
                .search-input { width: 100%; padding: 10px 14px 10px 38px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; font-size: 13px; color: #e2e8f0; outline: none; font-family: inherit; transition: all 0.2s; }
                .search-input:focus { border-color: #6366f1; background: rgba(99,102,241,0.07); }
                .search-input::placeholder { color: #334155; }
                .table-wrap { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; overflow: hidden; }
                table { width: 100%; border-collapse: collapse; }
                thead { background: rgba(99,102,241,0.08); }
                th { padding: 12px 16px; text-align: left; font-size: 10px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1px solid rgba(255,255,255,0.05); }
                td { padding: 13px 16px; vertical-align: middle; border-bottom: 1px solid rgba(255,255,255,0.03); }
                tr:last-child td { border-bottom: none; }
                tr:hover td { background: rgba(255,255,255,0.02); }
                .item-name { font-weight: 700; color: #e2e8f0; font-size: 13px; }
                .item-desc { color: #475569; font-size: 11px; margin-top: 2px; }
                .code-badge { background: rgba(99,102,241,0.12); color: #a5b4fc; padding: 3px 9px; border-radius: 7px; font-size: 11.5px; font-weight: 700; font-family: monospace; border: 1px solid rgba(99,102,241,0.18); }
                .qty-wrap { display: flex; align-items: center; gap: 7px; }
                .qty-btn { width: 26px; height: 26px; border-radius: 7px; border: none; font-weight: 800; cursor: pointer; font-size: 15px; transition: all 0.15s; display: flex; align-items: center; justify-content: center; }
                .qty-dec { background: rgba(239,68,68,0.12); color: #f87171; }
                .qty-dec:hover { background: rgba(239,68,68,0.22); }
                .qty-inc { background: rgba(34,197,94,0.12); color: #4ade80; }
                .qty-inc:hover { background: rgba(34,197,94,0.22); }
                .qty-val { font-weight: 800; color: #f1f5f9; font-size: 16px; min-width: 28px; text-align: center; }
                .status-badge { padding: 4px 11px; border-radius: 20px; font-size: 11px; font-weight: 700; }
                .place-text { color: #64748b; font-size: 12px; }
                .action-btn { padding: 6px 12px; border-radius: 8px; border: none; font-weight: 700; cursor: pointer; font-size: 12px; font-family: inherit; transition: all 0.15s; }
                .edit-btn { background: rgba(139,92,246,0.12); color: #c4b5fd; }
                .edit-btn:hover { background: rgba(139,92,246,0.22); }
                .del-btn { background: rgba(239,68,68,0.1); color: #f87171; }
                .del-btn:hover { background: rgba(239,68,68,0.2); }
                .img-thumb { width: 40px; height: 40px; border-radius: 10px; object-fit: cover; border: 1px solid rgba(255,255,255,0.08); }
                .img-placeholder { width: 40px; height: 40px; border-radius: 10px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 18px; }
                .img-wrap { position: relative; display: inline-flex; }
                .empty-state { text-align: center; padding: 56px; color: #334155; }
                .empty-icon { font-size: 40px; margin-bottom: 10px; opacity: 0.35; }
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(6px); }
                .modal { background: #111827; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 28px; width: 100%; max-width: 450px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 60px rgba(0,0,0,0.6); }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; }
                .modal-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: #f1f5f9; margin: 0; }
                .close-btn { background: rgba(255,255,255,0.07); border: none; border-radius: 8px; width: 30px; height: 30px; cursor: pointer; color: #94a3b8; font-size: 14px; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
                .close-btn:hover { background: rgba(255,255,255,0.12); color: #f1f5f9; }
                .form-fields { display: flex; flex-direction: column; gap: 13px; }
                .field-label-m { display: block; font-size: 10px; font-weight: 700; color: #475569; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
                .field-input-m { width: 100%; padding: 10px 13px; font-size: 13px; font-family: inherit; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 9px; outline: none; color: #e2e8f0; transition: all 0.2s; }
                .field-input-m:focus { border-color: #6366f1; background: rgba(99,102,241,0.07); }
                .field-input-m::placeholder { color: #334155; }
                .field-input-m option { background: #1e2937; }
                .error-box-m { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); color: #f87171; font-size: 13px; padding: 11px 14px; border-radius: 9px; margin-bottom: 14px; }
                .modal-actions { display: flex; gap: 10px; margin-top: 22px; }
                .submit-btn-m { flex: 1; padding: 12px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; box-shadow: 0 6px 20px rgba(99,102,241,0.35); transition: all 0.2s; }
                .submit-btn-m:hover { transform: translateY(-1px); }
                .cancel-btn-m { flex: 1; padding: 12px; background: rgba(255,255,255,0.06); color: #94a3b8; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; }
                .cancel-btn-m:hover { background: rgba(255,255,255,0.1); }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                .fade-in { animation: fadeIn 0.3s ease forwards; }
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
                        <Link key={item.href} href={item.href} className={`nav-link${item.href === '/dashboard/items' ? ' active' : ''}`}>
                            <div className="nav-icon-wrap" style={{ background: item.href === '/dashboard/items' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)' }}>
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
                        <div>
                            <h1 className="page-title">📦 Items</h1>
                            <p className="page-sub">{items.length} item{items.length !== 1 ? 's' : ''} in inventory</p>
                        </div>
                        <button className="add-btn" onClick={openCreate}>➕ Add Item</button>
                    </div>

                    <div className="stats-row">
                        {[
                            { label: 'In Store', count: items.filter(i => i.status === 'in-store').length, color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
                            { label: 'Borrowed', count: items.filter(i => i.status === 'borrowed').length, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
                            { label: 'Damaged',  count: items.filter(i => i.status === 'damaged').length,  color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
                            { label: 'Missing',  count: items.filter(i => i.status === 'missing').length,  color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
                        ].map((s, i) => (
                            <div key={i} className="stat-chip">
                                <span className="stat-chip-label" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                                <span className="stat-chip-count">{s.count}</span>
                            </div>
                        ))}
                    </div>

                    <div className="search-wrap">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search by name or code..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    {['Image', 'Name', 'Code', 'Quantity', 'Status', 'Place', 'Actions'].map(h => (
                                        <th key={h}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={7}>
                                            <div className="empty-state">
                                                <div className="empty-icon">📭</div>
                                                <p>{search ? 'No items match your search' : 'No items yet — add your first one!'}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filtered.map(item => {
                                    const ss = statusInfo(item.status);
                                    return (
                                        <tr key={item.id}>
                                            <td>
                                                {item.image ? (
                                                    <div className="img-wrap">
                                                        <img
                                                            src={`${baseUrl}/storage/${item.image}`}
                                                            alt={item.name}
                                                            className="img-thumb"
                                                            onError={(e) => {
                                                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                                                                const sib = e.currentTarget.nextElementSibling as HTMLElement;
                                                                if (sib) sib.style.display = 'flex';
                                                            }}
                                                        />
                                                        <div className="img-placeholder" style={{ display: 'none' }}>📦</div>
                                                    </div>
                                                ) : (
                                                    <div className="img-placeholder">📦</div>
                                                )}
                                            </td>
                                            <td>
                                                <div className="item-name">{item.name}</div>
                                                {item.description && <div className="item-desc">{item.description.substring(0, 35)}{item.description.length > 35 ? '…' : ''}</div>}
                                            </td>
                                            <td><span className="code-badge">{item.code}</span></td>
                                            <td>
                                                <div className="qty-wrap">
                                                    <button className="qty-btn qty-dec" onClick={() => handleQty(item, 'decrement')}>−</button>
                                                    <span className="qty-val">{item.quantity}</span>
                                                    <button className="qty-btn qty-inc" onClick={() => handleQty(item, 'increment')}>+</button>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="status-badge" style={{ background: ss.bg, color: ss.color }}>{ss.label}</span>
                                            </td>
                                            <td><span className="place-text">📍 {item.place?.name || '—'}</span></td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '7px' }}>
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
                </main>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3 className="modal-title">{editItem ? '✏️ Edit Item' : '➕ New Item'}</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        {error && <div className="error-box-m">⚠️ {error}</div>}
                        <div className="form-fields">
                            {[
                                { label: 'Item Name *',   field: 'name',          type: 'text',   ph: 'e.g. Screwdriver' },
                                { label: 'Unique Code *', field: 'code',          type: 'text',   ph: 'e.g. TOOL-001' },
                                { label: 'Quantity *',    field: 'quantity',      type: 'number', ph: '0' },
                                { label: 'Serial Number', field: 'serial_number', type: 'text',   ph: 'Optional' },
                            ].map(f => (
                                <div key={f.field}>
                                    <label className="field-label-m">{f.label}</label>
                                    <input
                                        type={f.type}
                                        value={(form as any)[f.field]}
                                        placeholder={f.ph}
                                        className="field-input-m"
                                        onChange={e => setForm({ ...form, [f.field]: f.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value })}
                                    />
                                </div>
                            ))}

                            <div>
                                <label className="field-label-m">Image</label>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    className="field-input-m"
                                    style={{ padding: '8px 13px' }}
                                    onChange={e => {
                                        if (e.target.files && e.target.files[0]) {
                                            setImageFile(e.target.files[0]);
                                        }
                                    }}
                                />
                                {imageFile && (
                                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <img
                                            src={URL.createObjectURL(imageFile)}
                                            alt="preview"
                                            style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)' }}
                                        />
                                        <p style={{ color: '#4ade80', fontSize: '12px' }}>✓ {imageFile.name}</p>
                                    </div>
                                )}
                                {editItem?.image && !imageFile && (
                                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <img
                                            src={`${baseUrl}/storage/${editItem.image}`}
                                            alt="current"
                                            style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                        />
                                        <p style={{ color: '#64748b', fontSize: '11px' }}>Current image — upload a new one to replace</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="field-label-m">Description</label>
                                <textarea
                                    value={form.description}
                                    rows={2}
                                    className="field-input-m"
                                    style={{ resize: 'vertical' }}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                />
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
                        <div className="modal-actions">
                            <button className="submit-btn-m" onClick={handleSubmit}>{editItem ? '✏️ Update' : '➕ Create'}</button>
                            <button className="cancel-btn-m" onClick={() => setShowModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}