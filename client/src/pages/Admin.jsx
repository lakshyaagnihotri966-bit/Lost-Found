import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtDate } from '../api';
import { Badge, Bars } from '../components.jsx';

const TABS = [['overview', 'Overview'], ['users', 'Users'], ['lost', 'Lost items'], ['found', 'Found items'], ['claims', 'Claims'], ['reports', 'Reported listings']];

export default function Admin() {
  const [tab, setTab] = useState('overview');
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setErr('');
    try {
      if (tab === 'overview') setD(await api('/admin/stats'));
      else if (tab === 'users') setD(await api('/admin/users'));
      else if (tab === 'claims') setD(await api('/admin/claims'));
      else if (tab === 'reports') setD(await api('/reports'));
      else setD(await api(`/admin/items?type=${tab}`));
    } catch (e) { setErr(e.message); }
  }, [tab]);
  useEffect(() => { setD(null); load(); }, [load]);

  const run = async (fn) => { try { await fn(); await load(); } catch (e) { setErr(e.message); } };
  const del = (id) => confirm('Delete this listing permanently?') && run(() => api(`/items/${id}`, { method: 'DELETE' }));

  return (
    <div className="wrap page">
      <h1>Admin dashboard</h1>
      <div className="tabs">{TABS.map(([k, l]) => <button key={k} className={tab === k ? 'tab on' : 'tab'} onClick={() => setTab(k)}>{l}</button>)}</div>
      {err && <p className="error">{err}</p>}
      {!d ? <p className="muted">Loading…</p> : (
        <>
          {tab === 'overview' && (
            <>
              <div className="stat-row">
                <div className="card stat"><b>{d.totals.users}</b><span>Users</span></div>
                <div className="card stat"><b>{d.totals.items}</b><span>Listings</span></div>
                <div className="card stat"><b>{d.totals.pendingClaims}</b><span>Pending claims</span></div>
                <div className="card stat"><b>{d.totals.recovered}</b><span>Recovered</span></div>
              </div>
              <div className="charts">
                <div className="card"><h3>Lost vs found</h3><Bars data={d.lostVsFound} colors={['var(--red)', 'var(--blue)']} /></div>
                <div className="card"><h3>Recovered items, last 6 months</h3><Bars data={d.recoveredByMonth} colors={Array(6).fill('var(--green)')} /></div>
                <div className="card"><h3>Items by category</h3><Bars data={d.byCategory} /></div>
                <div className="card"><h3>Items by location</h3><Bars data={d.byLocation} /></div>
              </div>
            </>
          )}

          {tab === 'users' && (
            <div className="table-wrap"><table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Listings</th><th>Joined</th></tr></thead>
              <tbody>{d.users.map((u) => <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{u.itemCount}</td><td>{fmtDate(u.createdAt)}</td></tr>)}</tbody>
            </table></div>
          )}

          {(tab === 'lost' || tab === 'found') && (
            <div className="table-wrap"><table>
              <thead><tr><th>Item</th><th>Category</th><th>Location</th><th>By</th><th>Status</th><th></th></tr></thead>
              <tbody>{d.items.length === 0 ? <tr><td colSpan="6" className="muted">No items.</td></tr> : d.items.map((i) => (
                <tr key={i._id}>
                  <td><Link to={`/item/${i._id}`}>{i.name}</Link></td><td>{i.category}</td><td>{i.location}</td>
                  <td>{i.reporter?.name}<br /><span className="muted small">{i.reporter?.email}</span></td>
                  <td><Badge type={i.status === 'recovered' ? 'recovered' : 'active'}>{i.status}</Badge></td>
                  <td className="actions">
                    {i.status !== 'recovered' && <button className="btn ghost sm" onClick={() => run(() => api(`/items/${i._id}/recover`, { method: 'PATCH' }))}>Mark recovered</button>}
                    <button className="btn danger sm" onClick={() => del(i._id)}>Delete</button>
                  </td>
                </tr>))}</tbody>
            </table></div>
          )}

          {tab === 'claims' && (d.claims.length === 0 ? <p className="muted empty">No claims yet.</p> : d.claims.map((c) => (
            <div className="card row-card" key={c._id}>
              <div className="grow">
                <div className="row"><Link to={`/item/${c.item._id}`}><b>{c.item.name}</b></Link><Badge type={c.status}>{c.status}</Badge></div>
                <p className="muted small">{c.claimant?.name} ({c.claimant?.email}), {fmtDate(c.createdAt)}</p>
                <dl className="qa">
                  <dt>Where lost</dt><dd>{c.answers.whereLost}</dd>
                  <dt>Unique feature</dt><dd>{c.answers.uniqueFeature}</dd>
                  <dt>Contents</dt><dd>{c.answers.contents}</dd>
                </dl>
              </div>
              {c.status === 'pending' && <div className="actions">
                <button className="btn sm" onClick={() => run(() => api(`/claims/${c._id}`, { method: 'PATCH', body: { status: 'approved' } }))}>Approve</button>
                <button className="btn ghost sm" onClick={() => run(() => api(`/claims/${c._id}`, { method: 'PATCH', body: { status: 'rejected' } }))}>Reject</button>
              </div>}
            </div>
          )))}

          {tab === 'reports' && (d.reports.length === 0 ? <p className="muted empty">No reported listings.</p> : d.reports.map((r) => (
            <div className="card row-card" key={r._id}>
              <div className="grow">
                <div className="row"><Link to={`/item/${r.item._id}`}><b>{r.item.name}</b></Link><Badge type={r.status === 'open' ? 'pending' : 'recovered'}>{r.status}</Badge></div>
                <p><b>{r.reason}</b>{r.note && <>: {r.note}</>}</p>
                <p className="muted small">Reported by {r.reporter?.name} on {fmtDate(r.createdAt)}</p>
              </div>
              <div className="actions">
                <button className="btn danger sm" onClick={() => del(r.item._id)}>Remove listing</button>
                {r.status === 'open' && <button className="btn ghost sm" onClick={() => run(() => api(`/reports/${r._id}`, { method: 'PATCH', body: { status: 'dismissed' } }))}>Dismiss</button>}
              </div>
            </div>
          )))}
        </>
      )}
    </div>
  );
}
