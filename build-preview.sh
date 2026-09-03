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
node --check site/homepage-polish.js >/dev/null
node --check site/bc-open-seasons.js >/dev/null
node --check site/bc-filters.js >/dev/null
node --check site/ab-filters.js >/dev/null

test -s site/index.html

echo "HuntSmart GitHub preview build complete."
