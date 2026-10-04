import { NavLink } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

// Bottom tab bar, shown on phones only.
export default function MobileNav() {
  const { user, unread } = useAuth();
  const items = [
    ['/', '🏠', 'Home', true],
    ['/browse', '🔍', 'Browse'],
    ['/report/lost', '❗', 'Lost'],
    ['/report/found', '✅', 'Found'],
    [user ? '/dashboard' : '/login', '👤', user ? 'Me' : 'Log in'],
  ];
  return (
    <nav className="mnav" aria-label="Quick navigation">
      {items.map(([to, ic, label, end]) => (
        <NavLink key={label} to={to} end={end} className="mn">
          <span className="mn-ic">{ic}{label === 'Me' && unread > 0 && <i className="mn-dot">{unread}</i>}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
