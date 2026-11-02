'use strict';

const fs = require('node:fs');
const path = require('node:path');

const appPath = path.join('site', 'species-map', 'app.js');
let app = fs.readFileSync(appPath, 'utf8');

const cacheAnchor = "  const rasterCache = new Map();\n";
const cacheReplacement = "  const rasterCache = new Map();\n  const kmzOverlayCache = new Map();\n  let kmzManifestPromise = null;\n";
if (!app.includes(cacheAnchor)) throw new Error('Species map raster cache anchor is missing');
app = app.replace(cacheAnchor, cacheReplacement);

const functionAnchor = '  async function rasterUrl(item) {';
const helper = `  async function loadKmzManifest() {
    if (!kmzManifestPromise) {
      kmzManifestPromise = fetch('data/sources.json?v=georef-1', { cache: 'no-store' }).then((response) => {
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
      const src = \`data/\${assetName}?v=georef-1\`;
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

      // These assets were previously warped from a latitude-linear KML grid
      // into Web Mercator rows before being passed to Google GroundOverlay.
      // GroundOverlay already handles the geographic bounds, so invert that
      // extra row warp and restore the source latitude grid before display.
      for (let y = 0; y < height; y += 1) {
        const lat = BOUNDS.north - (y + 0.5) / height * latSpan;
        const projectedY = (northM - mercator(lat)) / (northM - southM) * height - 0.5;
        const sourceY = Math.max(0, Math.min(height - 1, Math.round(projectedY)));
        ctx.drawImage(image, 0, sourceY, width, 1, 0, y, width, 1);
      }

      // The BC mainland border is 49°N along the southern boundary. The source
      // rasters are already clipped to BC, but enforce the cutoff after resampling
      // so interpolation/rounding can never place heat-map pixels in Washington.
      const firstBelowBc = Math.ceil((BOUNDS.north - 49.0) / latSpan * height);
      ctx.clearRect(0, firstBelowBc, width, height - firstBelowBc);
      if (signal?.aborted) throw new DOMException('The request was aborted.', 'AbortError');
      return canvas.toDataURL('image/png');
    })();
    kmzOverlayCache.set(assetName, promise);
    promise.catch(() => kmzOverlayCache.delete(assetName));
    return promise;
  }

`;
if (!app.includes(functionAnchor)) throw new Error('Species map raster function anchor is missing');
app = app.replace(functionAnchor, helper + functionAnchor);

const overlayAnchor = "        activeOverlay = new google.maps.GroundOverlay(`data/kmz-${item.key}-${historical ? 'historic' : 'modern'}.png?v=1`, BOUNDS, { map, opacity: 1, clickable: false });";
const overlayReplacement = "        const kmzAsset = `kmz-${item.key}-${historical ? 'historic' : 'modern'}.png`;\n        const kmzUrl = await kmzOverlayUrl(kmzAsset, renderAbort.signal);\n        if (version !== renderVersion) return;\n        activeOverlay = new google.maps.GroundOverlay(kmzUrl, BOUNDS, { map, opacity: 1, clickable: false });";
if (!app.includes(overlayAnchor)) throw new Error('Species map KMZ GroundOverlay anchor is missing');
app = app.replace(overlayAnchor, overlayReplacement);

const buildPattern = /const APP_BUILD = 'species-map-[^']+';/;
if (!buildPattern.test(app)) throw new Error('Species map build marker is missing');
app = app.replace(buildPattern, "const APP_BUILD = 'species-map-georef-v1';");

new Function(app);
fs.writeFileSync(appPath, app);
console.log('Patched KMZ heat maps back to their source latitude grid and enforced the 49°N southern cutoff.');
