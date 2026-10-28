/* HuntSmart map control polish — shared LEH/GOS consistency layer. */
(function(){'use strict';if(window.__HS_MAP_UI_POLISH__)return;window.__HS_MAP_UI_POLISH__=true;
var STYLE_ID='hsMapUiPolishStyles';
var ICON='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="13" cy="18" r="2"/></svg>';
function styles(){if(document.getElementById(STYLE_ID))return;var s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
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
`;document.head.appendChild(s)}
function firstLabel(sel){if(!sel||!sel.options||!sel.options.length)return;var o=sel.options[0];if(o&&/choose species|all species|species/i.test(o.textContent||''))o.textContent='All species'}
function polish(){styles();var a=document.getElementById('fullMapSearchInput');if(a)a.placeholder='Search places or WMU…';firstLabel(document.getElementById('fullMapSpeciesSelect'));var b=document.getElementById('hsWorldSettingsBtn');if(b){b.innerHTML=ICON+'<span>Settings</span>';b.title='Map settings';b.setAttribute('aria-label','Map settings')}
var c=document.getElementById('osSearchInput')||document.querySelector('#bcOpenSeasonsPage .os-search-input');if(c)c.placeholder='Search places or WMU…';firstLabel(document.getElementById('osSpeciesSel'));var d=document.getElementById('osUnifiedSettingsBtn');if(d){d.innerHTML=ICON+'<span>Settings</span>';d.title='Map settings';d.setAttribute('aria-label','Map settings')}}
function install(){polish();setTimeout(polish,150);setTimeout(polish,500);setTimeout(polish,1100);var root=document.body;if(root&&window.MutationObserver){var q=false;new MutationObserver(function(){if(q)return;q=true;requestAnimationFrame(function(){q=false;polish()})}).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();})();
