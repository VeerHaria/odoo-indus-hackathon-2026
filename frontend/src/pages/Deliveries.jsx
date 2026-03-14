import { useState, useEffect } from 'react';
import API from '../api';

export default function Deliveries() {
  const [view, setView] = useState('list');
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [search, setSearch] = useState('');
  const [validating, setValidating] = useState(false);
  const [form, setForm] = useState({ customer_id: '', scheduleDate: '', from_location: '', lines: [{ product_id: '', quantity: '' }] });

  const deliveries = movements.filter(m => m.operation_type === 'delivery');
  const filtered = deliveries.filter(m =>
    !search || m.reference?.toLowerCase().includes(search.toLowerCase()) || m.product_name?.toLowerCase().includes(search.toLowerCase())
  );

  const loadAll = () => {
    setLoading(true);
    API.get('/stock-movements').then(r => setMovements(r.data.movements || [])).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
    API.get('/products').then(r => setProducts(r.data.products || []));
    API.get('/customers').then(r => setCustomers(r.data.customers || []));
    API.get('/inventory').then(r => setStock(r.data.stock || []));
    API.get('/warehouses/all-locations').then(r => setLocations(r.data.locations || []));
  }, []);

  const showAlert = (msg, type = 'success') => { setAlert({ msg, type }); setTimeout(() => setAlert(null), 4000); };
  const addLine = () => setForm({ ...form, lines: [...form.lines, { product_id: '', quantity: '' }] });
  const removeLine = (i) => { if (form.lines.length === 1) return; setForm({ ...form, lines: form.lines.filter((_, idx) => idx !== i) }); };
  const updateLine = (i, field, val) => { const lines = [...form.lines]; lines[i] = { ...lines[i], [field]: val }; setForm({ ...form, lines }); };

  const refNum = `WH/OUT/${String(deliveries.length + 1).padStart(4, '0')}`;
  const validLines = form.lines.filter(l => l.product_id && l.quantity);
  const totalQty = form.lines.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);

  const getAvailableStock = (productId, locationId) => {
    if (!productId || !locationId) return null;
    const s = stock.find(s => s.product_id === Number(productId) && s.location_id === Number(locationId));
    return s ? s.quantity : 0;
  };

  const hasStockError = form.lines.some(l => {
    const avail = getAvailableStock(l.product_id, form.from_location);
    return avail !== null && l.quantity && Number(l.quantity) > avail;
  });

  const handleValidate = async () => {
    if (!form.from_location) { showAlert('Please select a source location', 'error'); return; }
    if (validLines.length === 0) { showAlert('Please add at least one product', 'error'); return; }
    if (hasStockError) { showAlert('Some products exceed available stock', 'error'); return; }
    setValidating(true);
    try {
      for (const line of validLines) {
        await API.post('/stock-movements', {
          product_id: Number(line.product_id),
          quantity: Number(line.quantity),
          operation_type: 'delivery',
          from_location: Number(form.from_location),
          to_location: null,
          reference: refNum,
          customer_id: form.customer_id ? Number(form.customer_id) : undefined,
        });
      }
      showAlert(`Delivery ${refNum} validated ✅ — ${totalQty} units dispatched`);
      setView('list');
      setForm({ customer_id: '', scheduleDate: '', from_location: '', lines: [{ product_id: '', quantity: '' }] });
      loadAll();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Validation failed', 'error');
    }
    setValidating(false);
  };

  const handlePrint = () => {
    const customerName = customers.find(c => c.id === Number(form.customer_id))?.name || 'N/A';
    const srcLocation = locations.find(l => l.id === Number(form.from_location));
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Delivery ${refNum}</title>
      <style>body{font-family:monospace;padding:30px;max-width:600px;margin:0 auto}h1{font-size:18px;margin-bottom:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f5f5f5}.footer{margin-top:30px;font-size:12px;color:#666}</style>
      </head><body>
      <h1>DELIVERY ORDER: ${refNum}</h1>
      <p><b>Customer:</b> ${customerName}</p>
      <p><b>From:</b> ${srcLocation ? `${srcLocation.warehouse_name} — ${srcLocation.name}` : 'N/A'}</p>
      <p><b>Date:</b> ${form.scheduleDate || new Date().toLocaleDateString()}</p>
      <br/>
      <table><tr><th>Product</th><th>SKU</th><th>Quantity</th></tr>
      ${validLines.map(l => { const p = products.find(p => p.id === Number(l.product_id)); return `<tr><td>${p?.name||''}</td><td>${p?.sku||''}</td><td>${l.quantity}</td></tr>`; }).join('')}
      </table>
      <p><b>Total Units:</b> ${totalQty}</p>
      <div class="footer">Generated by CoreInventory · ${new Date().toLocaleString()}</div>
      </body></html>`);
    w.document.close();
    w.print();
  };

  if (view === 'new') return (
    <div style={{ animation: 'pageEnter 0.3s ease' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setView('list')}>← Back</button>
          <div>
            <div className="page-title">📤 New Delivery</div>
            <div className="page-subtitle">Stock OUT to customer</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="stepper">
            {['Draft','Waiting','Ready','Done'].map((s, i) => (
              <span key={s} className={`stepper-step ${i === 0 ? 'active' : ''}`}>
                {i > 0 && <span className="stepper-arrow">›</span>}{s}
              </span>
            ))}
          </div>
          <code style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent-coral)', background: 'rgba(255,92,122,0.1)', padding: '6px 12px', borderRadius: 8 }}>{refNum}</code>
        </div>
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Delivery Details</div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Deliver To (Customer)</label>
                <select className="form-select" value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}>
                  <option value="">Select customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">From Location *</label>
                <select className="form-select" value={form.from_location} onChange={e => setForm({ ...form, from_location: e.target.value })} required>
                  <option value="">Select location</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.warehouse_name} — {l.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Schedule Date</label>
                <input className="form-input" type="date" value={form.scheduleDate} onChange={e => setForm({ ...form, scheduleDate: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Products</div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{validLines.length} item{validLines.length !== 1 ? 's' : ''} · {totalQty} total units</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 36px', gap: 8, padding: '6px 0', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Product</span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Quantity</span>
              <span />
            </div>
            {form.lines.map((line, i) => {
              const avail = getAvailableStock(line.product_id, form.from_location);
              const outOfStock = avail !== null && line.quantity && Number(line.quantity) > avail;
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 36px', gap: 8, marginBottom: 8, alignItems: 'start', padding: '10px 12px', background: outOfStock ? 'rgba(255,92,122,0.06)' : 'var(--bg-secondary)', borderRadius: 10, border: `1px solid ${outOfStock ? 'var(--accent-coral)' : 'var(--border)'}` }}>
                  <div>
                    <select className="form-select" style={{ background: 'transparent', border: 'none', padding: '4px 0' }} value={line.product_id} onChange={e => updateLine(i, 'product_id', e.target.value)}>
                      <option value="">Select product</option>
                      {products.map(p => <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
                    </select>
                    {form.from_location && line.product_id && (
                      <div style={{ fontSize: 11, marginTop: 4, color: outOfStock ? 'var(--accent-coral)' : 'var(--accent-green)' }}>
                        {outOfStock ? `⚠️ Only ${avail} available` : `✅ ${avail} in stock`}
                      </div>
                    )}
                  </div>
                  <input className="form-input" type="number" min="1" placeholder="0" value={line.quantity} onChange={e => updateLine(i, 'quantity', e.target.value)} style={{ textAlign: 'center', fontWeight: 700, borderColor: outOfStock ? 'var(--accent-coral)' : '' }} />
                  <button onClick={() => removeLine(i)} disabled={form.lines.length === 1} style={{ background: 'none', border: 'none', color: form.lines.length === 1 ? 'var(--text-muted)' : 'var(--accent-coral)', cursor: form.lines.length === 1 ? 'not-allowed' : 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}>✕</button>
                </div>
              );
            })}
            <button onClick={addLine} style={{ width: '100%', padding: '10px', background: 'rgba(255,92,122,0.06)', border: '1px dashed var(--accent-coral)', borderRadius: 10, color: 'var(--accent-coral)', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginTop: 4, transition: 'all 0.15s' }}>
              + Add Product Line
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ background: 'rgba(255,92,122,0.06)', border: '1px solid rgba(255,92,122,0.2)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-coral)', textTransform: 'uppercase', marginBottom: 12 }}>Summary</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Products</span>
              <span style={{ fontWeight: 700 }}>{validLines.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Units</span>
              <span style={{ fontWeight: 700, color: 'var(--accent-coral)', fontSize: 18 }}>{totalQty}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Source</span>
              <span style={{ fontWeight: 600, fontSize: 12, textAlign: 'right', color: 'var(--text-secondary)' }}>{form.from_location ? locations.find(l => l.id === Number(form.from_location))?.name || '—' : '—'}</span>
            </div>
            {hasStockError && <div style={{ marginTop: 12, padding: '8px 10px', background: 'rgba(255,92,122,0.1)', borderRadius: 8, fontSize: 12, color: 'var(--accent-coral)' }}>⚠️ Stock shortage detected</div>}
          </div>

          <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15 }} onClick={handleValidate} disabled={validating || validLines.length === 0 || !form.from_location || hasStockError}>
            {validating ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Validating...</> : '✅ Validate Delivery'}
          </button>
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={handlePrint}>🖨️ Print Order</button>
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setView('list')}>✕ Cancel</button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">📤 Deliveries</div>
          <div className="page-subtitle">{deliveries.length} deliveries · Stock OUT operations</div>
        </div>
        <button className="btn btn-primary" onClick={() => setView('new')}>+ New Delivery</button>
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        <div className="kpi-card coral"><div className="kpi-icon">📤</div><div className="kpi-label">Total Deliveries</div><div className="kpi-value">{deliveries.length}</div></div>
        <div className="kpi-card yellow"><div className="kpi-icon">📦</div><div className="kpi-label">Units Dispatched</div><div className="kpi-value">{deliveries.reduce((s, m) => s + m.quantity, 0)}</div></div>
        <div className="kpi-card blue"><div className="kpi-icon">👥</div><div className="kpi-label">Customers</div><div className="kpi-value">{customers.length}</div></div>
      </div>

      <div className="search-bar">
        <span>🔍</span>
        <input placeholder="Search by reference or product..." value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>}
      </div>

      <div className="table-wrap">
        {loading ? <div className="loading"><div className="spinner" />Loading...</div>
        : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📤</div><div className="empty-state-text">No deliveries yet — click New Delivery to create one</div></div>
        ) : (
          <table>
            <thead><tr><th>Reference</th><th>Product</th><th>From</th><th>Qty</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} className="row-out">
                  <td><code style={{ fontSize: 12, color: 'var(--accent-coral)', fontWeight: 700 }}>{m.reference}</code></td>
                  <td className="td-main">{m.product_name} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({m.sku})</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{m.from_location_name || '—'}</td>
                  <td><span style={{ fontWeight: 700, color: 'var(--accent-coral)', fontSize: 15 }}>-{m.quantity}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{m.operation_date ? new Date(m.operation_date).toLocaleDateString() : '—'}</td>
                  <td><span className="badge badge-green">✅ Done</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
