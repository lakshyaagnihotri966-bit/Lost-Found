import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, fmtDate } from '../api';
import { useAuth } from '../AuthContext.jsx';
import { waLink } from '../whatsapp';
import { ItemCard, Badge, EmptyState } from '../components.jsx';
import Icon from '../Icons.jsx';

const TABS = [
  ['lost', 'Lost items', 'flag'], ['found', 'Found items', 'check'], ['claims', 'Claims', 'shield'],
  ['matches', 'Matches', 'sparkle'], ['notifications', 'Alerts', 'bell'], ['recovered', 'Recovered', 'home'],
];

function PhoneEditor({ user, updateUser }) {
  const [edit, setEdit] = useState(false);
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { const d = await api('/auth/me', { method: 'PUT', body: { phone } }); updateUser(d.user); setEdit(false); }
    catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  if (!edit) {
    return (
      <span className="phone-line">
        <Icon name="phone" />{user.phone ? `+${user.phone}` : 'No WhatsApp number'}
        <button type="button" className="linkbtn" onClick={() => { setPhone(user.phone || ''); setEdit(true); }}>{user.phone ? 'Change' : 'Add'}</button>
      </span>
    );
  }
  return (
    <form className="phone-form" onSubmit={save}>
      <input required type="tel" inputMode="tel" placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} aria-label="WhatsApp number" />
      <button className="btn sm" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
      <button type="button" className="btn ghost sm" onClick={() => setEdit(false)}>Cancel</button>
      {err && <span className="error small">{err}</span>}
    </form>
  );
}

export default function Dashboard() {
  const { user, unread, refreshUnread, updateUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some(([k]) => k === params.get('tab')) ? params.get('tab') : 'lost';
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [received, setReceived] = useState([]);
  const [matches, setMatches] = useState([]);
  const [notes, setNotes] = useState([]);
  const [err, setErr] = useState('');
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    try {
      const [i, c, r, m, n] = await Promise.all([
        api('/items/mine'), api('/claims/mine'), api('/claims/received'), api('/items/matches/mine'), api('/notifications'),
      ]);
      setItems(i.items); setClaims(c.claims); setReceived(r.claims); setMatches(m.matches); setNotes(n.notifications);
      refreshUnread();
    } catch (e) { setErr(e.message); } finally { setReady(true); }
  }, [refreshUnread]);
  useEffect(() => { load(); }, [load]);

  const review = async (id, status) => {
    try { await api(`/claims/${id}`, { method: 'PATCH', body: { status } }); await load(); } catch (e) { setErr(e.message); }
  };
  const readAll = async () => { await api('/notifications/read-all', { method: 'POST' }); load(); };

  const lostItems = items.filter((i) => i.type === 'lost' && i.status === 'active');
  const foundItems = items.filter((i) => i.type === 'found' && i.status === 'active');
  const recoveredItems = items.filter((i) => i.status === 'recovered');
  const approved = claims.filter((c) => c.status === 'approved');
  const pendingReceived = received.filter((c) => c.status === 'pending').length;
  const counts = { lost: lostItems.length, found: foundItems.length, claims: claims.length + pendingReceived, matches: matches.length, notifications: unread, recovered: recoveredItems.length + approved.length };

  const grid = (list, title, text, cta) => (list.length
    ? <div className="grid">{list.map((i) => <ItemCard key={i._id} item={i} />)}</div>
    : <EmptyState title={title} text={text}>{cta}</EmptyState>);

  return (
    <div className="wrap page">
      <div className="dash-head">
        <div className="who">
          <span className="avatar lg">{user.avatar ? <img src={user.avatar} alt="" referrerPolicy="no-referrer" /> : (user.name || '?').charAt(0).toUpperCase()}</span>
          <div>
            <h1>Hello, {user.name.split(' ')[0]}</h1>
            <p className="muted small">{user.email} · <PhoneEditor user={user} updateUser={updateUser} /></p>
          </div>
        </div>
        <div className="row">
          <Link className="btn lost-btn" to="/report/lost"><Icon name="plus" /> Report lost</Link>
          <Link className="btn found-btn" to="/report/found"><Icon name="plus" /> Report found</Link>
        </div>
      </div>

      <div className="dash-stats" role="tablist">
        {TABS.map(([k, label, ic]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'dstat on' : 'dstat'} onClick={() => setParams({ tab: k })}>
            <span className="dstat-top"><Icon name={ic} />{k === 'notifications' && counts[k] > 0 && <i className="pulse" />}</span>
            <b>{counts[k]}</b><span>{label}</span>
          </button>
        ))}
      </div>
      {err && <p className="error">{err}</p>}
      {!ready && <div className="grid">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card item skel" />)}</div>}

      {ready && tab === 'lost' && grid(lostItems, 'No active lost reports', 'Report something you lost and we will start matching it right away.', <Link className="btn lost-btn" to="/report/lost">Report a lost item</Link>)}
      {ready && tab === 'found' && grid(foundItems, 'No active found reports', 'Found something on campus? Post it so the owner can claim it.', <Link className="btn found-btn" to="/report/found">Report a found item</Link>)}

      {ready && tab === 'claims' && (
        <>
          <h2 className="sub-h">Claims on items I found</h2>
          {received.length === 0 ? <EmptyState icon="shield" title="No claims yet" text="When someone claims an item you found, it shows up here for review." /> : received.map((c) => (
            <div className="card row-card" key={c._id}>
              <div className="grow">
                <div className="row"><Link to={`/item/${c.item._id}`}><b>{c.item.name}</b></Link><Badge type={c.status}>{c.status}</Badge></div>
                <p className="muted small">Claimed by {c.claimant?.name} on {fmtDate(c.createdAt)}</p>
                <dl className="qa">
                  <dt>Where did they lose it?</dt><dd>{c.answers.whereLost}</dd>
                  <dt>Unique feature</dt><dd>{c.answers.uniqueFeature}</dd>
                  <dt>What was inside</dt><dd>{c.answers.contents}</dd>
                </dl>
              </div>
              <div className="actions">
                {c.claimant?.phone && c.status !== 'rejected' && (
                  <a className="btn sm wa" target="_blank" rel="noreferrer"
                    href={waLink(c.claimant.phone, `Hi ${c.claimant.name}, aapne MPGI Lost & Found par "${c.item.name}" claim kiya hai. Main finder hoon. Kahan aur kab mil sakte hain?`)}>
                    <Icon name="chat" /> WhatsApp {c.claimant.name.split(' ')[0]}
                  </a>
                )}
                {c.status === 'pending' && (
                  <>
                    <button className="btn sm" onClick={() => review(c._id, 'approved')}>Approve</button>
                    <button className="btn ghost sm" onClick={() => review(c._id, 'rejected')}>Reject</button>
                  </>
                )}
              </div>
            </div>
          ))}
          <h2 className="sub-h">My claims</h2>
          {claims.length === 0 ? <EmptyState icon="shield" title="You have not claimed anything" text="Open a found item and choose Claim item." /> : claims.map((c) => (
            <div className="card row-card" key={c._id}>
              <div className="grow">
                <Link to={`/item/${c.item?._id}`}><b>{c.item?.name}</b></Link>
                <p className="muted small">Submitted {fmtDate(c.createdAt)}</p>
              </div>
              <div className="actions">
                {c.poster?.phone && c.status !== 'rejected' && (
                  <a className="btn sm wa" target="_blank" rel="noreferrer"
                    href={waLink(c.poster.phone, `Hi ${c.poster.name}, main ${user.name} hoon. Maine MPGI Lost & Found par "${c.item?.name}" claim kiya hai. Kahan aur kab mil sakte hain?`)}>
                    <Icon name="chat" /> WhatsApp finder
                  </a>
                )}
                <Badge type={c.status}>{c.status}</Badge>
              </div>
            </div>
          ))}
        </>
      )}

      {ready && tab === 'matches' && (matches.length === 0
        ? <EmptyState icon="sparkle" title="No possible matches yet" text="We compare every new report with existing ones and notify you the moment something lines up." />
        : <div className="grid">{matches.map((m) => <ItemCard key={m._id} item={m.mine === 'lost' ? m.found : m.lost} score={m.score} />)}</div>)}

      {ready && tab === 'notifications' && (
        <>
          <div className="row between" style={{ marginBottom: 12 }}><h2 className="sub-h" style={{ margin: 0 }}>Alerts</h2>{unread > 0 && <button className="btn ghost sm" onClick={readAll}>Mark all as read</button>}</div>
          {notes.length === 0 ? <EmptyState icon="bell" title="Nothing yet" text="Matches, claims and updates will appear here." /> : notes.map((n) => (
            <Link to={n.link} key={n._id} className={n.read ? 'note' : 'note unread'} onClick={() => api(`/notifications/${n._id}/read`, { method: 'PATCH' }).then(refreshUnread)}>
              <span>{n.message}</span><span className="muted small">{fmtDate(n.createdAt)}</span>
            </Link>
          ))}
        </>
      )}

      {ready && tab === 'recovered' && (
        <>
          {grid(recoveredItems, 'Nothing recovered yet', 'Items you reported that were returned will show up here.')}
          {approved.length > 0 && <><h2 className="sub-h">Items I got back</h2>
            {approved.map((c) => <div className="card row-card" key={c._id}><Link to={`/item/${c.item?._id}`}><b>{c.item?.name}</b></Link><Badge type="approved">recovered</Badge></div>)}</>}
        </>
      )}
    </div>
  );
}
