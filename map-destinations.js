/* HuntSmart map destinations: preserve the existing interactive LEH/GOS engine
   and open the species viewer as its own independent map route. */
(function () {
  'use strict';
  if (window.__HS_MAP_DESTINATIONS__) return;
  window.__HS_MAP_DESTINATIONS__ = true;

  var lastFocused = null;
  var backdrop = null;

  function createLink(id, text) {
    var a = document.createElement('a');
    a.id = id;
    a.href = '/species-map/';
    a.className = 'nav-link';
    a.textContent = text;
    a.setAttribute('aria-label', 'Open species distribution map');
    return a;
  }

  function installNavLinks() {
    var desktop = document.getElementById('navMap');
    if (desktop && !document.getElementById('navDistribution')) {
      desktop.insertAdjacentElement('afterend', createLink('navDistribution', 'Species Map'));
    }
    var mobile = document.getElementById('mNavMap');
    if (mobile && !document.getElementById('mNavDistribution')) {
      var link = createLink('mNavDistribution', 'Species Distribution');
      mobile.insertAdjacentElement('afterend', link);
    }
    var footer = document.querySelector('.home-footer-links');
    if (footer && !footer.querySelector('[data-hs-distribution-link]')) {
      var footerLink = document.createElement('a');
      footerLink.href = '/species-map/';
      footerLink.className = 'home-footer-link';
      footerLink.dataset.hsDistributionLink = '1';
      footerLink.textContent = 'Species Map';
      footer.appendChild(footerLink);
    }
  }

  function closeSheet() {
    if (!backdrop) return;
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('hs-map-destinations-open');
    if (lastFocused && lastFocused.isConnected) lastFocused.focus({ preventScroll: true });
  }

  function openSheet() {
    if (!backdrop) return;
    lastFocused = document.activeElement;
    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.classList.add('hs-map-destinations-open');
    var close = backdrop.querySelector('.hs-map-destinations-close');
    if (close) close.focus({ preventScroll: true });
  }

  function installSheet() {
    if (backdrop) return;
    backdrop = document.createElement('div');
    backdrop.id = 'hsMapDestinationsBackdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    backdrop.innerHTML =
      '<section class="hs-map-destinations-sheet" role="dialog" aria-modal="true" aria-label="Choose a map">' +
        '<div class="hs-map-destinations-head"><strong class="hs-map-destinations-title">Choose a map</strong>' +
          '<button type="button" class="hs-map-destinations-close" aria-label="Close map chooser">×</button></div>' +
        '<button class="hs-map-destination" type="button" data-map-destination="interactive">' +
          '<span><strong>Hunting Map</strong><small>BC LEH, general open seasons and Alberta draw areas</small></span>' +
          '<span class="hs-map-destination-arrow" aria-hidden="true">›</span></button>' +
        '<button class="hs-map-destination" type="button" data-map-destination="distribution">' +
          '<span><strong>Species Distribution</strong><small>Wildlife ranges, historical layers and hunter-success data</small></span>' +
          '<span class="hs-map-destination-arrow" aria-hidden="true">›</span></button>' +
      '</section>';
    backdrop.addEventListener('click', function (event) {
      if (event.target === backdrop || event.target.closest('.hs-map-destinations-close')) {
        closeSheet(); return;
      }
      var choice = event.target.closest('[data-map-destination]');
      if (!choice) return;
      var destination = choice.dataset.mapDestination;
      closeSheet();
      if (destination === 'distribution') {
        window.location.assign('/species-map/');
      } else if (typeof window.showPage === 'function') {
        window.showPage('map');
      }
    });
    document.body.appendChild(backdrop);
    document.addEventListener('keydown', function (event) {
      if (!backdrop.classList.contains('open')) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeSheet();
      } else if (event.key === 'Tab') {
        var focusable = Array.from(backdrop.querySelectorAll('button'));
        var first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }
    });
  }

  function installMobileMapChoice() {
    var tabbar = document.getElementById('hsMobileTabbar');
    if (!tabbar || tabbar.dataset.hsMapChooser === '1') return !!tabbar;
    var map = tabbar.querySelector('[data-tab="map"]');
    if (!map) return false;
    tabbar.dataset.hsMapChooser = '1';
    map.setAttribute('aria-label', 'Choose a map');
    var label = map.querySelector('span');
    if (label) label.textContent = 'Maps';

    // Capture before the legacy tab handler so a map choice never accidentally
    // launches the LEH viewer behind the selection sheet.
    tabbar.addEventListener('click', function (event) {
      var target = event.target.closest('[data-tab="map"]');
      if (!target) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      openSheet();
    }, true);
    return true;
  }

  function returnToInteractiveMap() {
    var url = new URL(window.location.href);
    if (url.searchParams.get('map') !== 'interactive') return;
    var tries = 0;
    function navigate() {
      if (typeof window.showPage !== 'function') {
        if (++tries < 20) window.setTimeout(navigate, 100);
        return;
      }
      window.showPage('map');
      url.searchParams.delete('map');
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    }
    navigate();
  }

  // The standalone species viewer navigates back to the existing app.
  // Deep links should restore the requested tab instead of resetting to Home.
  function restoreIncomingTab() {
    var url = new URL(window.location.href);
    var tab = url.searchParams.get('hsTab');
    if (!['home', 'draws', 'seasons', 'maps', 'saved', 'account'].includes(tab)) return;
    var tries = 0;
    function run() {
      if (typeof window.showPage !== 'function' ||
          (window.matchMedia('(max-width:768px)').matches &&
            !document.querySelector('#hsMobileTabbar [data-tab="home"]'))) {
        if (++tries < 45) setTimeout(run, 100);
        return;
      }
      var mobile = window.matchMedia('(max-width:768px)').matches;
      var buttonName = tab === 'maps' ? 'map' : tab;
      if (mobile && tab === 'account' && !document.getElementById('hsMobileAccountTab')) {
        if (++tries < 45) setTimeout(run, 100);
        return;
      }
      url.searchParams.delete('hsTab');
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
      if (mobile && (tab === 'draws' || tab === 'maps' || tab === 'account')) {
        document.querySelector('#hsMobileTabbar [data-tab="' + buttonName + '"]')?.click();
        return;
      }
      if (tab === 'account') {
        document.getElementById('authNavBtn')?.click();
        return;
      }
      var page = {home:'home', draws:'filter', seasons:'bcOpenSeasons', maps:'map', saved:'saved'}[tab];
      if (page) window.showPage(page);
    }
    run();
  }

  function boot() {
    installNavLinks();
    installSheet();
    if (!installMobileMapChoice()) {
      var observer = new MutationObserver(function () {
        if (installMobileMapChoice()) observer.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
    returnToInteractiveMap();
    restoreIncomingTab();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else boot();
})();
