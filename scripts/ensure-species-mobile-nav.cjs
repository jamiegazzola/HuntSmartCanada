'use strict';
/* Install the product navigation AFTER the private production viewer is copied
   over site/species-map/index.html. Never modify private map or wildlife data. */
const fs = require('node:fs');
const path = require('node:path');
const dir = path.join('site', 'species-map');
const htmlPath = path.join(dir, 'index.html');
for (const name of ['index.html', 'hs-app-nav.js', 'hs-app-nav.css', 'hs-map-recovery.js']) {
  if (!fs.existsSync(path.join(dir, name))) throw new Error('Missing species navigation asset: ' + name);
}
let html = fs.readFileSync(htmlPath, 'utf8');
// The production map can replace the public document. Keep the display controls accessible.
html = html.replace(/class=["']map-tools["']\s+aria-label=/, 'class="map-tools" role="group" aria-label=');
if (!html.includes('</head>') || !html.includes('</body>') ||
    !html.includes('id="species"')) {
  throw new Error('Production species viewer markup changed; cannot install navigation safely');
}
// Preview has the entrypoints already; production's private KMZ installer replaces
// the whole HTML document. Normalize both to one early-loaded entrypoint.
html = html.replace(/\s*<link\s+[^>]*href=["'](?:\.\/|\/species-map\/)?hs-app-nav\.css(?:\?[^"']*)?["'][^>]*>/g, '');
html = html.replace(/\s*<script\s+[^>]*src=["'](?:\.\/|\/species-map\/)?hs-app-nav\.js(?:\?[^"']*)?["'][^>]*><\/script>/g, '');
html = html.replace(/\s*<script\s+[^>]*src=["'](?:\.\/|\/species-map\/)?hs-map-recovery\.js(?:\?[^"']*)?["'][^>]*><\/script>/g, '');
const block = [
  '  <link rel="stylesheet" href="/species-map/hs-app-nav.css?v=20261122-clean-map">',
  '  <script async src="/species-map/hs-app-nav.js?v=20261120-direct-map"></script>',
  '  <script defer src="/species-map/hs-map-recovery.js?v=20261120a"></script>'
].join('\n');
html = html.replace('</head>', block + '\n</head>');
if ((html.match(/hs-app-nav\.js/g) || []).length !== 1 ||
    (html.match(/hs-app-nav\.css/g) || []).length !== 1 ||
    (html.match(/hs-map-recovery\.js/g) || []).length !== 1) {
  throw new Error('Species navigation must be installed exactly once');
}
// Large private KMZ previews were being decoded and four historical requests
// were kicked off while mobile users were still waiting for the first layer.
// Keep on-demand loading; desktop may prewarm when idle.
const appPath = path.join(dir, 'app.js');
let app = fs.readFileSync(appPath, 'utf8');
const preload = '      scheduleBackgroundKmzPreload();';
if (app.includes(preload)) {
  app = app.replace(preload,
    "      if (!window.matchMedia('(max-width:768px)').matches) scheduleBackgroundKmzPreload();");
  fs.writeFileSync(appPath, app);
} else if (process.env.CONTEXT === 'production') {
  throw new Error('Expected production species preload hook is missing');
}
fs.writeFileSync(htmlPath, html);
console.log('Installed persistent Species Distribution navigation after the final map build.');
