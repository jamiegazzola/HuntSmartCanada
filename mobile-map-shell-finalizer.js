/* HuntSmart mobile map shell finalizer.
   Runs after the legacy map controllers and keeps one compact top control row,
   one utility rail, and one + / - / 3D stack on mobile. */
(function () {
  'use strict';

  if (window.__HUNTSMART_MOBILE_MAP_SHELL_FINALIZER__) return;
  window.__HUNTSMART_MOBILE_MAP_SHELL_FINALIZER__ = true;

  const STYLE_ID = 'hsMobileMapShellFinalizerStyles';
  const MOBILE_QUERY = '(max-width: 768px)';

  function isMobile() {
    return !!(window.matchMedia && window.matchMedia(MOBILE_QUERY).matches);
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
@media (max-width: 768px) {
  /* Kill the duplicated desktop/native controls after every earlier map stylesheet. */
  body #mapPage .fullmap-topbar,
  body #mapPage #fullMapControlStack,
  body #bcOpenSeasonsPage #osMapControlStack,
  body #mapPage #hsTopbar,
  body #bcOpenSeasonsPage #gosTopbarMobile {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }

  /* Layers lives in the shared top row now, so the right-side utility rail is unique actions only. */
  body #mapPage #hsRbLayers,
  body #bcOpenSeasonsPage #gosRbLayers {
    display: none !important;
  }

  #mapPage > .hs-im-shellbar,
  #bcOpenSeasonsPage > .hs-im-shellbar {
    left: 6px !important;
    right: 6px !important;
    width: auto !important;
    max-width: none !important;
    overflow: visible !important;
  }

  #mapPage > .hs-im-shellbar .hs-im-controls,
  #bcOpenSeasonsPage > .hs-im-shellbar .hs-im-controls {
    width: 100% !important;
    min-width: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    flex-wrap: nowrap !important;
    gap: 4px !important;
    overflow: visible !important;
  }

  #mapPage > .hs-im-shellbar .hs-im-seg,
  #bcOpenSeasonsPage > .hs-im-shellbar .hs-im-seg {
    flex: 0 0 auto !important;
    min-height: 46px !important;
    height: 46px !important;
    padding: 1px !important;
    gap: 1px !important;
  }

  #mapPage > .hs-im-shellbar [data-hs-im-province],
  #bcOpenSeasonsPage > .hs-im-shellbar [data-hs-im-province] {
    box-sizing: border-box !important;
    width: 40px !important;
    min-width: 40px !important;
    max-width: 40px !important;
    height: 44px !important;
    min-height: 44px !important;
    padding: 0 !important;
  }

  #mapPage > .hs-im-shellbar [data-hs-im-mode="leh"],
  #mapPage > .hs-im-shellbar [data-hs-im-mode="gos"],
  #bcOpenSeasonsPage > .hs-im-shellbar [data-hs-im-mode="leh"],
  #bcOpenSeasonsPage > .hs-im-shellbar [data-hs-im-mode="gos"] {
    width: 46px !important;
    min-width: 46px !important;
    max-width: 46px !important;
    height: 44px !important;
    min-height: 44px !important;
    padding: 0 !important;
  }

  #mapPage > .hs-im-shellbar .hs-im-guide-btn,
  #bcOpenSeasonsPage > .hs-im-shellbar .hs-im-guide-btn,
  #mapPage > .hs-im-shellbar .hs-premium-mobile-layers,
  #bcOpenSeasonsPage > .hs-im-shellbar .hs-premium-mobile-layers {
    box-sizing: border-box !important;
    flex: 0 0 44px !important;
    width: 44px !important;
    min-width: 44px !important;
    max-width: 44px !important;
    height: 46px !important;
    min-height: 46px !important;
    padding: 0 !important;
    border: 1px solid rgba(255,255,255,.11) !important;
    border-radius: 11px !important;
    background: rgba(12,16,14,.86) !important;
    color: rgba(236,241,237,.78) !important;
    box-shadow: 0 8px 22px rgba(0,0,0,.20) !important;
    font-size: 9px !important;
    font-weight: 700 !important;
    line-height: 1 !important;
    white-space: nowrap !important;
  }

  #mapPage > .hs-im-shellbar .hs-premium-species-top,
  #bcOpenSeasonsPage > .hs-im-shellbar .hs-premium-species-top {
    box-sizing: border-box !important;
    flex: 0 1 76px !important;
    width: 76px !important;
    min-width: 68px !important;
    max-width: 76px !important;
    height: 46px !important;
    min-height: 46px !important;
    margin: 0 !important;
    padding: 0 8px !important;
    border: 1px solid rgba(255,255,255,.11) !important;
    border-radius: 11px !important;
    background: rgba(12,16,14,.86) !important;
    color: rgba(236,241,237,.86) !important;
    box-shadow: 0 8px 22px rgba(0,0,0,.20) !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 4px !important;
    font-size: 9.5px !important;
    font-weight: 700 !important;
    line-height: 1 !important;
    overflow: hidden !important;
    white-space: nowrap !important;
    text-overflow: ellipsis !important;
  }

  #mapPage > .hs-im-shellbar .hs-premium-species-top > span:first-child,
  #bcOpenSeasonsPage > .hs-im-shellbar .hs-premium-species-top > span:first-child {
    min-width: 0 !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }

  #mapPage > .hs-im-shellbar .hs-premium-species-top .hs-tp-arr,
  #bcOpenSeasonsPage > .hs-im-shellbar .hs-premium-species-top .hs-tp-arr {
    flex: 0 0 auto !important;
    font-size: 8px !important;
    opacity: .62 !important;
  }

  /* With Layers moved up, keep Search + Cards as the only map-side utility actions. */
  #mapPage .hs-rail,
  #bcOpenSeasonsPage .hs-rail {
    top: 64px !important;
  }

  #mapPage .hs-rail .hs-rb,
  #bcOpenSeasonsPage .hs-rail .hs-rb {
    width: 44px !important;
    min-width: 44px !important;
    max-width: 44px !important;
    height: 44px !important;
    min-height: 44px !important;
    max-height: 44px !important;
    flex: 0 0 44px !important;
  }
}

@media (max-width: 360px) {
  #mapPage > .hs-im-shellbar,
  #bcOpenSeasonsPage > .hs-im-shellbar {
    left: 4px !important;
    right: 4px !important;
  }

  #mapPage > .hs-im-shellbar .hs-im-controls,
  #bcOpenSeasonsPage > .hs-im-shellbar .hs-im-controls {
    gap: 2px !important;
  }

  #mapPage > .hs-im-shellbar .hs-premium-species-top,
  #bcOpenSeasonsPage > .hs-im-shellbar .hs-premium-species-top {
    flex-basis: 66px !important;
    width: 66px !important;
    min-width: 62px !important;
    max-width: 66px !important;
    padding-left: 5px !important;
    padding-right: 5px !important;
  }

  #mapPage > .hs-im-shellbar [data-hs-im-province],
  #bcOpenSeasonsPage > .hs-im-shellbar [data-hs-im-province] {
    width: 34px !important;
    min-width: 34px !important;
    max-width: 34px !important;
  }

  #mapPage > .hs-im-shellbar [data-hs-im-mode="leh"],
  #mapPage > .hs-im-shellbar [data-hs-im-mode="gos"],
  #bcOpenSeasonsPage > .hs-im-shellbar [data-hs-im-mode="leh"],
  #bcOpenSeasonsPage > .hs-im-shellbar [data-hs-im-mode="gos"] {
    width: 40px !important;
    min-width: 40px !important;
    max-width: 40px !important;
  }

  #mapPage > .hs-im-shellbar .hs-premium-mobile-layers,
  #bcOpenSeasonsPage > .hs-im-shellbar .hs-premium-mobile-layers {
    flex-basis: 40px !important;
    width: 40px !important;
    min-width: 40px !important;
    max-width: 40px !important;
  }

  /* Keep the map row single-line on 320–360px screens; Guide remains available on larger phones. */
  #mapPage > .hs-im-shellbar .hs-im-guide-btn,
  #bcOpenSeasonsPage > .hs-im-shellbar .hs-im-guide-btn {
    display: none !important;
  }
}
`;
    document.head.appendChild(style);
  }

  function moveControlIntoShell(surface, speciesId, legacyTopbarId, layersId, openLayers) {
    const root = document.getElementById(surface);
    const shell = root && root.querySelector(':scope > .hs-im-shellbar');
    const controls = shell && shell.querySelector('.hs-im-controls');
    if (!controls) return;

    const species = document.getElementById(speciesId);
    if (species) {
      species.classList.add('hs-premium-species-top');
      if (species.parentElement !== controls) controls.insertBefore(species, controls.firstChild);
    }

    let layers = document.getElementById(layersId);
    if (!layers) {
      layers = document.createElement('button');
      layers.type = 'button';
      layers.id = layersId;
      layers.className = 'hs-premium-mobile-layers';
      layers.textContent = 'Layers';
      layers.setAttribute('aria-label', 'Map layers');
      layers.addEventListener('click', function () {
        try { openLayers(); } catch (_) {}
      });
    }
    const guide = controls.querySelector('.hs-im-guide-btn');
    if (layers.parentElement !== controls) controls.insertBefore(layers, guide || null);

    const oldTop = document.getElementById(legacyTopbarId);
    if (oldTop) oldTop.style.setProperty('display', 'none', 'important');
  }

  function finalizeMobileShell() {
    injectStyles();
    if (!isMobile()) return;

    moveControlIntoShell(
      'mapPage',
      'hsSpeciesBtn',
      'hsTopbar',
      'hsPremiumMobileLayers',
      function () { if (typeof window.hsOpenModal === 'function') window.hsOpenModal('layers'); }
    );

    moveControlIntoShell(
      'bcOpenSeasonsPage',
      'gosSpeciesBtn',
      'gosTopbarMobile',
      'gosPremiumMobileLayers',
      function () { if (typeof window.gosOpenModal === 'function') window.gosOpenModal('layers'); }
    );
  }

  function scheduleFinalization() {
    [0, 150, 450, 900, 1600].forEach(function (delay) { setTimeout(finalizeMobileShell, delay); });
  }

  function boot() {
    scheduleFinalization();
    document.addEventListener('click', function (event) {
      const target = event.target && event.target.closest
        ? event.target.closest('#hsMobileTabbar [data-tab="map"], [data-hs-im-mode]')
        : null;
      if (target) scheduleFinalization();
    }, true);
    window.addEventListener('resize', function () { setTimeout(finalizeMobileShell, 0); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();