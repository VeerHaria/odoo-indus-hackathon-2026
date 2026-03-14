import { useState, useEffect } from 'react';
import API from '../api';

export default function MoveHistory() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    API.get('/stock-movements')
      .then(r => setMovements(r.data.movements || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = movements.filter(m => {
    const matchSearch = !search || m.reference?.toLowerCase().includes(search.toLowerCase()) || m.product_name?.toLowerCase().includes(search.toLowerCase()) || m.sku?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || m.operation_type === filter;
    const matchDate = (!dateFrom || new Date(m.operation_date) >= new Date(dateFrom)) && (!dateTo || new Date(m.operation_date) <= new Date(dateTo));
    return matchSearch && matchFilter && matchDate;
  });

  const handleExportCSV = () => {
    const headers = ['Reference', 'Date', 'Type', 'Product', 'SKU', 'From', 'To', 'Quantity'];
    const rows = filtered.map(m => [
      m.reference, m.operation_date ? new Date(m.operation_date).toLocaleDateString() : '',
      m.operation_type, m.product_name, m.sku || '',
      m.from_location_name || 'Vendor', m.to_location_name || 'Customer', m.quantity
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `move-history-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const counts = {
    all: movements.length,
    receipt: movements.filter(m => m.operation_type === 'receipt').length,
    delivery: movements.filter(m => m.operation_type === 'delivery').length,
    transfer: movements.filter(m => m.operation_type === 'transfer').length,
    adjustment: movements.filter(m => m.operation_type === 'adjustment').length,
  };

  const typeConfig = {
    receipt:    { color: 'var(--accent-green)', badge: 'badge-green', symbol: '+', label: '📥 Receipt' },
    delivery:   { color: 'var(--accent-coral)', badge: 'badge-red', symbol: '-', label: '📤 Delivery' },
    transfer:   { color: 'var(--accent-blue)', badge: 'badge-blue', symbol: '↔', label: '🔀 Transfer' },
    adjustment: { color: 'var(--accent-yellow)', badge: 'badge-yellow', symbol: '±', label: '🎯 Adjustment' },
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">📋 Move History</div>
          <div className="page-subtitle">{movements.length} total movements — complete audit trail</div>
        </div>
        <button className="btn btn-ghost" onClick={handleExportCSV} style={{ gap: 6 }}>📥 Export CSV</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <div className="kpi-card green"><div className="kpi-icon">📥</div><div className="kpi-label">Receipts</div><div className="kpi-value">{counts.receipt}</div></div>
        <div className="kpi-card coral"><div className="kpi-icon">📤</div><div className="kpi-label">Deliveries</div><div className="kpi-value">{counts.delivery}</div></div>
        <div className="kpi-card blue"><div className="kpi-icon">🔀</div><div className="kpi-label">Transfers</div><div className="kpi-value">{counts.transfer}</div></div>
        <div className="kpi-card yellow"><div className="kpi-icon">🎯</div><div className="kpi-label">Adjustments</div><div className="kpi-value">{counts.adjustment}</div></div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
          <span>🔍</span>
          <input placeholder="Search reference, product, SKU..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>}
        </div>
        <input type="date" className="form-input" style={{ width: 150 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="From date" />
        <input type="date" className="form-input" style={{ width: 150 }} value={dateTo} onChange={e => setDateTo(e.target.value)} title="To date" />
        {(dateFrom || dateTo) && <button className="btn btn-ghost btn-sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>✕ Clear dates</button>}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {['all', 'receipt', 'delivery', 'transfer', 'adjustment'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>
            {f === 'all' ? `All (${counts.all})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${counts[f]})`}
          </button>
        ))}
      </div>

      {filtered.length !== movements.length && (
        <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
          Showing <b style={{ color: 'var(--text-primary)' }}>{filtered.length}</b> of {movements.length} movements
        </div>
      )}

      <div className="table-wrap">
        {loading ? <div className="loading"><div className="spinner" />Loading history...</div>
        : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-text">No movements match your filters</div></div>
        ) : (
          <table>
            <thead>
              <tr><th>Reference</th><th>Type</th><th>Date</th><th>Product</th><th>From</th><th>To</th><th>Qty</th><th>Status</th></tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const cfg = typeConfig[m.operation_type] || { color: 'var(--text-muted)', badge: 'badge-gray', symbol: '·', label: m.operation_type };
                return (
                  <tr key={m.id} className={m.operation_type === 'receipt' ? 'row-in' : m.operation_type === 'delivery' ? 'row-out' : ''}>
                    <td><code style={{ fontSize: 12, color: cfg.color, fontWeight: 700 }}>{m.reference}</code></td>
                    <td><span className={`badge ${cfg.badge}`}>{cfg.label}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{m.operation_date ? new Date(m.operation_date).toLocaleDateString() : '—'}</td>
                    <td className="td-main">{m.product_name} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({m.sku})</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{m.from_location_name || 'Vendor'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{m.to_location_name || 'Customer'}</td>
                    <td><span style={{ fontWeight: 700, color: cfg.color }}>{cfg.symbol}{m.quantity}</span></td>
                    <td><span className={`badge ${cfg.badge}`}>✅ Done</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
