from pathlib import Path

PAGES = [
    Path('site/bc-hunting/elk-leh-odds/index.html'),
    Path('site/bc-hunting/moose-leh-odds/index.html'),
]

OLD_INIT = "const NEEDLE="
HELPER = "const parsePct=v=>{if(v===null||v===undefined||String(v).trim()==='')return null;const n=Number(String(v).replaceAll('%','').replaceAll(',',''));return Number.isFinite(n)?n:null};const NEEDLE="

OLD_MAP = "vals=YEARS.map(y=>Number(String(h[y]??'').replace('%','').replace(',',''))).filter(Number.isFinite),current=Number(String(h['2025']??'').replace('%','').replace(',',''));"
NEW_MAP = "vals=YEARS.map(y=>parsePct(h[y])).filter(v=>v!==null),current=parsePct(h['2025']);"

OLD_VALUES = "const v=Number(r.yearly_draw_odds?.[y]);if(Number.isFinite(v))values.push(v)"
NEW_VALUES = "const v=parsePct(r.yearly_draw_odds?.[y]);if(v!==null)values.push(v)"

OLD_POINTS = "const v=Number(r.yearly_draw_odds?.[yr]);return Number.isFinite(v)?`${x(i)},${y(v)}`:null"
NEW_POINTS = "const v=parsePct(r.yearly_draw_odds?.[yr]);return v!==null?`${x(i)},${y(v)}`:null"

for page in PAGES:
    text = page.read_text(encoding='utf-8')
    replacements = [
        (OLD_INIT, HELPER),
        (OLD_MAP, NEW_MAP),
        (OLD_VALUES, NEW_VALUES),
        (OLD_POINTS, NEW_POINTS),
    ]
    for old, new in replacements:
        if old not in text:
            raise SystemExit(f'Expected chart token not found in {page}: {old[:60]}')
        text = text.replace(old, new, 1)
    page.write_text(text, encoding='utf-8')
    print(f'Fixed historical odds parsing in {page}')
