import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import { AuthProvider } from './AuthContext.jsx';
import './styles.css';

try { document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'); } catch { /* ignore */ }

const GOOGLE_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '57285893340-npu31k89q8nn97ph6dmqohbsqi6eualj.apps.googleusercontent.com';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={GOOGLE_ID}>
    <BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter>
  </GoogleOAuthProvider>
);
