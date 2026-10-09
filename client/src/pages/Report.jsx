import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { api, getMeta } from '../api';
import Icon from '../Icons.jsx';

export default function Report() {
  const { type } = useParams();
  const nav = useNavigate();
  const [meta, setMeta] = useState({ categories: [], locations: [] });
  const [f, setF] = useState({ name: '', category: '', description: '', color: '', brand: '', date: new Date().toISOString().slice(0, 10), location: '', additional: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { getMeta().then(setMeta).catch(() => {}); }, []);
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
      <div className="page-head">
        <span className={lost ? 'kicker lost' : 'kicker found'}><Icon name={lost ? 'flag' : 'check'} /> {lost ? 'Lost item' : 'Found item'}</span>
        <h1>{lost ? 'Tell us what you lost' : 'Tell us what you found'}</h1>
        <p>{lost ? 'The more detail you add, the better the match.' : 'Do not write private details such as ID numbers. The owner will prove ownership when claiming.'}</p>
      </div>
      <form className="card form report" onSubmit={submit}>
        <fieldset>
          <legend>The item</legend>
          <label>Item name<input required value={f.name} onChange={set('name')} placeholder="e.g. Black Dell laptop bag" /></label>
          <div className="two">
            <label>Category<select required value={f.category} onChange={set('category')}><option value="">Choose…</option>{meta.categories.map((c) => <option key={c}>{c}</option>)}</select></label>
            <label>Colour<input value={f.color} onChange={set('color')} placeholder="e.g. Black" /></label>
          </div>
          <label>Brand<input value={f.brand} onChange={set('brand')} placeholder="e.g. Dell (optional)" /></label>
        </fieldset>

        <fieldset>
          <legend>Where and when</legend>
          <div className="two">
            <label>{lost ? 'Where did you lose it?' : 'Where did you find it?'}<select required value={f.location} onChange={set('location')}><option value="">Choose…</option>{meta.locations.map((c) => <option key={c}>{c}</option>)}</select></label>
            <label>Date {lost ? 'lost' : 'found'}<input type="date" required max={new Date().toISOString().slice(0, 10)} value={f.date} onChange={set('date')} /></label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Details</legend>
          <label>Description<textarea rows="3" value={f.description} onChange={set('description')} placeholder="Size, marks, stickers, what it looks like" /></label>
          <label>Additional details<textarea rows="2" value={f.additional} onChange={set('additional')} placeholder="Anything else that helps" /></label>
        </fieldset>

        <fieldset>
          <legend>Photo</legend>
          <label className="drop">
            {preview ? <img src={preview} alt="Selected" /> : <><Icon name="image" size={26} /><b>Add a photo</b><span>Optional, up to 5 MB</span></>}
            <input type="file" accept="image/*" onChange={pick} />
          </label>
        </fieldset>

        {err && <p className="error">{err}</p>}
        <button className={lost ? 'btn lost-btn big' : 'btn found-btn big'} disabled={busy}>{busy ? 'Submitting…' : lost ? 'Submit lost report' : 'Submit found report'}</button>
      </form>
    </div>
  );
}
