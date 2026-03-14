import { useState } from 'react';
import API from '../api';

export default function ForgotPassword({ onBack }) {
  const [step, setStep] = useState(1); // 1=email, 2=otp+password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState(''); // shows OTP in dev mode

  const handleRequestOtp = async () => {
    if (!email) return setError('Please enter your email.');
    setLoading(true); setError(''); setMsg('');
    try {
      const res = await API.post('/auth/forgot-password', { email });
      setDevOtp(res.data.otp || ''); // dev mode only
      setMsg('OTP sent! Check console or use the OTP shown below.');
      setStep(2);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to send OTP.');
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword) return setError('Please fill all fields.');
    if (newPassword !== confirmPassword) return setError('Passwords do not match.');
    if (newPassword.length < 4) return setError('Password must be at least 4 characters.');
    setLoading(true); setError(''); setMsg('');
    try {
      await API.post('/auth/reset-password', { email, otp, new_password: newPassword });
      setMsg('Password reset successful! You can now login.');
      setTimeout(() => onBack(), 2000);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to reset password.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg-primary)'
    }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 40, width: '100%', maxWidth: 420,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
      }}>
        <div style={{ marginBottom: 28 }}>
          <button onClick={onBack} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 14, padding: 0, marginBottom: 16
          }}>
            ← Back to Login
          </button>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            🔐 Reset Password
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 14 }}>
            {step === 1 ? 'Enter your email to receive an OTP' : `OTP sent to ${email}`}
          </p>
        </div>

        {msg && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 8, padding: '10px 14px', marginBottom: 16,
            color: '#15803d', fontSize: 14
          }}>{msg}</div>
        )}
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 8, padding: '10px 14px', marginBottom: 16,
            color: '#dc2626', fontSize: 14
          }}>{error}</div>
        )}

        {/* Dev mode OTP display */}
        {devOtp && (
          <div style={{
            background: '#fffbeb', border: '1px solid #fde68a',
            borderRadius: 8, padding: '10px 14px', marginBottom: 16,
            color: '#92400e', fontSize: 14, fontWeight: 700
          }}>
            🔑 Dev Mode OTP: <span style={{ fontSize: 20, letterSpacing: 4 }}>{devOtp}</span>
          </div>
        )}

        {step === 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              className="input"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRequestOtp()}
            />
            <button
              className="btn btn-primary"
              onClick={handleRequestOtp}
              disabled={loading}
              style={{ width: '100%', padding: '12px', fontSize: 15 }}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              className="input"
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              maxLength={6}
              style={{ letterSpacing: 8, fontSize: 20, textAlign: 'center' }}
            />
            <input
              className="input"
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
            <input
              className="input"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
            />
            <button
              className="btn btn-primary"
              onClick={handleResetPassword}
              disabled={loading}
              style={{ width: '100%', padding: '12px', fontSize: 15 }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => { setStep(1); setOtp(''); setDevOtp(''); setError(''); setMsg(''); }}
              style={{ width: '100%' }}
            >
              Resend OTP
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
