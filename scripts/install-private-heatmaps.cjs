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

// Production viewer is intentionally limited to the exact species groups and
// two eras contained in the supplied KMZ. Do not expose legacy seasonal or
// subspecies-specific layers here: those are separate evidence products and
// visually mixing them with the KMZ makes the map misleading.
const appPath = path.join(dest, '..', 'app.js');
let app = fs.readFileSync(appPath, 'utf8');
const appReplacements = [
  [
    "const DISPLAYED_SPECIES = new Set([...KMZ_HEATMAPS, 'roosevelt_elk', 'rocky_elk_kootenay']);",
    'const DISPLAYED_SPECIES = new Set(KMZ_HEATMAPS);',
  ],
  [
    "let viewMode = ['modern', 'winter', 'summer', 'historical'].includes(storedMode) ? storedMode : 'modern';",
    "let viewMode = ['modern', 'historical'].includes(storedMode) ? storedMode : 'modern';",
  ],
  [
    "const APP_BUILD = 'species-map-rebuild-v12';",
    "const APP_BUILD = 'species-map-kmz-v12-clean';",
  ],
];
for (const [before, after] of appReplacements) {
  if (!app.includes(before)) throw new Error(`Private species viewer patch target missing: ${before}`);
  app = app.replace(before, after);
}
fs.writeFileSync(appPath, app);

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
