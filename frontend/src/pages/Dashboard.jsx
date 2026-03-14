import { useState, useEffect } from 'react';
import API from '../api';

export default function Dashboard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', warehouse_id: '' });
  const [warehouses, setWarehouses] = useState([]);

  const load = (f = filters) => {
    setLoading(true);
    const params = {};
    if (f.type) params.type = f.type;
    if (f.warehouse_id) params.warehouse_id = f.warehouse_id;
    API.get('/dashboard', { params }).then(r => setData(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    API.get('/warehouses').then(r => setWarehouses(r.data.warehouses || []));
  }, []);

  const applyFilter = (key, val) => {
    const f = { ...filters, [key]: val };
    setFilters(f);
    load(f);
  };

  const kpis = data?.kpis || {};

  if (loading && !data) return <div className="loading"><div className="spinner" />Loading dashboard...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard ⚡</div>
          <div className="page-subtitle">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select className="form-select" style={{ padding: '6px 10px', fontSize: 12 }}
            value={filters.type} onChange={e => applyFilter('type', e.target.value)}>
            <option value="">All Types</option>
            <option value="receipt">📥 Receipts</option>
            <option value="delivery">📤 Delivery</option>
            <option value="transfer">🔀 Transfer</option>
            <option value="adjustment">🎯 Adjustment</option>
          </select>
          <select className="form-select" style={{ padding: '6px 10px', fontSize: 12 }}
            value={filters.warehouse_id} onChange={e => applyFilter('warehouse_id', e.target.value)}>
            <option value="">All Warehouses</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          {(filters.type || filters.warehouse_id) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFilters({ type: '', warehouse_id: '' }); load({ type: '', warehouse_id: '' }); }}>
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Products',      value: kpis.totalProducts ?? 0,      color: 'blue',   icon: '📦' },
          { label: 'Warehouses',          value: kpis.totalWarehouses ?? 0,     color: 'green',  icon: '🏬' },
          { label: 'Low Stock',           value: kpis.lowStockCount ?? 0,       color: 'coral',  icon: '⚠️' },
          { label: 'Out of Stock',        value: kpis.outOfStockCount ?? 0,     color: 'yellow', icon: '🚨' },
          { label: 'Pending Receipts',    value: kpis.pendingReceipts ?? 0,     color: 'green',  icon: '📥' },
          { label: 'Pending Deliveries',  value: kpis.pendingDeliveries ?? 0,   color: 'coral',  icon: '📤' },
          { label: 'Scheduled Transfers', value: kpis.scheduledTransfers ?? 0,  color: 'purple', icon: '🔀' },
        ].map((kpi, i) => (
          <div key={i} className={`kpi-card ${kpi.color}`}>
            <div className="kpi-icon">{kpi.icon}</div>
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-value">{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 28 }}>
        <div className="op-card receipt" onClick={() => onNavigate('receipts')} style={{ cursor: 'pointer' }}>
          <div className="op-card-title">📥 Receipt</div>
          <button className="op-card-btn green">{kpis.pendingReceipts ?? 0} pending</button>
          <div className="op-card-stats">
            <div className="op-card-stat"><span>{kpis.doneReceipts ?? 0}</span> completed</div>
            <div className="op-card-stat"><span>{kpis.lowStockCount ?? 0}</span> low stock alerts</div>
          </div>
        </div>
        <div className="op-card delivery" onClick={() => onNavigate('deliveries')} style={{ cursor: 'pointer' }}>
          <div className="op-card-title">📤 Delivery</div>
          <button className="op-card-btn red">{kpis.pendingDeliveries ?? 0} pending</button>
          <div className="op-card-stats">
            <div className="op-card-stat"><span>{kpis.doneDeliveries ?? 0}</span> completed</div>
            <div className="op-card-stat"><span>{kpis.outOfStockCount ?? 0}</span> out of stock</div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 28 }}>
        <div className="op-card" onClick={() => onNavigate('transfers')} style={{ cursor: 'pointer', borderColor: 'rgba(79,142,255,0.2)' }}>
          <div className="op-card-title">🔀 Transfers</div>
          <button className="op-card-btn" style={{ background: 'rgba(79,142,255,0.1)', color: 'var(--accent-blue)' }}>
            {kpis.scheduledTransfers ?? 0} scheduled
          </button>
          <div className="op-card-stats">
            <div className="op-card-stat"><span>{kpis.doneTransfers ?? 0}</span> completed</div>
            <div className="op-card-stat"><span>{kpis.totalWarehouses ?? 0}</span> warehouses</div>
          </div>
        </div>
        <div className="op-card" onClick={() => onNavigate('reorder-rules')} style={{ cursor: 'pointer', borderColor: 'rgba(255,193,7,0.2)' }}>
          <div className="op-card-title">📋 Reorder Rules</div>
          <button className="op-card-btn" style={{ background: 'rgba(255,193,7,0.1)', color: '#d97706' }}>
            {kpis.lowStockCount ?? 0} need reorder
          </button>
          <div className="op-card-stats">
            <div className="op-card-stat"><span>{kpis.totalProducts ?? 0}</span> total products</div>
            <div className="op-card-stat"><span>{kpis.outOfStockCount ?? 0}</span> out of stock</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>⚠️ Low Stock Alerts</h3>
            <span className="badge badge-red">{data?.lowStockItems?.length ?? 0} items</span>
          </div>
          {!data?.lowStockItems?.length ? (
            <div className="empty-state"><div className="empty-state-icon">✅</div><div className="empty-state-text">All stock levels healthy</div></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.lowStockItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,92,122,0.06)', borderRadius: 8, border: '1px solid rgba(255,92,122,0.12)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.location_name} · {item.warehouse_name}</div>
                  </div>
                  <span className="badge badge-red">{item.quantity} left</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>🔄 Recent Movements</h3>
          </div>
          {!data?.recentMovements?.length ? (
            <div className="empty-state"><div className="empty-state-icon">📭</div><div className="empty-state-text">No movements yet</div></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.recentMovements.map((m, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 8,
                  background: m.operation_type === 'receipt' ? 'rgba(0,229,160,0.05)' : m.operation_type === 'delivery' ? 'rgba(255,92,122,0.05)' : 'var(--bg-secondary)',
                  border: `1px solid ${m.operation_type === 'receipt' ? 'rgba(0,229,160,0.1)' : m.operation_type === 'delivery' ? 'rgba(255,92,122,0.1)' : 'var(--border)'}`,
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{m.product_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{m.operation_type} · {m.reference}</div>
                  </div>
                  <span className={`badge ${m.operation_type === 'receipt' ? 'badge-green' : m.operation_type === 'delivery' ? 'badge-red' : m.operation_type === 'transfer' ? 'badge-blue' : 'badge-yellow'}`}>
                    ×{m.quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
