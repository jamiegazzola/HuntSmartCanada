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
// The private KMZ installer replaces the entire public species HTML during
// production builds. Carry the canonical/share metadata from the public entrypoint
// into that final private document, without changing map behaviour or private data.
const publicHtml = fs.readFileSync(path.join('species-map', 'index.html'), 'utf8');
const shareStart = '<!-- huntsmart-link-preview:start -->';
const shareEnd = '<!-- huntsmart-link-preview:end -->';
const startPos = publicHtml.indexOf(shareStart);
const endPos = publicHtml.indexOf(shareEnd, startPos + shareStart.length);
if (startPos < 0 || endPos < 0 || publicHtml.indexOf(shareStart, startPos + 1) !== -1) {
  throw new Error('Species share-preview source block is missing or duplicated');
}
const shareBlock = publicHtml.slice(startPos, endPos + shareEnd.length);
if (!shareBlock.includes('property="og:image"') ||
    !shareBlock.includes('property="og:url"') ||
    !shareBlock.includes('rel="canonical"')) {
  throw new Error('Species share-preview source block is incomplete');
}
// Replace generic social/description/canonical tags if the private viewer
// already defines them. Do not touch robots, map resources or private data.
html = html.replace(/<meta\b(?=[^>]*\bproperty\s*=\s*["']og:[^"']+["'])[^>]*>\s*/gi, '');
html = html.replace(/<meta\b(?=[^>]*\bname\s*=\s*["']twitter:[^"']+["'])[^>]*>\s*/gi, '');
html = html.replace(/<meta\b(?=[^>]*\bname\s*=\s*["']description["'])[^>]*>\s*/gi, '');
html = html.replace(/<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*>\s*/gi, '');
html = html.replace(/<!-- huntsmart-link-preview:start -->[\s\S]*?<!-- huntsmart-link-preview:end -->\s*/g, '');
html = html.replace('</head>', shareBlock + '\n</head>');
const headMarkup = html.slice(0, html.indexOf('</head>'));
for (const name of ['og:title', 'og:url', 'og:image']) {
  const count = headMarkup.split('property="' + name + '"').length - 1;
  if (count !== 1) throw new Error('Species preview must have exactly one ' + name);
}

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
const preload = '      renderSelected();\n      scheduleBackgroundKmzPreload();';
if (app.includes('BC_HISTORICAL_SOURCE_POLYGONS_2005')) {
  if (!app.includes('renderSelected(); // BC_HISTORICAL_VECTORS_ON_DEMAND') || app.includes(preload)) throw new Error('Historical polygon viewer must load on demand');
} else if (app.includes(preload)) {
  app = app.replace(preload,
    "      renderSelected().finally(() => { if (!window.matchMedia('(max-width:768px)').matches && navigator.connection?.downlink >= 10 && !navigator.connection?.saveData) setTimeout(scheduleBackgroundKmzPreload, 5000); });");
  fs.writeFileSync(appPath, app);
} else if (process.env.CONTEXT === 'production') {
  throw new Error('Expected production species preload hook is missing');
}
fs.writeFileSync(htmlPath, html);
console.log('Installed persistent Species Distribution navigation after the final map build.');
