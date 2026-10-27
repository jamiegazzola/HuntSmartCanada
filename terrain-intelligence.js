/* HuntSmart Interactive Map production finalizer.
   Legacy terrain-intelligence filename retained by the existing build pipeline.
   The experimental Terrain Lab UI is intentionally not shipped to consumers. */
(function () {
  'use strict';

  if (window.__HUNTSMART_INTERACTIVE_MAP_FINALIZER__) return;
  window.__HUNTSMART_INTERACTIVE_MAP_FINALIZER__ = true;

  function isMobile() {
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
  }

  function currentBase() {
    try { return String(_fullMapStyle || 'streets'); } catch (_) { return 'streets'; }
  }

  function current3D() {
    try { return !!_fullMapTerrain3D; } catch (_) { return false; }
  }

  function currentOverlayVisibility() {
    try { return Math.max(0, Math.min(100, Math.round(Number(_fullMapWMUOpacity) * 100))); } catch (_) { return 100; }
  }

  function fallbackLayersHTML() {
    var base = currentBase();
    var terrain = current3D();
    var visibility = currentOverlayVisibility();
    var slider = 100 - visibility;
    function choice(label, active, action, extra) {
      return '<button type="button" class="hs-wc-choice ' + (extra || '') + (active ? ' active' : '') + '" onclick="' + action + '">' + label + '</button>';
    }
    return '<div class="hs-wc-panel-head">' +
      '<div><div class="hs-wc-panel-title">Map layers</div><div class="hs-wc-panel-sub">Basemap, terrain and boundary visibility</div></div>' +
      '<button type="button" class="hs-wc-close" onclick="hsFallbackCloseLayers()" aria-label="Close layers">×</button>' +
      '</div>' +
      '<div class="hs-wc-panel-body">' +
        '<section class="hs-wc-section">' +
          '<div class="hs-wc-label"><span>Basemap</span></div>' +
          '<div class="hs-wc-seg three">' +
            choice('Satellite', base === 'satellite', "hsFallbackSetBase('satellite')", 'satellite') +
            choice('Topo', base === 'topo', "hsFallbackSetBase('topo')", '') +
            choice('Dark', base === 'streets', "hsFallbackSetBase('streets')", '') +
          '</div>' +
        '</section>' +
        '<section class="hs-wc-section">' +
          '<div class="hs-wc-label"><span>Terrain</span></div>' +
          '<div class="hs-wc-seg two">' +
            choice('2D', !terrain, 'hsFallbackSet3D(false)', '') +
            choice('3D', terrain, 'hsFallbackSet3D(true)', '') +
          '</div>' +
        '</section>' +
        '<section class="hs-wc-section">' +
          '<div class="hs-wc-label"><span>Boundary visibility</span><span class="hs-wc-live">' + visibility + '%</span></div>' +
          '<div class="hs-wc-slider-row">' +
            '<input type="range" min="0" max="100" step="1" value="' + slider + '" oninput="hsFallbackSetOverlayOpacity(this.value)">' +
            '<span class="hs-wc-slider-value">' + visibility + '%</span>' +
          '</div>' +
          '<div class="hs-wc-note">Reduce boundary fill when you want satellite imagery and terrain to dominate.</div>' +
        '</section>' +
      '</div>';
  }

  function renderFallbackLayers() {
    var panel = document.getElementById('hsWorldSettingsPanel');
    if (!panel || panel.dataset.hsFallbackLayers !== '1') return;
    panel.innerHTML = fallbackLayersHTML();
  }

  function ensureFallbackLayersControl() {
    if (isMobile()) return;
    var toolbar = document.querySelector('#mapPage .fullmap-toolbar-main');
    var container = document.querySelector('#mapPage .fullmap-container');
    if (!toolbar || !container) return;

    var button = document.getElementById('hsWorldSettingsBtn');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.id = 'hsWorldSettingsBtn';
      button.className = 'hs-wc-settings-btn';
      button.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="13" cy="18" r="2"/></svg><span>Layers</span>';
      button.setAttribute('aria-label', 'Map layers and display settings');
      button.title = 'Map layers and display settings';
      button.onclick = function (event) {
        event.stopPropagation();
        var panel = document.getElementById('hsWorldSettingsPanel');
        if (!panel) return;
        var opening = !panel.classList.contains('open');
        panel.classList.toggle('open', opening);
        button.classList.toggle('is-open', opening);
        if (opening) renderFallbackLayers();
      };
      toolbar.appendChild(button);
    }

    var panel = document.getElementById('hsWorldSettingsPanel');
    if (!panel) {
      panel = document.createElement('aside');
      panel.id = 'hsWorldSettingsPanel';
      panel.className = 'hs-wc-settings-panel';
      panel.dataset.hsFallbackLayers = '1';
      panel.setAttribute('aria-label', 'Map layers and display settings');
      container.appendChild(panel);
      renderFallbackLayers();
    }

    var label = button.querySelector('span');
    if (label && label.textContent !== 'Layers') label.textContent = 'Layers';
  }

  window.hsFallbackCloseLayers = function () {
    var panel = document.getElementById('hsWorldSettingsPanel');
    var button = document.getElementById('hsWorldSettingsBtn');
    if (panel) panel.classList.remove('open');
    if (button) button.classList.remove('is-open');
  };
  window.hsFallbackSetBase = function (type) {
    try { if (typeof fullMapSetTile === 'function') fullMapSetTile(type); } catch (_) {}
    setTimeout(renderFallbackLayers, 80);
  };
  window.hsFallbackSet3D = function (on) {
    try {
      if (current3D() !== !!on && typeof fullMapToggle3D === 'function') fullMapToggle3D();
    } catch (_) {}
    setTimeout(renderFallbackLayers, 80);
  };
  window.hsFallbackSetOverlayOpacity = function (value) {
    var slider = Math.max(0, Math.min(100, Number(value) || 0));
    try { if (typeof fullMapSetLEHOpacity === 'function') fullMapSetLEHOpacity(slider / 100); } catch (_) {}
    setTimeout(renderFallbackLayers, 30);
  };

  function ensureWorldSettingsCompatibility() {
    var toolbar = document.querySelector('#mapPage .fullmap-toolbar-main');
    var mapPage = document.getElementById('mapPage');
    if (!toolbar || !mapPage) return;

    // world-class-map.js still supports the older v4 hook. Preserve compatibility
    // when that enhancement loads, but guarantee a native fallback below.
    toolbar.classList.add('fullmap-toolbar-main-v4');
    ensureFallbackLayersControl();

    var button = document.getElementById('hsWorldSettingsBtn');
    if (!button) return;
    var label = button.querySelector('span');
    if (label && label.textContent !== 'Layers') label.textContent = 'Layers';
    button.setAttribute('aria-label', 'Map layers and display settings');
    button.title = 'Map layers and display settings';
  }

  function hideLegacyMobileProvinceControls() {
    ['hsTpBC','hsTpAB'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.setProperty('display', 'none', 'important');
    });

    var bc = document.getElementById('hsTpBC');
    var ab = document.getElementById('hsTpAB');
    if (bc && ab && bc.parentElement === ab.parentElement) {
      var parent = bc.parentElement;
      Array.from(parent.children).forEach(function (child) {
        if (child === bc || child === ab) return;
        var cls = String(child.className || '');
        if (/div|divider/i.test(cls) && child !== document.getElementById('hsSpeciesBtn')) {
          child.style.setProperty('display', 'none', 'important');
        }
      });
    }
  }

  function revealMobileCluster(cluster) {
    if (!cluster) return;
    cluster.classList.remove('hs-hidden', 'hidden', 'drawer-open');
    cluster.style.removeProperty('display');
    cluster.style.removeProperty('opacity');
    cluster.style.removeProperty('visibility');
  }

  function enforceMobileDrawerContract() {
    if (!isMobile()) return;
    var drawer = document.getElementById('fullMapResultsDrawer');
    var body = document.getElementById('fullMapBody');
    var cluster = document.getElementById('hsBrCluster');
    var cards = document.getElementById('hsRbCards');
    if (!drawer) return;

    var open = drawer.classList.contains('hs-drawer-open');
    if (!open) {
      drawer.style.setProperty('display', 'none', 'important');
      if (body) body.classList.remove('hs-drawer-open');
      revealMobileCluster(cluster);
      if (cards) cards.classList.remove('hs-active');
    } else {
      drawer.style.setProperty('display', 'flex', 'important');
    }
  }

  function forceCloseMobileDrawer() {
    if (!isMobile()) return;
    var drawer = document.getElementById('fullMapResultsDrawer');
    var body = document.getElementById('fullMapBody');
    var cluster = document.getElementById('hsBrCluster');
    var cards = document.getElementById('hsRbCards');
    if (drawer) {
      drawer.classList.remove('hs-drawer-open');
      drawer.style.setProperty('display', 'none', 'important');
    }
    if (body) body.classList.remove('hs-drawer-open');
    revealMobileCluster(cluster);
    if (cards) cards.classList.remove('hs-active');
  }

  function forceCloseLegacyMobileModals() {
    if (!isMobile()) return;

    var scrim = document.getElementById('hsScrim');
    if (scrim) {
      scrim.classList.remove('hs-open');
      scrim.style.setProperty('display', 'none', 'important');
    }

    var oldScrim = document.getElementById('hsModalScrim');
    if (oldScrim) {
      oldScrim.classList.remove('visible');
      oldScrim.style.setProperty('display', 'none', 'important');
      oldScrim.innerHTML = '';
    }

    ['hsRbLayers','hsRbSearch','hsRbCards','hsRbLEH','hsRailLayers','hsRailSearch','hsRailCards','hsRailLEH'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.remove('hs-active', 'active');
    });
  }

  function regionForWMU(id) {
    var value = String(id || '');
    if (!value) return '';
    try {
      if (typeof osWMURegion === 'function') {
        var region = osWMURegion(value);
        if (region) return String(region);
      }
    } catch (_) {}
    return value.split('-')[0] || '';
  }

  function fitSelectedLEHRegion() {
    try {
      if (typeof fullMapProvince === 'undefined' || fullMapProvince !== 'BC') return;
      if (typeof fullMapSelRegions === 'undefined' || !fullMapSelRegions || fullMapSelRegions.size < 2) return;
      if (typeof fullMapSelectedWMU !== 'undefined' && fullMapSelectedWMU) return;
      if (typeof fullMapInstance === 'undefined' || !fullMapInstance) return;
      if (typeof turf === 'undefined') return;

      var ids = Array.from(fullMapSelRegions).map(String);
      var regionKeys = Array.from(new Set(ids.map(regionForWMU).filter(Boolean)));
      if (regionKeys.length !== 1) return;

      var geo = (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON) ||
        (typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON) || null;
      if (!geo || !Array.isArray(geo.features)) return;

      var selected = new Set(ids);
      var features = geo.features.filter(function (feature) {
        return selected.has(String(feature && feature.properties && feature.properties.wmu_id || ''));
      });
      if (!features.length) return;

      var box = turf.bbox({ type:'FeatureCollection', features:features });
      var mobile = isMobile();
      fullMapInstance.fitBounds([[box[0],box[1]],[box[2],box[3]]], {
        padding: mobile ? { top:90, bottom:90, left:46, right:46 } : { top:90, bottom:70, left:70, right:410 },
        maxZoom: 8.8,
        duration: 650
      });
    } catch (error) {
      console.warn('[Interactive Map] Could not settle LEH region view', error);
    }
  }

  function settleLEHView() {
    ensureWorldSettingsCompatibility();
    hideLegacyMobileProvinceControls();
    forceCloseLegacyMobileModals();
    forceCloseMobileDrawer();
    fitSelectedLEHRegion();
    try {
      if (typeof fullMapInstance !== 'undefined' && fullMapInstance) fullMapInstance.resize();
    } catch (_) {}
  }

  function injectGuardStyles() {
    if (document.getElementById('hsInteractiveMapGuardStyles')) return;
    var style = document.createElement('style');
    style.id = 'hsInteractiveMapGuardStyles';
    style.textContent = [
      '@media (max-width:768px){',
      '#hsTpBC,#hsTpAB{display:none!important}',
      '#hsScrim:not(.hs-open),#hsModalScrim:not(.visible){display:none!important}',
      '#mapPage #fullMapResultsDrawer:not(.hs-drawer-open){display:none!important}',
      '#mapPage #fullMapResultsDrawer.hs-drawer-open{display:flex!important}',
      '}'
    ].join('');
    document.head.appendChild(style);
  }

  function patchPublicController() {
    var api = window.__HUNTSMART_INTERACTIVE_MAP__;
    if (!api || api.__finalizerPatched) return false;
    api.__finalizerPatched = true;

    var originalSwitchMode = api.switchMode;
    if (typeof originalSwitchMode === 'function') {
      api.switchMode = function (mode) {
        var result = originalSwitchMode.apply(this, arguments);
        if (mode === 'leh') {
          setTimeout(settleLEHView, 250);
          setTimeout(settleLEHView, 700);
        }
        return result;
      };
    }

    var originalOpen = api.open;
    if (typeof originalOpen === 'function') {
      api.open = function (mode, options) {
        var result = originalOpen.apply(this, arguments);
        if (mode === 'leh') {
          setTimeout(settleLEHView, 250);
          setTimeout(settleLEHView, 700);
        }
        return result;
      };
    }
    return true;
  }

  function onModeClick(event) {
    var button = event.target && event.target.closest ? event.target.closest('[data-hs-im-mode="leh"]') : null;
    if (!button) return;
    setTimeout(settleLEHView, 250);
    setTimeout(settleLEHView, 700);
  }

  function boot() {
    injectGuardStyles();
    ensureWorldSettingsCompatibility();
    hideLegacyMobileProvinceControls();
    forceCloseLegacyMobileModals();
    enforceMobileDrawerContract();
    patchPublicController();
    document.addEventListener('click', onModeClick, true);

    [50,250,700,1200,2200].forEach(function (delay) {
      setTimeout(function () {
        patchPublicController();
        ensureWorldSettingsCompatibility();
        hideLegacyMobileProvinceControls();
        forceCloseLegacyMobileModals();
        enforceMobileDrawerContract();
      }, delay);
    });

    window.addEventListener('resize', function () {
      ensureWorldSettingsCompatibility();
      hideLegacyMobileProvinceControls();
      forceCloseLegacyMobileModals();
      enforceMobileDrawerContract();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
