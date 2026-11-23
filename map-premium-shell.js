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

/* Selected-unit refinement — scoped to the Interactive Map inspector only. */
#mapPage.hs-premium-map #fullMapResultsDrawer {
  --hs-unit-edge: rgba(228,240,232,.12);
  --hs-unit-text: #f1f5f1;
  --hs-unit-muted: #a8b8ad;
  font-family: 'DM Sans', sans-serif !important;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .fullmap-results-header {
  padding: 18px 17px 15px !important;
  background: #0e1410 !important;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .hs-premium-kicker {
  font-size: 10.5px !important;
  letter-spacing: .105em !important;
  color: #8ca495 !important;
  margin-bottom: 6px !important;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .fullmap-results-title {
  font-size: 21px !important;
  line-height: 1.13 !important;
  letter-spacing: -.03em !important;
  color: var(--hs-unit-text) !important;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .fullmap-results-count {
  font-size: 11px !important;
  padding: 3px 9px !important;
  border-radius: 6px !important;
  color: #b4c3b9 !important;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .fullmap-goto-btn,
#mapPage.hs-premium-map #fullMapResultsDrawer .fullmap-close-results {
  min-height: 44px !important;
  height: 44px !important;
  border-radius: 10px !important;
  font-size: 12px !important;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .fullmap-goto-btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 12px !important;
  background: rgba(72,141,87,.15) !important;
  color: #d3f3d9 !important;
  border-color: rgba(111,183,128,.34) !important;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .fullmap-close-results {
  min-width: 44px !important;
  width: 44px !important;
  font-size: 17px !important;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .hs-premium-inspector-summary {
  display: none !important;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .fullmap-leh-species-wrap {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #adbdb1 !important;
  font-size: 12px !important;
  margin-top: 12px !important;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .fullmap-leh-species-wrap select {
  min-height: 44px !important;
  font-size: 13px !important;
  background-color: #101914 !important;
  border-color: #31533c !important;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .fullmap-results-sort-row {
  gap: 5px !important;
  margin-top: 13px !important;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .fullmap-sort-btn {
  min-height: 44px !important;
  padding: 0 14px !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  border-radius: 9px !important;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .fullmap-sort-btn:focus-visible,
#mapPage.hs-premium-map #fullMapResultsDrawer .fullmap-goto-btn:focus-visible,
#mapPage.hs-premium-map #fullMapResultsDrawer .fullmap-close-results:focus-visible,
#mapPage.hs-premium-map #fullMapResultsDrawer .hs-hunt-toggle:focus-visible,
#mapPage.hs-premium-map #fullMapResultsDrawer .hs-hunt-open-draw:focus-visible {
  outline: 2px solid #a2e6ae !important;
  outline-offset: 2px !important;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .fullmap-results-grid {
  padding: 12px !important;
  background: #0c120e !important;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .fm-card.hs-hunt-refined {
  padding: 0 !important;
  margin: 0 0 9px !important;
  border: 1px solid var(--hs-unit-edge) !important;
  border-radius: 13px !important;
  background: #161c18 !important;
  overflow: hidden !important;
  transition: border-color .14s ease, background .14s ease !important;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .fm-card.hs-hunt-refined:hover,
#mapPage.hs-premium-map #fullMapResultsDrawer .fm-card.hs-hunt-refined.hs-expanded {
  transform: none !important;
  background: #19221c !important;
  border-color: rgba(130,188,143,.38) !important;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .hs-hunt-toggle {
  display: block;
  width: 100%;
  min-height: 108px;
  padding: 14px 15px 12px;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--hs-unit-text);
  text-align: left;
  font: inherit;
  cursor: pointer;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .fm-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .fm-card-species {
  font-size: 15.5px !important;
  font-weight: 750 !important;
  line-height: 1.28 !important;
  color: #f1f5f1 !important;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .fm-card-meta {
  font-size: 11.5px !important;
  margin-top: 3px !important;
  color: #aab9ae !important;
  line-height: 1.4 !important;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .hs-hunt-card-odds {
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
  min-width: 66px;
  gap: 3px;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .hs-hunt-odds-label {
  color: #9eaea3;
  font-weight: 750;
  font-size: 10px;
  letter-spacing: .08em;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .fm-card-odds {
  font-size: 24px !important;
  line-height: 1.05 !important;
  font-weight: 800 !important;
  font-variant-numeric: tabular-nums;
  letter-spacing: -.02em;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .fm-card-bottom {
  display: flex !important;
  align-items: center !important;
  flex-wrap: wrap;
  gap: 5px 10px !important;
  margin-top: 15px !important;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .fm-card-code,
#mapPage.hs-premium-map #fullMapResultsDrawer .fm-card-success {
  font-size: 11px !important;
  line-height: 1.4 !important;
  color: #b5c1b9 !important;
  background: transparent !important;
  border: 0 !important;
  padding: 0 !important;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .fm-card-success.fill-none {
  color: #889b8f !important;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .hs-hunt-expand-hint {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 11.5px;
  font-weight: 700;
  color: #d6e7d8;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .hs-hunt-expand-plus {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  background: rgba(113,181,126,.10);
  border: 1px solid rgba(113,181,126,.22);
  font-size: 17px;
  line-height: 1;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .hs-expanded .hs-hunt-expand-plus {
  background: rgba(113,181,126,.2);
}
#mapPage.hs-premium-map #fullMapResultsDrawer .hs-hunt-card-details[hidden] { display: none !important; }
#mapPage.hs-premium-map #fullMapResultsDrawer .hs-hunt-card-details {
  padding: 14px 15px 16px;
  border-top: 1px solid rgba(210,232,216,.11);
}
#mapPage.hs-premium-map #fullMapResultsDrawer .hs-hunt-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0,1fr));
  gap: 13px 12px;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .hs-card-fact {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .hs-card-fact > span {
  font-size: 10.5px;
  color: #91a99a;
  font-weight: 650;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .hs-card-fact > strong {
  font-size: 12.5px;
  color: #e4eee5;
  font-weight: 700;
  overflow-wrap: anywhere;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .hs-hunt-history {
  border-top: 1px solid rgba(210,232,216,.1);
  margin-top: 14px;
  padding-top: 14px;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .hs-hunt-history-heading {
  font-size: 11.5px;
  color: #cad8ce;
  font-weight: 700;
  margin-bottom: 12px;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .hs-hunt-history-bars {
  display: grid;
  grid-template-columns: repeat(8, minmax(0,1fr));
  align-items: end;
  gap: 8px;
  min-height: 82px;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .hs-hunt-history-year {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 10px;
  color: #9bac9d;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .hs-hunt-history-track {
  position: relative;
  height: 60px;
  width: 100%;
  max-width: 20px;
  border-radius: 3px;
  background: rgba(170,200,176,.09);
  overflow: hidden;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .hs-hunt-history-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  border-radius: 3px 3px 0 0;
  background: #6bb67d;
  min-height: 2px;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .hs-hunt-metric-note {
  margin: 15px 0 13px;
  color: #a9b9ad;
  font-size: 11.5px;
  line-height: 1.55;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .hs-hunt-open-draw {
  width: 100%;
  min-height: 44px;
  border: 1px solid #4c8358;
  border-radius: 9px;
  color: #ebfff0;
  background: #285a35;
  font-family: inherit;
  font-weight: 750;
  font-size: 12.5px;
  cursor: pointer;
}
#mapPage.hs-premium-map #fullMapResultsDrawer .hs-hunt-open-draw:hover {
  background: #346e43;
}
@media (max-width: 768px) {
  #mapPage.hs-premium-map { --hs-mobile-sheet-peek: 132px; }
  #mapPage.hs-premium-map #fullMapResultsDrawer.hs-drawer-open {
    height: min(78dvh, 720px) !important;
    max-height: calc(100dvh - 94px) !important;
  }
  #mapPage.hs-premium-map #fullMapResultsDrawer.hs-drawer-open.is-collapsed {
    height: var(--hs-mobile-sheet-peek) !important;
    max-height: var(--hs-mobile-sheet-peek) !important;
  }
  #mapPage.hs-premium-map #fullMapResultsDrawer .fullmap-results-header {
    padding: 10px 13px 12px !important;
  }
  #mapPage.hs-premium-map #fullMapResultsDrawer .hs-premium-kicker {
    display: block !important;
    font-size: 9.5px !important;
  }
  #mapPage.hs-premium-map #fullMapResultsDrawer .fullmap-results-title {
    font-size: 18px !important;
  }
  #mapPage.hs-premium-map #fullMapResultsDrawer .fullmap-results-count {
    font-size: 10.5px !important;
  }
  #mapPage.hs-premium-map #fullMapResultsDrawer .fullmap-goto-btn {
    display: inline-flex !important;
    padding: 0 9px !important;
  }
  #mapPage.hs-premium-map #fullMapResultsDrawer.is-collapsed .fullmap-goto-btn { display: none !important; }
  #mapPage.hs-premium-map #fullMapResultsDrawer .fullmap-sort-btn {
    min-height: 44px !important;
  }
  #mapPage.hs-premium-map #fullMapResultsDrawer .fullmap-results-grid {
    padding: 10px 12px !important;
  }
  #mapPage.hs-premium-map #fullMapResultsDrawer .hs-hunt-toggle {
    min-height: 108px;
    padding: 14px;
  }
}
@media (max-width: 380px) {
  #mapPage.hs-premium-map #fullMapResultsDrawer .fullmap-goto-btn { font-size: 11px !important; padding: 0 7px !important; }
  #mapPage.hs-premium-map #fullMapResultsDrawer .fullmap-results-title { font-size: 17px !important; }
  #mapPage.hs-premium-map #fullMapResultsDrawer .fm-card-bottom { gap: 5px 8px !important; }
}


@media (max-width: 768px) {
  #mapPage.hs-premium-map #fullMapResultsDrawer.hs-drawer-open {
    height: min(60dvh, 520px) !important;
    max-height: calc(100dvh - 94px) !important;
  }
  #mapPage.hs-premium-map #fullMapResultsDrawer.hs-drawer-open.is-maximized:not(.is-collapsed) {
    height: min(88dvh, 820px) !important;
    max-height: calc(100dvh - 58px) !important;
  }
  #mapPage.hs-premium-map #fullMapResultsDrawer.hs-drawer-open::before { display: none !important; }
  #mapPage.hs-premium-map #fullMapResultsDrawer .hs-sheet-size-handle {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 32px;
    height: 32px;
    width: 80px;
    padding: 11px 0 0;
    margin: 0 auto;
    flex: 0 0 32px;
    cursor: ns-resize;
    border: 0;
    background: transparent;
    touch-action: manipulation;
  }
  #mapPage.hs-premium-map #fullMapResultsDrawer .hs-sheet-size-handle::before {
    content: '';
    display: block;
    height: 4px;
    width: 38px;
    border-radius: 99px;
    background: rgba(227,242,230,.32);
  }
  #mapPage.hs-premium-map #fullMapResultsDrawer .hs-sheet-size-handle:focus-visible {
    outline: 2px solid #a2e6ae;
    outline-offset: -2px;
  }
}
@media (min-width: 769px) {
  #mapPage.hs-premium-map #fullMapResultsDrawer .hs-sheet-size-handle { display:none !important; }
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

  // Preserve the underlying draw data and navigation; this is presentation only.
  function decorateInspector() {
    const d = drawer();
    if (!d) return;
    const titleWrap = d.querySelector('.fullmap-results-title-wrap');
    const title = d.querySelector('#fullMapResultsTitle');
    const duplicate = d.querySelector('.hs-premium-inspector-summary');
    if (duplicate) duplicate.remove();

    if (titleWrap && title && !titleWrap.querySelector('.hs-premium-kicker')) {
      const kicker = document.createElement('span');
      kicker.className = 'hs-premium-kicker';
      kicker.textContent = 'SELECTED HUNTING UNIT';
      titleWrap.insertBefore(kicker, title);
    }

    d.querySelectorAll('.fm-card').forEach(enhanceHuntCard);
    const all = document.getElementById('fullMapGotoBtn');
    if (all) all.textContent = isMobile() ? 'All draws' : 'View all draws';
    const close = d.querySelector('.fullmap-close-results');
    if (close) {
      close.setAttribute('aria-label', 'Close selected unit results');
      close.title = 'Close results';
    }
    const sortOdds = d.querySelector('#fmSortOdds');
    const sortSuccess = d.querySelector('#fmSortSuccess');
    if (sortOdds) sortOdds.setAttribute('aria-pressed', String(sortOdds.classList.contains('active')));
    if (sortSuccess) sortSuccess.setAttribute('aria-pressed', String(sortSuccess.classList.contains('active')));
  }

  function huntMeta(label, value) {
    const cell = document.createElement('div');
    cell.className = 'hs-card-fact';
    const key = document.createElement('span');
    key.textContent = label;
    const val = document.createElement('strong');
    val.textContent = value || 'Not available';
    cell.append(key, val);
    return cell;
  }

  function renderHuntHistory(panel, action) {
    // Official historical fill-rate data is optional; never manufacture missing years.
    const match = String(action || '').match(/openBCDrawDetailFromMap\('([^']*)','([^']*)'\)/);
    if (!match || typeof DATA === 'undefined' || !Array.isArray(DATA)) return;
    const normalized = value => String(value || '').trim().replace(/[*+]/g, '').replace(/^(\d+)-0*(\d+)$/, '$1-$2');
    const row = DATA.find(item => String(item.Code) === match[1] && normalized(item.MU) === normalized(match[2]));
    if (!row || !row.yearly_fill_rates || typeof row.yearly_fill_rates !== 'object') return;
    const entries = Object.entries(row.yearly_fill_rates)
      .map(([year, rate]) => ({ year: Number(String(year).slice(0, 4)), rate: Number(rate) }))
      .filter(item => Number.isInteger(item.year) && item.year >= 1980 && item.year <= 2024 && Number.isFinite(item.rate) && item.rate >= 0 && item.rate <= 100)
      .sort((a, b) => a.year - b.year).slice(-8);
    if (!entries.length) return;
    const fractional = entries.every(item => item.rate <= 1);
    const chart = document.createElement('div');
    chart.className = 'hs-hunt-history';
    const heading = document.createElement('div');
    heading.className = 'hs-hunt-history-heading';
    heading.textContent = 'Reported harvest success by year';
    const bars = document.createElement('div');
    bars.className = 'hs-hunt-history-bars';
    entries.forEach(item => {
      const pct = Math.max(0, Math.min(100, item.rate * (fractional ? 100 : 1)));
      const column = document.createElement('div');
      column.className = 'hs-hunt-history-year';
      column.setAttribute('aria-label', item.year + ': ' + Math.round(pct) + '% harvest success');
      column.title = item.year + ': ' + Math.round(pct) + '% harvest success';
      const track = document.createElement('div');
      track.className = 'hs-hunt-history-track';
      const bar = document.createElement('div');
      bar.className = 'hs-hunt-history-fill';
      bar.style.height = String(Math.max(pct, pct === 0 ? 2 : 5)) + '%';
      track.appendChild(bar);
      const yr = document.createElement('span');
      yr.textContent = String(item.year).slice(-2);
      column.append(track, yr);
      bars.appendChild(column);
    });
    chart.append(heading, bars);
    panel.appendChild(chart);
  }

  function enhanceHuntCard(card, index) {
    if (card.dataset.hsHuntEnhanced === 'true') return;
    const top = card.querySelector('.fm-card-top');
    const bottom = card.querySelector('.fm-card-bottom');
    if (!top || !bottom) return;

    card.dataset.hsHuntEnhanced = 'true';
    card.classList.add('hs-hunt-refined');
    const action = card.getAttribute('onclick') || '';
    const originalClick = card.onclick;
    card.onclick = null;
    card.removeAttribute('onclick');
    card.style.cursor = 'default';

    const species = card.querySelector('.fm-card-species');
    const meta = card.querySelector('.fm-card-meta');
    const metric = card.querySelector('.fm-card-odds');
    const success = card.querySelector('.fm-card-success');
    const oddsText = metric ? metric.textContent.trim() : 'Not available';
    const successText = success ? success.textContent.trim() : 'No success data';
    const detailsId = 'hsHuntInfo' + index;

    if (metric) {
      const oddsWrap = document.createElement('div');
      oddsWrap.className = 'hs-hunt-card-odds';
      const label = document.createElement('span');
      label.className = 'hs-hunt-odds-label';
      label.textContent = 'DRAW ODDS';
      metric.parentNode.insertBefore(oddsWrap, metric);
      oddsWrap.append(label, metric);
    }
    if (success) {
      const value = successText.replace(/\s+success$/i, '');
      success.textContent = 'Harvest success: ' + (/no success data/i.test(successText) ? 'Unavailable' : value);
    }
    const expander = document.createElement('span');
    expander.className = 'hs-hunt-expand-hint';
    expander.innerHTML = '<span>Details</span><span class="hs-hunt-expand-plus" aria-hidden="true">+</span>';
    bottom.appendChild(expander);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'hs-hunt-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', detailsId);
    toggle.setAttribute('aria-label', 'Expand ' + (species ? species.textContent.trim() : 'hunt') + ' draw details');
    toggle.append(top, bottom);

    const details = document.createElement('div');
    details.className = 'hs-hunt-card-details';
    details.id = detailsId;
    details.hidden = true;
    const facts = document.createElement('div');
    facts.className = 'hs-hunt-facts';
    facts.append(
      huntMeta('Draw odds', oddsText),
      huntMeta('Harvest success', /no success data/i.test(successText) ? 'Unavailable' : successText.replace(/\s+success$/i, ''))
    );
    const match = action.match(/open(?:BC|AB)DrawDetailFromMap\('([^']*)','([^']*)'\)/);
    if (match) facts.append(huntMeta('Draw code', match[1]));
    if (meta) facts.append(huntMeta('Hunt', meta.textContent.trim()));
    details.appendChild(facts);
    renderHuntHistory(details, action);

    const explanation = document.createElement('p');
    explanation.className = 'hs-hunt-metric-note';
    explanation.textContent = 'Draw odds estimate the chance of receiving a permit. Harvest success measures a different outcome; unavailable data is not zero success.';
    details.appendChild(explanation);
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'hs-hunt-open-draw';
    open.textContent = 'View full draw details';
    open.setAttribute('aria-label', 'Open full draw details for ' + (species ? species.textContent.trim() : 'this hunt'));
    open.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof originalClick === 'function') originalClick.call(card, event);
      else if (match) {
        const handlerName = action.match(/(open(?:BC|AB)DrawDetailFromMap)/);
        const handler = handlerName && window[handlerName[1]];
        if (typeof handler === 'function') handler(match[1], match[2]);
      }
    });
    details.appendChild(open);
    toggle.addEventListener('click', function () {
      const expanded = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(expanded));
      toggle.setAttribute('aria-label', (expanded ? 'Collapse ' : 'Expand ') + (species ? species.textContent.trim() : 'hunt') + ' draw details');
      details.hidden = !expanded;
      card.classList.toggle('hs-expanded', expanded);
    });
    card.append(toggle, details);
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

  // Three mobile sheet heights: compact map peek, medium results, full results.
  function installMobileSheetSizing() {
    const d = drawer();
    if (!d || d.dataset.hsSheetSizingReady === 'true') return;
    d.dataset.hsSheetSizingReady = 'true';
    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'hs-sheet-size-handle';
    handle.setAttribute('aria-label', 'Expand selected-unit results');
    handle.setAttribute('title', 'Expand or collapse results');
    d.insertBefore(handle, d.firstChild);

    function stage() {
      if (d.classList.contains('is-collapsed')) return 0;
      if (d.classList.contains('is-maximized')) return 2;
      return 1;
    }
    function changeStage(next) {
      if (!isMobile() || !resultsVisible()) return;
      d.classList.toggle('is-collapsed', next === 0);
      d.classList.toggle('is-maximized', next === 2);
      handle.setAttribute('aria-label', next === 0 ? 'Expand selected-unit results' : next === 1 ? 'Show more selected-unit results' : 'Reduce selected-unit results');
      syncDrawerState();
    }
    handle.addEventListener('click', function () {
      const current = stage();
      changeStage(current === 0 ? 1 : current === 1 ? 2 : 1);
    });

    const header = d.querySelector('.fullmap-results-header');
    if (header) {
      let startY = null;
      header.addEventListener('touchstart', function (event) {
        if (event.touches.length !== 1) return;
        startY = event.touches[0].clientY;
      }, { passive: true });
      header.addEventListener('touchend', function (event) {
        if (startY === null || !event.changedTouches.length) return;
        const delta = event.changedTouches[0].clientY - startY;
        startY = null;
        if (Math.abs(delta) < 44) return;
        changeStage(Math.max(0, Math.min(2, stage() + (delta < 0 ? 1 : -1))));
      }, { passive: true });
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
    drawerObserver = new MutationObserver(function (mutations) {
      if (!mutations.some(function (mutation) { return mutation.type === 'attributes'; })) return;
      syncDrawerState();
    });
    drawerObserver.observe(d, {
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  }

  function refreshShell() {
    injectStyles();
    updateToolbar();
    installWrappers();
    observeDrawer();
    installMobileSheetSizing();
    syncDrawerState();
  }

  function install() {
    refreshShell();
    setTimeout(refreshShell, 200);
    setTimeout(refreshShell, 700);
    window.addEventListener('resize', function () { setTimeout(syncDrawerState, 0); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();