import { useState, useEffect } from 'react';
import API from '../api';

export default function Inventory() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);
  const [editQty, setEditQty] = useState('');
  const [alert, setAlert] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    API.get('/inventory/summary')
      .then(r => setStock(r.data.summary || []))
      .catch(() => API.get('/inventory').then(r => setStock(r.data.stock || [])))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const showAlert = (msg, type = 'success') => { setAlert({ msg, type }); setTimeout(() => setAlert(null), 3000); };

  const filtered = stock.filter(s => {
    const matchFilter = filter === 'all' || (filter === 'low' && s.low_stock && s.quantity > 0) || (filter === 'out' && s.quantity === 0);
    const matchSearch = !search || s.product_name?.toLowerCase().includes(search.toLowerCase()) || s.sku?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleAdjust = async (item) => {
    if (editQty === '' || editQty === null) return;
    setSaving(true);
    try {
      const stockRes = await API.get('/inventory');
      const stockItems = stockRes.data.stock || [];
      const stockItem = stockItems.find(s => s.product_id === item.product_id);
      if (!stockItem) { showAlert('No stock record found', 'error'); setSaving(false); return; }
      await API.post('/adjustments', {
        product_id: item.product_id,
        location_id: stockItem.location_id,
        counted_qty: Number(editQty),
        reason: 'Manual update from Stock page',
      });
      showAlert(`Stock updated to ${editQty} units ✅`);
      setEditId(null);
      load();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to update', 'error');
    }
    setSaving(false);
  };

  const totalStock = stock.reduce((s, i) => s + (i.total_on_hand || i.quantity || 0), 0);
  const lowCount = stock.filter(s => s.low_stock && (s.total_on_hand || s.quantity) > 0).length;
  const outCount = stock.filter(s => (s.total_on_hand || s.quantity) === 0).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">🏭 Stock Levels</div>
          <div className="page-subtitle">Live inventory — click any quantity to update inline</div>
        </div>
        <button className="btn btn-ghost" onClick={load} style={{ gap: 6 }}>🔄 Refresh</button>
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <div className="kpi-card blue"><div className="kpi-icon">📦</div><div className="kpi-label">Total SKUs</div><div className="kpi-value">{stock.length}</div></div>
        <div className="kpi-card green"><div className="kpi-icon">🏭</div><div className="kpi-label">Total Units</div><div className="kpi-value">{totalStock}</div></div>
        <div className="kpi-card coral"><div className="kpi-icon">⚠️</div><div className="kpi-label">Low Stock</div><div className="kpi-value">{lowCount}</div></div>
        <div className="kpi-card yellow"><div className="kpi-icon">🚨</div><div className="kpi-label">Out of Stock</div><div className="kpi-value">{outCount}</div></div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
          <span>🔍</span>
          <input placeholder="Search by product or SKU..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'all', label: 'All', count: stock.length },
            { key: 'low', label: '⚠️ Low', count: lowCount },
            { key: 'out', label: '🚨 Out', count: outCount },
          ].map(f => (
            <button key={f.key} className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f.key)}>
              {f.label} <span style={{ opacity: 0.7, marginLeft: 2 }}>({f.count})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        {loading ? <div className="loading"><div className="spinner" />Loading stock levels...</div>
        : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">✅</div><div className="empty-state-text">No items match this filter</div></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>On Hand</th>
                <th>Reorder Level</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const qty = s.total_on_hand !== undefined ? s.total_on_hand : s.quantity;
                const isLow = s.low_stock || (s.reorder_level && qty <= s.reorder_level && qty > 0);
                const isOut = qty === 0;
                return (
                  <tr key={i} className={isOut ? 'row-out' : isLow ? '' : 'row-in'} style={isLow && !isOut ? { background: 'rgba(255,209,102,0.04)' } : {}}>
                    <td className="td-main">{s.product_name}</td>
                    <td><span className="badge badge-blue">{s.sku}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{s.category_name || '—'}</td>
                    <td>
                      {editId === s.product_id ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input type="number" min="0" className="form-input" style={{ width: 80, padding: '5px 8px', fontSize: 14, fontWeight: 700 }} value={editQty} onChange={e => setEditQty(e.target.value)} autoFocus onKeyDown={e => { if (e.key === 'Enter') handleAdjust(s); if (e.key === 'Escape') setEditId(null); }} />
                          <button className="btn btn-success btn-sm" onClick={() => handleAdjust(s)} disabled={saving}>{saving ? '...' : '✓'}</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>✕</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            onClick={() => { setEditId(s.product_id); setEditQty(qty); }}
                            style={{ fontWeight: 700, fontSize: 16, cursor: 'pointer', color: isOut ? 'var(--accent-coral)' : isLow ? 'var(--accent-yellow)' : 'var(--accent-green)', borderBottom: '2px dashed currentColor', paddingBottom: 1, transition: 'opacity 0.15s' }}
                            title="Click to update"
                          >
                            {qty}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>✏️</span>
                        </div>
                      )}
                    </td>
                    <td><span className="badge badge-yellow">≥ {s.reorder_level}</span></td>
                    <td>
                      {isOut
                        ? <span className="badge badge-red">🚨 Out of Stock</span>
                        : isLow
                          ? <span className="badge badge-yellow">⚠️ Low Stock</span>
                          : <span className="badge badge-green">✅ Healthy</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>✏️</span>
        <span>Click any quantity number to update stock inline · Press Enter to save, Escape to cancel</span>
      </div>
    </div>
  );
}
