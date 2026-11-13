'use strict';
// Run last: the live map is assembled by earlier, ordered production installers.
// Patch only the generated BC species viewer; leave Alberta, harvest and 3D intact.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const base = path.join('site', 'species-map');
const appFile = path.join(base, 'app.js');
const htmlFile = path.join(base, 'index.html');
const catalogFile = path.join(base, 'species-catalog.js');
const evidenceFile = path.join(base, 'bc-species-evidence.js');
assert(fs.existsSync(evidenceFile), 'BC evidence renderer was not copied to publish directory');
const evidence = fs.readFileSync(evidenceFile, 'utf8');
new Function(evidence);

const species = [
  ['lynx', 'Canada Lynx'],
  ['bobcat', 'Bobcat'],
  ['cougar', 'Cougar'],
  ['wolf', 'Wolf'],
  ['wolverine', 'Wolverine']
];

let catalog = fs.readFileSync(catalogFile, 'utf8');
assert(catalog.includes('window.HUNTSMART_SPECIES = [') &&
  !catalog.includes("key: 'lynx'"), 'unexpected BC catalog version');
const tail = /\n\s*\];\s*$/;
assert(tail.test(catalog), 'BC species catalog closing bracket missing');
const additional = species.map(([key,label]) =>
  "    { key: '" + key + "', label: '" + label + " (BC government evidence)', type: 'bc_official_evidence' },"
).join('\n');
catalog = catalog.replace(tail, '\n' + additional + '\n  ];\n');
new Function(catalog);

let app = fs.readFileSync(appFile, 'utf8');
const displayLine = app.match(/^  const DISPLAYED_SPECIES = new Set\([^\n]+;\s*$/m);
assert(displayLine && !app.includes('HUNTSMART_BC_EVIDENCE'),
  'production BC species filter missing or patch already installed');
app = app.replace(displayLine[0], displayLine[0] +
  '\n  for (const key of window.HUNTSMART_BC_EVIDENCE.keys) DISPLAYED_SPECIES.add(key);');

const opacityAnchor = '  function applyLayerOpacity() {';
assert(app.includes(opacityAnchor), 'opacity controller missing');
app = app.replace(opacityAnchor, opacityAnchor +
  '\n    window.HUNTSMART_BC_EVIDENCE.setOpacity(layerOpacity);');

const renderAnchor = '  async function renderSelected() {';
const renderAt = app.indexOf(renderAnchor);
assert(renderAt > 0, 'production renderer missing');
let before = app.slice(0, renderAt);
let render = app.slice(renderAt);
assert(render.includes('    clearLayer();') &&
  render.includes("      if (province === 'ab') {"),
  'BC/province render dispatch anchors missing');
render = render.replace('    clearLayer();',
  '    clearLayer();\n    window.HUNTSMART_BC_EVIDENCE.clear();');
render = render.replace("      if (province === 'ab') {",
  "      if (province === 'bc' && item.type === 'bc_official_evidence') {\n" +
  "        window.HUNTSMART_BC_EVIDENCE.render(item.key, viewMode, map, layerOpacity);\n" +
  "      } else if (province === 'ab') {");
app = before + render;
assert(app.includes('HUNTSMART_BC_EVIDENCE.render(item.key, viewMode, map, layerOpacity)'),
  'BC renderer not attached');
new Function(app);

let html = fs.readFileSync(htmlFile, 'utf8');
const appTag = html.match(/<script src="app\.js\?v=[^"]+"><\/script>/);
assert(appTag && !html.includes('bc-species-evidence.js'),
  'production map script reference missing or already installed');
html = html.replace(appTag[0],
  '<script src="bc-species-evidence.js?v=bc-carnivores-20261113a"></script>\n  ' + appTag[0]);
html = html.replace(/app\.js\?v=[^"]+/,
  'app.js?v=bc-carnivores-20261113a');
assert(html.indexOf('bc-species-evidence.js') < html.indexOf('app.js?v='),
  'government evidence must load before map application');

fs.writeFileSync(catalogFile, catalog);
fs.writeFileSync(appFile, app);
fs.writeFileSync(htmlFile, html);
console.log('Installed five BC government-evidence species without changing Alberta.');
