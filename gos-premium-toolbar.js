/* HuntSmart GOS premium desktop toolbar
   Aligns General Open Seasons with the cleaner LEH map control hierarchy
   without replacing any GOS data/filter/map handlers. */
(function () {
  'use strict';

  if (window.__HS_GOS_PREMIUM_TOOLBAR__) return;
  window.__HS_GOS_PREMIUM_TOOLBAR__ = true;

  var STYLE_ID = 'hsGosPremiumToolbarStyles';
  var PANEL_ID = 'osUnifiedSettingsPanel';
  var BUTTON_ID = 'osUnifiedSettingsBtn';

  function isDesktop() {
    return !window.matchMedia || window.matchMedia('(min-width: 769px)').matches;
  }

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
@media (min-width:769px){
  /* Lock GOS to the same simple left-side geometry as LEH. Older GOS CSS has
     several !important width/min-width/flex rules, so every geometry property
     is explicitly reset here to prevent controls from sitting on top of search. */
  #bcOpenSeasonsPage .os-topbar.os-horizontal-toolbar{
    position:absolute!important;
    top:14px!important;
    left:14px!important;
    right:auto!important;
    width:auto!important;
    max-width:calc(100vw - 560px)!important;
    min-width:0!important;
    display:flex!important;
    flex-direction:row!important;
    flex-wrap:nowrap!important;
    align-items:center!important;
    justify-content:flex-start!important;
    gap:9px!important;
    margin:0!important;
    padding:0!important;
    overflow:visible!important;
    background:transparent!important;
    border:0!important;
    box-shadow:none!important;
    pointer-events:none!important;
  }
  #bcOpenSeasonsPage .os-topbar.os-horizontal-toolbar > *{pointer-events:auto!important}

  #bcOpenSeasonsPage .os-topbar.os-horizontal-toolbar .os-search-wrap{
    position:relative!important;
    inset:auto!important;
    flex:0 0 230px!important;
    width:230px!important;
    min-width:230px!important;
    max-width:230px!important;
    height:42px!important;
    margin:0!important;
    transform:none!important;
    z-index:2!important;
  }
  #bcOpenSeasonsPage .os-topbar.os-horizontal-toolbar .os-search-input{
    position:relative!important;
    inset:auto!important;
    display:block!important;
    width:230px!important;
    min-width:0!important;
    max-width:230px!important;
    height:42px!important;
    margin:0!important;
    transform:none!important;
    border-radius:10px!important;
  }

  #bcOpenSeasonsPage .os-topbar.os-horizontal-toolbar .os-filters,
  #bcOpenSeasonsPage .os-topbar.os-horizontal-toolbar .os-toolbar-actions{
    position:relative!important;
    inset:auto!important;
    display:flex!important;
    flex:0 0 auto!important;
    flex-direction:row!important;
    flex-wrap:nowrap!important;
    align-items:center!important;
    justify-content:flex-start!important;
    gap:9px!important;
    width:auto!important;
    min-width:0!important;
    max-width:none!important;
    margin:0!important;
    padding:0!important;
    overflow:visible!important;
    transform:none!important;
  }

  #bcOpenSeasonsPage #osSpeciesSel{
    position:relative!important;
    inset:auto!important;
    flex:0 0 136px!important;
    width:136px!important;
    min-width:136px!important;
    max-width:136px!important;
    height:42px!important;
    margin:0!important;
    transform:none!important;
    border-radius:10px!important;
    background:rgba(11,15,13,.94)!important;
    border:1px solid rgba(255,255,255,.12)!important;
    color:#edf2ee!important;
    font-weight:700!important;
  }

  #bcOpenSeasonsPage #osFilterBtn,#bcOpenSeasonsPage #osLayersBtn{display:none!important}
  #bcOpenSeasonsPage #osUnifiedSettingsBtn{
    position:relative!important;
    inset:auto!important;
    flex:0 0 auto!important;
    width:auto!important;
    height:42px!important;
    min-width:92px!important;
    max-width:none!important;
    margin:0!important;
    padding:0 14px!important;
    transform:none!important;
    display:inline-flex!important;
    align-items:center!important;
    justify-content:center!important;
    gap:7px!important;
    border:1px solid rgba(255,255,255,.12)!important;
    border-radius:10px!important;
    background:rgba(11,15,13,.94)!important;
    color:#e8eeea!important;
    font:750 12px/1 'DM Sans',sans-serif!important;
    cursor:pointer!important;
    box-shadow:0 8px 24px rgba(0,0,0,.16)!important;
    backdrop-filter:blur(14px)!important;
    -webkit-backdrop-filter:blur(14px)!important;
  }
  #bcOpenSeasonsPage #osUnifiedSettingsBtn:hover,#bcOpenSeasonsPage #osUnifiedSettingsBtn.active{border-color:rgba(91,208,108,.34)!important;background:rgba(62,145,74,.14)!important;color:#f2fff4!important}
  #bcOpenSeasonsPage #osUnifiedSettingsBtn .hs-gos-settings-icon{font-size:13px;color:#8e9992}

  #bcOpenSeasonsPage #osUnifiedSettingsPanel{position:fixed!important;z-index:9475!important;width:min(360px,calc(100vw - 28px))!important;max-height:calc(100dvh - 132px)!important;overflow:auto!important;overscroll-behavior:contain;scrollbar-width:none;display:none;padding:0 14px 14px!important;border:1px solid rgba(255,255,255,.12)!important;border-radius:16px!important;background:rgba(12,16,14,.985)!important;box-shadow:0 22px 58px rgba(0,0,0,.44)!important;backdrop-filter:blur(22px) saturate(120%)!important;-webkit-backdrop-filter:blur(22px) saturate(120%)!important}
  #bcOpenSeasonsPage #osUnifiedSettingsPanel::-webkit-scrollbar{display:none}
  #bcOpenSeasonsPage #osUnifiedSettingsPanel.open{display:block!important}
  #bcOpenSeasonsPage .hs-gos-settings-head{position:sticky;top:0;z-index:3;display:flex;align-items:center;justify-content:space-between;min-height:52px;margin:0 -14px 12px;padding:0 14px;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(12,16,14,.985)}
  #bcOpenSeasonsPage .hs-gos-settings-head strong{color:#f1f5f2;font-size:13px;letter-spacing:-.01em}
  #bcOpenSeasonsPage .hs-gos-settings-close{width:32px;height:32px;border:1px solid rgba(255,255,255,.09);border-radius:9px;background:rgba(255,255,255,.035);color:#9ca69f;cursor:pointer}
  #bcOpenSeasonsPage .hs-gos-settings-section{margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.075)}
  #bcOpenSeasonsPage .hs-gos-settings-section:first-of-type{margin-top:0;padding-top:0;border-top:0}
  #bcOpenSeasonsPage .hs-gos-settings-label{display:block;margin:0 0 8px;color:#758078;font-size:9px;font-weight:800;letter-spacing:.105em;text-transform:uppercase}
  #bcOpenSeasonsPage #osUnifiedSettingsPanel #osFilterPanel,#bcOpenSeasonsPage #osUnifiedSettingsPanel #osLayersPanel{position:static!important;inset:auto!important;display:block!important;visibility:visible!important;opacity:1!important;transform:none!important;width:100%!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;pointer-events:auto!important}
  #bcOpenSeasonsPage #osUnifiedSettingsPanel #osFilterPanel .os-filter-popover-head,#bcOpenSeasonsPage #osUnifiedSettingsPanel #osLayersPanel .os-filter-popover-head{min-height:auto!important;margin:0 0 8px!important;padding:0!important;border:0!important;background:transparent!important}
  #bcOpenSeasonsPage #osUnifiedSettingsPanel #osFilterPanel .os-filter-popover-head strong,#bcOpenSeasonsPage #osUnifiedSettingsPanel #osLayersPanel .os-filter-popover-head strong{color:#758078!important;font-size:9px!important;font-weight:800!important;letter-spacing:.105em!important;text-transform:uppercase!important}
  #bcOpenSeasonsPage #osUnifiedSettingsPanel #osFilterPanel .os-filter-popover-head button,#bcOpenSeasonsPage #osUnifiedSettingsPanel #osLayersPanel .os-filter-popover-head button{display:none!important}
  #bcOpenSeasonsPage #osUnifiedSettingsPanel #osFilterPanel label{display:grid!important;grid-template-columns:76px 1fr;align-items:center;gap:10px;margin:8px 0!important;color:#929c95!important;font-size:11px!important;font-weight:650!important}
  #bcOpenSeasonsPage #osUnifiedSettingsPanel #osFilterPanel select{width:100%!important;min-height:38px!important;border:1px solid rgba(255,255,255,.1)!important;border-radius:9px!important;background:#151a17!important;color:#e8eee9!important}
  #bcOpenSeasonsPage #osUnifiedSettingsPanel .os-basemap-buttons,#bcOpenSeasonsPage #osUnifiedSettingsPanel .os-2d3d-toggle{display:grid!important;width:100%!important;gap:6px!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important}
  #bcOpenSeasonsPage #osUnifiedSettingsPanel .os-basemap-buttons{grid-template-columns:repeat(3,1fr)}
  #bcOpenSeasonsPage #osUnifiedSettingsPanel .os-2d3d-toggle{grid-template-columns:repeat(2,1fr)}
  #bcOpenSeasonsPage #osUnifiedSettingsPanel .os-basemap-buttons button,#bcOpenSeasonsPage #osUnifiedSettingsPanel .os-2d3d-toggle button{min-height:38px!important;width:100%!important;border:1px solid rgba(255,255,255,.09)!important;border-radius:9px!important;background:rgba(255,255,255,.035)!important;color:#9ca69f!important;font-size:10px!important;font-weight:750!important}
  #bcOpenSeasonsPage #osUnifiedSettingsPanel .os-basemap-buttons button.active,#bcOpenSeasonsPage #osUnifiedSettingsPanel .os-2d3d-toggle button.active{border-color:rgba(91,208,108,.3)!important;background:rgba(73,170,87,.13)!important;color:#dff8e3!important}
  #bcOpenSeasonsPage #osUnifiedSettingsPanel #osLayersPanel .os-v77-card{margin:8px 0!important;border:1px solid rgba(255,255,255,.075)!important;border-radius:11px!important;background:rgba(255,255,255,.025)!important}
  #bcOpenSeasonsPage #osUnifiedSettingsPanel .os-dock-clear{display:flex!important;width:100%!important;min-height:38px!important;align-items:center!important;justify-content:center!important;margin:0!important;border:1px solid rgba(255,255,255,.095)!important;border-radius:9px!important;background:rgba(255,255,255,.03)!important;color:#aeb7b1!important;font-weight:750!important}
  #bcOpenSeasonsPage #osUnifiedSettingsPanel .os-dock-clear:hover{border-color:rgba(235,108,96,.28)!important;background:rgba(235,108,96,.07)!important;color:#f2b1aa!important}
}

/* On narrower desktop widths, keep the controls in one row but trim search before
   allowing any collision with the right-side BC / GOS mode controls. */
@media (min-width:769px) and (max-width:1120px){
  #bcOpenSeasonsPage .os-topbar.os-horizontal-toolbar{max-width:calc(100vw - 470px)!important;gap:7px!important}
  #bcOpenSeasonsPage .os-topbar.os-horizontal-toolbar .os-search-wrap,
  #bcOpenSeasonsPage .os-topbar.os-horizontal-toolbar .os-search-input{flex-basis:190px!important;width:190px!important;min-width:190px!important;max-width:190px!important}
  #bcOpenSeasonsPage #osSpeciesSel{flex-basis:124px!important;width:124px!important;min-width:124px!important;max-width:124px!important}
  #bcOpenSeasonsPage #osUnifiedSettingsBtn{min-width:84px!important;padding:0 11px!important}
}

@media(max-width:768px){#bcOpenSeasonsPage #osUnifiedSettingsPanel,#bcOpenSeasonsPage #osUnifiedSettingsBtn{display:none!important}}
`;
    document.head.appendChild(s);
  }

  function makeSection(label, child) {
    var sec = document.createElement('section');
    sec.className = 'hs-gos-settings-section';
    if (label) {
      var lab = document.createElement('span');
      lab.className = 'hs-gos-settings-label';
      lab.textContent = label;
      sec.appendChild(lab);
    }
    if (child) sec.appendChild(child);
    return sec;
  }

  function positionPanel() {
    var btn = document.getElementById(BUTTON_ID);
    var panel = document.getElementById(PANEL_ID);
    if (!btn || !panel || !panel.classList.contains('open')) return;
    var r = btn.getBoundingClientRect();
    var maxLeft = Math.max(14, window.innerWidth - panel.offsetWidth - 14);
    var left = Math.min(Math.max(14, r.left), maxLeft);
    panel.style.left = left + 'px';
    panel.style.top = Math.min(window.innerHeight - 90, r.bottom + 8) + 'px';
  }

  function closeSettings() {
    var panel = document.getElementById(PANEL_ID);
    var btn = document.getElementById(BUTTON_ID);
    if (panel) panel.classList.remove('open');
    if (btn) { btn.classList.remove('active'); btn.setAttribute('aria-expanded', 'false'); }
  }

  function openSettings() {
    if (!isDesktop()) return;
    try {
      if (typeof osCloseDockPanels === 'function') osCloseDockPanels();
      if (typeof osBuildWildfireYearControls === 'function') osBuildWildfireYearControls();
    } catch (_) {}
    var panel = document.getElementById(PANEL_ID);
    var btn = document.getElementById(BUTTON_ID);
    if (!panel || !btn) return;
    panel.classList.add('open');
    btn.classList.add('active');
    btn.setAttribute('aria-expanded', 'true');
    positionPanel();
  }

  function toggleSettings() {
    var panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    if (panel.classList.contains('open')) closeSettings(); else openSettings();
  }

  function build() {
    addStyles();
    var page = document.getElementById('bcOpenSeasonsPage');
    var actions = page && page.querySelector('.os-toolbar-actions');
    var popovers = page && page.querySelector('.os-toolbar-popovers');
    var species = document.getElementById('osSpeciesSel');
    if (!page || !actions || !popovers || !species) return false;

    var btn = document.getElementById(BUTTON_ID);
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.id = BUTTON_ID;
      btn.className = 'os-dock-btn hs-gos-settings-btn';
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', PANEL_ID);
      btn.innerHTML = '<span class="hs-gos-settings-icon">☷</span><span>Settings</span>';
      btn.addEventListener('click', function (ev) { ev.stopPropagation(); toggleSettings(); });
      species.insertAdjacentElement('afterend', btn);
    }

    var panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement('div');
      panel.id = PANEL_ID;
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-label', 'General Open Seasons map settings');
      panel.innerHTML = '<div class="hs-gos-settings-head"><strong>Settings</strong><button type="button" class="hs-gos-settings-close" aria-label="Close settings">×</button></div>';
      popovers.appendChild(panel);
      panel.querySelector('.hs-gos-settings-close').addEventListener('click', closeSettings);
    }

    var filters = document.getElementById('osFilterPanel');
    var basemap = actions.querySelector('.os-basemap-buttons') || panel.querySelector('.os-basemap-buttons');
    var mode = actions.querySelector('.os-2d3d-toggle') || panel.querySelector('.os-2d3d-toggle');
    var layers = document.getElementById('osLayersPanel');
    var clear = actions.querySelector('.os-dock-clear') || panel.querySelector('.os-dock-clear');

    if (filters && !panel.contains(filters)) panel.appendChild(makeSection('', filters));
    if (basemap && !panel.contains(basemap)) panel.appendChild(makeSection('Map type', basemap));
    if (mode && !panel.contains(mode)) panel.appendChild(makeSection('Terrain', mode));
    if (layers && !panel.contains(layers)) panel.appendChild(makeSection('', layers));
    if (clear && !panel.contains(clear)) {
      panel.appendChild(makeSection('Reset', clear));
      clear.addEventListener('click', function () { setTimeout(closeSettings, 0); });
    }
    return true;
  }

  document.addEventListener('click', function (ev) {
    var panel = document.getElementById(PANEL_ID);
    var btn = document.getElementById(BUTTON_ID);
    if (!panel || !panel.classList.contains('open')) return;
    if (panel.contains(ev.target) || (btn && btn.contains(ev.target))) return;
    closeSettings();
  }, true);
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') closeSettings(); });
  window.addEventListener('resize', function () { if (!isDesktop()) closeSettings(); else positionPanel(); });

  var tries = 0;
  function init() { if (build()) return; if (++tries < 30) setTimeout(init, 120); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();

  window.osGosUnifiedSettingsOpen = openSettings;
  window.osGosUnifiedSettingsClose = closeSettings;
})();