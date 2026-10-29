/* HuntSmart offline-lite cache: current app shell + conservative offline fallback. */
const HS_CACHE = 'huntsmart-offline-lite-v80';
const HS_CORE = [
  './', './index.html', './site.webmanifest', './style.css', './terrain-intelligence.css',
  './maps.js', './terrain-intelligence.js', './bc-open-seasons.js', './data.js',
  './draws.json', './bc-draws.js', './bc-filters.js', './bc-detail.js',
  './ab-draws.js', './ab-filters.js', './images/logo.png'
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
    await self.clients.claim();
  })());
});

async function networkFirst(request) {
  const cache = await caches.open(HS_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (_) {
    return (await cache.match(request)) || (await cache.match(request, { ignoreSearch: true }));
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(HS_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Do not turn provincial vector tiles or large geometry into an unbounded browser cache.
  if (url.pathname.startsWith('/map-tiles/') || /\.(?:pbf|pmtiles|geojson)$/i.test(url.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request).then(response => response || caches.match('./index.html')));
    return;
  }

  // App code/data is network-first so a newly deployed HuntSmart shell cannot be pinned stale.
  if (['script', 'style', 'document'].includes(request.destination) || /\.(?:json|webmanifest)$/i.test(url.pathname)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (request.destination === 'image' || request.destination === 'font') {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});
