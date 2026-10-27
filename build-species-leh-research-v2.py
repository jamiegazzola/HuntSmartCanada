from pathlib import Path
import html
import json
import math
import statistics

SITE = Path('site')
BASE = 'https://huntsmartcanada.ca'
YEARS = [str(y) for y in range(2016, 2026)]
RECORDS = json.loads(Path('draws.json').read_text(encoding='utf-8'))


def num(value):
    if isinstance(value, (int, float)) and math.isfinite(float(value)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value.strip().replace('%', '').replace(',', ''))
        except ValueError:
            return None
    return None


def species_match(label, needle):
    return needle.lower() in str(label or '').strip().lower()


def make_rows(needle):
    rows = []
    for rec in RECORDS:
        if not species_match(rec.get('Species'), needle):
            continue
        hist = rec.get('yearly_draw_odds') or {}
        vals = [v for y in YEARS if (v := num(hist.get(y))) is not None]
        current = num(hist.get('2025'))
        if current is None or len(vals) < 5:
            continue
        rows.append({
            'code': str(rec.get('Code', '')),
            'mu': str(rec.get('MU', '')),
            'area': str(rec.get('Area', '')),
            'klass': str(rec.get('Class', '')),
            'season': str(rec.get('Season', '')),
            'region': str(rec.get('MU_Name', '')),
            'species': str(rec.get('Species', '')),
            'current': current,
            'median': statistics.median(vals),
            'spread': statistics.pstdev(vals) if len(vals) > 1 else 0,
            'years': len(vals),
        })
    return rows


def table_rows(rows):
    return ''.join(
        '<tr>'
        f'<td>{html.escape(r["code"])}</td>'
        f'<td>{html.escape(r["mu"])}</td>'
        f'<td>{html.escape(r["area"])}</td>'
        f'<td>{html.escape(r["klass"])}</td>'
        f'<td>{r["current"]:.1f}%</td>'
        f'<td>{r["median"]:.1f}%</td>'
        f'<td>{r["years"]}</td>'
        '</tr>' for r in rows
    )


def render(display, needle, slug):
    rows = make_rows(needle)
    if not rows:
        labels = sorted({str(r.get('Species', '')) for r in RECORDS if r.get('Species')})
        raise SystemExit(f'No {display} LEH data available. Species labels found: {labels}')

    current_sorted = sorted(rows, key=lambda r: (-r['current'], r['spread']))
    stable_sorted = sorted(rows, key=lambda r: (r['spread'], -r['median']))
    count = len(rows)
    med = statistics.median(r['current'] for r in rows)
    regions = len({r['region'] for r in rows if r['region']})
    species_labels = sorted({r['species'] for r in rows})
    canonical = f'{BASE}/{slug}/'
    schema = {
        '@context': 'https://schema.org', '@type': 'Article',
        'headline': f'BC {display} LEH Odds: 10 Years of Draw Trends',
        'description': f'Interactive HuntSmart analysis of British Columbia {display.lower()} LEH draw trends by hunt code, region, class and year.',
        'datePublished': '2026-10-27', 'dateModified': '2026-10-27',
        'mainEntityOfPage': canonical,
        'author': {'@id': f'{BASE}/#organization'}, 'publisher': {'@id': f'{BASE}/#organization'}
    }
    dataset = {
        '@context': 'https://schema.org', '@type': 'Dataset',
        'name': f'HuntSmart Canada BC {display} LEH Historical Draw Trends',
        'url': canonical, 'temporalCoverage': '2016/2025',
        'creator': {'@id': f'{BASE}/#organization'}
    }

    doc = f'''<!doctype html><html lang="en-CA"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>BC {display} LEH Odds: 10 Years of Draw Trends | HuntSmart Canada</title>
<meta name="description" content="Explore 10 years of BC {display.lower()} LEH draw trends with HuntSmart data. Filter by region and class, compare hunt codes, and inspect historical stability.">
<link rel="canonical" href="{canonical}"><link rel="stylesheet" href="/blog.css?v=20261027species2">
<script type="application/ld+json">{json.dumps(schema, separators=(',', ':'))}</script>
<script type="application/ld+json">{json.dumps(dataset, separators=(',', ':'))}</script>
<style>
.species-shell{{width:min(1440px,calc(100% - 56px));margin:auto;padding:54px 0 84px}}.species-head{{max-width:1120px;padding-bottom:30px;border-bottom:1px solid #242a26}}.species-head h1{{margin:12px 0 18px;font-family:'Playfair Display',serif;font-size:clamp(44px,5vw,68px);line-height:.98;letter-spacing:-.04em}}.species-dek{{max-width:900px;color:#aab2ad;font-size:18px;line-height:1.65}}.species-meta{{display:flex;gap:12px;flex-wrap:wrap;margin-top:20px;color:#707a73;font-size:10px;text-transform:uppercase;letter-spacing:.06em}}.answer-card{{margin:30px 0 16px;padding:20px 22px;border:1px solid #29342d;border-radius:12px;background:#101512}}.answer-card strong{{display:block;color:#55dc7f;font-size:11px;text-transform:uppercase;letter-spacing:.12em}}.answer-card p{{margin:7px 0 0;color:#c1cac4;line-height:1.7}}.stats{{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:42px}}.stat{{padding:18px 20px;border:1px solid #29342d;border-radius:12px;background:#0f1310}}.stat b{{display:block;color:#e8eee9;font-size:28px}}.stat span{{display:block;margin-top:4px;color:#7f8b83;font-size:12px}}.section{{margin:48px 0}}.section h2,.explorer h2{{margin:0 0 12px;font-family:'Playfair Display',serif;font-size:34px;line-height:1.08}}.section p{{max-width:1050px;color:#aeb7b1;font-size:16px;line-height:1.8}}.insights{{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:20px}}.insight{{padding:18px;border:1px solid #242a26;border-radius:10px;background:#0d100e}}.insight h3{{margin:0 0 7px;color:#dce2de;font-size:15px}}.insight p{{margin:0;color:#859188;font-size:13px;line-height:1.65}}.explorer{{margin:38px 0;padding:22px;border:1px solid #29342d;border-radius:14px;background:#0f1310}}.explorer .sub{{color:#7f8b83;font-size:13px}}.controls{{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:20px 0}}.controls label{{color:#89958d;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em}}.controls select{{width:100%;margin-top:6px;padding:10px 12px;border:1px solid #303832;border-radius:8px;background:#141814;color:#dbe2dd}}.chart-wrap{{overflow:auto;padding-top:18px;border-top:1px solid #222a25}}#trendChart{{width:100%;min-width:760px;height:330px;display:block}}.legend{{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 18px}}.legend button{{padding:6px 10px;border:1px solid #303832;border-radius:999px;background:#141814;color:#cfd6d1;cursor:pointer}}.legend button.active{{border-color:#4ade80;background:rgba(74,222,128,.1);color:#82e9a0}}.table-wrap{{overflow:auto;border:1px solid #242a26;border-radius:10px}}table{{width:100%;min-width:820px;border-collapse:collapse}}th,td{{padding:10px 11px;border-bottom:1px solid #222a25;text-align:left;white-space:nowrap}}th{{color:#6f7972;font-size:10px;text-transform:uppercase;letter-spacing:.06em}}td{{color:#aeb7b1;font-size:13px}}tbody tr:hover{{background:#111612}}.snapshots{{display:grid;grid-template-columns:1fr 1fr;gap:20px}}.snapshots h3{{color:#dce2de;font-size:16px}}.method{{padding:20px 0;border-block:1px solid #242a26;color:#859188;font-size:13px;line-height:1.7}}@media(max-width:1000px){{.insights{{grid-template-columns:1fr 1fr}}}}@media(max-width:820px){{.species-shell{{width:calc(100% - 28px);padding-top:34px}}.stats,.controls,.insights,.snapshots{{grid-template-columns:1fr}}.species-head h1{{font-size:40px}}}}
</style></head><body>
<header class="resource-nav"><a class="resource-brand" href="/"><strong>HuntSmart <span>Canada</span></strong><small>Data-backed hunting research</small></a><nav><a href="/">App Home</a><a href="/blog/">Resources</a><a class="active" href="/bc-hunting/">BC Hunting</a><a href="/bc-hunting/questions/">Research Questions</a></nav><a class="resource-app-btn" href="/">Open HuntSmart</a></header>
<main class="species-shell"><header class="species-head"><div class="eyebrow">HuntSmart Research · Interactive {display} Data</div><h1>BC {display} LEH Odds: 10 Years of Draw Trends</h1><p class="species-dek">Compare British Columbia {display.lower()} Limited Entry Hunting opportunities by hunt code, region, animal class and historical draw success using HuntSmart’s current draw dataset.</p><div class="species-meta"><span>Updated Oct 27, 2026</span><span>2016–2025 history</span><span>{html.escape(', '.join(species_labels))}</span></div></header>
<div class="answer-card"><strong>Quick answer</strong><p>There is no single BC {display.lower()} LEH odds number. This analysis contains <b>{count}</b> opportunities with at least five years of usable history. Median 2025 draw success across those opportunities is <b>{med:.1f}%</b>; individual hunt codes can differ sharply by area, season, class, authorizations and applicant demand.</p></div>
<div class="stats"><div class="stat"><b>{count}</b><span>opportunities analyzed</span></div><div class="stat"><b>{regions}</b><span>region groupings represented</span></div><div class="stat"><b>2016–2025</b><span>comparison window</span></div></div>
<section class="section"><h2>How to read the odds</h2><p>Start with the exact hunt code. Compare 2025 draw success against the same opportunity’s 10-year median, then look at year-to-year volatility. A high single-year percentage can be misleading if the hunt has swung widely over time.</p><div class="insights"><div class="insight"><h3>Latest vs. median</h3><p>Shows whether 2025 was easier or harder than the hunt’s recent baseline.</p></div><div class="insight"><h3>Stability</h3><p>Lower variation means historical draw results have been more consistent.</p></div><div class="insight"><h3>Filter first</h3><p>Only compare regions and classes you would realistically hunt.</p></div><div class="insight"><h3>Odds are not hunt quality</h3><p>Access, timing, terrain and the actual hunting experience still matter.</p></div></div></section>
<section class="explorer"><h2>Interactive {display.lower()} LEH explorer</h2><div class="sub">Filter opportunities, sort them, then select up to four hunt codes to compare their draw-success history.</div><div class="controls"><label>Region<select id="regionFilter"><option value="all">All regions</option></select></label><label>Class<select id="classFilter"><option value="all">All classes</option></select></label><label>Sort by<select id="sortBy"><option value="current">2025 draw success</option><option value="median">10-year median</option><option value="stable">Most stable</option></select></label></div><div class="chart-wrap"><svg id="trendChart" viewBox="0 0 900 330"></svg></div><div class="legend" id="legend"></div><div class="table-wrap"><table><thead><tr><th></th><th>Code</th><th>MU</th><th>Area</th><th>Class</th><th>2025</th><th>10-yr median</th><th>Years</th></tr></thead><tbody id="liveRows"></tbody></table></div></section>
<section class="section"><h2>Current data snapshot</h2><div class="snapshots"><div><h3>Highest 2025 draw success</h3><div class="table-wrap"><table><thead><tr><th>Code</th><th>MU</th><th>Area</th><th>Class</th><th>2025</th><th>Median</th><th>Years</th></tr></thead><tbody>{table_rows(current_sorted[:8])}</tbody></table></div></div><div><h3>Most historically stable</h3><div class="table-wrap"><table><thead><tr><th>Code</th><th>MU</th><th>Area</th><th>Class</th><th>2025</th><th>Median</th><th>Years</th></tr></thead><tbody>{table_rows(stable_sorted[:8])}</tbody></table></div></div></div></section>
<section class="section"><h2>Using this for an application decision</h2><p>Use the explorer to build a realistic shortlist, then compare probability with the actual opportunity. Historical odds are descriptive rather than predictive, and legal hunting decisions should always be checked against current Province of British Columbia regulations and LEH materials.</p></section><div class="method"><strong>Methodology:</strong> HuntSmart reads finalized yearly draw-success fields in <code>draws.json</code> from 2016–2025 and includes opportunities with at least five usable years. Species matching is normalized so elk sub-types in the source data are included rather than excluded by an exact-label check.</div></main>
<script>
(()=>{{const NEEDLE={json.dumps(needle.lower())},YEARS={json.dumps(YEARS)},colors=['#55dc7f','#d5a35e','#61a6d7','#c37cab'];let all=[],selected=[];const median=a=>{{const x=[...a].sort((a,b)=>a-b),m=Math.floor(x.length/2);return x.length?x.length%2?x[m]:(x[m-1]+x[m])/2:0}},sd=a=>{{if(a.length<2)return 999;const m=a.reduce((s,v)=>s+v,0)/a.length;return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/a.length)}};fetch('/draws.json').then(r=>r.json()).then(data=>{{all=data.filter(r=>String(r.Species||'').toLowerCase().includes(NEEDLE)).map(r=>{{const h=r.yearly_draw_odds||{{}},vals=YEARS.map(y=>Number(String(h[y]??'').replace('%','').replace(',',''))).filter(Number.isFinite),current=Number(String(h['2025']??'').replace('%','').replace(',',''));return{{...r,current,median10:median(vals),stability:sd(vals),years:vals.length}}}}).filter(r=>Number.isFinite(r.current)&&r.years>=5);const regions=[...new Set(all.map(r=>r.MU_Name).filter(Boolean))].sort(),classes=[...new Set(all.map(r=>r.Class).filter(Boolean))].sort();regionFilter.insertAdjacentHTML('beforeend',regions.map(x=>`<option>${{x}}</option>`).join(''));classFilter.insertAdjacentHTML('beforeend',classes.map(x=>`<option>${{x}}</option>`).join(''));selected=all.slice().sort((a,b)=>b.current-a.current).slice(0,3).map(r=>String(r.Code));render()}});[regionFilter,classFilter,sortBy].forEach(x=>x.addEventListener('change',render));function list(){{let x=all.filter(r=>(regionFilter.value==='all'||r.MU_Name===regionFilter.value)&&(classFilter.value==='all'||r.Class===classFilter.value));if(sortBy.value==='median')x.sort((a,b)=>b.median10-a.median10);else if(sortBy.value==='stable')x.sort((a,b)=>a.stability-b.stability);else x.sort((a,b)=>b.current-a.current);return x}}function render(){{const rows=list();liveRows.innerHTML=rows.slice(0,60).map(r=>`<tr><td><input type="checkbox" data-code="${{r.Code}}" ${{selected.includes(String(r.Code))?'checked':''}}></td><td>${{r.Code}}</td><td>${{r.MU||''}}</td><td>${{r.Area||''}}</td><td>${{r.Class||''}}</td><td>${{r.current.toFixed(1)}}%</td><td>${{r.median10.toFixed(1)}}%</td><td>${{r.years}}</td></tr>`).join('');liveRows.querySelectorAll('input').forEach(c=>c.onchange=()=>{{const code=c.dataset.code;if(c.checked){{if(selected.length>=4){{c.checked=false;return}}selected.push(code)}}else selected=selected.filter(x=>x!==code);draw()}});draw()}}function draw(){{const chosen=selected.map(c=>all.find(r=>String(r.Code)===c)).filter(Boolean),svg=trendChart;if(!chosen.length){{svg.innerHTML='<text x="450" y="165" text-anchor="middle" fill="#7f8b83">Select a hunt code to compare trends</text>';legend.innerHTML='';return}}let values=[];chosen.forEach(r=>YEARS.forEach(y=>{{const v=Number(r.yearly_draw_odds?.[y]);if(Number.isFinite(v))values.push(v)}}));const max=Math.max(1,...values)*1.1,W=900,H=330,L=52,R=18,T=24,B=42,x=i=>L+i*(W-L-R)/(YEARS.length-1),y=v=>H-B-v*(H-T-B)/max;let s='';[0,.25,.5,.75,1].forEach(p=>{{const yy=y(max*p);s+=`<line x1="${{L}}" y1="${{yy}}" x2="${{W-R}}" y2="${{yy}}" stroke="#252d28"/><text x="${{L-8}}" y="${{yy+4}}" text-anchor="end" fill="#657069" font-size="10">${{(max*p).toFixed(0)}}%</text>`}});YEARS.forEach((yr,i)=>s+=`<text x="${{x(i)}}" y="${{H-15}}" text-anchor="middle" fill="#657069" font-size="10">${{yr}}</text>`);chosen.forEach((r,j)=>{{const pts=YEARS.map((yr,i)=>{{const v=Number(r.yearly_draw_odds?.[yr]);return Number.isFinite(v)?`${{x(i)}},${{y(v)}}`:null}}).filter(Boolean);s+=`<polyline fill="none" stroke="${{colors[j]}}" stroke-width="3" points="${{pts.join(' ')}}"/>`}});svg.innerHTML=s;legend.innerHTML=chosen.map((r,j)=>`<button class="active" style="border-color:${{colors[j]}}" data-code="${{r.Code}}">${{r.Code}} · MU ${{r.MU||''}}</button>`).join('')}} }})();
</script></body></html>'''
    out = SITE / slug / 'index.html'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(doc, encoding='utf-8')
    print(f'Built {slug}: {count} opportunities from labels {species_labels}')


render('Elk', 'elk', 'bc-hunting/elk-leh-odds')
render('Moose', 'moose', 'bc-hunting/moose-leh-odds')
