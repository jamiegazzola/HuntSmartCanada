(() => {
  'use strict';

  const APP_BUILD = 'species-map-rebuild-v12';
  window.__HUNTSMART_SPECIES_MAP_BUILD__ = APP_BUILD;
  const BOUNDS = { north: 60.1, south: 48.1, east: -113.8, west: -139.2 };
  const PALETTE = [
    [0, 0, 0, 0],
    [63, 150, 70, 190],
    [244, 208, 63, 200],
    [244, 139, 39, 210],
    [215, 48, 39, 220],
  ];
  const DEFAULT_RASTER_W = 260;
  const DEFAULT_RASTER_H = 123;
  const ASSET_REV = 'rebuild-20261031-11';

  const SPECIES = window.HUNTSMART_SPECIES;
  if (!Array.isArray(SPECIES) || !SPECIES.length) throw new Error('Species catalogue is unavailable.');

  // The source's legacy ECOTYPE field groups Southern Mountain DU7/DU8 as
  // "Mountain", but BC identifies these named herds as Northern ecotype.
  // Keep the source properties intact and classify the displayed ecotype by
  // BC's current Northern and Central Group herd lists.
  const NORTHERN_ECOTYPE_HERDS = new Set(['Graham','Chase','Wolverine','Takla','Telkwa','Tweedsmuir','Rainbows','Itcha-Ilgachuz','Charlotte Alplands','Kennedy Siding','Moberly','Scott','Narraway','Quintette','Redrock-Prairie Creek']);
  const SUMMER_HABITAT = new Set(['mule_deer','white_tailed_deer','nw_whitetail_kootenay','dakota_whitetail_peace','elk','roosevelt_elk','rocky_elk_kootenay','moose','northwestern_moose_ne','alaskan_moose_nw','shiras_moose_flathead','stone_sheep','caribou_mountain']);

  const speciesByKey = Object.fromEntries(SPECIES.map((item) => [item.key, item]));
  const rasterCache = new Map();
  const dynamicCache = new Map();
  // Keep successfully loaded public layers in memory for fast species switching.
  // Do not persist private data or share requests tied to an aborted selection.
  const rangeCache = new Map();
  const compactRanges = new Set(['data/stone-sheep-winter-range.geojson', 'data/harvest-gap-white_tailed_deer.geojson', 'data/dakota-whitetail-peace-context.geojson']);
  const scriptLoads = new Map();

  const select = document.getElementById('species');
  const control = document.querySelector('.species-control');
  const errorEl = document.getElementById('error');
  const opacityInput = document.getElementById('layer-opacity');
  const opacityValue = document.getElementById('opacity-value');
  const terrainToggle = document.getElementById('terrain-toggle');
  const savedOpacityRaw = localStorage.getItem('bc-species-map-opacity');
  const savedOpacity = savedOpacityRaw === null ? NaN : Number(savedOpacityRaw);
  let layerOpacity = Number.isFinite(savedOpacity) && savedOpacity >= 0 && savedOpacity <= 100 ? savedOpacity / 100 : 0.85;
  opacityInput.value = String(Math.round(layerOpacity * 100));
  opacityValue.textContent = `${Math.round(layerOpacity * 100)}%`;
  const dataLayers = new Set();
  let terrainEnabled = false;
  let preTiltView = null;

  // Wrap each data layer's style so the slider also affects polygon overlays,
  // without changing the styles used by the original species renderers.
  function makeDataLayer() {
    const data = new google.maps.Data({ map });
    const originalSetStyle = data.setStyle.bind(data);
    let baseStyle = null;
    data.setStyle = (style) => {
      baseStyle = style;
      const fade = (options) => {
        if (!options || typeof options !== 'object') return options;
        return {
          ...options,
          ...(options.fillOpacity == null ? {} : { fillOpacity: options.fillOpacity * layerOpacity }),
          ...(options.strokeOpacity == null ? {} : { strokeOpacity: options.strokeOpacity * layerOpacity }),
        };
      };
      originalSetStyle(typeof baseStyle === 'function' ? (feature) => fade(baseStyle(feature)) : fade(baseStyle));
    };
    data.refreshOpacity = () => { if (baseStyle !== null) data.setStyle(baseStyle); };
    dataLayers.add(data);
    return data;
  }
  function applyLayerOpacity() {
    for (const overlay of [activeOverlay, winterOverlay, ...seasonalOverlays]) {
      if (overlay) overlay.setOpacity(layerOpacity);
    }
    for (const data of dataLayers) data.refreshOpacity();
  }
  opacityInput.addEventListener('input', () => {
    layerOpacity = Number(opacityInput.value) / 100;
    opacityValue.textContent = `${opacityInput.value}%`;
    applyLayerOpacity();
  });
  opacityInput.addEventListener('change', () => {
    localStorage.setItem('bc-species-map-opacity', opacityInput.value);
  });
  terrainToggle.addEventListener('click', () => {
    if (!map) return;
    if (terrainEnabled) {
      terrainEnabled = false;
      map.setTilt(0);
      if (preTiltView) {
        map.setZoom(preTiltView.zoom);
        map.setHeading(preTiltView.heading);
      }
      preTiltView = null;
    } else {
      preTiltView = { zoom: map.getZoom(), heading: map.getHeading() || 0 };
      terrainEnabled = true;
      // Google's raster HYBRID map supports 45-degree aerials only at
      // sufficiently close zoom levels and in locations with imagery coverage.
      map.setZoom(Math.max(map.getZoom(), 18));
      map.setTilt(45);
    }
    terrainToggle.setAttribute('aria-pressed', String(terrainEnabled));
    terrainToggle.textContent = terrainEnabled ? '2D' : '3D';
  });


  let map = null;
  let activeOverlay = null;
  let winterOverlay = null;
  let seasonalOverlays = [];
  let activeData = null;
  let islandData = null;
  let contextData = null;
  let rooseveltRangeData = null;
  let rooseveltMainlandData = null;
  let renderVersion = 0;
  let renderAbort = null;
  let errorTimer = null;
  let stoneDetail = null;
  const storedMode = localStorage.getItem('bc-species-map-era');
  let viewMode = ['modern', 'winter', 'summer', 'historical'].includes(storedMode) ? storedMode : 'modern';
  const eraModern = document.getElementById('era-modern');
  const eraWinter = document.getElementById('era-winter');
  const eraSummer = document.getElementById('era-summer');
  const eraHistorical = document.getElementById('era-historical');
  function setEraButtons() {
    eraModern.setAttribute('aria-pressed', viewMode === 'modern' ? 'true' : 'false');
    eraWinter.setAttribute('aria-pressed', viewMode === 'winter' ? 'true' : 'false');
    eraSummer.setAttribute('aria-pressed', viewMode === 'summer' ? 'true' : 'false');
    eraHistorical.setAttribute('aria-pressed', viewMode === 'historical' ? 'true' : 'false');
  }
  function changeEra(mode) {
    if (mode === viewMode) return;
    viewMode = mode;
    localStorage.setItem('bc-species-map-era', mode);
    setEraButtons();
    return renderSelected();
  }
  eraModern.addEventListener('click', () => changeEra('modern'));
  eraWinter.addEventListener('click', () => changeEra('winter'));
  eraSummer.addEventListener('click', () => changeEra('summer'));
  eraHistorical.addEventListener('click', () => changeEra('historical'));
  setEraButtons();

  for (const item of SPECIES) {
    const option = document.createElement('option');
    option.value = item.key;
    option.textContent = item.label;
    select.appendChild(option);
  }

  const savedSpecies = localStorage.getItem('bc-species-map-v2');
  select.value = speciesByKey[savedSpecies] ? savedSpecies : 'mule_deer';

  function setLoading(value) {
    control.classList.toggle('loading', value);
    select.setAttribute('aria-busy', value ? 'true' : 'false');
  }

  function showError(message) {
    clearTimeout(errorTimer);
    errorEl.textContent = message;
    errorEl.classList.add('show');
    errorTimer = setTimeout(() => errorEl.classList.remove('show'), 3500);
  }

  function clearError() {
    clearTimeout(errorTimer);
    errorEl.classList.remove('show');
    errorEl.textContent = '';
  }

  function markIncomplete(message) {
    const text = document.getElementById('layer-note-text');
    text.textContent += ` ${message}`;
    document.getElementById('layer-note').hidden = false;
    showError(message);
  }

  function clearLayer() {
    dataLayers.clear();
    if (activeOverlay) {
      activeOverlay.setMap(null);
      activeOverlay = null;
    }
    if (winterOverlay) {
      winterOverlay.setMap(null);
      winterOverlay = null;
    }
    seasonalOverlays.forEach(overlay => overlay.setMap(null));
    seasonalOverlays = [];
    if (contextData) {
      contextData.setMap(null);
      contextData = null;
    }
    if (rooseveltRangeData) {
      rooseveltRangeData.setMap(null);
      rooseveltRangeData = null;
    }
    if (rooseveltMainlandData) {
      rooseveltMainlandData.setMap(null);
      rooseveltMainlandData = null;
    }
    if (islandData) {
      islandData.setMap(null);
      islandData = null;
    }
    document.getElementById('layer-note').hidden = true;
    document.getElementById('layer-note').scrollTop = 0;
    document.getElementById('layer-note-text').textContent = '';
    document.getElementById('layer-source').hidden = false;
    document.getElementById('layer-attribution').hidden = false;
    document.getElementById('layer-additional').hidden = true;
    document.getElementById('gap-link').hidden = true;
    document.getElementById('moose-survey-link').hidden = true;
    document.getElementById('revelstoke-survey-link').hidden = true;
    document.getElementById('mule-source').hidden = true;
    document.getElementById('caribou-ecotype-link').hidden = true;
    document.getElementById('epu-link').hidden = true;
    document.getElementById('roosevelt-history-link').hidden = true;
    document.getElementById('roosevelt-range-link').hidden = true;
    document.getElementById('roosevelt-recent-link').hidden = true;
    document.getElementById('layer-license').href = 'https://www2.gov.bc.ca/gov/content/data/open-data/open-government-licence-bc';
    document.getElementById('layer-license').textContent = 'Open Government Licence – BC';
    if (activeData) {
      activeData.setMap(null);
      activeData = null;
    }
  }

  function loadScript(src) {
    if (scriptLoads.has(src)) return scriptLoads.get(src);
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Could not load ${src}`));
      document.head.appendChild(script);
    });
    scriptLoads.set(src, promise);
    promise.catch(() => scriptLoads.delete(src));
    return promise;
  }

  function decodeRle(rle, width = DEFAULT_RASTER_W, height = DEFAULT_RASTER_H) {
    if (!rle) throw new Error('Distribution data is missing.');

    const total = width * height;
    const runs = [];
    let encodedPixels = 0;

    for (const token of rle.split(',')) {
      if (!token) continue;
      const level = Number(token[0]);
      const count = parseInt(token.slice(1), 36);
      if (!Number.isInteger(level) || level < 0 || level >= PALETTE.length || !Number.isFinite(count) || count <= 0) {
        throw new Error('Distribution data failed validation.');
      }
      runs.push([level, count]);
      encodedPixels += count;
    }

    if (encodedPixels !== total) {
      console.error(`Species raster pixel count mismatch: got ${encodedPixels}, expected ${total}.`);
      throw new Error('Distribution data failed validation.');
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: true });
    const image = ctx.createImageData(width, height);
    const pixels = image.data;
    let p = 0;

    for (const [level, count] of runs) {
      const color = PALETTE[level];
      for (let i = 0; i < count; i += 1, p += 1) {
        const offset = p * 4;
        pixels[offset] = color[0];
        pixels[offset + 1] = color[1];
        pixels[offset + 2] = color[2];
        pixels[offset + 3] = color[3];
      }
    }

    // The source grid is linear in latitude; a Google Maps GroundOverlay is
    // displayed in Web Mercator. Reproject rows so features land at the right latitude.
    const projected = ctx.createImageData(width, height);
    const mercator = (lat) => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
    const north = mercator(BOUNDS.north), south = mercator(BOUNDS.south);
    for (let y = 0; y < height; y += 1) {
      const m = north - (y + 0.5) / height * (north - south);
      const lat = (2 * Math.atan(Math.exp(m)) - Math.PI / 2) * 180 / Math.PI;
      const sourceY = Math.max(0, Math.min(height - 1, Math.floor((BOUNDS.north - lat) / (BOUNDS.north - BOUNDS.south) * height)));
      projected.data.set(pixels.subarray(sourceY * width * 4, (sourceY + 1) * width * 4), y * width * 4);
    }
    ctx.putImageData(projected, 0, 0);
    return canvas.toDataURL('image/png');
  }

  async function rasterUrl(item) {
    if (rasterCache.has(item.key)) return rasterCache.get(item.key);
    await loadScript(`${item.asset}?v=${ASSET_REV}`);
    const rle = window.SPECIES_DATA?.[item.source];
    const url = decodeRle(rle, item.width || DEFAULT_RASTER_W, item.height || DEFAULT_RASTER_H);
    rasterCache.set(item.key, url);
    return url;
  }

  async function rooseveltSpecies(signal) {
    const key = 'roosevelt_elk';
    if (dynamicCache.has(key)) return dynamicCache.get(key);
    const request = new AbortController();
    const abortRequest = () => request.abort();
    signal.addEventListener('abort', abortRequest, { once: true });
    const timeout = setTimeout(abortRequest, 12000);
    let collection;
    try {
      const response = await fetch('/species-map/api/species-data?kind=rooseveltEpu', { signal: request.signal });
      if (!response.ok) throw new Error('Roosevelt Elk data is temporarily unavailable.');
      collection = await response.json();
    } finally {
      clearTimeout(timeout);
      signal.removeEventListener('abort', abortRequest);
    }
    if (collection?.type !== 'FeatureCollection' || !Array.isArray(collection.features) || !collection.features.length) {
      throw new Error('Roosevelt Elk data is invalid.');
    }
    const densityField = collection.densityField || '__density';
    const values = collection.features
      .map((feature) => Number(feature.properties?.[densityField]))
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => a - b);
    if (!values.length) throw new Error('Roosevelt Elk density values are unavailable.');
    const q = (p) => values[Math.min(values.length - 1, Math.floor((values.length - 1) * p))];
    const payload = {
      geojson: { type: 'FeatureCollection', features: collection.features },
      densityField,
      cuts: [q(0.25), q(0.5), q(0.75)],
    };
    dynamicCache.set(key, payload);
    return payload;
  }

  async function staticRange(item, signal, allowEmpty = false) {
    let payload = rangeCache.get(item.asset);
    if (!payload) {
      const response = await fetch(`${item.asset}?v=${compactRanges.has(item.asset) ? 2 : 1}`, { signal });
      if (!response.ok) throw new Error('Species range data could not load.');
      payload = await response.json();
      if (payload.type !== 'FeatureCollection' || !Array.isArray(payload.features)) throw new Error('Species range data is invalid.');
      if (signal.aborted) throw new DOMException('The request was aborted.', 'AbortError');
      rangeCache.set(item.asset, payload);
    }
    if (!allowEmpty && !payload.features.length) throw new Error('Species range data is invalid.');
    const features = item.asset === 'data/caribou-herds.geojson' && ['caribou_northern','caribou_mountain'].includes(item.key)
      ? payload.features.filter(f => {
        const p = f.properties || {};
        const northern = p.ECOTYPE === 'Northern' || NORTHERN_ECOTYPE_HERDS.has(p.HERD_NAME);
        return item.key === 'caribou_northern' ? northern : p.ECOTYPE === 'Mountain' && !northern;
      })
      : item.filter ? payload.features.filter((f) => f.properties?.[item.filterField || 'SPECIES_CODE'] === item.filter) : payload.features;
    return { ...payload, features };
  }

  async function historicRoosevelt(signal) {
    const key = 'roosevelt_1990';
    if (dynamicCache.has(key)) return dynamicCache.get(key);
    const request = new AbortController();
    const abort = () => request.abort();
    signal.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(abort, 30000);
    try {
      const response = await fetch('/species-map/api/species-data?kind=rooseveltHistorical1990', { signal: request.signal });
      if (!response.ok) throw new Error('Historical Roosevelt elk data is unavailable.');
      const payload = await response.json();
      if (payload?.type !== 'FeatureCollection' || !Array.isArray(payload.features) || !payload.features.length) throw new Error('Historical Roosevelt elk data is invalid.');
      dynamicCache.set(key, payload);
      return payload;
    } finally {
      clearTimeout(timeout);
      signal.removeEventListener('abort', abort);
    }
  }

  async function recentRoosevelt(signal) {
    const key = 'roosevelt_recent';
    if (dynamicCache.has(key)) return dynamicCache.get(key);
    const request = new AbortController();
    const abort = () => request.abort();
    signal.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(abort, 30000);
    try {
      const response = await fetch('/species-map/api/species-data?kind=rooseveltModern', { signal:request.signal });
      if (!response.ok) throw new Error('Recent mainland Roosevelt elk data is unavailable.');
      const payload = await response.json();
      if (payload?.type !== 'FeatureCollection' || !Array.isArray(payload.features) || !payload.features.length) throw new Error('Recent mainland Roosevelt elk data is invalid.');
      dynamicCache.set(key, payload);
      return payload;
    } finally {
      clearTimeout(timeout);
      signal.removeEventListener('abort', abort);
    }
  }

  function renderRooseveltIslandContext(payload) {
    rooseveltRangeData = makeDataLayer();
    rooseveltRangeData.addGeoJson(payload);
    rooseveltRangeData.setStyle({ fillColor:'#74af6f', fillOpacity:0.16, strokeColor:'#91cb8c', strokeOpacity:0.7, strokeWeight:1, zIndex:0, clickable:false });
  }

  function renderHistoricalRoosevelt(payload) {
    activeData = makeDataLayer();
    activeData.addGeoJson(payload);
    activeData.setStyle(feature => {
      const color = { L:'#3f9646', M:'#f4d03f', H:'#d73027' }[feature.getProperty('historical_class')] || '#3f9646';
      return { fillColor:color, fillOpacity:0.62, strokeColor:'#fff', strokeOpacity:0.25, strokeWeight:0.5, zIndex:1, clickable:false };
    });
  }

  function renderStaticRange(payload, item) {
    const data = makeDataLayer();
    data.addGeoJson(payload);
    data.setStyle((feature) => {
      const smallCaribouHerd = item.asset === 'data/caribou-herds.geojson' && ['Narrow Lake', 'Frisby Boulder'].includes(feature.getProperty('HERD_NAME'));
      if (smallCaribouHerd) return { fillOpacity: 0, strokeColor: '#f5c76b', strokeOpacity: 0.95, strokeWeight: 2, clickable: false };
      const density = Number(feature.getProperty(item.densityField || 'density_2018'));
      const level = item.type === 'grizzly' ? (density <= 5 ? 1 : density <= 15 ? 2 : density <= 30 ? 3 : 4) : 1;
      const color = PALETTE[level];
      return { fillColor: `rgb(${color[0]},${color[1]},${color[2]})`, fillOpacity: item.type === 'stone' ? 0.16 : 0.65, strokeColor: '#fff', strokeOpacity: 0.35, strokeWeight: 0.6, zIndex: item.type === 'stone' ? 1 : 0, clickable: false };
    });
    activeData = data;
  }

  async function islandWinterRange(signal) {
    return staticRange({ asset: 'data/roosevelt-island-winter-range.geojson' }, signal);
  }

  async function stoneWinterRange(asset, signal) {
    try {
      return await staticRange({ asset }, signal);
    } catch (error) {
      if (signal.aborted || error?.name === 'AbortError' || !asset.includes('-overview.geojson')) throw error;
      return staticRange({ asset: 'data/stone-sheep-winter-range.geojson' }, signal);
    }
  }

  function renderIslandWinterRange(payload) {
    islandData = makeDataLayer();
    islandData.addGeoJson(payload);
    islandData.setStyle({ fillColor: '#39a7d0', fillOpacity: 0.65, strokeColor: '#83d7ee', strokeOpacity: 0.7, strokeWeight: 1, zIndex: 2, clickable: false });
  }

  function renderPolygonData(payload) {
    const data = makeDataLayer();
    data.addGeoJson(payload.geojson);
    const cuts = Array.isArray(payload.cuts) && payload.cuts.length === 3 ? payload.cuts : [0.05, 0.10, 0.25];
    const densityField = payload.densityField || 'density';
    data.setStyle((feature) => {
      const value = Number(feature.getProperty(densityField));
      if (!Number.isFinite(value) || value <= 0) return { visible: false };
      const level = value <= cuts[0] ? 1 : value <= cuts[1] ? 2 : value <= cuts[2] ? 3 : 4;
      const color = PALETTE[level];
      return {
        fillColor: `rgb(${color[0]},${color[1]},${color[2]})`,
        fillOpacity: 0.72,
        strokeColor: 'rgba(255,255,255,.42)',
        strokeOpacity: 0.35,
        strokeWeight: 0.7,
        clickable: false,
      };
    });
    activeData = data;
  }

  async function renderSelected() {
    const version = ++renderVersion;
    const item = speciesByKey[select.value];
    if (!item || !map) return;

    if (renderAbort) renderAbort.abort();
    renderAbort = new AbortController();
    setLoading(true);
    clearLayer();
    clearError();
    localStorage.setItem('bc-species-map-v2', item.key);

    try {
      if ((viewMode === 'winter' || viewMode === 'summer') && ['caribou', 'caribou_northern'].includes(item.key)) {
        const season = viewMode;
        const note = document.getElementById('layer-note');
        note.hidden = false;
        document.getElementById('layer-source').href = 'https://www2.gov.bc.ca/gov/content/environment/plants-animals-ecosystems/wildlife/regional-wildlife/northeast';
        document.getElementById('layer-attribution').hidden = true;
        document.getElementById('layer-note-text').textContent = `${season === 'summer' ? 'Summer' : 'Winter'}: loading BC seasonal habitat…`;
        const response = await fetch(`/species-map/api/species-data?kind=${season === 'summer' ? 'caribouSummer' : 'caribouWinter'}`, { signal:renderAbort.signal });
        if (!response.ok) throw new Error('Seasonal caribou habitat could not load.');
        const payload = await response.json();
        if (payload?.type !== 'FeatureCollection' || !Array.isArray(payload.features) || !payload.features.length) throw new Error('Seasonal caribou habitat is invalid.');
        if (version !== renderVersion) return;
        activeData = makeDataLayer();
        activeData.addGeoJson(payload);
        activeData.setStyle(f => ({ fillColor:f.getProperty('quality') === 'Very High' ? '#dca63a' : '#72b69e', fillOpacity:0.5, strokeOpacity:0, clickable:false }));
        document.getElementById('layer-note-text').textContent = `${season === 'summer' ? 'Summer' : 'Winter'}: BC high-elevation seasonal caribou habitat mapped in 2017 for South Peace herds and Graham. Green: high; gold: very high. Partial regional habitat, not current density or confirmed occupancy. Burnt Pine's resident herd was later extirpated.`;
      } else if (viewMode === 'summer' && SUMMER_HABITAT.has(item.key)) {
        winterOverlay = new google.maps.GroundOverlay(`data/summer-habitat-${item.key}.png?v=1`, BOUNDS, { map, opacity:layerOpacity, clickable:false });
        document.getElementById('layer-note').hidden = false;
        document.getElementById('layer-source').href = 'https://catalogue.data.gov.bc.ca/dataset/broad-ecosystem-inventory-wildlife-habitat-ratings-interpretations-for-mammals';
        document.getElementById('layer-note-text').textContent = 'Summer: BC’s broad 2003-era habitat suitability model, not observations or animal density. Red: very high; orange: high; yellow: moderate suitability. Partial coverage and dated inputs; habitat may lie outside the animal’s range. No colour does not prove absence.';
      } else if (viewMode === 'winter') {
        const note = document.getElementById('layer-note');
        const text = document.getElementById('layer-note-text');
        note.hidden = false;
        document.getElementById('layer-source').href = 'https://catalogue.data.gov.bc.ca/dataset/ungulate-winter-range-approved';
        if (item.type === 'raster' || item.type === 'partial_winter') {
          const asset = item.type === 'raster' ? `data/winter-${item.key}.png` : item.asset;
          winterOverlay = new google.maps.GroundOverlay(`${asset}?v=1`, BOUNDS, { map, opacity:layerOpacity, clickable:false });
          text.textContent = `Winter: blue is approved BC winter habitat. ${item.type === 'partial_winter' ? item.note : 'Incomplete seasonal habitat; not the full range or animal density.'}`;
        } else if (['wild_sheep', 'bighorn_sheep', 'thinhorn_sheep'].includes(item.key)) {
          if (item.key !== 'thinhorn_sheep') {
            for (const asset of ['data/winter-rocky_bighorn_kootenay.png', 'data/winter-california_bighorn_boundary.png']) {
              seasonalOverlays.push(new google.maps.GroundOverlay(`${asset}?v=1`, BOUNDS, { map, opacity:layerOpacity, clickable:false }));
            }
          }
          if (item.key !== 'bighorn_sheep') {
            const payload = await stoneWinterRange('data/stone-sheep-winter-range-overview.geojson', renderAbort.signal);
            if (version !== renderVersion) return;
            renderIslandWinterRange(payload);
          }
          text.textContent = 'Winter: blue shows available regional bighorn and/or Stone’s sheep winter habitat, depending on selection. Partial BC coverage; not the full species range or animal density.';
        } else if (item.type === 'roosevelt' || item.type === 'stone') {
          const asset = item.type === 'stone' && map.getZoom() <= 8 ? 'data/stone-sheep-winter-range-overview.geojson' : 'data/stone-sheep-winter-range.geojson';
          if (item.type === 'stone') stoneDetail = map.getZoom() <= 8 ? 'overview' : 'full';
          const payload = item.type === 'roosevelt' ? await islandWinterRange(renderAbort.signal) : await stoneWinterRange(asset, renderAbort.signal);
          if (version !== renderVersion) return;
          renderIslandWinterRange(payload);
          text.textContent = item.type === 'roosevelt' ? 'Winter: blue is approved Roosevelt elk winter habitat on Vancouver Island. Coverage is incomplete and seasonal; not the full range or density.' : 'Winter: blue is mapped Stone’s sheep winter habitat from four BC orders. Coverage is incomplete and seasonal; not the full range or density.';
        } else {
          document.getElementById('layer-source').hidden = true;
          document.getElementById('layer-attribution').hidden = true;
          text.textContent = 'Winter: no verified winter-specific layer is available for this selection.';
        }
      } else if (viewMode === 'summer') {
        document.getElementById('layer-note').hidden = false;
        document.getElementById('layer-source').hidden = true;
        document.getElementById('layer-attribution').hidden = true;
        document.getElementById('layer-note-text').textContent = 'Summer: no verified summer-specific layer is available for this selection.';
      } else if (viewMode === 'historical') {
        const note = document.getElementById('layer-note');
        note.hidden = false;
        document.getElementById('layer-note-text').textContent = 'Historical: loading data…';
        if (item.key === 'elk') {
          const kinds = ['rooseveltHistorical1990', 'rockyElkHistorical1990'];
          const results = await Promise.allSettled(kinds.map(async kind => {
            const response = await fetch(`/species-map/api/species-data?kind=${kind}`, { signal:renderAbort.signal });
            if (!response.ok) throw new Error('Historical elk archive unavailable');
            const data = await response.json();
            if (data?.type !== 'FeatureCollection' || !Array.isArray(data.features) || !data.features.length) throw new Error('Invalid historical elk archive');
            return data.features;
          }));
          if (version !== renderVersion) return;
          const features = results.filter(result => result.status === 'fulfilled').flatMap(result => result.value);
          if (!features.length) throw new Error('Historical elk distribution is unavailable.');
          renderHistoricalRoosevelt({ type:'FeatureCollection', features });
          document.getElementById('layer-source').href = 'https://a100.gov.bc.ca/pub/acat/public/viewReport.do?reportId=40140';
          document.getElementById('layer-attribution').hidden = true;
          document.getElementById('layer-note-text').textContent = 'Historical: BC 1990 Roosevelt and Rocky Mountain elk distribution. Green, yellow and red show historical low, medium and high classes, not current density or confirmed present-day range.';
          if (results.some(result => result.status === 'rejected')) markIncomplete('Some historical elk source layers could not load.');
        } else if (item.type === 'raster' && !['mountain_goat','white_tailed_deer','moose','mule_deer'].includes(item.key)) {
          const url = await rasterUrl(item);
          if (version !== renderVersion) return;
          activeOverlay = new google.maps.GroundOverlay(url, BOUNDS, { map, opacity: layerOpacity, clickable: false });
          document.getElementById('layer-source').href = 'https://a100.gov.bc.ca/pub/acat/public/viewReport.do?reportId=40140';
          document.getElementById('layer-attribution').hidden = true;
          document.getElementById('layer-note-text').textContent = 'Historical: approximate legacy distribution. Its exact dates and source composition are not fully verified; it has been checked against some 1988–1990 BC reference polygons. Not current animal density.';
        } else if (['wild_sheep','bighorn_sheep','thinhorn_sheep','stone_sheep','dall_tatshenshini','rocky_bighorn_kootenay','california_bighorn_boundary','black_bear','mountain_goat','white_tailed_deer','moose','mule_deer'].includes(item.key)) {
          const archives = {
            wild_sheep:['stone','dall','rocky','california'], bighorn_sheep:['rocky','california'], thinhorn_sheep:['stone','dall'],
            stone_sheep:['stone'], dall_tatshenshini:['dall'], rocky_bighorn_kootenay:['rocky'], california_bighorn_boundary:['california'], black_bear:['blackbear'], mountain_goat:['goat'], white_tailed_deer:['whitetail'], moose:['moose'], mule_deer:['mule','blacktail'],
          }[item.key];
          const results = await Promise.allSettled(archives.map(async taxon => {
            const response = await fetch(`/species-map/api/species-data?kind=historicalSpecies&taxon=${taxon}`, { signal:renderAbort.signal });
            if (!response.ok) throw new Error('Historical archive unavailable');
            const data = await response.json();
            if (data?.type !== 'FeatureCollection' || !Array.isArray(data.features) || !data.features.length) throw new Error('Invalid historical archive');
            return data.features;
          }));
          if (version !== renderVersion) return;
          const features = results.filter(result => result.status === 'fulfilled').flatMap(result => result.value);
          if (!features.length) throw new Error('Historical distribution data is unavailable.');
          renderHistoricalRoosevelt({ type:'FeatureCollection', features });
          document.getElementById('layer-source').href = 'https://a100.gov.bc.ca/pub/acat/public/viewReport.do?reportId=40140';
          document.getElementById('layer-attribution').hidden = true;
          const year = ['mountain_goat','white_tailed_deer','moose'].includes(item.key) ? 1990 : 1988;
          document.getElementById('layer-note-text').textContent = `Historical: BC ${year} distribution. Green, yellow and red show historical low, medium and high classes, not current density or confirmed present-day range. Subspecies boundaries reflect the historical classifications.`;
          if (item.key === 'mule_deer') document.getElementById('layer-note-text').textContent += ' Combines mule and black-tailed deer; the two BC black-tail archives contain identical geometry, so they are not shown as separate subspecies.';
          if (results.some(result => result.status === 'rejected')) markIncomplete('Some historical source layers could not load.');
        } else if (item.key === 'caribou' || item.key === 'rocky_elk_kootenay') {
          const isCaribou = item.key === 'caribou';
          const response = await fetch(`/species-map/api/species-data?kind=${isCaribou ? 'caribouHistorical1990' : 'rockyElkHistorical1990'}`, { signal:renderAbort.signal });
          if (!response.ok) throw new Error('Historical distribution data is unavailable.');
          const payload = await response.json();
          if (payload?.type !== 'FeatureCollection' || !Array.isArray(payload.features) || !payload.features.length) throw new Error('Historical caribou data is invalid.');
          if (version !== renderVersion) return;
          renderHistoricalRoosevelt(payload);
          document.getElementById('layer-source').href = 'https://a100.gov.bc.ca/pub/acat/public/viewReport.do?reportId=40140';
          document.getElementById('layer-attribution').hidden = true;
          document.getElementById('layer-note-text').textContent = `Historical: BC 1990 ${isCaribou ? 'caribou distribution for all ecotypes combined' : 'Rocky Mountain elk distribution across BC'}. Green, yellow and red are historical low, medium and high classes; not current density or confirmed present-day range.`;
        } else if (item.type === 'grizzly') {
          const historicalGrizzly = { ...item, asset:'data/grizzly-2012.geojson', densityField:'density_2012' };
          const payload = await staticRange(historicalGrizzly, renderAbort.signal);
          if (version !== renderVersion) return;
          renderStaticRange(payload, historicalGrizzly);
          document.getElementById('layer-source').href = payload.source;
          document.getElementById('layer-note-text').textContent = 'Historical: 2012 grizzly estimates per 1,000 km². Green ≤5, yellow 5–15, orange 15–30, red >30. Estimates are joined to approximate 2018 management boundaries; unmatched units are omitted. Not precise animal locations.';
        } else if (item.type === 'roosevelt') {
          document.getElementById('layer-source').hidden = true;
          document.getElementById('layer-attribution').hidden = true;
          document.getElementById('layer-note-text').textContent = 'Historical: Roosevelt elk range evidence.';
          const results = await Promise.allSettled([
            historicRoosevelt(renderAbort.signal).then(payload => {
              if (version !== renderVersion) return;
              renderHistoricalRoosevelt(payload);
              document.getElementById('roosevelt-history-link').hidden = false;
              document.getElementById('layer-note-text').textContent += ' BC’s 1990 map covers Vancouver Island and parts of the mainland; green, yellow and red are low, medium and high historical classes, not current density. Conflicting or unknown records are omitted.';
            }),
            rooseveltSpecies(renderAbort.signal).then(payload => {
              if (version !== renderVersion) return;
              const features = payload.geojson.features.filter(f => Number(f.properties?.__density) > 0);
              if (!features.length) return;
              contextData = makeDataLayer();
              contextData.addGeoJson({ type:'FeatureCollection', features });
              contextData.setStyle({ fillOpacity:0, strokeColor:'#f5c76b', strokeOpacity:0.9, strokeWeight:1.3, zIndex:2, clickable:false });
              document.getElementById('epu-link').hidden = false;
              document.getElementById('layer-note-text').textContent += ' Gold outlines: mainland units with 2012 population estimates; not exact occupancy.';
            }),
            staticRange({ asset:'data/roosevelt-island-range-context.geojson' }, renderAbort.signal).then(payload => {
              if (version !== renderVersion) return;
              renderRooseveltIslandContext(payload);
              document.getElementById('roosevelt-range-link').hidden = false;
              document.getElementById('layer-additional').hidden = false;
              document.getElementById('layer-note-text').textContent += ' Pale Island shading is broad geographic context, not an exact historical range or local density.';
            }),
          ]);
          if (version !== renderVersion) return;
          if (results.some(result => result.status === 'rejected')) markIncomplete('Some historical Roosevelt elk data could not load.');
        } else {
          document.getElementById('layer-source').hidden = true;
          document.getElementById('layer-attribution').hidden = true;
          document.getElementById('layer-note-text').textContent = 'Historical: no verified historical layer is available for this selection.';
        }
      } else if (item.type === 'harvest_context') {
        const payload = await staticRange(item, renderAbort.signal);
        if (version !== renderVersion) return;
        activeData = makeDataLayer();
        activeData.addGeoJson(payload);
        activeData.setStyle({ fillOpacity: 0, strokeColor: '#d19cff', strokeOpacity: 0.9, strokeWeight: 1.8, clickable: false });
        document.getElementById('layer-source').href = payload.source;
        document.getElementById('layer-note-text').textContent = item.note;
        document.getElementById('layer-note').hidden = false;
      } else if (item.type === 'partial_winter') {
        document.getElementById('layer-source').hidden = true;
        document.getElementById('layer-attribution').hidden = true;
        document.getElementById('layer-note-text').textContent = 'Modern: a separate modern distribution layer is not available for this selection. Choose Winter for the available seasonal habitat.';
        document.getElementById('layer-note').hidden = false;
      } else if (item.type === 'raster') {
        // Begin supplemental downloads immediately while the base raster decodes.
        const extra = Promise.allSettled([
          staticRange({ asset: `data/harvest-context-${item.key}.geojson` }, renderAbort.signal, true),
          ...(item.key === 'moose' ? [staticRange({ asset: 'data/moose-724-survey-context.geojson' }, renderAbort.signal), staticRange({ asset: 'data/moose-revelstoke-2025-context.geojson' }, renderAbort.signal)] : []),
          ...(item.key === 'mule_deer' ? [staticRange({ asset: 'data/sitka-blacktail-haida.geojson' }, renderAbort.signal)] : []),
        ]);
        const note = document.getElementById('layer-note');
        document.getElementById('layer-note-text').textContent = 'Modern: recent survey and harvest information is shown where available; dates vary. Coverage is incomplete. Choose Winter for mapped winter habitat.';
        if (item.key === 'mule_deer') document.getElementById('layer-note-text').textContent += ' Mule deer includes Columbian and Sitka black-tailed deer.';
        document.getElementById('layer-source').href = 'https://catalogue.data.gov.bc.ca/dataset/big-game-harvest-statistics-1976-to-2024';
        note.hidden = false;
        const extras = await extra;
        if (version !== renderVersion) return;
        const gaps = extras[0].status === 'fulfilled' ? extras[0].value : null;
        if (gaps?.features.length) {
          const data = makeDataLayer();
          data.addGeoJson(gaps);
          data.setStyle({ fillOpacity: 0, strokeColor: '#d19cff', strokeOpacity: 0.9, strokeWeight: 1.8, clickable: false });
          activeData = data;
          document.getElementById('layer-note-text').textContent += ' Purple outlines: units with reported or estimated 2020–24 licensed harvest. Boundaries do not show precise locations, current occupancy or density; no recorded harvest does not mean no animals.';
          document.getElementById('gap-link').hidden = false;
        }
        if (item.key === 'mule_deer' && extras[1].status === 'fulfilled') {
          contextData = makeDataLayer();
          contextData.addGeoJson(extras[1].value);
          contextData.setStyle({ fillColor: '#3f9646', fillOpacity: 0.35, strokeOpacity: 0, clickable: false });
          document.getElementById('layer-note-text').textContent += ' Haida Gwaii green is broad Sitka black-tail range context, not local density; coastal coverage is incomplete.';
          document.getElementById('mule-source').hidden = false;
        }
        if (extras[0].status === 'rejected' || (item.key === 'mule_deer' && extras[1].status === 'rejected')) markIncomplete('Some supplemental range or harvest data could not load.');
        if (item.key === 'moose') {
          const surveys = extras.slice(1).filter(result => result.status === 'fulfilled').flatMap(result => result.value.features);
          if (surveys.length) {
            contextData = makeDataLayer();
            contextData.addGeoJson({ type: 'FeatureCollection', features: surveys });
            contextData.setStyle({ fillOpacity: 0, strokeColor: '#f5c76b', strokeOpacity: 0.95, strokeWeight: 2, clickable: false });
          }
          if (extras[1].status === 'fulfilled') {
            document.getElementById('layer-note-text').textContent += ' Gold: WMU 7-24 reference. Its 2023–24 survey estimated 0.55 ± 0.07 moose/km² (SE) across the study area; the unit outline is not the exact survey boundary or local density.';
            document.getElementById('moose-survey-link').hidden = false;
          }
          if (extras[2].status === 'fulfilled') {
            document.getElementById('layer-note-text').textContent += ' Gold: 4-38 and 4-39 reference; the 2025 Lake Revelstoke survey estimated about 550 moose in its study area using trends from eight sampled units. WMU outline is not the exact study boundary or local density.';
            document.getElementById('revelstoke-survey-link').hidden = false;
          }
          if (extras.slice(1).some(result => result.status === 'rejected')) markIncomplete('Some moose survey data could not load.');
        }
      } else if (item.type === 'stone') {
        stoneDetail = map.getZoom() <= 8 ? 'overview' : 'full';
        const winterAsset = stoneDetail === 'overview'
          ? 'data/stone-sheep-winter-range-overview.geojson'
          : 'data/stone-sheep-winter-range.geojson';
        document.getElementById('layer-source').href = 'https://catalogue.data.gov.bc.ca/dataset/ungulate-winter-range-approved';
        document.getElementById('layer-note-text').textContent = 'Green: all thinhorn sheep range, including Dall’s and mixed areas; not a Stone’s sheep boundary. Choose Winter for available Stone’s sheep winter habitat.';
        document.getElementById('layer-note').hidden = false;
        // Paint each independent layer as soon as it arrives; a slow or failed
        // winter-habitat request must not hide the broad thinhorn range.
        const results = await Promise.allSettled([
          staticRange(item, renderAbort.signal).then(payload => {
            if (version === renderVersion) renderStaticRange(payload, item);
          }),
        ]);
        if (version !== renderVersion) return;
        if (results.some(result => result.status === 'rejected')) markIncomplete('Some Stone’s sheep data could not load.');
      } else if (item.type === 'range' || item.type === 'grizzly') {
        const payload = await staticRange(item, renderAbort.signal);
        if (version !== renderVersion) return;
        renderStaticRange(payload, item);
        const note = document.getElementById('layer-note');
        document.getElementById('layer-source').href = payload.source;
        if (item.key === 'wood_bison') {
          document.getElementById('layer-additional').hidden = false;
          document.getElementById('layer-license').href = 'https://www.fin.gov.nt.ca/sites/fin/files/resources/open_data_guidelines.pdf';
          document.getElementById('layer-license').textContent = 'Open Government Licence – Northwest Territories';
        }
        document.getElementById('layer-note-text').textContent = item.note || (item.type === 'grizzly' ? 'Grizzly: estimated bears per 1,000 km² by population subunit, 2018. Green ≤5, yellow 5–15, orange 15–30, red >30. Not precise locations.' : (item.asset === 'data/caribou-herds.geojson' ? `Caribou: BC herd ranges by ecotype; survey dates vary. ${item.key === 'caribou' || item.key === 'caribou_mountain' ? 'Gold outlines include very small herds identified in 2023. ' : ''}Locally extinct resident herds are omitted; absence does not prove no animals. Range is not density.` : item.key === 'black_bear' ? 'Black Bear: broad BC range, not local distribution or density. Bears are found throughout BC, including Vancouver Island and Haida Gwaii.' : item.key === 'wood_bison' ? 'Wood Bison: three mapped transboundary herd ranges; dates vary. Incomplete: Hay-Zama bison occasionally enter BC outside these mapped ranges. Not population density.' : 'BC wild sheep registry ranges. Range is not animal density.'));
        if (['caribou_northern','caribou_mountain'].includes(item.key)) {
          document.getElementById('layer-note-text').textContent += ' Ecotype grouping uses BC’s Northern and Central Group herd descriptions; boundaries and status dates vary.';
          document.getElementById('caribou-ecotype-link').hidden = false;
        }
        note.hidden = false;
        if (item.key === 'wood_bison') {
          const river = await staticRange({ asset: 'data/hay-river-bison-context.geojson' }, renderAbort.signal);
          if (version !== renderVersion) return;
          contextData = makeDataLayer();
          contextData.addGeoJson(river);
          contextData.setStyle({ strokeColor: '#f5c76b', strokeOpacity: 0.95, strokeWeight: 2.5, clickable: false });
          document.getElementById('layer-note-text').textContent += ' Gold: Hay River reference. A 2000 BC plan mentions occasional Hay-Zama crossings in this drainage; the line is not a bison range or sighting.';
        } else if (item.key === 'caribou' || item.key === 'caribou_northern') {
          const former = await staticRange({ asset: 'data/burnt-pine-context.geojson' }, renderAbort.signal);
          if (version !== renderVersion) return;
          contextData = makeDataLayer();
          contextData.addGeoJson(former);
          contextData.setStyle({ fillOpacity: 0, strokeColor: '#f5c76b', strokeOpacity: 0.95, strokeWeight: 2, clickable: false });
          document.getElementById('layer-note-text').textContent += ' Gold outline: former Burnt Pine herd range; the resident herd is extirpated, but neighbouring caribou used part of it in 2024. The outline is not a current occupancy boundary.';
        }
      } else if (item.type === 'roosevelt') {
        document.getElementById('layer-source').href = 'https://catalogue.data.gov.bc.ca/dataset/ungulate-winter-range-approved';
        document.getElementById('layer-note-text').textContent = 'Green: broad Vancouver Island Roosevelt elk range context, not confirmed presence everywhere or local density. Choose Winter for mapped Island winter habitat.';
        document.getElementById('layer-note').hidden = false;
        const results = await Promise.allSettled([
          staticRange({ asset:'data/roosevelt-island-range-context.geojson' }, renderAbort.signal).then(payload => {
            if (version !== renderVersion) return;
            renderRooseveltIslandContext(payload);
            document.getElementById('roosevelt-range-link').hidden = false;
          }),
          recentRoosevelt(renderAbort.signal).then(payload => {
            if (version !== renderVersion) return;
            rooseveltMainlandData = makeDataLayer();
            rooseveltMainlandData.addGeoJson(payload);
            rooseveltMainlandData.setStyle({ fillOpacity:0, strokeColor:'#f5c76b', strokeOpacity:0.95, strokeWeight:1.6, zIndex:1, clickable:false });
            document.getElementById('roosevelt-recent-link').hidden = false;
            document.getElementById('layer-note-text').textContent += ' Gold: mainland management units with nonzero estimates from 2013–2023, depending on unit. Outlines are not exact current occupancy or density.';
          }),
          staticRange({ asset: 'data/roosevelt-elk-harvest-context.geojson' }, renderAbort.signal).then((payload) => {
            if (version !== renderVersion) return;
            contextData = makeDataLayer();
            contextData.addGeoJson(payload);
            contextData.setStyle({ fillOpacity: 0, strokeColor: '#d19cff', strokeOpacity: 0.9, strokeWeight: 1.8, clickable: false });
            document.getElementById('layer-note-text').textContent += ' Purple: units with 2020–24 licensed elk harvest, not identified to subspecies, exact location or density.';
            document.getElementById('gap-link').hidden = false;
          }),
        ]);
        if (version !== renderVersion) return;
        if (results.some((result) => result.status === 'rejected')) {
          markIncomplete('Some Roosevelt elk data could not load.');
        }
      }
    } catch (error) {
      if (version === renderVersion && error?.name !== 'AbortError') {
        console.error(error);
        if (viewMode !== 'modern') {
          const label = viewMode === 'historical' ? 'Historical' : viewMode === 'winter' ? 'Winter' : 'Summer';
          document.getElementById('layer-note-text').textContent = `${label}: this layer could not be loaded. Try again.`;
          document.getElementById('layer-note').hidden = false;
          document.getElementById('layer-source').hidden = true;
          document.getElementById('layer-attribution').hidden = true;
        } else if (document.getElementById('layer-note').hidden) {
          document.getElementById('layer-note-text').textContent = 'Modern: this layer could not be loaded. Try again.';
          document.getElementById('layer-note').hidden = false;
          document.getElementById('layer-source').hidden = true;
          document.getElementById('layer-attribution').hidden = true;
        }
        showError(error?.message || 'This species layer could not load.');
      }
    } finally {
      if (version === renderVersion) {
        const note = document.getElementById('layer-note');
        const text = document.getElementById('layer-note-text');
        if (viewMode === 'modern' && !note.hidden && !text.textContent.startsWith('Modern:')) {
          text.textContent = `Modern: best available evidence; dates vary. ${text.textContent}`;
        }
        applyLayerOpacity();
        setLoading(false);
      }
    }
  }

  select.addEventListener('change', renderSelected);

  window.initSpeciesMap = () => {
    try {
      const savedView = JSON.parse(localStorage.getItem('bc-species-map-view-v2') || 'null');
      map = new google.maps.Map(document.getElementById('map'), {
        center: savedView?.center || { lat: 54.4, lng: -125.7 },
        zoom: savedView?.zoom || 5,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false,
        gestureHandling: 'greedy',
        clickableIcons: false,
        backgroundColor: '#101512',
        restriction: {
          latLngBounds: { north: 62.5, south: 45.5, east: -109.5, west: -143.5 },
          strictBounds: false,
        },
      });

      if (!savedView) {
        map.fitBounds(
          new google.maps.LatLngBounds(
            { lat: BOUNDS.south, lng: BOUNDS.west },
            { lat: BOUNDS.north, lng: BOUNDS.east },
          ),
          18,
        );
      }

      map.addListener('idle', () => {
        if (viewMode === 'winter' && select.value === 'stone_sheep' && stoneDetail !== null &&
            stoneDetail !== (map.getZoom() <= 8 ? 'overview' : 'full')) {
          renderSelected();
        }
        const center = map.getCenter();
        if (!center) return;
        localStorage.setItem('bc-species-map-view-v2', JSON.stringify({
          center: { lat: center.lat(), lng: center.lng() },
          zoom: map.getZoom(),
        }));
      });

      renderSelected();
    } catch (error) {
      console.error(error);
      showError('Google Maps could not initialize.');
    }
  };

  window.gm_authFailure = () => showError('Google Maps authorization failed.');

  function loadGoogleMaps() {
    const config = document.createElement('script');
    config.src = '/.netlify/functions/google-maps-config?rev=species-rebuild-3';
    config.async = true;
    config.onload = () => {
      if (!window.GOOGLE_MAPS_API_KEY) {
        showError('Google Maps API key is unavailable.');
        return;
      }
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(window.GOOGLE_MAPS_API_KEY)}&callback=initSpeciesMap&v=weekly&loading=async&auth_referrer_policy=origin`;
      script.onerror = () => showError('Google Maps failed to load.');
      document.head.appendChild(script);
    };
    config.onerror = () => showError('Map configuration failed.');
    document.head.appendChild(config);
  }

  loadGoogleMaps();
})();
