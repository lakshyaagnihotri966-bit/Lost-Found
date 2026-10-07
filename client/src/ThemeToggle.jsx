import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [t, setT] = useState(() => document.documentElement.getAttribute('data-theme') || 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch { /* ignore */ }
  }, [t]);
  return (
    <button type="button" className="icon-btn" title={t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} aria-label="Toggle dark theme" onClick={() => setT(t === 'dark' ? 'light' : 'dark')}>
      {t === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
