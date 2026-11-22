'use strict';
// Keep public draw data on the same atomic deployment as its consuming code.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const file = 'site/data.js';
let source = fs.readFileSync(file, 'utf8');
fs.mkdirSync('site/app-data', {recursive:true});
source = source.replace(/https:\/\/raw\.githubusercontent\.com\/jamiegazzola\/HuntSmartCanada\/main\/([\w.-]+\.json)/g, (_, name) => {
  const data = JSON.stringify(JSON.parse(fs.readFileSync(name, 'utf8')));
  const hash = crypto.createHash('sha256').update(data).digest('hex').slice(0,16);
  const asset = `${path.basename(name, '.json')}.${hash}.json`;
  fs.writeFileSync(path.join('site/app-data', asset), data);
  return `/app-data/${asset}`;
});
fs.writeFileSync(file, source);
let html = fs.readFileSync('site/index.html','utf8');
// Content-version changed startup scripts so the PWA and browser revalidate them.
for (const name of ['data.js','maps.js','map-vector-runtime.js','map-prewarm-runtime.js']) {
  const hash = crypto.createHash('sha256').update(fs.readFileSync('site/'+name)).digest('hex').slice(0,16);
  html = html.replace(new RegExp('('+name.replaceAll('.', '\\.')+')(?:\\?[^"\\s<]*)?', 'g'), `$1?v=${hash}`);
}
const drawUrl = source.match(/const DATA_URL = '([^']+)'/)[1];
html = html.replace('</head>', `<meta name="huntsmart-startup-commit" content="${process.env.COMMIT_REF || 'local'}">\n<link rel="preload" as="fetch" crossorigin href="${drawUrl}">\n<link rel="preload" as="fetch" crossorigin href="/map-tiles/20261122-v4/manifest.json?v=2026-10-28-vector-v2">\n</head>`);
fs.writeFileSync('site/index.html',html);
console.log('Map startup: deployed, compact, content-versioned draw data and early manifest fetch.');
