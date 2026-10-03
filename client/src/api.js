const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Render's free server sleeps. The first request can fail while it wakes up, so retry a couple of times.
async function doFetch(url, opts) {
  for (let i = 0; i < 3; i++) {
    try { return await fetch(url, opts); }
    catch (e) {
      if (i === 2) throw new Error('Cannot reach the server. It may be waking up. Wait about a minute and try again.');
      await sleep(4000);
    }
  }
}

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  const res = await doFetch(BASE + path, { method, headers, body: payload });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

let metaCache;
export async function getMeta() {
  if (!metaCache) metaCache = await api('/items/meta');
  return metaCache;
}
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
