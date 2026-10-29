/* HuntSmart Canada — responsive product system runtime.
   Keeps mobile behaviour adaptive without forking desktop application logic. */
(function () {
  'use strict';
  if (window.__HUNTSMART_MOBILE_SYSTEM__) return;

  var VERSION = '2026-10-29-mobile-v2';
  var mobileMq = window.matchMedia('(max-width: 980px)');
  var compactMq = window.matchMedia('(max-width: 420px)');
  var coarseMq = window.matchMedia('(pointer: coarse)');
  var raf = 0;
  var uiObserver = null;

  window.__HUNTSMART_MOBILE_SYSTEM__ = {
    version: VERSION,
    isMobile: function () { return mobileMq.matches; }
  };

  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    var s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && el.getClientRects().length > 0;
  }

  function normalizeViewportMeta() {
    var meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    var next = 'width=device-width, initial-scale=1, viewport-fit=cover';
    if (meta.getAttribute('content') !== next) meta.setAttribute('content', next);
  }

  function setViewportVars() {
    var vv = window.visualViewport;
    var h = vv ? vv.height : window.innerHeight;
    var w = vv ? vv.width : window.innerWidth;
    document.documentElement.style.setProperty('--hs-visual-vh', h + 'px');
    document.documentElement.style.setProperty('--hs-visual-vw', w + 'px');
  }

  function syncModeClasses() {
    if (!document.body) return;
    document.body.classList.toggle('hs-mobile', mobileMq.matches);
    document.body.classList.toggle('hs-compact-mobile', compactMq.matches);
    document.body.classList.toggle('hs-touch', coarseMq.matches);
    document.documentElement.dataset.hsViewport = mobileMq.matches ? (compactMq.matches ? 'compact' : 'mobile') : 'desktop';
    document.body.dataset.hsMobileSystem = VERSION;
    setViewportVars();
  }

  function closeMobileNav() {
    var menu = document.getElementById('navMobileMenu');
    var hamburger = document.getElementById('navHamburger');
    if (menu) menu.classList.remove('open');
    if (hamburger) {
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  }

  function syncMobileNavA11y() {
    var menu = document.getElementById('navMobileMenu');
    var hamburger = document.getElementById('navHamburger');
    if (!menu || !hamburger) return;
    hamburger.setAttribute('aria-controls', 'navMobileMenu');
    hamburger.setAttribute('aria-haspopup', 'true');
    hamburger.setAttribute('aria-expanded', menu.classList.contains('open') ? 'true' : 'false');
  }

  function countActiveFilters(inner) {
    if (!inner) return 0;
    var count = 0;
    inner.querySelectorAll('.chip.active, .fp-chip.active, .map-chip.active').forEach(function (el) {
      var text = (el.textContent || '').trim().toLowerCase();
      if (!/^(all|all draws|any|all species)$/.test(text)) count += 1;
    });
    inner.querySelectorAll('input[type="range"]').forEach(function (el) {
      var min = el.min === '' ? '0' : String(el.min);
      if (String(el.value) !== min) count += 1;
    });
    inner.querySelectorAll('input[type="date"]').forEach(function (el) {
      if (el.value) count += 1;
    });
    inner.querySelectorAll('select').forEach(function (el) {
      if (el.value) count += 1;
    });
    return count;
  }

  function wireFilterSheet(pageId, innerId, toggleId, toggleFunctionName) {
    var page = document.getElementById(pageId);
    var inner = document.getElementById(innerId);
    var toggle = document.getElementById(toggleId);
    if (!page || !inner || !toggle || page.dataset.hsMobileSheetWired === '1') return;
    page.dataset.hsMobileSheetWired = '1';

    var backdrop = document.createElement('div');
    backdrop.className = 'hs-mobile-filter-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    page.appendChild(backdrop);

    inner.setAttribute('role', 'dialog');
    inner.setAttribute('aria-modal', 'true');
    inner.setAttribute('aria-label', 'Hunt filters');
    toggle.setAttribute('role', 'button');
    toggle.setAttribute('tabindex', '0');
    toggle.setAttribute('aria-controls', innerId);

    function invokeToggle() {
      var fn = window[toggleFunctionName];
      if (typeof fn === 'function') fn();
      else inner.classList.toggle('open');
      requestAnimationFrame(sync);
    }

    function sync() {
      var open = mobileMq.matches && inner.classList.contains('open');
      backdrop.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (document.body) document.body.classList.toggle('hs-mobile-filter-open', open || document.querySelector('.hs-mobile-filter-backdrop.open'));
      var label = toggle.querySelector('span:first-child');
      if (label) {
        var active = countActiveFilters(inner);
        label.textContent = active ? ('Filters · ' + active) : 'Filters';
      }
    }

    backdrop.addEventListener('click', function () {
      if (inner.classList.contains('open')) invokeToggle();
    });
    toggle.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        invokeToggle();
      }
    });

    new MutationObserver(sync).observe(inner, { attributes: true, attributeFilter: ['class', 'style'], childList: true, subtree: true });
    inner.addEventListener('change', sync, true);
    inner.addEventListener('click', function () { setTimeout(sync, 0); }, true);
    sync();
  }

  function syncOverlayLock() {
    if (!document.body || !mobileMq.matches) {
      if (document.body) document.body.classList.remove('hs-mobile-modal-open');
      return;
    }
    var auth = document.querySelector('.auth-modal-overlay');
    var paywall = document.getElementById('hs-paywall');
    var loading = document.getElementById('hs-loading');
    var scrim = Array.from(document.querySelectorAll('.hs-scrim')).some(isVisible);
    var modalOpen = isVisible(auth) || (paywall && paywall.classList.contains('hs-visible')) || isVisible(loading) || scrim;
    document.body.classList.toggle('hs-mobile-modal-open', !!modalOpen);
  }

  function tuneMapPanels() {
    var results = document.getElementById('fullMapResultsDrawer');
    var gosPanel = document.querySelector('#bcOpenSeasonsPage .os-panel');
    if (results) {
      results.setAttribute('role', 'region');
      results.setAttribute('aria-label', 'Selected hunt results');
    }
    if (gosPanel) {
      gosPanel.setAttribute('role', 'region');
      gosPanel.setAttribute('aria-label', 'General open season results');
    }
  }

  function resizeMaps() {
    if (!mobileMq.matches) return;
    window.dispatchEvent(new Event('resize'));
    ['fullMapInstance', 'osMapInstance', 'bcMapInstance', 'abMapInstance'].forEach(function (name) {
      try {
        var map = window[name];
        if (map && typeof map.resize === 'function') map.resize();
        else if (map && typeof map.invalidateSize === 'function') map.invalidateSize(false);
      } catch (_) {}
    });
  }

  function scheduleResizeMaps() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function () {
      setViewportVars();
      resizeMaps();
    });
  }

  function keepFocusedFieldVisible(event) {
    if (!mobileMq.matches) return;
    var target = event.target;
    if (!target || !/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
    setTimeout(function () {
      var vv = window.visualViewport;
      if (!vv || vv.height < window.innerHeight - 100) {
        try { target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' }); } catch (_) {}
      }
    }, 220);
  }

  function wireGlobalInteractions() {
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      closeMobileNav();
      var openSheet = document.querySelector('#drawsPage .sidebar-inner.open, #abDrawsPage .sidebar-inner.open');
      if (openSheet) {
        if (openSheet.id === 'sidebarInner' && typeof window.toggleSidebar === 'function') window.toggleSidebar();
        if (openSheet.id === 'abSidebarInner' && typeof window.toggleAbSidebar === 'function') window.toggleAbSidebar();
      }
    });

    document.addEventListener('focusin', keepFocusedFieldVisible, true);
    document.addEventListener('click', function (event) {
      if (!mobileMq.matches) return;
      if (event.target.closest('.nav-mobile-menu .nav-link')) closeMobileNav();
      setTimeout(function () {
        syncMobileNavA11y();
        syncOverlayLock();
      }, 0);
    }, true);
  }

  function observeUiState() {
    if (uiObserver) {
      uiObserver.disconnect();
      uiObserver = null;
    }
    if (!mobileMq.matches) return;

    uiObserver = new MutationObserver(function () {
      syncMobileNavA11y();
      syncOverlayLock();
      tuneMapPanels();
    });
    uiObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  }

  function boot() {
    normalizeViewportMeta();
    syncModeClasses();
    syncMobileNavA11y();
    wireFilterSheet('drawsPage', 'sidebarInner', 'sidebarToggle', 'toggleSidebar');
    wireFilterSheet('abDrawsPage', 'abSidebarInner', 'abSidebarToggle', 'toggleAbSidebar');
    tuneMapPanels();
    syncOverlayLock();
    wireGlobalInteractions();
    observeUiState();
    if (document.body) document.body.classList.add('hs-mobile-system-ready');
  }

  [mobileMq, compactMq, coarseMq].forEach(function (mq) {
    if (mq.addEventListener) mq.addEventListener('change', function () {
      syncModeClasses();
      syncOverlayLock();
      observeUiState();
      scheduleResizeMaps();
    });
    else if (mq.addListener) mq.addListener(function () {
      syncModeClasses();
      syncOverlayLock();
      observeUiState();
      scheduleResizeMaps();
    });
  });

  window.addEventListener('orientationchange', function () { setTimeout(scheduleResizeMaps, 80); });
  window.addEventListener('resize', setViewportVars, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setViewportVars, { passive: true });
    window.visualViewport.addEventListener('scroll', setViewportVars, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
