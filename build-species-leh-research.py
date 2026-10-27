from pathlib import Path
import json, statistics, html

SITE = Path('site')
BASE = 'https://huntsmartcanada.ca'
YEARS = [str(y) for y in range(2016, 2026)]
records = json.loads(Path('draws.json').read_text(encoding='utf-8'))


def history_values(rec):
    hist = rec.get('yearly_draw_odds') or {}
    return [float(hist[y]) for y in YEARS if isinstance(hist.get(y), (int, float))]


def make_rows(species):
    out = []
    for rec in records:
        if rec.get('Species') != species:
            continue
        hist = rec.get('yearly_draw_odds') or {}
        current = hist.get('2025')
        vals = history_values(rec)
        if not isinstance(current, (int, float)) or len(vals) < 5:
            continue
        out.append({
            'code': str(rec.get('Code', '')),
            'mu': str(rec.get('MU', '')),
            'area': str(rec.get('Area', '')),
            'klass': str(rec.get('Class', '')),
            'season': str(rec.get('Season', '')),
            'region': str(rec.get('MU_Name', '')),
            'current': float(current),
            'median': statistics.median(vals),
            'spread': statistics.pstdev(vals) if len(vals) > 1 else 0,
            'years': len(vals),
        })
    return out


def row_html(x):
    return (
        f"<tr><td>{html.escape(x['code'])}</td><td>{html.escape(x['mu'])}</td>"
        f"<td>{html.escape(x['area'])}</td><td>{html.escape(x['klass'])}</td>"
        f"<td>{x['current']:.1f}%</td><td>{x['median']:.1f}%</td><td>{x['years']}</td></tr>"
    )


def render(species, slug, eyebrow, noun):
    data = make_rows(species)
    if not data:
        raise SystemExit(f'No {species} LEH data available')
    by_current = sorted(data, key=lambda x: (-x['current'], x['spread']))
    by_stable = sorted(data, key=lambda x: (x['spread'], -x['median']))
    count = len(data)
    median_2025 = statistics.median([x['current'] for x in data])
    regions = len({x['region'] for x in data if x['region']})
    high_table = ''.join(row_html(x) for x in by_current[:8])
    stable_table = ''.join(row_html(x) for x in by_stable[:8])
    canonical = f'{BASE}/{slug}/'
    schema = {
        '@context': 'https://schema.org', '@type': 'Article',
        'headline': f'BC {species} LEH Odds: 10 Years of Draw Trends',
        'description': f'Interactive HuntSmart research on British Columbia {noun} Limited Entry Hunting draw trends by hunt code, region, class and season.',
        'datePublished': '2026-10-27', 'dateModified': '2026-10-27',
        'mainEntityOfPage': canonical,
        'author': {'@id': f'{BASE}/#organization'},
        'publisher': {'@id': f'{BASE}/#organization'}
    }
    dataset = {
        '@context': 'https://schema.org', '@type': 'Dataset',
        'name': f'HuntSmart Canada BC {species} LEH Historical Draw Trends',
        'description': f'Historical BC {noun} LEH draw-success analysis by opportunity using HuntSmart compiled draw data.',
        'url': canonical, 'temporalCoverage': '2016/2025',
        'creator': {'@id': f'{BASE}/#organization'}
    }
    doc = f'''<!doctype html>
<html lang="en-CA"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>BC {species} LEH Odds: 10 Years of Draw Trends | HuntSmart Canada</title>
<meta name="description" content="Explore 10 years of BC {noun} LEH draw trends with real HuntSmart data. Filter by region and class, sort opportunities, and compare historical draw success.">
<link rel="canonical" href="{canonical}"><meta property="og:type" content="article"><meta property="og:title" content="BC {species} LEH Odds: 10 Years of Draw Trends"><meta property="og:url" content="{canonical}">
<link rel="stylesheet" href="/blog.css?v=20261027species">
<script type="application/ld+json">{json.dumps(schema, separators=(',', ':'))}</script>
<script type="application/ld+json">{json.dumps(dataset, separators=(',', ':'))}</script>
<style>
.species-shell{{width:min(1380px,calc(100% - 64px));margin:0 auto;padding:58px 0 82px}}.species-head{{max-width:1120px;padding-bottom:32px;border-bottom:1px solid #242a26}}.species-head h1{{margin:12px 0 18px;font-family:'Playfair Display',serif;font-size:clamp(46px,5.4vw,70px);line-height:.98;letter-spacing:-.04em}}.species-dek{{max-width:900px;color:#aab2ad;font-size:18px;line-height:1.65}}.species-meta{{display:flex;gap:12px;flex-wrap:wrap;margin-top:22px;color:#707a73;font-size:10px;text-transform:uppercase;letter-spacing:.06em}}.answer-card{{margin:34px 0 18px;padding:20px 22px;border:1px solid #29342d;border-radius:12px;background:#101512}}.answer-card strong{{display:block;color:#55dc7f;font-size:11px;text-transform:uppercase;letter-spacing:.12em}}.answer-card p{{margin:7px 0 0;color:#c1cac4;line-height:1.72}}.stats{{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0 0 42px}}.stat{{padding:18px 20px;border:1px solid #29342d;border-radius:12px;background:#0f1310}}.stat b{{display:block;color:#e8eee9;font-size:27px;line-height:1.1}}.stat span{{display:block;margin-top:5px;color:#7f8b83;font-size:12px}}.section{{margin:52px 0}}.section h2,.explorer h2{{margin:0 0 12px;font-family:'Playfair Display',serif;font-size:34px;line-height:1.1}}.section p{{max-width:980px;color:#aeb7b1;font-size:16px;line-height:1.8}}.two-col{{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:22px}}.insight{{padding:21px;border-top:1px solid #242a26;background:#0d100e}}.insight h3{{margin:0 0 8px;color:#dce2de;font-size:16px}}.insight p{{margin:0;color:#859188;font-size:13px;line-height:1.7}}.explorer{{margin:38px 0;padding:22px;border:1px solid #29342d;border-radius:14px;background:#0f1310}}.explorer .sub{{color:#7f8b83;font-size:13px;line-height:1.6}}.controls{{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:20px 0}}.controls label{{color:#89958d;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em}}.controls select{{width:100%;margin-top:6px;padding:10px 12px;border:1px solid #303832;border-radius:8px;background:#141814;color:#dbe2dd}}.chart-wrap{{overflow:auto;padding-top:18px;border-top:1px solid #222a25}}#trendChart{{width:100%;min-width:760px;height:330px;display:block}}.legend{{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 18px}}.legend button{{padding:6px 10px;border:1px solid #303832;border-radius:999px;background:#141814;color:#cfd6d1;cursor:pointer}}.legend button.active{{border-color:#4ade80;background:rgba(74,222,128,.1);color:#82e9a0}}.table-wrap{{overflow:auto;border:1px solid #242a26;border-radius:10px}}table{{width:100%;min-width:820px;border-collapse:collapse}}th,td{{padding:10px 11px;border-bottom:1px solid #222a25;text-align:left;white-space:nowrap}}th{{color:#6f7972;font-size:10px;text-transform:uppercase;letter-spacing:.06em}}td{{color:#aeb7b1;font-size:13px}}tbody tr:hover{{background:#111612}}.pick{{width:30px}}.note{{color:#6f7972!important;font-size:12px!important}}.static-grid{{display:grid;grid-template-columns:1fr 1fr;gap:22px}}.static-grid h3{{margin:0 0 10px;color:#dce2de;font-size:17px}}.method{{padding:20px 0;border-top:1px solid #242a26;border-bottom:1px solid #242a26}}.method p{{margin:0;color:#859188;font-size:13px;line-height:1.7}}@media(max-width:820px){{.species-shell{{width:calc(100% - 28px);padding-top:34px}}.stats,.controls,.two-col,.static-grid{{grid-template-columns:1fr}}.species-head h1{{font-size:42px}}}}
</style></head><body>
<header class="resource-nav"><a class="resource-brand" href="/"><strong>HuntSmart <span>Canada</span></strong><small>Data-backed hunting research</small></a><nav><a href="/">App Home</a><a href="/blog/">Resources</a><a class="active" href="/bc-hunting/">BC Hunting</a><a href="/bc-hunting/questions/">Research Questions</a></nav><a class="resource-app-btn" href="/">Open HuntSmart</a></header>
<main class="species-shell"><header class="species-head"><div class="eyebrow">{eyebrow}</div><h1>BC {species} LEH Odds: 10 Years of Draw Trends</h1><p class="species-dek">Compare British Columbia {noun} Limited Entry Hunting opportunities by hunt code, region, animal class and historical draw success — using the same HuntSmart dataset that powers the app.</p><div class="species-meta"><span>HuntSmart Canada</span><span>Updated Oct 27, 2026</span><span>Historical window 2016–2025</span></div></header>
<div class="answer-card"><strong>Quick answer</strong><p>There is no single “BC {noun} LEH odds” number. This analysis contains <b>{count}</b> {noun} opportunities with at least five years of usable history. The median 2025 draw success across those opportunities is <b>{median_2025:.1f}%</b>. Individual hunt codes vary because area, season, animal class, authorizations and applicant demand differ.</p></div>
<div class="stats"><div class="stat"><b>{count}</b><span>{noun} opportunities analyzed</span></div><div class="stat"><b>{regions}</b><span>region groupings represented</span></div><div class="stat"><b>2016–2025</b><span>historical comparison window</span></div></div>
<section class="section"><h2>What should you actually look for?</h2><p>The latest draw percentage is useful, but it is only one completed draw. A better application decision compares the latest result with a multi-year baseline, checks whether that hunt is stable or volatile, and then weighs the probability against the actual quality and practicality of the hunt.</p><div class="two-col"><div class="insight"><h3>Latest odds vs. normal</h3><p>Compare 2025 draw success with the 10-year median. Large gaps can signal an unusual year rather than a durable change.</p></div><div class="insight"><h3>Stability matters</h3><p>Lower year-to-year variation means the historical odds have been more consistent. Stable does not mean guaranteed.</p></div><div class="insight"><h3>Filter before ranking</h3><p>Start with regions and animal classes you can realistically hunt. “Easiest” is meaningless if the opportunity does not fit your plan.</p></div><div class="insight"><h3>Use the exact hunt code</h3><p>Different hunt codes can represent different areas, seasons and classes even within the same broad region.</p></div></div></section>
<section class="explorer"><h2>Interactive {noun} LEH explorer</h2><div class="sub">Filter the list, sort opportunities, then select up to four hunt codes to compare their 2016–2025 draw-success trends.</div><div class="controls"><label>Region<select id="regionFilter"><option value="all">All regions</option></select></label><label>Class<select id="classFilter"><option value="all">All classes</option></select></label><label>Sort by<select id="sortBy"><option value="current">2025 draw success</option><option value="median">10-year median</option><option value="stable">Most stable</option></select></label></div><div class="chart-wrap"><svg id="trendChart" viewBox="0 0 900 330" aria-label="Historical {noun} LEH draw trend chart"></svg></div><div class="legend" id="legend"></div><div class="table-wrap"><table><thead><tr><th></th><th>Code</th><th>MU</th><th>Area</th><th>Class</th><th>2025</th><th>10-yr median</th><th>Years</th></tr></thead><tbody id="liveRows"></tbody></table></div><p class="note">Historical draw success describes completed draws; it does not predict the next result.</p></section>
<section class="section"><h2>Current snapshot from the same HuntSmart dataset</h2><div class="static-grid"><div><h3>Highest 2025 draw success</h3><div class="table-wrap"><table><thead><tr><th>Code</th><th>MU</th><th>Area</th><th>Class</th><th>2025</th><th>Median</th><th>Years</th></tr></thead><tbody>{high_table}</tbody></table></div></div><div><h3>Most historically stable</h3><div class="table-wrap"><table><thead><tr><th>Code</th><th>MU</th><th>Area</th><th>Class</th><th>2025</th><th>Median</th><th>Years</th></tr></thead><tbody>{stable_table}</tbody></table></div></div></div></section>
<section class="section"><h2>How to use this for an application decision</h2><p>Filter to opportunities you would genuinely hunt. Then compare 2025 with the 10-year median and inspect the line chart. A hunt with strong current odds but wild historical swings deserves more caution than a hunt that has been consistently similar over time. After that, bring in access, season timing, travel, terrain and the actual experience you want.</p></section>
<section class="method"><p><strong>Methodology:</strong> This page reads HuntSmart’s current <code>draws.json</code> dataset, filters to {noun}, and analyzes finalized yearly draw-success fields from 2016 through 2025 where at least five years are available. Use HuntSmart for research and always verify current legal requirements with official Province of British Columbia hunting materials.</p></section>
</main>
<script>
(() => {{ const SPECIES={json.dumps(species)}; const YEARS=Array.from({{length:10}},(_,i)=>String(2016+i)); const colors=['#55dc7f','#d5a35e','#61a6d7','#c37cab']; let all=[],selected=[]; const median=a=>{{const x=[...a].sort((p,q)=>p-q);if(!x.length)return 0;const m=Math.floor(x.length/2);return x.length%2?x[m]:(x[m-1]+x[m])/2}}; const sd=a=>{{if(a.length<2)return 999;const m=a.reduce((s,v)=>s+v,0)/a.length;return Math.sqrt(a.reduce((s,v)=>s+(v-m)*(v-m),0)/a.length)}}; fetch('/draws.json').then(r=>r.json()).then(data=>{{all=data.filter(r=>r.Species===SPECIES).map(r=>{{const h=r.yearly_draw_odds||{{}};const vals=YEARS.map(y=>Number(h[y])).filter(Number.isFinite);return {{...r,current:Number(h['2025']),median10:median(vals),stability:sd(vals),years:vals.length}}}}).filter(r=>Number.isFinite(r.current)&&r.years>=5); const regs=[...new Set(all.map(r=>r.MU_Name).filter(Boolean))].sort(); const cls=[...new Set(all.map(r=>r.Class).filter(Boolean))].sort(); regionFilter.insertAdjacentHTML('beforeend',regs.map(x=>`<option>${{x}}</option>`).join('')); classFilter.insertAdjacentHTML('beforeend',cls.map(x=>`<option>${{x}}</option>`).join('')); selected=all.slice().sort((a,b)=>b.current-a.current).slice(0,3).map(r=>String(r.Code)); render();}}); ['regionFilter','classFilter','sortBy'].forEach(id=>document.getElementById(id).addEventListener('change',render)); function filtered(){{let x=all.filter(r=>(regionFilter.value==='all'||r.MU_Name===regionFilter.value)&&(classFilter.value==='all'||r.Class===classFilter.value)); if(sortBy.value==='median')x.sort((a,b)=>b.median10-a.median10);else if(sortBy.value==='stable')x.sort((a,b)=>a.stability-b.stability);else x.sort((a,b)=>b.current-a.current);return x}} function render(){{const x=filtered(); liveRows.innerHTML=x.slice(0,40).map(r=>`<tr><td class="pick"><input type="checkbox" data-code="${{r.Code}}" ${{selected.includes(String(r.Code))?'checked':''}}></td><td>${{r.Code}}</td><td>${{r.MU||''}}</td><td>${{r.Area||''}}</td><td>${{r.Class||''}}</td><td>${{r.current.toFixed(1)}}%</td><td>${{r.median10.toFixed(1)}}%</td><td>${{r.years}}</td></tr>`).join(''); liveRows.querySelectorAll('input').forEach(cb=>cb.addEventListener('change',()=>{{const code=cb.dataset.code;if(cb.checked){{if(selected.length>=4){{cb.checked=false;return}}selected.push(code)}}else selected=selected.filter(c=>c!==code); draw()}})); draw()}} function draw(){{const chosen=selected.map(c=>all.find(r=>String(r.Code)===c)).filter(Boolean); legend.innerHTML=chosen.map((r,i)=>`<button class="active" style="border-color:${{colors[i]}}">${{r.Code}} · ${{r.MU||r.Area||''}}</button>`).join(''); const svg=document.getElementById('trendChart'),W=900,H=330,pad={{l:48,r:20,t:20,b:40}},iw=W-pad.l-pad.r,ih=H-pad.t-pad.b; let vals=[];chosen.forEach(r=>YEARS.forEach(y=>{{const v=Number((r.yearly_draw_odds||{{}})[y]);if(Number.isFinite(v))vals.push(v)}})); const ymax=Math.max(10,Math.ceil((Math.max(...vals,10))/10)*10); let s=''; for(let i=0;i<=4;i++){{const v=ymax*i/4,y=pad.t+ih-(v/ymax)*ih;s+=`<line x1="${{pad.l}}" x2="${{W-pad.r}}" y1="${{y}}" y2="${{y}}" stroke="#202722"/><text x="${{pad.l-8}}" y="${{y+4}}" text-anchor="end" fill="#68736c" font-size="10">${{v.toFixed(0)}}%</text>`}} YEARS.forEach((yr,i)=>{{const x=pad.l+iw*i/(YEARS.length-1);s+=`<text x="${{x}}" y="${{H-12}}" text-anchor="middle" fill="#68736c" font-size="10">${{yr.slice(2)}}</text>`}});chosen.forEach((r,ci)=>{{const pts=YEARS.map((yr,i)=>{{const v=Number((r.yearly_draw_odds||{{}})[yr]);if(!Number.isFinite(v))return null;const x=pad.l+iw*i/(YEARS.length-1),y=pad.t+ih-(v/ymax)*ih;return [x,y]}}).filter(Boolean);if(pts.length>1){{s+=`<polyline fill="none" stroke="${{colors[ci]}}" stroke-width="3" points="${{pts.map(p=>p.join(',')).join(' ')}}"/>`;pts.forEach(p=>s+=`<circle cx="${{p[0]}}" cy="${{p[1]}}" r="3.5" fill="${{colors[ci]}}"/>`)}}}});svg.innerHTML=s}}
}})();
</script></body></html>'''
    out = SITE / slug / 'index.html'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(doc, encoding='utf-8')

render('Elk', 'bc-hunting/elk-leh-odds', 'HuntSmart Research · Interactive Elk Data', 'elk')
render('Moose', 'bc-hunting/moose-leh-odds', 'HuntSmart Research · Interactive Moose Data', 'moose')
