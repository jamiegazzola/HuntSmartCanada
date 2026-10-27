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

  function ensureWorldSettingsCompatibility() {
    var toolbar = document.querySelector('#mapPage .fullmap-toolbar-main');
    var mapPage = document.getElementById('mapPage');
    if (!toolbar || !mapPage) return;

    // world-class-map.js still looks for the older v4 hook. Preserve the
    // current markup and provide the compatibility class instead of cloning UI.
    toolbar.classList.add('fullmap-toolbar-main-v4');

    var button = document.getElementById('hsWorldSettingsBtn');
    if (!button) {
      // Its MutationObserver watches mapPage class/style changes and will call
      // ensureDesktopSettings() once the compatibility hook exists.
      mapPage.classList.toggle('hs-world-settings-ready-pulse');
      setTimeout(function () {
        mapPage.classList.toggle('hs-world-settings-ready-pulse');
      }, 0);
      return;
    }

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
