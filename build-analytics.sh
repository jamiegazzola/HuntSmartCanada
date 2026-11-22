#!/usr/bin/env bash
set -Eeuo pipefail

# Add growth analytics and blog visual polish to the already-built Netlify publish directory
# without coupling these client-side enhancements to the main HuntSmart application bundle.
for file in hs-analytics.js hs-auth-attribution.js admin-growth.js admin-growth.css admin-traffic.js admin-traffic.css admin-traffic-data.json blog-card-visuals.css; do
  test -s "$file" || { echo "Missing analytics/visual asset: $file" >&2; exit 1; }
  cp -p "$file" "site/$file"
done

python3 - <<'PY'
from pathlib import Path

ANALYTICS = '<script type="module" src="/hs-analytics.js?v=20261122c"></script>'
ATTRIBUTION = '<script type="module" src="/hs-auth-attribution.js?v=20261026a"></script>'
ADMIN_CSS = '<link rel="stylesheet" href="/admin-growth.css?v=20261026a">'
ADMIN_JS = '<script type="module" src="/admin-growth.js?v=20261026a"></script>'
TRAFFIC_CSS = '<link rel="stylesheet" href="/admin-traffic.css?v=20261122b">'
TRAFFIC_JS = '<script defer src="/admin-traffic.js?v=20261122c"></script>'
BLOG_CARD_CSS = '<link rel="stylesheet" href="/blog-card-visuals.css?v=20261026a">'


def before_close(path, close_tag, snippet):
    p = Path(path)
    if not p.exists():
        return
    text = p.read_text(encoding='utf-8')
    if snippet in text:
        return
    if close_tag not in text:
        raise SystemExit(f'Missing {close_tag} in {path}')
    text = text.replace(close_tag, snippet + '\n' + close_tag, 1)
    p.write_text(text, encoding='utf-8')

# Main app: anonymous GA4 events first, then secure account attribution.
before_close('site/index.html', '</body>', ANALYTICS)
before_close('site/index.html', '</body>', ATTRIBUTION)

# Blog landing page: topic-specific visual backgrounds for every article card.
for name in ['site/blog.html', 'site/blog/index.html']:
    before_close(name, '</head>', BLOG_CARD_CSS)

# Every clean blog route gets GA4/page/article/map engagement tracking.
for p in [Path('site/blog/index.html'), *sorted(Path('site/blog').glob('*/index.html'))]:
    if p.exists():
        before_close(p, '</body>', ANALYTICS)

# Also instrument the flat bodies behind permanent redirects for safe previewing.
for name in [
    'site/blog.html',
    'site/how-to-use-huntsmart.html',
    'site/how-does-bc-leh-work.html',
    'site/bc-leh-odds-guide.html',
    'site/how-to-use-huntsmart-map.html',
]:
    before_close(name, '</body>', ANALYTICS)

# Admin v2: Growth & Content Intelligence lives above existing user/product analytics.
for name in ['site/admin.html', 'site/admin/index.html']:
    p = Path(name)
    if not p.exists():
        continue
    text = p.read_text(encoding='utf-8')
    text = text.replace('./Images/logo.png', '/images/logo.png')
    if ADMIN_CSS not in text:
        text = text.replace('</head>', ADMIN_CSS + '\n</head>', 1)
    if ADMIN_JS not in text:
        text = text.replace('</body>', ADMIN_JS + '\n</body>', 1)
    if TRAFFIC_CSS not in text:
        text = text.replace('</head>', TRAFFIC_CSS + '\n</head>', 1)
    if TRAFFIC_JS not in text:
        text = text.replace('</body>', TRAFFIC_JS + '\n</body>', 1)
    p.write_text(text, encoding='utf-8')
PY

# These are browser ES modules. Parse them as modules for syntax validation;
# do not execute them in Node (they include browser-only HTTPS imports/APIs).
node --input-type=module --check < site/hs-analytics.js >/dev/null
node --input-type=module --check < site/hs-auth-attribution.js >/dev/null
node --input-type=module --check < site/admin-growth.js >/dev/null
node --check site/admin-traffic.js >/dev/null
node - <<'JS'
const fs = require('node:fs');
const s = JSON.parse(fs.readFileSync('site/admin-traffic-data.json', 'utf8'));
const months = s.sources.searchConsole.months;
const sum = (key) => months.reduce((n, m) => n + m[key], 0);
if (sum('legacy') !== s.sources.searchConsole.legacyClicks ||
    sum('current') !== s.sources.searchConsole.currentClicks ||
    sum('legacy') + sum('current') !== s.sources.searchConsole.clicks ||
    sum('impressions') !== s.sources.searchConsole.impressions) {
  throw Error('Historical Search Console totals do not reconcile');
}
JS

grep -q 'hs-analytics.js' site/index.html
grep -q 'hs-auth-attribution.js' site/index.html
grep -q 'blog-card-visuals.css' site/blog/index.html
grep -q 'hs-analytics.js' site/blog/index.html
grep -q 'hs-analytics.js' site/blog/how-to-use-huntsmart-map/index.html
grep -q 'admin-growth.css' site/admin/index.html
grep -q 'admin-growth.js' site/admin/index.html
grep -q 'admin-traffic.js' site/admin/index.html
grep -q 'admin-traffic.css' site/admin/index.html
node scripts/verify-analytics-report.cjs
test -s site/admin-traffic-data.json
grep -q 'Growth & Content Intelligence' site/admin-growth.js

echo "HuntSmart growth analytics, Admin v2, and blog card visuals complete."
