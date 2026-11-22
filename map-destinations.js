/* HuntSmart map routing. The Maps tab opens the hunting map directly.
   Wildlife distribution remains a separate route, reached from a small,
   in-map switch rather than an intermediate modal. */
(function () {
  'use strict';
  if (window.__HS_MAP_DESTINATIONS__) return;
  window.__HS_MAP_DESTINATIONS__ = true;

  function createLink(id,text) {
    var a=document.createElement('a');
    a.id=id;
    a.href='/species-map/';
    a.className='nav-link';
    a.textContent=text;
    a.setAttribute('aria-label','Open species distribution map');
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


  function installDirectMapTab() {
    var tabbar=document.getElementById('hsMobileTabbar');
    if(!tabbar || tabbar.dataset.hsMapDirect==='1')return !!tabbar;
    var button=tabbar.querySelector('[data-tab="map"]');
    if(!button)return false;
    tabbar.dataset.hsMapDirect='1';
    button.setAttribute('aria-label','Open hunting map');
    var label=button.querySelector('span');
    if(label)label.textContent='Maps';

    // Capture before legacy click handlers to avoid a double navigation.
    tabbar.addEventListener('click',function(event){
      var target=event.target.closest('[data-tab="map"]');
      if(!target)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if(typeof window.showPage==='function')window.showPage('map');
    },true);
    return true;
  }

  function installCrossLinks() {
    ['mapPage','bcOpenSeasonsPage'].forEach(function(id){
      var page=document.getElementById(id);
      if(!page || page.querySelector('.hs-map-crosslink'))return;
      var link=document.createElement('a');
      link.href='/species-map/';
      link.className='hs-map-crosslink';
      link.setAttribute('aria-label','Switch to species distribution map');
      link.textContent='Distribution';
      var current=document.createElement('span');
      current.className='hs-map-current';
      current.setAttribute('aria-current','page');
      current.textContent='Hunting';
      page.appendChild(current);
      page.appendChild(link);
    });
  }

  // The main app fetches draw records asynchronously and selects its initial
  // page only after that load. A fixed retry timer raced that initialization
  // and could leave a Species -> Hunting return on the Home screen.
  function whenMainAppReady(callback) {
    if (window.__HUNTSMART_MAIN_APP_READY__ === true) callback();
    else window.addEventListener('huntsmart:main-app-ready', callback, {once:true});
  }

  function revealHuntingMap() {
    var mapPage = document.getElementById('mapPage');
    if (mapPage && getComputedStyle(mapPage).display === 'none' &&
        typeof window.showPage === 'function') {
      window.showPage('map');
    }
    document.documentElement.classList.remove('hs-map-route-pending');
  }

  function returnToInteractiveMap() {
    var url = new URL(window.location.href);
    if (url.searchParams.get('map') !== 'interactive') return;
    whenMainAppReady(function () {
      revealHuntingMap();
      url.searchParams.delete('map');
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    });
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
      if (tab === 'account' && (typeof window.openAuthMenu !== 'function' ||
          !document.getElementById('authNavBtn'))) {
        if (++tries < 70) setTimeout(run, 100);
        return;
      }
      url.searchParams.delete('hsTab');
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
      if (tab === 'maps') {
        // Startup has already restored this route; do not initialize Mapbox twice.
        revealHuntingMap();
        return;
      }
      if (mobile && tab === 'draws') {
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
    whenMainAppReady(run);
  }


  function boot() {
    installNavLinks();
    installCrossLinks();
    if(!installDirectMapTab()){
      var observer=new MutationObserver(function(){
        if(installDirectMapTab())observer.disconnect();
      });
      observer.observe(document.body,{childList:true,subtree:true});
    }
    returnToInteractiveMap();
    restoreIncomingTab();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else boot();
})();
