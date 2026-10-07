import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, getMeta } from '../api';
import { ItemCard } from '../components.jsx';

const empty = { q: '', type: '', category: '', location: '', color: '', brand: '', date: '' };

export default function Browse() {
  const [sp] = useSearchParams();
  const [f, setF] = useState({ ...empty, q: sp.get('q') || '', category: sp.get('category') || '', type: sp.get('type') || '' });
  const [meta, setMeta] = useState({ categories: [], locations: [] });
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => { getMeta().then(setMeta); }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
      api('/items?' + qs).then((d) => { setItems(d.items); setErr(''); }).catch((e) => setErr(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [f]);

  return (
    <div className="wrap page">
      <div className="page-head"><h1>Browse items</h1><p>Everything reported on campus. See something that looks like yours? Open it and contact the finder.</p></div>
      <div className="filters card">
        <input placeholder="Search by name or keyword" value={f.q} onChange={set('q')} aria-label="Search" />
        <select value={f.type} onChange={set('type')} aria-label="Lost or found"><option value="">Lost &amp; found</option><option value="lost">Lost</option><option value="found">Found</option></select>
        <select value={f.category} onChange={set('category')} aria-label="Category"><option value="">All categories</option>{meta.categories.map((c) => <option key={c}>{c}</option>)}</select>
        <select value={f.location} onChange={set('location')} aria-label="Location"><option value="">All locations</option>{meta.locations.map((c) => <option key={c}>{c}</option>)}</select>
        <input placeholder="Colour" value={f.color} onChange={set('color')} aria-label="Colour" />
        <input placeholder="Brand" value={f.brand} onChange={set('brand')} aria-label="Brand" />
        <input type="date" value={f.date} onChange={set('date')} aria-label="Date" />
        <button className="btn ghost" onClick={() => setF(empty)}>Clear filters</button>
      </div>
      {err && <p className="error">{err}</p>}
      {items === null ? <div className="grid">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="card item skel" />)}</div> : items.length === 0 ? (
        <p className="muted empty">No items match these filters. Try fewer filters, or report your item so we can match it later.</p>
      ) : (
        <div className="grid">{items.map((i) => <ItemCard key={i._id} item={i} />)}</div>
      )}
    </div>
  );
}
