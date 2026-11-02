'use strict';

const fs = require('node:fs');
const path = require('node:path');

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
        document.getElementById('layer-note-text').textContent = 'Single Roosevelt Elk layer: BC historical Roosevelt distribution provides the Island/coastal base, with the latest positive 2013–2023 mainland EPU abundance normalized by EPU land area drawn on top. Green→red indicates lower→higher relative concentration within each source; the two source periods are not directly comparable as absolute density.';

        const [historical, recent] = await Promise.all([
          historicRoosevelt(renderAbort.signal),
          recentRoosevelt(renderAbort.signal),
        ]);
        if (version !== renderVersion) return;

        activeData = new google.maps.Data({ map });
        activeData.addGeoJson(historical);
        activeData.setStyle((feature) => {
          const historicalClass = feature.getProperty('historical_class');
          const color = { L:'#3f9646', M:'#f4d03f', H:'#d73027' }[historicalClass] || '#3f9646';
          return { fillColor:color, fillOpacity:0.5, strokeColor:color, strokeOpacity:0.72, strokeWeight:0.8, zIndex:1, clickable:false };
        });

        rooseveltMainlandData = new google.maps.Data({ map });
        rooseveltMainlandData.addGeoJson(recent);
        rooseveltMainlandData.setStyle((feature) => {
          const heat = Math.max(1, Math.min(4, Number(feature.getProperty('heat_class')) || 1));
          const color = ['#3f9646','#f4d03f','#f48b27','#d73027'][heat - 1];
          return { fillColor:color, fillOpacity:0.5, strokeColor:color, strokeOpacity:0.9, strokeWeight:1.15, zIndex:2, clickable:false };
        });
        document.getElementById('roosevelt-history-link').hidden = false;
        document.getElementById('roosevelt-recent-link').hidden = false;
      } else if (!showEvidence && KMZ_HEATMAPS.has(item.key) && !(item.key === 'wild_sheep' && viewMode === 'historical') && (viewMode === 'modern' || viewMode === 'historical')) {`;

if (!source.includes(branchBefore)) throw new Error('Roosevelt raster branch patch target missing');
source = source.replace(branchBefore, branchAfter);

if (source.includes("activeOverlay = new google.maps.GroundOverlay('data/roosevelt-island-historic-2005.png")) {
  throw new Error('Roosevelt Island raster is still present in the production render branch');
}

fs.writeFileSync(installerPath, source);
console.log('Patched private species installer for one unified vector Roosevelt Elk layer.');
