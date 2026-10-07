import { Routes, Route, Link, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';
import Home from './pages/Home.jsx';
import Auth from './pages/Auth.jsx';
import Browse from './pages/Browse.jsx';
import Report from './pages/Report.jsx';
import ItemDetail from './pages/ItemDetail.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Admin from './pages/Admin.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import PhoneGate from './PhoneGate.jsx';
import Background from './Background.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import MobileNav from './MobileNav.jsx';
import InstallButton from './InstallButton.jsx';

function Avatar({ user }) {
  return <span className="avatar">{user.avatar ? <img src={user.avatar} alt="" referrerPolicy="no-referrer" /> : (user.name || '?').charAt(0).toUpperCase()}</span>;
}

function Navbar() {
  const { user, logout, unread } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 8);
    f(); window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  const close = () => setOpen(false);
  return (
    <header className={scrolled ? 'nav scrolled' : 'nav'}>
      <div className="wrap nav-in">
        <Link to="/" className="brand" onClick={close} aria-label="MPGI Lost & Found home"><img src="/logo.png" alt="MPGI - blend of fine education" /><span className="brand-sub">Lost &amp; Found</span></Link>
        <button className="burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '✕' : '☰'}</button>
        <nav className={open ? 'links open' : 'links'} onClick={close}>
          <NavLink to="/browse">Browse</NavLink>
          <NavLink to="/report/lost">Report lost</NavLink>
          <NavLink to="/report/found">Report found</NavLink>
          <span className="sep" />
          <ThemeToggle />
          <InstallButton />
          {user ? (
            <>
              <NavLink to="/dashboard">Dashboard{unread > 0 && <span className="dot">{unread}</span>}</NavLink>
              {user.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
              <Avatar user={user} />
              <button className="btn ghost sm" onClick={logout}>Log out</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Log in</NavLink>
              <Link className="btn sm" to="/register">Get started</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export function Protected({ children, admin }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="wrap page muted">Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname + loc.search }} replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const loc = useLocation();
  return (
    <>
      <Background />
      <ScrollTop />
      <Navbar />
      <PhoneGate />
      <main>
        <ErrorBoundary key={loc.pathname}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/item/:id" element={<ItemDetail />} />
          <Route path="/report/:type" element={<Protected><Report /></Protected>} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/admin" element={<Protected admin><Admin /></Protected>} />
          <Route path="*" element={<div className="wrap page"><h1>Page not found</h1><Link to="/">Back to home</Link></div>} />
        </Routes>
        </ErrorBoundary>
      </main>
      <footer className="foot">
        <div className="wrap foot-in">
          <div>
            <img src="/logo.png" alt="MPGI" className="foot-logo" />
            <p>MPGI Campus Lost &amp; Found, a service of Maharana Pratap Group of Institutions. Report it. Match it. Claim it. Recover it.</p>
          </div>
          <div><h4>Explore</h4><ul><li><Link to="/browse">Browse items</Link></li><li><Link to="/report/lost">Report a lost item</Link></li><li><Link to="/report/found">Report a found item</Link></li></ul></div>
          <div><h4>Account</h4><ul><li><Link to="/dashboard">Dashboard</Link></li><li><Link to="/login">Log in</Link></li></ul></div>
        </div>
        <div className="foot-bar"><div className="wrap"><span>Maharana Pratap Group of Institutions, Kanpur</span><span>Built for the MPGI community</span></div></div>
      </footer>
      <MobileNav />
    </>
  );
}
