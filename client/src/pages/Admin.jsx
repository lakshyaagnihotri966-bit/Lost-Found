import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtDate } from '../api';
import { useAuth } from '../AuthContext.jsx';
import { Badge, Bars } from '../components.jsx';

const TABS = [['overview', 'Overview'], ['users', 'Users & admins'], ['lost', 'Lost items'], ['found', 'Found items'], ['claims', 'Claims'], ['reports', 'Reported listings']];

export default function Admin() {
  const { user: me } = useAuth();
  const [tab, setTab] = useState('overview');
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [sel, setSel] = useState([]);
  const [newAdmin, setNewAdmin] = useState('');

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
  useEffect(() => { setD(null); setSel([]); setQ(''); setStatus(''); setOk(''); load(); }, [load]);

  const run = async (fn, msg) => {
    setOk(''); setErr('');
    try { await fn(); if (msg) setOk(msg); await load(); } catch (e) { setErr(e.message); }
  };
  const del = (id) => confirm('Delete this listing permanently?') && run(() => api(`/items/${id}`, { method: 'DELETE' }), 'Listing deleted');
  const has = (v) => String(v || '').toLowerCase().includes(q.trim().toLowerCase());

  const users = d?.users ? d.users.filter((u) => !q || has(u.name) || has(u.email) || has(u.phone)) : [];
  const items = d?.items ? d.items.filter((i) => (!status || i.status === status) && (!q || has(i.name) || has(i.category) || has(i.location) || has(i.reporter?.name) || has(i.reporter?.email))) : [];
  const allSelected = items.length > 0 && items.every((i) => sel.includes(i._id));
  const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleAll = () => setSel(allSelected ? [] : items.map((i) => i._id));
  const bulkDelete = () => confirm(`Delete ${sel.length} selected listing(s) permanently?`) && run(async () => { await api('/admin/items/bulk-delete', { method: 'POST', body: { ids: sel } }); setSel([]); }, 'Selected listings deleted');
  const setRole = (u) => confirm(u.role === 'admin' ? `Remove admin access from ${u.name}?` : `Make ${u.name} an admin?`) &&
    run(() => api(`/admin/users/${u._id}/role`, { method: 'PATCH', body: { role: u.role === 'admin' ? 'user' : 'admin' } }), 'Role updated');
  const delUser = (u) => confirm(`Delete ${u.name} and all their listings and claims? This cannot be undone.`) && run(() => api(`/admin/users/${u._id}`, { method: 'DELETE' }), 'User deleted');
  const addAdmin = (e) => { e.preventDefault(); run(async () => { await api('/admin/users/add-admin', { method: 'POST', body: { email: newAdmin } }); setNewAdmin(''); }, 'Admin added'); };

  return (
    <div className="wrap page">
      <h1>Admin dashboard</h1>
      <div className="tabs">{TABS.map(([k, l]) => <button key={k} className={tab === k ? 'tab on' : 'tab'} onClick={() => setTab(k)}>{l}</button>)}</div>
      {err && <p className="error">{err}</p>}
      {ok && <p className="ok">{ok}</p>}
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
              {d.totals.openReports > 0 && <p className="card"><b>{d.totals.openReports}</b> reported listing(s) need review. <button className="btn sm" onClick={() => setTab('reports')}>Review now</button></p>}
              <div className="charts">
                <div className="card"><h3>Lost vs found</h3><Bars data={d.lostVsFound} colors={['var(--red)', 'var(--blue)']} /></div>
                <div className="card"><h3>Recovered items, last 6 months</h3><Bars data={d.recoveredByMonth} colors={Array(6).fill('var(--green)')} /></div>
                <div className="card"><h3>Items by category</h3><Bars data={d.byCategory} /></div>
                <div className="card"><h3>Items by location</h3><Bars data={d.byLocation} /></div>
              </div>
            </>
          )}

          {tab === 'users' && (
            <>
              <div className="toolbar">
                <input placeholder="Search name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search users" />
                <form className="toolbar grow" onSubmit={addAdmin} style={{ margin: 0 }}>
                  <input type="email" required placeholder="Add admin by Gmail address" value={newAdmin} onChange={(e) => setNewAdmin(e.target.value)} aria-label="New admin email" />
                  <button className="btn sm">Add admin</button>
                </form>
              </div>
              <div className="table-wrap"><table>
                <thead><tr><th>Name</th><th>Email</th><th>WhatsApp</th><th>Role</th><th>Listings</th><th>Joined</th><th></th></tr></thead>
                <tbody>{users.length === 0 ? <tr><td colSpan="7" className="muted">No users found.</td></tr> : users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.name}</td><td>{u.email}</td><td>{u.phone ? `+${u.phone}` : '-'}</td>
                    <td><Badge type={u.role === 'admin' ? 'approved' : 'active'}>{u.role}</Badge>{u.isSuper && <span className="muted small"> permanent</span>}</td>
                    <td>{u.itemCount}</td><td>{fmtDate(u.createdAt)}</td>
                    <td className="actions">
                      {u._id !== me.id && !u.isSuper && <>
                        <button className="btn ghost sm" onClick={() => setRole(u)}>{u.role === 'admin' ? 'Remove admin' : 'Make admin'}</button>
                        <button className="btn danger sm" onClick={() => delUser(u)}>Delete</button>
                      </>}
                    </td>
                  </tr>))}</tbody>
              </table></div>
            </>
          )}

          {(tab === 'lost' || tab === 'found') && (
            <>
              <div className="toolbar">
                <input placeholder="Search item, category, place or user" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search items" />
                <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="">All statuses</option><option value="active">Active</option><option value="recovered">Recovered</option></select>
              </div>
              {sel.length > 0 && (
                <div className="card toolbar bulk">
                  <b>{sel.length} selected</b>
                  <button className="btn danger sm" onClick={bulkDelete}>Delete selected</button>
                  <button className="btn ghost sm" onClick={() => setSel([])}>Clear</button>
                </div>
              )}
              <div className="table-wrap"><table>
                <thead><tr><th><input type="checkbox" className="chk" checked={allSelected} onChange={toggleAll} aria-label="Select all" /></th><th>Item</th><th>Category</th><th>Location</th><th>By</th><th>Date</th><th>Status</th><th></th></tr></thead>
                <tbody>{items.length === 0 ? <tr><td colSpan="8" className="muted">No items.</td></tr> : items.map((i) => (
                  <tr key={i._id}>
                    <td><input type="checkbox" className="chk" checked={sel.includes(i._id)} onChange={() => toggle(i._id)} aria-label={`Select ${i.name}`} /></td>
                    <td><Link to={`/item/${i._id}`}>{i.name}</Link></td><td>{i.category}</td><td>{i.location}</td>
                    <td>{i.reporter?.name}<br /><span className="muted small">{i.reporter?.email}</span></td>
                    <td>{fmtDate(i.date)}</td>
                    <td><Badge type={i.status === 'recovered' ? 'recovered' : 'active'}>{i.status}</Badge></td>
                    <td className="actions">
                      {i.status !== 'recovered' && <button className="btn ghost sm" onClick={() => run(() => api(`/items/${i._id}/recover`, { method: 'PATCH' }), 'Marked recovered')}>Mark recovered</button>}
                      <button className="btn danger sm" onClick={() => del(i._id)}>Delete</button>
                    </td>
                  </tr>))}</tbody>
              </table></div>
            </>
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
