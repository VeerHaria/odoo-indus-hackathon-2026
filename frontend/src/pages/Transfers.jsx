import { useState, useEffect } from 'react';
import API from '../api';

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState(null);
  const [filters, setFilters] = useState({ status: '' });
  const [form, setForm] = useState({ product_id: '', from_location: '', to_location: '', quantity: '', reference: '' });

  const load = (f = filters) => {
    setLoading(true);
    const params = {};
    if (f.status) params.status = f.status;
    API.get('/transfers', { params }).then(r => setTransfers(r.data.transfers || [])).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    API.get('/products').then(r => setProducts(r.data.products || []));
    API.get('/warehouses/all-locations').then(r => setLocations(r.data.locations || []));
  }, []);

  const showAlertMsg = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await API.post('/transfers', {
        product_id: Number(form.product_id),
        from_location: Number(form.from_location),
        to_location: Number(form.to_location),
        quantity: Number(form.quantity),
        reference: form.reference || undefined,
      });
      showAlertMsg('Transfer completed ✅');
      setShowModal(false);
      setForm({ product_id: '', from_location: '', to_location: '', quantity: '', reference: '' });
      load();
    } catch (err) {
      showAlertMsg(err.response?.data?.message || 'Transfer failed', 'error');
    }
  };

  const statusColor = (s) => {
    if (s === 'done') return 'badge-green';
    if (s === 'cancelled') return 'badge-red';
    if (s === 'ready') return 'badge-blue';
    return 'badge-yellow';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">🔀 Internal Transfers</div>
          <div className="page-subtitle">{transfers.length} transfers · Move stock between locations</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="form-select" style={{ padding: '6px 10px', fontSize: 12 }}
            value={filters.status} onChange={e => { const f = { ...filters, status: e.target.value }; setFilters(f); load(f); }}>
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="waiting">Waiting</option>
            <option value="ready">Ready</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Transfer</button>
        </div>
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      <div style={{ padding: '12px 16px', background: 'rgba(79,142,255,0.06)', border: '1px solid rgba(79,142,255,0.15)', borderRadius: 10, marginBottom: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
        🔀 Internal transfers move stock <strong>inside</strong> your company — between warehouses, racks, or production floors. Total stock stays the same, only the location changes.
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="loading"><div className="spinner" />Loading transfers...</div>
        ) : transfers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔀</div>
            <div className="empty-state-text">No transfers yet — click New Transfer to move stock between locations</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Product</th>
                <th>From</th>
                <th>To</th>
                <th>Quantity</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map(t => (
                <tr key={t.id}>
                  <td><code style={{ fontSize: 12, color: 'var(--accent-blue)' }}>{t.reference}</code></td>
                  <td>{t.product_name} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({t.sku})</span></td>
                  <td>
                    <div style={{ fontSize: 13 }}>{t.from_location_name || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.from_warehouse_name || ''}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>{t.to_location_name || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.to_warehouse_name || ''}</div>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>↔ {t.quantity}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td><span className={`badge ${statusColor(t.status)}`}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🔀 New Internal Transfer</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div style={{ padding: '10px 14px', background: 'rgba(79,142,255,0.06)', borderRadius: 8, border: '1px solid rgba(79,142,255,0.12)', marginBottom: 20, fontSize: 12, color: 'var(--text-secondary)' }}>
              Stock will move from the source location to the destination. Total quantity stays the same.
            </div>

            <form onSubmit={handleCreate}>
              <div className="form-grid" style={{ marginBottom: 16 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Product *</label>
                  <select className="form-select" value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} required>
                    <option value="">Select product</option>
                    {products.map(p => <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">From Location *</label>
                  <select className="form-select" value={form.from_location} onChange={e => setForm({ ...form, from_location: e.target.value })} required>
                    <option value="">Source location</option>
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.warehouse_name} — {l.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">To Location *</label>
                  <select className="form-select" value={form.to_location} onChange={e => setForm({ ...form, to_location: e.target.value })} required>
                    <option value="">Destination location</option>
                    {locations.filter(l => l.id !== Number(form.from_location)).map(l => (
                      <option key={l.id} value={l.id}>{l.warehouse_name} — {l.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input className="form-input" type="number" min="1" value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Reference</label>
                  <input className="form-input" placeholder="e.g. TRF-001" value={form.reference}
                    onChange={e => setForm({ ...form, reference: e.target.value })} />
                </div>
              </div>

              {form.from_location && form.to_location && form.from_location === form.to_location && (
                <div className="alert alert-error">Source and destination cannot be the same location</div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"
                  disabled={form.from_location && form.to_location && form.from_location === form.to_location}>
                  🔀 Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
