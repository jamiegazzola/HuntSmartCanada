/* HuntSmart Canada — PWA + live mobile map viewport shell. */
(function () {
  'use strict';
  if (window.__HUNTSMART_PWA_SHELL__) return;

  var VERSION = '2026-10-28-pwa-v1';
  var mobileMq = window.matchMedia('(max-width: 980px)');
  var standaloneMq = window.matchMedia('(display-mode: standalone)');
  var installPrompt = null;
  var scheduled = 0;
  var lastMapSurface = '';

  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    var s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && el.getClientRects().length > 0;
  }

  function isStandalone() {
    return !!(standaloneMq.matches || window.navigator.standalone === true);
  }

  function activeMapPage() {
    var leh = document.getElementById('mapPage');
    if (isVisible(leh)) return leh;
    var gos = document.getElementById('bcOpenSeasonsPage');
    if (isVisible(gos)) return gos;
    return null;
  }

  function visibleNav() {
    var mobileTabs = document.getElementById('hsMobileTabbar');
    if (isVisible(mobileTabs)) return mobileTabs;
    var navs = Array.from(document.querySelectorAll('nav'));
    return navs.find(isVisible) || null;
  }

  function resizeMapInstances() {
    ['fullMapInstance', 'osMapInstance', 'bcMapInstance', 'abMapInstance'].forEach(function (name) {
      try {
        var map = window[name];
        if (map && typeof map.resize === 'function') map.resize();
        else if (map && typeof map.invalidateSize === 'function') map.invalidateSize(false);
      } catch (_) {}
    });
  }

  function refinalizeMapShell() {
    [0, 150, 450, 900, 1600].forEach(function (delay) {
      setTimeout(function () {
        try { window.dispatchEvent(new Event('resize')); } catch (_) {}
      }, delay);
    });
  }

  function syncShell() {
    scheduled = 0;
    var root = document.documentElement;
    var body = document.body;
    if (!root || !body) return;

    var vv = window.visualViewport;
    var visualH = Math.round(vv && vv.height ? vv.height : window.innerHeight);
    var visualW = Math.round(vv && vv.width ? vv.width : window.innerWidth);
    root.style.setProperty('--hs-visual-vh', visualH + 'px');
    root.style.setProperty('--hs-visual-vw', visualW + 'px');

    var standalone = isStandalone();
    root.classList.toggle('hs-standalone', standalone);
    body.classList.toggle('hs-standalone', standalone);

    var mapPage = mobileMq.matches ? activeMapPage() : null;
    var mapActive = !!mapPage;
    var mapSurface = mapPage ? mapPage.id : '';
    body.classList.toggle('hs-mobile-map-active', mapActive);

    var nav = mobileMq.matches ? visibleNav() : null;
    var navH = nav ? Math.max(0, Math.round(nav.getBoundingClientRect().height)) : 0;
    root.style.setProperty('--hs-live-nav-h', navH + 'px');
    root.style.setProperty('--hs-map-page-h', Math.max(320, visualH - navH) + 'px');

    if (mapActive) {
      requestAnimationFrame(resizeMapInstances);
      setTimeout(resizeMapInstances, 120);
    }

    if (mapSurface && mapSurface !== lastMapSurface) refinalizeMapShell();
    lastMapSurface = mapSurface;

    syncInstallButton();
  }

  function scheduleSync() {
    if (scheduled) return;
    scheduled = requestAnimationFrame(syncShell);
  }

  function scheduleNavigationSync() {
    [0, 60, 180, 450, 900].forEach(function (delay) {
      setTimeout(scheduleSync, delay);
    });
  }

  function closeInstallSheet() {
    var existing = document.getElementById('hsInstallSheetBackdrop');
    if (existing) existing.remove();
  }

  function showInstallSheet() {
    closeInstallSheet();
    var ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var backdrop = document.createElement('div');
    backdrop.id = 'hsInstallSheetBackdrop';
    backdrop.className = 'hs-install-sheet-backdrop';
    backdrop.setAttribute('role', 'presentation');

    var sheet = document.createElement('div');
    sheet.className = 'hs-install-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-labelledby', 'hsInstallSheetTitle');

    var steps = ios
      ? '<ol><li>Tap the Share button in Safari.</li><li>Choose <strong>Add to Home Screen</strong>.</li><li>Tap <strong>Add</strong>. Open HuntSmart from the new Home Screen icon.</li></ol>'
      : '<ol><li>Open your browser menu.</li><li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li><li>Open HuntSmart from the installed icon for the full-screen app layout.</li></ol>';

    sheet.innerHTML = '<h2 id="hsInstallSheetTitle">Install HuntSmart</h2>' +
      '<p>The installed app removes normal browser chrome and gives the map substantially more screen space.</p>' +
      steps +
      '<button type="button" class="hs-install-sheet-close">Got it</button>';

    sheet.querySelector('.hs-install-sheet-close').addEventListener('click', closeInstallSheet);
    backdrop.addEventListener('click', function (event) {
      if (event.target === backdrop) closeInstallSheet();
    });
    document.addEventListener('keydown', function onKey(event) {
      if (event.key === 'Escape') {
        closeInstallSheet();
        document.removeEventListener('keydown', onKey);
      }
    });
    backdrop.appendChild(sheet);
    document.body.appendChild(backdrop);
  }

  function installApp() {
    if (installPrompt) {
      var prompt = installPrompt;
      installPrompt = null;
      prompt.prompt();
      prompt.userChoice.finally(function () { syncInstallButton(); });
      return;
    }
    showInstallSheet();
  }

  function syncInstallButton() {
    if (!document.body || !mobileMq.matches || isStandalone()) {
      var old = document.getElementById('hsInstallAppBtn');
      if (old) old.remove();
      return;
    }

    var menu = document.getElementById('navMobileMenu') || document.querySelector('.nav-mobile-menu');
    if (!menu || document.getElementById('hsInstallAppBtn')) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'hsInstallAppBtn';
    btn.className = 'nav-link hs-install-app-btn';
    btn.textContent = 'Install HuntSmart';
    btn.setAttribute('aria-label', 'Install HuntSmart as an app');
    btn.addEventListener('click', installApp);
    menu.appendChild(btn);
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || location.protocol !== 'https:') return;
    navigator.serviceWorker.register('/hs-offline-lite-sw.js', { scope: '/' }).catch(function () {});
  }

  function boot() {
    syncShell();
    registerServiceWorker();

    var observer = new MutationObserver(scheduleSync);
    ['mapPage', 'bcOpenSeasonsPage', 'hsMobileTabbar', 'navMobileMenu'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) observer.observe(el, { attributes: true, attributeFilter: ['class', 'style'], childList: true, subtree: id === 'navMobileMenu' });
    });

    document.addEventListener('click', function (event) {
      var target = event.target && event.target.closest
        ? event.target.closest('#hsMobileTabbar [data-tab="map"], [data-hs-im-mode]')
        : null;
      if (target) scheduleNavigationSync();
    }, true);

    window.addEventListener('resize', scheduleSync, { passive: true });
    window.addEventListener('orientationchange', function () { setTimeout(scheduleSync, 80); });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', scheduleSync, { passive: true });
      window.visualViewport.addEventListener('scroll', scheduleSync, { passive: true });
    }
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    installPrompt = event;
    syncInstallButton();
  });
  window.addEventListener('appinstalled', function () {
    installPrompt = null;
    closeInstallSheet();
    scheduleSync();
  });

  if (standaloneMq.addEventListener) standaloneMq.addEventListener('change', scheduleSync);
  if (mobileMq.addEventListener) mobileMq.addEventListener('change', scheduleSync);

  window.__HUNTSMART_PWA_SHELL__ = {
    version: VERSION,
    sync: syncShell,
    isStandalone: isStandalone
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();