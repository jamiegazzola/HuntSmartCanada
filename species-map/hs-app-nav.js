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
  function installAccount() {
    if (document.getElementById('hsSpeciesAccount')) return;
    var link=document.createElement('a');
    link.id='hsSpeciesAccount';
    link.className='hs-species-account';
    link.href='/?hsTab=account';
    link.setAttribute('aria-label','Open HuntSmart account');
    link.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>';
    var header=document.querySelector('.hs-map-toolbar .hs-toolbar-header');
    (header || document.body).appendChild(link);
  }
  function install() {
    if (!document.body || document.getElementById('hsSpeciesTabbar')) { installAccount(); sync(); watchInspector(); return; }
    var nav = document.createElement('nav');
    nav.id = 'hsSpeciesTabbar';
    nav.className = 'hs-species-tabbar';
    nav.setAttribute('aria-label', 'Primary navigation');
    nav.innerHTML = tabs.map(function (tab) {
      var active = tab.id === 'maps';
      return '<a class="hs-species-tab' + (active ? ' active' : '') + '"' +
        ' data-tab="' + tab.id + '" href="/?hsTab=' + tab.id + '"' +
        ' aria-label="' + (tab.id === 'maps' ? 'Choose a map' : tab.label) + '"' +
        (active ? ' aria-current="page"' : '') + '>' +
        '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
        tab.icon + '</svg><span>' + tab.label + '</span></a>';
    }).join('');
    document.body.appendChild(nav);
    installAccount();
    sync();
    watchInspector();
  }
  if (media.addEventListener) media.addEventListener('change', sync);
  else if (media.addListener) media.addListener(sync);
  window.__HS_SPECIES_APP_NAV__ = {version:'20261120-ux1', sync:sync};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
