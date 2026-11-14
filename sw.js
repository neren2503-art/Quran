/* خدمة العمل دون اتصال — مصحف الهاتف */
const VERSION = 'quran-v3.0';
const CORE = [
  './', './index.html', './manifest.json',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png',
  './amiri-quran.woff2', './cairo.woff2'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
const NETWORK_ONLY = ['cdn.islamic.network', 'api.alquran.cloud'];
self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (NETWORK_ONLY.some((h) => url.hostname === h)) return;
  if (req.mode === 'navigate') {
    ev.respondWith(fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put('./index.html', copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html').then((r) => r || caches.match('./'))));
    return;
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    ev.respondWith(caches.open(VERSION).then((cache) => cache.match(req).then((cached) => {
      const net = fetch(req).then((res) => { cache.put(req, res.clone()).catch(() => {}); return res; }).catch(() => cached);
      return cached || net;
    })));
    return;
  }
  if (url.origin === self.location.origin) {
    ev.respondWith(caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => cached)));
  }
});
