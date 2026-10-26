/* HuntSmart offline-lite cache: app shell + local data only. Map tiles may still need network/provider cache. */
const HS_CACHE = 'huntsmart-offline-lite-v78';
const HS_CORE = [
  './', './index.html', './style.css', './maps.js', './bc-open-seasons.js',
  './data.js', './draws.json', './bc-draws.js', './bc-filters.js', './bc-detail.js',
  './ab-draws.js', './ab-filters.js', './leh_zones.json', './historical_wildfires_simplified_50m.geojson'
];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(HS_CACHE);
    await Promise.allSettled(HS_CORE.map(url => cache.add(url)));
    self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('huntsmart-offline-lite-') && k !== HS_CACHE).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(HS_CACHE).then(c => c.put('./index.html', copy)); return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => {
    const copy = res.clone(); caches.open(HS_CACHE).then(c => c.put(req, copy)); return res;
  }).catch(() => cached)));
});
