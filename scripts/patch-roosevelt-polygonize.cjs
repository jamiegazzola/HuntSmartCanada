'use strict';

const fs = require('node:fs');
const path = require('node:path');

// Runs after patch-roosevelt-unified-vector.cjs. The previous attempt converted
// the March 2005 Island raster into client-side polygons, which introduced
// blocky/triangular artefacts. Restore the exact source raster as a single
// georeferenced overlay and keep only the mainland EPUs as vectors.
const installerPath = path.join('scripts', 'install-private-heatmaps.cjs');
let source = fs.readFileSync(installerPath, 'utf8');

const startMarker = `      if (item.type === 'roosevelt') {\n        document.getElementById('layer-note').hidden = false;`;
const endMarker = `      } else if (!showEvidence && KMZ_HEATMAPS.has(item.key) && !(item.key === 'wild_sheep' && viewMode === 'historical') && (viewMode === 'modern' || viewMode === 'historical')) {`;
const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);
if (start < 0 || end < 0) throw new Error('Patched Roosevelt renderer branch not found');

const replacement = `      if (item.type === 'roosevelt') {
        activeOverlay = new google.maps.GroundOverlay('data/roosevelt-island-historic-2005.png?v=2005-raster-6', BOUNDS, { map, opacity:0.9, clickable:false });
        document.getElementById('layer-note').hidden = false;
        document.getElementById('layer-source').hidden = true;
        document.getElementById('layer-attribution').hidden = true;
        document.getElementById('layer-note-text').textContent = 'One Roosevelt Elk density layer. Vancouver Island is the exact March 2005 BC abundance raster, rendered without polygon conversion. Mainland EPUs use their latest positive 2013–2023 abundance estimate divided by EPU land area. Both use the same numeric density thresholds: rare <0.004, low 0.004–<0.10, moderate 0.10–<0.40, high ≥0.40 elk/km². Source years and survey methods still differ.';

        const recent = await recentRoosevelt(renderAbort.signal);
        if (version !== renderVersion) return;
        const classColor = densityClass => ({ R:'#a67c52', L:'#3f9646', M:'#f4d03f', H:'#d73027' }[densityClass] || '#9aa0a6');

        rooseveltMainlandData = new google.maps.Data({ map });
        rooseveltMainlandData.addGeoJson(recent);
        rooseveltMainlandData.setStyle((feature) => {
          const densityClass = feature.getProperty('density_class');
          const rare = densityClass === 'R';
          const color = classColor(densityClass);
          return { fillColor:color, fillOpacity:rare ? 0.22 : 0.5, strokeColor:color, strokeOpacity:rare ? 0.55 : 0.9, strokeWeight:rare ? 0.8 : 1.15, zIndex:2, clickable:false };
        });
        document.getElementById('roosevelt-history-link').hidden = true;
        document.getElementById('roosevelt-recent-link').hidden = false;
`;

source = source.slice(0, start) + replacement + source.slice(end);
if (source.includes('async function march2005Roosevelt')) throw new Error('Roosevelt raster vectorization survived rollback patch');
if (!source.includes("new google.maps.GroundOverlay('data/roosevelt-island-historic-2005.png?v=2005-raster-6'")) throw new Error('Roosevelt Island GroundOverlay rollback was not installed');
if (!source.includes("feature.getProperty('density_class')")) throw new Error('Roosevelt mainland absolute-density styling is missing');

fs.writeFileSync(installerPath, source);
console.log('Restored exact March 2005 Roosevelt Island raster; mainland remains absolute-density vectors.');
