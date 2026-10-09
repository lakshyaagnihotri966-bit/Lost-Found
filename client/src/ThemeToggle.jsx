import { useEffect, useState } from 'react';
import Icon from './Icons.jsx';

export default function ThemeToggle() {
  const [t, setT] = useState(() => document.documentElement.getAttribute('data-theme') || 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch { /* ignore */ }
  }, [t]);
  const dark = t === 'dark';
  return (
    <button type="button" className="icon-btn" title={dark ? 'Switch to light theme' : 'Switch to dark theme'} aria-label="Toggle dark theme" onClick={() => setT(dark ? 'light' : 'dark')}>
      <Icon name={dark ? 'sun' : 'moon'} />
    </button>
  );
}
