'use strict';
// The private repository is pinned as a git submodule. Only validated image
// files are copied into the existing password-protected species-map path.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const source = path.join('private-species-map', 'species-map', 'data');
const dest = path.join('site', 'species-map', 'data');
const manifest = JSON.parse(fs.readFileSync(path.join(source, 'sources.json'), 'utf8'));
const groups = ['elk','moose','mule_deer','white_tailed_deer','mountain_goat','wild_sheep','caribou'];
const files = groups.flatMap(group => ['modern','historic'].map(era => `kmz-${group}-${era}.png`));
const staged = files.map(name => {
  const bytes = fs.readFileSync(path.join(source, name));
  const hash = crypto.createHash('sha256').update(bytes).digest('hex');
  if (!manifest[name]?.output_sha256 || hash !== manifest[name].output_sha256) throw new Error(`Private map asset failed integrity check: ${name}`);
  return [name, bytes];
});
if (process.env.CONTEXT !== 'production') {
  console.log(`Verified access to ${staged.length} private map assets. Installation is limited to production.`);
  process.exit(0);
}
fs.mkdirSync(dest, { recursive: true });
for (const [name, bytes] of staged) fs.writeFileSync(path.join(dest, name), bytes);
fs.copyFileSync(path.join(source, 'sources.json'), path.join(dest, 'sources.json'));
for (const file of ['app.js', 'index.html', 'app.css', 'species-catalog.js']) {
  fs.copyFileSync(path.join(source, '..', file), path.join(dest, '..', file));
}

// Production viewer uses the exact Modern/Historical KMZ rasters for the seven
// KMZ species groups. Roosevelt elk is the one additional species because BC's
// South Coast SBOT provides a defensible dedicated mainland population source.
const appPath = path.join(dest, '..', 'app.js');
let app = fs.readFileSync(appPath, 'utf8');
const appReplacements = [
  [
    "const DISPLAYED_SPECIES = new Set([...KMZ_HEATMAPS, 'roosevelt_elk', 'rocky_elk_kootenay']);",
    "const DISPLAYED_SPECIES = new Set([...KMZ_HEATMAPS, 'roosevelt_elk']);",
  ],
  [
    "const storedMode = localStorage.getItem('bc-species-map-era');",
    "const storedMode = localStorage.getItem('bc-species-map-era-v3');",
  ],
  [
    "let viewMode = ['modern', 'winter', 'summer', 'historical'].includes(storedMode) ? storedMode : 'modern';",
    "let viewMode = ['modern', 'historical'].includes(storedMode) ? storedMode : 'modern';",
  ],
  [
    "localStorage.setItem('bc-species-map-era', mode);",
    "localStorage.setItem('bc-species-map-era-v3', mode);",
  ],
  [
    "const APP_BUILD = 'species-map-rebuild-v12';",
    "const APP_BUILD = 'species-map-kmz-v12-current-default';",
  ],
];
for (const [before, after] of appReplacements) {
  if (!app.includes(before)) throw new Error(`Private species viewer patch target missing: ${before}`);
  app = app.replace(before, after);
}

// For modern mainland Roosevelt elk, keep only EPUs with a positive 2013-2023
// abundance estimate, then colour those current/recent units using the BC EPU
// density field. This is materially more useful than the former outline-only
// display while retaining BC's actual EPU geometry.
const rooseveltBefore = `          recentRoosevelt(renderAbort.signal).then(payload => {
            if (version !== renderVersion) return;
            rooseveltMainlandData = new google.maps.Data({ map });
            rooseveltMainlandData.addGeoJson(payload);
            rooseveltMainlandData.setStyle({ fillOpacity:0, strokeColor:'#f5c76b', strokeOpacity:0.95, strokeWeight:1.6, zIndex:1, clickable:false });
            document.getElementById('roosevelt-recent-link').hidden = false;
            document.getElementById('layer-note-text').textContent += ' Gold: mainland management units with nonzero estimates from 2013–2023, depending on unit. Outlines are not exact current occupancy or density.';
          }),`;
const rooseveltAfter = `          Promise.all([recentRoosevelt(renderAbort.signal), rooseveltSpecies(renderAbort.signal)]).then(([recent, epu]) => {
            if (version !== renderVersion) return;
            const normalizeUnit = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const densityByUnit = new Map(epu.geojson.features.map(feature => [
              normalizeUnit(feature.properties?.EPU_Unit_Name),
              Number(feature.properties?.__density),
            ]));
            const features = recent.features.map(feature => ({
              ...feature,
              properties: {
                ...feature.properties,
                __density: densityByUnit.get(normalizeUnit(feature.properties?.unit)),
              },
            }));
            rooseveltMainlandData = new google.maps.Data({ map });
            rooseveltMainlandData.addGeoJson({ type:'FeatureCollection', features });
            const cuts = Array.isArray(epu.cuts) && epu.cuts.length === 3 ? epu.cuts : [0.01, 0.03, 0.06];
            rooseveltMainlandData.setStyle(feature => {
              const value = Number(feature.getProperty('__density'));
              const level = !Number.isFinite(value) || value <= 0 ? 1 : value <= cuts[0] ? 1 : value <= cuts[1] ? 2 : value <= cuts[2] ? 3 : 4;
              const color = PALETTE[level];
              return {
                fillColor: \`rgb(\${color[0]},\${color[1]},\${color[2]})\`,
                fillOpacity: 0.62,
                strokeColor: '#ffffff',
                strokeOpacity: 0.35,
                strokeWeight: 0.7,
                zIndex: 1,
                clickable: false,
              };
            });
            document.getElementById('roosevelt-recent-link').hidden = false;
            document.getElementById('layer-note-text').textContent += ' Mainland: BC South Coast EPUs with positive 2013–2023 abundance estimates, coloured by relative EPU density. EPU polygons are management-scale distribution evidence, not exact animal locations.';
          }),`;
if (!app.includes(rooseveltBefore)) throw new Error('Private species viewer Roosevelt patch target missing');
app = app.replace(rooseveltBefore, rooseveltAfter);
fs.writeFileSync(appPath, app);

const catalogPath = path.join(dest, '..', 'species-catalog.js');
let catalog = fs.readFileSync(catalogPath, 'utf8');
const muleBefore = "{ key: 'mule_deer', label: 'Mule Deer (including Black-tailed Deer)',";
const muleAfter = "{ key: 'mule_deer', label: 'Mule Deer',";
if (!catalog.includes(muleBefore)) throw new Error('Private species viewer Mule Deer label patch target missing');
catalog = catalog.replace(muleBefore, muleAfter);
fs.writeFileSync(catalogPath, catalog);

// Keep legacy elements in the private source DOM so older JS references remain
// safe, but remove seasonal controls, evidence toggles, and the text card from
// the production interface.
const cssPath = path.join(dest, '..', 'app.css');
fs.appendFileSync(cssPath, `
/* HuntSmart Modern/Historical production controls */
#era-winter,
#era-summer,
.evidence-toggle,
.layer-note { display: none !important; }
.era-control button { flex: 1 1 50%; }
`);

console.log(`Installed ${staged.length} verified private map assets with Modern default and verified Roosevelt support.`);
