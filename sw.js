/* ============================================================
   عامل الخدمة لـ «مصحفي» — الإصدار ٦
============================================================ */
const CACHE = 'mushafi-v6';
const CORE = ['./', './index.html', './manifest.json', './icon.svg', './icon-maskable.svg'];

async function cacheFirst(req){
  const c = await caches.open(CACHE);
  const hit = await c.match(req, { ignoreSearch: true });
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && res.status === 200) c.put(req, res.clone()).catch(() => {});
    return res;
  } catch (_) {
    const any = await caches.match(req, { ignoreSearch: true });
    return any || Response.error();
  }
}

async function networkFirst(req){
  const c = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res && res.status === 200) c.put(req, res.clone()).catch(() => {});
    return res;
  } catch (_) {
    const hit = await c.match(req, { ignoreSearch: true });
    return hit || Response.error();
  }
}

async function audioHandler(req){
  const c = await caches.open(CACHE);
  const hit = await c.match(req.url);
  if (hit) return hit;
  try {
    const res = await fetch(req.url);
    if (res && res.status === 200) c.put(req.url, res.clone()).catch(() => {});
    return res;
  } catch (_) {
    return Response.error();
  }
}

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.allSettled(CORE.map(u => c.add(u)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }

  if (url.origin === self.location.origin){
    if (req.mode === 'navigate'){ e.respondWith(networkFirst(req)); return; }
    e.respondWith(cacheFirst(req));
    return;
  }
  const h = url.hostname;
  if (h === 'fonts.googleapis.com' || h === 'fonts.gstatic.com'){
    e.respondWith(cacheFirst(req));
  } else if (h === 'api.alquran.cloud' || h.endsWith('.api.radio-browser.info')){
    e.respondWith(networkFirst(req));
  } else if (h === 'cdn.islamic.network'){
    e.respondWith(audioHandler(req));
  }
});
