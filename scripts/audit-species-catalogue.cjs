'use strict';
// Audit actual checked-in map inputs; do not infer presence from missing data.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve('species-map');
const context = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(path.join(root, 'species-catalog.js'), 'utf8'), context);
const items = context.window.HUNTSMART_SPECIES;
if (!Array.isArray(items) || items.length !== 26) throw Error('Unexpected catalogue');
const keys = new Set();
const reports = [];
for (const item of items) {
  if (keys.has(item.key)) throw Error(`Duplicate species: ${item.key}`);
  keys.add(item.key);
  const referenced = new Set();
  if (item.asset) referenced.add(item.asset);
  if (item.type === 'raster') {
    referenced.add(`data/winter-${item.key}.png`);
    referenced.add(`data/harvest-context-${item.key}.geojson`);
  }
  const missing = [...referenced].filter(file => !fs.existsSync(path.join(root, file)));
  if (missing.length) throw Error(`${item.key}: missing ${missing.join(', ')}`);
  const historical = item.type === 'raster' || item.type === 'grizzly' || item.type === 'roosevelt' || ['caribou','rocky_elk_kootenay','wild_sheep','bighorn_sheep','thinhorn_sheep','stone_sheep','dall_tatshenshini','rocky_bighorn_kootenay','california_bighorn_boundary','black_bear'].includes(item.key);
  const winter = ['raster','partial_winter','roosevelt','stone'].includes(item.type) || ['wild_sheep','bighorn_sheep','thinhorn_sheep','caribou','caribou_mountain'].includes(item.key);
  const summer = ['caribou','caribou_mountain'].includes(item.key);
  reports.push({ key:item.key, label:item.label, modern:item.type !== 'partial_winter', winter, summer, historical, referenced_files:[...referenced], limitations:'Availability means a layer exists, not complete coverage or verified density.' });
}
console.log(JSON.stringify({ species:reports.length, seasons:['modern','winter','summer','historical'], summary:Object.fromEntries(['modern','winter','summer','historical'].map(mode => [mode,reports.filter(r=>r[mode]).length])), entries:reports }, null, 2));
