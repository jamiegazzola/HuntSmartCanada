/* HuntSmart desktop Layers control stability fix.
   Safe, bounded restore only — no self-triggering DOM observer. */
(function () {
  'use strict';

  if (window.__HUNTSMART_LAYERS_CONTROL_FIX_V2__) return;
  window.__HUNTSMART_LAYERS_CONTROL_FIX_V2__ = true;

  function isDesktop() {
    return !window.matchMedia || !window.matchMedia('(max-width: 768px)').matches;
  }

  function refreshLayersControl() {
    if (!isDesktop()) return;

    var toolbar = document.querySelector('#mapPage .fullmap-toolbar-main');
    if (!toolbar) return;

    var button = document.getElementById('hsWorldSettingsBtn');

    // The production map finalizer already owns the Layers panel and its actions.
    // If its button exists, only normalize presentation; never replace its DOM.
    if (button) {
      button.style.setProperty('display', 'inline-flex', 'important');
      button.style.setProperty('align-items', 'center', 'important');
      button.style.setProperty('justify-content', 'center', 'important');
      button.style.setProperty('gap', '7px', 'important');
      button.style.setProperty('min-width', '78px', 'important');
      button.style.setProperty('height', '40px', 'important');
      button.style.setProperty('padding', '0 12px', 'important');
      var label = button.querySelector('span');
      if (label) label.textContent = 'Layers';
      button.title = 'Basemap, terrain and overlay visibility';
      button.setAttribute('aria-label', 'Basemap, terrain and overlay visibility');
      return;
    }

    // If a later shell removed the button, create one that delegates to the
    // existing production fallback panel instead of duplicating map logic.
    button = document.createElement('button');
    button.type = 'button';
    button.id = 'hsWorldSettingsBtn';
    button.className = 'hs-wc-settings-btn';
    button.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="13" cy="18" r="2"/></svg><span>Layers</span>';
    button.title = 'Basemap, terrain and overlay visibility';
    button.setAttribute('aria-label', 'Basemap, terrain and overlay visibility');
    button.style.setProperty('display', 'inline-flex', 'important');

    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();

      var panel = document.getElementById('hsWorldSettingsPanel');
      if (!panel) {
        // Let the existing finalizer create the panel on its next bounded refresh.
        return;
      }

      var opening = !panel.classList.contains('open');
      if (!opening) {
        if (typeof window.hsFallbackCloseLayers === 'function') window.hsFallbackCloseLayers();
        else panel.classList.remove('open');
        return;
      }

      panel.classList.add('open');
      button.classList.add('is-open');
      button.setAttribute('aria-expanded', 'true');
    });

    var species = document.getElementById('fullMapSpeciesSelect');
    if (species && species.parentElement === toolbar) species.insertAdjacentElement('afterend', button);
    else toolbar.appendChild(button);
  }

  function run() {
    try { refreshLayersControl(); } catch (err) { console.warn('[HuntSmart] Layers control refresh failed', err); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  // Bounded retries cover delayed map-shell initialization without observing
  // every DOM mutation or creating a feedback loop.
  [150, 500, 1200, 2500].forEach(function (delay) { setTimeout(run, delay); });
  window.addEventListener('resize', run, { passive: true });
})();
