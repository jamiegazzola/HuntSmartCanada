from pathlib import Path
import re

home = Path('site/index.html')
if not home.exists():
    raise SystemExit('Homepage output missing: site/index.html')

text = home.read_text(encoding='utf-8')

# Remove the homepage hero eyebrow/season label entirely. This is intentionally
# visual-only cleanup; the page title and core product copy remain unchanged.
text, eyebrow_removed = re.subn(
    r'<div\s+class=["\']hero-eyebrow["\'][^>]*>.*?</div>',
    '',
    text,
    flags=re.I | re.S,
)

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

# Append the homepage product-story source after all base/UX polish. Keeping the
# source in dedicated files makes the redesign isolated and reviewable while the
# production bundle still ships the existing single homepage CSS/JS assets.
product_story_assets = [
    (Path('homepage-product-story.css'), Path('site/homepage-polish.css'), 'HOMEPAGE PRODUCT STORY CSS'),
    (Path('homepage-product-story.js'), Path('site/homepage-polish.js'), 'HOMEPAGE PRODUCT STORY JS'),
]
for source, output, marker in product_story_assets:
    if not source.exists():
        raise SystemExit(f'Homepage product-story source missing: {source}')
    if not output.exists():
        raise SystemExit(f'Homepage product-story bundle target missing: {output}')
    payload = source.read_text(encoding='utf-8').strip() + '\n'
    bundled = output.read_text(encoding='utf-8')
    banner = f'/* === {marker} === */'
    if banner not in bundled:
        output.write_text(bundled.rstrip() + f'\n\n{banner}\n' + payload, encoding='utf-8')

final = home.read_text(encoding='utf-8')
if re.search(r'class=["\']hero-eyebrow["\']', final, flags=re.I):
    raise SystemExit('Homepage cleanup failed: hero eyebrow still present.')
for href in research_hrefs:
    if re.search(rf'<a\b[^>]*href=["\']{re.escape(href)}["\']', final, flags=re.I):
        raise SystemExit(f'Homepage cleanup failed: research link still present: {href}')

for output, marker in [
    (Path('site/homepage-polish.css'), 'HOMEPAGE PRODUCT STORY CSS'),
    (Path('site/homepage-polish.js'), 'HOMEPAGE PRODUCT STORY JS'),
]:
    if f'/* === {marker} === */' not in output.read_text(encoding='utf-8'):
        raise SystemExit(f'Homepage product-story bundling failed: {output}')

print(
    f'Homepage cleanup complete: removed {eyebrow_removed} hero eyebrow(s), '
    f'{nav_removed} research nav block(s), {anchor_removed} deep-research homepage link(s); '
    'bundled homepage product story.'
)
