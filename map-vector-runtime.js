/* HuntSmart static WMU vector-tile runtime.
 * Main Map/GOS paths stream viewport MVT tiles; legacy embedded filter maps
 * retain lazy full-GeoJSON fallbacks only when those mini-maps are opened.
 */
(function () {
  'use strict';

  const VERSION = '2026-10-28-vector-v2';
  const TILE_VERSION = '20261028-v3';
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
      if (existing && existing.dataset.hsVectorLoaded === '1') { resolve(); return; }
      const script = existing || document.createElement('script');
      let settled = false;
      const done = () => { if (settled) return; settled = true; script.dataset.hsVectorLoaded = '1'; resolve(); };
      const fail = () => { if (settled) return; settled = true; reject(new Error(`Failed to load ${src}`)); };
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
    state.manifestPromise = fetch(`${BASE}/manifest.json?v=${VERSION}`, { cache:'force-cache' })
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
      .catch(error => { state.manifestPromise = null; throw error; });
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
      if (province && spec && spec.type === 'geojson') {
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

  function wrapFullMap() {
    const original = unwrapPerformanceGate(window.fullMapInit);
    if (typeof original !== 'function') return;
    window.fullMapInit = function () {
      const args = arguments;
      const context = this;
      const loading = document.getElementById('fullMapLoading');
      if (loading) loading.style.display = 'flex';
      return loadManifest().then(() => {
        let province = 'BC';
        try { province = fullMapProvince === 'AB' ? 'AB' : 'BC'; } catch (_) {}
        installIndex(province);
        patchMapboxPrototype();
        return original.apply(context, args);
      }).catch(error => {
        console.error('[HuntSmart vector map]', error);
        const text = document.getElementById('fullMapLoadingText');
        if (text) text.textContent = 'Map data failed to load. Please retry.';
      });
    };
  }

  function wrapGOS() {
    const original = unwrapPerformanceGate(window.osInitMap);
    if (typeof original !== 'function') return;
    window.osInitMap = function () {
      const args = arguments;
      const context = this;
      return loadManifest().then(() => {
        installIndex('BC');
        patchMapboxPrototype();
        return original.apply(context, args);
      }).catch(error => console.error('[HuntSmart vector GOS]', error));
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
      await loadScript(`./ab-wmu-geojson-1.js?v=${TILE_VERSION}`);
      await loadScript(`./ab-wmu-geojson-2.js?v=${TILE_VERSION}`);
      await loadScript(`./ab-wmu-geojson-3.js?v=${TILE_VERSION}`);
      await loadScript(`./ab-wmu-geojson.js?v=${TILE_VERSION}`);
      if (typeof AB_WMU_GEOJSON === 'undefined' || !AB_WMU_GEOJSON?.features) throw new Error('Alberta full geometry did not initialize');
      window.__HS_FULL_AB_WMU_GEOMETRY__ = true;
      return true;
    })().catch(error => { state.fullABPromise = null; throw error; });
    return state.fullABPromise;
  }

  function wrapLeaflet(name, ensureGeometry) {
    const original = unwrapPerformanceGate(window[name]);
    if (typeof original !== 'function') return;
    window[name] = function () {
      const args = arguments;
      const context = this;
      return ensureGeometry().then(() => original.apply(context, args)).catch(error => console.error(`[HuntSmart ${name}]`, error));
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
