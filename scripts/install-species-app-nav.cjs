'use strict';
/* Last-step species-map navigation reconciliation.
 * Production's validated private map installer replaces the public viewer
 * index.html, so public mobile navigation must be restored AFTER all patches.
 * Never copy private data or replace the production map engine.
 */
const fs = require('node:fs');
const path = require('node:path');

const directory = process.env.HS_SPECIES_NAV_TARGET || path.join('site','species-map');
const htmlPath = path.join(directory,'index.html');
for (const file of ['index.html','hs-app-nav.css','hs-app-nav.js']) {
  if (!fs.existsSync(path.join(directory,file))) {
    throw new Error('Species app navigation asset missing: ' + file);
  }
}
let html = fs.readFileSync(htmlPath,'utf8');
const cssTag = '<link rel="stylesheet" href="hs-app-nav.css?v=20261120-ux1">';
const scriptTag = '<script src="hs-app-nav.js?v=20261120-ux1"></script>';
if (!/\bhs-app-nav\.css(?:\?|["'])/.test(html)) {
  if (!/<\/head\s*>/i.test(html)) throw new Error('Species viewer has no </head> injection anchor');
  html = html.replace(/<\/head\s*>/i, '  ' + cssTag + '\n</head>');
}
if (!/\bhs-app-nav\.js(?:\?|["'])/.test(html)) {
  if (!/<\/body\s*>/i.test(html)) throw new Error('Species viewer has no </body> injection anchor');
  html = html.replace(/<\/body\s*>/i, '  ' + scriptTag + '\n</body>');
}
const matches = (name) => (html.match(new RegExp('(?:href|src)=["\\\'][^"\\\']*' + name + '(?:\\?[^"\\\']*)?["\\\']','g')) || []).length;
if (matches('hs-app-nav\\.css') !== 1 || matches('hs-app-nav\\.js') !== 1) {
  throw new Error('Species viewer navigation references missing or duplicated');
}
fs.writeFileSync(htmlPath,html);
console.log('Species viewer app navigation installed exactly once after map build.');
