import { NavLink } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Icon from './Icons.jsx';

// Floating bottom tab bar, phones only.
export default function MobileNav() {
  const { user, unread } = useAuth();
  const items = [
    ['/', 'home', 'Home', true],
    ['/browse', 'search', 'Browse'],
    ['/report/lost', 'flag', 'Lost'],
    ['/report/found', 'check', 'Found'],
    [user ? '/dashboard' : '/login', 'user', user ? 'Me' : 'Log in'],
  ];
  return (
    <nav className="mnav" aria-label="Quick navigation">
      {items.map(([to, ic, label, end]) => (
        <NavLink key={label} to={to} end={end} className="mn">
          <span className="mn-ic"><Icon name={ic} />{label === 'Me' && unread > 0 && <i className="mn-dot">{unread}</i>}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
