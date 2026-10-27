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
      if (cluster) cluster.classList.remove('hs-hidden');
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
    if (cluster) cluster.classList.remove('hs-hidden');
    if (cards) cards.classList.remove('hs-active');
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
    hideLegacyMobileProvinceControls();
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
          setTimeout(settleLEHView, 350);
          setTimeout(settleLEHView, 850);
        }
        return result;
      };
    }

    var originalOpen = api.open;
    if (typeof originalOpen === 'function') {
      api.open = function (mode, options) {
        var result = originalOpen.apply(this, arguments);
        if (mode === 'leh') {
          setTimeout(settleLEHView, 350);
          setTimeout(settleLEHView, 850);
        }
        return result;
      };
    }
    return true;
  }

  function onModeClick(event) {
    var button = event.target && event.target.closest ? event.target.closest('[data-hs-im-mode="leh"]') : null;
    if (!button) return;
    setTimeout(settleLEHView, 350);
    setTimeout(settleLEHView, 850);
  }

  function boot() {
    injectGuardStyles();
    hideLegacyMobileProvinceControls();
    enforceMobileDrawerContract();
    patchPublicController();
    document.addEventListener('click', onModeClick, true);

    [250,700,1200,2200].forEach(function (delay) {
      setTimeout(function () {
        patchPublicController();
        hideLegacyMobileProvinceControls();
        enforceMobileDrawerContract();
      }, delay);
    });

    window.addEventListener('resize', function () {
      hideLegacyMobileProvinceControls();
      enforceMobileDrawerContract();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
