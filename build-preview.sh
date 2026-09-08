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
# Keep the feature-complete HuntSmart map, but modernize its renderer and
# satellite style in the built preview only. The source branch remains easy to
# compare with the previous working preview.
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

# Load the scoped world-class map styles without modifying the rest of the app.
wc_css = '<link href="./world-class-map.css?v=20260908" rel="stylesheet"/>'
if wc_css not in html:
    html = html.replace('</head>', wc_css + '\n</head>', 1)

# Load after maps.js so the enhancement layer can preserve and extend all
# existing map functions rather than replacing them.
wc_js = '<script defer src="./world-class-map.js?v=20260908"></script>'
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

# Stamp the preview for quick browser/console verification.
if 'huntsmart-world-map' not in html:
    html = html.replace('</head>', '<meta name="huntsmart-world-map" content="mapbox-3.30-standard-satellite">\n</head>', 1)

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
node --check site/homepage-polish.js >/dev/null
node --check site/bc-open-seasons.js >/dev/null
node --check site/bc-filters.js >/dev/null
node --check site/ab-filters.js >/dev/null

grep -q 'mapbox-gl-js/v3.30.0/' site/index.html
grep -q 'mapbox://styles/mapbox/standard-satellite' site/maps.js
grep -q 'world-class-map.js' site/index.html
test -s site/index.html

echo "HuntSmart world-class Mapbox preview build complete."
