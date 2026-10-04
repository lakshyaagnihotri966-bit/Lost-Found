// Minimal service worker: makes the site installable and shows a friendly page when offline.
// It never caches pages or API data, so users always get the latest version.
const V = 'lf-v1';
const OFFLINE = '/offline.html';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll([OFFLINE, '/icon-192.png'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') e.respondWith(fetch(e.request).catch(() => caches.match(OFFLINE)));
});
