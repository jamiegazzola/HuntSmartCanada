#!/usr/bin/env bash
set -Eeuo pipefail

SOURCE="https://huntsmartcanada.netlify.app"
BUILD_ID="preview-20260730-bulletproof-3"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

for file in ux.css ux.js dom-patch.js auth-bypass.js; do
  test -s "site/preview/$file" || { echo "Missing preview asset: $file" >&2; exit 1; }
  cp "site/preview/$file" "$TMP/$file"
done

rm -rf site
mkdir -p site/preview
cp "$TMP/ux.css" site/preview/ux.css
cp "$TMP/ux.js" site/preview/ux.js
cp "$TMP/dom-patch.js" site/preview/dom-patch.js
cp "$TMP/auth-bypass.js" site/preview/auth-bypass.js

download() {
  local path="$1"
  curl --fail --location --silent --show-error \
    --retry 5 --retry-delay 2 --connect-timeout 20 --max-time 180 \
    -H 'Cache-Control: no-cache' \
    "$SOURCE/$path?preview_build=$BUILD_ID" -o "site/$path"
  test -s "site/$path" || { echo "Empty download: $path" >&2; exit 1; }
}

# Only the HTML and the three scripts changed by preview mode are copied.
# Every other unchanged asset is served through the same-origin fallback below.
download index.html
download bc-filters.js
download ab-filters.js
download bc-open-seasons.js

node <<'NODE'
const fs = require('fs');
const buildId = 'preview-20260730-bulletproof-3';
let html = fs.readFileSync('site/index.html', 'utf8');

function required(pattern, replacement, label) {
  const next = html.replace(pattern, replacement);
  if (next === html) throw new Error(`Required patch failed: ${label}`);
  html = next;
}

required(/<title>[^<]*<\/title>/i,
  `<title>HuntSmart Canada — Preview</title>\n<script>window.HUNTSMART_PREVIEW_MODE=true;window.__HS_PREVIEW_NO_AUTH=true;window.HUNTSMART_BUILD_ID='${buildId}';if('serviceWorker'in navigator){navigator.serviceWorker.getRegistrations().then(r=>r.forEach(x=>x.unregister())).catch(()=>{});}if(window.caches&&caches.keys){caches.keys().then(k=>k.forEach(x=>caches.delete(x))).catch(()=>{});}</script>`,
  'preview bootstrap');

html = html.replace(/maximum-scale=1\.0,\s*user-scalable=no,\s*/i, '');
html = html.replace(/<link[^>]+stripe-styles\.css[^>]*>\s*/i, '');
html = html.replace(/<script[^>]+src="\.\/stripe\.js[^>]*><\/script>\s*/i, '');
html = html.replace(/<script[^>]+src="\.\/auth\.js[^>]*><\/script>\s*/i, '');
html = html.replace(/<script[^>]+src="\.\/hunting-partners\.js[^>]*><\/script>\s*/i, '');
required(/<div class="hero-eyebrow">[\s\S]*?<\/div>\s*/i, '', 'remove 2025 season line');

const labels = {
  navHome:'Home', navBC:'BC Draws', navBCOS:'Open Seasons', navAlberta:'AB Draws',
  mNavHome:'Home', mNavBC:'BC Draws', mNavBCOS:'Open Seasons', mNavAlberta:'Alberta Draws'
};
for (const [id,label] of Object.entries(labels)) {
  const re = new RegExp(`(<a[^>]*id="${id}"[^>]*>)[\\s\\S]*?(<\\/a>)`, 'i');
  if (!re.test(html)) throw new Error(`Missing nav item: ${id}`);
  html = html.replace(re, `$1${label}$2`);
}

const hrefs = {
  navHome:'#home', navBC:'#bc-draws', navBCOS:'#open-seasons', navAlberta:'#alberta-draws', navMap:'#map', navSaved:'#saved',
  mNavHome:'#home', mNavBC:'#bc-draws', mNavBCOS:'#open-seasons', mNavAlberta:'#alberta-draws', mNavMap:'#map', mNavSaved:'#saved'
};
for (const [id,href] of Object.entries(hrefs)) {
  const re = new RegExp(`<a([^>]*id="${id}"[^>]*)>`, 'i');
  const match = html.match(re);
  if (!match) throw new Error(`Missing href target: ${id}`);
  if (!/\shref=/.test(match[0])) html = html.replace(re, `<a$1 href="${href}">`);
}

html = html.replace(/>BC GOS</g, '>Open Seasons<');
html = html.replace(/(<span[^>]*gos-tp-label[^>]*>)BC GOS(<\/span>)/gi, '$1Open Seasons$2');

required(/<link href="\.\/auth-styles\.css([^>]*)>/i,
  `<link href="./preview/ux.css?v=${buildId}" rel="stylesheet"><link href="./auth-styles.css$1>`,
  'preview stylesheet');
required(/(<script defer src="\.\/homepage-polish\.js[^>]*><\/script>)/i,
  `$1\n<script defer src="./preview/dom-patch.js?v=${buildId}"></script>\n<script defer src="./preview/auth-bypass.js?v=${buildId}"></script>\n<script defer src="./preview/ux.js?v=${buildId}"></script>`,
  'ordered preview scripts');

html = html.replace("if ('serviceWorker' in navigator && isMobileLike()) {", "if (!window.HUNTSMART_PREVIEW_MODE && 'serviceWorker' in navigator && isMobileLike()) {");
fs.writeFileSync('site/index.html', html);

function patch(path, from, to) {
  const before = fs.readFileSync(path,'utf8');
  const after = before.replace(from,to);
  if (after === before) throw new Error(`Required file patch failed: ${path}`);
  fs.writeFileSync(path,after);
}
patch('site/bc-filters.js','if (!window._authUser) {','if (!window._authUser && !window.HUNTSMART_PREVIEW_MODE) {');
patch('site/ab-filters.js','if (!window._authUser) {','if (!window._authUser && !window.HUNTSMART_PREVIEW_MODE) {');
patch('site/bc-open-seasons.js','<div class="gos-tb-label">BC GOS</div>','<div class="gos-tb-label">Open Seasons</div>');
NODE

cat > site/preview/auth-bypass.js <<'EOF'
(function(){'use strict';window.HUNTSMART_PREVIEW_MODE=true;window.__HS_PREVIEW_NO_AUTH=true;window._authUser=null;window._pendingShowResults=null;window.HS=window.HS||{};window.HS.trackSearch=window.HS.trackSearch||function(){};window.openAuthModal=function(){};window.closeAuthModal=function(){document.getElementById('authModal')?.remove();};function apply(){document.getElementById('authModal')?.remove();const b=document.getElementById('authNavBtn');if(b){b.textContent='Preview Mode';b.disabled=true;b.onclick=null;b.dataset.authState='preview';b.title='Preview mode — saved items remain in this browser';b.setAttribute('aria-label',b.title);}}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();window.addEventListener('load',apply,{once:true});new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});})();
EOF

cat > site/_redirects <<'EOF'
/*  https://huntsmartcanada.netlify.app/:splat  200
EOF

cat > site/_headers <<'EOF'
/*
  Cache-Control: no-store, no-cache, must-revalidate, max-age=0
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
EOF

cat > site/BUILD_INFO.txt <<EOF
HuntSmart Canada isolated preview
Build ID: $BUILD_ID
Static preview HTML with validated local critical scripts.
Authentication disabled only in preview; production unchanged.
EOF

node <<'NODE'
const fs=require('fs');const h=fs.readFileSync('site/index.html','utf8');const checks=[
['old season absent',!h.includes('2025 Season')],
['desktop Open Seasons',/id="navBCOS"[\s\S]*?>Open Seasons<\/a>/.test(h)],
['mobile Open Seasons',/id="mNavBCOS"[\s\S]*?>Open Seasons<\/a>/.test(h)],
['preview flag',h.includes('HUNTSMART_PREVIEW_MODE=true')],
['auth removed',!/src="\.\/auth\.js/.test(h)],
['script order',h.indexOf('homepage-polish.js')<h.indexOf('preview/dom-patch.js')&&h.indexOf('preview/dom-patch.js')<h.indexOf('preview/auth-bypass.js')&&h.indexOf('preview/auth-bypass.js')<h.indexOf('preview/ux.js')],
['BC bypass',fs.readFileSync('site/bc-filters.js','utf8').includes('!window._authUser && !window.HUNTSMART_PREVIEW_MODE')],
['AB bypass',fs.readFileSync('site/ab-filters.js','utf8').includes('!window._authUser && !window.HUNTSMART_PREVIEW_MODE')]
];for(const [n,ok] of checks){console.log(`${ok?'PASS':'FAIL'}: ${n}`);if(!ok)process.exitCode=1;}
NODE

for file in site/*.js site/preview/*.js; do node --check "$file" >/dev/null; done
echo "Preview build validated: $BUILD_ID"
