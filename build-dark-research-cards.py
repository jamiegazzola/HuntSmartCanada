from pathlib import Path

SITE = Path('site')

# Scope this pass ONLY to generated research content. Never touch the app homepage
# or the Journal index.
paths = list((SITE / 'bc-hunting').rglob('index.html'))
paths += [SITE / 'blog' / 'bc-moose-leh-odds-trends' / 'index.html']

style = '''
<style id="hs-dark-research-cards">
.answer-box{
  background:#111714 !important;
  border:1px solid #263229 !important;
  color:#dce4de !important;
  box-shadow:none !important;
}
.answer-box>strong{
  color:#68d889 !important;
  text-transform:uppercase !important;
  letter-spacing:.08em !important;
  font-size:11px !important;
}
.answer-box p,
.answer-box p strong{
  color:#aeb9b1 !important;
}
.answer-box a{color:#7fe19c !important}
</style>
'''

for path in paths:
    if not path.exists():
        continue
    text = path.read_text(encoding='utf-8')
    if 'id="hs-dark-research-cards"' in text:
        continue
    text = text.replace('</head>', style + '\n</head>', 1)
    path.write_text(text, encoding='utf-8')
