from pathlib import Path
import json,re,html
from datetime import date
source=Path('bc-open-seasons.js').read_text(encoding='utf-8')
match=re.search(r'const BC_OS_DATA_RAW = (\[[\s\S]*?\]);',source)
if not match: raise SystemExit('GOS source array missing')
all_rows=json.loads(match.group(1))
if not all_rows: raise SystemExit('GOS dataset empty')
rows=[r for r in all_rows if 'Mule Deer' in str(r.get('species',''))]
if not rows: raise SystemExit('Mule deer GOS rows missing')
slug='blog/bc-general-open-season-explorer'
url='https://huntsmartcanada.ca/'+slug+'/'
out=Path('site')/slug/'index.html'
out.parent.mkdir(parents=True,exist_ok=True)
regions=sorted({(str(r['region']),str(r['region_name'])) for r in rows})
esc=html.escape
def tr(r):
    return '<tr>'+''.join('<td>'+esc(str(r.get(k,'') or '—'))+'</td>' for k in ('region_name','management_units','class','weapon_type','season_text','bag_limit'))+'</tr>'
headers='<tr><th>Region</th><th>WMUs</th><th>Class</th><th>Method</th><th>Season</th><th>Bag limit</th></tr>'
body=''.join(tr(r) for r in rows)
summary=''.join('<li><strong>Region '+esc(k)+'</strong> ('+esc(name)+'): '+str(sum(str(r['region'])==k for r in rows))+' listed mule deer season entries.</li>' for k,name in regions)
data=json.dumps(rows,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
today=date.today().isoformat()
article={'@context':'https://schema.org','@type':'Article','headline':'BC General Open Season Explorer: Mule Deer Without an LEH Draw','datePublished':today,'dateModified':today,'mainEntityOfPage':url,'publisher':{'@id':'https://huntsmartcanada.ca/#organization'}}
dataset={'@context':'https://schema.org','@type':'Dataset','name':'HuntSmart BC general open seasons — mule deer','description':'Mule deer season entries extracted from the HuntSmart GOS map dataset. Not a legal regulations source.','url':url}
page='''<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>BC General Open Season Explorer: Mule Deer Without a Draw | HuntSmart Journal</title><meta name="description" content="Explore BC mule deer general open seasons by region, management unit, class, and method. Open the HuntSmart GOS map to inspect WMUs.">
<link rel="canonical" href="__URL__"><link rel="stylesheet" href="/blog.css">
<script type="application/ld+json">__ARTICLE__</script><script type="application/ld+json">__DATASET__</script>
<style>.gos-journal{max-width:1160px;margin:auto;padding:48px 22px 90px;color:#dce6de}.gos-journal h1{font:700 clamp(36px,5vw,62px)/1.08 Georgia,serif;max-width:970px}.gos-journal h2{font:700 30px Georgia,serif;margin:38px 0 14px}.gos-journal p,.gos-journal li{line-height:1.75;color:#b8c5bc}.gos-journal a{color:#80e7a0}.gos-card{border:1px solid #304438;background:#101a14;padding:22px;border-radius:14px;margin:24px 0}.gos-cta{display:inline-block;padding:13px 18px;background:#225e37;color:#fff!important;border-radius:9px;font-weight:700;text-decoration:none}.gos-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.gos-controls label{font-size:12px;color:#b8c5bc}.gos-controls select,.gos-controls input{display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:12px;background:#18241c;color:#f1f6f2;border:1px solid #36513e;border-radius:8px}.gos-scroll{overflow:auto}.gos-table{width:100%;min-width:780px;border-collapse:collapse}.gos-table th,.gos-table td{padding:10px;border-bottom:1px solid #304036;text-align:left;font-size:13px}.gos-table th{color:#a1b6a6}.gos-table td{color:#d2ded4}@media(max-width:700px){.gos-controls{grid-template-columns:1fr}.gos-journal{padding:28px 14px}}</style></head><body>
<header class="resource-nav"><a class="resource-brand" href="/"><strong>HuntSmart <span>Canada</span></strong><small>Data-backed hunting research</small></a><nav><a href="/">App Home</a><a class="active" href="/blog/">Journal</a><a href="/bc-hunting/">BC Hunting</a></nav><a class="resource-app-btn" href="/">Open HuntSmart</a></header>
<main class="gos-journal"><div class="eyebrow">HuntSmart Journal · BC General Open Seasons</div>
<h1>BC Mule Deer Hunting: Where Can You Hunt Without Winning a Draw?</h1>
<p>Many British Columbia mule deer opportunities are governed by general open seasons rather than a Limited Entry Hunting draw. The key is checking the exact management unit, dates, legal animal class, method, and applicable regional restrictions before heading out.</p>
<div class="gos-card"><h2>Explore the actual HuntSmart GOS map</h2><p>The existing HuntSmart General Open Seasons map is the authoritative interface for this article's spatial exploration. Open the app, select <strong>BC General Open Seasons</strong>, then choose <strong>Mule Deer (Black-tailed)</strong> and select a region or WMU. The article's filterable table below uses the same embedded season dataset; it does not substitute a second, potentially inconsistent map.</p><a class="gos-cta" href="/">Open the HuntSmart GOS map →</a></div>
<h2>Where the source data lists mule deer seasons</h2><p>The following are counts of season entries, <em>not</em> numbers of unique WMUs or a measure of deer abundance. A WMU may have separate entries for method, class, and dates.</p><ul>__SUMMARY__</ul>
<h2>Interactive mule deer season explorer</h2><p>Filter by region, legal class and management unit text. For exact boundary inspection, use the GOS map above. Entries are source records, not a guarantee that a particular animal is legal to harvest.</p>
<div class="gos-card"><div class="gos-controls"><label>Region<select id="region"><option value="">All regions</option></select></label><label>Class<select id="klass"><option value="">All classes</option></select></label><label>WMU or method<input id="search" placeholder="e.g. 3-17 or Bow" type="search"></label></div><p id="count" aria-live="polite"></p><div class="gos-scroll"><table class="gos-table"><thead>__HEADS__</thead><tbody id="results"></tbody></table></div></div>
<h2>Full source-data snapshot</h2><p>This crawlable table includes every mule deer season entry present in HuntSmart's current GOS dataset when this page was built. The interactive table above offers narrower filtering.</p><div class="gos-scroll"><table class="gos-table"><thead>__HEADS__</thead><tbody>__BODY__</tbody></table></div>
<h2>How to use the map for a real hunting plan</h2><p>Start by selecting a region and WMU on the HuntSmart GOS map. Check whether the season is for bucks, antlerless animals, youth, archery, or another restricted method. Compare dates against your travel plans and review regional bag limits and compulsory inspection requirements separately. The general open season label alone is not enough to establish legal eligibility.</p>
<h2>Sources and methodology</h2><p>All season entries above are extracted directly from the <code>BC_OS_DATA_RAW</code> dataset in HuntSmart's <code>bc-open-seasons.js</code>, which powers its GOS map. The records are filtered for <code>Mule Deer</code>; no dates, WMUs, classes or bag limits were inferred. This is a secondary planning aid, not legal advice. Confirm current rules in the Province of British Columbia's <a href="https://www2.gov.bc.ca/gov/content/sports-culture/recreation/fishing-hunting/hunting/regulations-synopsis">Hunting Regulations Synopsis</a> and <a href="https://www2.gov.bc.ca/gov/content/sports-culture/recreation/fishing-hunting/hunting/limited-entry-hunting">LEH information</a>. Related research: <a href="/bc-hunting/elk-leh-odds/">elk draw trends</a>, <a href="/bc-hunting/moose-leh-odds/">moose draw trends</a>, and <a href="/blog/">the HuntSmart Journal</a>.</p></main>
<script id="gos-data" type="application/json">__DATA__</script><script>(()=>{const rows=JSON.parse(document.getElementById('gos-data').textContent);const $=id=>document.getElementById(id);for(const [key,field] of [['region','region_name'],['klass','class']]){const el=$(key);[...new Set(rows.map(r=>String(r[field]||'')).filter(Boolean))].sort().forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;el.appendChild(o)});el.addEventListener('change',render)}$('search').addEventListener('input',render);function render(){const region=$('region').value,klass=$('klass').value,q=$('search').value.toLowerCase().trim();const filtered=rows.filter(r=>(!region||r.region_name===region)&&(!klass||r.class===klass)&&(!q||[r.management_units,r.weapon_type,r.season_text].some(v=>String(v||'').toLowerCase().includes(q))));$('count').textContent=filtered.length+' matching season entries';const body=$('results');body.replaceChildren();for(const r of filtered){const tr=document.createElement('tr');for(const k of ['region_name','management_units','class','weapon_type','season_text','bag_limit']){const td=document.createElement('td');td.textContent=r[k]||'—';tr.appendChild(td)}body.appendChild(tr)}}render()})();</script></body></html>'''
page=page.replace('__URL__',url).replace('__ARTICLE__',json.dumps(article)).replace('__DATASET__',json.dumps(dataset)).replace('__SUMMARY__',summary).replace('__HEADS__',headers).replace('__BODY__',body).replace('__DATA__',data)
out.write_text(page,encoding='utf-8')
journal=Path('site/blog/index.html')
j=journal.read_text(encoding='utf-8')
if slug not in j:
    needle='<div class="article-grid" id="blogGrid">'
    if needle not in j: raise SystemExit('Journal insertion point missing')
    card='<a class="article-card" data-category="data bc" data-search="mule deer general open season GOS map WMU" href="/'+slug+'/"><div class="article-card-body"><div class="article-kicker">BC GOS · Interactive Research</div><h3>BC Mule Deer: Where Can You Hunt Without a Draw?</h3><p>Explore the existing GOS map and filter real season entries by region, WMU and class.</p><div class="article-byline-compact"><span>'+today+'</span><span>HuntSmart Canada</span></div><div class="article-meta"><span>Interactive explorer</span><span>GOS map</span></div><div class="article-cta">Explore seasons →</div></div></a>'
    journal.write_text(j.replace(needle,needle+card,1),encoding='utf-8')
sitemap=Path('site/sitemap.xml')
xml=sitemap.read_text(encoding='utf-8')
if url not in xml:
    if '</urlset>' not in xml: raise SystemExit('Sitemap insertion point missing')
    sitemap.write_text(xml.replace('</urlset>','<url><loc>'+url+'</loc><lastmod>'+today+'</lastmod></url></urlset>'),encoding='utf-8')
assert url in sitemap.read_text(encoding='utf-8') and slug in journal.read_text(encoding='utf-8')
print('Built GOS mule deer article with',len(rows),'source rows across',len(regions),'regions')
