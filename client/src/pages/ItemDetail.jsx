import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, getMeta, fmtDate } from '../api';
import { useAuth } from '../AuthContext.jsx';
import { Badge, Modal } from '../components.jsx';
import { waLink } from '../whatsapp';
import Icon, { CATEGORY_ICON } from '../Icons.jsx';

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
  const [meta, setMeta] = useState({ categories: [], locations: [] });
  const [copied, setCopied] = useState(false);

  const load = () => api(`/items/${id}`).then(setData).catch((e) => setErr(e.message));
  useEffect(() => { load(); setQr(null); }, [id, user]);
  useEffect(() => { getMeta().then((m) => { setReasons(m.reportReasons || []); setMeta(m); }).catch(() => {}); }, []);
  useEffect(() => {
    if (data?.item.type === 'found') api(`/items/${id}/qr?origin=${encodeURIComponent(window.location.origin)}`).then(setQr).catch(() => {});
  }, [data?.item.type, id]);

  if (err) return <div className="wrap page narrow center"><h1>Item not found</h1><p className="muted">{err}</p><Link className="btn" to="/browse">Browse items</Link></div>;
  if (!data) return <div className="wrap page"><div className="detail"><div className="card item skel" style={{ height: 380 }} /><div className="card item skel" style={{ height: 380 }} /></div></div>;
  const { item, isOwner, myClaim, contact } = data;
  const found = item.type === 'found';
  const recovered = item.status === 'recovered';
  const canManage = isOwner || user?.role === 'admin';
  const needLogin = () => nav('/login', { state: { from: `/item/${id}` } });

  const openModal = (m) => (user ? setModal(m) : needLogin());
  const share = async () => {
    const url = window.location.href;
    const title = `${found ? 'Found' : 'Lost'} at MPGI: ${item.name}`;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch { /* cancelled */ }
  };
  const act = async (fn) => { try { await fn(); await load(); } catch (e) { setMsg(e.message); } };

  return (
    <div className="wrap page">
      <nav className="crumbs" aria-label="Breadcrumb"><Link to="/browse">Browse</Link><span>/</span><span>{item.category}</span></nav>
      <div className="detail">
        <div className="detail-img">
          {item.imageUrl
            ? <img src={item.imageUrl} alt={item.name} />
            : <div className="noimg big"><Icon name={CATEGORY_ICON[item.category] || 'grid'} size={54} /><span>No photo added</span></div>}
        </div>
        <div>
          <div className="row"><Badge type={item.type}>{found ? 'Found' : 'Lost'}</Badge><Badge type={recovered ? 'recovered' : 'active'}>{recovered ? 'Recovered' : 'Active'}</Badge></div>
          <h1>{item.name}</h1>
          <dl className="facts">
            <div><dt>Category</dt><dd>{item.category}</dd></div>
            <div><dt>{found ? 'Found at' : 'Lost at'}</dt><dd>{item.location}</dd></div>
            <div><dt>Date</dt><dd>{fmtDate(item.date)}</dd></div>
            <div><dt>Status</dt><dd>{recovered ? 'Recovered' : 'Still active'}</dd></div>
            {item.color && <div><dt>Colour</dt><dd>{item.color}</dd></div>}
            {item.brand && <div><dt>Brand</dt><dd>{item.brand}</dd></div>}
          </dl>
          {item.description && <p>{item.description}</p>}
          {item.additional && <p className="muted">{item.additional}</p>}
          {msg && <p className="error">{msg}</p>}

          <div className="cta">
            {found && !recovered && !isOwner && (
              myClaim?.status === 'pending'
                ? <button className="btn" disabled>Claim pending review</button>
                : <button className="btn big" onClick={() => openModal('claim')}><Icon name="shield" /> Claim this item</button>
            )}
            <button className="btn ghost" onClick={share}><Icon name="share" /> {copied ? 'Link copied' : 'Share'}</button>
            {!isOwner && <button className="btn ghost" onClick={() => openModal('report')}><Icon name="flag" /> Report</button>}
          </div>
          {myClaim && <p className="muted small">Your claim: {myClaim.status}</p>}

          {!isOwner && !recovered && (
            <div className="card contact">
              <h3>{found ? 'Is this yours?' : 'Did you find this?'}</h3>
              {!user ? (
                <p className="muted small">Log in with Google to see the contact number. <Link to="/login" state={{ from: `/item/${id}` }}>Log in</Link></p>
              ) : contact?.phone ? (
                <>
                  <p className="muted small">Posted by {contact.name}. {found ? 'Message or call them to verify the item and collect it.' : 'Message or call them to return their item.'}</p>
                  <div className="actions">
                    <a className="btn wa" target="_blank" rel="noreferrer"
                      href={waLink(contact.phone, found
                        ? `Hi ${contact.name}, main ${user.name} hoon. MPGI Lost & Found par aapka found item "${item.name}" mera hai. Kahan aur kab mil sakte hain?`
                        : `Hi ${contact.name}, main ${user.name} hoon. Aapka lost item "${item.name}" mujhe mila hai. Kahan aur kab return kar sakta hoon?`)}>
                      <Icon name="chat" /> {found ? 'WhatsApp the finder' : 'I found this: WhatsApp owner'}
                    </a>
                    <a className="btn ghost" href={`tel:+${contact.phone}`}><Icon name="phone" /> Call</a>
                  </div>
                </>
              ) : <p className="muted small">{contact?.name || 'The poster'} has not added a contact number yet.{found ? ' You can still use Claim this item.' : ''}</p>}
            </div>
          )}

          {canManage && (
            <div className="card manage">
              <h3>Manage listing</h3>
              <div className="actions">
                {!recovered && <button className="btn ghost sm" onClick={() => setModal('edit')}><Icon name="edit" /> Edit</button>}
                {!recovered && <button className="btn ghost sm" onClick={() => act(() => api(`/items/${id}/recover`, { method: 'PATCH' }))}><Icon name="check" /> Mark as recovered</button>}
                <button className="btn danger sm" onClick={() => { if (confirm('Delete this listing?')) act(async () => { await api(`/items/${id}`, { method: 'DELETE' }); nav('/dashboard'); }); }}><Icon name="trash" /> Delete</button>
              </div>
            </div>
          )}

          {qr && (
            <div className="qr card">
              <img src={qr.qr} alt="QR code for this item" width="120" height="120" />
              <div>
                <h3>QR code</h3>
                <p className="muted small">Print it and attach it to the item or notice board. Scanning opens this page.</p>
                <a className="btn ghost sm" href={qr.qr} download={`mpgi-found-${id}.png`}><Icon name="download" /> Download QR</a>
              </div>
            </div>
          )}
        </div>
      </div>

      {modal === 'claim' && <ClaimModal id={id} onClose={() => setModal('')} onDone={() => { setModal(''); load(); }} />}
      {modal === 'report' && <ReportModal id={id} reasons={reasons} onClose={() => setModal('')} />}
      {modal === 'edit' && <EditModal id={id} item={item} meta={meta} onClose={() => setModal('')} onDone={() => { setModal(''); load(); }} />}
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

function EditModal({ id, item, meta, onClose, onDone }) {
  const [f, setF] = useState({
    name: item.name, category: item.category, location: item.location, color: item.color || '', brand: item.brand || '',
    date: String(item.date).slice(0, 10), description: item.description || '', additional: item.additional || '',
  });
  const [file, setFile] = useState(null);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const form = new FormData();
      Object.entries(f).forEach(([k, v]) => form.append(k, v));
      if (file) form.append('image', file);
      await api(`/items/${id}`, { method: 'PUT', form });
      onDone();
    } catch (e2) { setErr(e2.message); setBusy(false); }
  };
  return (
    <Modal title="Edit listing" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label>Item name<input required value={f.name} onChange={set('name')} /></label>
        <div className="two">
          <label>Category<select required value={f.category} onChange={set('category')}>{meta.categories.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label>Location<select required value={f.location} onChange={set('location')}>{meta.locations.map((c) => <option key={c}>{c}</option>)}</select></label>
        </div>
        <div className="two">
          <label>Colour<input value={f.color} onChange={set('color')} /></label>
          <label>Brand<input value={f.brand} onChange={set('brand')} /></label>
        </div>
        <label>Date<input type="date" required max={new Date().toISOString().slice(0, 10)} value={f.date} onChange={set('date')} /></label>
        <label>Description<textarea rows="3" value={f.description} onChange={set('description')} /></label>
        <label>Additional details<textarea rows="2" value={f.additional} onChange={set('additional')} /></label>
        <label>Replace photo (optional)<input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0] || null)} /></label>
        {err && <p className="error">{err}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
      </form>
    </Modal>
  );
}
