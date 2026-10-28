/* HuntSmart GOS toolbar row finalizer
   Creates one deterministic desktop row: Search | Species | Settings.
   This deliberately reparents the three visible controls so legacy GOS flex
   rules cannot wrap or reorder them. */
(function () {
  'use strict';
  if (window.__HS_GOS_TOOLBAR_ROW_FINAL__) return;
  window.__HS_GOS_TOOLBAR_ROW_FINAL__ = true;

  var STYLE_ID = 'hsGosToolbarRowFinalStyles';
  var ROW_ID = 'hsGosPrimaryRow';
  var tries = 0;

  function desktop() {
    return !window.matchMedia || window.matchMedia('(min-width: 769px)').matches;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
@media (min-width:769px){
  #bcOpenSeasonsPage .os-topbar.os-horizontal-toolbar{
    position:absolute!important;
    top:14px!important;
    left:14px!important;
    right:auto!important;
    width:500px!important;
    min-width:500px!important;
    max-width:500px!important;
    height:42px!important;
    display:block!important;
    margin:0!important;
    padding:0!important;
    overflow:visible!important;
    background:transparent!important;
    border:0!important;
    box-shadow:none!important;
    pointer-events:none!important;
  }
  #bcOpenSeasonsPage #hsGosPrimaryRow{
    position:absolute!important;
    top:0!important;
    left:0!important;
    right:auto!important;
    bottom:auto!important;
    display:flex!important;
    flex-direction:row!important;
    flex-wrap:nowrap!important;
    align-items:center!important;
    justify-content:flex-start!important;
    gap:9px!important;
    width:max-content!important;
    min-width:0!important;
    max-width:none!important;
    height:42px!important;
    margin:0!important;
    padding:0!important;
    overflow:visible!important;
    transform:none!important;
    pointer-events:auto!important;
    z-index:60!important;
  }
  #bcOpenSeasonsPage #hsGosPrimaryRow #osSearchWrap{
    position:relative!important;
    top:auto!important;
    left:auto!important;
    right:auto!important;
    bottom:auto!important;
    inset:auto!important;
    order:1!important;
    flex:0 0 230px!important;
    width:230px!important;
    min-width:230px!important;
    max-width:230px!important;
    height:42px!important;
    margin:0!important;
    padding:0!important;
    transform:none!important;
  }
  #bcOpenSeasonsPage #hsGosPrimaryRow #osSearchInput{
    width:230px!important;
    min-width:230px!important;
    max-width:230px!important;
    height:42px!important;
    margin:0!important;
    border-radius:10px!important;
  }
  #bcOpenSeasonsPage #hsGosPrimaryRow #osSpeciesSel{
    position:relative!important;
    top:auto!important;
    left:auto!important;
    right:auto!important;
    bottom:auto!important;
    inset:auto!important;
    order:2!important;
    flex:0 0 136px!important;
    width:136px!important;
    min-width:136px!important;
    max-width:136px!important;
    height:42px!important;
    margin:0!important;
    transform:none!important;
  }
  #bcOpenSeasonsPage #hsGosPrimaryRow #osUnifiedSettingsBtn{
    position:relative!important;
    top:auto!important;
    left:auto!important;
    right:auto!important;
    bottom:auto!important;
    inset:auto!important;
    order:3!important;
    flex:0 0 92px!important;
    width:92px!important;
    min-width:92px!important;
    max-width:92px!important;
    height:42px!important;
    margin:0!important;
    padding:0 12px!important;
    transform:none!important;
  }
  #bcOpenSeasonsPage .os-topbar.os-horizontal-toolbar > .os-toolbar-actions,
  #bcOpenSeasonsPage .os-topbar.os-horizontal-toolbar > .os-filters{
    display:none!important;
  }
  #bcOpenSeasonsPage .os-toolbar-popovers{pointer-events:auto!important}
}
@media (min-width:769px) and (max-width:1120px){
  #bcOpenSeasonsPage .os-topbar.os-horizontal-toolbar{
    width:440px!important;
    min-width:440px!important;
    max-width:440px!important;
  }
  #bcOpenSeasonsPage #hsGosPrimaryRow{gap:7px!important}
  #bcOpenSeasonsPage #hsGosPrimaryRow #osSearchWrap,
  #bcOpenSeasonsPage #hsGosPrimaryRow #osSearchInput{
    flex-basis:190px!important;
    width:190px!important;
    min-width:190px!important;
    max-width:190px!important;
  }
  #bcOpenSeasonsPage #hsGosPrimaryRow #osSpeciesSel{
    flex-basis:124px!important;
    width:124px!important;
    min-width:124px!important;
    max-width:124px!important;
  }
  #bcOpenSeasonsPage #hsGosPrimaryRow #osUnifiedSettingsBtn{
    flex-basis:84px!important;
    width:84px!important;
    min-width:84px!important;
    max-width:84px!important;
  }
}
@media (max-width:768px){#bcOpenSeasonsPage #hsGosPrimaryRow{display:none!important}}
`;
    document.head.appendChild(s);
  }

  function ensureRow() {
    injectStyles();
    if (!desktop()) return true;

    var page = document.getElementById('bcOpenSeasonsPage');
    var toolbar = page && page.querySelector('.os-topbar.os-horizontal-toolbar');
    var search = document.getElementById('osSearchWrap');
    var species = document.getElementById('osSpeciesSel');
    var settings = document.getElementById('osUnifiedSettingsBtn');
    if (!page || !toolbar || !search || !species || !settings) return false;

    var row = document.getElementById(ROW_ID);
    if (!row) {
      row = document.createElement('div');
      row.id = ROW_ID;
      row.className = 'hs-gos-primary-row';
      row.setAttribute('aria-label', 'General Open Seasons map controls');
      toolbar.insertBefore(row, toolbar.firstChild);
    }

    if (search.parentElement !== row) row.appendChild(search);
    if (species.parentElement !== row) row.appendChild(species);
    if (settings.parentElement !== row) row.appendChild(settings);
    return true;
  }

  function init() {
    if (ensureRow()) return;
    if (++tries < 60) setTimeout(init, 100);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();

  var observer = new MutationObserver(function () {
    if (desktop()) ensureRow();
  });
  document.addEventListener('DOMContentLoaded', function () {
    var page = document.getElementById('bcOpenSeasonsPage');
    if (page) observer.observe(page, { childList:true, subtree:true });
  }, { once:true });
})();
