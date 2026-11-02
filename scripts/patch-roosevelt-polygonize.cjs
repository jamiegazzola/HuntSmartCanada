'use strict';

const fs = require('node:fs');
const path = require('node:path');

// Final Roosevelt build patch. Use the archived BC Roosevelt Elk 1990 GIS
// polygons that underpin the March 2005 Wildlife Distribution Mapping series,
// including the Rare / Occasional range class that earlier renders dropped.
// Current mainland EPUs remain on the same absolute density thresholds.

const speciesDataPath = path.join('netlify', 'functions', 'species-data.mjs');
let speciesData = fs.readFileSync(speciesDataPath, 'utf8');
const historicalStart = speciesData.indexOf('export function filterHistoricalRoosevelt(collection) {');
const historicalEnd = speciesData.indexOf('\nexport function filterHistoricalCaribou(collection) {', historicalStart);
if (historicalStart < 0 || historicalEnd < 0) throw new Error('Roosevelt historical filter not found');

const historicalReplacement = `export function filterHistoricalRoosevelt(collection) {
  const expected = {
    L: '1 ELK PER 10-250 SQ KM',
    M: '1 ELK PER 2.5-10 SQ KM',
    H: 'OVER 1 ELK PER 2.5 SQ KM',
  }
  if (collection?.type !== 'FeatureCollection' || !Array.isArray(collection.features)) throw new Error('Invalid historical archive')
  const features = collection.features.flatMap(feature => {
    const p = feature?.properties || {}
    const densityClass = String(p.HSV || '').trim().toUpperCase()
    if (!['Polygon', 'MultiPolygon'].includes(feature.geometry?.type)) return []
    if (densityClass === 'R') {
      return [{
        type:'Feature',
        geometry:feature.geometry,
        properties:{ historical_class:'R', density_class:'R', source_year:1990, source:'BC Wildlife Species Distribution Mapping — Roosevelt Elk' },
      }]
    }
    if (!expected[densityClass] || String(p.Density_Co || '').trim().toUpperCase() !== expected[densityClass]) return []
    return [{
      type:'Feature',
      geometry:feature.geometry,
      properties:{ historical_class:densityClass, density_class:densityClass, source_year:1990, source:'BC Wildlife Species Distribution Mapping — Roosevelt Elk' },
    }]
  })
  if (!features.length) throw new Error('Historical archive contains no unambiguous Roosevelt range polygons')
  return {
    type:'FeatureCollection',
    features,
    year:1990,
    density_scale:'absolute_elk_per_km2',
    density_thresholds:{ rare_below:0.004, low_min:0.004, moderate_min:0.1, high_min:0.4 },
  }
}
`;
speciesData = speciesData.slice(0, historicalStart) + historicalReplacement + speciesData.slice(historicalEnd);
fs.writeFileSync(speciesDataPath, speciesData);

const installerPath = path.join('scripts', 'install-private-heatmaps.cjs');
let source = fs.readFileSync(installerPath, 'utf8');

const startMarker = `      if (item.type === 'roosevelt') {\n`;
const endMarker = `      } else if (!showEvidence && KMZ_HEATMAPS.has(item.key) && !(item.key === 'wild_sheep' && viewMode === 'historical') && (viewMode === 'modern' || viewMode === 'historical')) {`;
const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);
if (start < 0 || end < 0) throw new Error('Patched Roosevelt renderer branch not found');

const replacement = `      if (item.type === 'roosevelt') {
        document.getElementById('layer-note').hidden = false;
        document.getElementById('layer-source').hidden = true;
        document.getElementById('layer-attribution').hidden = true;
        document.getElementById('layer-note-text').textContent = 'One Roosevelt Elk layer. Island and coastal range use BC Wildlife Species Distribution Mapping 1990 Roosevelt polygons — the archived GIS source behind the March 2005 distribution map — including Rare/Occasional range. Mainland EPUs use their latest positive 2013–2023 abundance estimate divided by EPU land area. Colours share one density scale: pale green = rare/occasional or <0.004 elk/km²; green = 0.004–<0.10; yellow = 0.10–<0.40; red = ≥0.40 elk/km². Source years and survey methods differ.';

        const [historical, recent] = await Promise.all([
          historicRoosevelt(renderAbort.signal),
          recentRoosevelt(renderAbort.signal),
        ]);
        if (version !== renderVersion) return;

        const styleForClass = densityClass => {
          const styles = {
            R:{ color:'#7fb77a', fillOpacity:0.18, strokeOpacity:0.45, strokeWeight:0.55 },
            L:{ color:'#3f9646', fillOpacity:0.42, strokeOpacity:0.62, strokeWeight:0.7 },
            M:{ color:'#f4d03f', fillOpacity:0.52, strokeOpacity:0.72, strokeWeight:0.8 },
            H:{ color:'#d73027', fillOpacity:0.58, strokeOpacity:0.82, strokeWeight:0.9 },
          };
          return styles[densityClass] || styles.R;
        };

        activeData = new google.maps.Data({ map });
        activeData.addGeoJson(historical);
        activeData.setStyle(feature => {
          const densityClass = feature.getProperty('density_class') || feature.getProperty('historical_class');
          const style = styleForClass(densityClass);
          return {
            fillColor:style.color,
            fillOpacity:style.fillOpacity,
            strokeColor:style.color,
            strokeOpacity:style.strokeOpacity,
            strokeWeight:style.strokeWeight,
            zIndex:densityClass === 'R' ? 0 : 1,
            clickable:false,
          };
        });

        rooseveltMainlandData = new google.maps.Data({ map });
        rooseveltMainlandData.addGeoJson(recent);
        rooseveltMainlandData.setStyle(feature => {
          const densityClass = feature.getProperty('density_class');
          const style = styleForClass(densityClass);
          return {
            fillColor:style.color,
            fillOpacity:densityClass === 'R' ? 0.12 : Math.min(0.62, style.fillOpacity + 0.06),
            strokeColor:style.color,
            strokeOpacity:densityClass === 'R' ? 0.35 : 0.9,
            strokeWeight:densityClass === 'R' ? 0.7 : 1.15,
            zIndex:2,
            clickable:false,
          };
        });

        document.getElementById('roosevelt-history-link').hidden = false;
        document.getElementById('roosevelt-recent-link').hidden = false;
`;

source = source.slice(0, start) + replacement + source.slice(end);
if (source.includes("roosevelt-island-historic-2005.png?v=2005-raster")) throw new Error('Roosevelt Island raster survived authoritative GIS patch');
if (source.includes('async function march2005Roosevelt')) throw new Error('Roosevelt client-side raster vectorization survived authoritative GIS patch');
if (!source.includes('historicRoosevelt(renderAbort.signal)')) throw new Error('Official Roosevelt historical GIS is not wired into the production renderer');
if (!speciesData.includes("historical_class:'R'")) throw new Error('Roosevelt Rare / Occasional range class was not restored');

fs.writeFileSync(installerPath, source);
console.log('Rebuilt Roosevelt from BC 1990 GIS polygons plus current mainland EPU density.');
