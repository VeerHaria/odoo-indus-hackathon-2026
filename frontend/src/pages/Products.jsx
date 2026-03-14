import { useState, useEffect } from 'react';
import API from '../api';

export default function Products() {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [rules, setRules] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [alert, setAlert] = useState(null);
  const [form, setForm] = useState({ name: '', sku: '', category_id: '', unit_of_measure: 'units', reorder_level: 10, initial_stock: '', initial_location: '' });
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [ruleForm, setRuleForm] = useState({ product_id: '', min_qty: '', max_qty: '' });

  const load = () => {
    setLoading(true);
    API.get('/products', { params: search ? { search } : {} })
      .then(r => setProducts(r.data.products || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    API.get('/products/meta/categories').then(r => setCategories(r.data || []));
    API.get('/reorder-rules').then(r => setRules(r.data.rules || []));
    API.get('/warehouses/all-locations').then(r => setLocations(r.data.locations || []));
  }, []);

  useEffect(() => { load(); }, [search]);

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/products', {
        name: form.name,
        sku: form.sku,
        category_id: form.category_id || undefined,
        unit_of_measure: form.unit_of_measure,
        reorder_level: Number(form.reorder_level),
      });

      if (form.initial_stock && form.initial_location) {
        await API.post('/stock-movements', {
          product_id: res.data.product.id,
          quantity: Number(form.initial_stock),
          operation_type: 'receipt',
          to_location: Number(form.initial_location),
          from_location: null,
          reference: `INIT-${form.sku}`,
        });
      }

      showAlert('Product created ✅');
      setShowModal(false);
      setForm({ name: '', sku: '', category_id: '', unit_of_measure: 'units', reorder_level: 10, initial_stock: '', initial_location: '' });
      load();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to create product', 'error');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await API.post('/categories', catForm);
      showAlert('Category created ✅');
      setShowCatModal(false);
      setCatForm({ name: '', description: '' });
      API.get('/products/meta/categories').then(r => setCategories(r.data || []));
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed', 'error');
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    try {
      await API.post('/reorder-rules', {
        product_id: Number(ruleForm.product_id),
        min_qty: Number(ruleForm.min_qty),
        max_qty: Number(ruleForm.max_qty),
      });
      showAlert('Reorder rule saved ✅');
      setShowRuleModal(false);
      setRuleForm({ product_id: '', min_qty: '', max_qty: '' });
      API.get('/reorder-rules').then(r => setRules(r.data.rules || []));
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await API.delete(`/products/${id}`);
      showAlert('Product deleted ✅');
      load();
    } catch {
      showAlert('Failed to delete product', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">📦 Products</div>
          <div className="page-subtitle">{products.length} products · {categories.length} categories</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab === 'products' && <button className="btn btn-ghost" onClick={() => setShowCatModal(true)}>+ Category</button>}
          {tab === 'rules' && <button className="btn btn-ghost" onClick={() => setShowRuleModal(true)}>+ Reorder Rule</button>}
          {tab === 'products' && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Product</button>}
        </div>
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {[
          { key: 'products', label: '📦 Products' },
          { key: 'categories', label: '🏷 Categories' },
          { key: 'rules', label: '🔔 Reorder Rules' },
        ].map(t => (
          <button key={t.key} className={`btn btn-sm ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'products' && (
        <>
          <div className="search-bar">
            <span>🔍</span>
            <input placeholder="Search by name or SKU..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>}
          </div>
          <div className="table-wrap">
            {loading ? <div className="loading"><div className="spinner" />Loading...</div>
              : products.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">📦</div><div className="empty-state-text">No products found</div></div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Unit</th>
                      <th>Reorder Level</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id}>
                        <td className="td-main">{p.name}</td>
                        <td><span className="badge badge-blue">{p.sku}</span></td>
                        <td style={{ color: 'var(--text-muted)' }}>{p.category_name || '—'}</td>
                        <td>{p.unit_of_measure}</td>
                        <td><span className="badge badge-yellow">≥ {p.reorder_level}</span></td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(p.id, p.name)}>🗑 Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
        </>
      )}

      {tab === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          {categories.map(c => (
            <div key={c.id} className="card" style={{ border: '1px solid var(--border-bright)' }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>🏷 {c.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.description || 'No description'}</div>
            </div>
          ))}
          {categories.length === 0 && <div className="empty-state"><div className="empty-state-icon">🏷</div><div className="empty-state-text">No categories yet</div></div>}
        </div>
      )}

      {tab === 'rules' && (
        <div className="table-wrap">
          {rules.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔔</div>
              <div className="empty-state-text">No reorder rules yet — add one to get notified when stock is low</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Current Stock</th>
                  <th>Min Qty</th>
                  <th>Max Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(r => (
                  <tr key={r.id}>
                    <td className="td-main">{r.product_name}</td>
                    <td><span className="badge badge-blue">{r.sku}</span></td>
                    <td style={{ fontWeight: 700, color: r.needs_reorder ? '#ef4444' : '#22c55e' }}>{r.current_stock}</td>
                    <td><span className="badge badge-yellow">≥ {r.min_qty}</span></td>
                    <td><span className="badge badge-green">↑ {r.max_qty}</span></td>
                    <td>
                      <span style={{
                        padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: r.needs_reorder ? '#fef2f2' : '#f0fdf4',
                        color: r.needs_reorder ? '#ef4444' : '#16a34a'
                      }}>
                        {r.needs_reorder ? '⚠️ Reorder' : '✅ OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">New Product</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-grid" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU / Code *</label>
                  <input className="form-input" placeholder="e.g. STL001" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Unit of Measure</label>
                  <input className="form-input" placeholder="units, kg, meters..." value={form.unit_of_measure} onChange={e => setForm({ ...form, unit_of_measure: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Reorder Level</label>
                  <input className="form-input" type="number" min="0" value={form.reorder_level} onChange={e => setForm({ ...form, reorder_level: e.target.value })} />
                </div>
              </div>

              <div style={{ padding: '14px 16px', background: 'rgba(0,229,160,0.06)', borderRadius: 10, border: '1px solid rgba(0,229,160,0.15)', marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-green)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  📦 Initial Stock (Optional)
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Starting Quantity</label>
                    <input className="form-input" type="number" min="0" placeholder="0" value={form.initial_stock} onChange={e => setForm({ ...form, initial_stock: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <select className="form-select" value={form.initial_location} onChange={e => setForm({ ...form, initial_location: e.target.value })}>
                      <option value="">Select location</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.warehouse_name} — {l.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCatModal && (
        <div className="modal-overlay" onClick={() => setShowCatModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">New Category</span>
              <button className="modal-close" onClick={() => setShowCatModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateCategory}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                <div className="form-group">
                  <label className="form-label">Category Name *</label>
                  <input className="form-input" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input className="form-input" value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCatModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRuleModal && (
        <div className="modal-overlay" onClick={() => setShowRuleModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🔔 New Reorder Rule</span>
              <button className="modal-close" onClick={() => setShowRuleModal(false)}>✕</button>
            </div>
            <div style={{ padding: '10px 14px', background: 'rgba(255,209,102,0.06)', borderRadius: 8, border: '1px solid rgba(255,209,102,0.15)', marginBottom: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
              🔔 When stock falls below Min Qty, a low stock alert fires automatically
            </div>
            <form onSubmit={handleCreateRule}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                <div className="form-group">
                  <label className="form-label">Product *</label>
                  <select className="form-select" value={ruleForm.product_id} onChange={e => setRuleForm({ ...ruleForm, product_id: e.target.value })} required>
                    <option value="">Select product</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                  </select>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Min Qty (Reorder at)</label>
                    <input className="form-input" type="number" min="0" value={ruleForm.min_qty} onChange={e => setRuleForm({ ...ruleForm, min_qty: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Qty (Reorder up to)</label>
                    <input className="form-input" type="number" min="0" value={ruleForm.max_qty} onChange={e => setRuleForm({ ...ruleForm, max_qty: e.target.value })} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowRuleModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
