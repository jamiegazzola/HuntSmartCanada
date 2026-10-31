(() => {
  'use strict';

  const APP_BUILD = 'species-map-rebuild-v2';
  window.__HUNTSMART_SPECIES_MAP_BUILD__ = APP_BUILD;
  const BOUNDS = { north: 60.1, south: 48.1, east: -113.8, west: -139.2 };
  const PALETTE = [
    [0, 0, 0, 0],
    [63, 150, 70, 190],
    [244, 208, 63, 200],
    [244, 139, 39, 210],
    [215, 48, 39, 220],
  ];
  const RASTER_W = 260;
  const RASTER_H = 123;
  const ASSET_REV = 'rebuild-20261031-2';

  const SPECIES = [
    { key: 'mule_deer', label: 'Mule Deer', type: 'raster', asset: 'data/mule_deer.js', source: 'mule_deer' },
    { key: 'white_tailed_deer', label: 'White-tailed Deer', type: 'raster', asset: 'data/white_tailed_deer.js', source: 'white_tailed_deer' },
    { key: 'elk', label: 'Elk', type: 'raster', asset: 'data/elk.js', source: 'elk' },
    { key: 'roosevelt_elk', label: 'Roosevelt Elk', type: 'roosevelt' },
    { key: 'moose', label: 'Moose', type: 'raster', asset: 'data/moose.js', source: 'moose' },
    { key: 'mountain_goat', label: 'Mountain Goat', type: 'raster', asset: 'data/mountain_goat.js', source: 'mountain_goat' },
    { key: 'wild_sheep', label: 'Wild Sheep', type: 'raster', asset: 'data/wild_sheep.js', source: 'wild_sheep' },
    { key: 'caribou', label: 'Caribou', type: 'raster', asset: 'data/caribou.js', source: 'caribou' },
  ];

  const speciesByKey = Object.fromEntries(SPECIES.map((item) => [item.key, item]));
  const rasterCache = new Map();
  const dynamicCache = new Map();
  const scriptLoads = new Map();

  const select = document.getElementById('species');
  const control = document.querySelector('.species-control');
  const errorEl = document.getElementById('error');

  let map = null;
  let activeOverlay = null;
  let activeData = null;
  let renderVersion = 0;
  let renderAbort = null;
  let errorTimer = null;

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

  function clearLayer() {
    if (activeOverlay) {
      activeOverlay.setMap(null);
      activeOverlay = null;
    }
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
    return promise;
  }

  function decodeRle(rle) {
    if (!rle) throw new Error('Distribution data is missing.');

    const total = RASTER_W * RASTER_H;
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
    canvas.width = RASTER_W;
    canvas.height = RASTER_H;
    const ctx = canvas.getContext('2d', { alpha: true });
    const image = ctx.createImageData(RASTER_W, RASTER_H);
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

    ctx.putImageData(image, 0, 0);
    return canvas.toDataURL('image/png');
  }

  async function rasterUrl(item) {
    if (rasterCache.has(item.key)) return rasterCache.get(item.key);
    await loadScript(`${item.asset}?v=${ASSET_REV}`);
    const rle = window.SPECIES_DATA?.[item.source];
    const url = decodeRle(rle);
    rasterCache.set(item.key, url);
    return url;
  }

  async function rooseveltSpecies(signal) {
    const key = 'roosevelt_elk';
    if (dynamicCache.has(key)) return dynamicCache.get(key);
    const response = await fetch('/.netlify/functions/species-data?kind=rooseveltEpu', { signal });
    if (!response.ok) throw new Error('Roosevelt Elk data is temporarily unavailable.');
    const collection = await response.json();
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
    localStorage.setItem('bc-species-map-v2', item.key);

    try {
      if (item.type === 'raster') {
        const url = await rasterUrl(item);
        if (version !== renderVersion) return;
        activeOverlay = new google.maps.GroundOverlay(url, BOUNDS, { map, opacity: 0.72, clickable: false });
      } else if (item.type === 'roosevelt') {
        const payload = await rooseveltSpecies(renderAbort.signal);
        if (version !== renderVersion) return;
        renderPolygonData(payload);
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error(error);
        showError(error?.message || 'This species layer could not load.');
      }
    } finally {
      if (version === renderVersion) setLoading(false);
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
    config.src = '/.netlify/functions/google-maps-config?rev=species-rebuild-2';
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
