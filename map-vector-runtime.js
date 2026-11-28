/* HuntSmart static WMU vector-tile runtime.
 * Main Map/GOS paths stream viewport MVT tiles; legacy embedded filter maps
 * retain lazy full-GeoJSON fallbacks only when those mini-maps are opened.
 */
(function () {
  'use strict';

  const VERSION = '2026-10-28-vector-v2';
  const TILE_VERSION = '20261128-v5';
  const BASE = `/map-tiles/${TILE_VERSION}`;
  const BOUNDS = {
    BC: [-139.3, 48.1, -113.8, 60.2],
    AB: [-120.2, 48.8, -109.6, 60.2]
  };
  const state = {
    manifestPromise: null,
    manifest: null,
    installed: false,
    mapboxPatched: false,
    fullBCPromise: null,
    fullABPromise: null,
    metrics: { manifestMs: null }
  };

  const now = () => (window.performance && typeof performance.now === 'function' ? performance.now() : Date.now());
  const round = value => Math.round(value * 10) / 10;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = Array.from(document.scripts).find(s => {
        try { return new URL(s.src, location.href).pathname === new URL(src, location.href).pathname; }
        catch (_) { return false; }
      });
      if (existing && (existing.dataset.hsVectorLoaded === '1' || existing.dataset.hsLoaded === '1')) { resolve(); return; }
      const script = existing || document.createElement('script');
      let settled = false;
      const timer = setTimeout(() => fail(), 12000);
      const done = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        script.dataset.hsVectorLoaded = '1';
        resolve();
      };
      const fail = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (!existing) script.remove();
        reject(new Error(`Failed to load ${src}`));
      };
      script.addEventListener('load', done, { once:true });
      script.addEventListener('error', fail, { once:true });
      if (!existing) {
        script.src = src;
        script.async = false;
        script.dataset.hsVectorAsset = '1';
        document.head.appendChild(script);
      }
    });
  }

  function loadManifest() {
    if (state.manifest) return Promise.resolve(state.manifest);
    if (state.manifestPromise) return state.manifestPromise;
    const started = now();
    const request = new AbortController();
    const timeout = setTimeout(() => request.abort(), 8000);
    state.manifestPromise = fetch(`${BASE}/manifest.json?v=${VERSION}`, {
      cache: state.retryManifest ? 'reload' : 'force-cache',
      signal: request.signal
    })
      .then(response => {
        if (!response.ok) throw new Error(`WMU vector manifest returned ${response.status}`);
        return response.json();
      })
      .then(manifest => {
        if (!manifest || manifest.version !== VERSION || !manifest.bc?.index || !manifest.ab?.index) {
          throw new Error('WMU vector manifest is incomplete or stale');
        }
        state.manifest = manifest;
        state.metrics.manifestMs = round(now() - started);
        return manifest;
      })
      .catch(error => {
        state.retryManifest = true;
        state.manifestPromise = null;
        throw error;
      })
      .finally(() => clearTimeout(timeout));
    return state.manifestPromise;
  }

  function getBCGeometry() {
    try { return typeof bcWmuGeoJSON !== 'undefined' ? bcWmuGeoJSON : null; }
    catch (_) { return window.bcWmuGeoJSON || null; }
  }
  function setBCGeometry(value) {
    try { bcWmuGeoJSON = value; }
    catch (_) { window.bcWmuGeoJSON = value; }
  }
  function getABGeometry() {
    try { return typeof AB_WMU_GEOJSON !== 'undefined' ? AB_WMU_GEOJSON : null; }
    catch (_) { return window.AB_WMU_GEOJSON || null; }
  }

  function installIndex(province) {
    const manifest = state.manifest;
    if (!manifest) return;
    if (province === 'BC') {
      const current = getBCGeometry();
      if (!current || current.__hsVectorIndex) setBCGeometry(manifest.bc.index);
      window.__HS_BC_WMU_VECTOR_INDEX__ = manifest.bc.index;
      return;
    }
    const current = getABGeometry();
    if (!current || current.__hsVectorIndex) window.AB_WMU_GEOJSON = manifest.ab.index;
    window.__HS_AB_WMU_VECTOR_INDEX__ = manifest.ab.index;
  }

  function provinceForSource(sourceId) {
    if (sourceId === 'os-wmu-src') return 'BC';
    if (sourceId === 'wmu-src') {
      try { return fullMapProvince === 'AB' ? 'AB' : 'BC'; }
      catch (_) { return 'BC'; }
    }
    return null;
  }

  function patchMapboxPrototype() {
    if (state.mapboxPatched || !window.mapboxgl || !mapboxgl.Map) return;
    state.mapboxPatched = true;
    const proto = mapboxgl.Map.prototype;
    const originalAddSource = proto.addSource;
    const originalAddLayer = proto.addLayer;
    const originalSetFeatureState = proto.setFeatureState;
    const originalRemoveFeatureState = proto.removeFeatureState;
    const originalGetFeatureState = proto.getFeatureState;

    proto.addSource = function (sourceId, spec) {
      const province = provinceForSource(sourceId);
      if (province && spec?.type === 'geojson' && spec.data?.__hsVectorIndex) {
        this.__hsVectorWmuSources ||= new Map();
        this.__hsVectorWmuSources.set(sourceId, province);
        const manifest = state.manifest;
        return originalAddSource.call(this, sourceId, {
          type:'vector',
          tiles:[`${location.origin}${BASE}/${province.toLowerCase()}/{z}/{x}/{y}.pbf?v=${VERSION}`],
          minzoom:manifest?.minzoom || 3,
          maxzoom:manifest?.maxzoom || 9,
          bounds:BOUNDS[province],
          scheme:'xyz'
        });
      }
      this.__hsVectorWmuSources?.delete(sourceId);
      return originalAddSource.call(this, sourceId, spec);
    };

    proto.addLayer = function (layer, beforeId) {
      if (layer && this.__hsVectorWmuSources?.has(layer.source) && !layer['source-layer']) {
        layer = Object.assign({}, layer, { 'source-layer':state.manifest?.sourceLayer || 'wmus' });
      }
      return originalAddLayer.call(this, layer, beforeId);
    };

    const withSourceLayer = (map, target) => {
      if (target && map.__hsVectorWmuSources?.has(target.source) && !target.sourceLayer) {
        return Object.assign({}, target, { sourceLayer:state.manifest?.sourceLayer || 'wmus' });
      }
      return target;
    };
    proto.setFeatureState = function (target, featureState) {
      return originalSetFeatureState.call(this, withSourceLayer(this, target), featureState);
    };
    if (originalRemoveFeatureState) {
      proto.removeFeatureState = function (target, key) {
        return originalRemoveFeatureState.call(this, withSourceLayer(this, target), key);
      };
    }
    if (originalGetFeatureState) {
      proto.getFeatureState = function (target) {
        return originalGetFeatureState.call(this, withSourceLayer(this, target));
      };
    }
  }

  function unwrapPerformanceGate(fn) {
    return fn && fn.__hsMapPerfOriginal ? fn.__hsMapPerfOriginal : fn;
  }

  async function prepareGeometry(province) {
    try {
      await loadManifest();
      installIndex(province);
    } catch (error) {
      console.warn('[HuntSmart WMU tiles] Loading full boundaries instead', error);
      await (province === 'AB' ? ensureABFullGeometry() : ensureBCFullGeometry());
    }
  }

  function wrapFullMap() {
    const original = unwrapPerformanceGate(window.fullMapInit);
    if (typeof original !== 'function') return;
    let pending;
    window.fullMapInit = function (options) {
      const province = fullMapProvince;
      if (fullMapInstance && fullMapInitialized[province]) return original.apply(this, arguments);
      if (pending?.province === province) return pending.promise;
      const overlay = document.getElementById('fullMapLoading');
      if (overlay?.dataset.state === 'error' && overlay.dataset.province === province && !options?.retry) return;
      if (overlay) overlay.dataset.province = province;
      setHuntMapStatus('fullMapLoading', 'loading', `Loading ${province === 'AB' ? 'Alberta' : 'BC'} map…`);
      const attempt = { province };
      pending = attempt;
      attempt.promise = Promise.all([prepareGeometry(province), ensureHuntMapLibrary()])
        .then(() => {
          if (pending !== attempt || fullMapProvince !== province) return;
          patchMapboxPrototype();
          return original.apply(this, arguments);
        })
        .catch(error => {
          console.error('[HuntSmart Interactive Map]', error);
          if (pending === attempt && fullMapProvince === province) {
            setHuntMapStatus('fullMapLoading', 'error', 'The map could not load.');
          }
        })
        .finally(() => { if (pending === attempt) pending = null; });
      return attempt.promise;
    };
  }

  function wrapGOS() {
    const original = unwrapPerformanceGate(window.osInitMap);
    if (typeof original !== 'function') return;
    let pending;
    window.osInitMap = function (options) {
      if (osMapInitialized) return original.apply(this, arguments);
      if (pending) return pending;
      if (document.getElementById('osMapLoading')?.dataset.state === 'error' && !options?.retry) return;
      setHuntMapStatus('osMapLoading', 'loading', 'Loading BC General Open Seasons map…');
      pending = Promise.all([prepareGeometry('BC'), ensureHuntMapLibrary()])
        .then(() => {
          patchMapboxPrototype();
          return original.apply(this, arguments);
        })
        .catch(error => {
          console.error('[HuntSmart General Open Seasons]', error);
          setHuntMapStatus('osMapLoading', 'error', 'The General Open Seasons map could not load.');
        })
        .finally(() => { pending = null; });
      return pending;
    };
  }

  function ensureBCFullGeometry() {
    try {
      if (typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON?.features && !BC_WMU_GEOJSON.__hsVectorIndex) {
        setBCGeometry(BC_WMU_GEOJSON);
        window.__HS_FULL_BC_WMU_GEOMETRY__ = true;
        return Promise.resolve(true);
      }
    } catch (_) {}
    if (state.fullBCPromise) return state.fullBCPromise;
    state.fullBCPromise = loadScript(`./bc-wmu-geojson.js?v=${TILE_VERSION}`)
      .then(() => {
        if (typeof BC_WMU_GEOJSON === 'undefined' || !BC_WMU_GEOJSON?.features) throw new Error('BC full geometry did not initialize');
        setBCGeometry(BC_WMU_GEOJSON);
        window.__HS_FULL_BC_WMU_GEOMETRY__ = true;
        return true;
      })
      .catch(error => { state.fullBCPromise = null; throw error; });
    return state.fullBCPromise;
  }

  function ensureABFullGeometry() {
    try {
      if (typeof AB_WMU_GEOJSON !== 'undefined' && AB_WMU_GEOJSON?.features && !AB_WMU_GEOJSON.__hsVectorIndex) {
        window.__HS_FULL_AB_WMU_GEOMETRY__ = true;
        return Promise.resolve(true);
      }
    } catch (_) {}
    if (state.fullABPromise) return state.fullABPromise;
    state.fullABPromise = (async () => {
      await Promise.all([1,2,3].map(part => loadScript(`./ab-wmu-geojson-${part}.js?v=${TILE_VERSION}`)));
      await loadScript(`./ab-wmu-geojson.js?v=${TILE_VERSION}`);
      if (typeof AB_WMU_GEOJSON === 'undefined' || !AB_WMU_GEOJSON?.features) throw new Error('Alberta full geometry did not initialize');
      window.__HS_FULL_AB_WMU_GEOMETRY__ = true;
      return true;
    })().catch(error => { state.fullABPromise = null; throw error; });
    return state.fullABPromise;
  }

  function filterMapConfig(name) {
    if (name === 'fpBcInitMap') return { container: 'fpBcLeafletMap', panel: 'fpBcMapPanel', province: 'BC' };
    if (name === 'abFpInitMap') return { container: 'abFpLeafletMap', panel: 'abFpMapPanel', province: 'Alberta' };
    return null;
  }

  function filterMapStatus(config, message, failed) {
    const container = document.getElementById(config.container);
    if (!container) return;
    let indicator = container.querySelector('[data-hs-filter-load]');
    if (!message) {
      if (indicator) indicator.remove();
      return;
    }
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.dataset.hsFilterLoad = '1';
      indicator.setAttribute('role', 'status');
      indicator.setAttribute('aria-live', 'polite');
      indicator.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:700;background:#101a16f0;padding:18px;text-align:center;font:500 12px/1.6 system-ui,sans-serif;color:#d0e2d5;pointer-events:none';
      container.appendChild(indicator);
    }
    indicator.textContent = message;
    indicator.style.color = failed ? '#fca5a5' : '#d0e2d5';
  }

  function watchFilterMapPaint(config) {
    const container = document.getElementById(config.container);
    if (!container) return;
    const start = now();
    const check = () => {
      if (!container.isConnected) return;
      const panel = document.getElementById(config.panel);
      if (!panel || getComputedStyle(panel).display === 'none') {
        filterMapStatus(config, '');
        return;
      }
      // A Leaflet overlay draws independently of external imagery; do not hide
      // the progress indicator until the map actually has geographic content.
      if (container.querySelector('.leaflet-tile-loaded, .leaflet-overlay-pane path')) {
        filterMapStatus(config, '');
        return;
      }
      if (now() - start >= 16000) {
        filterMapStatus(config, 'Map is taking longer than expected. Check your connection and reopen the map.', true);
        return;
      }
      setTimeout(check, 200);
    };
    setTimeout(check, 200);
  }

  function wrapLeaflet(name, ensureGeometry) {
    const original = unwrapPerformanceGate(window[name]);
    if (typeof original !== 'function') return;
    const config = filterMapConfig(name);
    let pending = null;
    window[name] = function () {
      if (pending) return pending;
      const args = arguments;
      const context = this;
      if (config) filterMapStatus(config, 'Loading ' + config.province + ' map boundaries…');
      pending = ensureGeometry()
        .then(() => {
          // The user may close the map while geometry is loading. Do not
          // initialize Leaflet in an invisible, zero-width container.
          const panel = config && document.getElementById(config.panel);
          if (panel && getComputedStyle(panel).display === 'none') {
            if (config) filterMapStatus(config, '');
            return;
          }
          if (config) {
            filterMapStatus(config, 'Preparing map imagery…');
            watchFilterMapPaint(config);
          }
          return original.apply(context, args);
        })
        .catch(error => {
          console.error(`[HuntSmart ${name}]`, error);
          if (config) filterMapStatus(config, 'Map could not load. Close and reopen to retry.', true);
        })
        .finally(() => { pending = null; });
      return pending;
    };
  }

  function hookFullMapInitializers() {
    const bc = window._fullMapInitBC;
    const ab = window._fullMapInitAB;
    if (typeof bc === 'function' && !bc.__hsVectorHook) {
      const wrapped = function () { patchMapboxPrototype(); return bc.apply(this, arguments); };
      wrapped.__hsVectorHook = true;
      window._fullMapInitBC = wrapped;
    }
    if (typeof ab === 'function' && !ab.__hsVectorHook) {
      const wrapped = function () { patchMapboxPrototype(); return ab.apply(this, arguments); };
      wrapped.__hsVectorHook = true;
      window._fullMapInitAB = wrapped;
    }
  }

  function install() {
    if (state.installed) return;
    state.installed = true;
    wrapFullMap();
    wrapGOS();
    wrapLeaflet('bcInitLeafletMap', ensureBCFullGeometry);
    wrapLeaflet('abInitLeafletMap', ensureABFullGeometry);
    // The dedicated BC/Alberta filter screens also use Leaflet. They must
    // await full polygons after eager geometry scripts are removed at build.
    wrapLeaflet('fpBcInitMap', ensureBCFullGeometry);
    wrapLeaflet('abFpInitMap', ensureABFullGeometry);
    hookFullMapInitializers();

    window.__HS_WMU_VECTOR_TILES__ = {
      version:VERSION,
      tileVersion:TILE_VERSION,
      loadManifest,
      ensureBCFullGeometry,
      ensureABFullGeometry,
      snapshot() {
        return {
          version:VERSION,
          tileVersion:TILE_VERSION,
          manifestLoaded:!!state.manifest,
          bcFullGeometry:!!window.__HS_FULL_BC_WMU_GEOMETRY__,
          abFullGeometry:!!window.__HS_FULL_AB_WMU_GEOMETRY__,
          bcFeatureCount:state.manifest?.bc?.featureCount || 0,
          abFeatureCount:state.manifest?.ab?.featureCount || 0,
          bcTileCount:state.manifest?.bc?.tileCount || 0,
          abTileCount:state.manifest?.ab?.tileCount || 0,
          metrics:Object.assign({}, state.metrics)
        };
      }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
