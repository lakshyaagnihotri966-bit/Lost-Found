import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, getMeta, fmtDate } from '../api';
import { useAuth } from '../AuthContext.jsx';
import { Badge, Modal } from '../components.jsx';
import { waLink } from '../whatsapp';

export default function ItemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [qr, setQr] = useState(null);
  const [modal, setModal] = useState('');
  const [msg, setMsg] = useState('');
  const [reasons, setReasons] = useState([]);

  const load = () => api(`/items/${id}`).then(setData).catch((e) => setErr(e.message));
  useEffect(() => { load(); setQr(null); }, [id, user]);
  useEffect(() => { getMeta().then((m) => setReasons(m.reportReasons || [])); }, []);
  useEffect(() => {
    if (data?.item.type === 'found') api(`/items/${id}/qr`).then(setQr).catch(() => {});
  }, [data?.item.type, id]);

  if (err) return <div className="wrap page"><h1>Item not found</h1><p className="muted">{err}</p><Link to="/browse">Browse items</Link></div>;
  if (!data) return <div className="wrap page muted">Loading…</div>;
  const { item, isOwner, myClaim } = data;
  const found = item.type === 'found';
  const recovered = item.status === 'recovered';
  const needLogin = () => nav('/login', { state: { from: `/item/${id}` } });

  const openModal = (m) => (user ? setModal(m) : needLogin());
  const act = async (fn) => { try { await fn(); await load(); } catch (e) { setMsg(e.message); } };

  return (
    <div className="wrap page detail">
      <div className="detail-img">
        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <div className="noimg big">No photo</div>}
      </div>
      <div>
        <div className="row"><Badge type={item.type}>{found ? 'Found' : 'Lost'}</Badge><Badge type={recovered ? 'recovered' : 'active'}>{recovered ? 'Recovered' : 'Active'}</Badge></div>
        <h1>{item.name}</h1>
        <dl className="facts">
          <div><dt>Category</dt><dd>{item.category}</dd></div>
          <div><dt>{found ? 'Found at' : 'Lost at'}</dt><dd>{item.location}</dd></div>
          <div><dt>Date</dt><dd>{fmtDate(item.date)}</dd></div>
          {item.color && <div><dt>Colour</dt><dd>{item.color}</dd></div>}
          {item.brand && <div><dt>Brand</dt><dd>{item.brand}</dd></div>}
          <div><dt>Status</dt><dd>{recovered ? 'Recovered' : 'Still active'}</dd></div>
        </dl>
        {item.description && <p>{item.description}</p>}
        {item.additional && <p className="muted">{item.additional}</p>}
        {msg && <p className="error">{msg}</p>}

        <div className="cta">
          {found && !recovered && !isOwner && (
            myClaim?.status === 'pending'
              ? <button className="btn" disabled>Claim pending review</button>
              : <button className="btn" onClick={() => openModal('claim')}>Claim item</button>
          )}
          {!isOwner && <button className="btn ghost" onClick={() => openModal('report')}>Report listing</button>}
          {(isOwner || user?.role === 'admin') && !recovered && (
            <button className="btn ghost" onClick={() => act(() => api(`/items/${id}/recover`, { method: 'PATCH' }))}>Mark as recovered</button>
          )}
          {(isOwner || user?.role === 'admin') && (
            <button className="btn danger" onClick={() => { if (confirm('Delete this listing?')) act(async () => { await api(`/items/${id}`, { method: 'DELETE' }); nav('/dashboard'); }); }}>Delete</button>
          )}
        </div>
        {myClaim && <p className="muted small">Your claim: {myClaim.status}</p>}

        {qr && (
          <div className="qr card">
            <img src={qr.qr} alt="QR code for this item" width="140" height="140" />
            <div>
              <h3>QR code</h3>
              <p className="muted small">Print it and attach it to the item or notice board. Scanning opens this public page.</p>
              <a className="btn ghost sm" href={qr.qr} download={`mpgi-found-${id}.png`}>Download QR</a>
            </div>
          </div>
        )}
      </div>

      {modal === 'claim' && <ClaimModal id={id} onClose={() => setModal('')} onDone={() => { setModal(''); load(); }} />}
      {modal === 'report' && <ReportModal id={id} reasons={reasons} onClose={() => setModal('')} />}
    </div>
  );
}

function ClaimModal({ id, onClose, onDone }) {
  const { user } = useAuth();
  const [a, setA] = useState({ whereLost: '', uniqueFeature: '', contents: '' });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const set = (k) => (e) => setA({ ...a, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { setDone(await api(`/claims/item/${id}`, { method: 'POST', body: a })); } catch (e2) { setErr(e2.message); setBusy(false); }
  };
  if (done) {
    const p = done.poster;
    return (
      <Modal title="Claim sent" onClose={onDone}>
        <p>Your claim was sent to the finder. They will review your answers.</p>
        {p?.phone ? (
          <>
            <p className="muted small">Message the finder on WhatsApp to arrange pickup. The message is already written, you only press Send.</p>
            <a className="btn wa" target="_blank" rel="noreferrer"
              href={waLink(p.phone, `Hi ${p.name}, main ${user.name} hoon. Maine MPGI Lost & Found par "${done.itemTitle}" claim kiya hai. Kahan aur kab mil sakte hain?`)}>
              Open WhatsApp
            </a>
          </>
        ) : <p className="muted small">The finder has no WhatsApp number saved. They will see your claim in their dashboard.</p>}
      </Modal>
    );
  }
  return (
    <Modal title="Claim this item" onClose={onClose}>
      <p className="muted small">Answer in detail. The finder compares your answers with the item before approving.</p>
      <form className="form" onSubmit={submit}>
        <label>Where did you lose it?<textarea required rows="2" value={a.whereLost} onChange={set('whereLost')} /></label>
        <label>What unique feature does it have?<textarea required rows="2" value={a.uniqueFeature} onChange={set('uniqueFeature')} /></label>
        <label>What was inside it?<textarea required rows="2" value={a.contents} onChange={set('contents')} /></label>
        {err && <p className="error">{err}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Submit claim'}</button>
      </form>
    </Modal>
  );
}

function ReportModal({ id, reasons, onClose }) {
  const [reason, setReason] = useState(''); const [note, setNote] = useState('');
  const [err, setErr] = useState(''); const [done, setDone] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try { await api(`/reports/item/${id}`, { method: 'POST', body: { reason, note } }); setDone(true); } catch (e2) { setErr(e2.message); }
  };
  return (
    <Modal title="Report this listing" onClose={onClose}>
      {done ? <p>Thanks. An admin will review this listing.</p> : (
        <form className="form" onSubmit={submit}>
          <label>Reason<select required value={reason} onChange={(e) => setReason(e.target.value)}><option value="">Choose…</option>{reasons.map((r) => <option key={r}>{r}</option>)}</select></label>
          <label>Details (optional)<textarea rows="3" value={note} onChange={(e) => setNote(e.target.value)} /></label>
          {err && <p className="error">{err}</p>}
          <button className="btn">Send report</button>
        </form>
      )}
    </Modal>
  );
}
