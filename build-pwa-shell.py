#!/usr/bin/env python3
from pathlib import Path
import re
import shutil

VERSION = "2026-10-28-pwa-v1"
SITE = Path("site")
INDEX = SITE / "index.html"
MANIFEST_SOURCE = Path("site.webmanifest")
MANIFEST_DEST = SITE / "site.webmanifest"
SW = SITE / "hs-offline-lite-sw.js"

for path in (INDEX, MANIFEST_SOURCE, SW):
    if not path.is_file():
        raise SystemExit(f"Missing required PWA build input: {path}")

shutil.copy2(MANIFEST_SOURCE, MANIFEST_DEST)

html = INDEX.read_text(encoding="utf-8")
start = "<!-- huntsmart-pwa-shell:start -->"
end = "<!-- huntsmart-pwa-shell:end -->"
html = re.sub(re.escape(start) + r".*?" + re.escape(end) + r"\s*", "", html, flags=re.S)

block = f'''{start}
<meta name="huntsmart-pwa-shell" content="{VERSION}">
<meta name="theme-color" content="#0b0f0d">
<meta name="application-name" content="HuntSmart Canada">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="HuntSmart">
<link rel="manifest" href="/site.webmanifest">
<link rel="apple-touch-icon" href="/images/logo.png">
{end}'''

if "</head>" not in html:
    raise SystemExit("Cannot inject PWA metadata: </head> not found")
html = html.replace("</head>", block + "\n</head>", 1)
INDEX.write_text(html, encoding="utf-8")

print(f"HuntSmart PWA shell {VERSION} injected")
