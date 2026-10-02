import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { api } from '../api';
import { useAuth } from '../AuthContext.jsx';

export default function Auth({ mode }) {
  const reg = mode === 'register';
  const [admin, setAdmin] = useState(false);
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const { saveSession } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const done = (d) => { saveSession(d); nav(loc.state?.from || '/dashboard', { replace: true }); };

  const google = async (r) => {
    setErr(''); setBusy(true);
    try { done(await api('/auth/google', { method: 'POST', body: { credential: r.credential } })); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { done(await api('/auth/login', { method: 'POST', body: f })); }
    catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  return (
    <div className="wrap page narrow">
      <h1>{reg ? 'Create your account' : 'Log in'}</h1>
      <div className="card form">
        <p className="muted">{reg ? 'Sign up with your Google (Gmail) account. No password to remember.' : 'Continue with your Google (Gmail) account.'}</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <GoogleLogin onSuccess={google} onError={() => setErr('Google login failed. Please try again.')} text={reg ? 'signup_with' : 'signin_with'} shape="pill" size="large" />
        </div>
        {busy && <p className="muted small center">Please wait…</p>}
        {err && <p className="error">{err}</p>}
        <p className="muted small">{reg ? <>Already registered? <Link to="/login">Log in</Link></> : <>New here? <Link to="/register">Create an account</Link></>}</p>
        <hr style={{ border: 0, borderTop: '1px solid var(--line)', width: '100%' }} />
        {!admin ? (
          <button type="button" className="btn ghost sm" onClick={() => setAdmin(true)}>Admin login</button>
        ) : (
          <form className="form" onSubmit={submit}>
            <label>Email<input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" /></label>
            <label>Password<input type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="current-password" /></label>
            <button className="btn" disabled={busy}>Log in as admin</button>
          </form>
        )}
      </div>
    </div>
  );
}
