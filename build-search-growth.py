from pathlib import Path
import json

SITE = Path('site')
BASE = 'https://huntsmartcanada.ca'
TODAY = '2026-10-27'

OFFICIAL = {
    'leh': 'https://www2.gov.bc.ca/gov/content/sports-culture/recreation/fishing-hunting/hunting/limited-entry-hunting',
    'regs': 'https://www2.gov.bc.ca/gov/content/sports-culture/recreation/fishing-hunting/hunting/regulations-synopsis',
    'data': 'https://www2.gov.bc.ca/gov/content/sports-culture/recreation/fishing-hunting/hunting/hunting-data',
}


def write(path, text):
    p = SITE / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding='utf-8')


def schema(data):
    return '<script type="application/ld+json">' + json.dumps(data, separators=(',', ':'), ensure_ascii=False) + '</script>'


def render(slug, title, description, answer, sections, related):
    canonical = f'{BASE}/{slug.strip("/")}/'
    faq = []
    body = []
    for heading, text in sections:
        body.append(f'<section><h2>{heading}</h2>{text}</section>')
        if heading.endswith('?'):
            faq.append({'@type':'Question','name':heading,'acceptedAnswer':{'@type':'Answer','text':text.replace('<p>','').replace('</p>','')}})
    faq_schema = schema({'@context':'https://schema.org','@type':'FAQPage','mainEntity':faq}) if faq else ''
    article_schema = schema({'@context':'https://schema.org','@type':'Article','headline':title,'description':description,'mainEntityOfPage':canonical,'dateModified':TODAY,'author':{'@id':f'{BASE}/#organization'},'publisher':{'@id':f'{BASE}/#organization'}})
    crumbs = schema({'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[
        {'@type':'ListItem','position':1,'name':'HuntSmart Canada','item':BASE+'/'},
        {'@type':'ListItem','position':2,'name':'BC Hunting','item':BASE+'/bc-hunting/'},
        {'@type':'ListItem','position':3,'name':title,'item':canonical},
    ]})
    related_html = ''.join(f'<a href="{href}">{label}</a>' for label, href in related)
    html = f'''<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>{title} | HuntSmart Canada</title><meta name="description" content="{description}"><link rel="canonical" href="{canonical}"><meta property="og:type" content="article"><meta property="og:title" content="{title} | HuntSmart Canada"><meta property="og:description" content="{description}"><meta property="og:url" content="{canonical}"><link rel="stylesheet" href="/blog.css?v=20261027growth">{article_schema}{crumbs}{faq_schema}<style>.answer-box{{padding:18px 20px;border:1px solid rgba(40,70,48,.18);border-radius:14px;background:rgba(245,248,244,.95);margin-bottom:26px}}.answer-box strong{{display:block;margin-bottom:6px}}.article-body section{{margin-bottom:30px}}.query-links{{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}}.query-links a{{display:block;padding:14px;border:1px solid rgba(40,70,48,.16);border-radius:12px;text-decoration:none}}</style></head><body><header class="resource-nav"><a class="resource-brand" href="/"><strong>HuntSmart <span>Canada</span></strong><small>Data-backed hunting research</small></a><nav><a href="/">App Home</a><a href="/blog/">Resources</a><a class="active" href="/bc-hunting/">BC Hunting</a><a href="/bc-hunting/questions/">Research Questions</a></nav><a class="resource-app-btn" href="/">Open HuntSmart</a></header><main class="article-shell"><header class="article-header"><div class="eyebrow">BC Hunting Research</div><h1>{title}</h1><p class="dek">{description}</p><div class="article-byline"><span>HuntSmart Canada</span><span>Updated Oct 27, 2026</span><span>Official sources linked below</span></div></header><div class="article-layout"><article class="article-body"><div class="answer-box"><strong>Short answer</strong><p>{answer}</p></div>{''.join(body)}<section><h2>Sources and verification</h2><p>HuntSmart uses public provincial hunting information as the legal reference point and adds research structure, historical context and comparison tools. Verify final hunting decisions with the current <a href="{OFFICIAL['regs']}">B.C. Hunting and Trapping Regulations Synopsis</a>, <a href="{OFFICIAL['leh']}">Limited Entry Hunting information</a> and <a href="{OFFICIAL['data']}">provincial hunting data</a>.</p></section><div class="article-bottom-cta"><div><h3>Compare the real opportunities</h3><p>Open HuntSmart for filters, maps and historical draw context.</p></div><a href="/">Open HuntSmart →</a></div></article><aside class="article-rail"><div class="rail-card"><h3>Related research</h3><div class="rail-links">{related_html}</div></div><div class="rail-card"><h3>Methodology</h3><p>Historical statistics describe past outcomes; they do not guarantee future draw results.</p><a href="/methodology/">Read methodology →</a></div></aside></div></main></body></html>'''
    write(f'{slug.strip("/")}/index.html', html)


PAGES = [
('bc-hunting/moose-leh-odds','BC Moose LEH Odds: How to Research the Draw','How to research B.C. moose Limited Entry Hunting odds using historical draw data, hunt codes, regions and current rules.','There is no single “B.C. moose LEH odds” number. Each moose opportunity has its own hunt code, area, season, authorizations and historical demand, so odds should be compared hunt by hunt.',[
('Why do moose LEH odds vary so much?','<p>Demand, authorization numbers, season timing, animal class and location differ by hunt. Two moose opportunities in the same region can have very different historical draw success.</p>'),
('What should I compare?','<p>Compare the latest finalized draw result with several previous years, then add access, season timing, harvest context and whether you can realistically hunt the area.</p>'),
('What year does HuntSmart use for current actual odds?','<p>HuntSmart’s B.C. draw code uses finalized actual draw success through 2025 where that data is available, while preserving earlier years for trend context.</p>')], [('BC Moose guide','/bc-hunting/moose/'),('How BC LEH works','/blog/how-does-bc-leh-work/'),('LEH odds guide','/blog/bc-leh-odds-guide/')]),
('bc-hunting/elk-leh-odds','BC Elk LEH Odds: How to Compare Draw Opportunities','How to research B.C. elk LEH odds by hunt code, management unit, season and historical draw trend.','Elk LEH odds must be evaluated by the exact opportunity rather than by species alone. Hunt codes can represent different areas, seasons and classes of animal with very different historical draw outcomes.',[
('How should I compare elk draws?','<p>Start with the exact hunt code, then compare multiple years rather than one percentage. A one-year spike or drop can be misleading if demand or authorizations changed.</p>'),
('Do draw odds tell me which hunt is best?','<p>No. Draw probability is only one factor. Access, season dates, terrain, travel and the type of elk opportunity also matter.</p>')], [('BC Elk guide','/bc-hunting/elk/'),('LEH odds guide','/blog/bc-leh-odds-guide/'),('BC Hunting guide','/bc-hunting/')]),
('bc-hunting/easiest-leh-draws','How to Find the Easiest BC LEH Draws','A data-first method for finding relatively easier B.C. LEH opportunities without treating one year of odds as a guarantee.','The easiest LEH draw depends on species, hunt code and year. A better method than sorting one percentage is to filter to hunts you can realistically do, compare several years of actual draw success, and check whether authorizations or demand are volatile.',[
('Is the highest percentage automatically the best application?','<p>No. Easier historical odds can come with trade-offs in access, season timing, hunt quality or travel. The best application balances probability with the value of the opportunity to you.</p>'),
('Why use multiple years?','<p>Applicant demand and authorization counts change. A multi-year view helps distinguish a stable opportunity from a single unusual year.</p>')], [('LEH odds guide','/blog/bc-leh-odds-guide/'),('How BC LEH works','/blog/how-does-bc-leh-work/'),('Moose LEH odds','/bc-hunting/moose-leh-odds/')]),
('bc-hunting/leh-results-and-odds','BC LEH Results and Draw Odds Explained','Understand the difference between B.C. LEH results, historical draw odds and the next draw, and how HuntSmart uses finalized data.','LEH results tell you what happened in a completed draw. Historical odds summarize past draw success for specific opportunities; they are useful context, not a forecast of what the next draw will produce.',[
('Are last year’s odds the same as this year’s odds?','<p>No. Applicant demand, authorizations and rules can change between draws.</p>'),
('How does HuntSmart use LEH results?','<p>HuntSmart organizes finalized draw information by opportunity so hunters can compare current actual odds with historical patterns instead of reading isolated annual tables.</p>')], [('How BC LEH works','/blog/how-does-bc-leh-work/'),('LEH odds guide','/blog/bc-leh-odds-guide/'),('Easiest LEH draws','/bc-hunting/easiest-leh-draws/')]),
('bc-hunting/what-is-a-hunt-code','What Is a BC LEH Hunt Code?','A plain-language explanation of B.C. Limited Entry Hunting hunt codes and why the exact code matters when researching draw odds.','A hunt code identifies a specific LEH opportunity. It is more precise than saying “Region 3 moose” or “B.C. elk” because the code ties the application to a defined opportunity with its own area, season and conditions.',[
('Why does the code matter for odds?','<p>Historical draw results are attached to specific opportunities. Comparing the wrong code can mean comparing a different season, area or class of animal.</p>')], [('How BC LEH works','/blog/how-does-bc-leh-work/'),('LEH results and odds','/bc-hunting/leh-results-and-odds/'),('Regions & WMUs','/bc-hunting/regions-and-wmus/')]),
('bc-hunting/hunt-elk-without-leh','Can You Hunt Elk in BC Without LEH?','How to research B.C. elk General Open Season opportunities and determine when an LEH authorization is required.','Some B.C. elk opportunities can be available under General Open Season rules while others require LEH. The answer depends on the exact region, management unit, season and animal class, so it cannot be answered safely with a province-wide yes or no.',[
('How do I check?','<p>Identify the management unit and dates, read the current open-season table and footnotes, then verify whether the opportunity is GOS or LEH and whether special-area rules apply.</p>')], [('BC Elk guide','/bc-hunting/elk/'),('General Open Season','/bc-hunting/general-open-season/'),('LEH vs GOS','/bc-hunting/leh-vs-gos/')]),
('bc-hunting/hunt-moose-without-leh','Can You Hunt Moose in BC Without LEH?','How to research whether a B.C. moose opportunity is General Open Season or requires Limited Entry Hunting.','B.C. moose opportunities are not governed by one province-wide rule. Whether you can hunt without LEH depends on the exact management unit, season, animal class and current regulations.',[
('What should I verify first?','<p>Start with the current management unit and season table, then check animal class, dates, licence requirements, closures and any special-area rules.</p>')], [('BC Moose guide','/bc-hunting/moose/'),('General Open Season','/bc-hunting/general-open-season/'),('LEH vs GOS','/bc-hunting/leh-vs-gos/')]),
('bc-hunting/mule-deer-general-open-season','BC Mule Deer General Open Season Research Guide','How to research B.C. mule deer General Open Seasons by region, management unit, dates, animal class and current provincial rules.','Mule deer hunting rules vary by region, management unit, dates and animal class. Research the exact area rather than relying on a province-wide season summary, and verify the current open-season table before hunting.',[
('Why are management units important?','<p>Season dates and restrictions can change across management-unit boundaries, so the correct MU is the foundation of any mule deer season check.</p>')], [('General Open Season','/bc-hunting/general-open-season/'),('Regions & WMUs','/bc-hunting/regions-and-wmus/'),('BC Hunting guide','/bc-hunting/')]),
('bc-hunting/read-bc-hunting-regulations','How to Read the BC Hunting Regulations Synopsis','A practical workflow for reading B.C. hunting season tables, management units, dates, animal classes, footnotes and special-area rules.','Start with species and management unit, then read the exact season row and every applicable footnote or mapped special area. Do not treat a date range by itself as the complete legal rule.',[
('What should I check in order?','<p>Species, management unit, season dates, animal class, licence or authorization, bag limit, footnotes, mapped special areas, closures and any other applicable legal restrictions.</p>')], [('BC Hunting guide','/bc-hunting/'),('Regions & WMUs','/bc-hunting/regions-and-wmus/'),('General Open Season','/bc-hunting/general-open-season/')]),
('bc-hunting/leh-data-explorer','BC LEH Historical Data Explorer: What the Numbers Mean','How HuntSmart organizes B.C. LEH actual draw success, multi-year trends and historical context for specific hunt opportunities.','HuntSmart treats historical LEH data as descriptive evidence. The useful unit is the specific hunt opportunity: actual draw success by year, viewed alongside the area, season, animal class and other hunt context.',[
('What data does HuntSmart expose?','<p>HuntSmart’s B.C. draw records include hunt identifiers, species, management-unit context, season, class, tag context and historical yearly draw-odds fields. Current app logic prefers finalized 2025 actual draw success when available and retains earlier years for trend charts.</p>'),
('Why is this better than one odds number?','<p>A time series shows whether an opportunity has been stable, improving, worsening or unusually volatile. That makes it more useful for research than one isolated percentage.</p>')], [('LEH odds guide','/blog/bc-leh-odds-guide/'),('LEH results and odds','/bc-hunting/leh-results-and-odds/'),('Easiest LEH draws','/bc-hunting/easiest-leh-draws/')]),
]

for args in PAGES:
    render(*args)

question_links = ''.join(f'<a href="/{slug}/"><strong>{title}</strong><span>{description}</span></a>' for slug,title,description,*_ in PAGES)
write('bc-hunting/questions/index.html', f'''<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BC Hunting Research Questions | HuntSmart Canada</title><meta name="description" content="Direct answers to common B.C. hunting research questions about LEH odds, General Open Seasons, hunt codes, moose, elk and regulations."><link rel="canonical" href="{BASE}/bc-hunting/questions/"><link rel="stylesheet" href="/blog.css?v=20261027growth"><style>.question-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}}.question-grid a{{display:block;padding:18px;border:1px solid rgba(40,70,48,.16);border-radius:14px;text-decoration:none;color:inherit}}.question-grid strong,.question-grid span{{display:block}}.question-grid span{{margin-top:6px;color:#5c625e}}</style></head><body><header class="resource-nav"><a class="resource-brand" href="/"><strong>HuntSmart <span>Canada</span></strong></a><nav><a href="/bc-hunting/">BC Hunting</a><a href="/blog/">Resources</a></nav></header><main class="article-shell"><header class="article-header"><div class="eyebrow">Answer Library</div><h1>BC Hunting Research Questions</h1><p class="dek">Direct, crawlable answers to the questions hunters ask Google, ChatGPT and other research tools.</p></header><article class="article-body"><div class="question-grid">{question_links}</div></article></main></body></html>''')

# Add one-click discovery links to the main BC Hunting hub and Resources index.
for rel in ['bc-hunting/index.html','blog/index.html','index.html']:
    p = SITE / rel
    if not p.exists():
        continue
    text = p.read_text(encoding='utf-8')
    marker = '</footer>' if '</footer>' in text else '</body>'
    if '/bc-hunting/questions/' not in text:
        nav = '<nav aria-label="BC hunting answer library" style="text-align:center;padding:14px 20px"><a href="/bc-hunting/questions/">BC Hunting Research Questions</a> · <a href="/bc-hunting/leh-data-explorer/">LEH Historical Data Explorer</a> · <a href="/bc-hunting/moose-leh-odds/">Moose LEH Odds</a> · <a href="/bc-hunting/elk-leh-odds/">Elk LEH Odds</a></nav>'
        text = text.replace(marker, nav + marker, 1)
        p.write_text(text, encoding='utf-8')

# Expand sitemap without discarding the first SEO/AEO layer.
sitemap = SITE / 'sitemap.xml'
text = sitemap.read_text(encoding='utf-8')
insert = []
for slug,title,description,*_ in PAGES:
    url = f'{BASE}/{slug}/'
    if url not in text:
        insert.append(f'  <url>\n    <loc>{url}</loc>\n    <lastmod>{TODAY}</lastmod>\n  </url>')
qurl = f'{BASE}/bc-hunting/questions/'
if qurl not in text:
    insert.append(f'  <url>\n    <loc>{qurl}</loc>\n    <lastmod>{TODAY}</lastmod>\n  </url>')
if insert:
    text = text.replace('</urlset>', '\n'.join(insert) + '\n</urlset>')
    sitemap.write_text(text, encoding='utf-8')

# Citation/backlink target page: gives writers, clubs and creators a stable page to link to.
write('research/index.html', f'''<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HuntSmart Canada Research & Data Sources</title><meta name="description" content="Stable citation links for HuntSmart Canada B.C. hunting research, LEH methodology and public data resources."><link rel="canonical" href="{BASE}/research/"><link rel="stylesheet" href="/blog.css?v=20261027growth"></head><body><main class="article-shell"><header class="article-header"><div class="eyebrow">Research & citations</div><h1>HuntSmart Canada Research & Data Sources</h1><p class="dek">Stable pages for writers, hunting clubs, creators and researchers who want to reference HuntSmart’s B.C. hunting analysis.</p></header><article class="article-body"><h2>Recommended citation targets</h2><ul><li><a href="/bc-hunting/leh-data-explorer/">BC LEH Historical Data Explorer</a></li><li><a href="/blog/how-does-bc-leh-work/">How Does BC LEH Work?</a></li><li><a href="/bc-hunting/general-open-season/">BC General Open Season Guide</a></li><li><a href="/methodology/">Data Sources & Methodology</a></li></ul><h2>Source transparency</h2><p>HuntSmart distinguishes official provincial rules from HuntSmart analysis and links readers back to the Province of British Columbia for current legal requirements.</p></article></main></body></html>''')

text = sitemap.read_text(encoding='utf-8')
if f'{BASE}/research/' not in text:
    text = text.replace('</urlset>', f'  <url>\n    <loc>{BASE}/research/</loc>\n    <lastmod>{TODAY}</lastmod>\n  </url>\n</urlset>')
    sitemap.write_text(text, encoding='utf-8')

assert (SITE/'bc-hunting/questions/index.html').exists()
assert (SITE/'bc-hunting/moose-leh-odds/index.html').exists()
assert (SITE/'bc-hunting/leh-data-explorer/index.html').exists()
assert '/bc-hunting/questions/' in (SITE/'sitemap.xml').read_text(encoding='utf-8')
print('Search-growth post-build complete: query pages, answer library, data explorer, crawl links and citation target verified.')