// Offline cache for Antline. Bump VERSION whenever index.html changes so phones pick up the update.
const VERSION = 'antline-v13';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];
// cache: 'reload' skips the browser's HTTP cache, so a new version never gets filled with the old page
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  const page = e.request.mode === 'navigate';
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(page ? new Request(e.request.url, { cache: 'no-cache' }) : e.request)
      .then(r => { if(r && (r.ok || r.type === 'opaque')) c.put(page ? './index.html' : e.request, r.clone()); return r; }).catch(() => hit);
    if(page) return net.then(r => r || hit);   // the game page: newest copy when online, cached copy offline
    return hit || net;                           // everything else: cached copy first, refreshed in the background
  }));
});
