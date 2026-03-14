import { useState, useEffect } from 'react';
import API from '../api';

export default function ReorderRules() {
  const [rules, setRules] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ product_id: '', min_qty: '', max_qty: '' });
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        API.get('/reorder-rules'),
        API.get('/reorder-rules/alerts'),
        API.get('/products'),
      ]);
      setRules(r1.data.rules);
      setAlerts(r2.data.alerts);
      setProducts(r3.data.products);
    } catch (e) {
      setError('Failed to load data.');
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    setError(''); setMsg('');
    try {
      if (editId) {
        await API.put(`/reorder-rules/${editId}`, {
          min_qty: Number(form.min_qty),
          max_qty: Number(form.max_qty),
        });
        setMsg('Reorder rule updated ✅');
      } else {
        await API.post('/reorder-rules', {
          product_id: Number(form.product_id),
          min_qty: Number(form.min_qty),
          max_qty: Number(form.max_qty),
        });
        setMsg('Reorder rule created ✅');
      }
      setForm({ product_id: '', min_qty: '', max_qty: '' });
      setEditId(null);
      setShowForm(false);
      fetchAll();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save rule.');
    }
  };

  const handleEdit = (rule) => {
    setForm({ product_id: rule.product_id, min_qty: rule.min_qty, max_qty: rule.max_qty });
    setEditId(rule.id);
    setShowForm(true);
    setError(''); setMsg('');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this reorder rule?')) return;
    try {
      await API.delete(`/reorder-rules/${id}`);
      setMsg('Deleted ✅');
      fetchAll();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete.');
    }
  };

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 Reorder Rules</h1>
          <p className="page-subtitle">Set minimum and maximum stock thresholds</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ product_id: '', min_qty: '', max_qty: '' }); }}>
          + Add Rule
        </button>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#ef4444', marginBottom: 12 }}>
            ⚠️ {alerts.length} Product(s) Need Reordering Now
          </h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {alerts.map(a => (
              <div key={a.id} style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 8, padding: '12px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{a.product_name}</span>
                  <span style={{ color: '#6b7280', marginLeft: 8 }}>{a.sku}</span>
                </div>
                <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
                  <span>Current: <b style={{ color: '#ef4444' }}>{a.current_stock}</b></span>
                  <span>Min: <b>{a.min_qty}</b></span>
                  <span>Suggest Order: <b style={{ color: '#2563eb' }}>{a.order_qty_suggested}</b></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, fontWeight: 700 }}>{editId ? 'Edit Rule' : 'New Reorder Rule'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
            {!editId && (
              <select className="input" value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}>
                <option value="">Select Product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
            )}
            <input className="input" type="number" placeholder="Min Qty" value={form.min_qty}
              onChange={e => setForm({ ...form, min_qty: e.target.value })} />
            <input className="input" type="number" placeholder="Max Qty" value={form.max_qty}
              onChange={e => setForm({ ...form, max_qty: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editId ? 'Update' : 'Create'}
            </button>
            <button className="btn btn-secondary" onClick={() => { setShowForm(false); setEditId(null); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rules Table */}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Current Stock</th>
              <th>Min Qty</th>
              <th>Max Qty</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#6b7280' }}>No reorder rules yet</td></tr>
            ) : rules.map(r => (
              <tr key={r.id}>
                <td>{r.product_name}</td>
                <td><span className="badge">{r.sku}</span></td>
                <td style={{ color: r.needs_reorder ? '#ef4444' : '#22c55e', fontWeight: 700 }}>
                  {r.current_stock}
                </td>
                <td>{r.min_qty}</td>
                <td>{r.max_qty}</td>
                <td>
                  <span style={{
                    padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: r.needs_reorder ? '#fef2f2' : '#f0fdf4',
                    color: r.needs_reorder ? '#ef4444' : '#16a34a'
                  }}>
                    {r.needs_reorder ? '⚠️ Reorder' : '✅ OK'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => handleEdit(r)}>Edit</button>
                    <button className="btn" style={{ padding: '4px 10px', fontSize: 12, background: '#fef2f2', color: '#ef4444' }}
                      onClick={() => handleDelete(r.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
