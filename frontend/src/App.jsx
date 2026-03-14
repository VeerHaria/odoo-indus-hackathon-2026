import { useState, useEffect, useRef } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Receipts from './pages/Receipts';
import Deliveries from './pages/Deliveries';
import Transfers from './pages/Transfers';
import MoveHistory from './pages/MoveHistory';
import Inventory from './pages/Inventory';
import Adjustments from './pages/Adjustments';
import WarehouseSettings from './pages/WarehouseSettings';
import ReorderRules from './pages/ReorderRules';
import ForgotPassword from './pages/ForgotPassword';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [showForgot, setShowForgot] = useState(false);
  const [opsOpen, setOpsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('ci_theme') || 'dark');
  const opsRef = useRef();
  const settingsRef = useRef();
  const userRef = useRef();

  useEffect(() => {
    const saved = localStorage.getItem('ci_user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ci_theme', theme);
  }, [theme]);

  useEffect(() => {
    const handler = (e) => {
      if (opsRef.current && !opsRef.current.contains(e.target)) setOpsOpen(false);
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navigate = (p) => {
    setPage(p);
    setOpsOpen(false);
    setSettingsOpen(false);
    setUserMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('ci_user');
    setUser(null);
  };

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  if (showForgot) return <ForgotPassword onBack={() => setShowForgot(false)} />;
  if (!user) return <Login onLogin={(u) => setUser(u)} onForgotPassword={() => setShowForgot(true)} />;

  const renderPage = () => {
    switch (page) {
      case 'dashboard':           return <Dashboard onNavigate={navigate} />;
      case 'products':            return <Products />;
      case 'receipts':            return <Receipts />;
      case 'deliveries':          return <Deliveries />;
      case 'transfers':           return <Transfers />;
      case 'adjustments':         return <Adjustments />;
      case 'move-history':        return <MoveHistory />;
      case 'inventory':           return <Inventory />;
      case 'warehouse-settings':  return <WarehouseSettings />;
      case 'reorder-rules':       return <ReorderRules />;
      default:                    return <Dashboard onNavigate={navigate} />;
    }
  };

  const opsPages = ['receipts', 'deliveries', 'transfers', 'adjustments'];
  const settingsPages = ['warehouse-settings', 'reorder-rules'];

  return (
    <div>
      <nav className="topnav">
        <div className="nav-logo" onClick={() => navigate('dashboard')}>
          <div className="nav-logo-icon">📦</div>
          <span className="nav-logo-text">CoreInventory</span>
        </div>

        <button className={`nav-item ${page === 'dashboard' ? 'active' : ''}`} onClick={() => navigate('dashboard')}>
          ⚡ Dashboard
        </button>

        <div className="dropdown" ref={opsRef}>
          <button
            className={`nav-item ${opsPages.includes(page) ? 'active' : ''}`}
            onClick={() => { setOpsOpen(!opsOpen); setSettingsOpen(false); }}
          >
            🔄 Operations {opsOpen ? '▲' : '▼'}
          </button>
          {opsOpen && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={() => navigate('receipts')}>📥 Receipts</button>
              <button className="dropdown-item" onClick={() => navigate('deliveries')}>📤 Delivery</button>
              <button className="dropdown-item" onClick={() => navigate('transfers')}>🔀 Internal Transfers</button>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={() => navigate('adjustments')}>🎯 Adjustment</button>
            </div>
          )}
        </div>

        <button className={`nav-item ${page === 'products' ? 'active' : ''}`} onClick={() => navigate('products')}>
          📦 Products
        </button>

        <button className={`nav-item ${page === 'inventory' ? 'active' : ''}`} onClick={() => navigate('inventory')}>
          🏭 Stock
        </button>

        <button className={`nav-item ${page === 'move-history' ? 'active' : ''}`} onClick={() => navigate('move-history')}>
          📋 History
        </button>

        <div className="dropdown" ref={settingsRef}>
          <button
            className={`nav-item ${settingsPages.includes(page) ? 'active' : ''}`}
            onClick={() => { setSettingsOpen(!settingsOpen); setOpsOpen(false); }}
          >
            ⚙️ Settings {settingsOpen ? '▲' : '▼'}
          </button>
          {settingsOpen && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={() => navigate('warehouse-settings')}>🏬 Warehouse</button>
              <button className="dropdown-item" onClick={() => navigate('reorder-rules')}>📋 Reorder Rules</button>
            </div>
          )}
        </div>

        <div className="nav-spacer" />

        <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'} />
        <span style={{ fontSize: 14, marginRight: 8, cursor: 'pointer' }} onClick={toggleTheme}>
          {theme === 'dark' ? '🌙' : '☀️'}
        </span>

        <div className="dropdown" ref={userRef}>
          <button className="nav-user" onClick={() => setUserMenuOpen(!userMenuOpen)}>
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </button>
          {userMenuOpen && (
            <div className="dropdown-menu right">
              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{user.role} · {user.email}</div>
              </div>
              <button className="dropdown-item" onClick={toggleTheme}>
                {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={handleLogout}>🚪 Logout</button>
            </div>
          )}
        </div>
      </nav>

      <main className="main">
        {renderPage()}
      </main>
    </div>
  );
}
