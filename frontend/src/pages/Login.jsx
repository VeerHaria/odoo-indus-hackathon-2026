import { useState } from 'react';
import API from '../api';

export default function Login({ onLogin, onForgotPassword }) {
  const [page, setPage] = useState('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'staff' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await API.post('/auth/login', loginForm);
      const userData = { ...res.data.user, token: res.data.token };
      localStorage.setItem('ci_user', JSON.stringify(userData));
      onLogin(userData);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid Login Id or Password');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (regForm.password !== regForm.confirmPassword) { setError('Passwords do not match'); return; }
    if (regForm.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError('');
    try {
      await API.post('/auth/register', { name: regForm.name, email: regForm.email, password: regForm.password, role: regForm.role });
      setPage('login');
      setLoginForm({ email: regForm.email, password: '' });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -300, right: -300, width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,142,255,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -300, left: -300, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(155,127,255,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: page === 'login' ? 420 : 460, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, margin: '0 auto 14px', boxShadow: '0 12px 40px rgba(79,142,255,0.3)' }}>📦</div>
          <h1 style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>CoreInventory</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {page === 'login' ? 'Login Page' : 'Sign up Page'}
          </p>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-bright)', borderRadius: 20, padding: 32, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
          {error && <div className="alert alert-error">{error}</div>}

          {page === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Login Id</label>
                <input className="form-input" type="email" placeholder="admin@ims.com" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Password</label>
                <input className="form-input" type="password" placeholder="••••••••" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} required />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 14, letterSpacing: '0.05em' }} disabled={loading}>
                {loading ? '⏳ Signing in...' : 'SIGN IN'}
              </button>

              <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                <button type="button" onClick={onForgotPassword} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>Forget Password ?</button>
                {' | '}
                <button type="button" onClick={() => { setPage('register'); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Sign Up</button>
              </div>

              <div style={{ marginTop: 20, padding: '12px 14px', background: 'rgba(79,142,255,0.06)', borderRadius: 10, border: '1px solid rgba(79,142,255,0.15)' }}>
                <div style={{ fontSize: 11, color: 'var(--accent-blue)', fontWeight: 700, marginBottom: 6 }}>🔑 DEMO CREDENTIALS</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  Login Id: <code style={{ color: 'var(--accent-green)' }}>admin@ims.com</code><br />
                  Password: <code style={{ color: 'var(--accent-green)' }}>123</code>
                </div>
                <button type="button" onClick={() => setLoginForm({ email: 'admin@ims.com', password: '123' })} style={{ marginTop: 6, fontSize: 11, background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.2)', color: 'var(--accent-green)', padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                  Auto-fill demo
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Enter Login Id (Name)</label>
                <input className="form-input" placeholder="John Doe" value={regForm.name} onChange={e => setRegForm({ ...regForm, name: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Enter Email Id</label>
                <input className="form-input" type="email" placeholder="john@company.com" value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Enter Password</label>
                <input className="form-input" type="password" placeholder="Min 8 characters" value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Re-Enter Password</label>
                <input className="form-input" type="password" placeholder="Confirm password" value={regForm.confirmPassword} onChange={e => setRegForm({ ...regForm, confirmPassword: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: 22 }}>
                <label className="form-label">Role</label>
                <select className="form-select" value={regForm.role} onChange={e => setRegForm({ ...regForm, role: e.target.value })}>
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 14, letterSpacing: '0.05em' }} disabled={loading}>
                {loading ? '⏳ Creating...' : 'SIGN UP'}
              </button>
              <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-muted)' }}>
                Already have an account?{' '}
                <button type="button" onClick={() => { setPage('login'); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  Sign In
                </button>
              </div>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--text-muted)' }}>
          CoreInventory v1.0 · Odoo x Indus Hackathon 2026
        </p>
      </div>
    </div>
  );
}
