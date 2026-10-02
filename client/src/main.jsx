import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import { AuthProvider } from './AuthContext.jsx';
import './styles.css';
import './dark.css';

try { document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'); } catch { /* ignore */ }

const GOOGLE_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '57285893340-mol4ke4n4eri603382tqtmvbk8n4vpen.apps.googleusercontent.com';

createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={GOOGLE_ID}>
    <BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter>
  </GoogleOAuthProvider>
);
