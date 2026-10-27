from pathlib import Path
import re

home = Path('site/index.html')
if not home.exists():
    raise SystemExit('Homepage output missing: site/index.html')

text = home.read_text(encoding='utf-8')

# Remove the older footer-style research nav when present.
text, nav_removed = re.subn(
    r'<nav\s+aria-label="HuntSmart research links"[^>]*>.*?</nav>',
    '',
    text,
    flags=re.I | re.S,
)

# Search-growth generators have also injected a separate row of deep-research
# links onto the consumer homepage. Those pages remain crawlable from the
# Resources/research surfaces and sitemap; they should not alter homepage UI.
research_hrefs = [
    '/bc-hunting/',
    '/bc-hunting/questions/',
    '/bc-hunting/leh-data-explorer/',
    '/bc-hunting/moose-leh-odds/',
    '/bc-hunting/elk-leh-odds/',
    '/bc-hunting/general-open-season/',
    '/methodology/',
    '/about/',
]

anchor_removed = 0
for href in research_hrefs:
    pattern = rf'<a\b[^>]*href=["\']{re.escape(href)}["\'][^>]*>.*?</a>'
    text, count = re.subn(pattern, '', text, flags=re.I | re.S)
    anchor_removed += count

# Hide/remove the now-empty research strip wrapper without touching functional
# empty app containers. The script specifically targets a wrapper whose class/id
# name signals SEO/research/discovery links.
text = re.sub(
    r'<(?P<tag>div|nav|section)\b(?P<attrs>[^>]*(?:seo|research|discovery|crawl|answer)[^>]*)>\s*</(?P=tag)>',
    '',
    text,
    flags=re.I | re.S,
)

home.write_text(text, encoding='utf-8')

final = home.read_text(encoding='utf-8')
for href in research_hrefs:
    if re.search(rf'<a\b[^>]*href=["\']{re.escape(href)}["\']', final, flags=re.I):
        raise SystemExit(f'Homepage cleanup failed: research link still present: {href}')

print(f'Homepage cleanup complete: removed {nav_removed} research nav block(s) and {anchor_removed} deep-research homepage link(s).')
