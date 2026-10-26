#!/usr/bin/env bash
set -Eeuo pipefail

# Build the Netlify production/preview bundle entirely from the GitHub branch.
# No proxying to a separate live HuntSmart site and no /production fetches.

rm -rf site
mkdir -p site/images

FILES=(
  "index.html"
  "admin.html"
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
  "blog.html"
  "blog.css"
  "blog.js"
  "how-to-use-huntsmart.html"
  "how-does-bc-leh-work.html"
  "bc-leh-odds-guide.html"
  "how-to-use-huntsmart-map.html"
  "blog-map-demo.css"
  "blog-map-demo.js"
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
# World-class map, clean public URLs, custom-domain SEO, and Resources routing
# ---------------------------------------------------------------------------
python3 - <<'PY'
from pathlib import Path
import re

BASE = 'https://huntsmartcanada.ca'

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

# Add the public Resources section to desktop, mobile, and home footer navigation.
# Keep these as ordinary links so the standalone SEO pages remain crawlable.
desktop_saved = '<a class="nav-link" id="navSaved" onclick="showPage(\'saved\')">Saved <span class="saved-count-badge" id="savedBadge" style="display:none">0</span></a>'
if 'id="navResources"' not in html and desktop_saved in html:
    html = html.replace(desktop_saved,
        '<a class="nav-link" id="navResources" href="/blog/">Resources</a>\n' + desktop_saved, 1)

mobile_saved = '<a class="nav-link" id="mNavSaved" onclick="showPage(\'saved\');closeNavMenu()">Saved <span class="saved-count-badge" id="savedBadgeMobile" style="display:none">0</span></a>'
if 'id="mNavResources"' not in html and mobile_saved in html:
    html = html.replace(mobile_saved,
        '<a class="nav-link" id="mNavResources" href="/blog/">Resources</a>\n' + mobile_saved, 1)

footer_saved = '<button class="home-footer-link" onclick="showPage(\'saved\')">Saved</button>'
if 'href="/blog/">Resources</a>' not in html and footer_saved in html:
    html = html.replace(footer_saved, footer_saved + '\n      <a class="home-footer-link" href="/blog/">Resources</a>', 1)

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

# Stamp the app for quick browser/console verification.
if 'huntsmart-world-map' not in html:
    html = html.replace('</head>', '<meta name="huntsmart-world-map" content="mapbox-3.30-standard-satellite">\n</head>', 1)
if 'huntsmart-imagery-lab' not in html:
    html = html.replace('</head>', '<meta name="huntsmart-imagery-lab" content="mapbox-bc-wms-comparison">\n</head>', 1)
if 'huntsmart-terrain-intelligence' not in html:
    html = html.replace('</head>', '<meta name="huntsmart-terrain-intelligence" content="preview-pilot">\n</head>', 1)
if 'huntsmart-resources' not in html:
    html = html.replace('</head>', '<meta name="huntsmart-resources" content="interactive-guides-v1">\n</head>', 1)

# Establish the custom .ca domain as the app's canonical public URL.
if 'rel="canonical"' not in html:
    html = html.replace('</head>', f'<link rel="canonical" href="{BASE}/">\n</head>', 1)
else:
    html = re.sub(r'<link rel="canonical" href="[^"]+">', f'<link rel="canonical" href="{BASE}/">', html, count=1)
if 'property="og:url"' not in html:
    html = html.replace('</head>', f'<meta property="og:url" content="{BASE}/">\n</head>', 1)

index.write_text(html, encoding='utf-8')
maps.write_text(js, encoding='utf-8')

# Keep Resources links clean in the production bundle even if older source code
# still references the original flat .html route.
home_polish = Path('site/homepage-polish.js')
hp = home_polish.read_text(encoding='utf-8').replace('./blog.html', '/blog/').replace('/blog.html', '/blog/')
home_polish.write_text(hp, encoding='utf-8')

# Embedded-map data requests must be root-relative because the public article now
# lives under /blog/how-to-use-huntsmart-map/.
map_demo = Path('site/blog-map-demo.js')
md = map_demo.read_text(encoding='utf-8')
for old, new in [
    ('./draws.json', '/draws.json'),
    ('./leh_zones.json', '/leh_zones.json'),
    ('./bc-open-seasons.js', '/bc-open-seasons.js'),
]:
    md = md.replace(old, new)
map_demo.write_text(md, encoding='utf-8')

# One canonical clean URL per Resources page. The original flat files remain in
# the bundle only as redirect sources for old links/bookmarks.
routes = {
    'blog.html': ('blog/index.html', f'{BASE}/blog/'),
    'how-to-use-huntsmart.html': ('blog/how-to-use-huntsmart/index.html', f'{BASE}/blog/how-to-use-huntsmart/'),
    'how-does-bc-leh-work.html': ('blog/how-does-bc-leh-work/index.html', f'{BASE}/blog/how-does-bc-leh-work/'),
    'bc-leh-odds-guide.html': ('blog/bc-leh-odds-guide/index.html', f'{BASE}/blog/bc-leh-odds-guide/'),
    'how-to-use-huntsmart-map.html': ('blog/how-to-use-huntsmart-map/index.html', f'{BASE}/blog/how-to-use-huntsmart-map/'),
}

url_map = {
    'https://huntsmartcanada.netlify.app/blog.html': f'{BASE}/blog/',
    'https://huntsmartcanada.netlify.app/how-to-use-huntsmart.html': f'{BASE}/blog/how-to-use-huntsmart/',
    'https://huntsmartcanada.netlify.app/how-does-bc-leh-work.html': f'{BASE}/blog/how-does-bc-leh-work/',
    'https://huntsmartcanada.netlify.app/bc-leh-odds-guide.html': f'{BASE}/blog/bc-leh-odds-guide/',
    'https://huntsmartcanada.netlify.app/how-to-use-huntsmart-map.html': f'{BASE}/blog/how-to-use-huntsmart-map/',
    'https://huntsmartcanada.netlify.app/': f'{BASE}/',
    './index.html': '/',
    './blog.html': '/blog/',
    './how-to-use-huntsmart.html': '/blog/how-to-use-huntsmart/',
    './how-does-bc-leh-work.html': '/blog/how-does-bc-leh-work/',
    './bc-leh-odds-guide.html': '/blog/bc-leh-odds-guide/',
    './how-to-use-huntsmart-map.html': '/blog/how-to-use-huntsmart-map/',
}

known_root_assets = [
    'blog.css', 'blog.js', 'blog-map-demo.css', 'blog-map-demo.js',
    'config.js', 'bc-wmu-geojson.js', 'draws.json', 'bc-open-seasons.js',
    'leh_zones.json', 'images/hero-bg.jpg', 'images/filter-bg.jpg', 'images/logo.png'
]

def clean_resource_html(source_name, destination, canonical):
    source = Path('site') / source_name
    page = source.read_text(encoding='utf-8')

    for old, new in url_map.items():
        page = page.replace(old, new)

    # Normalize any remaining legacy Netlify hostname.
    page = page.replace('https://huntsmartcanada.netlify.app', BASE)

    # Root-relative assets make nested /blog/.../ routes reliable.
    for asset in known_root_assets:
        page = page.replace(f'./{asset}', f'/{asset}')
    page = page.replace("fetch('./", "fetch('/")
    page = page.replace('fetch("./', 'fetch("/')
    page = page.replace("script.src = './", "script.src = '/")
    page = page.replace('script.src = "./', 'script.src = "/')

    # Force one canonical and one Open Graph URL matching the clean route.
    if 'rel="canonical"' in page:
        page = re.sub(r'<link rel="canonical" href="[^"]+">', f'<link rel="canonical" href="{canonical}">', page, count=1)
    else:
        page = page.replace('</head>', f'<link rel="canonical" href="{canonical}">\n</head>', 1)

    if 'property="og:url"' in page:
        page = re.sub(r'<meta property="og:url" content="[^"]+">', f'<meta property="og:url" content="{canonical}">', page, count=1)
    else:
        page = page.replace('</head>', f'<meta property="og:url" content="{canonical}">\n</head>', 1)

    # JSON-LD URLs use the same clean route.
    page = re.sub(r'"mainEntityOfPage":"[^"]+"', f'"mainEntityOfPage":"{canonical}"', page)
    if source_name == 'blog.html':
        page = re.sub(r'"url":"[^"]+"', f'"url":"{canonical}"', page, count=1)

    # Write both the legacy file (for a useful body behind redirects) and the
    # canonical directory index served directly at the clean URL.
    source.write_text(page, encoding='utf-8')
    dest = Path('site') / destination
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(page, encoding='utf-8')

for src, (dest, canonical) in routes.items():
    clean_resource_html(src, dest, canonical)

# Restore the private admin surface to production and keep it out of search.
admin = Path('site/admin.html')
admin_html = admin.read_text(encoding='utf-8')
if 'name="robots"' not in admin_html:
    admin_html = admin_html.replace('</head>', '<meta name="robots" content="noindex,nofollow,noarchive">\n</head>', 1)
admin.write_text(admin_html, encoding='utf-8')
admin_clean = Path('site/admin/index.html')
admin_clean.parent.mkdir(parents=True, exist_ok=True)
admin_clean.write_text(admin_html, encoding='utf-8')
PY

# Search-engine discovery files for the permanent custom domain.
cat > site/robots.txt <<'EOF'
User-agent: *
Allow: /
Disallow: /admin/

Sitemap: https://huntsmartcanada.ca/sitemap.xml
EOF

cat > site/sitemap.xml <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://huntsmartcanada.ca/</loc>
    <lastmod>2026-10-26</lastmod>
  </url>
  <url>
    <loc>https://huntsmartcanada.ca/blog/</loc>
    <lastmod>2026-10-26</lastmod>
  </url>
  <url>
    <loc>https://huntsmartcanada.ca/blog/how-to-use-huntsmart-map/</loc>
    <lastmod>2026-10-26</lastmod>
  </url>
  <url>
    <loc>https://huntsmartcanada.ca/blog/how-to-use-huntsmart/</loc>
    <lastmod>2026-10-26</lastmod>
  </url>
  <url>
    <loc>https://huntsmartcanada.ca/blog/how-does-bc-leh-work/</loc>
    <lastmod>2026-10-26</lastmod>
  </url>
  <url>
    <loc>https://huntsmartcanada.ca/blog/bc-leh-odds-guide/</loc>
    <lastmod>2026-10-26</lastmod>
  </url>
</urlset>
EOF

# Preserve old bookmarks while establishing clean slash URLs as permanent.
cat > site/_redirects <<'EOF'
https://huntsmartcanada.netlify.app/blog.html  https://huntsmartcanada.ca/blog/  301!
https://huntsmartcanada.netlify.app/how-to-use-huntsmart.html  https://huntsmartcanada.ca/blog/how-to-use-huntsmart/  301!
https://huntsmartcanada.netlify.app/how-does-bc-leh-work.html  https://huntsmartcanada.ca/blog/how-does-bc-leh-work/  301!
https://huntsmartcanada.netlify.app/bc-leh-odds-guide.html  https://huntsmartcanada.ca/blog/bc-leh-odds-guide/  301!
https://huntsmartcanada.netlify.app/how-to-use-huntsmart-map.html  https://huntsmartcanada.ca/blog/how-to-use-huntsmart-map/  301!
https://huntsmartcanada.netlify.app/admin.html  https://huntsmartcanada.ca/admin/  301!
https://huntsmartcanada.netlify.app/*  https://huntsmartcanada.ca/:splat  301!

/blog.html  /blog/  301!
/how-to-use-huntsmart.html  /blog/how-to-use-huntsmart/  301!
/how-does-bc-leh-work.html  /blog/how-does-bc-leh-work/  301!
/bc-leh-odds-guide.html  /blog/bc-leh-odds-guide/  301!
/how-to-use-huntsmart-map.html  /blog/how-to-use-huntsmart-map/  301!
/admin.html  /admin/  301!

/*  /index.html  200
EOF

cat > site/_headers <<'EOF'
/*
  Cache-Control: no-store, no-cache, must-revalidate, max-age=0
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/admin/*
  X-Robots-Tag: noindex, nofollow, noarchive
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
node --check site/blog.js >/dev/null
node --check site/blog-map-demo.js >/dev/null

grep -q 'mapbox-gl-js/v3.30.0/' site/index.html
grep -q 'mapbox://styles/mapbox/standard-satellite' site/maps.js
grep -q 'world-class-map.js' site/index.html
grep -q 'imagery-lab.js' site/index.html
grep -q 'imagery-lab.css' site/index.html
grep -q 'terrain-intelligence.js' site/index.html
grep -q 'terrain-intelligence.css' site/index.html
grep -q 'id="navResources"' site/index.html
grep -q 'id="mNavResources"' site/index.html
grep -q 'huntsmart-resources' site/index.html
grep -q 'https://huntsmartcanada.ca/' site/index.html
grep -q 'https://huntsmartcanada.ca/blog/' site/blog/index.html
grep -q 'How to Use HuntSmart Canada' site/blog/how-to-use-huntsmart/index.html
grep -q 'How Does BC LEH Work?' site/blog/how-does-bc-leh-work/index.html
grep -q 'oddsExplorer' site/blog/bc-leh-odds-guide/index.html
grep -q 'hsEmbeddedMap' site/blog/how-to-use-huntsmart-map/index.html
grep -q 'noindex,nofollow,noarchive' site/admin/index.html
grep -q 'Sitemap: https://huntsmartcanada.ca/sitemap.xml' site/robots.txt
grep -q '<loc>https://huntsmartcanada.ca/blog/how-to-use-huntsmart-map/</loc>' site/sitemap.xml
test -s site/admin/index.html
test -s site/robots.txt
test -s site/sitemap.xml
test -s site/blog/index.html
test -s site/blog/how-to-use-huntsmart-map/index.html
test -s site/index.html

echo "HuntSmart build complete with custom-domain SEO, clean Resources routes, and admin restoration."
