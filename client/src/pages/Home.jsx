import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { ItemCard, CountUp } from '../components.jsx';
import Icon, { CATEGORY_ICON } from '../Icons.jsx';

const CATS = ['Electronics', 'Books & Notes', 'ID & Cards', 'Wallet & Money', 'Bags', 'Keys', 'Clothing', 'Accessories', 'Sports', 'Stationery'];
const QUICK = ['Bags', 'Electronics', 'ID & Cards', 'Keys', 'Wallet & Money'];

const TRUST = [
  ['shield', 'Google-verified accounts', 'Everyone signs in with a real Google account. No throwaway registrations, no anonymous posts.'],
  ['lock', 'Ownership checks', 'Claimers answer questions only the real owner can, and the finder reviews them before approving.'],
  ['phone', 'Private by default', 'Phone numbers never appear on public pages. They are shown only to signed-in members.'],
  ['flag', 'Moderated by admins', 'Anyone can report a suspicious listing. Admins review it and remove spam or fake posts.'],
  ['qr', 'QR codes for found items', 'Print the code, stick it on the item or notice board, and a scan opens its page.'],
  ['bell', 'Instant alerts', 'Get notified in the app and by email the moment a match or a claim comes in.'],
];

const STEPS = [
  ['Report', 'Post what you lost or found, with a photo and the place.', 'var(--red)'],
  ['Match', 'We compare name, category, colour, brand, place and date.', 'var(--blue-2)'],
  ['Claim', 'The owner proves it is theirs, or chats with the finder.', 'var(--star)'],
  ['Recover', 'The finder approves and the item goes home.', 'var(--green)'],
];

const MATCH = [['Name', 95], ['Category', 100], ['Colour', 100], ['Place', 80], ['Date', 90]];

export default function Home() {
  const nav = useNavigate();
  const [s, setS] = useState({ total: 0, lost: 0, found: 0, recovered: 0 });
  const [recent, setRecent] = useState(null);
  const [q, setQ] = useState('');
  useEffect(() => { api('/items/stats').then(setS).catch(() => {}); }, []);
  useEffect(() => { api('/items').then((d) => setRecent(d.items.slice(0, 8))).catch(() => setRecent([])); }, []);
  const search = (e) => { e.preventDefault(); nav(`/browse${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`); };
  const rate = s.total ? Math.round((s.recovered / s.total) * 100) : 0;

  return (
    <>
      <section className="hero2">
        <div className="wrap">
          <span className="hero-badge"><i>Live</i>{s.recovered} items are back with their owners</span>
          <h1>Lost it on campus? Found something? Let's get it home.</h1>
          <p className="lead">The official lost and found for MPGI. Report in a minute, get matched automatically, and claim what is yours.</p>
          <form className="searchbar" onSubmit={search} role="search">
            <Icon name="search" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for an item, like black bag or ID card" aria-label="Search items" />
            <button className="btn">Search</button>
          </form>
          <div className="chips">{QUICK.map((c) => <Link key={c} className="chip" to={`/browse?category=${encodeURIComponent(c)}`}>{c}</Link>)}</div>
          <div className="cta">
            <Link className="btn lost-btn big" to="/report/lost"><Icon name="flag" /> I lost something</Link>
            <Link className="btn found-btn big" to="/report/found"><Icon name="check" /> I found something</Link>
          </div>
        </div>
      </section>

      <section className="wrap" aria-label="Recovery statistics">
        <div className="stats-grid">
          <div className="stat-card"><b><CountUp value={s.total} /></b><span>Items reported</span></div>
          <div className="stat-card"><b style={{ color: 'var(--red)' }}><CountUp value={s.lost} /></b><span>Still looking for owners</span></div>
          <div className="stat-card"><b style={{ color: 'var(--blue-2)' }}><CountUp value={s.found} /></b><span>Waiting to be claimed</span></div>
          <div className="stat-card"><b style={{ color: 'var(--green)' }}><CountUp value={s.recovered} /></b><span>Recovered, a {rate}% recovery rate</span><div className="meter"><i style={{ width: `${rate}%` }} /></div></div>
        </div>
      </section>

      <section className="wrap section">
        <div className="section-head"><div><h2>Browse by category</h2><p>Jump straight to the kind of item you are looking for.</p></div></div>
        <div className="cats">{CATS.map((c) => <Link key={c} className="cat" to={`/browse?category=${encodeURIComponent(c)}`}><span><Icon name={CATEGORY_ICON[c]} /></span>{c}</Link>)}</div>
      </section>

      {recent && recent.length > 0 && (
        <section className="wrap section">
          <div className="section-head"><div><h2>Recently reported</h2><p>The latest items on campus.</p></div><Link className="btn ghost sm" to="/browse">View all <Icon name="arrow" /></Link></div>
          <div className="grid">{recent.map((i) => <ItemCard key={i._id} item={i} />)}</div>
        </section>
      )}

      <section className="wrap section">
        <div className="smart">
          <div>
            <span className="kicker"><Icon name="sparkle" /> Smart Match</span>
            <h2>It finds the match before you even look.</h2>
            <p className="muted">Every new report is compared with everything on the other side, lost against found. When enough details line up, both people are notified straight away.</p>
            <ul>
              <li><Icon name="check" /> Compares name, category, colour, brand, place and date</li>
              <li><Icon name="check" /> Scores every pair out of 100, and shows only strong matches</li>
              <li><Icon name="check" /> Alerts both people in the app and by email</li>
            </ul>
          </div>
          <div className="match-card" aria-label="Example of a smart match">
            <div className="m-row"><span className="m-ic"><Icon name="bag" /></span><div><b>Black Dell laptop bag</b><small>Lost at Library</small></div><span className="badge lost">Lost</span></div>
            <div className="m-link">
              <div className="m-score"><span>92%</span></div>
              <div className="m-bars">{MATCH.map(([l, v]) => <div key={l}>{l}<i style={{ '--w': `${v}%` }} /></div>)}</div>
            </div>
            <div className="m-row"><span className="m-ic"><Icon name="bag" /></span><div><b>Dell backpack</b><small>Found at Library</small></div><span className="badge found">Found</span></div>
            <div className="m-foot"><Icon name="bell" /> Both owners notified instantly. Example match.</div>
          </div>
        </div>
      </section>

      <section className="wrap section">
        <div className="section-head"><div><h2>Built to be trusted</h2><p>Lost items are personal. So we made handing them back safe.</p></div></div>
        <div className="trust-grid">
          {TRUST.map(([ic, t, d]) => (
            <div className="feat" key={t}><span className="feat-ic"><Icon name={ic} /></span><h3>{t}</h3><p>{d}</p></div>
          ))}
        </div>
      </section>

      <section className="wrap section">
        <div className="section-head"><div><h2>How it works</h2><p>Four steps from missing to recovered.</p></div></div>
        <ol className="steps">
          {STEPS.map(([t, d, c], i) => (
            <li key={t} style={{ '--c': c }}><span className="n">Step {i + 1}</span><h3>{t}</h3><p>{d}</p></li>
          ))}
        </ol>
      </section>

      <section className="wrap">
        <div className="cta-band">
          <h2>Found something? Report it in a minute.</h2>
          <p>A photo and the place is enough. The owner is alerted the moment it matches.</p>
          <div className="row">
            <Link className="btn light big" to="/report/found">Report a found item</Link>
            <Link className="btn outline-light big" to="/browse">Browse items</Link>
          </div>
        </div>
      </section>
    </>
  );
}
