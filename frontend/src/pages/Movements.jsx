import { useState, useEffect } from 'react';
import API from '../api';

export default function Movements() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState(null);
  const [form, setForm] = useState({ product_id: '', from_location: '', to_location: '', quantity: '', operation_type: 'receipt', reference: '' });

  const load = () => {
    setLoading(true);
    API.get('/stock-movements').then(r => setMovements(r.data.movements || [])).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    API.get('/products').then(r => setProducts(r.data.products || []));
    API.get('/warehouses').then(r => {
      const locs = [];
      (r.data.warehouses || []).forEach(w => (w.locations || []).forEach(l => locs.push({ ...l, warehouse_name: w.name })));
      setLocations(locs);
    });
  }, []);

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const body = {
        product_id: Number(form.product_id),
        quantity: Number(form.quantity),
        operation_type: form.operation_type,
        reference: form.reference || undefined,
        from_location: form.from_location ? Number(form.from_location) : null,
        to_location: form.to_location ? Number(form.to_location) : null,
      };
      const res = await API.post('/stock-movements', body);
      const msg = res.data.alert
        ? `Movement recorded ✅  ${res.data.alert}`
        : 'Stock movement recorded ✅';
      showAlert(msg, res.data.alert ? 'warning' : 'success');
      setShowModal(false);
      setForm({ product_id: '', from_location: '', to_location: '', quantity: '', operation_type: 'receipt', reference: '' });
      load();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed', 'error');
    }
  };

  const opTypes = [
    { value: 'receipt', label: '📥 Receipt (Stock IN)', desc: 'Goods arriving from supplier' },
    { value: 'delivery', label: '📤 Delivery (Stock OUT)', desc: 'Goods leaving to customer' },
    { value: 'transfer', label: '🔀 Transfer (Move)', desc: 'Move between locations' },
    { value: 'adjustment', label: '🎯 Adjustment', desc: 'Manual correction' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Stock Movements 🔄</div>
          <div className="page-subtitle">{movements.length} total movements recorded</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Movement</button>
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      <div className="table-wrap">
        {loading ? (
          <div className="loading"><div className="spinner" />Loading movements...</div>
        ) : movements.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔄</div>
            <div className="empty-state-text">No movements yet</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Product</th>
                <th>Qty</th>
                <th>From</th>
                <th>To</th>
                <th>Reference</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {movements.map(m => (
                <tr key={m.id}>
                  <td>
                    <span className={`badge ${opBadge(m.operation_type)}`}>
                      {opIcon(m.operation_type)} {m.operation_type}
                    </span>
                  </td>
                  <td className="td-main">{m.product_name}</td>
                  <td style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15 }}>{m.quantity}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{m.from_location_name || '—'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{m.to_location_name || '—'}</td>
                  <td><code style={{ fontSize: 12, background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 6 }}>{m.reference}</code></td>
                  <td><span className="badge badge-green">✅ Done</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">New Stock Movement</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
              {opTypes.map(op => (
                <div key={op.value}
                  onClick={() => setForm({ ...form, operation_type: op.value })}
                  style={{ padding: '12px 14px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${form.operation_type === op.value ? 'var(--accent-blue)' : 'var(--border)'}`, background: form.operation_type === op.value ? 'rgba(79,142,255,0.1)' : 'var(--bg-secondary)', transition: 'all 0.2s' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: form.operation_type === op.value ? 'var(--accent-blue)' : 'var(--text-primary)', marginBottom: 2 }}>{op.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{op.desc}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleCreate}>
              <div className="form-grid" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Product *</label>
                  <select className="form-select" value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} required>
                    <option value="">Select product</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input className="form-input" type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
                </div>
                {(form.operation_type === 'delivery' || form.operation_type === 'transfer') && (
                  <div className="form-group">
                    <label className="form-label">From Location *</label>
                    <select className="form-select" value={form.from_location} onChange={e => setForm({ ...form, from_location: e.target.value })} required>
                      <option value="">Select location</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.warehouse_name} — {l.name}</option>)}
                    </select>
                  </div>
                )}
                {(form.operation_type === 'receipt' || form.operation_type === 'transfer' || form.operation_type === 'adjustment') && (
                  <div className="form-group">
                    <label className="form-label">To Location *</label>
                    <select className="form-select" value={form.to_location} onChange={e => setForm({ ...form, to_location: e.target.value })} required>
                      <option value="">Select location</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.warehouse_name} — {l.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Reference</label>
                  <input className="form-input" placeholder="e.g. REC-001" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success">Record Movement ✅</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function opIcon(t) {
  return { receipt: '📥', delivery: '📤', transfer: '🔀', adjustment: '🎯' }[t] || '📦';
}
function opBadge(t) {
  return { receipt: 'badge-green', delivery: 'badge-red', transfer: 'badge-blue', adjustment: 'badge-yellow' }[t] || 'badge-blue';
}