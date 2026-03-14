import { useState, useEffect } from 'react';
import API from '../api';

export default function Adjustments() {
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ product_id: '', location_id: '', counted_qty: '', reason: '' });

  const currentStock = stock.find(s => s.product_id === Number(form.product_id) && s.location_id === Number(form.location_id));
  const recordedQty = currentStock ? currentStock.quantity : 0;
  const countedQty = form.counted_qty !== '' ? Number(form.counted_qty) : null;
  const difference = countedQty !== null ? countedQty - recordedQty : null;

  const load = () => {
    setLoading(true);
    API.get('/adjustments').then(r => setAdjustments(r.data.adjustments || [])).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    API.get('/products').then(r => setProducts(r.data.products || []));
    API.get('/warehouses/all-locations').then(r => setLocations(r.data.locations || []));
    API.get('/inventory').then(r => setStock(r.data.stock || []));
  }, []);

  const showAlert = (msg, type = 'success') => { setAlert({ msg, type }); setTimeout(() => setAlert(null), 4000); };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await API.post('/adjustments', {
        product_id: Number(form.product_id),
        location_id: Number(form.location_id),
        counted_qty: Number(form.counted_qty),
        reason: form.reason,
      });
      const msg = res.data.alert ? `${res.data.message} — ${res.data.alert}` : res.data.message;
      showAlert(msg, res.data.alert ? 'warning' : 'success');
      setShowModal(false);
      setForm({ product_id: '', location_id: '', counted_qty: '', reason: '' });
      load();
      API.get('/inventory').then(r => setStock(r.data.stock || []));
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed', 'error');
    }
    setSubmitting(false);
  };

  const filtered = adjustments.filter(a =>
    !search || a.product_name?.toLowerCase().includes(search.toLowerCase()) || a.reason?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPositive = adjustments.filter(a => a.difference > 0).reduce((s, a) => s + a.difference, 0);
  const totalNegative = adjustments.filter(a => a.difference < 0).reduce((s, a) => s + a.difference, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">🎯 Adjustments</div>
          <div className="page-subtitle">Physical count corrections and audit trail</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Adjustment</button>
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        <div className="kpi-card blue"><div className="kpi-icon">🎯</div><div className="kpi-label">Total Adjustments</div><div className="kpi-value">{adjustments.length}</div></div>
        <div className="kpi-card green"><div className="kpi-icon">➕</div><div className="kpi-label">Total Added</div><div className="kpi-value">+{totalPositive}</div></div>
        <div className="kpi-card coral"><div className="kpi-icon">➖</div><div className="kpi-label">Total Removed</div><div className="kpi-value">{totalNegative}</div></div>
      </div>

      <div className="search-bar">
        <span>🔍</span>
        <input placeholder="Search by product or reason..." value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>}
      </div>

      <div className="table-wrap">
        {loading ? <div className="loading"><div className="spinner" />Loading...</div>
        : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🎯</div><div className="empty-state-text">No adjustments recorded yet</div></div>
        ) : (
          <table>
            <thead>
              <tr><th>Product</th><th>Location</th><th>Before</th><th>After</th><th>Difference</th><th>Reason</th><th>Date</th></tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td className="td-main">{a.product_name} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({a.sku})</span></td>
                  <td><span style={{ fontSize: 12 }}>{a.location_name}</span> <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {a.warehouse_name}</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{a.recorded_qty}</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{a.counted_qty}</td>
                  <td>
                    <span className={`badge ${a.difference > 0 ? 'badge-green' : a.difference < 0 ? 'badge-red' : 'badge-blue'}`}>
                      {a.difference > 0 ? `+${a.difference}` : a.difference === 0 ? '±0' : a.difference}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 200 }}>{a.reason}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(a.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🎯 New Stock Adjustment</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div style={{ padding: '10px 14px', background: 'rgba(255,209,102,0.08)', borderRadius: 10, border: '1px solid rgba(255,209,102,0.2)', marginBottom: 20, fontSize: 13, color: 'var(--accent-yellow)' }}>
              ⚠️ Use after a physical count to correct system quantities. This updates actual stock.
            </div>

            <form onSubmit={handleCreate}>
              <div className="form-grid" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Product *</label>
                  <select className="form-select" value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value, counted_qty: '' })} required>
                    <option value="">Select product</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Location *</label>
                  <select className="form-select" value={form.location_id} onChange={e => setForm({ ...form, location_id: e.target.value, counted_qty: '' })} required>
                    <option value="">Select location</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.warehouse_name} — {l.name}</option>)}
                  </select>
                </div>
              </div>

              {form.product_id && form.location_id && (
                <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>System stock:</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-blue)' }}>{recordedQty} units</span>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Physical Count (Actual Qty) *</label>
                <input className="form-input" type="number" min="0" placeholder="Enter actual quantity you counted" value={form.counted_qty} onChange={e => setForm({ ...form, counted_qty: e.target.value })} required style={{ fontSize: 18, fontWeight: 700, textAlign: 'center' }} />
              </div>

              {difference !== null && (
                <div style={{ padding: '14px 16px', borderRadius: 10, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: difference > 0 ? 'rgba(0,229,160,0.08)' : difference < 0 ? 'rgba(255,92,122,0.08)' : 'rgba(79,142,255,0.08)', border: `1px solid ${difference > 0 ? 'rgba(0,229,160,0.25)' : difference < 0 ? 'rgba(255,92,122,0.25)' : 'rgba(79,142,255,0.25)'}` }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {difference > 0 ? '📈 Stock will increase' : difference < 0 ? '📉 Stock will decrease' : '✅ No change'}
                  </span>
                  <span style={{ fontSize: 24, fontWeight: 800, color: difference > 0 ? 'var(--accent-green)' : difference < 0 ? 'var(--accent-coral)' : 'var(--accent-blue)' }}>
                    {difference > 0 ? `+${difference}` : difference === 0 ? '±0' : difference}
                  </span>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Reason</label>
                <input className="form-input" placeholder="e.g. Damaged items found, Physical count discrepancy..." value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : '✅ Record Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
