(() => {
  'use strict';

  const APP_BUILD = 'species-map-rebuild-v11';
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

  const SPECIES = [
    { key: 'mule_deer', label: 'Mule Deer (including Black-tailed Deer)', type: 'raster', asset: 'data/mule_deer.js', source: 'mule_deer' },
    { key: 'white_tailed_deer', label: 'White-tailed Deer', type: 'raster', asset: 'data/white_tailed_deer.js', source: 'white_tailed_deer' },
    { key: 'nw_whitetail_kootenay', label: 'Northwestern White-tailed Deer (Kootenay winter habitat)', type: 'partial_winter', asset: 'data/winter-nw-whitetail-kootenay.png', note: 'Blue: Kootenay white-tailed deer winter habitat. Northwestern subspecies assignment is approximate, not genetically verified. Incomplete seasonal habitat, not the full range or animal density.' },
    { key: 'dakota_whitetail_peace', label: 'Dakota White-tailed Deer (possible Peace harvest)', type: 'harvest_context', asset: 'data/dakota-whitetail-peace-context.geojson', note: 'Purple: Peace-region units with reported or estimated white-tail harvest, 2020–24. BC says these deer may be Dakota, but harvest records do not identify subspecies, precise locations or density.' },
    { key: 'elk', label: 'Elk', type: 'raster', asset: 'data/elk.js', source: 'elk' },
    { key: 'roosevelt_elk', label: 'Roosevelt Elk', type: 'roosevelt' },
    { key: 'rocky_elk_kootenay', label: 'Rocky Mountain Elk (Kootenay winter habitat)', type: 'partial_winter', asset: 'data/winter-rocky-elk-kootenay.png', note: 'Blue: approved elk winter habitat in the Kootenay region. Incomplete seasonal habitat, not the full Rocky Mountain elk range or animal density.' },
    { key: 'moose', label: 'Moose', type: 'raster', asset: 'data/moose.js', source: 'moose' },
    { key: 'northwestern_moose_ne', label: 'Northwestern Moose (northeast winter habitat)', type: 'partial_winter', asset: 'data/winter-northwestern-moose-ne.png', note: 'Blue: approved moose winter habitat within northeastern areas where a BC report identifies Northwestern moose. Incomplete seasonal habitat, not the full subspecies range or animal density.' },
    { key: 'alaskan_moose_nw', label: 'Alaskan Moose (possible northwest harvest)', type: 'harvest_context', asset: 'data/alaskan_moose_nw-harvest-context.geojson', note: 'Purple: selected northwest BC units with reported or estimated moose harvest, 2020–24. Alaskan moose are described in this broad region, but records do not identify subspecies, precise locations or density.' },
    { key: 'shiras_moose_flathead', label: 'Shiras’ Moose (possible Flathead harvest)', type: 'harvest_context', asset: 'data/shiras_moose_flathead-harvest-context.geojson', note: 'Purple: Flathead-area unit with reported or estimated moose harvest, 2020–24. Shiras’ moose are described in this broad region, but records do not identify subspecies, precise locations or density.' },
    { key: 'mountain_goat', label: 'Mountain Goat', type: 'raster', asset: 'data/mountain_goat.js', source: 'mountain_goat' },
    { key: 'wild_sheep', label: 'Wild Sheep (all)', type: 'range', asset: 'data/sheep-ranges.geojson' },
    { key: 'bighorn_sheep', label: 'Bighorn Sheep', type: 'range', asset: 'data/sheep-ranges.geojson', filter: 'M-OVCA' },
    { key: 'rocky_bighorn_kootenay', label: 'Rocky Mountain Bighorn (Kootenay winter habitat)', type: 'partial_winter', asset: 'data/winter-rocky_bighorn_kootenay.png', note: 'Blue: East Kootenay bighorn winter habitat. Rocky Mountain subspecies assignment is approximate, not genetically verified. Incomplete seasonal habitat, not the full range or density.' },
    { key: 'california_bighorn_boundary', label: 'California Bighorn (Boundary winter habitat)', type: 'partial_winter', asset: 'data/winter-california_bighorn_boundary.png', note: 'Blue: Boundary-area bighorn winter habitat. California subspecies assignment is approximate, not genetically verified. Incomplete seasonal habitat, not the full range or density.' },
    { key: 'thinhorn_sheep', label: 'Thinhorn Sheep', type: 'range', asset: 'data/sheep-ranges.geojson', filter: 'M-OVDA' },
    { key: 'dall_tatshenshini', label: 'Dall’s Sheep (Tatshenshini range context)', type: 'range', asset: 'data/dall-tatshenshini-context.geojson', note: 'Thinhorn sheep range inside Tatshenshini-Alsek Park, where BC Parks reports Dall’s sheep in the Dollis and Datlaska ranges. Broad context only: not a Dall-specific boundary, full range or density.' },
    { key: 'stone_sheep', label: 'Stone’s Sheep (partial winter habitat)', type: 'stone', asset: 'data/sheep-ranges.geojson', filter: 'M-OVDA' },
    { key: 'caribou', label: 'Caribou (all)', type: 'range', asset: 'data/caribou-herds.geojson' },
    { key: 'caribou_northern', label: 'Northern Caribou', type: 'range', asset: 'data/caribou-herds.geojson', filter: 'Northern', filterField: 'ECOTYPE' },
    { key: 'caribou_mountain', label: 'Mountain Caribou', type: 'range', asset: 'data/caribou-herds.geojson', filter: 'Mountain', filterField: 'ECOTYPE' },
    { key: 'caribou_boreal', label: 'Boreal Caribou', type: 'range', asset: 'data/caribou-herds.geojson', filter: 'Boreal', filterField: 'ECOTYPE' },
    { key: 'grizzly_bear', label: 'Grizzly Bear', type: 'grizzly', asset: 'data/grizzly-2018.geojson' },
    { key: 'black_bear', label: 'Black Bear', type: 'range', asset: 'data/black-bear-broad-range.geojson' },
    { key: 'wood_bison', label: 'Wood Bison', type: 'range', asset: 'data/wood-bison-herds.geojson' },
  ];

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

  let map = null;
  let activeOverlay = null;
  let winterOverlay = null;
  let activeData = null;
  let islandData = null;
  let contextData = null;
  let renderVersion = 0;
  let renderAbort = null;
  let errorTimer = null;
  let stoneDetail = null;
  let viewMode = localStorage.getItem('bc-species-map-era') === 'historical' ? 'historical' : 'modern';
  const eraModern = document.getElementById('era-modern');
  const eraHistorical = document.getElementById('era-historical');
  function setEraButtons() {
    eraModern.setAttribute('aria-pressed', viewMode === 'modern' ? 'true' : 'false');
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
    if (activeOverlay) {
      activeOverlay.setMap(null);
      activeOverlay = null;
    }
    if (winterOverlay) {
      winterOverlay.setMap(null);
      winterOverlay = null;
    }
    if (contextData) {
      contextData.setMap(null);
      contextData = null;
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
    document.getElementById('epu-link').hidden = true;
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
    return { ...payload, features: item.filter ? payload.features.filter((f) => f.properties?.[item.filterField || 'SPECIES_CODE'] === item.filter) : payload.features };
  }

  function renderStaticRange(payload, item) {
    const data = new google.maps.Data({ map });
    data.addGeoJson(payload);
    data.setStyle((feature) => {
      const smallCaribouHerd = item.asset === 'data/caribou-herds.geojson' && ['Narrow Lake', 'Frisby Boulder'].includes(feature.getProperty('HERD_NAME'));
      if (smallCaribouHerd) return { fillOpacity: 0, strokeColor: '#f5c76b', strokeOpacity: 0.95, strokeWeight: 2, clickable: false };
      const density = Number(feature.getProperty('density_2018'));
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
    islandData = new google.maps.Data({ map });
    islandData.addGeoJson(payload);
    islandData.setStyle({ fillColor: '#39a7d0', fillOpacity: 0.65, strokeColor: '#83d7ee', strokeOpacity: 0.7, strokeWeight: 1, zIndex: 2, clickable: false });
  }

  function renderPolygonData(payload) {
    const data = new google.maps.Data({ map });
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
      if (viewMode === 'historical') {
        const note = document.getElementById('layer-note');
        note.hidden = false;
        document.getElementById('layer-note-text').textContent = 'Historical: loading data…';
        if (item.type === 'raster') {
          const url = await rasterUrl(item);
          if (version !== renderVersion) return;
          activeOverlay = new google.maps.GroundOverlay(url, BOUNDS, { map, opacity: 0.72, clickable: false });
          document.getElementById('layer-source').href = 'https://a100.gov.bc.ca/pub/acat/public/viewReport.do?reportId=40140';
          document.getElementById('layer-attribution').hidden = true;
          document.getElementById('layer-note-text').textContent = 'Historical: approximate legacy distribution. Its exact dates and source composition are not fully verified; it has been checked against some 1988–1990 BC reference polygons. Not current animal density.';
        } else if (item.type === 'grizzly') {
          const payload = await staticRange(item, renderAbort.signal);
          if (version !== renderVersion) return;
          renderStaticRange(payload, item);
          document.getElementById('layer-source').href = payload.source;
          document.getElementById('layer-note-text').textContent = 'Historical: 2018 grizzly estimates per 1,000 km² by population subunit. Green ≤5, yellow 5–15, orange 15–30, red >30; not precise locations.';
        } else if (item.type === 'roosevelt') {
          const payload = await rooseveltSpecies(renderAbort.signal);
          if (version !== renderVersion) return;
          renderPolygonData(payload);
          document.getElementById('layer-source').hidden = true;
          document.getElementById('layer-attribution').hidden = true;
          document.getElementById('epu-link').hidden = false;
          document.getElementById('layer-note-text').textContent = 'Historical: 2012 mainland Roosevelt elk population-unit estimates. This is not a complete Vancouver Island distribution.';
        } else {
          document.getElementById('layer-source').hidden = true;
          document.getElementById('layer-attribution').hidden = true;
          document.getElementById('layer-note-text').textContent = 'Historical: no verified historical layer is available for this selection.';
        }
      } else if (item.type === 'harvest_context') {
        const payload = await staticRange(item, renderAbort.signal);
        if (version !== renderVersion) return;
        activeData = new google.maps.Data({ map });
        activeData.addGeoJson(payload);
        activeData.setStyle({ fillOpacity: 0, strokeColor: '#d19cff', strokeOpacity: 0.9, strokeWeight: 1.8, clickable: false });
        document.getElementById('layer-source').href = payload.source;
        document.getElementById('layer-note-text').textContent = item.note;
        document.getElementById('layer-note').hidden = false;
      } else if (item.type === 'partial_winter') {
        winterOverlay = new google.maps.GroundOverlay(`${item.asset}?v=1`, BOUNDS, { map, opacity: 0.9, clickable: false });
        document.getElementById('layer-source').href = 'https://catalogue.data.gov.bc.ca/dataset/ungulate-winter-range-approved';
        document.getElementById('layer-note-text').textContent = item.note;
        document.getElementById('layer-note').hidden = false;
      } else if (item.type === 'raster') {
        // Begin supplemental downloads immediately while the base raster decodes.
        const extra = Promise.allSettled([
          staticRange({ asset: `data/harvest-gap-${item.key}.geojson` }, renderAbort.signal, true),
          ...(item.key === 'moose' ? [staticRange({ asset: 'data/moose-724-survey-context.geojson' }, renderAbort.signal), staticRange({ asset: 'data/moose-revelstoke-2025-context.geojson' }, renderAbort.signal)] : []),
          ...(item.key === 'mule_deer' ? [staticRange({ asset: 'data/sitka-blacktail-haida.geojson' }, renderAbort.signal)] : []),
        ]);
        winterOverlay = new google.maps.GroundOverlay(`data/winter-${item.key}.png?v=1`, BOUNDS, { map, opacity: 0.9, clickable: false });
        const note = document.getElementById('layer-note');
        document.getElementById('layer-note-text').textContent = 'Modern: blue is approved BC winter habitat, incomplete and not density. Recent survey and harvest information is shown where available; dates vary.';
        if (item.key === 'mule_deer') document.getElementById('layer-note-text').textContent += ' Mule deer includes Columbian and Sitka black-tailed deer.';
        document.getElementById('layer-source').href = 'https://catalogue.data.gov.bc.ca/dataset/ungulate-winter-range-approved';
        note.hidden = false;
        const extras = await extra;
        if (version !== renderVersion) return;
        const gaps = extras[0].status === 'fulfilled' ? extras[0].value : null;
        if (gaps?.features.length) {
          const data = new google.maps.Data({ map });
          data.addGeoJson(gaps);
          data.setStyle({ fillOpacity: 0, strokeColor: '#d19cff', strokeOpacity: 0.9, strokeWeight: 1.8, clickable: false });
          activeData = data;
          document.getElementById('layer-note-text').textContent += ' Purple outlines: units with reported or estimated 2020–24 licensed harvest but no old-grid cell centre. Boundaries do not show precise locations or density.';
          document.getElementById('gap-link').hidden = false;
        }
        if (item.key === 'mule_deer' && extras[1].status === 'fulfilled') {
          contextData = new google.maps.Data({ map });
          contextData.addGeoJson(extras[1].value);
          contextData.setStyle({ fillColor: '#3f9646', fillOpacity: 0.35, strokeOpacity: 0, clickable: false });
          document.getElementById('layer-note-text').textContent += ' Haida Gwaii green is broad Sitka black-tail range context, not local density; coastal coverage is incomplete.';
          document.getElementById('mule-source').hidden = false;
        }
        if (extras[0].status === 'rejected' || (item.key === 'mule_deer' && extras[1].status === 'rejected')) markIncomplete('Some supplemental range or harvest data could not load.');
        if (item.key === 'moose') {
          const surveys = extras.slice(1).filter(result => result.status === 'fulfilled').flatMap(result => result.value.features);
          if (surveys.length) {
            contextData = new google.maps.Data({ map });
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
        document.getElementById('layer-note-text').textContent = 'Blue: Stone’s sheep winter habitat from four BC orders; incomplete and not density. Green: all thinhorn sheep range, including Dall’s and mixed areas; not a Stone’s sheep boundary.';
        document.getElementById('layer-note').hidden = false;
        // Paint each independent layer as soon as it arrives; a slow or failed
        // winter-habitat request must not hide the broad thinhorn range.
        const results = await Promise.allSettled([
          staticRange(item, renderAbort.signal).then(payload => {
            if (version === renderVersion) renderStaticRange(payload, item);
          }),
          stoneWinterRange(winterAsset, renderAbort.signal).then(winter => {
            if (version === renderVersion) renderIslandWinterRange(winter);
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
        note.hidden = false;
        if (item.key === 'wood_bison') {
          const river = await staticRange({ asset: 'data/hay-river-bison-context.geojson' }, renderAbort.signal);
          if (version !== renderVersion) return;
          contextData = new google.maps.Data({ map });
          contextData.addGeoJson(river);
          contextData.setStyle({ strokeColor: '#f5c76b', strokeOpacity: 0.95, strokeWeight: 2.5, clickable: false });
          document.getElementById('layer-note-text').textContent += ' Gold: Hay River reference. A 2000 BC plan mentions occasional Hay-Zama crossings in this drainage; the line is not a bison range or sighting.';
        } else if (item.key === 'caribou' || item.key === 'caribou_mountain') {
          const former = await staticRange({ asset: 'data/burnt-pine-context.geojson' }, renderAbort.signal);
          if (version !== renderVersion) return;
          contextData = new google.maps.Data({ map });
          contextData.addGeoJson(former);
          contextData.setStyle({ fillOpacity: 0, strokeColor: '#f5c76b', strokeOpacity: 0.95, strokeWeight: 2, clickable: false });
          document.getElementById('layer-note-text').textContent += ' Gold outline: former Burnt Pine herd range; the resident herd is extirpated, but neighbouring caribou used part of it in 2024. The outline is not a current occupancy boundary.';
        }
      } else if (item.type === 'roosevelt') {
        document.getElementById('layer-source').href = 'https://catalogue.data.gov.bc.ca/dataset/ungulate-winter-range-approved';
        document.getElementById('layer-note-text').textContent = 'Blue: Vancouver Island approved elk winter range (BC open data); incomplete and not population density. Mainland 2012 population estimates are in Historical.';
        document.getElementById('layer-note').hidden = false;
        const results = await Promise.allSettled([
          islandWinterRange(renderAbort.signal).then((payload) => {
            if (version === renderVersion) renderIslandWinterRange(payload);
          }),
          staticRange({ asset: 'data/roosevelt-elk-harvest-context.geojson' }, renderAbort.signal).then((payload) => {
            if (version !== renderVersion) return;
            contextData = new google.maps.Data({ map });
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
        if (viewMode === 'historical') {
          document.getElementById('layer-note-text').textContent = 'Historical: this layer could not be loaded. Try again.';
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
        if (viewMode === 'modern' && select.value === 'stone_sheep' && stoneDetail !== null &&
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
