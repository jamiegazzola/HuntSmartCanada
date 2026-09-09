/* HuntSmart Imagery Lab — neutral basemap comparison for preview only.
   Compares imagery/rendering sources while preserving camera, 3D terrain,
   WMU/LEH overlays, search and map interaction. */
(function () {
  'use strict';

  const STORE_KEY = 'huntsmart_imagery_lab_v1';
  const BC_WMS = 'https://openmaps.gov.bc.ca/ecwp/ecw_wms.dll';
  const SOURCES = {
    standard: {
      label: 'Standard Satellite',
      short: 'Standard',
      provider: 'Mapbox',
      meta: 'Current global mosaic · capture date varies by tile',
      note: 'HuntSmart’s current satellite view with Mapbox Standard rendering.',
      type: 'builtin'
    },
    raw: {
      label: 'Raw Satellite',
      short: 'Raw',
      provider: 'Mapbox',
      meta: 'Same Mapbox satellite tiles · minimal styling',
      note: 'Useful for checking whether haze/softness comes from the source imagery or the Standard renderer.',
      type: 'style',
      style: 'mapbox://styles/mapbox/satellite-v9'
    },
    bcLower: {
      label: 'BC Lower Mainland',
      short: 'BC 0.5 m',
      provider: 'Province of B.C.',
      meta: '0.5 m orthophoto · 1999 · historical',
      note: 'Very sharp where covered, but much older than the current satellite mosaic. Sharpness is not recency.',
      type: 'wms',
      layer: 'bc_lowermainland_xc500mm_bcalb_1999',
      tileSize: 512
    },
    bcProvince: {
      label: 'BC Province Mosaic',
      short: 'BC 1 m',
      provider: 'Province of B.C.',
      meta: '1 m orthophoto · 1995–2004 · historical',
      note: 'Province-wide historical comparison layer. Use it to judge detail, not current ground conditions.',
      type: 'wms',
      layer: 'bc_bc_xc1m_bcalb_1995_2004',
      tileSize: 512
    }
  };

  let state = loadState();
  let map = null;
  let panel = null;
  let button = null;
  let internalStyleChange = false;
  let bootTimer = null;

  function loadState() {
    try {
      return Object.assign({ source: 'standard', preset: 'natural', opacity: 100 }, JSON.parse(localStorage.getItem(STORE_KEY) || '{}'));
    } catch (e) {
      return { source: 'standard', preset: 'natural', opacity: 100 };
    }
  }

  function saveState() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function currentMap() {
    try { return (typeof fullMapInstance !== 'undefined') ? fullMapInstance : null; } catch (e) { return null; }
  }

  function mapPageVisible() {
    const page = document.getElementById('mapPage');
    return !!(page && page.style.display !== 'none');
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function announce(message, tone) {
    const el = document.getElementById('hsImageryStatus');
    if (!el) return;
    el.textContent = message;
    el.dataset.tone = tone || '';
  }

  function wmsTile(layer, tileSize) {
    const size = tileSize || 512;
    return BC_WMS +
      '?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap' +
      '&LAYERS=' + encodeURIComponent(layer) +
      '&STYLES=&FORMAT=image/jpeg&TRANSPARENT=FALSE' +
      '&SRS=EPSG:3857&BBOX={bbox-epsg-3857}' +
      '&WIDTH=' + size + '&HEIGHT=' + size;
  }

  function rasterStyle(source) {
    const attribution = source.provider === 'Province of B.C.'
      ? 'Province of British Columbia'
      : 'Mapbox';
    return {
      version: 8,
      sources: {
        'hs-imagery-raster': {
          type: 'raster',
          tiles: [wmsTile(source.layer, source.tileSize)],
          tileSize: source.tileSize || 512,
          attribution: attribution
        }
      },
      layers: [{
        id: 'hs-imagery-raster-layer',
        type: 'raster',
        source: 'hs-imagery-raster',
        minzoom: 0,
        maxzoom: 22,
        paint: {
          'raster-fade-duration': 0,
          'raster-opacity': Math.max(0, Math.min(1, state.opacity / 100))
        }
      }]
    };
  }

  function captureCamera(m) {
    return {
      center: m.getCenter(),
      zoom: m.getZoom(),
      bearing: m.getBearing(),
      pitch: m.getPitch()
    };
  }

  function restoreOverlays(m, camera) {
    try { if (typeof _reAddWMULayers === 'function') _reAddWMULayers(); } catch (e) {}
    try { if (typeof _fullMapLEHVisible !== 'undefined' && _fullMapLEHVisible && typeof _reAddLEHLayer === 'function') _reAddLEHLayer(); } catch (e) {}

    let terrainOn = false;
    try { terrainOn = !!_fullMapTerrain3D; } catch (e) {}
    if (terrainOn) {
      try { if (typeof _applyTerrain === 'function') _applyTerrain(true); } catch (e) {}
      try { m.jumpTo(camera); } catch (e) {}
    } else {
      try { m.setTerrain(null); } catch (e) {}
      try { m.jumpTo({ center: camera.center, zoom: camera.zoom, bearing: 0, pitch: 0 }); } catch (e) {}
    }

    applyRasterPreset();
    renderPanel();
    syncButton();
  }

  function setCustomStyle(style, callback) {
    const m = currentMap();
    if (!m) return;
    const camera = captureCamera(m);
    internalStyleChange = true;
    try { m.setStyle(style); } catch (e) {
      internalStyleChange = false;
      announce('Could not load this imagery source.', 'warn');
      return;
    }
    let finished = false;
    const done = function () {
      if (finished) return;
      finished = true;
      internalStyleChange = false;
      restoreOverlays(m, camera);
      if (callback) callback();
    };
    try { m.once('style.load', done); } catch (e) {}
    setTimeout(done, 1800);
  }

  function setStandard() {
    const m = currentMap();
    if (!m) return;
    state.source = 'standard';
    saveState();
    internalStyleChange = true;
    try {
      if (typeof window.fullMapSetTile === 'function') window.fullMapSetTile('satellite');
      else if (typeof fullMapSetTile === 'function') fullMapSetTile('satellite');
    } catch (e) {
      internalStyleChange = false;
    }
    setTimeout(function () {
      internalStyleChange = false;
      renderPanel();
      syncButton();
      announce('Standard Satellite loaded.', 'ok');
    }, 700);
  }

  function setSource(key) {
    const source = SOURCES[key];
    const m = currentMap();
    if (!source || !m) return;
    state.source = key;
    saveState();
    renderPanel();
    syncButton();
    announce('Loading ' + source.label + '…');

    if (source.type === 'builtin') {
      setStandard();
      return;
    }

    if (source.type === 'style') {
      setCustomStyle(source.style, function () {
        announce(source.label + ' loaded — camera preserved.', 'ok');
      });
      return;
    }

    if (source.type === 'wms') {
      setCustomStyle(rasterStyle(source), function () {
        announce(source.label + ' loaded — historical imagery.', 'ok');
      });
    }
  }

  function rasterLayerId() {
    const m = currentMap();
    if (!m || !m.getStyle) return null;
    try {
      if (m.getLayer('hs-imagery-raster-layer')) return 'hs-imagery-raster-layer';
      const style = m.getStyle();
      const layers = style && style.layers ? style.layers : [];
      const raster = layers.find(function (layer) { return layer.type === 'raster'; });
      return raster ? raster.id : null;
    } catch (e) { return null; }
  }

  function applyRasterPreset() {
    const m = currentMap();
    const id = rasterLayerId();
    if (!m || !id) return;

    const p = state.preset || 'natural';
    const values = p === 'clear'
      ? { contrast: 0.22, saturation: 0.08, bmin: 0.03, bmax: 0.94 }
      : p === 'vivid'
        ? { contrast: 0.32, saturation: 0.22, bmin: 0.02, bmax: 0.96 }
        : { contrast: 0, saturation: 0, bmin: 0, bmax: 1 };

    try { m.setPaintProperty(id, 'raster-contrast', values.contrast); } catch (e) {}
    try { m.setPaintProperty(id, 'raster-saturation', values.saturation); } catch (e) {}
    try { m.setPaintProperty(id, 'raster-brightness-min', values.bmin); } catch (e) {}
    try { m.setPaintProperty(id, 'raster-brightness-max', values.bmax); } catch (e) {}
    try { m.setPaintProperty(id, 'raster-opacity', Math.max(0, Math.min(1, Number(state.opacity || 100) / 100))); } catch (e) {}
    try { m.setPaintProperty(id, 'raster-fade-duration', 0); } catch (e) {}
  }

  function setPreset(name) {
    state.preset = /^(natural|clear|vivid)$/.test(name) ? name : 'natural';
    saveState();
    applyRasterPreset();
    renderPanel();
    announce(state.preset === 'natural' ? 'Natural rendering.' : state.preset === 'clear' ? 'Clarity boost applied.' : 'Vivid rendering applied.', 'ok');
  }

  function setOpacity(value) {
    state.opacity = Math.max(20, Math.min(100, Number(value) || 100));
    saveState();
    applyRasterPreset();
    const out = document.getElementById('hsImageryOpacityValue');
    if (out) out.textContent = Math.round(state.opacity) + '%';
  }

  function sourceCard(key) {
    const s = SOURCES[key];
    const active = state.source === key;
    return '<button type="button" class="hs-img-source' + (active ? ' active' : '') + '" onclick="hsImagerySetSource(\'' + key + '\')">' +
      '<span class="hs-img-source-top"><b>' + esc(s.label) + '</b><em>' + esc(s.provider) + '</em></span>' +
      '<span class="hs-img-source-meta">' + esc(s.meta) + '</span>' +
      '<span class="hs-img-source-note">' + esc(s.note) + '</span>' +
      (active ? '<span class="hs-img-active-pill">ACTIVE</span>' : '') +
    '</button>';
  }

  function panelHTML() {
    const active = SOURCES[state.source] || SOURCES.standard;
    const rasterEditable = state.source !== 'standard';
    return '<div class="hs-img-head">' +
      '<div><div class="hs-img-kicker">PREVIEW COMPARISON</div><div class="hs-img-title">Imagery Lab</div><div class="hs-img-sub">Same camera. Same terrain. Different imagery.</div></div>' +
      '<button type="button" class="hs-img-close" onclick="hsImageryClose()" aria-label="Close">×</button>' +
    '</div>' +
    '<div class="hs-img-current"><span>Current source</span><b>' + esc(active.label) + '</b><small>' + esc(active.meta) + '</small></div>' +
    '<div class="hs-img-warning">Resolution and age are shown separately. A sharper historical orthophoto can be less useful than a newer satellite capture.</div>' +
    '<div class="hs-img-sources">' +
      sourceCard('standard') + sourceCard('raw') + sourceCard('bcLower') + sourceCard('bcProvince') +
    '</div>' +
    '<div class="hs-img-section">' +
      '<div class="hs-img-label"><span>Image rendering</span><span>' + (rasterEditable ? 'live' : 'use Settings for Standard') + '</span></div>' +
      '<div class="hs-img-seg">' +
        '<button ' + (!rasterEditable ? 'disabled ' : '') + 'class="' + (state.preset === 'natural' ? 'active' : '') + '" onclick="hsImageryPreset(\'natural\')">Natural</button>' +
        '<button ' + (!rasterEditable ? 'disabled ' : '') + 'class="' + (state.preset === 'clear' ? 'active' : '') + '" onclick="hsImageryPreset(\'clear\')">Clear</button>' +
        '<button ' + (!rasterEditable ? 'disabled ' : '') + 'class="' + (state.preset === 'vivid' ? 'active' : '') + '" onclick="hsImageryPreset(\'vivid\')">Vivid</button>' +
      '</div>' +
      '<div class="hs-img-opacity"><span>Raster opacity</span><input ' + (!rasterEditable ? 'disabled ' : '') + 'type="range" min="20" max="100" step="1" value="' + Math.round(state.opacity) + '" oninput="hsImageryOpacity(this.value)"><b id="hsImageryOpacityValue">' + Math.round(state.opacity) + '%</b></div>' +
    '</div>' +
    '<div id="hsImageryStatus" class="hs-img-status">Switch sources to compare the exact same view.</div>' +
    '<div class="hs-img-foot">B.C. layers are public WMS imagery and are marked historical by capture year.</div>';
  }

  function ensureUI() {
    const toolbar = document.querySelector('.fullmap-toolbar-main-v4');
    const container = document.querySelector('.fullmap-container');
    if (!toolbar || !container || !mapPageVisible()) return;

    if (!button || !button.isConnected) {
      button = document.createElement('button');
      button.type = 'button';
      button.id = 'hsImageryLabBtn';
      button.className = 'hs-img-toolbar-btn';
      button.innerHTML = '<span class="hs-img-toolbar-icon">◫</span><span>Imagery</span>';
      button.onclick = function (e) { e.stopPropagation(); togglePanel(); };
      const settings = document.getElementById('hsWorldSettingsBtn');
      if (settings && settings.parentNode === toolbar) toolbar.insertBefore(button, settings);
      else toolbar.appendChild(button);
    }

    if (!panel || !panel.isConnected) {
      panel = document.createElement('aside');
      panel.id = 'hsImageryPanel';
      panel.className = 'hs-img-panel';
      panel.setAttribute('aria-label', 'Imagery comparison');
      container.appendChild(panel);
    }
    renderPanel();
    syncButton();
  }

  function renderPanel() {
    if (panel && panel.isConnected) panel.innerHTML = panelHTML();
  }

  function syncButton() {
    if (!button) return;
    const s = SOURCES[state.source] || SOURCES.standard;
    button.title = 'Imagery Lab — ' + s.label;
    button.classList.toggle('is-custom', state.source !== 'standard');
  }

  function togglePanel() {
    ensureUI();
    if (!panel) return;
    panel.classList.toggle('open');
    button.classList.toggle('is-open', panel.classList.contains('open'));
    if (panel.classList.contains('open')) renderPanel();
  }

  function closePanel() {
    if (panel) panel.classList.remove('open');
    if (button) button.classList.remove('is-open');
  }

  function attach(nextMap) {
    if (!nextMap || nextMap === map) return;
    map = nextMap;
    if (!map.__hsImageryLabBound) {
      map.__hsImageryLabBound = true;
      try {
        map.on('style.load', function () {
          if (internalStyleChange) return;
          // A built-in basemap button was used outside Imagery Lab.
          state.source = 'standard';
          saveState();
          setTimeout(function () { renderPanel(); syncButton(); }, 60);
        });
      } catch (e) {}
    }
    ensureUI();
  }

  function boot() {
    if (bootTimer) clearInterval(bootTimer);
    bootTimer = setInterval(function () {
      const m = currentMap();
      if (m) attach(m);
      if (mapPageVisible()) ensureUI();
    }, 650);
  }

  window.hsImagerySetSource = setSource;
  window.hsImageryPreset = setPreset;
  window.hsImageryOpacity = setOpacity;
  window.hsImageryClose = closePanel;
  window.hsImageryLab = { sources: SOURCES, setSource: setSource, setPreset: setPreset };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
