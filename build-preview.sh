#!/usr/bin/env bash
set -Eeuo pipefail

# Build the Netlify preview entirely from the GitHub branch.
# No proxying to the live HuntSmart site and no /production fetches.

rm -rf site
mkdir -p site/images

FILES=(
  "index.html"
  "style.css"
  "homepage-polish.css"
  "auth-styles.css"
  "stripe-styles.css"
  "auth.js"
  "stripe.js"
  "hunting-partners.js"
  "config.js"
  "data.js"
  "cities.js"
  "drive-times.js"
  "drive-time.js"
  "bc-draws.js"
  "bc-detail.js"
  "bc-filters.js"
  "bc-saved-compare.js"
  "bc-open-seasons.js"
  "ab-draws.js"
  "ab-cards.js"
  "ab-filters.js"
  "ui.js"
  "ab-wmu-geojson-1.js"
  "ab-wmu-geojson-2.js"
  "ab-wmu-geojson-3.js"
  "ab-wmu-geojson.js"
  "bc-wmu-geojson.js"
  "bc-region-geojson.js"
  "maps.js"
  "card-map-3d-fullscreen-fix.js"
  "world-class-map.css"
  "world-class-map.js"
  "imagery-lab.css"
  "imagery-lab.js"
  "terrain-intelligence.css"
  "terrain-intelligence.js"
  "homepage-polish.js"
  "sync.js"
  "draws.json"
  "writeups.json"
  "leh_zones.json"
  "leh_sheep_zones.json"
  "historical_wildfires_simplified_50m.geojson"
  "hs-offline-lite-sw.js"
  "preview.jpg"
)

for file in "${FILES[@]}"; do
  test -f "$file" || { echo "Missing required preview file: $file" >&2; exit 1; }
  cp -p "$file" "site/$file"
done

for image in images/hero-bg.jpg images/filter-bg.jpg images/logo.png; do
  test -f "$image" || { echo "Missing required image: $image" >&2; exit 1; }
  cp -p "$image" "site/$image"
done

# Preview-only paid-product UX layer. Keep this isolated until the release is approved.
test -s ux-polish.css || { echo "Missing ux-polish.css" >&2; exit 1; }
test -s ux-polish.js  || { echo "Missing ux-polish.js" >&2; exit 1; }
printf '\n\n/* === PREVIEW UX POLISH === */\n' >> site/homepage-polish.css
cat ux-polish.css >> site/homepage-polish.css
printf '\n\n/* === PREVIEW UX POLISH === */\n' >> site/homepage-polish.js
cat ux-polish.js >> site/homepage-polish.js

# ---------------------------------------------------------------------------
# World-class map preview
# Keep the feature-complete HuntSmart map, modernize its renderer and add
# preview-only imagery/terrain evaluation tools.
# ---------------------------------------------------------------------------
python3 - <<'PY'
from pathlib import Path

index = Path('site/index.html')
maps = Path('site/maps.js')

html = index.read_text(encoding='utf-8')
js = maps.read_text(encoding='utf-8')

# Current stable Mapbox GL JS runtime.
html = html.replace('mapbox-gl-js/v3.3.0/', 'mapbox-gl-js/v3.30.0/')
js = js.replace('mapbox-gl-js/v3.3.0/', 'mapbox-gl-js/v3.30.0/')

# Use the current Standard Satellite style everywhere the feature-complete map
# previously used Satellite Streets (main map + LEH card maps).
js = js.replace('mapbox://styles/mapbox/satellite-streets-v12',
                'mapbox://styles/mapbox/standard-satellite')

# Load scoped preview map styles without modifying the rest of the app.
for tag in [
    '<link href="./world-class-map.css?v=20260909" rel="stylesheet"/>',
    '<link href="./imagery-lab.css?v=20260909" rel="stylesheet"/>',
    '<link href="./terrain-intelligence.css?v=20260909" rel="stylesheet"/>',
]:
    if tag not in html:
        html = html.replace('</head>', tag + '\n</head>', 1)

# Load after maps.js so enhancement layers preserve and extend all existing
# map functions rather than replacing them.
wc_js = '<script defer src="./world-class-map.js?v=20260909"></script>'
if wc_js not in html:
    candidates = [
        '<script defer src="./maps.js"></script>',
        '<script defer src="./maps.js?v=20260611e"></script>',
    ]
    inserted = False
    for needle in candidates:
        if needle in html:
            html = html.replace(needle, needle + '\n' + wc_js, 1)
            inserted = True
            break
    if not inserted:
        html = html.replace('</body>', wc_js + '\n</body>', 1)

imagery_js = '<script defer src="./imagery-lab.js?v=20260909"></script>'
if imagery_js not in html:
    if wc_js in html:
        html = html.replace(wc_js, wc_js + '\n' + imagery_js, 1)
    else:
        html = html.replace('</body>', imagery_js + '\n</body>', 1)

terrain_js = '<script defer src="./terrain-intelligence.js?v=20260909"></script>'
if terrain_js not in html:
    if imagery_js in html:
        html = html.replace(imagery_js, imagery_js + '\n' + terrain_js, 1)
    elif wc_js in html:
        html = html.replace(wc_js, wc_js + '\n' + terrain_js, 1)
    else:
        html = html.replace('</body>', terrain_js + '\n</body>', 1)

# Stamp the preview for quick browser/console verification.
if 'huntsmart-world-map' not in html:
    html = html.replace('</head>', '<meta name="huntsmart-world-map" content="mapbox-3.30-standard-satellite">\n</head>', 1)
if 'huntsmart-imagery-lab' not in html:
    html = html.replace('</head>', '<meta name="huntsmart-imagery-lab" content="mapbox-bc-wms-comparison">\n</head>', 1)
if 'huntsmart-terrain-intelligence' not in html:
    html = html.replace('</head>', '<meta name="huntsmart-terrain-intelligence" content="preview-pilot">\n</head>', 1)

index.write_text(html, encoding='utf-8')
maps.write_text(js, encoding='utf-8')
PY

# Keep preview routing local to this deployment.
cat > site/_redirects <<'EOF'
/*  /index.html  200
EOF

cat > site/_headers <<'EOF'
/*
  Cache-Control: no-store, no-cache, must-revalidate, max-age=0
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
EOF

# Validate the files most likely to break the whole app before Netlify publishes.
node --check site/maps.js >/dev/null
node --check site/world-class-map.js >/dev/null
node --check site/imagery-lab.js >/dev/null
node --check site/terrain-intelligence.js >/dev/null
node --check site/homepage-polish.js >/dev/null
node --check site/bc-open-seasons.js >/dev/null
node --check site/bc-filters.js >/dev/null
node --check site/ab-filters.js >/dev/null

grep -q 'mapbox-gl-js/v3.30.0/' site/index.html
grep -q 'mapbox://styles/mapbox/standard-satellite' site/maps.js
grep -q 'world-class-map.js' site/index.html
grep -q 'imagery-lab.js' site/index.html
grep -q 'imagery-lab.css' site/index.html
grep -q 'terrain-intelligence.js' site/index.html
grep -q 'terrain-intelligence.css' site/index.html
test -s site/imagery-lab.css
test -s site/terrain-intelligence.css
test -s site/index.html

echo "HuntSmart imagery comparison preview build complete."
