import { useState, useEffect } from 'react';
import API from '../api';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState(null);
  const [form, setForm] = useState({ name: '', address: '' });
  const [locForm, setLocForm] = useState({ warehouseId: '', name: '' });
  const [showLocModal, setShowLocModal] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all(
      [API.get('/warehouses').then(r => r.data.warehouses || [])]
    ).then(async ([ws]) => {
      const full = await Promise.all(ws.map(w => API.get(`/warehouses/${w.id}`).then(r => r.data)));
      setWarehouses(full);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await API.post('/warehouses', form);
      showAlert('Warehouse created ✅');
      setShowModal(false);
      setForm({ name: '', address: '' });
      load();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed', 'error');
    }
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/warehouses/${locForm.warehouseId}/locations`, { name: locForm.name });
      showAlert('Location added ✅');
      setShowLocModal(false);
      setLocForm({ warehouseId: '', name: '' });
      load();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Warehouses 🏬</div>
          <div className="page-subtitle">Manage warehouse locations</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setShowLocModal(true)}>+ Add Location</button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Warehouse</button>
        </div>
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      {loading ? (
        <div className="loading"><div className="spinner" />Loading warehouses...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {warehouses.map(w => (
            <div key={w.id} className="card" style={{ border: '1px solid var(--border-bright)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>🏬 {w.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>📍 {w.address || 'No address'}</div>
                </div>
                <span className="badge badge-blue">{w.locations?.length || 0} locations</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(w.locations || []).map(l => (
                  <span key={l.id} style={{ padding: '6px 12px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                    📌 {l.name}
                  </span>
                ))}
                {(w.locations || []).length === 0 && (
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>No locations yet</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">New Warehouse</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-grid" style={{ marginBottom: 20 }}>
                <div className="form-group">
                  <label className="form-label">Warehouse Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Warehouse</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLocModal && (
        <div className="modal-overlay" onClick={() => setShowLocModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Add Location</span>
              <button className="modal-close" onClick={() => setShowLocModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddLocation}>
              <div className="form-grid" style={{ marginBottom: 20 }}>
                <div className="form-group">
                  <label className="form-label">Warehouse *</label>
                  <select className="form-select" value={locForm.warehouseId} onChange={e => setLocForm({ ...locForm, warehouseId: e.target.value })} required>
                    <option value="">Select warehouse</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Location Name *</label>
                  <input className="form-input" placeholder="e.g. Rack A, Production Floor" value={locForm.name} onChange={e => setLocForm({ ...locForm, name: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowLocModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Location</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}