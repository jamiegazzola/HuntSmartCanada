/* HuntSmart map cold-start prewarm runtime.
 * Keeps optional/heavy overlays lazy while warming only the tiny WMU vector manifest
 * and the first likely viewport tiles before the user opens the Map tab.
 */
(function () {
  'use strict';

  const VERSION = '2026-10-30-prewarm-v1';
  const state = {
    started: false,
    completed: false,
    manifestMs: null,
    tilePrefetchMs: null,
    prefetched: [],
    error: null
  };

  const now = () => (window.performance && typeof performance.now === 'function') ? performance.now() : Date.now();
  const round = value => Math.round(value * 10) / 10;

  function addResourceHint(rel, href, crossOrigin) {
    if (!document.head || document.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    if (crossOrigin) link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }

  function installConnectionHints() {
    addResourceHint('preconnect', 'https://api.mapbox.com', true);
    addResourceHint('dns-prefetch', 'https://api.mapbox.com');
    addResourceHint('preconnect', 'https://events.mapbox.com', true);
  }

  function connectionAllowsTileWarmup() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!connection) return true;
    if (connection.saveData) return false;
    const type = String(connection.effectiveType || '').toLowerCase();
    return type !== 'slow-2g' && type !== '2g';
  }

  function currentProvince() {
    try { return fullMapProvince === 'AB' ? 'AB' : 'BC'; }
    catch (_) { return 'BC'; }
  }

  function candidateTiles(province) {
    // Initial HuntSmart map views are ~z4.2. Warm one z4 tile plus the corresponding
    // z5 center tile so Mapbox can paint WMU boundaries immediately while adjacent
    // viewport tiles continue streaming normally.
    return province === 'AB'
      ? [{ z:4, x:2, y:5 }, { z:5, x:5, y:10 }]
      : [{ z:4, x:2, y:5 }, { z:5, x:4, y:10 }];
  }

  async function waitForVectorRuntime(timeoutMs) {
    const started = now();
    while ((now() - started) < timeoutMs) {
      if (window.__HS_WMU_VECTOR_TILES__ && typeof window.__HS_WMU_VECTOR_TILES__.loadManifest === 'function') {
        return window.__HS_WMU_VECTOR_TILES__;
      }
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    return null;
  }

  async function prefetchFirstTiles(api) {
    if (!connectionAllowsTileWarmup()) return;
    const snapshot = typeof api.snapshot === 'function' ? api.snapshot() : null;
    const tileVersion = snapshot && snapshot.tileVersion;
    if (!tileVersion) return;

    const province = currentProvince();
    const started = now();
    const urls = candidateTiles(province).map(tile =>
      `/map-tiles/${encodeURIComponent(tileVersion)}/${province.toLowerCase()}/${tile.z}/${tile.x}/${tile.y}.pbf`
    );

    await Promise.all(urls.map(url => fetch(url, {
      cache: 'force-cache',
      credentials: 'same-origin'
    }).then(response => {
      if (response.ok) state.prefetched.push(url);
    }).catch(() => undefined)));
    state.tilePrefetchMs = round(now() - started);
  }

  async function prewarm() {
    if (state.started) return;
    state.started = true;
    installConnectionHints();

    try {
      const api = await waitForVectorRuntime(4000);
      if (!api) throw new Error('WMU vector runtime was not ready');

      const manifestStarted = now();
      await api.loadManifest();
      state.manifestMs = round(now() - manifestStarted);
      await prefetchFirstTiles(api);
      state.completed = true;
    } catch (error) {
      // Prewarming is opportunistic. A failure must never block normal map startup.
      state.error = String(error && error.message ? error.message : error);
    }
  }

  function scheduleIdlePrewarm() {
    const run = () => {
      if (document.visibilityState === 'hidden') return;
      prewarm();
    };
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(run, { timeout: 2200 });
    } else {
      setTimeout(run, 900);
    }
  }

  function installIntentPrewarm() {
    const selector = '#navMap, #mNavMap, [data-tab="map"], [data-section="map"], [data-page="map"]';
    const warmFromIntent = event => {
      const target = event.target && event.target.closest ? event.target.closest(selector) : null;
      if (target) prewarm();
    };

    document.addEventListener('pointerover', warmFromIntent, { passive: true });
    document.addEventListener('touchstart', warmFromIntent, { passive: true });
    document.addEventListener('focusin', warmFromIntent, { passive: true });
  }

  window.__HS_MAP_PREWARM__ = {
    version: VERSION,
    prewarm,
    snapshot() { return Object.assign({ version: VERSION }, state); }
  };

  installConnectionHints();
  installIntentPrewarm();
  scheduleIdlePrewarm();
})();
