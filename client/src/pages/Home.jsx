import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { ItemCard } from '../components.jsx';

const steps = [
  ['Report', 'Post what you lost or found with a photo and the place it happened.', 'var(--red)'],
  ['Match', 'We compare name, category, colour, brand, place and date, then alert both people.', 'var(--blue)'],
  ['Claim', 'The owner answers verification questions that only they can answer.', 'var(--star)'],
  ['Recover', 'The finder or an admin approves, and the item goes home.', 'var(--green)'],
];

function Stat({ label, value, color }) {
  return (
    <div className="stat-pill">
      <b style={{ color }}>{value}</b>
      <span>{label}</span>
    </div>
  );
}

export default function Home() {
  const [s, setS] = useState({ total: 0, lost: 0, found: 0, recovered: 0 });
  const [recent, setRecent] = useState(null);
  useEffect(() => { api('/items/stats').then(setS).catch(() => {}); }, []);
  useEffect(() => { api('/items').then((d) => setRecent(d.items.slice(0, 6))).catch(() => setRecent([])); }, []);
  return (
    <>
      <section className="hero">
        <div className="wrap hero-in">
          <div className="hero-copy">
            <p className="hero-kicker">Maharana Pratap Group of Institutions</p>
            <h1>Lost it on campus? Found it on campus? Let's get it home.</h1>
            <p className="lead">One place for every student and staff member at MPGI to report missing belongings, spot matches, and claim what is theirs.</p>
            <div className="cta">
              <Link className="btn lost-btn big" to="/report/lost">I lost something</Link>
              <Link className="btn found-btn big" to="/report/found">I found something</Link>
              <Link className="btn ghost big" to="/browse">Browse items</Link>
            </div>
          </div>

          <div className="hero-art"><div className="logo-card"><img src="/logo.png" alt="MPGI, blend of fine education" /></div></div>
        </div>
        <svg className="hero-wave" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 70 C 300 10, 700 20, 1440 80 L1440 90 L0 90Z" fill="#5aa327" />
          <path d="M0 84 C 400 40, 900 50, 1440 88 L1440 90 L0 90Z" fill="var(--bg)" />
        </svg>
      </section>

      <section className="wrap stats-band" aria-label="Live statistics">
        <Stat label="Total items" value={s.total} color="var(--blue)" />
        <Stat label="Lost" value={s.lost} color="var(--red)" />
        <Stat label="Found" value={s.found} color="var(--blue)" />
        <Stat label="Recovered" value={s.recovered} color="var(--green)" />
      </section>

      {recent && recent.length > 0 && (
        <section className="wrap recent">
          <div className="row between"><h2>Recently reported</h2><Link to="/browse">View all</Link></div>
          <div className="grid">{recent.map((i) => <ItemCard key={i._id} item={i} />)}</div>
        </section>
      )}

      <section className="wrap page how">
        <h2 className="center">How it works</h2>
        <p className="center muted sub">Four simple steps from missing to recovered.</p>
        <ol className="steps">
          {steps.map(([t, d, c], i) => (
            <li key={t} style={{ '--c': c }}>
              <span className="n">{i + 1}</span>
              <h3>{t}</h3>
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
