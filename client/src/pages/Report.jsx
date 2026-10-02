import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { api, getMeta } from '../api';

export default function Report() {
  const { type } = useParams();
  const nav = useNavigate();
  const [meta, setMeta] = useState({ categories: [], locations: [] });
  const [f, setF] = useState({ name: '', category: '', description: '', color: '', brand: '', date: new Date().toISOString().slice(0, 10), location: '', additional: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { getMeta().then(setMeta); }, []);
  if (!['lost', 'found'].includes(type)) return <Navigate to="/" replace />;
  const lost = type === 'lost';
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const pick = (e) => {
    const x = e.target.files[0];
    setFile(x || null); setPreview(x ? URL.createObjectURL(x) : '');
  };
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const form = new FormData();
      form.append('type', type);
      Object.entries(f).forEach(([k, v]) => form.append(k, v));
      if (file) form.append('image', file);
      const d = await api('/items', { method: 'POST', form });
      nav(`/item/${d.item._id}`);
    } catch (e2) { setErr(e2.message); setBusy(false); }
  };

  return (
    <div className="wrap page narrow">
      <h1>{lost ? 'Report a lost item' : 'Report a found item'}</h1>
      <p className="muted">{lost ? 'The more detail you add, the better the match.' : 'Do not write private details such as ID numbers. The owner will prove ownership when claiming.'}</p>
      <form className="card form" onSubmit={submit}>
        <label>Item name<input required value={f.name} onChange={set('name')} placeholder="e.g. Black Dell laptop bag" /></label>
        <div className="two">
          <label>Category<select required value={f.category} onChange={set('category')}><option value="">Choose…</option>{meta.categories.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label>{lost ? 'Where did you lose it?' : 'Where did you find it?'}<select required value={f.location} onChange={set('location')}><option value="">Choose…</option>{meta.locations.map((c) => <option key={c}>{c}</option>)}</select></label>
        </div>
        <div className="two">
          <label>Colour<input value={f.color} onChange={set('color')} /></label>
          <label>Brand<input value={f.brand} onChange={set('brand')} /></label>
        </div>
        <label>Date {lost ? 'lost' : 'found'}<input type="date" required max={new Date().toISOString().slice(0, 10)} value={f.date} onChange={set('date')} /></label>
        <label>Description<textarea rows="3" value={f.description} onChange={set('description')} /></label>
        <label>Additional details<textarea rows="2" value={f.additional} onChange={set('additional')} placeholder="Anything else that helps" /></label>
        <label>Photo (optional, up to 5 MB)<input type="file" accept="image/*" onChange={pick} /></label>
        {preview && <img className="preview" src={preview} alt="Selected" />}
        {err && <p className="error">{err}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Submitting…' : lost ? 'Submit lost report' : 'Submit found report'}</button>
      </form>
    </div>
  );
}
