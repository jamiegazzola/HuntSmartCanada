/* HuntSmart Terrain Intelligence — preview pilot
   General-purpose terrain analysis for the HuntSmart Mapbox map.
   Pilot context: Chehalis hunt code 2110 (MU 2-19, Zone A).
*/
(function () {
  'use strict';

  const IDS = {
    source: 'hs-terrain-analysis-src',
    fill: 'hs-terrain-analysis-fill',
    outline: 'hs-terrain-analysis-outline',
    hillshade: 'hs-terrain-hillshade'
  };
  const PILOT = {
    code: '2110',
    name: 'Chehalis',
    mu: '2-19',
    zone: 'A',
    species: 'Roosevelt Elk',
    dates: 'Oct 10–31'
  };

  let map = null;
  let panel = null;
  let launch = null;
  let analysisGeoJSON = null;
  let activeMode = '';
  let analysisBusy = false;
  let inspectMode = false;
  let inspectorHandler = null;
  let popup = null;
  let lastElevationRange = null;
  let hillshadeOn = false;
  let bootTimer = null;

  function getMap() {
    try {
      if (typeof fullMapInstance !== 'undefined' && fullMapInstance) return fullMapInstance;
    } catch (e) {}
    return null;
  }

  function mapPageVisible() {
    const page = document.getElementById('mapPage');
    return !!(page && page.style.display !== 'none');
  }

  function status(message, tone) {
    const el = document.getElementById('hsTerrainStatus');
    if (!el) return;
    el.textContent = message;
    el.dataset.tone = tone || '';
  }

  function setBusy(on) {
    analysisBusy = !!on;
    const buttons = document.querySelectorAll('[data-hs-terrain-action]');
    buttons.forEach(function (btn) { btn.disabled = analysisBusy; });
    const run = document.getElementById('hsTerrainCommandRun');
    if (run) run.disabled = analysisBusy;
  }

  function getContainer() {
    return document.getElementById('fullMapLeaflet');
  }

  function ensureUI() {
    const container = getContainer();
    if (!container || !mapPageVisible()) return;

    if (!launch || !launch.isConnected) {
      launch = document.createElement('button');
      launch.type = 'button';
      launch.id = 'hsTerrainLaunch';
      launch.className = 'hs-terrain-launch';
      launch.innerHTML = '<span class="hs-terrain-launch-dot"></span><span>Terrain Lab</span>';
      launch.onclick = function () {
        ensurePanel();
        panel.classList.toggle('open');
        launch.classList.toggle('active', panel.classList.contains('open'));
      };
      container.appendChild(launch);
    }

    if (panel && !panel.isConnected) panel = null;
  }

  function ensurePanel() {
    const container = getContainer();
    if (!container) return;
    if (panel && panel.isConnected) return;

    panel = document.createElement('section');
    panel.id = 'hsTerrainPanel';
    panel.className = 'hs-terrain-panel';
    panel.setAttribute('aria-label', 'Terrain intelligence');
    panel.innerHTML =
      '<div class="hs-terrain-head">' +
        '<div>' +
          '<div class="hs-terrain-kicker">CHEHALIS 2110 PILOT</div>' +
          '<div class="hs-terrain-title">Terrain Intelligence</div>' +
          '<div class="hs-terrain-sub">MU ' + PILOT.mu + ' · Zone ' + PILOT.zone + ' · ' + PILOT.dates + '</div>' +
        '</div>' +
        '<button type="button" class="hs-terrain-close" aria-label="Close terrain panel">×</button>' +
      '</div>' +

      '<div class="hs-terrain-command-wrap">' +
        '<div class="hs-terrain-label">Terrain command <span>beta</span></div>' +
        '<div class="hs-terrain-command">' +
          '<input id="hsTerrainCommandInput" type="text" autocomplete="off" placeholder="e.g. show steep terrain" />' +
          '<button id="hsTerrainCommandRun" type="button">Run</button>' +
        '</div>' +
        '<div class="hs-terrain-examples">Try “north-facing slopes”, “gentle terrain”, “elevation 500 1000”, or “inspect terrain”.</div>' +
      '</div>' +

      '<div class="hs-terrain-grid">' +
        '<button type="button" data-hs-terrain-action="slope"><b>Slope</b><span>0° → 45°+</span></button>' +
        '<button type="button" data-hs-terrain-action="north"><b>North aspect</b><span>N-facing terrain</span></button>' +
        '<button type="button" data-hs-terrain-action="gentle"><b>Gentle</b><span>≤ 12°</span></button>' +
        '<button type="button" data-hs-terrain-action="steep"><b>Steep</b><span>≥ 30°</span></button>' +
      '</div>' +

      '<div class="hs-terrain-row">' +
        '<button type="button" id="hsTerrainInspectBtn" class="hs-terrain-secondary">Inspect point</button>' +
        '<button type="button" id="hsTerrainHillshadeBtn" class="hs-terrain-secondary">Hillshade</button>' +
        '<button type="button" id="hsTerrainClearBtn" class="hs-terrain-secondary">Clear</button>' +
      '</div>' +

      '<div class="hs-terrain-readout" id="hsTerrainReadout">' +
        '<div><span>Elevation</span><b>—</b></div>' +
        '<div><span>Slope</span><b>—</b></div>' +
        '<div><span>Aspect</span><b>—</b></div>' +
      '</div>' +

      '<div id="hsTerrainStatus" class="hs-terrain-status">Zoom into an area, then run a terrain layer.</div>' +
      '<div class="hs-terrain-foot">Live DEM analysis · Mapbox Terrain-DEM · preview only</div>';

    container.appendChild(panel);

    panel.querySelector('.hs-terrain-close').onclick = function () {
      panel.classList.remove('open');
      if (launch) launch.classList.remove('active');
    };

    panel.querySelectorAll('[data-hs-terrain-action]').forEach(function (btn) {
      btn.onclick = function () { runAnalysis(btn.dataset.hsTerrainAction); };
    });

    document.getElementById('hsTerrainInspectBtn').onclick = function () { setInspectMode(!inspectMode); };
    document.getElementById('hsTerrainHillshadeBtn').onclick = function () { setHillshade(!hillshadeOn); };
    document.getElementById('hsTerrainClearBtn').onclick = clearAnalysis;
    document.getElementById('hsTerrainCommandRun').onclick = runCommand;
    document.getElementById('hsTerrainCommandInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') runCommand();
    });
  }

  function setActiveButton(mode) {
    document.querySelectorAll('[data-hs-terrain-action]').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.hsTerrainAction === mode);
    });
  }

  function ensureDem(currentMap) {
    if (!currentMap || typeof currentMap.addSource !== 'function') return false;
    try {
      if (!currentMap.getSource('mapbox-dem')) {
        currentMap.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14
        });
      }
      if (typeof currentMap.getTerrain === 'function' && !currentMap.getTerrain()) {
        currentMap.setTerrain({ source: 'mapbox-dem', exaggeration: 1.0 });
      }
      return true;
    } catch (e) {
      console.warn('[Terrain Intelligence] DEM setup failed', e);
      return false;
    }
  }

  function waitForTerrain(currentMap) {
    return new Promise(function (resolve) {
      let done = false;
      const finish = function () {
        if (done) return;
        done = true;
        resolve();
      };
      try { currentMap.once('idle', finish); } catch (e) {}
      setTimeout(finish, 1200);
    });
  }

  function elevationAt(currentMap, lng, lat) {
    try {
      const v = currentMap.queryTerrainElevation({ lng: lng, lat: lat }, { exaggerated: false });
      return Number.isFinite(v) ? v : null;
    } catch (e) {
      return null;
    }
  }

  function aspectLabel(deg) {
    if (!Number.isFinite(deg)) return '—';
    const labels = ['N','NE','E','SE','S','SW','W','NW'];
    return labels[Math.round(deg / 45) % 8];
  }

  function terrainMetrics(currentMap, lng, lat, sampleMeters) {
    const m = Math.max(35, sampleMeters || 80);
    const dLat = m / 111320;
    const cosLat = Math.max(0.2, Math.cos(lat * Math.PI / 180));
    const dLng = m / (111320 * cosLat);

    const c = elevationAt(currentMap, lng, lat);
    const e = elevationAt(currentMap, lng + dLng, lat);
    const w = elevationAt(currentMap, lng - dLng, lat);
    const n = elevationAt(currentMap, lng, lat + dLat);
    const s = elevationAt(currentMap, lng, lat - dLat);
    if (![c, e, w, n, s].every(Number.isFinite)) return null;

    const dzdx = (e - w) / (2 * m);
    const dzdy = (n - s) / (2 * m);
    const slope = Math.atan(Math.hypot(dzdx, dzdy)) * 180 / Math.PI;
    const downhillEast = -dzdx;
    const downhillNorth = -dzdy;
    const aspect = (Math.atan2(downhillEast, downhillNorth) * 180 / Math.PI + 360) % 360;

    return {
      elevation: c,
      slope: slope,
      aspect: aspect,
      aspectClass: aspectLabel(aspect)
    };
  }

  function analysisResolution(currentMap) {
    const z = currentMap.getZoom ? currentMap.getZoom() : 10;
    if (z >= 13) return { cols: 14, rows: 14, sampleMeters: 45 };
    if (z >= 11) return { cols: 13, rows: 13, sampleMeters: 70 };
    return { cols: 11, rows: 11, sampleMeters: 110 };
  }

  function makeGrid(currentMap, mode, elevationRange) {
    const bounds = currentMap.getBounds();
    const west = bounds.getWest();
    const east = bounds.getEast();
    const south = bounds.getSouth();
    const north = bounds.getNorth();
    const cfg = analysisResolution(currentMap);
    const dx = (east - west) / cfg.cols;
    const dy = (north - south) / cfg.rows;
    const features = [];
    let minElev = Infinity;
    let maxElev = -Infinity;

    for (let row = 0; row < cfg.rows; row++) {
      for (let col = 0; col < cfg.cols; col++) {
        const x0 = west + col * dx;
        const x1 = x0 + dx;
        const y0 = south + row * dy;
        const y1 = y0 + dy;
        const lng = (x0 + x1) / 2;
        const lat = (y0 + y1) / 2;
        const metrics = terrainMetrics(currentMap, lng, lat, cfg.sampleMeters);
        if (!metrics) continue;

        minElev = Math.min(minElev, metrics.elevation);
        maxElev = Math.max(maxElev, metrics.elevation);

        let include = true;
        if (mode === 'gentle') include = metrics.slope <= 12;
        if (mode === 'steep') include = metrics.slope >= 30;
        if (mode === 'north') include = metrics.aspect >= 315 || metrics.aspect <= 45;
        if (mode === 'elevation' && elevationRange) {
          include = metrics.elevation >= elevationRange.min && metrics.elevation <= elevationRange.max;
        }
        if (!include) continue;

        features.push({
          type: 'Feature',
          properties: {
            slope: Number(metrics.slope.toFixed(2)),
            aspect: Number(metrics.aspect.toFixed(1)),
            aspectClass: metrics.aspectClass,
            elevation: Math.round(metrics.elevation)
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[[x0,y0],[x1,y0],[x1,y1],[x0,y1],[x0,y0]]]
          }
        });
      }
    }

    lastElevationRange = Number.isFinite(minElev) ? { min: minElev, max: maxElev } : null;
    return { type: 'FeatureCollection', features: features };
  }

  function layerPaint(mode) {
    if (mode === 'slope') {
      return {
        'fill-color': ['interpolate', ['linear'], ['get','slope'],
          0, '#27ae60',
          12, '#d4ac0d',
          25, '#e67e22',
          40, '#c0392b',
          55, '#7d3c98'],
        'fill-opacity': 0.42
      };
    }
    if (mode === 'north') return { 'fill-color': '#2f80ed', 'fill-opacity': 0.34 };
    if (mode === 'gentle') return { 'fill-color': '#2ecc71', 'fill-opacity': 0.32 };
    if (mode === 'steep') return { 'fill-color': '#e74c3c', 'fill-opacity': 0.38 };
    if (mode === 'elevation') return { 'fill-color': '#f2c94c', 'fill-opacity': 0.34 };
    return { 'fill-color': '#ffffff', 'fill-opacity': 0.25 };
  }

  function renderAnalysis(currentMap, mode) {
    if (!analysisGeoJSON) return;
    try {
      if (currentMap.getSource(IDS.source)) {
        currentMap.getSource(IDS.source).setData(analysisGeoJSON);
      } else {
        currentMap.addSource(IDS.source, { type: 'geojson', data: analysisGeoJSON });
      }

      if (!currentMap.getLayer(IDS.fill)) {
        currentMap.addLayer({
          id: IDS.fill,
          type: 'fill',
          source: IDS.source,
          slot: 'middle',
          paint: layerPaint(mode)
        });
      } else {
        const paint = layerPaint(mode);
        Object.keys(paint).forEach(function (key) {
          currentMap.setPaintProperty(IDS.fill, key, paint[key]);
        });
      }

      if (!currentMap.getLayer(IDS.outline)) {
        currentMap.addLayer({
          id: IDS.outline,
          type: 'line',
          source: IDS.source,
          slot: 'middle',
          paint: {
            'line-color': 'rgba(255,255,255,.18)',
            'line-width': 0.45
          }
        });
      }
    } catch (e) {
      console.warn('[Terrain Intelligence] render failed', e);
    }
  }

  async function runAnalysis(mode, elevationRange) {
    const currentMap = getMap();
    if (!currentMap) {
      status('Open the main map first.', 'warn');
      return;
    }
    ensurePanel();
    if (analysisBusy) return;
    if (currentMap.getZoom && currentMap.getZoom() < 8) {
      status('Zoom in farther before analyzing terrain.', 'warn');
      return;
    }

    setBusy(true);
    status('Sampling elevation and terrain shape…');
    if (!ensureDem(currentMap)) {
      setBusy(false);
      status('Terrain data could not be initialized.', 'warn');
      return;
    }
    await waitForTerrain(currentMap);

    analysisGeoJSON = makeGrid(currentMap, mode, elevationRange || null);
    activeMode = mode;
    renderAnalysis(currentMap, mode);
    setActiveButton(mode);
    setBusy(false);

    const count = analysisGeoJSON.features.length;
    if (!count) {
      status('No sampled cells matched this filter in the current view.', 'warn');
      return;
    }
    const rangeText = lastElevationRange
      ? ' · ' + Math.round(lastElevationRange.min) + '–' + Math.round(lastElevationRange.max) + ' m sampled'
      : '';
    status(count + ' terrain cells highlighted' + rangeText, 'ok');
  }

  function setHillshade(on) {
    const currentMap = getMap();
    if (!currentMap) return;
    hillshadeOn = !!on;
    if (hillshadeOn) {
      ensureDem(currentMap);
      try {
        if (!currentMap.getLayer(IDS.hillshade)) {
          currentMap.addLayer({
            id: IDS.hillshade,
            type: 'hillshade',
            source: 'mapbox-dem',
            slot: 'middle',
            paint: {
              'hillshade-exaggeration': 0.55,
              'hillshade-shadow-color': '#0b0d0f',
              'hillshade-highlight-color': '#ffffff',
              'hillshade-accent-color': '#4b5563'
            }
          });
        }
      } catch (e) { console.warn('[Terrain Intelligence] hillshade failed', e); }
    } else {
      try { if (currentMap.getLayer(IDS.hillshade)) currentMap.removeLayer(IDS.hillshade); } catch (e) {}
    }
    const btn = document.getElementById('hsTerrainHillshadeBtn');
    if (btn) btn.classList.toggle('active', hillshadeOn);
    status(hillshadeOn ? 'Hillshade on.' : 'Hillshade off.', 'ok');
  }

  function updateReadout(metrics) {
    const el = document.getElementById('hsTerrainReadout');
    if (!el || !metrics) return;
    const vals = el.querySelectorAll('b');
    if (vals[0]) vals[0].textContent = Math.round(metrics.elevation) + ' m';
    if (vals[1]) vals[1].textContent = metrics.slope.toFixed(1) + '°';
    if (vals[2]) vals[2].textContent = metrics.aspectClass + ' · ' + Math.round(metrics.aspect) + '°';
  }

  function setInspectMode(on) {
    const currentMap = getMap();
    if (!currentMap) return;
    inspectMode = !!on;
    const btn = document.getElementById('hsTerrainInspectBtn');
    if (btn) btn.classList.toggle('active', inspectMode);

    if (inspectorHandler) {
      try { currentMap.off('click', inspectorHandler); } catch (e) {}
      inspectorHandler = null;
    }

    if (!inspectMode) {
      status('Point inspection off.');
      return;
    }

    ensureDem(currentMap);
    inspectorHandler = async function (e) {
      await waitForTerrain(currentMap);
      const metrics = terrainMetrics(currentMap, e.lngLat.lng, e.lngLat.lat, 55);
      if (!metrics) {
        status('Terrain value not loaded here yet.', 'warn');
        return;
      }
      updateReadout(metrics);
      status('Terrain point sampled.', 'ok');
      try {
        if (popup) popup.remove();
        popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 12 })
          .setLngLat(e.lngLat)
          .setHTML('<div class="hs-terrain-popup"><b>' + Math.round(metrics.elevation) + ' m</b><span>' + metrics.slope.toFixed(1) + '° slope · ' + metrics.aspectClass + ' aspect</span></div>')
          .addTo(currentMap);
      } catch (err) {}
    };
    currentMap.on('click', inspectorHandler);
    status('Tap or click the map to inspect elevation, slope and aspect.', 'ok');
  }

  function clearAnalysis() {
    const currentMap = getMap();
    activeMode = '';
    analysisGeoJSON = null;
    setActiveButton('');
    if (currentMap) {
      try { if (currentMap.getLayer(IDS.outline)) currentMap.removeLayer(IDS.outline); } catch (e) {}
      try { if (currentMap.getLayer(IDS.fill)) currentMap.removeLayer(IDS.fill); } catch (e) {}
      try { if (currentMap.getSource(IDS.source)) currentMap.removeSource(IDS.source); } catch (e) {}
    }
    status('Terrain overlay cleared.');
  }

  function parseElevationCommand(text) {
    const nums = text.match(/-?\d+(?:\.\d+)?/g);
    if (!nums || nums.length < 2) return null;
    const a = Number(nums[0]);
    const b = Number(nums[1]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    return { min: Math.min(a,b), max: Math.max(a,b) };
  }

  function runCommand() {
    const input = document.getElementById('hsTerrainCommandInput');
    const raw = input ? input.value.trim() : '';
    const text = raw.toLowerCase();
    if (!text) return;

    if (/clear|remove|off|reset/.test(text)) { clearAnalysis(); return; }
    if (/inspect|sample|point/.test(text)) { setInspectMode(true); return; }
    if (/hillshade|relief/.test(text)) { setHillshade(true); return; }
    if (/north|n-facing|north-facing/.test(text)) { runAnalysis('north'); return; }
    if (/gentle|flat|low slope|low-slope|bench/.test(text)) { runAnalysis('gentle'); return; }
    if (/steep|high slope|high-slope/.test(text)) { runAnalysis('steep'); return; }
    if (/elevation|altitude|metres|meters|\bm\b/.test(text)) {
      const range = parseElevationCommand(text);
      if (range) { runAnalysis('elevation', range); return; }
      status('Give an elevation range in metres, e.g. “elevation 500 1000”.', 'warn');
      return;
    }
    if (/slope|terrain/.test(text)) { runAnalysis('slope'); return; }
    if (/cutblock|clearcut|forest age|harvest age/.test(text)) {
      status('Cutblock age needs the forestry-age data layer. That is the next data integration, not simulated here.', 'warn');
      return;
    }
    status('Terrain beta understands slope, steep, gentle, north aspect, elevation ranges, hillshade and inspect.', 'warn');
  }

  function attachMap(nextMap) {
    if (!nextMap || nextMap === map) return;
    if (map && inspectorHandler) {
      try { map.off('click', inspectorHandler); } catch (e) {}
    }
    map = nextMap;
    inspectorHandler = null;
    inspectMode = false;

    if (!map.__hsTerrainIntelligenceBound) {
      map.__hsTerrainIntelligenceBound = true;
      try {
        map.on('style.load', function () {
          setTimeout(function () {
            if (hillshadeOn) setHillshade(true);
            if (analysisGeoJSON && activeMode) renderAnalysis(map, activeMode);
          }, 250);
        });
      } catch (e) {}
      try {
        map.on('moveend', function () {
          if (activeMode && panel && panel.classList.contains('open')) {
            status('Map moved — rerun the terrain layer to analyze this view.');
          }
        });
      } catch (e) {}
    }
    ensureUI();
  }

  function boot() {
    clearInterval(bootTimer);
    bootTimer = setInterval(function () {
      const nextMap = getMap();
      if (nextMap) attachMap(nextMap);
      if (mapPageVisible()) ensureUI();
    }, 650);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.hsTerrainPilot = {
    pilot: PILOT,
    run: runAnalysis,
    clear: clearAnalysis,
    inspect: setInspectMode,
    hillshade: setHillshade
  };
})();
