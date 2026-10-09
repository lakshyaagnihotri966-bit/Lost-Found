import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, getMeta } from '../api';
import { ItemCard, EmptyState } from '../components.jsx';
import Icon from '../Icons.jsx';

const empty = { q: '', type: '', category: '', location: '', color: '', brand: '', date: '' };

export default function Browse() {
  const [sp] = useSearchParams();
  const [f, setF] = useState({ ...empty, q: sp.get('q') || '', category: sp.get('category') || '', type: sp.get('type') || '' });
  const [more, setMore] = useState(false);
  const [meta, setMeta] = useState({ categories: [], locations: [] });
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => { getMeta().then(setMeta).catch(() => {}); }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
      api('/items?' + qs).then((d) => { setItems(d.items); setErr(''); }).catch((e) => setErr(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [f]);

  const active = Object.values(f).some(Boolean);
  const SEG = [['', 'All'], ['lost', 'Lost'], ['found', 'Found']];

  return (
    <div className="wrap page">
      <div className="page-head">
        <h1>Browse items</h1>
        <p>Everything reported on campus. See something that looks like yours? Open it and contact the finder.</p>
      </div>

      <div className="filterbar card">
        <label className="fsearch"><Icon name="search" /><input placeholder="Search by name or keyword" value={f.q} onChange={set('q')} aria-label="Search" /></label>
        <div className="seg" role="group" aria-label="Lost or found">
          {SEG.map(([v, l]) => <button key={l} type="button" className={f.type === v ? 'on' : ''} aria-pressed={f.type === v} onClick={() => setF({ ...f, type: v })}>{l}</button>)}
        </div>
        <select value={f.category} onChange={set('category')} aria-label="Category"><option value="">All categories</option>{meta.categories.map((c) => <option key={c}>{c}</option>)}</select>
        <select value={f.location} onChange={set('location')} aria-label="Location"><option value="">All locations</option>{meta.locations.map((c) => <option key={c}>{c}</option>)}</select>
        <button type="button" className={more ? 'btn ghost on' : 'btn ghost'} onClick={() => setMore(!more)} aria-expanded={more}><Icon name="filter" /> More</button>
        {more && (
          <div className="fmore">
            <input placeholder="Colour" value={f.color} onChange={set('color')} aria-label="Colour" />
            <input placeholder="Brand" value={f.brand} onChange={set('brand')} aria-label="Brand" />
            <input type="date" value={f.date} onChange={set('date')} aria-label="Date" />
          </div>
        )}
      </div>

      {err && <p className="error">{err}</p>}
      {items !== null && <p className="count-line muted small">{items.length} {items.length === 1 ? 'item' : 'items'}{active && <> · <button type="button" className="linkbtn" onClick={() => setF(empty)}>Clear filters</button></>}</p>}
      {items === null ? (
        <div className="grid">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="card item skel" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon="search" title="No items match these filters" text="Try fewer filters, or report your item so we can match it as soon as someone posts it.">
          <div className="row" style={{ justifyContent: 'center', marginTop: 14 }}>
            <Link className="btn lost-btn" to="/report/lost">Report a lost item</Link>
            {active && <button className="btn ghost" onClick={() => setF(empty)}>Clear filters</button>}
          </div>
        </EmptyState>
      ) : (
        <div className="grid">{items.map((i) => <ItemCard key={i._id} item={i} />)}</div>
      )}
    </div>
  );
}
