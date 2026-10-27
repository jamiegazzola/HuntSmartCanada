from pathlib import Path

SITE = Path('site')
THEME = Path('research-theme.css')

if not THEME.exists():
    raise SystemExit('Missing research-theme.css')

(SITE / 'research-theme.css').write_text(THEME.read_text(encoding='utf-8'), encoding='utf-8')

markers = (
    'Data-backed hunting research',
    'BC Hunting Research',
    'HuntSmart Research · Interactive Data',
    'Answer Library',
    'Research & citation',
)

for path in SITE.rglob('index.html'):
    if path == SITE / 'blog' / 'index.html':
        continue
    text = path.read_text(encoding='utf-8')
    if not any(marker in text for marker in markers):
        continue
    if '/research-theme.css' not in text:
        text = text.replace('</head>', '<link rel="stylesheet" href="/research-theme.css?v=20261027b">\n</head>', 1)
        path.write_text(text, encoding='utf-8')
