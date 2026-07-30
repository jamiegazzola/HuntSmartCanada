#!/usr/bin/env bash
set -Eeuo pipefail

SOURCE="https://huntsmartcanada.netlify.app"
BUILD_ID="preview-20260730-bulletproof-2"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Preserve the small review-only assets before replacing the old proxy shell.
for file in ux.css ux.js dom-patch.js auth-bypass.js; do
  test -s "site/preview/$file" || { echo "Missing preview asset: $file" >&2; exit 1; }
  cp "site/preview/$file" "$TMP/$file"
done

rm -rf site
mkdir -p site

files=(
  "Images/logo.png"
  "ab-cards.js"
  "ab-draws.js"
  "ab-filters.js"
  "ab-wmu-geojson-1.js"
  "ab-wmu-geojson-2.js"
  "ab-wmu-geojson-3.js"
  "ab-wmu-geojson.js"
  "ab_elk_10yrdata.json"
  "ab_harvest_success_2024.json"
  "ab_terrain.json"
  "admin.html"
  "alberta_2024_huntcode_harvest_success_matched_only.json"
  "alberta_antelope_harvest_2015_2024.json"
  "alberta_harvest_master.json"
  "alberta_moose_harvest_2015_2024.json"
  "alberta_mule_deer_harvest_2015_2024.json"
  "alberta_white_tailed_deer_harvest_2015_2024.json"
  "alberta_wood_bison_harvest_2015_2025.json"
  "auth-styles.css"
  "auth.js"
  "bc-detail.js"
  "bc-draws.js"
  "bc-filters.js"
  "bc-open-seasons.js"
  "bc-ram-age.js"
  "bc-region-geojson.js"
  "bc-saved-compare.js"
  "bc-wmu-geojson.js"
  "card-map-3d-fullscreen-fix.js"
  "cities.js"
  "config.js"
  "data.js"
  "draws.json"
  "draws_harvest_verified_only.json"
  "drive-time.js"
  "drive-times.js"
  "historical_wildfires_simplified_50m.geojson"
  "homepage-polish.css"
  "homepage-polish.js"
  "hs-offline-lite-sw.js"
  "hunting-partners.js"
  "images/filter-bg.jpg"
  "images/hero-bg.jpg"
  "images/logo.png"
  "index.html"
  "leh_draw_card.html"
  "leh_sheep_zones.json"
  "leh_zones.json"
  "maps.js"
  "preview.jpg"
  "ram_age_by_mu.json"
  "snow_layers_manifest.json"
  "stripe-styles.css"
  "stripe.js"
  "style.css"
  "sync.js"
  "ui.js"
  "writeups.json"
)

download_one() {
  local path="$1"
  mkdir -p "site/$(dirname "$path")"
  curl --fail --location --silent --show-error \
    --retry 4 --retry-delay 2 --connect-timeout 20 --max-time 180 \
    -H 'Cache-Control: no-cache' \
    "$SOURCE/$path?preview_build=$BUILD_ID" \
    -o "site/$path"
  test -s "site/$path" || { echo "Downloaded empty file: $path" >&2; exit 1; }
}

for path in "${files[@]}"; do
  echo "Downloading $path"
  download_one "$path"
done

mkdir -p site/preview
cp "$TMP/ux.css" site/preview/ux.css
cp "$TMP/ux.js" site/preview/ux.js
cp "$TMP/dom-patch.js" site/preview/dom-patch.js
cp "$TMP/auth-bypass.js" site/preview/auth-bypass.js

node <<'NODE'
const fs = require('fs');
const buildId = 'preview-20260730-bulletproof-2';
const indexPath = 'site/index.html';
let html = fs.readFileSync(indexPath, 'utf8');

function replaceRequired(pattern, replacement, label) {
  const next = html.replace(pattern, replacement);
  if (next === html) throw new Error(`Required index patch failed: ${label}`);
  html = next;
}

// Preview identity and stale-cache cleanup run before any app code.
replaceRequired(
  /<title>[^<]*<\/title>/i,
  `<title>HuntSmart Canada — Preview</title>\n<script>\nwindow.HUNTSMART_PREVIEW_MODE=true;window.__HS_PREVIEW_NO_AUTH=true;window.HUNTSMART_BUILD_ID='${buildId}';\nif('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(r=>r.forEach(x=>x.unregister())).catch(()=>{});}\nif(window.caches&&caches.keys){caches.keys().then(k=>k.forEach(x=>caches.delete(x))).catch(()=>{});}\n</script>`,
  'preview bootstrap'
);

// Restore browser zoom and remove inactive payment/auth code from this preview only.
html = html.replace(/maximum-scale=1\.0,\s*user-scalable=no,\s*/i, '');
html = html.replace(/<link[^>]+stripe-styles\.css[^>]*>\s*/i, '');
html = html.replace(/<script[^>]+src="\.\/stripe\.js[^>]*><\/script>\s*/i, '');
html = html.replace(/<script[^>]+src="\.\/auth\.js[^>]*><\/script>\s*/i, '');
html = html.replace(/<script[^>]+src="\.\/hunting-partners\.js[^>]*><\/script>\s*/i, '');

// Remove the dated homepage line at the source, rather than hiding it later.
replaceRequired(/<div class="hero-eyebrow">[\s\S]*?<\/div>\s*/i, '', 'remove homepage season line');

// Clear, stable navigation labels.
const labels = {
  navHome: 'Home', navBC: 'BC Draws', navBCOS: 'Open Seasons', navAlberta: 'AB Draws',
  mNavHome: 'Home', mNavBC: 'BC Draws', mNavBCOS: 'Open Seasons', mNavAlberta: 'Alberta Draws'
};
for (const [id, label] of Object.entries(labels)) {
  const re = new RegExp(`(<a[^>]*id="${id}"[^>]*>)[\\s\\S]*?(<\\/a>)`, 'i');
  const match = html.match(re);
  if (!match) throw new Error(`Navigation item missing: ${id}`);
  html = html.replace(re, `$1${label}$2`);
}

// Add real hrefs while preserving the existing tested onclick navigation.
const hrefs = {
  navHome:'#home', navBC:'#bc-draws', navBCOS:'#open-seasons', navAlberta:'#alberta-draws', navMap:'#map', navSaved:'#saved',
  mNavHome:'#home', mNavBC:'#bc-draws', mNavBCOS:'#open-seasons', mNavAlberta:'#alberta-draws', mNavMap:'#map', mNavSaved:'#saved'
};
for (const [id, href] of Object.entries(hrefs)) {
  const re = new RegExp(`<a([^>]*id="${id}"[^>]*)>`, 'i');
  const m = html.match(re);
  if (!m) throw new Error(`Cannot add href to ${id}`);
  if (!/\shref=/.test(m[0])) html = html.replace(re, `<a$1 href="${href}">`);
}

// Visible open-season labels must never regress to the abbreviation.
html = html.replace(/>BC GOS</g, '>Open Seasons<');
html = html.replace(/(<span[^>]*gos-tp-label[^>]*>)BC GOS(<\/span>)/gi, '$1Open Seasons$2');

// Add preview styling and scripts as defer scripts AFTER the app's own defer scripts.
replaceRequired(
  /<link href="\.\/auth-styles\.css([^>]*)>/i,
  `<link href="./preview/ux.css?v=${buildId}" rel="stylesheet"><link href="./auth-styles.css$1>`,
  'preview stylesheet'
);
replaceRequired(
  /(<script defer src="\.\/homepage-polish\.js[^>]*><\/script>)/i,
  `$1\n<script defer src="./preview/dom-patch.js?v=${buildId}"></script>\n<script defer src="./preview/auth-bypass.js?v=${buildId}"></script>\n<script defer src="./preview/ux.js?v=${buildId}"></script>`,
  'ordered preview scripts'
);

// A preview build must never install the offline service worker.
html = html.replace("if ('serviceWorker' in navigator && isMobileLike()) {", "if (!window.HUNTSMART_PREVIEW_MODE && 'serviceWorker' in navigator && isMobileLike()) {");

fs.writeFileSync(indexPath, html);

function patchFile(path, mutate) {
  const before = fs.readFileSync(path, 'utf8');
  const after = mutate(before);
  if (after === before) throw new Error(`Required file patch failed: ${path}`);
  fs.writeFileSync(path, after);
}

patchFile('site/bc-filters.js', s => s.replace('if (!window._authUser) {', 'if (!window._authUser && !window.HUNTSMART_PREVIEW_MODE) {'));
patchFile('site/ab-filters.js', s => s.replace('if (!window._authUser) {', 'if (!window._authUser && !window.HUNTSMART_PREVIEW_MODE) {'));
patchFile('site/bc-open-seasons.js', s => s.replace('<div class="gos-tb-label">BC GOS</div>', '<div class="gos-tb-label">Open Seasons</div>'));
NODE

# Preview-only browser status and local-save behavior.
cat > site/preview/auth-bypass.js <<'EOF'
/* HuntSmart Canada — isolated preview mode. Production auth is untouched. */
(function () {
  'use strict';
  window.HUNTSMART_PREVIEW_MODE = true;
  window.__HS_PREVIEW_NO_AUTH = true;
  window._authUser = null;
  window._pendingShowResults = null;
  window.HS = window.HS || {};
  window.HS.trackSearch = window.HS.trackSearch || function () {};
  window.openAuthModal = function () {};
  window.closeAuthModal = function () { document.getElementById('authModal')?.remove(); };

  function apply() {
    document.getElementById('authModal')?.remove();
    const button = document.getElementById('authNavBtn');
    if (button) {
      button.textContent = 'Preview Mode';
      button.disabled = true;
      button.onclick = null;
      button.dataset.authState = 'preview';
      button.title = 'Preview mode — saved items remain in this browser';
      button.setAttribute('aria-label', button.title);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once:true });
  else apply();
  window.addEventListener('load', apply, { once:true });
  new MutationObserver(apply).observe(document.documentElement, { childList:true, subtree:true });
})();
EOF

cat > site/_headers <<'EOF'
/*
  Cache-Control: no-store, no-cache, must-revalidate, max-age=0
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
EOF

cat > site/BUILD_INFO.txt <<EOF
HuntSmart Canada isolated Netlify preview
Build ID: $BUILD_ID
Built from a validated snapshot of the current working production deployment.
Firebase authentication: disabled only in this preview.
Production site: unchanged.
EOF

# Hard deployment invariants. A regression fails the Netlify build.
node <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('site/index.html','utf8');
const required = [
  ['dated season removed', !html.includes('British Columbia &amp; Alberta · 2025 Season') && !html.includes('British Columbia & Alberta · 2025 Season')],
  ['Open Seasons desktop', /id="navBCOS"[\s\S]*?>Open Seasons<\/a>/.test(html)],
  ['Open Seasons mobile', /id="mNavBCOS"[\s\S]*?>Open Seasons<\/a>/.test(html)],
  ['preview flag', html.includes('HUNTSMART_PREVIEW_MODE=true')],
  ['auth module absent', !/src="\.\/auth\.js/.test(html)],
  ['partners module absent', !/src="\.\/hunting-partners\.js/.test(html)],
  ['ordered preview scripts', html.indexOf('homepage-polish.js') < html.indexOf('preview/dom-patch.js') && html.indexOf('preview/dom-patch.js') < html.indexOf('preview/auth-bypass.js') && html.indexOf('preview/auth-bypass.js') < html.indexOf('preview/ux.js')],
  ['BC gate bypass', fs.readFileSync('site/bc-filters.js','utf8').includes('!window._authUser && !window.HUNTSMART_PREVIEW_MODE')],
  ['AB gate bypass', fs.readFileSync('site/ab-filters.js','utf8').includes('!window._authUser && !window.HUNTSMART_PREVIEW_MODE')]
];
for (const [name, ok] of required) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}`);
  if (!ok) process.exitCode = 1;
}
NODE

for file in site/*.js site/preview/*.js; do node --check "$file" >/dev/null; done

test -s site/draws.json
test -s site/leh_zones.json
test -s site/images/hero-bg.jpg
echo "Preview build validated: $BUILD_ID"
