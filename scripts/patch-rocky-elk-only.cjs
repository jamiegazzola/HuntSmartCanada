'use strict';
const fs = require('node:fs');
const path = require('node:path');

const installerPath = path.join('scripts', 'install-private-heatmaps.cjs');
let source = fs.readFileSync(installerPath, 'utf8');

if (source.includes('ROCKY_MOUNTAIN_ELK_ONLY')) {
  console.log('Rocky Mountain Elk-only patch already installed.');
  process.exit(0);
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
        // ROCKY_MOUNTAIN_ELK_ONLY: use the official BC Rocky Mountain Elk
        // subspecies archive and never show the mixed generic elk KMZ here.
        const cacheKey = 'rocky_elk_historical_1990';
        let payload = dynamicCache.get(cacheKey);
        if (!payload) {
          const response = await fetch('/species-map/api/species-data?kind=rockyElkHistorical1990', { signal:renderAbort.signal });
          if (!response.ok) throw new Error('Rocky Mountain Elk data is unavailable.');
          payload = await response.json();
          if (payload?.type !== 'FeatureCollection' || !Array.isArray(payload.features) || !payload.features.length) throw new Error('Rocky Mountain Elk data is invalid.');
          dynamicCache.set(cacheKey, payload);
        }
        if (version !== renderVersion) return;
        renderHistoricalRoosevelt(payload);
        document.getElementById('layer-note').hidden = false;
        document.getElementById('layer-source').hidden = false;
        document.getElementById('layer-source').href = 'https://a100.gov.bc.ca/pub/acat/public/viewReport.do?reportId=40140';
        document.getElementById('layer-attribution').hidden = true;
        document.getElementById('layer-note-text').textContent = 'Rocky Mountain Elk only: official BC subspecies-specific distribution mapping. Green, yellow and red are historical low, moderate and high abundance classes. Roosevelt Elk is excluded and remains available as its own separate layer.';
      } else if (!showEvidence && KMZ_HEATMAPS.has(item.key) && !(item.key === 'wild_sheep' && viewMode === 'historical') && (viewMode === 'modern' || viewMode === 'historical')) {`;
source = source.replace(branchAnchor, branchReplacement);

const catalogAnchor = "catalog = catalog.replace(\"label: 'Mule Deer (including Black-tailed Deer)'\", \"label: 'Mule Deer'\");";
const catalogReplacement = `${catalogAnchor}\ncatalog = catalog.replace(\"label: 'Elk'\", \"label: 'Rocky Mountain Elk'\");`;
if (!source.includes(catalogAnchor)) throw new Error('Species catalog rename anchor is missing');
source = source.replace(catalogAnchor, catalogReplacement);

fs.writeFileSync(installerPath, source);
console.log('Installed Rocky Mountain Elk-only renderer and preserved unknown caribou population states.');
