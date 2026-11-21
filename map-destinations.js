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
      link.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17l5-9 4 6 3-4 4 7M3 20h18"/></svg><span>Species map</span><span aria-hidden="true">›</span>';
      page.appendChild(link);
    });
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
      if (tab === 'account' && (typeof window.openAuthMenu !== 'function' ||
          !document.getElementById('authNavBtn'))) {
        if (++tries < 70) setTimeout(run, 100);
        return;
      }
      url.searchParams.delete('hsTab');
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
      if (mobile && (tab === 'draws' || tab === 'maps')) {
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
