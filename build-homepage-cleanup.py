from pathlib import Path
import re

home = Path('site/index.html')
if not home.exists():
    raise SystemExit('Homepage output missing: site/index.html')

text = home.read_text(encoding='utf-8')
text, removed = re.subn(
    r'<nav\s+aria-label="HuntSmart research links"[^>]*>.*?</nav>',
    '',
    text,
    flags=re.I | re.S,
)

if removed:
    home.write_text(text, encoding='utf-8')
    print(f'Homepage cleanup: removed {removed} injected research-link strip.')
else:
    print('Homepage cleanup: no injected research-link strip present.')

if 'aria-label="HuntSmart research links"' in home.read_text(encoding='utf-8'):
    raise SystemExit('Homepage cleanup failed: research-link strip still present.')
