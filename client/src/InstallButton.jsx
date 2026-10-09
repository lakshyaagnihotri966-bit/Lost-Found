import { useEffect, useState } from 'react';
import Icon from './Icons.jsx';

// "Install app": browser prompt on Android/desktop, a hint on iPhone.
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
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (!ev && !ios) return null;
  const click = async () => {
    if (ev) { ev.prompt(); await ev.userChoice; setEv(null); } else alert('To install: tap the Share button, then "Add to Home Screen".');
  };
  return <button type="button" className="btn ghost sm" onClick={click}><Icon name="download" /> Install app</button>;
}
