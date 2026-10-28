/* HuntSmart LEH zone selection + viewport lock
   Ensures LEH zone clicks select the zone instead of toggling the parent WMU,
   and keeps the Interactive Map anchored to the viewport while preserving
   internal inspector scrolling without visible browser scrollbars. */
(function () {
  'use strict';

  if (window.__HUNTSMART_ZONE_SELECTION_FIX__) return;
  window.__HUNTSMART_ZONE_SELECTION_FIX__ = true;

  const STYLE_ID = 'hsZoneSelectionFixStyles';
  let currentCanvas = null;
  let currentFeature = null;
  let wrappedWMUHitTest = false;

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      html.hs-interactive-map-active,
      body.hs-interactive-map-active {
        height: 100% !important;
        overflow: hidden !important;
        overscroll-behavior: none !important;
      }

      body.hs-interactive-map-active #mapPage,
      body.hs-interactive-map-active #bcOpenSeasonsPage {
        overscroll-behavior: none !important;
      }

      #mapPage .fullmap-results-grid {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
        overscroll-behavior: contain !important;
      }
      #mapPage .fullmap-results-grid::-webkit-scrollbar {
        width: 0 !important;
        height: 0 !important;
        display: none !important;
      }

      #mapPage .hs-selected-leh-zone {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 9px 0 0;
        padding: 8px 9px;
        border: 1px solid rgba(240,180,41,.28);
        border-radius: 10px;
        background: rgba(240,180,41,.085);
        color: rgba(245,248,245,.9);
      }
      #mapPage .hs-selected-leh-zone-copy {
        min-width: 0;
        flex: 1 1 auto;
      }
      #mapPage .hs-selected-leh-zone-label {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #f6c85c;
        font-size: 11px;
        font-weight: 760;
        line-height: 1.2;
      }
      #mapPage .hs-selected-leh-zone-sub {
        display: block;
        margin-top: 2px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: rgba(236,241,237,.48);
        font-size: 9.5px;
        line-height: 1.2;
      }
      #mapPage .hs-selected-leh-zone-clear {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        width: 26px;
        height: 26px;
        padding: 0;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 8px;
        background: rgba(255,255,255,.035);
        color: rgba(245,248,245,.62);
        cursor: pointer;
      }
      #mapPage .hs-selected-leh-zone-clear:hover {
        color: #fff;
        border-color: rgba(255,255,255,.16);
        background: rgba(255,255,255,.07);
      }

      @media (max-width:768px) {
        #mapPage .hs-selected-leh-zone {
          margin-top: 7px;
          padding: 7px 8px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function pageVisible(id) {
    const el = document.getElementById(id);
    if (!el) return false;
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getClientRects().length > 0;
  }

  function syncViewportLock() {
    const active = pageVisible('mapPage') || pageVisible('bcOpenSeasonsPage');
    document.documentElement.classList.toggle('hs-interactive-map-active', active);
    document.body.classList.toggle('hs-interactive-map-active', active);
  }

  function mapInstance() {
    try {
      return (typeof fullMapInstance !== 'undefined') ? fullMapInstance : null;
    } catch (_) {
      return null;
    }
  }

  function queryLEHFeatureFromDomEvent(event) {
    const map = mapInstance();
    if (!map || !event || typeof event.clientX !== 'number' || typeof event.clientY !== 'number') return null;
    try {
      if (!map.getLayer || !map.getLayer('leh-fill')) return null;
      const canvas = map.getCanvas();
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const point = [event.clientX - rect.left, event.clientY - rect.top];
      const hits = map.queryRenderedFeatures(point, { layers: ['leh-fill'] });
      return hits && hits.length ? hits[0] : null;
    } catch (_) {
      return null;
    }
  }

  function formatZoneLabel(feature) {
    if (!feature) return 'Selected LEH zone';
    const p = feature.properties || {};
    if (p.label) return String(p.label);
    try {
      if (typeof _lehFormatZoneLabel === 'function') {
        return _lehFormatZoneLabel('', p.mu || '', p.zoneLetter || '');
      }
    } catch (_) {}
    const mu = p.mu ? `WMU ${p.mu}` : 'LEH zone';
    const letter = p.zoneLetter ? ` · Zone ${p.zoneLetter}` : '';
    return mu + letter;
  }

  function removeZoneBadge() {
    const badge = document.getElementById('hsSelectedLEHZoneBadge');
    if (badge) badge.remove();
  }

  function renderZoneBadge(feature) {
    currentFeature = feature || null;
    const header = document.querySelector('#mapPage #fullMapResultsDrawer .fullmap-results-header');
    if (!header || !feature) {
      removeZoneBadge();
      return;
    }

    let badge = document.getElementById('hsSelectedLEHZoneBadge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'hsSelectedLEHZoneBadge';
      badge.className = 'hs-selected-leh-zone';
      const sortRow = header.querySelector('.fullmap-results-sort-row');
      if (sortRow) header.insertBefore(badge, sortRow);
      else header.appendChild(badge);
    }

    const p = feature.properties || {};
    const species = p.zt ? String(p.zt) : '';
    badge.innerHTML = `
      <div class="hs-selected-leh-zone-copy">
        <span class="hs-selected-leh-zone-label">${escapeHtml(formatZoneLabel(feature))}</span>
        <span class="hs-selected-leh-zone-sub">${escapeHtml(species ? species + ' · selected zone' : 'Selected LEH zone')}</span>
      </div>
      <button type="button" class="hs-selected-leh-zone-clear" aria-label="Clear selected LEH zone" title="Clear selected zone">×</button>
    `;
    const clear = badge.querySelector('.hs-selected-leh-zone-clear');
    if (clear) clear.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      clearSelectedZone();
    });
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch];
    });
  }

  function clearSelectedZone() {
    currentFeature = null;
    try {
      if (typeof _activeLEH !== 'undefined' && _activeLEH != null) {
        if (typeof _setLEHFeatureState === 'function') {
          _setLEHFeatureState(_activeLEH, { active: false, hovered: false });
        }
        _activeLEH = null;
        if (typeof _setLEHHoverFilter === 'function') _setLEHHoverFilter(null);
      }
    } catch (_) {}
    removeZoneBadge();
  }
  window.hsClearSelectedLEHZone = clearSelectedZone;

  function markZoneClick(event) {
    const feature = queryLEHFeatureFromDomEvent(event);
    if (!feature) {
      if (currentFeature) clearSelectedZone();
      return;
    }

    try {
      event._hsPreferLEHZoneSelection = true;
      event._hsWMUToggledFromLEH = true;
    } catch (_) {}

    currentFeature = feature;
    setTimeout(function () { renderZoneBadge(feature); }, 0);
  }

  function wrapWMUHitTest() {
    if (wrappedWMUHitTest) return;
    let original = null;
    try {
      if (typeof _getTopWMUFeatureAtPoint === 'function') original = _getTopWMUFeatureAtPoint;
    } catch (_) {}
    if (typeof original !== 'function') return;

    const wrapped = function (e) {
      try {
        if (e && e.originalEvent && e.originalEvent._hsPreferLEHZoneSelection) return null;
      } catch (_) {}
      return original.apply(this, arguments);
    };
    wrapped.__hsZoneSelectionWrapped = true;

    try { window._getTopWMUFeatureAtPoint = wrapped; } catch (_) {}
    try { _getTopWMUFeatureAtPoint = wrapped; } catch (_) {}
    wrappedWMUHitTest = true;
  }

  function attachCanvasCapture() {
    const map = mapInstance();
    if (!map || typeof map.getCanvas !== 'function') return;
    const canvas = map.getCanvas();
    if (!canvas || canvas === currentCanvas) return;
    if (currentCanvas) currentCanvas.removeEventListener('click', markZoneClick, true);
    currentCanvas = canvas;
    currentCanvas.addEventListener('click', markZoneClick, true);
  }

  function observeMapPages() {
    ['mapPage', 'bcOpenSeasonsPage'].forEach(function (id) {
      const el = document.getElementById(id);
      if (!el || el.__hsViewportLockObserved) return;
      el.__hsViewportLockObserved = true;
      const observer = new MutationObserver(syncViewportLock);
      observer.observe(el, { attributes: true, attributeFilter: ['class', 'style'] });
    });

    const mapContainer = document.getElementById('fullMapLeaflet');
    if (mapContainer && !mapContainer.__hsZoneCanvasObserved) {
      mapContainer.__hsZoneCanvasObserved = true;
      const observer = new MutationObserver(function () {
        attachCanvasCapture();
        wrapWMUHitTest();
      });
      observer.observe(mapContainer, { childList: true, subtree: true });
    }
  }

  function boot() {
    injectStyles();
    syncViewportLock();
    wrapWMUHitTest();
    attachCanvasCapture();
    observeMapPages();

    [100, 350, 900, 1800].forEach(function (delay) {
      setTimeout(function () {
        wrapWMUHitTest();
        attachCanvasCapture();
        syncViewportLock();
      }, delay);
    });

    document.addEventListener('click', function () {
      setTimeout(function () {
        wrapWMUHitTest();
        attachCanvasCapture();
        syncViewportLock();
      }, 0);
    }, true);
    window.addEventListener('resize', syncViewportLock, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
