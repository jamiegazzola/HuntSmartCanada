from pathlib import Path
import html, json, math, statistics, re
from datetime import date

ROOT=Path("site")
SOURCE=Path("draws.json")
SLUG="blog/easiest-bc-leh-draws-stability"
URL="https://huntsmartcanada.ca/"+SLUG+"/"
YEARS=[str(y) for y in range(2016,2026)]
TODAY=date.today().isoformat()
def parse(v):
    if v is None or isinstance(v,bool): return None
    if isinstance(v,str):
        v=v.strip().replace("%","").replace(",","")
        if not v: return None
    try:
        x=float(v)
        return x if math.isfinite(x) and 0<=x<=100 else None
    except (ValueError,TypeError): return None

records=json.loads(SOURCE.read_text(encoding="utf-8"))
rows=[]
for rec in records:
    h=rec.get("yearly_draw_odds") or {}
    history={year:parse(h.get(year)) for year in YEARS}
    vals=[v for v in history.values() if v is not None]
    if len(vals)<5 or history["2025"] is None: continue
    code=str(rec.get("Code") or "").strip()
    if not code: continue
    med=statistics.median(vals)
    rows.append(dict(code=code,species=str(rec.get("Species") or ""),mu=str(rec.get("MU") or ""),
        area=str(rec.get("Area") or ""),klass=str(rec.get("Class") or ""),
        region=str(rec.get("MU_Name") or ""),latest=history["2025"],
        median=med,sd=statistics.pstdev(vals),years=len(vals),history=history))
if not rows: raise SystemExit("No LEH opportunities with at least five valid years and 2025 odds")
rows.sort(key=lambda r:(-r["latest"],-r["median"],r["code"]))
top=rows[:15]
stable=sorted(rows,key=lambda r:(r["sd"],-r["median"]))[:10]
esc=html.escape
def table(items):
    return "".join("<tr>"+ "".join("<td>"+esc(str(x))+"</td>" for x in
      (r["code"],r["species"],r["mu"],r["area"],f'{r["latest"]:.1f}%',
       f'{r["median"]:.1f}%',f'{r["sd"]:.1f}',r["years"]))+"</tr>" for r in items)
heads="<tr><th>Code</th><th>Species</th><th>MU</th><th>Area</th><th>2025</th><th>Historical median</th><th>Volatility (pp)</th><th>Years</th></tr>"
summary=f'{len(rows)} opportunities with at least five valid annual observations; 2025 median {statistics.median(r["latest"] for r in rows):.1f}%.'
article={"@context":"https://schema.org","@type":"Article","headline":"Easiest BC LEH Draws? Stability vs One-Year Odds",
"description":"Interactive comparison of BC Limited Entry Hunting draw success from 2016 to 2025.","datePublished":TODAY,"dateModified":TODAY,
"mainEntityOfPage":URL,"author":{"@id":"https://huntsmartcanada.ca/#organization"},"publisher":{"@id":"https://huntsmartcanada.ca/#organization"}}
dataset={"@context":"https://schema.org","@type":"Dataset","name":"HuntSmart BC LEH historical draw success, 2016–2025","url":URL,
"temporalCoverage":"2016/2025","description":"Secondary analysis of HuntSmart's compiled BC LEH draw dataset; values are historical outcomes, not forecasts."}
payload=json.dumps(rows,separators=(",",":"),ensure_ascii=False).replace("<","\\u003c")
page='''<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Easiest BC LEH Draws? Stability vs One-Year Odds | HuntSmart Journal</title>
<meta name="description" content="Compare BC LEH draw success across 2016–2025. Filter by species, region and class, inspect historical medians and volatility, and chart up to four hunt codes.">
<link rel="canonical" href="__URL__"><meta property="og:type" content="article"><meta property="og:title" content="Easiest BC LEH Draws? Stability vs One-Year Odds"><meta property="og:url" content="__URL__">
<link rel="stylesheet" href="/blog.css"><script type="application/ld+json">__ARTICLE__</script><script type="application/ld+json">__DATASET__</script>
<style>
.hs-study{max-width:1160px;margin:auto;padding:45px 22px 85px;color:#d7e0d9}.hs-study h1{font:700 clamp(35px,5vw,62px)/1.1 Georgia,serif;max-width:950px}.hs-study h2{font:700 30px Georgia,serif;margin:38px 0 14px}.hs-study p{line-height:1.75;color:#aebbb2;max-width:980px}.hs-panel{background:#101612;border:1px solid #2c3930;border-radius:14px;padding:20px;margin:24px 0}.hs-panel strong{color:#71dc90}.hs-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:20px 0}.hs-controls label{font-size:12px;color:#b9c8be}.hs-controls select{display:block;width:100%;background:#161d18;color:#e2eae4;border:1px solid #354338;border-radius:8px;padding:10px;margin-top:7px}.hs-scroll{overflow:auto}.hs-table{width:100%;min-width:850px;border-collapse:collapse;font-size:13px}.hs-table td,.hs-table th{padding:11px 9px;border-bottom:1px solid #29342c;text-align:left}.hs-table th{color:#9eafa3}.hs-table td{color:#d0dad3}.hs-chart{width:100%;min-width:700px;height:330px}.hs-note{font-size:13px}.hs-study a{color:#7de29c}.hs-legend{display:flex;flex-wrap:wrap;gap:9px;margin:12px 0}.hs-legend span{padding:6px 10px;border:1px solid #37453b;border-radius:20px;font-size:12px}.hs-study input{accent-color:#5ad982}@media(max-width:850px){.hs-controls{grid-template-columns:1fr 1fr}}@media(max-width:520px){.hs-controls{grid-template-columns:1fr}.hs-study{padding:25px 14px 65px}}
</style></head><body>
<header class="resource-nav"><a class="resource-brand" href="/"><strong>HuntSmart <span>Canada</span></strong><small>Data-backed hunting research</small></a><nav><a href="/">App Home</a><a class="active" href="/blog/">Journal</a><a href="/bc-hunting/">BC Hunting</a><a href="/methodology/">Methodology</a></nav><a class="resource-app-btn" href="/">Open HuntSmart</a></header>
<main class="hs-study"><div class="eyebrow">HuntSmart Journal · Interactive BC LEH research</div><h1>Easiest BC LEH Draws? Stability vs One-Year Odds</h1>
<p>Which hunts have historically been easier to draw, and which have been consistently easier? Compare finalized 2016–2025 outcomes by hunt code rather than trusting one unusually favourable year.</p>
<div class="hs-panel"><strong>What the data shows</strong><p>__SUMMARY__ The tables below rank recorded outcomes, not hunt quality or next year's probability. A higher historical success percentage does not guarantee an easier future draw.</p></div>
<h2>Why one-year odds are not enough</h2><p>A high 2025 success rate may reflect a temporary change in applications or available authorizations. The historical median gives a baseline; standard deviation (in percentage points) measures year-to-year variation. A low standard deviation alone does not mean easy odds: consistently difficult draws can also be stable.</p>
<section class="hs-panel"><h2>Interactive LEH draw explorer</h2><p>Filter by species, region and class. Select up to four opportunities to compare annual draw success. Missing years are gaps, not zero-percent draws.</p>
<div class="hs-controls"><label>Species<select id="species"><option value="">All species</option></select></label><label>Region grouping<select id="region"><option value="">All regions</option></select></label><label>Class<select id="klass"><option value="">All classes</option></select></label><label>Sort<select id="sort"><option value="latest">Highest 2025</option><option value="median">Highest historical median</option><option value="stable">Lowest volatility</option></select></label></div>
<div class="hs-scroll"><svg class="hs-chart" id="chart" viewBox="0 0 900 330" role="img" aria-label="LEH historical draw success by year"></svg></div><div class="hs-legend" id="legend"></div><div id="count" class="hs-note" aria-live="polite"></div>
<div class="hs-scroll"><table class="hs-table"><thead><tr><th>Compare</th>__HEADS_INNER__</tr></thead><tbody id="results"></tbody></table></div></section>
<h2>Highest 2025 draw success: data snapshot</h2><p>These are the highest 2025 percentages among hunt codes with at least five usable years in the source data. Compare their historical medians and volatility before interpreting them as relatively easy draws.</p><div class="hs-scroll"><table class="hs-table"><thead>__HEADS__</thead><tbody>__TOP__</tbody></table></div>
<h2>Lowest historical volatility: data snapshot</h2><p>These opportunities varied least across their available annual observations. Low volatility is a consistency measure, not an ease-of-draw ranking.</p><div class="hs-scroll"><table class="hs-table"><thead>__HEADS__</thead><tbody>__STABLE__</tbody></table></div>
<h2>Methodology and official sources</h2><p>HuntSmart's <code>draws.json</code> is the data source for this secondary analysis. Only opportunities with a valid 2025 percentage and at least five valid annual values from 2016–2025 are included. Empty, missing or invalid values are excluded rather than converted to zero. Medians use available years; volatility is the population standard deviation of available annual percentages. Historical outcomes are not forecasts. Hunt codes and regulations may change.</p>
<p>Confirm hunt details and legal requirements against the Province of British Columbia's <a href="https://www2.gov.bc.ca/gov/content/sports-culture/recreation/fishing-hunting/hunting/limited-entry-hunting">Limited Entry Hunting information</a>, <a href="https://www2.gov.bc.ca/gov/content/sports-culture/recreation/fishing-hunting/hunting/regulations-synopsis">current regulations synopsis</a> and <a href="https://www2.gov.bc.ca/gov/content/sports-culture/recreation/fishing-hunting/hunting/hunting-data">hunting data</a>.</p>
<p>Related: <a href="/bc-hunting/elk-leh-odds/">Elk LEH trends</a> · <a href="/bc-hunting/moose-leh-odds/">Moose LEH trends</a> · <a href="/blog/bc-leh-odds-guide/">LEH odds guide</a> · <a href="/methodology/">Data methodology</a>.</p>
</main><script id="research-data" type="application/json">__PAYLOAD__</script>
<script>
(()=>{'use strict';const rows=JSON.parse(document.getElementById('research-data').textContent),years=Array.from({length:10},(_,i)=>String(2016+i)),colors=['#63df8b','#e7b36a','#77b9ed','#dba4db'],selected=[];
const $=id=>document.getElementById(id),filters=['species','region','klass'];
for(const key of filters){const select=$(key);[...new Set(rows.map(r=>r[key]).filter(Boolean))].sort().forEach(value=>{const o=document.createElement('option');o.value=value;o.textContent=value;select.appendChild(o)});select.addEventListener('change',render)}$('sort').addEventListener('change',render);
function filtered(){let a=rows.filter(r=>filters.every(k=>!$(k).value||r[k]===$(k).value));const mode=$('sort').value;a.sort((x,y)=>mode==='stable'?x.sd-y.sd||y.median-x.median:mode==='median'?y.median-x.median:y.latest-x.latest);return a}
function cell(row,value){const td=document.createElement('td');td.textContent=String(value);row.appendChild(td)}
function render(){const a=filtered();$('count').textContent=a.length+' matching hunt codes; showing first 100.';const body=$('results');body.replaceChildren();for(const r of a.slice(0,100)){const tr=document.createElement('tr'),td=document.createElement('td'),box=document.createElement('input');box.type='checkbox';box.checked=selected.includes(r.code);box.setAttribute('aria-label','Compare hunt '+r.code);box.addEventListener('change',()=>{if(box.checked){if(selected.length>=4){box.checked=false;return}selected.push(r.code)}else{const i=selected.indexOf(r.code);if(i>=0)selected.splice(i,1)}draw()});td.appendChild(box);tr.appendChild(td);[r.code,r.species,r.mu,r.area,r.latest.toFixed(1)+'%',r.median.toFixed(1)+'%',r.sd.toFixed(1),r.years].forEach(v=>cell(tr,v));body.appendChild(tr)}draw()}
function draw(){const chosen=selected.map(code=>rows.find(r=>r.code===code)).filter(Boolean),svg=$('chart'),legend=$('legend');svg.replaceChildren();legend.replaceChildren();const NS='http://www.w3.org/2000/svg',add=(tag,attrs,txt)=>{const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));if(txt!==undefined)e.textContent=txt;svg.appendChild(e);return e};const vals=chosen.flatMap(r=>years.map(yr=>r.history[yr]).filter(v=>v!==null));const max=Math.max(1,...vals)*1.12,L=52,R=20,T=20,B=44,W=900,H=330,x=i=>L+i*(W-L-R)/9,y=v=>H-B-v*(H-T-B)/max;for(let i=0;i<=4;i++){const v=max*i/4,yy=y(v);add('line',{x1:L,y1:yy,x2:W-R,y2:yy,stroke:'#304037'});add('text',{x:L-7,y:yy+4,'text-anchor':'end',fill:'#a4b3a8','font-size':11},v.toFixed(0)+'%')}years.forEach((yr,i)=>add('text',{x:x(i),y:H-14,'text-anchor':'middle',fill:'#a4b3a8','font-size':11},yr));if(!chosen.length){add('text',{x:450,y:155,'text-anchor':'middle',fill:'#b3c0b5'},'Select hunt codes below to compare trends');return}
chosen.forEach((r,j)=>{let segment=[];const flush=()=>{if(segment.length>1)add('polyline',{points:segment.join(' '),fill:'none',stroke:colors[j], 'stroke-width':3});segment=[]};years.forEach((yr,i)=>{const v=r.history[yr];if(v===null){flush();return}segment.push(x(i)+','+y(v));add('circle',{cx:x(i),cy:y(v),r:3,fill:colors[j]})});flush();const badge=document.createElement('span');badge.textContent=r.code+' · '+r.species;badge.style.borderColor=colors[j];legend.appendChild(badge)})}
selected.push(...rows.slice(0,3).map(r=>r.code));render();
})();
</script></body></html>'''
page=page.replace("__URL__",URL).replace("__ARTICLE__",json.dumps(article)).replace("__DATASET__",json.dumps(dataset)).replace("__SUMMARY__",esc(summary)).replace("__HEADS__",heads).replace("__HEADS_INNER__",heads.replace("<tr>","").replace("</tr>","")).replace("__TOP__",table(top)).replace("__STABLE__",table(stable)).replace("__PAYLOAD__",payload)
target=ROOT/SLUG/"index.html";target.parent.mkdir(parents=True,exist_ok=True);target.write_text(page,encoding="utf-8")
journal=ROOT/"blog/index.html"
text=journal.read_text(encoding="utf-8")
if SLUG not in text:
    card='<a class="article-card" data-category="data bc" data-search="easiest bc leh draws stable historical odds volatility" href="/'+SLUG+'/"><div class="article-card-body"><div class="article-kicker">BC LEH · Interactive Research</div><h3>Easiest BC LEH Draws? Stability vs One-Year Odds</h3><p>Compare ten years of draw success, historical medians and volatility with species and region filters.</p><div class="article-byline-compact"><span>Nov 3, 2026</span><span>HuntSmart Canada</span></div><div class="article-meta"><span>Interactive analysis</span><span>2016–2025</span></div><div class="article-cta">Explore the data →</div></div></a>'
    if '<div class="article-grid" id="blogGrid">' not in text: raise SystemExit("Journal card insertion point missing")
    text=text.replace('<div class="article-grid" id="blogGrid">','<div class="article-grid" id="blogGrid">'+card,1)
    journal.write_text(text,encoding="utf-8")
sitemap=ROOT/"sitemap.xml"
xml=sitemap.read_text(encoding="utf-8")
if URL not in xml:
    xml=xml.replace("</urlset>",f'<url><loc>{URL}</loc><lastmod>{TODAY}</lastmod></url></urlset>')
    sitemap.write_text(xml,encoding="utf-8")
assert URL in sitemap.read_text(encoding="utf-8")
assert SLUG in journal.read_text(encoding="utf-8")
assert "<polyline" in page and "research-data" in page and "Dataset" in page
print(f"Built {SLUG}: {len(rows)} real opportunities; Journal card and sitemap verified")
