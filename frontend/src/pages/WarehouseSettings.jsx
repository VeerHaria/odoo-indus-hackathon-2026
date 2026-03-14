import { useState, useEffect } from 'react';
import API from '../api';

export default function WarehouseSettings() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('warehouses');
  const [alert, setAlert] = useState(null);
  const [whForm, setWhForm] = useState({ name: '', address: '' });
  const [locForm, setLocForm] = useState({ name: '', warehouse_id: '' });
  const [deletingWh, setDeletingWh] = useState(null);
  const [deletingLoc, setDeletingLoc] = useState(null);
  const [savingWh, setSavingWh] = useState(false);
  const [savingLoc, setSavingLoc] = useState(false);

  const loadWarehouses = () => {
    setLoading(true);
    API.get('/warehouses').then(r => setWarehouses(r.data.warehouses || [])).finally(() => setLoading(false));
  };

  useEffect(() => { loadWarehouses(); }, []);

  const showAlert = (msg, type = 'success') => { setAlert({ msg, type }); setTimeout(() => setAlert(null), 3500); };

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    setSavingWh(true);
    try {
      await API.post('/warehouses', whForm);
      showAlert(`Warehouse "${whForm.name}" created ✅`);
      setWhForm({ name: '', address: '' });
      loadWarehouses();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed', 'error');
    }
    setSavingWh(false);
  };

  const handleCreateLocation = async (e) => {
    e.preventDefault();
    setSavingLoc(true);
    try {
      await API.post(`/warehouses/${locForm.warehouse_id}/locations`, { name: locForm.name });
      showAlert(`Location "${locForm.name}" added ✅`);
      setLocForm({ name: '', warehouse_id: '' });
      loadWarehouses();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed', 'error');
    }
    setSavingLoc(false);
  };

  const handleDeleteWarehouse = async (w) => {
    if (!confirm(`Delete "${w.name}" and all its locations? This cannot be undone.`)) return;
    setDeletingWh(w.id);
    try {
      await API.delete(`/warehouses/${w.id}`);
      showAlert(`Warehouse "${w.name}" deleted`);
      loadWarehouses();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to delete', 'error');
    }
    setDeletingWh(null);
  };

  const handleDeleteLocation = async (warehouseId, loc) => {
    if (!confirm(`Delete location "${loc.name}"?`)) return;
    setDeletingLoc(loc.id);
    try {
      await API.delete(`/warehouses/${warehouseId}/locations/${loc.id}`);
      showAlert(`Location "${loc.name}" deleted`);
      loadWarehouses();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to delete', 'error');
    }
    setDeletingLoc(null);
  };

  const totalLocations = warehouses.reduce((s, w) => s + (w.locations?.length || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">⚙️ Warehouse Settings</div>
          <div className="page-subtitle">{warehouses.length} warehouses · {totalLocations} locations</div>
        </div>
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        <div className="kpi-card blue"><div className="kpi-icon">🏬</div><div className="kpi-label">Warehouses</div><div className="kpi-value">{warehouses.length}</div></div>
        <div className="kpi-card green"><div className="kpi-icon">📌</div><div className="kpi-label">Locations</div><div className="kpi-value">{totalLocations}</div></div>
        <div className="kpi-card purple"><div className="kpi-icon">📦</div><div className="kpi-label">Avg Locations</div><div className="kpi-value">{warehouses.length ? Math.round(totalLocations / warehouses.length) : 0}</div></div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button className={`btn ${tab === 'warehouses' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('warehouses')}>🏬 Warehouses</button>
        <button className={`btn ${tab === 'locations' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('locations')}>📌 Locations</button>
      </div>

      {tab === 'warehouses' && (
        <div className="grid-2">
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>➕ New Warehouse</div>
            <form onSubmit={handleCreateWarehouse}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-input" placeholder="e.g. Main Warehouse" value={whForm.name} onChange={e => setWhForm({ ...whForm, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" placeholder="e.g. Industrial Area, City" value={whForm.address} onChange={e => setWhForm({ ...whForm, address: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={savingWh}>
                {savingWh ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Creating...</> : '🏬 Create Warehouse'}
              </button>
            </form>
          </div>

          <div>
            {loading ? <div className="loading"><div className="spinner" /></div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {warehouses.length === 0 && <div className="empty-state"><div className="empty-state-icon">🏬</div><div className="empty-state-text">No warehouses yet</div></div>}
                {warehouses.map(w => (
                  <div key={w.id} className="card" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>🏬 {w.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>📍 {w.address || 'No address set'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span className="badge badge-blue">{w.locations?.length || 0} locations</span>
                        <button className="btn btn-sm" style={{ background: 'rgba(255,92,122,0.08)', color: 'var(--accent-coral)', border: '1px solid rgba(255,92,122,0.2)', padding: '4px 10px' }}
                          onClick={() => handleDeleteWarehouse(w)}
                          disabled={deletingWh === w.id}>
                          {deletingWh === w.id ? '...' : '🗑'}
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(w.locations || []).map(l => (
                        <span key={l.id} style={{ padding: '4px 10px', background: 'var(--bg-secondary)', borderRadius: 6, fontSize: 12, color: 'var(--text-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 5 }}>
                          📌 {l.name}
                        </span>
                      ))}
                      {(w.locations || []).length === 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No locations yet</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'locations' && (
        <div className="grid-2">
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>➕ New Location</div>
            <div style={{ padding: '10px 14px', background: 'rgba(79,142,255,0.06)', borderRadius: 8, border: '1px solid rgba(79,142,255,0.15)', marginBottom: 20, fontSize: 12, color: 'var(--text-secondary)' }}>
              📌 Locations are storage areas inside a warehouse — racks, rooms, shelves, production floors, etc.
            </div>
            <form onSubmit={handleCreateLocation}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                <div className="form-group">
                  <label className="form-label">Warehouse *</label>
                  <select className="form-select" value={locForm.warehouse_id} onChange={e => setLocForm({ ...locForm, warehouse_id: e.target.value })} required>
                    <option value="">Select warehouse</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Location Name *</label>
                  <input className="form-input" placeholder="e.g. Rack A, Production Floor, Shelf B2" value={locForm.name} onChange={e => setLocForm({ ...locForm, name: e.target.value })} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={savingLoc}>
                {savingLoc ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Adding...</> : '📌 Add Location'}
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {warehouses.map(w => (
              <div key={w.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>🏬 {w.name}</div>
                  <span className="badge badge-gray">{w.locations?.length || 0}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(w.locations || []).map(l => (
                    <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span>📌</span> {l.name}
                      </span>
                      <button
                        onClick={() => handleDeleteLocation(w.id, l)}
                        disabled={deletingLoc === l.id}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, padding: '2px 6px', borderRadius: 4, transition: 'color 0.15s' }}
                        onMouseEnter={e => e.target.style.color = 'var(--accent-coral)'}
                        onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                      >
                        {deletingLoc === l.id ? '...' : '🗑'}
                      </button>
                    </div>
                  ))}
                  {(w.locations || []).length === 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)', padding: '6px 0' }}>No locations yet — add one above</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
