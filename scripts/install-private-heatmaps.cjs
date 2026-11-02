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
console.log(`Installed ${staged.length} verified private map assets.`);
