'use strict';
// The private repository is pinned as a git submodule. Only validated image
// files are copied into the existing password-protected species-map path.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const source = path.join('private-species-map', 'species-map', 'data');
const dest = path.join('site', 'species-map', 'data');
const manifest = JSON.parse(fs.readFileSync(path.join(source, 'sources.json'), 'utf8'));
const groups = ['elk','moose','mule_deer','white_tailed_deer','mountain_goat','wild_sheep','caribou'];
const files = groups.flatMap(group => ['modern','historic'].map(era => `kmz-${group}-${era}.png`));
const staged = files.map(name => {
  const bytes = fs.readFileSync(path.join(source, name));
  const hash = crypto.createHash('sha256').update(bytes).digest('hex');
  if (!manifest[name]?.output_sha256 || hash !== manifest[name].output_sha256) throw new Error(`Private map asset failed integrity check: ${name}`);
  return [name, bytes];
});

const rooseveltIslandPath = path.join('species-map', 'data', 'roosevelt-island-historic-2005.png');
const rooseveltIslandBytes = fs.readFileSync(rooseveltIslandPath);
const rooseveltIslandHash = crypto.createHash('sha256').update(rooseveltIslandBytes).digest('hex');
if (rooseveltIslandHash !== 'fd0b753473311f8e11ce9645ef68460142a6f05b36969c55f51984852977b68f') {
  throw new Error('Roosevelt Island March 2005 raster failed integrity check');
}

// Keep the protected API/auth regression checks tied to the same build step that
// installs the private map so previews validate backend changes before main.
execFileSync(process.execPath, ['scripts/verify-private-species.mjs'], { stdio:'inherit' });

// Production viewer is intentionally limited to the exact species groups and
// two eras contained in the supplied KMZ. Do not expose legacy seasonal or
// subspecies-specific layers here: those are separate evidence products and
// visually mixing them with the KMZ makes the map misleading.
const appReplacements = [
  [
    "const DISPLAYED_SPECIES = new Set([...KMZ_HEATMAPS, 'roosevelt_elk', 'rocky_elk_kootenay']);",
    "const DISPLAYED_SPECIES = new Set([...KMZ_HEATMAPS, 'roosevelt_elk']);",
  ],
  [
    "let viewMode = ['modern', 'winter', 'summer', 'historical'].includes(storedMode) ? storedMode : 'modern';",
    "let viewMode = ['modern', 'historical'].includes(storedMode) ? storedMode : 'modern';",
  ],
  [
    "const APP_BUILD = 'species-map-rebuild-v12';",
    "const APP_BUILD = 'species-map-sheep-vector-v1';",
  ],
  [
`    const item = speciesByKey[select.value];
    if (!item || !map) return;`,
`    const item = speciesByKey[select.value];
    if (!item || !map) return;
    document.querySelector('.era-control').hidden = item.type === 'roosevelt';`,
  ],
  [
`    try {
      if (!showEvidence && KMZ_HEATMAPS.has(item.key) && (viewMode === 'modern' || viewMode === 'historical')) {`,
`    try {
      if (item.type === 'roosevelt') {
        activeOverlay = new google.maps.GroundOverlay('data/roosevelt-island-historic-2005.png?v=2005-1', BOUNDS, { map, opacity:0.9, clickable:false });
        document.getElementById('layer-note').hidden = false;
        document.getElementById('layer-source').hidden = true;
        document.getElementById('layer-attribution').hidden = true;
        document.getElementById('layer-note-text').textContent = 'Single Roosevelt Elk layer: March 2005 historical relative abundance on Vancouver Island plus the latest positive 2013–2023 mainland EPU abundance normalized by EPU land area. Green→red indicates lower→higher relative concentration within each source; blank does not prove absence.';
        const payload = await recentRoosevelt(renderAbort.signal);
        if (version !== renderVersion) return;
        rooseveltMainlandData = new google.maps.Data({ map });
        rooseveltMainlandData.addGeoJson(payload);
        rooseveltMainlandData.setStyle((feature) => {
          const heat = Math.max(1, Math.min(4, Number(feature.getProperty('heat_class')) || 1));
          const color = ['#3f9646','#f4d03f','#f48b27','#d73027'][heat - 1];
          return { fillColor:color, fillOpacity:0.42, strokeColor:color, strokeOpacity:0.9, strokeWeight:1.2, zIndex:2, clickable:false };
        });
        document.getElementById('roosevelt-recent-link').hidden = false;
      } else if (!showEvidence && KMZ_HEATMAPS.has(item.key) && !(item.key === 'wild_sheep' && viewMode === 'historical') && (viewMode === 'modern' || viewMode === 'historical')) {`,
  ],
  [
    "document.getElementById('layer-note-text').textContent = 'Green: broad Vancouver Island Roosevelt elk range context, not confirmed presence everywhere or local density. Choose Winter for mapped Island winter habitat.';",
    "document.getElementById('layer-note-text').textContent = 'Mainland: latest positive 2013–2023 EPU abundance normalized by EPU area. Island: broad range context plus approved winter range where mapped.';",
  ],
  [
    "rooseveltMainlandData.setStyle({ fillOpacity:0, strokeColor:'#f5c76b', strokeOpacity:0.95, strokeWeight:1.6, zIndex:1, clickable:false });",
    "rooseveltMainlandData.setStyle((feature) => { const heat = Math.max(1, Math.min(4, Number(feature.getProperty('heat_class')) || 1)); const color = ['#3f9646','#f4d03f','#f48b27','#d73027'][heat - 1]; return { fillColor:color, fillOpacity:0.4, strokeColor:color, strokeOpacity:0.9, strokeWeight:1.3, zIndex:1, clickable:false }; });",
  ],
  [
    "document.getElementById('layer-note-text').textContent += ' Gold: mainland management units with nonzero estimates from 2013–2023, depending on unit. Outlines are not exact current occupancy or density.';",
    "document.getElementById('layer-note-text').textContent += ' Mainland fill: green→red ranks recently surveyed EPUs from lower→higher estimated elk density using each unit’s latest positive 2013–2023 estimate divided by EPU land area. It is management-unit scale, not exact animal locations.';",
  ],
  [
`          staticRange({ asset: 'data/roosevelt-elk-harvest-context.geojson' }, renderAbort.signal).then((payload) => {
            if (version !== renderVersion) return;
            contextData = new google.maps.Data({ map });
            contextData.addGeoJson(payload);
            contextData.setStyle({ fillOpacity: 0, strokeColor: '#d19cff', strokeOpacity: 0.9, strokeWeight: 1.8, clickable: false });
            document.getElementById('layer-note-text').textContent += ' Purple: units with 2020–24 licensed elk harvest, not identified to subspecies, exact location or density.';
            document.getElementById('gap-link').hidden = false;
          }),`,
`          staticRange({ asset: 'data/roosevelt-island-winter-range.geojson' }, renderAbort.signal).then((payload) => {
            if (version !== renderVersion) return;
            contextData = new google.maps.Data({ map });
            contextData.addGeoJson(payload);
            contextData.setStyle({ fillColor:'#f4b63f', fillOpacity:0.34, strokeColor:'#f4b63f', strokeOpacity:0.85, strokeWeight:1.1, zIndex:2, clickable:false });
            document.getElementById('layer-note-text').textContent += ' Orange on Vancouver Island: approved Roosevelt elk winter range where mapped. This is verified habitat evidence, not complete year-round range or local density.';
          }),`,
  ],
];

function patchKmzGeoref(input) {
  let app = input;

  const cacheAnchor = '  const rasterCache = new Map();\n';
  const cacheReplacement = '  const rasterCache = new Map();\n  const kmzOverlayCache = new Map();\n  let kmzManifestPromise = null;\n';
  if (!app.includes(cacheAnchor)) throw new Error('Private species viewer raster cache anchor is missing');
  app = app.replace(cacheAnchor, cacheReplacement);

  const helperAnchor = '  async function rasterUrl(item) {';
  const helper = `  async function loadKmzManifest() {
    if (!kmzManifestPromise) {
      kmzManifestPromise = fetch('data/sources.json?v=georef-2', { cache: 'no-store' }).then((response) => {
        if (!response.ok) throw new Error('Species map metadata could not load.');
        return response.json();
      });
      kmzManifestPromise.catch(() => { kmzManifestPromise = null; });
    }
    return kmzManifestPromise;
  }

  async function loadKmzImage(src, signal) {
    const image = new Image();
    image.decoding = 'async';
    image.src = src;
    const loaded = new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('Species heat-map image could not load.'));
    });
    if (image.decode) {
      try { await image.decode(); } catch { await loaded; }
    } else {
      await loaded;
    }
    if (signal?.aborted) throw new DOMException('The request was aborted.', 'AbortError');
    return image;
  }

  async function kmzOverlayUrl(assetName, signal) {
    if (kmzOverlayCache.has(assetName)) return kmzOverlayCache.get(assetName);
    const promise = (async () => {
      const manifest = await loadKmzManifest();
      const src = \`data/\${assetName}?v=georef-2\`;
      const processing = String(manifest?.[assetName]?.processing || '');
      if (!processing.includes('Nearest-row reprojection from linear latitude to Web Mercator')) return src;

      const image = await loadKmzImage(src, signal);
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      if (!width || !height) throw new Error('Species heat-map image dimensions are invalid.');

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: true });
      ctx.imageSmoothingEnabled = false;

      const mercator = (lat) => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
      const northM = mercator(BOUNDS.north);
      const southM = mercator(BOUNDS.south);
      const latSpan = BOUNDS.north - BOUNDS.south;

      // The current private PNGs were warped once during the KMZ build and then
      // positioned again by Google GroundOverlay. Undo that first row warp so
      // their transparent BC mask and heat classes return to the source KML grid.
      for (let y = 0; y < height; y += 1) {
        const lat = BOUNDS.north - (y + 0.5) / height * latSpan;
        const projectedY = (northM - mercator(lat)) / (northM - southM) * height - 0.5;
        const sourceY = Math.max(0, Math.min(height - 1, Math.round(projectedY)));
        ctx.drawImage(image, 0, sourceY, width, 1, 0, y, width, 1);
      }

      if (signal?.aborted) throw new DOMException('The request was aborted.', 'AbortError');
      return canvas.toDataURL('image/png');
    })();
    kmzOverlayCache.set(assetName, promise);
    promise.catch(() => kmzOverlayCache.delete(assetName));
    return promise;
  }

`;
  if (!app.includes(helperAnchor)) throw new Error('Private species viewer raster function anchor is missing');
  app = app.replace(helperAnchor, helper + helperAnchor);

  const overlayAnchor = "        activeOverlay = new google.maps.GroundOverlay(`data/kmz-${item.key}-${historical ? 'historic' : 'modern'}.png?v=1`, BOUNDS, { map, opacity: 1, clickable: false });";
  const overlayReplacement = "        const kmzAsset = `kmz-${item.key}-${historical ? 'historic' : 'modern'}.png`;\n        const kmzUrl = await kmzOverlayUrl(kmzAsset, renderAbort.signal);\n        if (version !== renderVersion) return;\n        activeOverlay = new google.maps.GroundOverlay(kmzUrl, BOUNDS, { map, opacity: 1, clickable: false });";
  if (!app.includes(overlayAnchor)) throw new Error('Private species viewer KMZ overlay anchor is missing');
  app = app.replace(overlayAnchor, overlayReplacement);

  const buildPattern = /const APP_BUILD = 'species-map-[^']+';/;
  if (!buildPattern.test(app)) throw new Error('Private species viewer build marker is missing');
  app = app.replace(buildPattern, "const APP_BUILD = 'species-map-georef-v2';");
  return app;
}

function patchProductionApp(input) {
  let app = input;
  for (const [before, after] of appReplacements) {
    if (!app.includes(before)) throw new Error(`Private species viewer patch target missing: ${before}`);
    app = app.replace(before, after);
  }
  // Preserve the user's current map scale when enabling 3D. Forcing zoom 18
  // upscales low-resolution Google aerial tiles in remote BC locations.
  const forced3dZoom = '      map.setZoom(Math.max(map.getZoom(), 18));';
  if (!app.includes(forced3dZoom)) throw new Error('Species map forced 3D zoom anchor is missing');
  app = app.replace(forced3dZoom, '      // Preserve existing zoom; tilt only where Google imagery supports it.');
  const reset3dZoom = '        map.setZoom(preTiltView.zoom);';
  if (!app.includes(reset3dZoom)) throw new Error('Species map 3D restore zoom anchor is missing');
  app = app.replace(reset3dZoom, '        // Keep the zoom the user selected while viewing 3D.');
  
  // Gold FSR overlay from the BC Forest Tenure Road Segment Lines service.
  // FEATURE_CLASS_SKEY 558 is the Ministry's Forest Service Road classification.
  // Tiles are requested for the visible map only (not a multi-megabyte
  // province-wide GeoJSON download), and omitted at excessive overview scales.
  const fsrInitAnchor = '  window.initSpeciesMap = () => {\n';
  if (!app.includes(fsrInitAnchor)) throw new Error('FSR overlay init anchor is missing');
  const fsrHelper = \`  function installForestServiceRoads() {
    const tools = document.querySelector('.map-tools');
    if (!tools || !map) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'fsr-toggle';
    button.textContent = '🚚';
    button.title = 'Show BC Forest Service Roads in gold';
    button.setAttribute('aria-label', 'Show BC Forest Service Roads');
    button.setAttribute('aria-pressed', 'false');
    button.style.cssText = 'flex:0 0 52px;min-height:65px;padding:0;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:rgba(15,20,17,.94);color:white;box-shadow:0 8px 24px rgba(0,0,0,.24);font-size:25px;cursor:pointer;touch-action:manipulation';
    button.addEventListener('click', () => {
      const active = button.getAttribute('aria-pressed') === 'true';
      if (active) {
        const index = map.overlayMapTypes.getArray().indexOf(fsrLayer);
        if (index >= 0) map.overlayMapTypes.removeAt(index);
      } else {
        map.overlayMapTypes.push(fsrLayer);
      }
      button.setAttribute('aria-pressed', String(!active));
      button.setAttribute('aria-label', (!active ? 'Hide' : 'Show') + ' BC Forest Service Roads');
      button.title = (!active ? 'Hide' : 'Show') + ' BC Forest Service Roads';
      button.style.background = active ? 'rgba(15,20,17,.94)' : 'rgba(122,93,29,.96)';
      button.style.borderColor = active ? 'rgba(255,255,255,.16)' : '#e8b94c';
    });
    const fsrLayer = new google.maps.ImageMapType({
      name:'BC Forest Service Roads',
      alt:'BC Forest Service Roads - gold lines',
      tileSize:new google.maps.Size(256,256),
      minZoom:10,
      maxZoom:20,
      opacity:0.95,
      getTileUrl:(coord,zoom) => {
        if (zoom < 10 || zoom > 20 || coord.y < 0 || coord.y >= Math.pow(2,zoom) ||
            coord.x < 0 || coord.x >= Math.pow(2,zoom)) return '';
        const origin = 20037508.342789244;
        const tileSpan = origin * 2 / Math.pow(2,zoom);
        const west = -origin + coord.x * tileSpan;
        const east = west + tileSpan;
        const north = origin - coord.y * tileSpan;
        const south = north - tileSpan;
        const layer = [{
          id:21,
          source:{type:'mapLayer',mapLayerId:21},
          definitionExpression:'FEATURE_CLASS_SKEY = 558',
          drawingInfo:{renderer:{type:'simple',symbol:{
            type:'esriSLS',style:'esriSLSSolid',color:[238,183,52,255],width:2
          }}}
        }];
        const params = new URLSearchParams({
          bbox:[west,south,east,north].join(','),
          bboxSR:'3857',imageSR:'3857',size:'256,256',
          format:'png32',transparent:'true',f:'image',
          dynamicLayers:JSON.stringify(layer)
        });
        return 'https://delivery.maps.gov.bc.ca/arcgis/rest/services/whse/bcgw_pub_whse_forest_tenure/MapServer/export?' + params;
      }
    });
    tools.appendChild(button);
  }

\`;
  app = app.replace(fsrInitAnchor, fsrHelper + fsrInitAnchor);
  const fsrStart = '      if (!savedView) {\n';
  if (!app.includes(fsrStart)) throw new Error('FSR overlay map initialization anchor missing');
  app = app.replace(fsrStart, '      installForestServiceRoads();\n' + fsrStart);

  app = patchKmzGeoref(app);
  // Parse the exact production output during every build, including deploy previews,
  // so a malformed build-time replacement cannot reach main unnoticed.
  new Function(app);
  return app;
}

const sourceAppPath = path.join(source, '..', 'app.js');
const patchedApp = patchProductionApp(fs.readFileSync(sourceAppPath, 'utf8'));
if (process.env.CONTEXT !== 'production') {
  console.log(`Verified ${staged.length} private map assets, Roosevelt Island source, corrected KMZ georeferencing, and the production viewer patch. Installation is limited to production.`);
  process.exit(0);
}

fs.mkdirSync(dest, { recursive: true });
for (const [name, bytes] of staged) fs.writeFileSync(path.join(dest, name), bytes);
fs.copyFileSync(path.join(source, 'sources.json'), path.join(dest, 'sources.json'));
for (const file of ['app.js', 'index.html', 'app.css', 'species-catalog.js']) {
  fs.copyFileSync(path.join(source, '..', file), path.join(dest, '..', file));
}
fs.writeFileSync(path.join(dest, '..', 'app.js'), patchedApp);

const catalogPath = path.join(dest, '..', 'species-catalog.js');
let catalog = fs.readFileSync(catalogPath, 'utf8');
catalog = catalog.replace("label: 'Mule Deer (including Black-tailed Deer)'", "label: 'Mule Deer'");
fs.writeFileSync(catalogPath, catalog);

// Keep the legacy elements in the private source DOM so older JS references
// remain safe, but remove them completely from the production interface.
const cssPath = path.join(dest, '..', 'app.css');
fs.appendFileSync(cssPath, `
/* HuntSmart KMZ-only production controls */
#era-winter,
#era-summer,
.evidence-toggle,
.layer-note { display: none !important; }
.era-control button { flex: 1 1 50%; }
`);

console.log(`Installed ${staged.length} verified private map assets in KMZ-only mode.`);
