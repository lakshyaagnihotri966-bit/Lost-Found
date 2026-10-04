import { useEffect, useState } from 'react';

// "Install app" button: uses the browser prompt on Android/desktop, shows a hint on iPhone.
export default function InstallButton() {
  const [ev, setEv] = useState(null);
  useEffect(() => {
    const h = (e) => { e.preventDefault(); setEv(e); };
    const done = () => setEv(null);
    window.addEventListener('beforeinstallprompt', h);
    window.addEventListener('appinstalled', done);
    return () => { window.removeEventListener('beforeinstallprompt', h); window.removeEventListener('appinstalled', done); };
  }, []);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (standalone) return null;
  if (ev) return <button type="button" className="btn ghost sm" onClick={async () => { ev.prompt(); await ev.userChoice; setEv(null); }}>📲 Install app</button>;
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return <button type="button" className="btn ghost sm" onClick={() => alert('To install: tap the Share button, then "Add to Home Screen".')}>📲 Install app</button>;
  return null;
}
