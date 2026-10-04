import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { ItemCard } from '../components.jsx';

const steps = [
  ['📝', 'Report', 'Post what you lost or found with a photo and the place it happened.', 'var(--red)'],
  ['🤝', 'Match', 'We compare name, category, colour, brand, place and date, then alert both people.', 'var(--blue)'],
  ['🔐', 'Claim', 'The owner proves it is theirs, or chats with the finder on WhatsApp.', 'var(--star)'],
  ['🎉', 'Recover', 'The finder or an admin approves, and the item goes home.', 'var(--green)'],
];
const QUICK = ['Bags', 'Electronics', 'ID & Cards', 'Keys', 'Wallet & Money', 'Books & Notes'];

function Stat({ label, value, color }) {
  return (
    <div className="stat-pill">
      <b style={{ color }}>{value}</b>
      <span>{label}</span>
    </div>
  );
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
        <div className="wrap hero-in">
          <div className="hero-copy">
            <p className="hero-kicker">Maharana Pratap Group of Institutions</p>
            <h1>Lost something on campus? <span className="grad">Let's get it home.</span></h1>
            <p className="lead">One place for every student and staff member at MPGI to report missing belongings, spot matches, and claim what is theirs.</p>
            <form className="search-hero" onSubmit={search} role="search">
              <span aria-hidden="true">🔍</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your item, e.g. black bag, ID card" aria-label="Search items" />
              <button className="btn">Search</button>
            </form>
            <div className="chips">{QUICK.map((c) => <Link key={c} className="chip" to={`/browse?category=${encodeURIComponent(c)}`}>{c}</Link>)}</div>
            <div className="cta">
              <Link className="btn lost-btn big" to="/report/lost">I lost something</Link>
              <Link className="btn found-btn big" to="/report/found">I found something</Link>
            </div>
          </div>
          <div className="hero-art"><div className="logo-card"><img src="/logo.png" alt="MPGI, blend of fine education" /></div></div>
        </div>
      </section>

      <section className="wrap stats-band" aria-label="Live statistics">
        <Stat label="Total items" value={s.total} color="var(--blue)" />
        <Stat label="Lost" value={s.lost} color="var(--red)" />
        <Stat label="Found" value={s.found} color="var(--blue)" />
        <Stat label="Recovered" value={s.recovered} color="var(--green)" />
      </section>

      {recent && recent.length > 0 && (
        <section className="wrap recent">
          <div className="row between"><h2>Recently reported</h2><Link to="/browse">View all →</Link></div>
          <div className="grid">{recent.map((i) => <ItemCard key={i._id} item={i} />)}</div>
        </section>
      )}

      <section className="wrap page how">
        <h2 className="center">How it works</h2>
        <p className="center muted sub">Four simple steps from missing to recovered.</p>
        <ol className="steps">
          {steps.map(([ic, t, d, c], i) => (
            <li key={t} style={{ '--c': c }}>
              <span className="n">{ic}</span>
              <h3>{i + 1}. {t}</h3>
              <p className="muted">{d}</p>
            </li>
          ))}
        </ol>
        <div className="center cta-end">
          <Link className="btn big" to="/browse">See what has been found</Link>
        </div>
      </section>
    </>
  );
}
