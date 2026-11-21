/* Shared bottom navigation for the independent Species Distribution viewer. */
(function () {
  'use strict';
  if (window.__HS_SPECIES_APP_NAV__) return;
  var media = window.matchMedia('(max-width:768px)');
  var tabs = [
    {id:'home',label:'Home',icon:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/>'},
    {id:'draws',label:'Draws',icon:'<path d="M4 19V9M10 19V5M16 19v-7M22 19V2"/>'},
    {id:'seasons',label:'Seasons',icon:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/><path d="m8 15 2 2 5-5"/>'},
    {id:'maps',label:'Maps',icon:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/>'},
    {id:'saved',label:'Saved',icon:'<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>'}
  ];
  function sync() {
    if (!document.body) return;
    document.body.classList.toggle('hs-species-has-tabs', media.matches);
  }
  function watchInspector() {
    var card = document.getElementById('hs-wmu-card');
    if (!card || card.dataset.hsNavObserved === '1') return;
    card.dataset.hsNavObserved = '1';
    function syncInspector() {
      document.body.classList.toggle('hs-species-inspector-open', media.matches && !card.hidden);
    }
    new MutationObserver(syncInspector).observe(card, {attributes:true,attributeFilter:['hidden','class']});
    syncInspector();
  }
  function install() {
    if (!document.body || document.getElementById('hsSpeciesTabbar')) { sync(); watchInspector(); return; }
    var nav = document.createElement('nav');
    nav.id = 'hsSpeciesTabbar';
    nav.className = 'hs-species-tabbar';
    nav.setAttribute('aria-label', 'Primary navigation');
    nav.innerHTML = tabs.map(function (tab) {
      var active = tab.id === 'maps';
      return '<a class="hs-species-tab' + (active ? ' active' : '') + '"' +
        ' data-tab="' + tab.id + '" href="/?hsTab=' + tab.id + '"' +
        ' aria-label="' + (tab.id === 'maps' ? 'Open hunting map' : tab.label) + '"' +
        (active ? ' aria-current="page"' : '') + '>' +
        '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
        tab.icon + '</svg><span>' + tab.label + '</span></a>';
    }).join('');
    document.body.appendChild(nav);
    var crosslink=document.createElement('a');
    crosslink.id='hsHuntingMapLink';
    crosslink.className='hs-map-crosslink';
    crosslink.href='/?map=interactive';
    crosslink.setAttribute('aria-label','Switch to hunting map');
    crosslink.innerHTML='<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/></svg><span>Hunting map</span><span aria-hidden="true">›</span>';
    document.body.appendChild(crosslink);
    sync();
    watchInspector();
  }
  if (media.addEventListener) media.addEventListener('change', sync);
  else if (media.addListener) media.addListener(sync);
  window.__HS_SPECIES_APP_NAV__ = {version:'20261120-direct-map', sync:sync};
  // Load from the document head: nav must appear immediately, even when
  // production-only wildlife scripts block DOMContentLoaded for many seconds.
  if (document.body) install();
  else if (document.documentElement) {
    var readyObserver = new MutationObserver(function () {
      if (!document.body) return;
      readyObserver.disconnect();
      install();
    });
    readyObserver.observe(document.documentElement, { childList:true });
  }
  // The map inspector is injected by production map-ui after this early script.
  // Reconcile its visibility once all other UI initializers have finished.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      install();
      watchInspector();
    }, {once:true});
  }
})();
