/* HuntSmart map performance runtime
 * Phase 1: lazy-load large province geometry, pre-index WMU lookups,
 * and expose lightweight production timing diagnostics.
 */
(function () {
  'use strict';

  const VERSION = '2026-10-28-v1';
  const ASSET_VERSION = '20261028-mapperf1';
  const state = {
    version: VERSION,
    bcGeometryPromise: null,
    abGeometryPromise: null,
    metrics: {
      bcGeometryLoadMs: null,
      abGeometryLoadMs: null,
      lastWmuSelectUiMs: null,
      lastSpeciesChangeUiMs: null,
      lastGosWmuSelectUiMs: null
    }
  };

  const scriptPromises = new Map();

  function now() {
    return (window.performance && typeof performance.now === 'function') ? performance.now() : Date.now();
  }

  function roundMs(value) {
    return Math.round(value * 10) / 10;
  }

  function loadScript(src) {
    if (scriptPromises.has(src)) return scriptPromises.get(src);
    const promise = new Promise((resolve, reject) => {
      const existing = Array.from(document.scripts).find(s => {
        try { return new URL(s.src, location.href).pathname === new URL(src, location.href).pathname; }
        catch (_) { return false; }
      });
      if (existing && existing.dataset.hsLoaded === '1') {
        resolve();
        return;
      }

      const script = existing || document.createElement('script');
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        script.dataset.hsLoaded = '1';
        resolve();
      };
      const fail = () => {
        if (settled) return;
        settled = true;
        scriptPromises.delete(src);
        reject(new Error(`Failed to load ${src}`));
      };

      script.addEventListener('load', done, { once: true });
      script.addEventListener('error', fail, { once: true });

      if (!existing) {
        script.src = src;
        script.async = false;
        script.dataset.hsMapPerfAsset = '1';
        document.head.appendChild(script);
      } else if (existing.readyState === 'complete') {
        done();
      }
    });
    scriptPromises.set(src, promise);
    return promise;
  }

  function hasBCGeometry() {
    return (typeof bcWmuGeoJSON !== 'undefined' && !!bcWmuGeoJSON) ||
      (typeof BC_WMU_GEOJSON !== 'undefined' && !!BC_WMU_GEOJSON);
  }

  function hasABGeometry() {
    return typeof AB_WMU_GEOJSON !== 'undefined' &&
      !!AB_WMU_GEOJSON &&
      Array.isArray(AB_WMU_GEOJSON.features);
  }

  function showFullMapLoading(message) {
    const loader = document.getElementById('fullMapLoading');
    const text = document.getElementById('fullMapLoadingText');
    if (text) text.textContent = message || 'Loading map…';
    if (loader) loader.style.display = 'flex';
  }

  function showFullMapLoadError(message) {
    const loader = document.getElementById('fullMapLoading');
    const text = document.getElementById('fullMapLoadingText');
    if (text) text.textContent = message || 'Map data failed to load. Please retry.';
    if (loader) loader.style.display = 'flex';
  }

  async function ensureBCGeometry() {
    if (hasBCGeometry()) return true;
    if (state.bcGeometryPromise) return state.bcGeometryPromise;

    const started = now();
    state.bcGeometryPromise = loadScript(`./bc-wmu-geojson.js?v=${ASSET_VERSION}`)
      .then(() => {
        if (!hasBCGeometry()) throw new Error('BC WMU geometry loaded without a usable dataset');
        state.metrics.bcGeometryLoadMs = roundMs(now() - started);
        return true;
      })
      .catch(err => {
        state.bcGeometryPromise = null;
        throw err;
      });
    return state.bcGeometryPromise;
  }

  async function ensureABGeometry() {
    if (hasABGeometry()) return true;
    if (state.abGeometryPromise) return state.abGeometryPromise;

    const started = now();
    state.abGeometryPromise = (async () => {
      await loadScript(`./ab-wmu-geojson-1.js?v=${ASSET_VERSION}`);
      await loadScript(`./ab-wmu-geojson-2.js?v=${ASSET_VERSION}`);
      await loadScript(`./ab-wmu-geojson-3.js?v=${ASSET_VERSION}`);
      await loadScript(`./ab-wmu-geojson.js?v=${ASSET_VERSION}`);
      if (!hasABGeometry()) throw new Error('Alberta WMU geometry loaded without a usable dataset');
      state.metrics.abGeometryLoadMs = roundMs(now() - started);
      return true;
    })().catch(err => {
      state.abGeometryPromise = null;
      throw err;
    });
    return state.abGeometryPromise;
  }

  function provinceForFullMap() {
    try {
      return (typeof fullMapProvince !== 'undefined' && fullMapProvince === 'AB') ? 'AB' : 'BC';
    } catch (_) {
      return 'BC';
    }
  }

  function patchAsyncGeometryGate(name, getProvince) {
    const original = window[name];
    if (typeof original !== 'function' || original.__hsMapPerfGate) return;

    function gated() {
      const args = arguments;
      const ctx = this;
      const province = getProvince ? getProvince.apply(ctx, args) : 'BC';
      const loader = province === 'AB' ? ensureABGeometry : ensureBCGeometry;

      if (name === 'fullMapInit') {
        showFullMapLoading(`Loading ${province === 'AB' ? 'Alberta' : 'BC'} map…`);
      }

      return loader()
        .then(() => original.apply(ctx, args))
        .catch(err => {
          console.error(`[HuntSmart map] ${name} geometry gate failed`, err);
          if (name === 'fullMapInit') showFullMapLoadError('Map data failed to load. Please retry.');
          return undefined;
        });
    }
    gated.__hsMapPerfGate = true;
    gated.__hsMapPerfOriginal = original;
    window[name] = gated;
  }

  let bcIndex = null;
  let bcIndexDataRef = null;
  let bcIndexDataLength = -1;

  function normalizeBCMU(value) {
    if (typeof bcNormalizeMU === 'function') return bcNormalizeMU(value);
    const stripped = String(value || '').replace(/[\*\+]+$/, '').trim();
    return stripped.replace(/^(\d+)-0*(\d+)$/, '$1-$2');
  }

  function getBCIndex() {
    const data = (typeof DATA !== 'undefined' && Array.isArray(DATA)) ? DATA : [];
    if (bcIndex && bcIndexDataRef === data && bcIndexDataLength === data.length) return bcIndex;

    const byWmu = new Map();
    const wmus = new Set();
    for (const row of data) {
      const id = normalizeBCMU(row && row.MU);
      if (!id) continue;
      wmus.add(id);
      if (!byWmu.has(id)) byWmu.set(id, []);
      byWmu.get(id).push(row);
    }
    bcIndex = { byWmu, wmus, data };
    bcIndexDataRef = data;
    bcIndexDataLength = data.length;
    return bcIndex;
  }

  function bcRowsFor(id) {
    return getBCIndex().byWmu.get(normalizeBCMU(id)) || [];
  }

  function bcRowsMatchSelectedSpecies(rows, selectedSet) {
    if (!selectedSet || selectedSet.size === 0) return rows.length > 0;
    if (typeof bcSpeciesMatchesAnySelected === 'function') {
      return rows.some(row => bcSpeciesMatchesAnySelected(row.Species, selectedSet));
    }
    return rows.some(row => selectedSet.has(row.Species));
  }

  function patchBCIndexes() {
    const originalHasSpecies = window.hsBcWMUHasSpecies;
    if (typeof originalHasSpecies === 'function' && !originalHasSpecies.__hsMapPerfIndexed) {
      const indexed = function (id, selectedSet, data) {
        const canonical = (typeof DATA !== 'undefined') ? DATA : null;
        if (data && canonical && data !== canonical) return originalHasSpecies.apply(this, arguments);
        return bcRowsMatchSelectedSpecies(bcRowsFor(id), selectedSet);
      };
      indexed.__hsMapPerfIndexed = true;
      window.hsBcWMUHasSpecies = indexed;
    }

    const originalStyle = window.bcWmuGetStyle;
    if (typeof originalStyle === 'function' && !originalStyle.__hsMapPerfIndexed) {
      const indexedStyle = function (feature, isSelected) {
        const id = (feature && feature.properties && feature.properties.wmu_id) || '';
        const rows = bcRowsFor(id);
        const data = (typeof DATA !== 'undefined' && Array.isArray(DATA)) ? DATA : [];
        const hasAnyDraws = data.length === 0 || rows.length > 0;
        const speciesActive = typeof selSpecies !== 'undefined' && selSpecies.size > 0;
        const matchesSpecies = !speciesActive || bcRowsMatchSelectedSpecies(rows, selSpecies);
        return {
          fillColor: isSelected ? '#4ade80' : (matchesSpecies ? bcWmuFillColor(id) : '#1f2933'),
          fillOpacity: isSelected ? 0.75 : (!hasAnyDraws ? 0.10 : (speciesActive ? (matchesSpecies ? 0.46 : 0.08) : 0.38)),
          color: isSelected ? '#ffffff' : (speciesActive && matchesSpecies ? 'rgba(255,255,255,.22)' : '#18241e'),
          weight: isSelected ? 2.5 : 0.7,
          opacity: isSelected ? 1.0 : (speciesActive && !matchesSpecies ? 0.28 : 0.85)
        };
      };
      indexedStyle.__hsMapPerfIndexed = true;
      window.bcWmuGetStyle = indexedStyle;
    }
  }

  let abIndex = null;
  let abIndexBuiltAt = 0;

  function getABCardsIndexed() {
    const t = now();
    if (abIndex && (t - abIndexBuiltAt) < 500) return abIndex;

    const cards = (typeof buildABCards === 'function') ? buildABCards().filter(Boolean) : [];
    const byWmu = new Map();
    for (const card of cards) {
      const raw = (typeof abNormalizeWMU === 'function')
        ? abNormalizeWMU(card.wmu)
        : String(card.wmu || '').trim();
      for (const part of raw.split(',')) {
        const id = part.trim();
        if (!id) continue;
        if (!byWmu.has(id)) byWmu.set(id, []);
        byWmu.get(id).push(card);
      }
    }
    abIndex = { cards, byWmu };
    abIndexBuiltAt = t;
    return abIndex;
  }

  function abRowsFor(id) {
    return getABCardsIndexed().byWmu.get(String(id || '').trim()) || [];
  }

  function abRowsMatchSelectedSpecies(rows, selectedSet) {
    if (!selectedSet || selectedSet.size === 0) return rows.length > 0;
    return rows.some(card => selectedSet.has(card.species));
  }

  function patchABIndexes() {
    const originalHasSpecies = window.hsAbWMUHasSpecies;
    if (typeof originalHasSpecies === 'function' && !originalHasSpecies.__hsMapPerfIndexed) {
      const indexed = function (id, selectedSet, cards) {
        if (cards) return originalHasSpecies.apply(this, arguments);
        return abRowsMatchSelectedSpecies(abRowsFor(id), selectedSet);
      };
      indexed.__hsMapPerfIndexed = true;
      window.hsAbWMUHasSpecies = indexed;
    }

    const originalStyle = window.abWmuGetStyle;
    if (typeof originalStyle === 'function' && !originalStyle.__hsMapPerfIndexed) {
      const indexedStyle = function (feature, isSelected) {
        const id = String((feature && feature.properties && feature.properties.WMUNIT_NUM) || '');
        const rows = abRowsFor(id);
        const hasData = typeof AB_DATA !== 'undefined' && Array.isArray(AB_DATA) && AB_DATA.length > 0;
        const hasAnyDraws = !hasData || rows.length > 0;
        const speciesActive = typeof abSelSpecies !== 'undefined' && abSelSpecies.size > 0;
        const matchesSpecies = !speciesActive || abRowsMatchSelectedSpecies(rows, abSelSpecies);
        return {
          fillColor: isSelected ? '#4ade80' : (matchesSpecies ? abWmuFillColor(id) : '#1f2933'),
          fillOpacity: isSelected ? 0.75 : (!hasAnyDraws ? 0.10 : (speciesActive ? (matchesSpecies ? 0.46 : 0.08) : 0.38)),
          color: isSelected ? '#ffffff' : (speciesActive && matchesSpecies ? 'rgba(255,255,255,.22)' : '#1a1a1a'),
          weight: isSelected ? 2.5 : 0.7,
          opacity: isSelected ? 1.0 : (speciesActive && !matchesSpecies ? 0.28 : 0.85)
        };
      };
      indexedStyle.__hsMapPerfIndexed = true;
      window.abWmuGetStyle = indexedStyle;
    }
  }

  function patchFullMapIndexes() {
    const originalUnitMatches = window._fullMapUnitMatchesSpecies;
    if (typeof originalUnitMatches === 'function' && !originalUnitMatches.__hsMapPerfIndexed) {
      const indexedMatches = function (id) {
        try {
          if (provinceForFullMap() === 'BC') {
            const rows = bcRowsFor(id);
            if (typeof fullMapSelectedSpecies === 'undefined' || !fullMapSelectedSpecies) return rows.length > 0;
            return rows.some(row => typeof _fullMapDrawMatchesSpeciesName === 'function'
              ? _fullMapDrawMatchesSpeciesName(row.Species)
              : String(row.Species || '') === String(fullMapSelectedSpecies || ''));
          }
          const rows = abRowsFor(id);
          if (typeof fullMapSelectedSpecies === 'undefined' || !fullMapSelectedSpecies) return rows.length > 0;
          return rows.some(card => typeof _fullMapDrawMatchesSpeciesName === 'function'
            ? _fullMapDrawMatchesSpeciesName(card.species)
            : String(card.species || '') === String(fullMapSelectedSpecies || ''));
        } catch (_) {
          return originalUnitMatches.apply(this, arguments);
        }
      };
      indexedMatches.__hsMapPerfIndexed = true;
      window._fullMapUnitMatchesSpecies = indexedMatches;
    }

    const originalAllWmus = window._fullMapAllWMUs;
    if (typeof originalAllWmus === 'function' && !originalAllWmus.__hsMapPerfIndexed) {
      const indexedAllWmus = function () {
        try {
          if (provinceForFullMap() === 'BC') {
            const geojson = (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON) ||
              (typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON);
            if (!geojson || !Array.isArray(geojson.features)) return [];
            const wmus = getBCIndex().wmus;
            return geojson.features
              .map(f => f && f.properties ? (f.properties.wmu_id || '') : '')
              .filter(id => id && wmus.has(normalizeBCMU(id)))
              .sort((a, b) => {
                const pa = a.split('-').map(Number), pb = b.split('-').map(Number);
                return (pa[0] - pb[0]) || (pa[1] - pb[1]);
              });
          }

          if (typeof AB_WMU_GEOJSON === 'undefined' || !Array.isArray(AB_WMU_GEOJSON.features)) return [];
          const byWmu = getABCardsIndexed().byWmu;
          return AB_WMU_GEOJSON.features
            .map(f => String((f && f.properties && f.properties.WMUNIT_NUM) || ''))
            .filter(id => id && (!byWmu.size || byWmu.has(id)))
            .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
        } catch (_) {
          return originalAllWmus.apply(this, arguments);
        }
      };
      indexedAllWmus.__hsMapPerfIndexed = true;
      window._fullMapAllWMUs = indexedAllWmus;
    }
  }

  function measureNextPaint(name, metricKey) {
    const original = window[name];
    if (typeof original !== 'function' || original.__hsMapPerfMeasured) return;
    const measured = function () {
      const started = now();
      const result = original.apply(this, arguments);
      const finish = () => {
        state.metrics[metricKey] = roundMs(now() - started);
      };
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => requestAnimationFrame(finish));
      } else {
        setTimeout(finish, 0);
      }
      return result;
    };
    measured.__hsMapPerfMeasured = true;
    window[name] = measured;
  }

  function install() {
    patchAsyncGeometryGate('fullMapInit', provinceForFullMap);
    patchAsyncGeometryGate('bcInitLeafletMap', () => 'BC');
    patchAsyncGeometryGate('abInitLeafletMap', () => 'AB');
    patchAsyncGeometryGate('osInitMap', () => 'BC');

    patchBCIndexes();
    patchABIndexes();
    patchFullMapIndexes();

    measureNextPaint('fullMapSelectWMU', 'lastWmuSelectUiMs');
    measureNextPaint('fullMapSetSpecies', 'lastSpeciesChangeUiMs');
    measureNextPaint('osSelectWMU', 'lastGosWmuSelectUiMs');
  }

  window.__HS_MAP_PERFORMANCE__ = {
    version: VERSION,
    assetVersion: ASSET_VERSION,
    ensureBCGeometry,
    ensureABGeometry,
    invalidateBCIndex() {
      bcIndex = null;
      bcIndexDataRef = null;
      bcIndexDataLength = -1;
    },
    invalidateABIndex() {
      abIndex = null;
      abIndexBuiltAt = 0;
    },
    snapshot() {
      return {
        version: VERSION,
        assetVersion: ASSET_VERSION,
        bcGeometryLoaded: hasBCGeometry(),
        abGeometryLoaded: hasABGeometry(),
        bcIndexedWmus: bcIndex ? bcIndex.byWmu.size : 0,
        abIndexedWmus: abIndex ? abIndex.byWmu.size : 0,
        metrics: { ...state.metrics }
      };
    }
  };

  install();
})();
