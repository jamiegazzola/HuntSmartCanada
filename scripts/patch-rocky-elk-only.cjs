'use strict';
const fs = require('node:fs');
const path = require('node:path');

const installerPath = path.join('scripts', 'install-private-heatmaps.cjs');
let source = fs.readFileSync(installerPath, 'utf8');

if (source.includes('ROCKY_MOUNTAIN_ELK_ONLY')) {
  console.log('Rocky Mountain Elk-only patch already installed.');
  process.exit(0);
}

// The private asset comes from this exact uploaded March 2005 KMZ raster.
const sourceManifest = JSON.parse(fs.readFileSync(path.join('private-species-map', 'species-map', 'data', 'sources.json'), 'utf8'));
if (sourceManifest['kmz-elk-historic.png']?.source_image_sha256 !== '8c074b12c2d3a94f94a6480ea73ee3780d19039bdf8e2d82d63840f8543fee7c') {
  throw new Error('Rocky Mountain Elk March 2005 source does not match uploaded KMZ.');
}

const caribouPopulationAnchor = 'const population = Number(estimate.population);';
const caribouPopulationReplacement = 'const population = estimate.population == null ? null : Number(estimate.population);';
if (!source.includes(caribouPopulationAnchor)) throw new Error('Caribou population parsing anchor is missing');
source = source.replace(caribouPopulationAnchor, caribouPopulationReplacement);

const eraAnchor = `    const eraControl = document.querySelector('.era-control');
    const isRoosevelt = item.type === 'roosevelt';
    eraControl.hidden = isRoosevelt;
    eraControl.style.display = isRoosevelt ? 'none' : '';
    if (isRoosevelt && viewMode !== 'modern') {
      viewMode = 'modern';
      setEraButtons();
    }`;
const eraReplacement = `    const eraControl = document.querySelector('.era-control');
    const isRoosevelt = item.type === 'roosevelt';
    const isRockyElk = item.key === 'elk';
    eraControl.hidden = isRoosevelt || isRockyElk;
    eraControl.style.display = (isRoosevelt || isRockyElk) ? 'none' : '';
    if (isRoosevelt && viewMode !== 'modern') {
      viewMode = 'modern';
      setEraButtons();
    }`;
if (!source.includes(eraAnchor)) throw new Error('Species era-control anchor is missing');
source = source.replace(eraAnchor, eraReplacement);

const branchAnchor = "      } else if (!showEvidence && KMZ_HEATMAPS.has(item.key) && !(item.key === 'wild_sheep' && viewMode === 'historical') && (viewMode === 'modern' || viewMode === 'historical')) {";
if (!source.includes(branchAnchor)) throw new Error('Species KMZ branch anchor is missing');

const branchReplacement = `      } else if (item.key === 'elk') {
        // ROCKY_MOUNTAIN_ELK_ONLY: render the precise historical March 2005
        // image from the user's KMZ, masked against BC Region 1/2 polygons.
        // Do not alter the independent Roosevelt Elk rendering path.
        const cacheKey = 'rocky_elk_march_2005_clipped';
        let rockyUrl = dynamicCache.get(cacheKey);
        if (!rockyUrl) {
          const kmzUrl = await kmzOverlayUrl('kmz-elk-historic.png', renderAbort.signal);
          const response = await fetch('data/rocky-elk-excluded-regions.geojson?v=2005-1', { signal: renderAbort.signal });
          if (!response.ok) throw new Error('Rocky Mountain Elk region boundaries are unavailable.');
          const regions = await response.json();
          if (regions?.type !== 'FeatureCollection' || regions.features?.length !== 2 ||
              !['1','2'].every(id => regions.features.some(feature => feature.properties?.region_id === id))) {
            throw new Error('Rocky Mountain Elk exclusion boundaries are invalid.');
          }
          const image = await loadKmzImage(kmzUrl, renderAbort.signal);
          if (version !== renderVersion) return;
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          if (!canvas.width || !canvas.height) throw new Error('Rocky Mountain Elk KMZ dimensions are invalid.');
          const ctx = canvas.getContext('2d', { alpha:true });
          ctx.drawImage(image, 0, 0);
          const mercator = lat => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
          const northM = mercator(BOUNDS.north);
          const southM = mercator(BOUNDS.south);
          const project = point => [
            (point[0] - BOUNDS.west) / (BOUNDS.east - BOUNDS.west) * canvas.width,
            (northM - mercator(point[1])) / (northM - southM) * canvas.height
          ];
          ctx.globalCompositeOperation = 'destination-out';
          for (const feature of regions.features) {
            const geometry = feature.geometry;
            const polygons = geometry?.type === 'Polygon' ? [geometry.coordinates] :
              geometry?.type === 'MultiPolygon' ? geometry.coordinates : [];
            if (!polygons.length) throw new Error('Rocky Mountain Elk region geometry is invalid.');
            for (const polygon of polygons) {
              ctx.beginPath();
              for (const ring of polygon) {
                ring.forEach((point, i) => {
                  const xy = project(point);
                  if (i === 0) ctx.moveTo(xy[0], xy[1]);
                  else ctx.lineTo(xy[0], xy[1]);
                });
                ctx.closePath();
              }
              ctx.fill('evenodd');
            }
          }
          rockyUrl = canvas.toDataURL('image/png');
          dynamicCache.set(cacheKey, rockyUrl);
        }
        if (version !== renderVersion) return;
        activeOverlay = new google.maps.GroundOverlay(rockyUrl, BOUNDS, { map, opacity:1, clickable:false });
        document.getElementById('layer-note').hidden = false;
        document.getElementById('layer-source').hidden = true;
        document.getElementById('layer-attribution').hidden = true;
        document.getElementById('layer-note-text').textContent = 'Rocky Mountain Elk — March 2005 historical relative-abundance source; original colour classes preserved.';
      } else if (!showEvidence && KMZ_HEATMAPS.has(item.key) && !(item.key === 'wild_sheep' && viewMode === 'historical') && (viewMode === 'modern' || viewMode === 'historical')) {`;
source = source.replace(branchAnchor, branchReplacement);

const catalogAnchor = "catalog = catalog.replace(\"label: 'Mule Deer (including Black-tailed Deer)'\", \"label: 'Mule Deer'\");";
const catalogReplacement = `${catalogAnchor}\ncatalog = catalog.replace(\"label: 'Elk'\", \"label: 'Rocky Mountain Elk'\");`;
if (!source.includes(catalogAnchor)) throw new Error('Species catalog rename anchor is missing');
source = source.replace(catalogAnchor, catalogReplacement);

fs.writeFileSync(installerPath, source);
console.log('Installed Rocky Mountain Elk-only renderer and preserved unknown caribou population states.');
