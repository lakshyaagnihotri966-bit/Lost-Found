import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext.jsx';

export default function Auth({ mode }) {
  const reg = mode === 'register';
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const { saveSession } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const d = await api(`/auth/${mode}`, { method: 'POST', body: f });
      saveSession(d);
      nav(loc.state?.from || '/dashboard', { replace: true });
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  return (
    <div className="wrap page narrow">
      <h1>{reg ? 'Create your account' : 'Log in'}</h1>
      <form className="card form" onSubmit={submit}>
        {reg && <label>Full name<input required value={f.name} onChange={set('name')} autoComplete="name" /></label>}
        <label>Email<input type="email" required value={f.email} onChange={set('email')} autoComplete="email" /></label>
        <label>Password<input type="password" required minLength={6} value={f.password} onChange={set('password')} autoComplete={reg ? 'new-password' : 'current-password'} /></label>
        {err && <p className="error">{err}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Please wait…' : reg ? 'Register' : 'Log in'}</button>
        <p className="muted small">{reg ? <>Already registered? <Link to="/login">Log in</Link></> : <>New here? <Link to="/register">Create an account</Link></>}</p>
      </form>
    </div>
  );
}
