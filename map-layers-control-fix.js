/* HuntSmart desktop map layers control hardening.
   Guarantees a persistent Layers button after later map-shell DOM rewrites. */
(function () {
  'use strict';

  if (window.__HUNTSMART_LAYERS_CONTROL_FIX__) return;
  window.__HUNTSMART_LAYERS_CONTROL_FIX__ = true;

  var mq = window.matchMedia('(max-width: 768px)');
  var observer = null;

  function isDesktop() { return !mq.matches; }
  function mapPage() { return document.getElementById('mapPage'); }
  function toolbar() { return document.querySelector('#mapPage .fullmap-toolbar-main'); }

  function currentBase() {
    try { return String(_fullMapStyle || 'streets'); } catch (_) { return 'streets'; }
  }
  function current3D() {
    try { return !!_fullMapTerrain3D; } catch (_) { return false; }
  }
  function currentVisibility() {
    try {
      var n = Number(_fullMapWMUOpacity);
      if (Number.isFinite(n)) return Math.max(0, Math.min(100, Math.round(n * 100)));
    } catch (_) {}
    return 100;
  }

  function addStyles() {
    if (document.getElementById('hsLayersControlFixStyles')) return;
    var style = document.createElement('style');
    style.id = 'hsLayersControlFixStyles';
    style.textContent = [
      '@media (min-width:769px){',
      '#mapPage #hsWorldSettingsBtn.hs-layers-control-fix{display:inline-flex!important;align-items:center;justify-content:center;gap:7px;flex:0 0 auto;height:40px;min-width:82px;padding:0 12px!important;border:1px solid rgba(255,255,255,.12);border-radius:11px;background:rgba(13,18,16,.94);color:#dfe8e2;font:700 11px/1 "DM Sans",sans-serif;cursor:pointer;white-space:nowrap;box-sizing:border-box}',
      '#mapPage #hsWorldSettingsBtn.hs-layers-control-fix:hover,#mapPage #hsWorldSettingsBtn.hs-layers-control-fix.is-open{border-color:rgba(101,213,118,.38);background:rgba(101,213,118,.11);color:#effff1}',
      '#mapPage #hsWorldSettingsBtn.hs-layers-control-fix svg{display:block;flex:0 0 auto}',
      '#hsWorldSettingsPanel.hs-layers-panel-fix{display:none!important;position:fixed!important;z-index:9800!important;width:min(330px,calc(100vw - 24px))!important;max-height:calc(100vh - 90px)!important;overflow:auto!important;padding:0!important;border:1px solid rgba(255,255,255,.13)!important;border-radius:14px!important;background:rgba(12,16,14,.985)!important;box-shadow:0 18px 50px rgba(0,0,0,.42)!important;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}',
      '#hsWorldSettingsPanel.hs-layers-panel-fix.open{display:block!important}',
      '#hsWorldSettingsPanel .hs-layers-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:15px 15px 12px;border-bottom:1px solid rgba(255,255,255,.08)}',
      '#hsWorldSettingsPanel .hs-layers-title{font-size:14px;font-weight:800;color:#f1f5f2}',
      '#hsWorldSettingsPanel .hs-layers-sub{margin-top:3px;font-size:10px;color:rgba(236,241,237,.48)}',
      '#hsWorldSettingsPanel .hs-layers-close{width:30px;height:30px;border:1px solid rgba(255,255,255,.09);border-radius:8px;background:rgba(255,255,255,.035);color:rgba(236,241,237,.64);font-size:18px;cursor:pointer}',
      '#hsWorldSettingsPanel .hs-layers-body{padding:14px 15px 16px}',
      '#hsWorldSettingsPanel .hs-layers-section+ .hs-layers-section{margin-top:15px}',
      '#hsWorldSettingsPanel .hs-layers-label{display:flex;justify-content:space-between;gap:10px;margin-bottom:7px;font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:rgba(236,241,237,.5)}',
      '#hsWorldSettingsPanel .hs-layers-seg{display:grid;gap:6px}',
      '#hsWorldSettingsPanel .hs-layers-seg.three{grid-template-columns:repeat(3,minmax(0,1fr))}',
      '#hsWorldSettingsPanel .hs-layers-seg.two{grid-template-columns:repeat(2,minmax(0,1fr))}',
      '#hsWorldSettingsPanel .hs-layers-choice{min-height:36px;border:1px solid rgba(255,255,255,.10);border-radius:9px;background:rgba(255,255,255,.035);color:rgba(236,241,237,.72);font:700 11px/1 "DM Sans",sans-serif;cursor:pointer}',
      '#hsWorldSettingsPanel .hs-layers-choice.active{border-color:rgba(101,213,118,.32);background:rgba(101,213,118,.12);color:#dfffe4}',
      '#hsWorldSettingsPanel .hs-layers-slider-row{display:grid;grid-template-columns:minmax(0,1fr) 42px;gap:10px;align-items:center}',
      '#hsWorldSettingsPanel .hs-layers-slider-row input{width:100%;accent-color:#65d576}',
      '#hsWorldSettingsPanel .hs-layers-value{text-align:right;font-size:11px;font-weight:800;color:#7ee98c}',
      '#hsWorldSettingsPanel .hs-layers-note{margin-top:7px;font-size:10px;line-height:1.4;color:rgba(236,241,237,.42)}',
      '}',
      '@media (max-width:768px){#mapPage #hsWorldSettingsBtn.hs-layers-control-fix,#hsWorldSettingsPanel.hs-layers-panel-fix{display:none!important}}'
    ].join('');
    document.head.appendChild(style);
  }

  function panelHTML() {
    var base = currentBase();
    var terrain = current3D();
    var visibility = currentVisibility();
    function choice(label, active, action) {
      return '<button type="button" class="hs-layers-choice' + (active ? ' active' : '') + '" data-action="' + action + '">' + label + '</button>';
    }
    return '<div class="hs-layers-head">' +
      '<div><div class="hs-layers-title">Map layers</div><div class="hs-layers-sub">Basemap, terrain and overlay visibility</div></div>' +
      '<button type="button" class="hs-layers-close" aria-label="Close layers">×</button>' +
      '</div>' +
      '<div class="hs-layers-body">' +
        '<section class="hs-layers-section"><div class="hs-layers-label"><span>Basemap</span></div>' +
          '<div class="hs-layers-seg three">' +
            choice('Satellite', base === 'satellite', 'base:satellite') +
            choice('Topo', base === 'topo', 'base:topo') +
            choice('Dark', base === 'streets', 'base:streets') +
          '</div></section>' +
        '<section class="hs-layers-section"><div class="hs-layers-label"><span>Terrain</span></div>' +
          '<div class="hs-layers-seg two">' +
            choice('2D', !terrain, 'terrain:2d') +
            choice('3D', terrain, 'terrain:3d') +
          '</div></section>' +
        '<section class="hs-layers-section"><div class="hs-layers-label"><span>Overlay opacity</span><span class="hs-layers-live">' + visibility + '%</span></div>' +
          '<div class="hs-layers-slider-row"><input class="hs-layers-opacity" type="range" min="0" max="100" step="1" value="' + visibility + '" aria-label="WMU and LEH overlay opacity"><span class="hs-layers-value">' + visibility + '%</span></div>' +
          '<div class="hs-layers-note">Lower the overlay when you want satellite imagery or terrain to show through more clearly.</div>' +
        '</section>' +
      '</div>';
  }

  function closePanel() {
    var panel = document.getElementById('hsWorldSettingsPanel');
    var button = document.getElementById('hsWorldSettingsBtn');
    if (panel) panel.classList.remove('open');
    if (button) {
      button.classList.remove('is-open');
      button.setAttribute('aria-expanded', 'false');
    }
  }

  function positionPanel(button, panel) {
    if (!button || !panel) return;
    var rect = button.getBoundingClientRect();
    var width = Math.min(330, Math.max(260, window.innerWidth - 24));
    var left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
    panel.style.left = Math.round(left) + 'px';
    panel.style.top = Math.round(rect.bottom + 8) + 'px';
  }

  function renderPanel() {
    var panel = document.getElementById('hsWorldSettingsPanel');
    if (!panel) return;
    panel.classList.add('hs-layers-panel-fix');
    panel.innerHTML = panelHTML();

    var close = panel.querySelector('.hs-layers-close');
    if (close) close.addEventListener('click', closePanel);

    panel.querySelectorAll('.hs-layers-choice[data-action]').forEach(function (control) {
      control.addEventListener('click', function () {
        var action = control.dataset.action || '';
        if (action.indexOf('base:') === 0) {
          var type = action.slice(5);
          try { if (typeof fullMapSetTile === 'function') fullMapSetTile(type); } catch (_) {}
        } else if (action === 'terrain:2d' || action === 'terrain:3d') {
          var on = action === 'terrain:3d';
          try {
            if (current3D() !== on && typeof fullMapToggle3D === 'function') fullMapToggle3D();
          } catch (_) {}
        }
        setTimeout(renderPanel, 60);
      });
    });

    var slider = panel.querySelector('.hs-layers-opacity');
    var value = panel.querySelector('.hs-layers-value');
    var live = panel.querySelector('.hs-layers-live');
    if (slider) {
      slider.addEventListener('input', function () {
        var pct = Math.max(0, Math.min(100, Number(slider.value) || 0));
        if (value) value.textContent = Math.round(pct) + '%';
        if (live) live.textContent = Math.round(pct) + '%';
        try {
          if (typeof fullMapSetLEHOpacity === 'function') fullMapSetLEHOpacity(1 - pct / 100);
        } catch (_) {}
      });
    }
  }

  function ensurePanel() {
    var panel = document.getElementById('hsWorldSettingsPanel');
    if (!panel) {
      panel = document.createElement('aside');
      panel.id = 'hsWorldSettingsPanel';
      panel.setAttribute('aria-label', 'Map layers and display settings');
      document.body.appendChild(panel);
    }
    panel.classList.add('hs-layers-panel-fix');
    return panel;
  }

  function wireButton(button) {
    if (!button || button.dataset.hsLayersFixWired === '1') return;
    button.dataset.hsLayersFixWired = '1';
    button.onclick = null;
    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      var panel = ensurePanel();
      var opening = !panel.classList.contains('open');
      if (!opening) { closePanel(); return; }
      renderPanel();
      positionPanel(button, panel);
      panel.classList.add('open');
      button.classList.add('is-open');
      button.setAttribute('aria-expanded', 'true');
    });
  }

  function ensureButton() {
    if (!isDesktop()) { closePanel(); return; }
    var bar = toolbar();
    if (!bar) return;

    var button = document.getElementById('hsWorldSettingsBtn');
    if (!button || button.parentElement !== bar) {
      if (button) button.remove();
      button = document.createElement('button');
      button.type = 'button';
      button.id = 'hsWorldSettingsBtn';
      var species = document.getElementById('fullMapSpeciesSelect');
      if (species && species.parentElement === bar) species.insertAdjacentElement('afterend', button);
      else bar.appendChild(button);
    }

    button.className = 'hs-wc-settings-btn hs-layers-control-fix';
    button.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="13" cy="18" r="2"/></svg><span>Layers</span>';
    button.title = 'Basemap, terrain and overlay visibility';
    button.setAttribute('aria-label', 'Basemap, terrain and overlay visibility');
    button.setAttribute('aria-haspopup', 'dialog');
    if (!button.hasAttribute('aria-expanded')) button.setAttribute('aria-expanded', 'false');
    wireButton(button);
    ensurePanel();
  }

  function installObserver() {
    var page = mapPage();
    if (!page || observer) return;
    observer = new MutationObserver(function () { ensureButton(); });
    observer.observe(page, { childList: true, subtree: true });
  }

  function refresh() {
    addStyles();
    ensureButton();
    installObserver();
  }

  document.addEventListener('click', function (event) {
    var panel = document.getElementById('hsWorldSettingsPanel');
    var button = document.getElementById('hsWorldSettingsBtn');
    if (!panel || !panel.classList.contains('open')) return;
    if ((button && button.contains(event.target)) || panel.contains(event.target)) return;
    closePanel();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closePanel();
  });
  window.addEventListener('resize', function () {
    if (!isDesktop()) { closePanel(); return; }
    var button = document.getElementById('hsWorldSettingsBtn');
    var panel = document.getElementById('hsWorldSettingsPanel');
    if (button && panel && panel.classList.contains('open')) positionPanel(button, panel);
    ensureButton();
  });

  if (mq.addEventListener) mq.addEventListener('change', refresh);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh, { once: true });
  else refresh();
  [100, 350, 800, 1600, 3000].forEach(function (delay) { setTimeout(refresh, delay); });
})();
