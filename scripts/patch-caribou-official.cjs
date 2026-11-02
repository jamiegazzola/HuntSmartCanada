'use strict';
const fs = require('node:fs');
const path = require('node:path');

const installerPath = path.join('scripts', 'install-private-heatmaps.cjs');
let source = fs.readFileSync(installerPath, 'utf8');

if (source.includes("Official BC modern caribou herd boundaries")) {
  console.log('Official modern caribou patch already installed.');
  process.exit(0);
}

const anchor = "      } else if (!showEvidence && KMZ_HEATMAPS.has(item.key) && !(item.key === 'wild_sheep' && viewMode === 'historical') && (viewMode === 'modern' || viewMode === 'historical')) {";
if (!source.includes(anchor)) throw new Error('Private species viewer KMZ branch anchor is missing');

const replacement = `      } else if (item.key === 'caribou' && viewMode === 'modern') {
        // Official BC modern caribou herd boundaries. Do not use the unverified
        // modern KMZ raster for caribou.
        const payload = await staticRange({ asset:'data/caribou-herds.geojson', key:'caribou' }, renderAbort.signal);
        if (version !== renderVersion) return;
        activeData = new google.maps.Data({ map });
        activeData.addGeoJson(payload);
        activeData.setStyle((feature) => {
          const herd = feature.getProperty('HERD_NAME');
          const ecotype = feature.getProperty('ECOTYPE');
          if (['Narrow Lake', 'Frisby Boulder'].includes(herd)) {
            return { fillOpacity:0, strokeColor:'#f5c76b', strokeOpacity:0.95, strokeWeight:2, clickable:false };
          }
          const color = { Boreal:'#5677a8', Northern:'#d6a14b', Mountain:'#6fa86b' }[ecotype] || '#6fa86b';
          return { fillColor:color, fillOpacity:0.46, strokeColor:color, strokeOpacity:0.95, strokeWeight:1.15, clickable:false };
        });
        document.getElementById('layer-note').hidden = false;
        document.getElementById('layer-source').hidden = false;
        document.getElementById('layer-source').href = 'https://catalogue.data.gov.bc.ca/dataset/caribou-herd-locations-for-bc';
        document.getElementById('layer-attribution').hidden = true;
        document.getElementById('layer-note-text').textContent = 'Modern: official BC current caribou herd boundaries used by the provincial Caribou in British Columbia application. Colours distinguish ecotype (Boreal, Northern, Mountain); they do not represent density. Herd boundaries are management areas based on best available science and expert knowledge.';
      } else if (!showEvidence && KMZ_HEATMAPS.has(item.key) && !(item.key === 'wild_sheep' && viewMode === 'historical') && (viewMode === 'modern' || viewMode === 'historical')) {`;

source = source.replace(anchor, replacement);
fs.writeFileSync(installerPath, source);
console.log('Installed official BC modern caribou renderer patch.');
