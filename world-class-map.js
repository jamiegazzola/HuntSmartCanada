/* HuntSmart World-Class Map UX — preview only
   Preserves the feature-complete preview map and modernizes its Mapbox layer. */
(function () {
  'use strict';

  const STANDARD_SATELLITE = 'mapbox://styles/mapbox/standard-satellite';
  const STORE_KEY = 'huntsmart_world_map_v1';
  const FIRST_RUN_KEY = 'huntsmart_world_map_seen_v1';
  const DEFAULTS = {
    roads: true,
    trails: true,
    labels: true,
    poi: false,
    light: 'day',
    basemap: 'satellite'
  };

  let settings = loadSettings();
  let toastTimer = null;
  let desktopPanel = null;
  let settingsButton = null;
  let observedMap = null;
  let resizeObserver = null;

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return Object.assign({}, DEFAULTS);
      return Object.assign({}, DEFAULTS, JSON.parse(raw));
    } catch (e) {
      return Object.assign({}, DEFAULTS);
    }
  }

  function saveSettings() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(settings)); } catch (e) {}
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function currentBasemap() {
    try { return _fullMapStyle || settings.basemap || 'satellite'; } catch (e) { return settings.basemap || 'satellite'; }
  }

  function current3D() {
    try { return !!_fullMapTerrain3D; } catch (e) { return false; }
  }

  function isStandardMap(map) {
    if (!map || typeof map.getStyle !== 'function') return false;
    try {
      const style = map.getStyle();
      if (!style) return false;
      if (Array.isArray(style.imports)) {
        return style.imports.some(function (item) {
          return /standard-satellite|standard/.test(String((item && item.url) || ''));
        });
      }
      return /standard-satellite|standard/.test(String(style.name || ''));
    } catch (e) {
      return false;
    }
  }

  function safeConfig(map, key, value) {
    if (!map || typeof map.setConfigProperty !== 'function') return;
    try { map.setConfigProperty('basemap', key, value); } catch (e) {}
  }

  function applySatelliteConfig(map) {
    if (!map || !isStandardMap(map)) return;
    safeConfig(map, 'showRoadsAndTransit', !!settings.roads);
    safeConfig(map, 'showPedestrianRoads', !!settings.trails);
    safeConfig(map, 'showPlaceLabels', !!settings.labels);
    safeConfig(map, 'showRoadLabels', !!settings.labels);
    safeConfig(map, 'showPointOfInterestLabels', !!settings.poi);
    safeConfig(map, 'showTransitLabels', false);
    safeConfig(map, 'lightPreset', settings.light || 'day');
  }

  function announce(message) {
    let toast = document.getElementById('hsWorldMapToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'hsWorldMapToast';
      toast.className = 'hs-wc-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 1700);
  }

  function patchMapboxLayerSlots() {
    if (!window.mapboxgl || !mapboxgl.Map || !mapboxgl.Map.prototype) return;
    const proto = mapboxgl.Map.prototype;
    if (proto.__hsWorldSlotsPatched) return;
    const originalAddLayer = proto.addLayer;
    if (typeof originalAddLayer !== 'function') return;

    proto.addLayer = function (layer, beforeId) {
      let nextLayer = layer;
      let nextBefore = beforeId;
      try {
        const id = String((layer && layer.id) || '');
        const isHSOverlay = /^(wmu-|leh-|card-(ctx|zone)-)/.test(id);
        if (isHSOverlay && isStandardMap(this) && layer && !layer.slot) {
          nextLayer = Object.assign({}, layer, {
            slot: layer.type === 'symbol' ? 'top' : 'middle'
          });
          if (nextBefore && !this.getLayer(nextBefore)) nextBefore = undefined;
        }
      } catch (e) {}
      return originalAddLayer.call(this, nextLayer, nextBefore);
    };
    proto.__hsWorldSlotsPatched = true;
  }

  function modernizeGlobals() {
    try {
      if (typeof _MB_STYLES !== 'undefined' && _MB_STYLES) {
        _MB_STYLES.satellite = STANDARD_SATELLITE;
      }
    } catch (e) {}

    // First visit to this preview opens on the feature we are evaluating.
    try {
      if (!localStorage.getItem(FIRST_RUN_KEY)) {
        if (typeof _fullMapStyle !== 'undefined') _fullMapStyle = 'satellite';
        settings.basemap = 'satellite';
        saveSettings();
        localStorage.setItem(FIRST_RUN_KEY, '1');
      } else if (typeof _fullMapStyle !== 'undefined' && settings.basemap) {
        _fullMapStyle = settings.basemap;
      }
    } catch (e) {}
  }

  function patchTerrain() {
    try {
      if (typeof _applyTerrain !== 'function' || _applyTerrain.__hsWorldPatched) return;
      const modernTerrain = function (on) {
        let map = null;
        try { map = fullMapInstance; } catch (e) {}
        if (!map) return;

        if (on) {
          try {
            if (!map.getSource('mapbox-dem')) {
              map.addSource('mapbox-dem', {
                type: 'raster-dem',
                url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
                tileSize: 512,
                maxzoom: 14
              });
            }
            // More natural than the old 1.6x exaggeration while keeping relief readable.
            map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.25 });
            if (map.getLayer && map.getLayer('sky')) {
              try { map.removeLayer('sky'); } catch (e) {}
            }
            map.easeTo({ pitch: 54, bearing: -8, duration: 760, essential: true });
          } catch (e) {
            console.warn('[HuntSmart World Map] terrain enable failed', e);
          }
        } else {
          try {
            map.setTerrain(null);
            if (map.getLayer && map.getLayer('sky')) {
              try { map.removeLayer('sky'); } catch (e) {}
            }
            map.easeTo({ pitch: 0, bearing: 0, duration: 520, essential: true });
          } catch (e) {}
        }
        setTimeout(function () { applySatelliteConfig(map); }, 0);
      };
      modernTerrain.__hsWorldPatched = true;
      _applyTerrain = modernTerrain;
    } catch (e) {}
  }

  function patchBasemapSetter() {
    let original = null;
    try { original = fullMapSetTile; } catch (e) {}
    if (typeof original !== 'function' || original.__hsWorldPatched) return;

    const wrapped = function (type) {
      const normalized = type === 'streets' ? 'streets' : type === 'topo' ? 'topo' : 'satellite';
      try {
        if (typeof _MB_STYLES !== 'undefined' && _MB_STYLES) _MB_STYLES.satellite = STANDARD_SATELLITE;
      } catch (e) {}
      settings.basemap = normalized;
      saveSettings();
      const result = original.apply(this, arguments);
      setTimeout(function () {
        try { if (fullMapInstance) watchMap(fullMapInstance); } catch (e) {}
        syncWorldUI();
      }, 40);
      announce(normalized === 'satellite' ? 'Standard Satellite' : normalized === 'topo' ? 'Topo' : 'Dark map');
      return result;
    };
    wrapped.__hsWorldPatched = true;
    try { fullMapSetTile = wrapped; } catch (e) {}
    window.fullMapSetTile = wrapped;
  }

  function patch3DToggle() {
    let original = null;
    try { original = fullMapToggle3D; } catch (e) {}
    if (typeof original !== 'function' || original.__hsWorldPatched) return;

    const wrapped = function () {
      const result = original.apply(this, arguments);
      setTimeout(function () {
        syncWorldUI();
        try { if (fullMapInstance) applySatelliteConfig(fullMapInstance); } catch (e) {}
      }, 20);
      announce(current3D() ? '3D terrain on' : '2D map');
      return result;
    };
    wrapped.__hsWorldPatched = true;
    try { fullMapToggle3D = wrapped; } catch (e) {}
    window.fullMapToggle3D = wrapped;
  }

  function watchMap(map) {
    if (!map) return;
    if (observedMap === map && map.__hsWorldWatched) {
      applySatelliteConfig(map);
      return;
    }
    observedMap = map;
    if (!map.__hsWorldWatched) {
      map.__hsWorldWatched = true;
      try {
        map.on('style.load', function () {
          setTimeout(function () {
            applySatelliteConfig(map);
            syncWorldUI();
          }, 20);
        });
      } catch (e) {}
      try {
        map.on('load', function () {
          applySatelliteConfig(map);
          syncWorldUI();
        });
      } catch (e) {}
      try {
        map.on('error', function (evt) {
          const msg = evt && evt.error && evt.error.message ? evt.error.message : '';
          if (/token|401|403/i.test(msg)) announce('Map access problem — check Mapbox configuration');
        });
      } catch (e) {}
    }
    applySatelliteConfig(map);
  }

  function watchCardMaps() {
    try {
      if (typeof _lehCardMaps !== 'undefined' && _lehCardMaps) {
        Object.keys(_lehCardMaps).forEach(function (key) {
          const map = _lehCardMaps[key];
          if (map && !map.__hsWorldCardWatched) {
            map.__hsWorldCardWatched = true;
            try { map.on('style.load', function () { setTimeout(function () { applySatelliteConfig(map); }, 20); }); } catch (e) {}
            applySatelliteConfig(map);
          }
        });
      }
    } catch (e) {}
  }

  function setSatelliteOption(key, value) {
    settings[key] = value;
    saveSettings();
    try { if (fullMapInstance) applySatelliteConfig(fullMapInstance); } catch (e) {}
    watchCardMaps();
    renderAllSettings();
  }

  function applyPreset(name) {
    if (name === 'clean') {
      settings.roads = false;
      settings.trails = true;
      settings.labels = false;
      settings.poi = false;
      announce('Clean satellite preset');
    } else {
      settings.roads = true;
      settings.trails = true;
      settings.labels = true;
      settings.poi = false;
      announce('Context satellite preset');
    }
    saveSettings();
    try { if (fullMapInstance) applySatelliteConfig(fullMapInstance); } catch (e) {}
    renderAllSettings();
  }

  function setLight(preset) {
    if (!/^(dawn|day|dusk|night)$/.test(preset)) return;
    settings.light = preset;
    saveSettings();
    try { if (fullMapInstance) applySatelliteConfig(fullMapInstance); } catch (e) {}
    watchCardMaps();
    renderAllSettings();
    announce(preset.charAt(0).toUpperCase() + preset.slice(1) + ' lighting');
  }

  function setBase(type) {
    if (typeof window.fullMapSetTile === 'function') window.fullMapSetTile(type);
    else {
      try { if (typeof fullMapSetTile === 'function') fullMapSetTile(type); } catch (e) {}
    }
    renderAllSettings();
  }

  function set3D(on) {
    if (current3D() !== !!on) {
      if (typeof window.fullMapToggle3D === 'function') window.fullMapToggle3D();
      else { try { fullMapToggle3D(); } catch (e) {} }
    }
    renderAllSettings();
  }

  function setOverlayOpacity(value) {
    const n = Math.max(0, Math.min(100, Number(value) || 0));
    try {
      if (typeof fullMapSetLEHOpacity === 'function') fullMapSetLEHOpacity(n / 100);
    } catch (e) {}
    const vals = document.querySelectorAll('[data-hs-wc-opacity-value]');
    vals.forEach(function (el) { el.textContent = Math.round(100 - n) + '%'; });
  }

  function getOverlayVisibility() {
    try {
      if (typeof _fullMapWMUOpacity !== 'undefined') return Math.round(_fullMapWMUOpacity * 100);
    } catch (e) {}
    return 100;
  }

  function choice(label, active, action, extraClass) {
    return '<button type="button" class="hs-wc-choice ' + (extraClass || '') + (active ? ' active' : '') + '" onclick="' + action + '">' + esc(label) + '</button>';
  }

  function toggle(label, on, key, disabled) {
    const action = disabled ? '' : "hsWcToggleOption('" + key + "')";
    return '<button type="button" class="hs-wc-toggle' + (on ? ' on' : '') + '" ' +
      (disabled ? 'disabled' : 'onclick="' + action + '"') + '><span>' + esc(label) + '</span><span class="dot"></span></button>';
  }

  function settingsBodyHTML(forMobile) {
    const base = currentBasemap();
    const isSat = base === 'satellite';
    const is3D = current3D();
    const visibility = getOverlayVisibility();
    const sliderValue = 100 - visibility;
    const head = forMobile
      ? '<div class="hs-wc-modal-head"><div><div class="hs-wc-panel-title">Map settings</div><div class="hs-wc-panel-sub">Basemap, terrain and satellite detail</div></div><span class="hs-wc-standard-chip">Mapbox 3.30</span></div>'
      : '';

    return head + '<div class="hs-wc-panel-body">' +
      '<section class="hs-wc-section">' +
        '<div class="hs-wc-label"><span>Basemap</span>' + (isSat ? '<span class="hs-wc-live">Standard Satellite</span>' : '') + '</div>' +
        '<div class="hs-wc-seg three">' +
          choice('Satellite', base === 'satellite', "hsWcSetBase('satellite')", 'satellite') +
          choice('Topo', base === 'topo', "hsWcSetBase('topo')", '') +
          choice('Dark', base === 'streets', "hsWcSetBase('streets')", '') +
        '</div>' +
      '</section>' +

      '<section class="hs-wc-section">' +
        '<div class="hs-wc-label"><span>Terrain</span><span class="hs-wc-live">Natural relief</span></div>' +
        '<div class="hs-wc-seg two">' +
          choice('2D', !is3D, 'hsWcSet3D(false)', '') +
          choice('3D', is3D, 'hsWcSet3D(true)', '') +
        '</div>' +
        '<div class="hs-wc-note">3D uses a restrained 1.25× terrain exaggeration so slopes read clearly without looking artificial.</div>' +
      '</section>' +

      '<section class="hs-wc-section">' +
        '<div class="hs-wc-label"><span>Satellite detail</span><span class="hs-wc-standard-chip">Standard</span></div>' +
        '<div class="hs-wc-presets">' +
          '<button type="button" class="hs-wc-preset" ' + (isSat ? 'onclick="hsWcPreset(\'clean\')"' : 'disabled') + '>Clean</button>' +
          '<button type="button" class="hs-wc-preset" ' + (isSat ? 'onclick="hsWcPreset(\'context\')"' : 'disabled') + '>More context</button>' +
        '</div>' +
        '<div class="hs-wc-toggle-grid" style="margin-top:7px">' +
          toggle('Roads', !!settings.roads, 'roads', !isSat) +
          toggle('Trails', !!settings.trails, 'trails', !isSat) +
          toggle('Labels', !!settings.labels, 'labels', !isSat) +
          toggle('POIs', !!settings.poi, 'poi', !isSat) +
        '</div>' +
        (!isSat ? '<div class="hs-wc-note">Satellite detail controls become available on Standard Satellite.</div>' : '') +
      '</section>' +

      '<section class="hs-wc-section">' +
        '<div class="hs-wc-label"><span>Lighting</span><span class="hs-wc-live">' + esc(settings.light) + '</span></div>' +
        '<div class="hs-wc-seg four">' +
          choice('Dawn', settings.light === 'dawn', "hsWcSetLight('dawn')", '') +
          choice('Day', settings.light === 'day', "hsWcSetLight('day')", '') +
          choice('Dusk', settings.light === 'dusk', "hsWcSetLight('dusk')", '') +
          choice('Night', settings.light === 'night', "hsWcSetLight('night')", '') +
        '</div>' +
        '<div class="hs-wc-note">Lighting changes Standard Satellite immediately and does not change your selected WMU or camera position.</div>' +
      '</section>' +

      '<section class="hs-wc-section">' +
        '<div class="hs-wc-label"><span>Map overlays</span><span data-hs-wc-opacity-value class="hs-wc-live">' + visibility + '%</span></div>' +
        '<div class="hs-wc-slider-row">' +
          '<input type="range" min="0" max="100" step="1" value="' + sliderValue + '" oninput="hsWcSetOverlayOpacity(this.value)">' +
          '<span data-hs-wc-opacity-value class="hs-wc-slider-value">' + visibility + '%</span>' +
        '</div>' +
        '<div class="hs-wc-note">Reduce overlay fill when you want the underlying terrain and imagery to dominate.</div>' +
      '</section>' +
    '</div>';
  }

  function renderDesktopPanel() {
    if (!desktopPanel) return;
    desktopPanel.innerHTML = '<div class="hs-wc-panel-head">' +
      '<div><div class="hs-wc-panel-title">Map settings</div><div class="hs-wc-panel-sub">HuntSmart satellite & terrain</div></div>' +
      '<div style="display:flex;align-items:center;gap:7px"><span class="hs-wc-standard-chip">Mapbox 3.30</span><button type="button" class="hs-wc-close" onclick="hsWcCloseSettings()" aria-label="Close">×</button></div>' +
      '</div>' + settingsBodyHTML(false);
  }

  function renderMobileLayers() {
    const modal = document.getElementById('hsModal');
    if (!modal || modal.dataset.hsWorldLayers !== '1') return;
    modal.innerHTML = settingsBodyHTML(true);
  }

  function renderAllSettings() {
    renderDesktopPanel();
    renderMobileLayers();
    syncWorldUI();
  }

  function ensureDesktopSettings() {
    const page = document.querySelector('.fullmap-page');
    const toolbar = document.querySelector('.fullmap-toolbar-main-v4');
    const container = document.querySelector('.fullmap-container');
    if (!page || !toolbar || !container) return;
    page.classList.add('hs-world-map');

    const streets = document.getElementById('fullMapTile_streets');
    if (streets) { streets.textContent = 'Dark'; streets.title = 'Dark basemap'; }
    const satellite = document.getElementById('fullMapTile_satellite');
    if (satellite) satellite.title = 'Mapbox Standard Satellite';

    if (!document.getElementById('hsWorldSettingsBtn')) {
      settingsButton = document.createElement('button');
      settingsButton.type = 'button';
      settingsButton.id = 'hsWorldSettingsBtn';
      settingsButton.className = 'hs-wc-settings-btn';
      settingsButton.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="13" cy="18" r="2"/></svg><span>Settings</span>';
      settingsButton.onclick = function (evt) { evt.stopPropagation(); toggleDesktopSettings(); };
      const clearBtn = document.getElementById('fullMapClearBtn');
      toolbar.insertBefore(settingsButton, clearBtn || null);
    } else {
      settingsButton = document.getElementById('hsWorldSettingsBtn');
    }

    if (!document.getElementById('hsWorldSettingsPanel')) {
      desktopPanel = document.createElement('aside');
      desktopPanel.id = 'hsWorldSettingsPanel';
      desktopPanel.className = 'hs-wc-settings-panel';
      desktopPanel.setAttribute('aria-label', 'Map settings');
      container.appendChild(desktopPanel);
    } else {
      desktopPanel = document.getElementById('hsWorldSettingsPanel');
    }
    renderDesktopPanel();

    if (!resizeObserver && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(function () {
        try { if (fullMapInstance) fullMapInstance.resize(); } catch (e) {}
      });
      resizeObserver.observe(container);
    }
  }

  function toggleDesktopSettings() {
    ensureDesktopSettings();
    if (!desktopPanel) return;
    const opening = !desktopPanel.classList.contains('open');
    desktopPanel.classList.toggle('open', opening);
    if (settingsButton) settingsButton.classList.toggle('is-open', opening);
    if (opening) renderDesktopPanel();
  }

  function closeDesktopSettings() {
    if (desktopPanel) desktopPanel.classList.remove('open');
    if (settingsButton) settingsButton.classList.remove('is-open');
  }

  function patchMobileLayersModal() {
    const original = window.hsOpenModal;
    if (typeof original !== 'function' || original.__hsWorldPatched) return;
    const wrapped = function (type) {
      const result = original.apply(this, arguments);
      if (type === 'layers') {
        setTimeout(function () {
          const modal = document.getElementById('hsModal');
          if (modal) {
            modal.dataset.hsWorldLayers = '1';
            modal.innerHTML = settingsBodyHTML(true);
          }
        }, 0);
      } else {
        setTimeout(function () {
          const modal = document.getElementById('hsModal');
          if (modal) delete modal.dataset.hsWorldLayers;
        }, 0);
      }
      return result;
    };
    wrapped.__hsWorldPatched = true;
    window.hsOpenModal = wrapped;
    try { hsOpenModal = wrapped; } catch (e) {}
  }

  function syncWorldUI() {
    const page = document.querySelector('.fullmap-page');
    if (page) page.classList.add('hs-world-map');

    const base = currentBasemap();
    ['streets','satellite','topo'].forEach(function (name) {
      const el = document.getElementById('fullMapTile_' + name);
      if (el) el.classList.toggle('active', name === base);
    });
    const streets = document.getElementById('fullMapTile_streets');
    if (streets) streets.textContent = 'Dark';

    const quick3d = document.getElementById('fullMapMap3DToggleBtn');
    if (quick3d) {
      quick3d.classList.toggle('active', current3D());
      quick3d.classList.toggle('is-active', current3D());
      quick3d.textContent = current3D() ? '2D' : '3D';
      quick3d.setAttribute('aria-label', current3D() ? 'Switch to 2D map' : 'Switch to 3D terrain');
    }

    const mobile3d = document.getElementById('hs3DBtn');
    if (mobile3d) mobile3d.classList.toggle('is-active', current3D());

    const mobileStatus = document.getElementById('fmMobileStatusText');
    if (mobileStatus) {
      let province = 'BC';
      try { province = fullMapProvince || 'BC'; } catch (e) {}
      mobileStatus.textContent = province + ' · ' + (base === 'satellite' ? 'Satellite' : base === 'topo' ? 'Topo' : 'Dark') + ' · ' + (current3D() ? '3D' : '2D');
    }
  }

  // Public callbacks used by the injected UI.
  window.hsWcSetBase = setBase;
  window.hsWcSet3D = set3D;
  window.hsWcSetLight = setLight;
  window.hsWcPreset = applyPreset;
  window.hsWcSetOverlayOpacity = setOverlayOpacity;
  window.hsWcToggleOption = function (key) {
    if (!Object.prototype.hasOwnProperty.call(settings, key)) return;
    setSatelliteOption(key, !settings[key]);
  };
  window.hsWcCloseSettings = closeDesktopSettings;
  window.hsWcToggleSettings = toggleDesktopSettings;

  function install() {
    modernizeGlobals();
    patchMapboxLayerSlots();
    patchTerrain();
    patchBasemapSetter();
    patch3DToggle();
    patchMobileLayersModal();
    ensureDesktopSettings();
    syncWorldUI();

    // Map instances are created lazily when the Map page opens.
    setInterval(function () {
      try {
        if (fullMapInstance) watchMap(fullMapInstance);
      } catch (e) {}
      watchCardMaps();
      patchTerrain();
      patchBasemapSetter();
      patch3DToggle();
      patchMobileLayersModal();
      syncWorldUI();
    }, 650);

    document.addEventListener('click', function (evt) {
      if (!desktopPanel || !desktopPanel.classList.contains('open')) return;
      if (desktopPanel.contains(evt.target) || (settingsButton && settingsButton.contains(evt.target))) return;
      closeDesktopSettings();
    });
    document.addEventListener('keydown', function (evt) {
      if (evt.key === 'Escape') closeDesktopSettings();
    });

    const mapPage = document.getElementById('mapPage');
    if (mapPage && window.MutationObserver) {
      const obs = new MutationObserver(function () {
        if (mapPage.style.display !== 'none') {
          ensureDesktopSettings();
          syncWorldUI();
          setTimeout(function () {
            try { if (fullMapInstance) { fullMapInstance.resize(); watchMap(fullMapInstance); } } catch (e) {}
          }, 80);
        }
      });
      obs.observe(mapPage, { attributes: true, attributeFilter: ['style', 'class'] });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
