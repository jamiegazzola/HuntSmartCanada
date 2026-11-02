'use strict';
const fs = require('node:fs');
const path = require('node:path');

const installerPath = path.join('scripts', 'install-private-heatmaps.cjs');
let source = fs.readFileSync(installerPath, 'utf8');

const queueAnchor = `    "    const queue = [...keys.map(key => 'kmz-' + key + '-historic.png'), ...keys.map(key => 'kmz-' + key + '-modern.png')];",`;
const queueReplacement = `    "    const queue = [...keys.map(key => 'kmz-' + key + '-historic.png'), ...keys.filter(key => key !== 'caribou').map(key => 'kmz-' + key + '-modern.png')];",`;
if (!source.includes(queueAnchor)) throw new Error('Species preload queue anchor is missing');
source = source.replace(queueAnchor, queueReplacement);

const warmAnchor = `    "        recentRoosevelt(preloadController.signal),",`;
const warmReplacement = `${warmAnchor}\n    "        staticRange({ asset:'data/caribou-herds.geojson', key:'caribou' }, preloadController.signal),",`;
if (!source.includes(warmAnchor)) throw new Error('Species vector warmup anchor is missing');
source = source.replace(warmAnchor, warmReplacement);

fs.writeFileSync(installerPath, source);
console.log('Removed unverified modern caribou KMZ from preload and warmed official herd GeoJSON instead.');
