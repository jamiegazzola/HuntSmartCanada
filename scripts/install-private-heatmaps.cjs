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

// Production viewer is intentionally limited to the exact species groups and
// two eras contained in the supplied KMZ. Do not expose legacy seasonal or
// subspecies-specific layers here: those are separate evidence products and
// visually mixing them with the KMZ makes the map misleading.
const appReplacements = [
  [
    "const DISPLAYED_SPECIES = new Set([...KMZ_HEATMAPS, 'roosevelt_elk', 'rocky_elk_kootenay']);",
    "const DISPLAYED_SPECIES = new Set([...KMZ_HEATMAPS, 'roosevelt_elk']);",
  ],
  [
    "let viewMode = ['modern', 'winter', 'summer', 'historical'].includes(storedMode) ? storedMode : 'modern';",
    "let viewMode = ['modern', 'historical'].includes(storedMode) ? storedMode : 'modern';",
  ],
  [
    "const APP_BUILD = 'species-map-rebuild-v12';",
    "const APP_BUILD = 'species-map-roosevelt-density-v1';",
  ],
  [
    "document.getElementById('layer-note-text').textContent = 'Green: broad Vancouver Island Roosevelt elk range context, not confirmed presence everywhere or local density. Choose Winter for mapped Island winter habitat.';",
    "document.getElementById('layer-note-text').textContent = 'Mainland: latest positive 2013–2023 EPU abundance normalized by EPU area. Island: broad range context plus approved winter range where mapped.';",
  ],
  [
    "rooseveltMainlandData.setStyle({ fillOpacity:0, strokeColor:'#f5c76b', strokeOpacity:0.95, strokeWeight:1.6, zIndex:1, clickable:false });",
    "rooseveltMainlandData.setStyle((feature) => { const heat = Math.max(1, Math.min(4, Number(feature.getProperty('heat_class')) || 1)); const color = ['#3f9646','#f4d03f','#f48b27','#d73027'][heat - 1]; return { fillColor:color, fillOpacity:0.4, strokeColor:color, strokeOpacity:0.9, strokeWeight:1.3, zIndex:1, clickable:false }; });",
  ],
  [
    "document.getElementById('layer-note-text').textContent += ' Gold: mainland management units with nonzero estimates from 2013–2023, depending on unit. Outlines are not exact current occupancy or density.';",
    "document.getElementById('layer-note-text').textContent += ' Mainland fill: green→red ranks recently surveyed EPUs from lower→higher estimated elk density using each unit’s latest positive 2013–2023 estimate divided by EPU land area. It is management-unit scale, not exact animal locations.';",
  ],
  [
`          staticRange({ asset: 'data/roosevelt-elk-harvest-context.geojson' }, renderAbort.signal).then((payload) => {
            if (version !== renderVersion) return;
            contextData = new google.maps.Data({ map });
            contextData.addGeoJson(payload);
            contextData.setStyle({ fillOpacity: 0, strokeColor: '#d19cff', strokeOpacity: 0.9, strokeWeight: 1.8, clickable: false });
            document.getElementById('layer-note-text').textContent += ' Purple: units with 2020–24 licensed elk harvest, not identified to subspecies, exact location or density.';
            document.getElementById('gap-link').hidden = false;
          }),`,
`          staticRange({ asset: 'data/roosevelt-island-winter-range.geojson' }, renderAbort.signal).then((payload) => {
            if (version !== renderVersion) return;
            contextData = new google.maps.Data({ map });
            contextData.addGeoJson(payload);
            contextData.setStyle({ fillColor:'#f4b63f', fillOpacity:0.34, strokeColor:'#f4b63f', strokeOpacity:0.85, strokeWeight:1.1, zIndex:2, clickable:false });
            document.getElementById('layer-note-text').textContent += ' Orange on Vancouver Island: approved Roosevelt elk winter range where mapped. This is verified habitat evidence, not complete year-round range or local density.';
          }),`,
  ],
];

function patchProductionApp(input) {
  let app = input;
  for (const [before, after] of appReplacements) {
    if (!app.includes(before)) throw new Error(`Private species viewer patch target missing: ${before}`);
    app = app.replace(before, after);
  }
  // Parse the exact production output during every build, including deploy previews,
  // so a malformed build-time replacement cannot reach main unnoticed.
  new Function(app);
  return app;
}

const sourceAppPath = path.join(source, '..', 'app.js');
const patchedApp = patchProductionApp(fs.readFileSync(sourceAppPath, 'utf8'));
if (process.env.CONTEXT !== 'production') {
  console.log(`Verified ${staged.length} private map assets and the production viewer patch. Installation is limited to production.`);
  process.exit(0);
}

fs.mkdirSync(dest, { recursive: true });
for (const [name, bytes] of staged) fs.writeFileSync(path.join(dest, name), bytes);
fs.copyFileSync(path.join(source, 'sources.json'), path.join(dest, 'sources.json'));
for (const file of ['app.js', 'index.html', 'app.css', 'species-catalog.js']) {
  fs.copyFileSync(path.join(source, '..', file), path.join(dest, '..', file));
}
fs.writeFileSync(path.join(dest, '..', 'app.js'), patchedApp);

const catalogPath = path.join(dest, '..', 'species-catalog.js');
let catalog = fs.readFileSync(catalogPath, 'utf8');
catalog = catalog.replace("label: 'Mule Deer (including Black-tailed Deer)'", "label: 'Mule Deer'");
fs.writeFileSync(catalogPath, catalog);

// Keep the legacy elements in the private source DOM so older JS references
// remain safe, but remove them completely from the production interface.
const cssPath = path.join(dest, '..', 'app.css');
fs.appendFileSync(cssPath, `
/* HuntSmart KMZ-only production controls */
#era-winter,
#era-summer,
.evidence-toggle,
.layer-note { display: none !important; }
.era-control button { flex: 1 1 50%; }
`);

console.log(`Installed ${staged.length} verified private map assets in KMZ-only mode.`);
