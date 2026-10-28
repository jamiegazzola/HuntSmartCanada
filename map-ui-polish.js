/* HuntSmart map control polish — shared LEH/GOS consistency layer.
   Idempotent by design: no page-wide observers and no repeated DOM rewrites. */
(function(){
  'use strict';
  if (window.__HS_MAP_UI_POLISH__) return;
  window.__HS_MAP_UI_POLISH__ = true;
  window.__HS_MAP_UI_POLISH_VERSION__ = '2.0.0';

  var STYLE_ID = 'hsMapUiPolishStyles';
  var ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="13" cy="18" r="2"/></svg>';

  function styles(){
    if(document.getElementById(STYLE_ID)) return;
    var s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
@media(min-width:769px){
#mapPage.hs-premium-map .fullmap-floating-search,#bcOpenSeasonsPage #hsGosPrimaryRow #osSearchWrap{width:230px!important;min-width:230px!important;max-width:230px!important;height:42px!important;flex:0 0 230px!important}
#mapPage.hs-premium-map .fullmap-floating-search .fullmap-search-input,#bcOpenSeasonsPage #hsGosPrimaryRow #osSearchInput{width:230px!important;min-width:230px!important;max-width:230px!important;height:42px!important;border-radius:10px!important}
#mapPage.hs-premium-map #fullMapSpeciesSelect,#bcOpenSeasonsPage #hsGosPrimaryRow #osSpeciesSel{width:136px!important;min-width:136px!important;max-width:136px!important;height:42px!important;flex:0 0 136px!important;border-radius:10px!important;font-size:12px!important;font-weight:700!important}
#mapPage.hs-premium-map #hsWorldSettingsBtn,#bcOpenSeasonsPage #hsGosPrimaryRow #osUnifiedSettingsBtn{width:92px!important;min-width:92px!important;max-width:92px!important;height:42px!important;flex:0 0 92px!important;padding:0 12px!important;border-radius:10px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;font-size:12px!important;font-weight:750!important;line-height:1!important}
#mapPage.hs-premium-map #hsWorldSettingsBtn svg,#bcOpenSeasonsPage #hsGosPrimaryRow #osUnifiedSettingsBtn svg{width:14px!important;height:14px!important;flex:0 0 14px!important;opacity:.72}
#bcOpenSeasonsPage .os-map-legend{min-height:0!important;padding:5px 9px!important;gap:7px!important;border-radius:9px!important;border-color:rgba(255,255,255,.08)!important;background:rgba(10,13,12,.78)!important;box-shadow:0 5px 16px rgba(0,0,0,.18)!important;backdrop-filter:blur(10px)!important;-webkit-backdrop-filter:blur(10px)!important;font-size:10px!important;opacity:.88}
#bcOpenSeasonsPage .os-map-legend:hover{opacity:1}
#bcOpenSeasonsPage .os-map-legend a,#bcOpenSeasonsPage .os-map-legend button,#bcOpenSeasonsPage .os-map-legend span{font-size:10px!important;line-height:1.2!important}
}
@media(min-width:769px) and (max-width:1120px){
#mapPage.hs-premium-map .fullmap-floating-search,#mapPage.hs-premium-map .fullmap-floating-search .fullmap-search-input,#bcOpenSeasonsPage #hsGosPrimaryRow #osSearchWrap,#bcOpenSeasonsPage #hsGosPrimaryRow #osSearchInput{width:190px!important;min-width:190px!important;max-width:190px!important;flex-basis:190px!important}
#mapPage.hs-premium-map #fullMapSpeciesSelect,#bcOpenSeasonsPage #hsGosPrimaryRow #osSpeciesSel{width:124px!important;min-width:124px!important;max-width:124px!important;flex-basis:124px!important}
#mapPage.hs-premium-map #hsWorldSettingsBtn,#bcOpenSeasonsPage #hsGosPrimaryRow #osUnifiedSettingsBtn{width:84px!important;min-width:84px!important;max-width:84px!important;flex-basis:84px!important;padding:0 10px!important}}
`;
    document.head.appendChild(s);
  }

  function firstLabel(select){
    if(!select || !select.options || !select.options.length) return;
    var option=select.options[0];
    var current=String(option.textContent || '').trim();
    if(/choose species|all species|^species$/i.test(current) && current !== 'All species'){
      option.textContent='All species';
    }
  }

  function ensureSettingsButton(button){
    if(!button) return;

    if(!button.querySelector('svg')){
      var iconHost=button.querySelector('.hs-gos-settings-icon,.hs-map-settings-icon');
      if(!iconHost){
        iconHost=document.createElement('span');
        iconHost.className='hs-map-settings-icon';
        button.insertBefore(iconHost,button.firstChild);
      }
      if(!iconHost.querySelector('svg')){
        iconHost.textContent='';
        iconHost.insertAdjacentHTML('afterbegin',ICON);
      }
    }

    var children=Array.from(button.children || []);
    var label=children.find(function(el){
      return el.tagName === 'SPAN' &&
        !el.classList.contains('hs-gos-settings-icon') &&
        !el.classList.contains('hs-map-settings-icon');
    });
    if(!label){
      label=document.createElement('span');
      button.appendChild(label);
    }
    if(label.textContent !== 'Settings') label.textContent='Settings';
    if(button.title !== 'Map settings') button.title='Map settings';
    if(button.getAttribute('aria-label') !== 'Map settings') button.setAttribute('aria-label','Map settings');
  }

  function watchSelect(select){
    if(!select || select.__hsMapUiPolishObserved) return;
    select.__hsMapUiPolishObserved=true;
    var observer=new MutationObserver(function(){ firstLabel(select); });
    observer.observe(select,{childList:true});
  }

  function polish(){
    styles();

    var lehSearch=document.getElementById('fullMapSearchInput');
    if(lehSearch && lehSearch.placeholder !== 'Search places or WMU…') lehSearch.placeholder='Search places or WMU…';

    var lehSpecies=document.getElementById('fullMapSpeciesSelect');
    firstLabel(lehSpecies);
    watchSelect(lehSpecies);
    ensureSettingsButton(document.getElementById('hsWorldSettingsBtn'));

    var gosSearch=document.getElementById('osSearchInput') || document.querySelector('#bcOpenSeasonsPage .os-search-input');
    if(gosSearch && gosSearch.placeholder !== 'Search places or WMU…') gosSearch.placeholder='Search places or WMU…';

    var gosSpecies=document.getElementById('osSpeciesSel');
    firstLabel(gosSpecies);
    watchSelect(gosSpecies);
    ensureSettingsButton(document.getElementById('osUnifiedSettingsBtn'));
  }

  function install(){
    polish();
    [120,350,800,1600,2600].forEach(function(delay){ setTimeout(polish,delay); });
    window.addEventListener('pageshow',function(){ setTimeout(polish,0); });
    document.addEventListener('visibilitychange',function(){
      if(!document.hidden) setTimeout(polish,0);
    });
  }

  window.hsMapUiPolishRefresh=polish;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
