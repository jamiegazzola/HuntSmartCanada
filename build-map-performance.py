from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parent
SITE = ROOT / "site"
INDEX = SITE / "index.html"
RUNTIME = ROOT / "map-performance-runtime.js"
TARGET_RUNTIME = SITE / RUNTIME.name

if not INDEX.exists():
    raise SystemExit("map performance build: site/index.html is missing")
if not RUNTIME.exists():
    raise SystemExit("map performance build: map-performance-runtime.js is missing")

text = INDEX.read_text(encoding="utf-8")

geometry_files = [
    "ab-wmu-geojson-1.js",
    "ab-wmu-geojson-2.js",
    "ab-wmu-geojson-3.js",
    "ab-wmu-geojson.js",
    "bc-wmu-geojson.js",
]

for filename in geometry_files:
    pattern = re.compile(
        r'\s*<script\b[^>]*\bsrc=["\'][^"\']*' + re.escape(filename) +
        r'(?:\?[^"\']*)?["\'][^>]*>\s*</script>\s*',
        flags=re.IGNORECASE,
    )
    text, count = pattern.subn("\n", text)
    if count == 0:
        raise SystemExit(f"map performance build: expected eager script tag for {filename}")

meta = '<meta name="huntsmart-map-performance" content="2026-10-28-v1">'
if 'name="huntsmart-map-performance"' not in text:
    text = text.replace("</head>", f"{meta}\n</head>", 1)

runtime_tag = '<script defer src="./map-performance-runtime.js?v=20261028-mapperf1"></script>'
if "map-performance-runtime.js" not in text:
    anchor_re = re.compile(
        r'(<script\b[^>]*\bsrc=["\'][^"\']*card-map-3d-fullscreen-fix\.js(?:\?[^"\']*)?["\'][^>]*>\s*</script>)',
        flags=re.IGNORECASE,
    )
    text, count = anchor_re.subn(r"\1\n" + runtime_tag, text, count=1)
    if count == 0:
        maps_re = re.compile(
            r'(<script\b[^>]*\bsrc=["\'][^"\']*maps\.js(?:\?[^"\']*)?["\'][^>]*>\s*</script>)',
            flags=re.IGNORECASE,
        )
        text, count = maps_re.subn(r"\1\n" + runtime_tag, text, count=1)
        if count == 0:
            raise SystemExit("map performance build: could not find runtime injection anchor")

for filename in geometry_files:
    eager = re.search(
        r'<script\b[^>]*\bsrc=["\'][^"\']*' + re.escape(filename) + r'(?:\?[^"\']*)?["\']',
        text,
        flags=re.IGNORECASE,
    )
    if eager:
        raise SystemExit(f"map performance build: eager geometry tag still present for {filename}")

if "map-performance-runtime.js" not in text or 'name="huntsmart-map-performance"' not in text:
    raise SystemExit("map performance build: runtime marker injection failed")

INDEX.write_text(text, encoding="utf-8")
shutil.copy2(RUNTIME, TARGET_RUNTIME)

print("Map performance layer applied: production geometry is lazy-loaded and runtime diagnostics are enabled.")
