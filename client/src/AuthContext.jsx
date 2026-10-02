import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem('token')) { setLoading(false); return; }
    api('/auth/me').then((d) => setUser(d.user)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
  }, []);

  const refreshUnread = useCallback(() => {
    if (!localStorage.getItem('token')) return;
    api('/notifications/unread-count').then((d) => setUnread(d.count)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    refreshUnread();
    const t = setInterval(refreshUnread, 30000);
    return () => clearInterval(t);
  }, [user, refreshUnread]);

  const saveSession = ({ token, user }) => { localStorage.setItem('token', token); setUser(user); };
  const logout = () => { localStorage.removeItem('token'); setUser(null); };

  return <Ctx.Provider value={{ user, loading, unread, refreshUnread, saveSession, logout }}>{children}</Ctx.Provider>;
}
