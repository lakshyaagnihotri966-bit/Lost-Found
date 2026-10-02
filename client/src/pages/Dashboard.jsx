import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, fmtDate } from '../api';
import { useAuth } from '../AuthContext.jsx';
import { waLink } from '../whatsapp';
import { ItemCard, Badge } from '../components.jsx';

const TABS = [['lost', 'My lost items'], ['found', 'My found items'], ['claims', 'My claims'], ['matches', 'Possible matches'], ['notifications', 'Notifications'], ['recovered', 'Recovered']];

export default function Dashboard() {
  const { user, unread, refreshUnread } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some(([k]) => k === params.get('tab')) ? params.get('tab') : 'lost';
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [received, setReceived] = useState([]);
  const [matches, setMatches] = useState([]);
  const [notes, setNotes] = useState([]);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try {
      const [i, c, r, m, n] = await Promise.all([
        api('/items/mine'), api('/claims/mine'), api('/claims/received'), api('/items/matches/mine'), api('/notifications'),
      ]);
      setItems(i.items); setClaims(c.claims); setReceived(r.claims); setMatches(m.matches); setNotes(n.notifications);
      refreshUnread();
    } catch (e) { setErr(e.message); }
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

  const grid = (list, emptyText, cta) => list.length
    ? <div className="grid">{list.map((i) => <ItemCard key={i._id} item={i} />)}</div>
    : <p className="muted empty">{emptyText} {cta}</p>;

  return (
    <div className="wrap page">
      <h1>Hello, {user.name.split(' ')[0]}</h1>
      <div className="tabs" role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'tab on' : 'tab'} onClick={() => setParams({ tab: k })}>
            {label}{counts[k] > 0 && <span className="count">{counts[k]}</span>}
          </button>
        ))}
      </div>
      {err && <p className="error">{err}</p>}

      {tab === 'lost' && grid(lostItems, 'You have no active lost reports.', <Link to="/report/lost">Report a lost item</Link>)}
      {tab === 'found' && grid(foundItems, 'You have no active found reports.', <Link to="/report/found">Report a found item</Link>)}

      {tab === 'claims' && (
        <>
          <h2>Claims on items I found</h2>
          {received.length === 0 ? <p className="muted empty">No one has claimed your found items yet.</p> : received.map((c) => (
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
                    WhatsApp {c.claimant.name.split(' ')[0]}
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
          <h2>My claims</h2>
          {claims.length === 0 ? <p className="muted empty">You have not claimed anything. Open a found item and choose Claim item.</p> : claims.map((c) => (
            <div className="card row-card" key={c._id}>
              <div className="grow">
                <Link to={`/item/${c.item?._id}`}><b>{c.item?.name}</b></Link>
                <p className="muted small">Submitted {fmtDate(c.createdAt)}</p>
              </div>
              <div className="actions">
                {c.poster?.phone && c.status !== 'rejected' && (
                  <a className="btn sm wa" target="_blank" rel="noreferrer"
                    href={waLink(c.poster.phone, `Hi ${c.poster.name}, main ${user.name} hoon. Maine MPGI Lost & Found par "${c.item?.name}" claim kiya hai. Kahan aur kab mil sakte hain?`)}>
                    WhatsApp finder
                  </a>
                )}
                <Badge type={c.status}>{c.status}</Badge>
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 'matches' && (matches.length === 0
        ? <p className="muted empty">No possible matches yet. We check every new report against existing ones and notify you.</p>
        : <div className="grid">{matches.map((m) => <ItemCard key={m._id} item={m.mine === 'lost' ? m.found : m.lost} score={m.score} />)}</div>)}

      {tab === 'notifications' && (
        <>
          <div className="row between"><h2>Notifications</h2>{unread > 0 && <button className="btn ghost sm" onClick={readAll}>Mark all as read</button>}</div>
          {notes.length === 0 ? <p className="muted empty">Nothing yet.</p> : notes.map((n) => (
            <Link to={n.link} key={n._id} className={n.read ? 'note' : 'note unread'} onClick={() => api(`/notifications/${n._id}/read`, { method: 'PATCH' }).then(refreshUnread)}>
              <span>{n.message}</span><span className="muted small">{fmtDate(n.createdAt)}</span>
            </Link>
          ))}
        </>
      )}

      {tab === 'recovered' && (
        <>
          {grid(recoveredItems, 'None of your reports are recovered yet.')}
          {approved.length > 0 && <><h2>Items I got back</h2>
            {approved.map((c) => <div className="card row-card" key={c._id}><Link to={`/item/${c.item?._id}`}><b>{c.item?.name}</b></Link><Badge type="approved">recovered</Badge></div>)}</>}
        </>
      )}
    </div>
  );
}
