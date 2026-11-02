'use strict';

const fs = require('node:fs');
const path = require('node:path');

// Keep the mainland population API on the same absolute density classes used by
// the March 2005 BC elk map: rare <1/250 km2, low 1/10-250 km2,
// moderate 1/2.5-10 km2 and high >1/2.5 km2.
const speciesDataPath = path.join('netlify', 'functions', 'species-data.mjs');
let speciesData = fs.readFileSync(speciesDataPath, 'utf8');
const relativeDensityBlock = `  const densities = features.map(feature => feature.properties.density_per_km2).sort((a, b) => a - b)
  const q = p => densities[Math.min(densities.length - 1, Math.floor((densities.length - 1) * p))]
  const cuts = [q(0.25), q(0.5), q(0.75)]
  for (const feature of features) {
    const density = feature.properties.density_per_km2
    feature.properties.heat_class = density > cuts[2] ? 4 : density > cuts[1] ? 3 : density > cuts[0] ? 2 : 1
  }
  return { type:'FeatureCollection', features, density_field:'density_per_km2', density_scale:'relative_quartile', density_cuts:cuts }`;
const absoluteDensityBlock = `  for (const feature of features) {
    const density = feature.properties.density_per_km2
    feature.properties.density_class = density < 0.004 ? 'R' : density < 0.1 ? 'L' : density < 0.4 ? 'M' : 'H'
  }
  return {
    type:'FeatureCollection',
    features,
    density_field:'density_per_km2',
    density_scale:'absolute_elk_per_km2',
    density_thresholds:{ rare_below:0.004, low_min:0.004, moderate_min:0.1, high_min:0.4 },
  }`;
if (!speciesData.includes(relativeDensityBlock)) throw new Error('Roosevelt relative-density block is missing');
speciesData = speciesData.replace(relativeDensityBlock, absoluteDensityBlock);
fs.writeFileSync(speciesDataPath, speciesData);

// Keep the protected-map regression test aligned with the new absolute scale.
const verifyPath = path.join('scripts', 'verify-private-species.mjs');
let verify = fs.readFileSync(verifyPath, 'utf8');
verify = verify.replace("assert.equal(recent.density_scale, 'relative_quartile');\nassert.deepEqual(recent.density_cuts, [0.1, 0.2, 0.3]);", "assert.equal(recent.density_scale, 'absolute_elk_per_km2');\nassert.deepEqual(recent.density_thresholds, { rare_below:0.004, low_min:0.004, moderate_min:0.1, high_min:0.4 });");
verify = verify.replace("assert.deepEqual(recent.features.map(feature => feature.properties.heat_class), [1, 2, 3, 4]);", "assert.deepEqual(recent.features.map(feature => feature.properties.density_class), ['M', 'M', 'M', 'H']);");
if (!verify.includes("density_scale, 'absolute_elk_per_km2'")) throw new Error('Roosevelt absolute-density test patch failed');
fs.writeFileSync(verifyPath, verify);

const installerPath = path.join('scripts', 'install-private-heatmaps.cjs');
let source = fs.readFileSync(installerPath, 'utf8');

const eraBefore = "    document.querySelector('.era-control').hidden = item.type === 'roosevelt';";
const eraAfter = `    const eraControl = document.querySelector('.era-control');
    const isRoosevelt = item.type === 'roosevelt';
    eraControl.hidden = isRoosevelt;
    eraControl.style.display = isRoosevelt ? 'none' : '';
    if (isRoosevelt && viewMode !== 'modern') {
      viewMode = 'modern';
      setEraButtons();
    }`;
if (!source.includes(eraBefore)) throw new Error('Roosevelt era-control patch target missing');
source = source.replace(eraBefore, eraAfter);

const branchBefore = `      if (item.type === 'roosevelt') {
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
      } else if (!showEvidence && KMZ_HEATMAPS.has(item.key) && !(item.key === 'wild_sheep' && viewMode === 'historical') && (viewMode === 'modern' || viewMode === 'historical')) {`;

const branchAfter = `      if (item.type === 'roosevelt') {
        document.getElementById('layer-note').hidden = false;
        document.getElementById('layer-source').hidden = true;
        document.getElementById('layer-attribution').hidden = true;
        document.getElementById('layer-note-text').textContent = 'One Roosevelt Elk density layer. Vancouver Island uses the March 2005 BC distribution map; mainland EPUs use their latest positive 2013–2023 abundance estimate divided by EPU land area. Colours now share one absolute scale: green 0.004–<0.10 elk/km², yellow 0.10–<0.40, red ≥0.40; unfilled/faint units are <0.004 or have no comparable recent estimate. Source periods and survey methods still differ.';

        async function march2005Roosevelt(signal) {
          const image = new Image();
          image.decoding = 'async';
          image.src = 'data/roosevelt-island-historic-2005.png?v=2005-vector-3';
          await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = () => reject(new Error('March 2005 Roosevelt source image could not load.'));
          });
          if (signal?.aborted) throw new DOMException('The request was aborted.', 'AbortError');

          const width = image.naturalWidth;
          const height = image.naturalHeight;
          if (!width || !height) throw new Error('March 2005 Roosevelt source image is invalid.');
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d', { alpha:true, willReadFrequently:true });
          ctx.drawImage(image, 0, 0);
          const pixels = ctx.getImageData(0, 0, width, height).data;
          const targets = [
            ['L', 63, 150, 70],
            ['M', 244, 208, 63],
            ['M', 244, 139, 39],
            ['H', 215, 48, 39],
          ];
          const classify = (x, y) => {
            const i = (y * width + x) * 4;
            const alpha = pixels[i + 3];
            if (alpha < 24) return null;
            const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
            let best = null, bestDistance = Infinity;
            for (const [densityClass, tr, tg, tb] of targets) {
              const distance = (r-tr)*(r-tr) + (g-tg)*(g-tg) + (b-tb)*(b-tb);
              if (distance < bestDistance) { bestDistance = distance; best = densityClass; }
            }
            return bestDistance <= 18000 ? best : null;
          };

          // Convert the exact source raster into merged vector rectangles. Runs
          // with identical x extents are merged vertically, preserving the source
          // class cells while keeping the Google Maps feature count manageable.
          const completed = [];
          let active = new Map();
          for (let y = 0; y < height; y += 1) {
            const runs = [];
            let x = 0;
            while (x < width) {
              const densityClass = classify(x, y);
              if (!densityClass) { x += 1; continue; }
              const start = x;
              x += 1;
              while (x < width && classify(x, y) === densityClass) x += 1;
              runs.push({ densityClass, x0:start, x1:x, y0:y, y1:y+1 });
            }
            const next = new Map();
            for (const run of runs) {
              const key = run.densityClass + ':' + run.x0 + ':' + run.x1;
              const existing = active.get(key);
              if (existing) {
                existing.y1 = y + 1;
                next.set(key, existing);
              } else {
                next.set(key, run);
              }
            }
            for (const [key, rect] of active) if (!next.has(key)) completed.push(rect);
            active = next;
          }
          for (const rect of active.values()) completed.push(rect);

          const lon = x => BOUNDS.west + (x / width) * (BOUNDS.east - BOUNDS.west);
          const lat = y => BOUNDS.north - (y / height) * (BOUNDS.north - BOUNDS.south);
          return {
            type:'FeatureCollection',
            source_year:2005,
            density_scale:'absolute_elk_per_km2',
            features:completed.map(rect => ({
              type:'Feature',
              properties:{ density_class:rect.densityClass, source_year:2005, source:'BC March 2005 elk map' },
              geometry:{
                type:'Polygon',
                coordinates:[[[lon(rect.x0),lat(rect.y0)],[lon(rect.x1),lat(rect.y0)],[lon(rect.x1),lat(rect.y1)],[lon(rect.x0),lat(rect.y1)],[lon(rect.x0),lat(rect.y0)]]],
              },
            })),
          };
        }

        const [island, recent] = await Promise.all([
          march2005Roosevelt(renderAbort.signal),
          recentRoosevelt(renderAbort.signal),
        ]);
        if (version !== renderVersion) return;

        const classColor = densityClass => ({ L:'#3f9646', M:'#f4d03f', H:'#d73027' }[densityClass] || '#9aa0a6');

        activeData = new google.maps.Data({ map });
        activeData.addGeoJson(island);
        activeData.setStyle((feature) => {
          const densityClass = feature.getProperty('density_class');
          const color = classColor(densityClass);
          return { fillColor:color, fillOpacity:0.5, strokeColor:color, strokeOpacity:0.7, strokeWeight:0.55, zIndex:1, clickable:false };
        });

        rooseveltMainlandData = new google.maps.Data({ map });
        rooseveltMainlandData.addGeoJson(recent);
        rooseveltMainlandData.setStyle((feature) => {
          const densityClass = feature.getProperty('density_class');
          const rare = densityClass === 'R';
          const color = classColor(densityClass);
          return { fillColor:color, fillOpacity:rare ? 0 : 0.5, strokeColor:color, strokeOpacity:rare ? 0.3 : 0.9, strokeWeight:rare ? 0.7 : 1.15, zIndex:2, clickable:false };
        });
        document.getElementById('roosevelt-history-link').hidden = true;
        document.getElementById('roosevelt-recent-link').hidden = false;
      } else if (!showEvidence && KMZ_HEATMAPS.has(item.key) && !(item.key === 'wild_sheep' && viewMode === 'historical') && (viewMode === 'modern' || viewMode === 'historical')) {`;

if (!source.includes(branchBefore)) throw new Error('Roosevelt raster branch patch target missing');
source = source.replace(branchBefore, branchAfter);

if (source.includes("activeOverlay = new google.maps.GroundOverlay('data/roosevelt-island-historic-2005.png")) {
  throw new Error('Roosevelt Island raster is still present as a GroundOverlay in the production render branch');
}
if (!source.includes("density_scale:'absolute_elk_per_km2'")) throw new Error('Roosevelt absolute density renderer patch failed');

fs.writeFileSync(installerPath, source);
console.log('Patched Roosevelt Elk to the March 2005 Island vectors and one absolute density scale.');
