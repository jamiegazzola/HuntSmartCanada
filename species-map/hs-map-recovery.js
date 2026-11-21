/* Species map recovery: make load failures actionable without retry storms.
   Private wildlife records stay private and are never sent to analytics. */
(function () {
  'use strict';
  if (window.__HS_SPECIES_RECOVERY__) return;
  window.__HS_SPECIES_RECOVERY__ = true;

  function boot() {
    var map = document.getElementById('map');
    var control = document.querySelector('.species-control');
    var select = document.getElementById('species');
    if (!map || !control || !select) return;

    var notice = document.createElement('aside');
    notice.className = 'hs-species-recovery';
    notice.hidden = true;
    notice.setAttribute('role', 'alert');
    notice.setAttribute('aria-live', 'assertive');
    var label = document.createElement('span');
    var retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Retry';
    notice.append(label, retry);
    document.body.appendChild(notice);

    var mapReady = false;
    var layerTimer = 0;
    var mapTimer = 0;
    var lastReason = null;
    function hide() { notice.hidden = true; lastReason = null; }
    function show(reason) {
      lastReason = reason;
      label.textContent = reason === 'map'
        ? 'The map did not finish loading.'
        : 'This species layer is taking too long to load.';
      notice.hidden = false;
    }
    function hasMap() {
      return !!map.querySelector('.gm-style');
    }
    function detectMap() {
      if (mapReady || !hasMap()) return;
      mapReady = true;
      clearTimeout(mapTimer);
      if (lastReason === 'map') hide();
      checkLayer();
    }
    function checkLayer() {
      clearTimeout(layerTimer);
      if (!mapReady) return;
      if (!control.classList.contains('loading')) {
        if (lastReason === 'layer') hide();
        return;
      }
      layerTimer = setTimeout(function () {
        if (control.classList.contains('loading') && hasMap()) show('layer');
      }, 16000);
    }

    retry.addEventListener('click', function () {
      var reason = lastReason;
      hide();
      if (reason === 'layer' && hasMap()) {
        select.dispatchEvent(new Event('change', { bubbles: true }));
        checkLayer();
        return;
      }
      // Manual retry only, so bad connections never loop indefinitely.
      var address = new URL(location.href);
      address.searchParams.set('retry', String(Date.now()));
      location.replace(address.pathname + address.search + address.hash);
    });

    var onMap = new MutationObserver(detectMap);
    onMap.observe(map, { childList: true });
    var onLayer = new MutationObserver(checkLayer);
    onLayer.observe(control, { attributes: true, attributeFilter: ['class'] });
    mapTimer = setTimeout(function () {
      if (!mapReady && !hasMap()) show('map');
    }, 13000);
    detectMap();

    // If Google's script reports a visible error after initialization,
    // keep it readable instead of replacing it with a generic failure.
    var error = document.getElementById('error');
    if (error) {
      new MutationObserver(function () {
        if (!error.classList.contains('show') || !error.textContent.trim()) return;
        if (/google maps|configuration|authorization|could not load|failed to load/i.test(error.textContent)) {
          mapReady = false;
          clearTimeout(mapTimer);
          mapTimer = setTimeout(function () { if (!hasMap()) show('map'); }, 1800);
        }
      }).observe(error, { attributes: true, attributeFilter: ['class'] });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();