from pathlib import Path
import json, statistics, html

SITE = Path("site")
BASE = "https://huntsmartcanada.ca"
SLUG = "blog/bc-moose-leh-odds-trends"
SOURCE = Path("draws.json")
OUT = SITE / SLUG / "index.html"

records = json.loads(SOURCE.read_text(encoding="utf-8"))
moose = [r for r in records if r.get("Species") == "Moose"]

def vals_10(r):
    y = r.get("yearly_draw_odds") or {}
    out = []
    for year in range(2016, 2026):
        v = y.get(str(year))
        if isinstance(v, (int, float)):
            out.append(float(v))
    return out

rows = []
for r in moose:
    ys = vals_10(r)
    current = (r.get("yearly_draw_odds") or {}).get("2025")
    if not isinstance(current, (int, float)) or len(ys) < 5:
        continue
    med = statistics.median(ys)
    spread = statistics.pstdev(ys) if len(ys) > 1 else 0
    rows.append({
        "code": str(r.get("Code","")),
        "mu": r.get("MU",""),
        "area": r.get("Area",""),
        "klass": r.get("Class",""),
        "season": r.get("Season",""),
        "region": r.get("MU_Name",""),
        "current": float(current),
        "median": med,
        "spread": spread,
        "years": len(ys),
    })

rows.sort(key=lambda x: (-x["current"], x["spread"]))
top = rows[:10]
table_rows = "".join(
    f"<tr><td>{html.escape(x['code'])}</td><td>{html.escape(x['mu'])}</td><td>{html.escape(x['area'])}</td>"
    f"<td>{html.escape(x['season'])}</td><td>{x['current']:.1f}%</td><td>{x['median']:.1f}%</td><td>{x['years']}</td></tr>"
    for x in top
)

current_vals = [x["current"] for x in rows]
median_2025 = statistics.median(current_vals) if current_vals else 0
regions = len(set(x["region"] for x in rows if x["region"]))
count = len(rows)

article_schema = {
  "@context":"https://schema.org","@type":"Article",
  "headline":"BC Moose LEH Odds: 10 Years of Draw Trends (Interactive)",
  "description":"Explore 10 years of BC moose Limited Entry Hunting draw trends with live HuntSmart data. Filter by region, compare hunt codes and see how 2025 odds compare with multi-year medians.",
  "datePublished":"2026-10-27","dateModified":"2026-10-27",
  "mainEntityOfPage":f"{BASE}/{SLUG}/",
  "author":{"@id":f"{BASE}/#organization"},
  "publisher":{"@id":f"{BASE}/#organization"}
}
dataset_schema = {
  "@context":"https://schema.org","@type":"Dataset",
  "name":"HuntSmart Canada BC Moose LEH Historical Draw Trends",
  "description":"Interactive analysis of historical BC moose Limited Entry Hunting draw success by hunt opportunity using HuntSmart's compiled draw dataset.",
  "url":f"{BASE}/{SLUG}/",
  "temporalCoverage":"2016/2025",
  "creator":{"@id":f"{BASE}/#organization"}
}

doc = f'''<!doctype html>
<html lang="en-CA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>BC Moose LEH Odds: 10 Years of Draw Trends | HuntSmart Canada</title>
<meta name="description" content="Explore 10 years of BC moose LEH draw trends with live HuntSmart data. Filter by region, compare hunt codes, and put 2025 odds into historical context.">
<link rel="canonical" href="{BASE}/{SLUG}/">
<meta property="og:type" content="article">
<meta property="og:title" content="BC Moose LEH Odds: 10 Years of Draw Trends">
<meta property="og:description" content="Interactive HuntSmart analysis of BC moose LEH draw trends from 2016–2025.">
<meta property="og:url" content="{BASE}/{SLUG}/">
<link rel="stylesheet" href="/blog.css?v=20261027moose">
<script type="application/ld+json">{json.dumps(article_schema,separators=(',',':'))}</script>
<script type="application/ld+json">{json.dumps(dataset_schema,separators=(',',':'))}</script>
<style>
.hs-data-shell{{max-width:1180px;margin:0 auto;padding:0 24px 70px}}
.hs-stat-grid{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:22px 0 34px}}
.hs-stat{{border:1px solid rgba(40,70,48,.14);background:#fff;border-radius:16px;padding:18px}}
.hs-stat b{{display:block;font-size:1.8rem;line-height:1.1;margin-bottom:4px}}
.hs-stat span{{color:#667067;font-size:.92rem}}
.explorer{{border:1px solid rgba(40,70,48,.16);background:#fff;border-radius:18px;padding:20px;margin:28px 0}}
.controls{{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:12px;margin-bottom:16px}}
.controls label{{font-size:.8rem;font-weight:700;color:#5b655d}}
.controls select{{width:100%;margin-top:5px;padding:10px 12px;border:1px solid #cfd5d0;border-radius:10px;background:#fff}}
.chart-wrap{{overflow-x:auto;border-top:1px solid #edf0ed;padding-top:18px}}
#trendChart{{width:100%;min-width:660px;height:330px;display:block}}
.legend{{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 0}}
.legend button{{border:1px solid #d7ddd8;border-radius:999px;background:#fff;padding:6px 10px;cursor:pointer}}
.legend button.active{{border-color:#355b40;background:#eef5ef}}
.data-table-wrap{{overflow:auto}}
.data-table{{width:100%;border-collapse:collapse;font-size:.92rem}}
.data-table th,.data-table td{{padding:10px 9px;border-bottom:1px solid #e6eae7;text-align:left;white-space:nowrap}}
.data-table th{{font-size:.78rem;text-transform:uppercase;letter-spacing:.04em;color:#647066}}
.note{{font-size:.88rem;color:#667067}}
@media(max-width:760px){{.hs-stat-grid{{grid-template-columns:1fr}}.controls{{grid-template-columns:1fr}}}}
</style>
</head>
<body>
<header class="resource-nav">
  <a class="resource-brand" href="/"><strong>HuntSmart <span>Canada</span></strong><small>Data-backed hunting research</small></a>
  <nav><a href="/">App Home</a><a class="active" href="/blog/">Journal</a><a href="/bc-hunting/">BC Hunting</a><a href="/methodology/">Methodology</a></nav>
  <a class="resource-app-btn" href="/">Open HuntSmart</a>
</header>

<main>
<section class="article-shell">
<header class="article-header">
  <div class="eyebrow">HuntSmart Research · Interactive Data</div>
  <h1>BC Moose LEH Odds: 10 Years of Draw Trends</h1>
  <p class="dek">A live, hunt-by-hunt look at how British Columbia moose Limited Entry Hunting draw success changed from 2016 through 2025.</p>
  <div class="article-byline"><span>HuntSmart Canada</span><span>Published Oct 27, 2026</span><span>Uses finalized draw data through 2025</span></div>
</header>
</section>

<div class="hs-data-shell">
<div class="answer-box"><strong>Quick answer</strong>
<p>There is no single “BC moose LEH odds” number. HuntSmart currently has <strong>{count}</strong> moose opportunities in this analysis with at least five years of usable history. The median 2025 draw success across those opportunities is <strong>{median_2025:.1f}%</strong>, but individual hunt codes vary dramatically by area, season, animal class and applicant demand.</p>
</div>

<div class="hs-stat-grid">
  <div class="hs-stat"><b>{count}</b><span>moose hunt opportunities analyzed</span></div>
  <div class="hs-stat"><b>{regions}</b><span>BC region groupings represented</span></div>
  <div class="hs-stat"><b>2016–2025</b><span>interactive comparison window</span></div>
</div>

<article class="article-body">
<section>
<h2>Why one year of moose draw odds can mislead you</h2>
<p>A single draw percentage tells you what happened in one completed draw. It does not tell you whether that result was normal, unusually easy, unusually difficult, or part of a longer trend. For moose, that distinction matters because applicant demand and authorization counts can move sharply between years.</p>
<p>Use the explorer below to compare the latest finalized 2025 result with the same hunt's multi-year history. Historical results are descriptive, not predictive.</p>
</section>

<section class="explorer" aria-labelledby="explorerTitle">
<h2 id="explorerTitle">Interactive moose LEH trend explorer</h2>
<p class="note">Choose a region and sorting method. Click up to four hunts in the table to compare their 10-year trend.</p>
<div class="controls">
<label>Region<select id="regionFilter"><option value="all">All regions</option></select></label>
<label>Class<select id="classFilter"><option value="all">All classes</option></select></label>
<label>Sort by<select id="sortBy"><option value="current">2025 draw success</option><option value="median">10-year median</option><option value="stable">Most stable</option></select></label>
</div>
<div class="chart-wrap"><svg id="trendChart" viewBox="0 0 900 330" role="img" aria-label="Historical moose LEH draw trend chart"></svg></div>
<div class="legend" id="legend"></div>
<div class="data-table-wrap">
<table class="data-table"><thead><tr><th></th><th>Code</th><th>MU</th><th>Area</th><th>Class</th><th>2025</th><th>10-yr median</th><th>Years</th></tr></thead><tbody id="liveRows"></tbody></table>
</div>
</section>

<section>
<h2>Highest 2025 draw success among moose opportunities with usable history</h2>
<p>This static table is generated at build time from the same <code>draws.json</code> dataset used by the live HuntSmart app. It gives search engines and non-JavaScript readers a crawlable snapshot of the current analysis.</p>
<div class="data-table-wrap">
<table class="data-table"><thead><tr><th>Code</th><th>MU</th><th>Area</th><th>Season</th><th>2025</th><th>10-yr median</th><th>Years</th></tr></thead><tbody>{table_rows}</tbody></table>
</div>
<p class="note">Higher historical draw success is not automatically a “better” hunt. Access, season timing, travel, terrain, regulations and the quality of the opportunity still matter.</p>
</section>

<section>
<h2>How to use this when choosing an application</h2>
<p>Start by filtering to regions you can realistically hunt. Compare 2025 with the 10-year median, then inspect the trend line. A hunt with a high latest result but extreme historical volatility deserves more caution than a hunt that has been consistently easier to draw.</p>
<p>Once a shortlist looks interesting, open HuntSmart and compare the hunt cards, mapping context, access and other available information before making an application decision.</p>
</section>

<section id="sources-methodology">
<h2>Sources &amp; methodology</h2>
<p>HuntSmart organizes public British Columbia draw information into a consistent hunt-level dataset. This page reads HuntSmart's live <code>draws.json</code> file, filters to moose, and analyzes yearly draw-success fields from 2016–2025. The static summary above is regenerated on every production build.</p>
<p>Official legal and program information should always be verified with the Province of British Columbia's current Limited Entry Hunting materials, Hunting and Trapping Regulations Synopsis and published hunting datasets.</p>
<p><strong>Last reviewed:</strong> October 27, 2026. Historical draw success does not guarantee future results.</p>
</section>
</article>
</div>
</main>

<footer class="resource-footer"><div class="resource-footer-inner"><div><h4>HuntSmart Canada</h4><p>Data-backed hunting research for BC and Alberta.</p></div><div><h4>Research</h4><div class="footer-links"><a href="/blog/bc-leh-odds-guide/">BC LEH Odds Guide</a><a href="/bc-hunting/moose/">BC Moose Guide</a><a href="/methodology/">Methodology</a></div></div></div><div class="resource-footer-bottom"><span>© 2026 HuntSmart Canada</span></div></footer>

<script>
(() => {{
  const YEARS = Array.from({{length:10}}, (_,i)=>String(2016+i));
  const colors = ['#315c3c','#8a5a2b','#315a7a','#7b456f'];
  let all = [], selected = [];

  const median = a => {{
    const x=[...a].sort((p,q)=>p-q); if(!x.length)return 0;
    const m=Math.floor(x.length/2); return x.length%2?x[m]:(x[m-1]+x[m])/2;
  }};
  const sd = a => {{
    if(a.length<2)return 999;
    const m=a.reduce((s,v)=>s+v,0)/a.length;
    return Math.sqrt(a.reduce((s,v)=>s+(v-m)*(v-m),0)/a.length);
  }};

  fetch('/draws.json').then(r=>r.json()).then(data=>{{
    all = data.filter(r=>r.Species==='Moose').map(r=>{{
      const hist=r.yearly_draw_odds||{{}};
      const values=YEARS.map(y=>Number(hist[y])).filter(Number.isFinite);
      const current=Number(hist['2025']);
      return {{...r,current,median10:median(values),stability:sd(values),years:values.length}};
    }}).filter(r=>Number.isFinite(r.current)&&r.years>=5);

    const regions=[...new Set(all.map(r=>r.MU_Name).filter(Boolean))].sort();
    const classes=[...new Set(all.map(r=>r.Class).filter(Boolean))].sort();
    document.getElementById('regionFilter').insertAdjacentHTML('beforeend',regions.map(x=>`<option>${{x}}</option>`).join(''));
    document.getElementById('classFilter').insertAdjacentHTML('beforeend',classes.map(x=>`<option>${{x}}</option>`).join(''));
    selected = all.slice().sort((a,b)=>b.current-a.current).slice(0,3).map(r=>String(r.Code));
    render();
  }}).catch(()=>{{document.getElementById('liveRows').innerHTML='<tr><td colspan="8">Interactive data could not load. The crawlable summary above remains available.</td></tr>';}});

  ['regionFilter','classFilter','sortBy'].forEach(id=>document.getElementById(id).addEventListener('change',render));

  function filtered() {{
    const region=document.getElementById('regionFilter').value;
    const klass=document.getElementById('classFilter').value;
    const sort=document.getElementById('sortBy').value;
    let x=all.filter(r=>(region==='all'||r.MU_Name===region)&&(klass==='all'||r.Class===klass));
    if(sort==='median')x.sort((a,b)=>b.median10-a.median10);
    else if(sort==='stable')x.sort((a,b)=>a.stability-b.stability);
    else x.sort((a,b)=>b.current-a.current);
    return x;
  }}

  function render() {{
    const x=filtered();
    const tbody=document.getElementById('liveRows');
    tbody.innerHTML=x.slice(0,40).map(r=>`<tr>
      <td><input type="checkbox" data-code="${{r.Code}}" ${{selected.includes(String(r.Code))?'checked':''}}></td>
      <td>${{r.Code}}</td><td>${{r.MU||''}}</td><td>${{r.Area||''}}</td><td>${{r.Class||''}}</td>
      <td>${{r.current.toFixed(1)}}%</td><td>${{r.median10.toFixed(1)}}%</td><td>${{r.years}}</td></tr>`).join('');
    tbody.querySelectorAll('input[type=checkbox]').forEach(cb=>cb.addEventListener('change',()=>{{
      const c=String(cb.dataset.code);
      if(cb.checked){{ if(selected.length>=4){{cb.checked=false;return;}} selected.push(c); }}
      else selected=selected.filter(v=>v!==c);
      draw();
    }}));
    draw();
  }}

  function draw() {{
    const svg=document.getElementById('trendChart'), legend=document.getElementById('legend');
    const series=selected.map(c=>all.find(r=>String(r.Code)===String(c))).filter(Boolean);
    const vals=series.flatMap(r=>YEARS.map(y=>Number((r.yearly_draw_odds||{{}})[y])).filter(Number.isFinite));
    const ymax=Math.max(10,...vals)*1.08;
    const W=900,H=330,L=52,R=18,T=18,B=42, iw=W-L-R, ih=H-T-B;
    const xp=i=>L+(i/(YEARS.length-1))*iw, yp=v=>T+ih-(v/ymax)*ih;
    let out='';
    for(let j=0;j<=5;j++){{const v=ymax*j/5,y=yp(v);out+=`<line x1="${{L}}" y1="${{y}}" x2="${{W-R}}" y2="${{y}}" stroke="#e7ebe8"/><text x="${{L-8}}" y="${{y+4}}" text-anchor="end" font-size="11" fill="#6c746e">${{v.toFixed(0)}}%</text>`;}}
    YEARS.forEach((y,i)=>out+=`<text x="${{xp(i)}}" y="${{H-14}}" text-anchor="middle" font-size="11" fill="#6c746e">${{y.slice(2)}}</text>`);
    series.forEach((r,si)=>{{
      const pts=YEARS.map((y,i)=>[i,Number((r.yearly_draw_odds||{{}})[y])]).filter(p=>Number.isFinite(p[1]));
      out+=`<polyline fill="none" stroke="${{colors[si]}}" stroke-width="3" points="${{pts.map(p=>`${{xp(p[0])}},${{yp(p[1])}}`).join(' ')}}"/>`;
      pts.forEach(p=>out+=`<circle cx="${{xp(p[0])}}" cy="${{yp(p[1])}}" r="3.3" fill="${{colors[si]}}"/>`);
    }});
    svg.innerHTML=out;
    legend.innerHTML=series.map((r,i)=>`<button class="active" style="border-left:4px solid ${{colors[i]}}">${{r.Code}} · ${{r.MU}} · ${{r.Area}}</button>`).join('');
  }}
}})();
</script>
</body></html>'''

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(doc, encoding="utf-8")

journal = SITE / "blog/index.html"
if journal.exists():
    text = journal.read_text(encoding="utf-8")
    href = "/blog/bc-moose-leh-odds-trends/"
    if href not in text:
        card = f'''<a class="article-card featured" data-category="data bc" data-search="bc moose leh odds 2025 historical trends hunt codes interactive" href="{href}">
<div class="article-card-body"><div class="article-kicker">New · HuntSmart Research · Interactive</div>
<h3>BC Moose LEH Odds: 10 Years of Draw Trends</h3>
<p>Filter real moose opportunities, compare 2025 draw success with 10-year medians, and chart up to four hunt codes side by side.</p>
<div class="article-byline-compact"><span>Oct 27, 2026</span><span>HuntSmart Canada</span></div>
<div class="article-meta"><span>Live data explorer</span><span>8 min read</span></div><div class="article-cta">Explore moose draw trends →</div></div></a>'''
        text = text.replace('<div class="article-grid" id="blogGrid">', '<div class="article-grid" id="blogGrid">\n' + card, 1)
        journal.write_text(text, encoding="utf-8")

sitemap = SITE / "sitemap.xml"
if sitemap.exists():
    xml = sitemap.read_text(encoding="utf-8")
    loc = f"{BASE}/{SLUG}/"
    if loc not in xml:
        block = f"  <url>\n    <loc>{loc}</loc>\n    <lastmod>2026-10-27</lastmod>\n  </url>\n"
        xml = xml.replace("</urlset>", block + "</urlset>")
        sitemap.write_text(xml, encoding="utf-8")

assert OUT.exists()
assert "BC Moose LEH Odds" in OUT.read_text(encoding="utf-8")
assert f"{BASE}/{SLUG}/" in sitemap.read_text(encoding="utf-8")
print(f"Published interactive research article: /{SLUG}/")
