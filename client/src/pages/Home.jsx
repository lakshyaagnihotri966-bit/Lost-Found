import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { ItemCard } from '../components.jsx';

const steps = [
  ['Report', 'Post what you lost or found with a photo and the place it happened.', 'var(--red)'],
  ['Match', 'We compare name, category, colour, brand, place and date, then alert both people.', 'var(--blue-2)'],
  ['Claim', 'The owner proves it is theirs, or chats with the finder on WhatsApp.', 'var(--star)'],
  ['Recover', 'The finder or an admin approves, and the item goes home.', 'var(--green)'],
];
const CATS = [['Electronics', '💻'], ['Books & Notes', '📚'], ['ID & Cards', '🪪'], ['Wallet & Money', '👛'], ['Bags', '🎒'], ['Keys', '🔑'], ['Clothing', '👕'], ['Accessories', '🕶️'], ['Sports', '⚽'], ['Stationery', '✏️']];
const QUICK = ['Bags', 'Electronics', 'ID & Cards', 'Keys'];

function Stat({ label, value, color }) {
  return <div className="stat-pill"><b style={{ color }}>{value}</b><span>{label}</span></div>;
}

export default function Home() {
  const nav = useNavigate();
  const [s, setS] = useState({ total: 0, lost: 0, found: 0, recovered: 0 });
  const [recent, setRecent] = useState(null);
  const [q, setQ] = useState('');
  useEffect(() => { api('/items/stats').then(setS).catch(() => {}); }, []);
  useEffect(() => { api('/items').then((d) => setRecent(d.items.slice(0, 6))).catch(() => setRecent([])); }, []);
  const search = (e) => { e.preventDefault(); nav(`/browse${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`); };

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <span className="pill">MPGI campus lost and found</span>
            <h1>Lost it on campus? Found something? Let's get it home.</h1>
            <p className="lead">One place for every student and staff member at MPGI to report missing belongings, spot matches and claim what is theirs.</p>
            <form className="search-hero" onSubmit={search} role="search">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for an item, e.g. black bag or ID card" aria-label="Search items" />
              <button className="btn">Search</button>
            </form>
            <div className="chips">{QUICK.map((c) => <Link key={c} className="chip" to={`/browse?category=${encodeURIComponent(c)}`}>{c}</Link>)}</div>
            <div className="cta">
              <Link className="btn lost-btn big" to="/report/lost">I lost something</Link>
              <Link className="btn found-btn big" to="/report/found">I found something</Link>
            </div>
            <div className="trust"><span>Sign in with Google</span><span>Smart matching</span><span>WhatsApp contact</span></div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="ticket back">
              <div className="ticket-main">
                <div className="ticket-top"><span>Lost report</span><span>Library</span></div>
                <h3>Black Dell laptop bag</h3>
              </div>
            </div>
            <div className="ticket front">
              <div className="ticket-main">
                <div className="ticket-top"><span>Claim ticket No. 0427</span><span className="stamp">Matched</span></div>
                <h3>Black laptop bag</h3>
                <dl>
                  <div><dt>Lost at</dt><dd>Library</dd></div>
                  <div><dt>Found at</dt><dd>Reading hall</dd></div>
                  <div><dt>Match</dt><dd>92%</dd></div>
                </dl>
              </div>
              <div className="ticket-stub"><span className="barcode" /><span>Owner notified on WhatsApp</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap" aria-label="Live statistics">
        <div className="logbook">
          <Stat label="Items reported" value={s.total} color="var(--ink)" />
          <Stat label="Still lost" value={s.lost} color="var(--red)" />
          <Stat label="Waiting to be claimed" value={s.found} color="var(--blue-2)" />
          <Stat label="Back with owners" value={s.recovered} color="var(--green)" />
        </div>
      </section>

      <section className="wrap section">
        <h2>Browse by category</h2>
        <div className="cats">{CATS.map(([c, e]) => <Link key={c} className="cat" to={`/browse?category=${encodeURIComponent(c)}`}><span>{e}</span>{c}</Link>)}</div>
      </section>

      {recent && recent.length > 0 && (
        <section className="wrap section">
          <div className="row between"><h2 style={{ margin: 0 }}>Recently reported</h2><Link to="/browse">View all</Link></div>
          <div className="grid" style={{ marginTop: 20 }}>{recent.map((i) => <ItemCard key={i._id} item={i} />)}</div>
        </section>
      )}

      <section className="wrap section">
        <h2>How it works</h2>
        <p className="muted">Four steps from missing to recovered.</p>
        <ol className="steps">
          {steps.map(([t, d, c], i) => (
            <li key={t} style={{ '--c': c }}><span className="n">{i + 1}</span><div><h3>{t}</h3><p>{d}</p></div></li>
          ))}
        </ol>
      </section>

      <section className="wrap">
        <div className="cta-band">
          <div><h2>Found something? Report it in a minute.</h2><p>A photo and the place is enough. The owner gets alerted the moment it matches.</p></div>
          <div className="row"><Link className="btn light big" to="/report/found">Report a found item</Link><Link className="btn outline-light big" to="/browse">Browse items</Link></div>
        </div>
      </section>
    </>
  );
}
