// Offline-Cache für die Aufmaß-App: App öffnet sich auch ohne Netz (Zug, Keller, Funkloch).
const CACHE = 'aufmass-v25';
const LIBS = ['https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled([c.add('./'), c.add('helfer.html'), ...LIBS.map(u => c.add(new Request(u, { mode: 'no-cors' })))])));
  self.skipWaiting();
});
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
const put = (req, res) => { if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return res; };
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.pathname.startsWith('/api/')) return;                       // Sicherung nie aus dem Cache
  if (u.origin === location.origin) {                                // App: erst Netz (max. 4 s), sonst Cache
    e.respondWith(Promise.race([fetch(req).then(r => put(req, r)), new Promise((_, rej) => setTimeout(rej, 4000))])
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./'))));
  } else if (/cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net/.test(u.host)) { // Bibliotheken: Cache zuerst
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => put(req, res))));
  }
});
