/* HuntSmart Premium Map Shell
   Final presentation/interaction layer for the Interactive Map.
   Keeps the Mapbox canvas stable while selected-unit intelligence floats above it. */
(function () {
  'use strict';

  if (window.__HUNTSMART_PREMIUM_MAP_SHELL__) return;
  window.__HUNTSMART_PREMIUM_MAP_SHELL__ = true;

  const MOBILE_QUERY = '(max-width: 768px)';
  const STYLE_ID = 'hsPremiumMapShellStyles';
  let drawerObserver = null;
  let installTimer = null;

  function isMobile() {
    return !!(window.matchMedia && window.matchMedia(MOBILE_QUERY).matches);
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
/* ===== HuntSmart premium map shell ===== */
#mapPage.hs-premium-map {
  --hs-inspector-width: clamp(350px, 28vw, 400px);
  --hs-map-gap: 14px;
  --hs-map-surface: rgba(12,16,14,.92);
  --hs-map-surface-strong: rgba(12,16,14,.975);
  --hs-map-border: rgba(255,255,255,.12);
  --hs-map-border-strong: rgba(255,255,255,.18);
  --hs-map-accent: #65d576;
  --hs-map-muted: rgba(236,241,237,.58);
}

@media (min-width: 769px) {
  #mapPage.hs-premium-map .fullmap-body {
    position: relative !important;
    display: block !important;
    overflow: hidden !important;
  }
  #mapPage.hs-premium-map .fullmap-container {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    min-width: 0 !important;
  }

  #mapPage.hs-premium-map .fullmap-floating-search {
    width: 230px !important;
    max-width: 230px !important;
  }
  #mapPage.hs-premium-map .fullmap-floating-search .fullmap-search-input {
    width: 100% !important;
    max-width: 100% !important;
  }
  #mapPage.hs-premium-map .fullmap-topbar {
    left: 252px !important;
    right: auto !important;
    width: auto !important;
    max-width: 310px !important;
  }
  #mapPage.hs-premium-map .fullmap-toolbar-main {
    width: auto !important;
    max-width: 310px !important;
  }
  #mapPage.hs-premium-map .fullmap-basemap-buttons,
  #mapPage.hs-premium-map .fullmap-toolbar-main > *:has(input[type="range"]),
  #mapPage.hs-premium-map #fullMapClearBtn,
  #mapPage.hs-premium-map #fullMapExpandBtn {
    display: none !important;
  }
  #mapPage.hs-premium-map #fullMapSpeciesSelect {
    width: 136px !important;
    min-width: 136px !important;
    max-width: 136px !important;
  }
  #mapPage.hs-premium-map #hsWorldSettingsBtn {
    min-width: 78px !important;
    padding: 0 12px !important;
  }

  #mapPage.hs-premium-map #hsWorldSettingsPanel {
    position: fixed !important;
    left: 252px !important;
    right: auto !important;
    top: 112px !important;
    width: min(365px, calc(100vw - 32px)) !important;
    max-height: min(620px, calc(100dvh - 132px)) !important;
    z-index: 9470 !important;
  }
  #mapPage.hs-premium-map #hsWorldSettingsPanel .hs-wc-panel-body > .hs-wc-section {
    display: block !important;
  }

  #mapPage.hs-premium-map #fullMapResultsDrawer {
    position: absolute !important;
    top: 70px !important;
    right: var(--hs-map-gap) !important;
    bottom: var(--hs-map-gap) !important;
    left: auto !important;
    z-index: 9360 !important;
    width: var(--hs-inspector-width) !important;
    min-width: 0 !important;
    max-width: calc(100% - 28px) !important;
    height: auto !important;
    max-height: none !important;
    margin: 0 !important;
    border: 1px solid var(--hs-map-border) !important;
    border-radius: 17px !important;
    background: var(--hs-map-surface-strong) !important;
    box-shadow: 0 20px 56px rgba(0,0,0,.38) !important;
    overflow: hidden !important;
    backdrop-filter: blur(20px) saturate(120%) !important;
    -webkit-backdrop-filter: blur(20px) saturate(120%) !important;
    animation: hsInspectorIn .18s ease-out both;
  }
  @keyframes hsInspectorIn {
    from { opacity: 0; transform: translateX(10px); }
    to { opacity: 1; transform: translateX(0); }
  }
  #mapPage.hs-premium-map #fullMapResultsDrawer .fullmap-results-header {
    position: sticky !important;
    top: 0 !important;
    z-index: 4 !important;
    padding: 15px 15px 12px !important;
    border-bottom: 1px solid rgba(255,255,255,.08) !important;
    background: rgba(12,16,14,.97) !important;
    backdrop-filter: blur(18px) !important;
    -webkit-backdrop-filter: blur(18px) !important;
  }
  #mapPage.hs-premium-map .fullmap-results-title-row {
    align-items: flex-start !important;
    gap: 10px !important;
  }
  #mapPage.hs-premium-map .fullmap-results-title-wrap {
    min-width: 0 !important;
    flex: 1 1 auto !important;
  }
  #mapPage.hs-premium-map .hs-premium-kicker {
    display: block;
    margin: 0 0 4px;
    color: rgba(236,241,237,.45);
    font-size: 9px;
    line-height: 1;
    font-weight: 800;
    letter-spacing: .11em;
    text-transform: uppercase;
  }
  #mapPage.hs-premium-map .fullmap-results-title {
    display: block !important;
    color: #f4f7f4 !important;
    font-size: 17px !important;
    line-height: 1.2 !important;
    font-weight: 760 !important;
    letter-spacing: -.015em !important;
  }
  #mapPage.hs-premium-map .fullmap-results-count {
    display: inline-flex !important;
    align-items: center !important;
    margin-top: 6px !important;
    padding: 3px 7px !important;
    border: 1px solid rgba(255,255,255,.08) !important;
    border-radius: 999px !important;
    background: rgba(255,255,255,.04) !important;
    color: var(--hs-map-muted) !important;
    font-size: 10px !important;
    font-weight: 650 !important;
  }
  #mapPage.hs-premium-map .fullmap-goto-btn {
    min-height: 32px !important;
    padding: 0 9px !important;
    border: 1px solid rgba(101,213,118,.22) !important;
    border-radius: 9px !important;
    background: rgba(101,213,118,.08) !important;
    color: #c8f8ce !important;
    font-size: 10px !important;
    font-weight: 720 !important;
    white-space: nowrap !important;
  }
  #mapPage.hs-premium-map .fullmap-close-results {
    width: 32px !important;
    height: 32px !important;
    min-width: 32px !important;
    border: 1px solid rgba(255,255,255,.09) !important;
    border-radius: 9px !important;
    background: rgba(255,255,255,.035) !important;
    color: rgba(236,241,237,.62) !important;
  }
  #mapPage.hs-premium-map .fullmap-close-results:hover,
  #mapPage.hs-premium-map .fullmap-goto-btn:hover {
    border-color: rgba(255,255,255,.18) !important;
    color: #fff !important;
    background: rgba(255,255,255,.07) !important;
  }

  #mapPage.hs-premium-map .hs-premium-inspector-summary {
    display: grid;
    grid-template-columns: minmax(0,1fr) auto;
    gap: 3px 12px;
    align-items: center;
    margin: 12px 0 10px;
    padding: 11px 12px;
    border: 1px solid rgba(101,213,118,.15);
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(101,213,118,.09), rgba(255,255,255,.025));
  }
  #mapPage.hs-premium-map .hs-premium-summary-label {
    grid-column: 1 / -1;
    color: rgba(236,241,237,.47);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: .09em;
    text-transform: uppercase;
  }
  #mapPage.hs-premium-map .hs-premium-summary-species {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #f4f7f4;
    font-size: 12px;
    font-weight: 720;
  }
  #mapPage.hs-premium-map .hs-premium-summary-value {
    color: #70dd7e;
    font-size: 16px;
    line-height: 1;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }
  #mapPage.hs-premium-map .fullmap-results-sort-row {
    display: flex !important;
    align-items: center !important;
    gap: 5px !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  #mapPage.hs-premium-map .fullmap-sort-btn {
    min-height: 29px !important;
    padding: 0 9px !important;
    border-radius: 8px !important;
    font-size: 10px !important;
  }
  #mapPage.hs-premium-map .fullmap-leh-species-wrap {
    margin-top: 9px !important;
    width: 100% !important;
  }
  #mapPage.hs-premium-map .fullmap-leh-species-wrap select {
    width: 100% !important;
    min-height: 35px !important;
    border-radius: 9px !important;
  }

  #mapPage.hs-premium-map .fullmap-results-grid {
    min-height: 0 !important;
    overflow-y: auto !important;
    overscroll-behavior: contain !important;
    padding: 11px !important;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,.16) transparent;
  }
  #mapPage.hs-premium-map .fm-card {
    margin: 0 0 8px !important;
    padding: 12px 12px 11px !important;
    border: 1px solid rgba(255,255,255,.08) !important;
    border-radius: 12px !important;
    background: rgba(255,255,255,.035) !important;
    box-shadow: none !important;
  }
  #mapPage.hs-premium-map .fm-card:hover {
    transform: translateY(-1px) !important;
    border-color: rgba(255,255,255,.14) !important;
    background: rgba(255,255,255,.055) !important;
  }
  #mapPage.hs-premium-map .fm-card-species {
    font-size: 13px !important;
    line-height: 1.15 !important;
  }
  #mapPage.hs-premium-map .fm-card-meta {
    margin-top: 3px !important;
    font-size: 10.5px !important;
    color: rgba(236,241,237,.48) !important;
  }
  #mapPage.hs-premium-map .fm-card-odds {
    font-size: 18px !important;
    line-height: 1 !important;
    font-variant-numeric: tabular-nums;
  }
  #mapPage.hs-premium-map .fm-card-bottom {
    gap: 5px !important;
    margin-top: 9px !important;
  }
  #mapPage.hs-premium-map .fm-card-code,
  #mapPage.hs-premium-map .fm-card-success {
    font-size: 9.5px !important;
  }

  #mapPage.hs-premium-map #fullMapControlStack {
    transition: right .18s ease, opacity .15s ease !important;
  }
  #mapPage.hs-premium-map.hs-premium-results-open #fullMapControlStack {
    right: calc(var(--hs-inspector-width) + 30px) !important;
  }
  #mapPage.hs-premium-map.hs-premium-results-open .mapboxgl-ctrl-bottom-right {
    right: calc(var(--hs-inspector-width) + 18px) !important;
  }
}

@media (min-width: 769px) and (max-width: 1080px) {
  #mapPage.hs-premium-map { --hs-inspector-width: 350px; }
  #mapPage.hs-premium-map .fullmap-floating-search {
    width: 195px !important;
    max-width: 195px !important;
  }
  #mapPage.hs-premium-map .fullmap-topbar { left: 217px !important; }
  #mapPage.hs-premium-map #hsWorldSettingsPanel { left: 217px !important; }
  #mapPage.hs-premium-map #fullMapSpeciesSelect {
    width: 122px !important;
    min-width: 122px !important;
    max-width: 122px !important;
  }
}

@media (max-width: 768px) {
  #mapPage.hs-premium-map { --hs-mobile-sheet-peek: 126px; }
  #mapPage.hs-premium-map #fullMapResultsDrawer.hs-drawer-open {
    position: absolute !important;
    inset: auto 0 0 0 !important;
    z-index: 9460 !important;
    display: flex !important;
    flex-direction: column !important;
    width: 100% !important;
    max-width: none !important;
    height: min(61%, 520px) !important;
    max-height: min(61%, 520px) !important;
    margin: 0 !important;
    border: 1px solid rgba(255,255,255,.12) !important;
    border-bottom: 0 !important;
    border-radius: 20px 20px 0 0 !important;
    background: rgba(12,16,14,.985) !important;
    box-shadow: 0 -18px 50px rgba(0,0,0,.42) !important;
    overflow: hidden !important;
    transition: height .2s ease, max-height .2s ease, transform .2s ease !important;
    backdrop-filter: blur(20px) saturate(120%) !important;
    -webkit-backdrop-filter: blur(20px) saturate(120%) !important;
  }
  #mapPage.hs-premium-map #fullMapResultsDrawer.hs-drawer-open.is-collapsed {
    height: var(--hs-mobile-sheet-peek) !important;
    max-height: var(--hs-mobile-sheet-peek) !important;
  }
  #mapPage.hs-premium-map #fullMapResultsDrawer.hs-drawer-open::before {
    content: '';
    display: block;
    flex: 0 0 auto;
    width: 38px;
    height: 4px;
    margin: 7px auto 2px;
    border-radius: 999px;
    background: rgba(255,255,255,.22);
  }
  #mapPage.hs-premium-map #fullMapResultsDrawer .fullmap-results-header {
    flex: 0 0 auto !important;
    padding: 8px 12px 10px !important;
    border-bottom: 1px solid rgba(255,255,255,.08) !important;
    background: rgba(12,16,14,.98) !important;
  }
  #mapPage.hs-premium-map .hs-premium-kicker,
  #mapPage.hs-premium-map .hs-premium-inspector-summary,
  #mapPage.hs-premium-map .fullmap-goto-btn {
    display: none !important;
  }
  #mapPage.hs-premium-map .fullmap-results-title { font-size: 15px !important; }
  #mapPage.hs-premium-map .fullmap-results-count {
    margin-top: 3px !important;
    font-size: 9.5px !important;
  }
  #mapPage.hs-premium-map .fullmap-close-results {
    width: 34px !important;
    height: 34px !important;
  }
  #mapPage.hs-premium-map #fullMapResultsDrawer.is-collapsed .fullmap-results-sort-row,
  #mapPage.hs-premium-map #fullMapResultsDrawer.is-collapsed .fullmap-leh-species-wrap,
  #mapPage.hs-premium-map #fullMapResultsDrawer.is-collapsed .fullmap-results-grid {
    display: none !important;
  }
  #mapPage.hs-premium-map #fullMapResultsDrawer:not(.is-collapsed) .fullmap-results-grid {
    display: block !important;
    flex: 1 1 auto !important;
    min-height: 0 !important;
    overflow-y: auto !important;
    padding: 10px !important;
  }
  #mapPage.hs-premium-map .fm-card {
    padding: 11px !important;
    margin-bottom: 8px !important;
    border-radius: 12px !important;
  }
  #mapPage.hs-premium-map.hs-premium-results-open #hsBrCluster {
    bottom: calc(var(--hs-mobile-sheet-peek) + 10px) !important;
    transition: bottom .18s ease, opacity .14s ease !important;
  }
  #mapPage.hs-premium-map.hs-premium-results-expanded #hsBrCluster,
  #mapPage.hs-premium-map.hs-premium-results-expanded #hsRail {
    opacity: 0 !important;
    pointer-events: none !important;
  }
  #mapPage.hs-premium-map.hs-premium-results-open #hsRbCards {
    background: rgba(101,213,118,.14) !important;
    border-color: rgba(101,213,118,.30) !important;
    color: #effff1 !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  #mapPage.hs-premium-map #fullMapResultsDrawer,
  #mapPage.hs-premium-map #fullMapControlStack,
  #mapPage.hs-premium-map #hsBrCluster {
    animation: none !important;
    transition: none !important;
  }
}
`;
    document.head.appendChild(style);
  }

  function page() { return document.getElementById('mapPage'); }
  function drawer() { return document.getElementById('fullMapResultsDrawer'); }

  function resultsVisible() {
    const d = drawer();
    if (!d) return false;
    if (isMobile()) return d.classList.contains('hs-drawer-open') && getComputedStyle(d).display !== 'none';
    return getComputedStyle(d).display !== 'none';
  }

  function closeLayersPanel() {
    try {
      if (typeof window.hsWcCloseSettings === 'function') window.hsWcCloseSettings();
      if (typeof window.hsFallbackCloseLayers === 'function') window.hsFallbackCloseLayers();
    } catch (_) {}
  }

  function updateToolbar() {
    const p = page();
    if (!p) return;
    p.classList.add('hs-premium-map');
    const search = document.getElementById('fullMapSearchInput');
    if (search && search.placeholder !== 'Search places or WMU…') search.placeholder = 'Search places or WMU…';
    const layers = document.getElementById('hsWorldSettingsBtn');
    if (layers) {
      const text = layers.querySelector('span');
      if (text && text.textContent !== 'Layers') text.textContent = 'Layers';
      layers.title = 'Basemap, terrain and map layers';
      layers.setAttribute('aria-label', 'Basemap, terrain and map layers');
    }
    const viewAll = document.getElementById('fullMapGotoBtn');
    if (viewAll && viewAll.textContent.trim() !== 'View all draws') viewAll.textContent = 'View all draws';
  }

  function decorateInspector() {
    const d = drawer();
    if (!d) return;
    const header = d.querySelector('.fullmap-results-header');
    const title = d.querySelector('#fullMapResultsTitle');
    const titleWrap = d.querySelector('.fullmap-results-title-wrap');
    const sortRow = d.querySelector('.fullmap-results-sort-row');
    const firstCard = d.querySelector('.fm-card');

    if (titleWrap && title && !titleWrap.querySelector('.hs-premium-kicker')) {
      const kicker = document.createElement('span');
      kicker.className = 'hs-premium-kicker';
      kicker.textContent = 'Selected unit';
      titleWrap.insertBefore(kicker, title);
    }

    let summary = header && header.querySelector('.hs-premium-inspector-summary');
    if (!firstCard) {
      if (summary) summary.remove();
      return;
    }

    const species = firstCard.querySelector('.fm-card-species');
    const odds = firstCard.querySelector('.fm-card-odds');
    const success = firstCard.querySelector('.fm-card-success');
    const successSort = !!document.querySelector('#fmSortSuccess.active');
    const value = successSort && success
      ? String(success.textContent || '').replace(/\s*success\s*/i, '').trim()
      : String(odds && odds.textContent || '').trim();
    const label = successSort ? 'Highest hunter success' : 'Best draw odds';

    if (!summary && header) {
      summary = document.createElement('div');
      summary.className = 'hs-premium-inspector-summary';
      if (sortRow) header.insertBefore(summary, sortRow);
      else header.appendChild(summary);
    }
    if (summary) {
      summary.innerHTML = '<span class="hs-premium-summary-label"></span>' +
        '<strong class="hs-premium-summary-species"></strong>' +
        '<b class="hs-premium-summary-value"></b>';
      const labelEl = summary.querySelector('.hs-premium-summary-label');
      const speciesEl = summary.querySelector('.hs-premium-summary-species');
      const valueEl = summary.querySelector('.hs-premium-summary-value');
      if (labelEl) labelEl.textContent = label;
      if (speciesEl) speciesEl.textContent = species ? species.textContent.trim() : 'Top opportunity';
      if (valueEl) valueEl.textContent = value || '—';
    }
  }

  function syncDrawerState() {
    const p = page();
    const d = drawer();
    if (!p || !d) return;
    const visible = resultsVisible();
    p.classList.toggle('hs-premium-results-open', visible);
    const expanded = visible && isMobile() && !d.classList.contains('is-collapsed');
    p.classList.toggle('hs-premium-results-expanded', expanded);
    if (visible) {
      closeLayersPanel();
      decorateInspector();
    }
  }

  function makeMobilePeekVisible() {
    if (!isMobile()) return;
    const d = drawer();
    const body = document.getElementById('fullMapBody');
    if (!d) return;
    d.classList.add('hs-drawer-open', 'is-collapsed');
    d.style.setProperty('display', 'flex', 'important');
    if (body) body.classList.add('hs-drawer-open');
  }

  function wrapFunction(name, after) {
    const current = window[name];
    if (typeof current !== 'function' || current.__hsPremiumWrapped) return;
    const wrapped = function () {
      const result = current.apply(this, arguments);
      try { after && after.apply(this, arguments); } catch (_) {}
      return result;
    };
    wrapped.__hsPremiumWrapped = true;
    wrapped.__hsPremiumOriginal = current;
    window[name] = wrapped;
    try { eval(name + ' = window[name]'); } catch (_) {}
  }

  function installWrappers() {
    wrapFunction('fullMapShowResults', function () {
      if (isMobile()) makeMobilePeekVisible();
      setTimeout(syncDrawerState, 0);
      setTimeout(syncDrawerState, 80);
    });
    ['fullMapHideResults', 'fullMapCloseResults', 'fullMapClearAll', 'fullMapSetProvince'].forEach(function (name) {
      wrapFunction(name, function () { setTimeout(syncDrawerState, 0); });
    });
    wrapFunction('fullMapSetSort', function () {
      setTimeout(function () { decorateInspector(); syncDrawerState(); }, 0);
    });
    wrapFunction('hsCardsToggle', function () {
      setTimeout(syncDrawerState, 0);
      setTimeout(syncDrawerState, 120);
    });
  }

  function observeDrawer() {
    const d = drawer();
    if (!d || d.__hsPremiumObserved) return;
    d.__hsPremiumObserved = true;
    drawerObserver = new MutationObserver(function () {
      syncDrawerState();
      decorateInspector();
    });
    drawerObserver.observe(d, {
      attributes: true,
      attributeFilter: ['class', 'style'],
      childList: true,
      subtree: true
    });
  }

  function install() {
    injectStyles();
    updateToolbar();
    installWrappers();
    observeDrawer();
    syncDrawerState();

    const p = page();
    if (p && !p.__hsPremiumPageObserved) {
      p.__hsPremiumPageObserved = true;
      const observer = new MutationObserver(function () {
        updateToolbar();
        installWrappers();
        observeDrawer();
        syncDrawerState();
      });
      observer.observe(p, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    }

    if (!installTimer) {
      installTimer = setInterval(function () {
        updateToolbar();
        installWrappers();
        observeDrawer();
        syncDrawerState();
      }, 900);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();