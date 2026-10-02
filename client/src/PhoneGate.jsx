import { useState } from 'react';
import { api } from './api';
import { useAuth } from './AuthContext.jsx';

// Asks every non-admin user for a WhatsApp number once, right after first login.
export default function PhoneGate() {
  const { user, updateUser, logout } = useAuth();
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (!user || user.phone || user.role === 'admin') return null;

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { const d = await api('/auth/me', { method: 'PUT', body: { phone } }); updateUser(d.user); }
    catch (e2) { setErr(e2.message); setBusy(false); }
  };
  return (
    <div className="modal-bg">
      <div className="modal" role="dialog" aria-label="Add WhatsApp number">
        <h2>Add your WhatsApp number</h2>
        <p className="muted small">When someone claims an item, the finder and the claimer can message each other on WhatsApp. Your number is shown only to the other person in a claim, never on public pages.</p>
        <form className="form" onSubmit={submit}>
          <label>WhatsApp number
            <input required type="tel" inputMode="tel" placeholder="e.g. 9876543210 or +919876543210" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          </label>
          {err && <p className="error">{err}</p>}
          <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save and continue'}</button>
          <button type="button" className="btn ghost sm" onClick={logout}>Log out</button>
        </form>
      </div>
    </div>
  );
}
