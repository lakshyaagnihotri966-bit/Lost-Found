import { Routes, Route, Link, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
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

function Navbar() {
  const { user, logout, unread } = useAuth();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <header className="nav">
      <div className="wrap nav-in">
        <Link to="/" className="brand" onClick={close} aria-label="MPGI Lost & Found home"><img src="/logo.png" alt="MPGI - blend of fine education" /><span className="brand-sub">Lost &amp; Found</span></Link>
        <button className="burger" aria-label="Menu" onClick={() => setOpen(!open)}>☰</button>
        <nav className={open ? 'links open' : 'links'} onClick={close}>
          <NavLink to="/browse">Browse</NavLink>
          <NavLink to="/report/lost">Report lost</NavLink>
          <NavLink to="/report/found">Report found</NavLink>
          <ThemeToggle />
          <InstallButton />
          {user ? (
            <>
              <NavLink to="/dashboard">Dashboard{unread > 0 && <span className="dot">{unread}</span>}</NavLink>
              {user.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
              <button className="btn ghost sm" onClick={logout}>Log out</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Log in</NavLink>
              <Link className="btn sm" to="/register">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
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
        <svg className="foot-wave" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60 C 360 0, 900 10, 1440 50 L1440 60 Z" fill="#5aa327" /></svg>
        <div className="wrap foot-in">
          <img src="/logo.png" alt="MPGI" className="foot-logo" />
          <p>MPGI Campus Lost &amp; Found, a service of Maharana Pratap Group of Institutions.<br />Report it. Match it. Claim it. Recover it.</p>
        </div>
      </footer>
      <MobileNav />
    </>
  );
}
