'use strict';
const fs = require('node:fs');
const path = require('node:path');

const installerPath = path.join('scripts', 'install-private-heatmaps.cjs');
let source = fs.readFileSync(installerPath, 'utf8');

if (source.includes('BC_CARIBOU_POPULATION_2023')) {
  console.log('Official modern caribou density patch already installed.');
  process.exit(0);
}

const anchor = "      } else if (!showEvidence && KMZ_HEATMAPS.has(item.key) && !(item.key === 'wild_sheep' && viewMode === 'historical') && (viewMode === 'modern' || viewMode === 'historical')) {";
if (!source.includes(anchor)) throw new Error('Private species viewer KMZ branch anchor is missing');

const replacement = `      } else if (item.key === 'caribou' && viewMode === 'modern') {
        // BC_CARIBOU_POPULATION_2023: official BC herd boundaries combined with
        // the province's latest published herd-level population estimates.
        const populationByHerd = {
          'Atlin':{population:1527,method:'survey'},
          'Calendar':{population:231,method:'minimum'},
          'Carcross':{population:851,method:'survey'},
          'Chase':{population:600,method:'ipm'},
          'Chinchaga':{population:322,method:'ipm'},
          'Edziza':{population:75,method:'survey'},
          'Finlay':{population:96,method:'survey'},
          'Frog':{population:206,method:'minimum'},
          'Gataga':{population:179,method:'survey'},
          'Horseranch':{population:550,method:'expert'},
          'Level-Kawdy':{population:1552,method:'combined_survey'},
          'Liard Plateau':{population:151,method:'survey'},
          'Little Rancheria':{population:1000,method:'survey'},
          'Maxhamish':{population:112,method:'minimum'},
          'Muskwa':{population:917,method:'survey'},
          'Pink Mountain':{population:533,method:'survey'},
          'Rabbit':{population:1111,method:'survey'},
          'Snake-Sahtaneh':{population:314,method:'minimum'},
          'Spatsizi':{population:2136,method:'combined_survey'},
          'Swan Lake':{population:702,method:'survey'},
          'Thutade':{population:116,method:'minimum'},
          'Tsenaglode':{population:840,method:'survey'},
          'Westside Fort Nelson':{population:203,method:'survey'},
          'Itcha-Ilgachuz':{population:559,method:'ipm'},
          'Charlotte Alplands':{population:27,method:'ipm'},
          'Rainbows':{population:40,method:'ipm'},
          'Tweedsmuir':{population:178,method:'ipm'},
          'Telkwa':{population:31,method:'ipm'},
          'Takla':{population:38,method:'ipm'},
          'Wolverine':{population:330,method:'ipm'},
          'Graham':{population:128,method:'ipm'},
          'Moberly':{population:138,method:'ipm'},
          'Scott':{population:null,method:'unavailable'},
          'Kennedy Siding':{population:138,method:'ipm'},
          'Quintette':{population:140,method:'ipm'},
          'Narraway':{population:129,method:'combined_ipm'},
          'Redrock-Prairie Creek':{population:null,method:'unavailable'},
          'Hart Ranges':{population:510,method:'combined_ipm'},
          'North Cariboo':{population:169,method:'ipm'},
          'Narrow Lake':{population:2,method:'ipm'},
          'Barkerville':{population:50,method:'ipm'},
          'Wells Gray North':{population:202,method:'ipm'},
          'Wells Gray South':{population:187,method:'ipm'},
          'Groundhog':{population:46,method:'ipm'},
          'Columbia North':{population:219,method:'ipm'},
          'Frisby Boulder':{population:8,method:'ipm'},
          'Central Selkirks':{population:27,method:'ipm'}
        };
        const ringAreaKm2 = (ring) => {
          if (!Array.isArray(ring) || ring.length < 3) return 0;
          const radius = 6371.0088;
          let sum = 0;
          for (let i = 0; i < ring.length; i += 1) {
            const a = ring[i];
            const b = ring[(i + 1) % ring.length];
            const lon1 = Number(a?.[0]) * Math.PI / 180;
            const lon2 = Number(b?.[0]) * Math.PI / 180;
            const lat1 = Number(a?.[1]) * Math.PI / 180;
            const lat2 = Number(b?.[1]) * Math.PI / 180;
            if (![lon1, lon2, lat1, lat2].every(Number.isFinite)) continue;
            let deltaLon = lon2 - lon1;
            if (deltaLon > Math.PI) deltaLon -= 2 * Math.PI;
            if (deltaLon < -Math.PI) deltaLon += 2 * Math.PI;
            sum += deltaLon * (2 + Math.sin(lat1) + Math.sin(lat2));
          }
          return Math.abs(sum * radius * radius / 2);
        };
        const polygonAreaKm2 = (rings) => {
          if (!Array.isArray(rings) || !rings.length) return 0;
          const outer = ringAreaKm2(rings[0]);
          const holes = rings.slice(1).reduce((total, ring) => total + ringAreaKm2(ring), 0);
          return Math.max(0, outer - holes);
        };
        const geometryAreaKm2 = (geometry) => {
          if (!geometry) return 0;
          if (geometry.type === 'Polygon') return polygonAreaKm2(geometry.coordinates);
          if (geometry.type === 'MultiPolygon') return (geometry.coordinates || []).reduce((total, polygon) => total + polygonAreaKm2(polygon), 0);
          return 0;
        };

        const raw = await staticRange({ asset:'data/caribou-herds.geojson', key:'caribou' }, renderAbort.signal);
        if (version !== renderVersion) return;
        const features = raw.features.map((feature) => {
          const herd = feature.properties?.HERD_NAME;
          const estimate = populationByHerd[herd] || { population:null, method:'unavailable' };
          const area = geometryAreaKm2(feature.geometry);
          const population = Number(estimate.population);
          const density = Number.isFinite(population) && population >= 0 && area > 0 ? population / area : null;
          return {
            ...feature,
            properties:{
              ...(feature.properties || {}),
              POPULATION_ESTIMATE:Number.isFinite(population) ? population : null,
              POPULATION_METHOD:estimate.method,
              RANGE_AREA_KM2:area,
              DENSITY_PER_KM2:density,
              DENSITY_IS_MINIMUM:estimate.method === 'minimum'
            }
          };
        });
        const positive = features
          .map(feature => Number(feature.properties?.DENSITY_PER_KM2))
          .filter(value => Number.isFinite(value) && value > 0)
          .sort((a,b) => a - b);
        if (!positive.length) throw new Error('Caribou population-density values are unavailable.');
        const quantile = (p) => positive[Math.min(positive.length - 1, Math.floor((positive.length - 1) * p))];
        const cuts = [quantile(0.25), quantile(0.5), quantile(0.75)];
        const payload = { ...raw, features };
        activeData = new google.maps.Data({ map });
        activeData.addGeoJson(payload);
        activeData.setStyle((feature) => {
          const density = Number(feature.getProperty('DENSITY_PER_KM2'));
          if (!Number.isFinite(density)) return { fillColor:'#8a949f', fillOpacity:0.24, strokeColor:'#8a949f', strokeOpacity:0.8, strokeWeight:1, clickable:false };
          if (density <= 0) return { fillColor:'#8a949f', fillOpacity:0.08, strokeColor:'#8a949f', strokeOpacity:0.55, strokeWeight:0.8, clickable:false };
          const level = density <= cuts[0] ? 1 : density <= cuts[1] ? 2 : density <= cuts[2] ? 3 : 4;
          const color = ['#3f9646','#f4d03f','#f48b27','#d73027'][level - 1];
          return { fillColor:color, fillOpacity:0.52, strokeColor:color, strokeOpacity:0.92, strokeWeight:1.15, clickable:false };
        });
        document.getElementById('layer-note').hidden = false;
        document.getElementById('layer-source').hidden = false;
        document.getElementById('layer-source').href = 'https://www2.gov.bc.ca/assets/gov/environment/plants-animals-and-ecosystems/wildlife-wildlife-habitat/caribou/bc_caribou_herds_population_estimates.pdf';
        document.getElementById('layer-attribution').hidden = true;
        document.getElementById('layer-note-text').textContent = 'Modern: official BC caribou herd boundaries combined with the province’s latest published herd population estimates. Colour ranks estimated management-range density (population ÷ mapped herd area) by quartile: green lower, yellow moderate, orange high, red highest. IPM estimates are used where available; otherwise survey, minimum-known-alive or expert estimates. Grey means no defensible current estimate. This is average herd-range density, not animal locations; combined, minimum-count and transboundary values are approximate.';
      } else if (!showEvidence && KMZ_HEATMAPS.has(item.key) && !(item.key === 'wild_sheep' && viewMode === 'historical') && (viewMode === 'modern' || viewMode === 'historical')) {`;

source = source.replace(anchor, replacement);
fs.writeFileSync(installerPath, source);
console.log('Installed official BC modern caribou population-density renderer patch.');
