from pathlib import Path
import html
import json

SITE = Path('site')
BASE = 'https://huntsmartcanada.ca'
TODAY = '2026-10-27'

OFFICIAL = {
    'leh': 'https://www2.gov.bc.ca/gov/content/sports-culture/recreation/fishing-hunting/hunting/limited-entry-hunting',
    'regs': 'https://www2.gov.bc.ca/gov/content/sports-culture/recreation/fishing-hunting/hunting/regulations-synopsis',
    'data': 'https://www2.gov.bc.ca/gov/content/sports-culture/recreation/fishing-hunting/hunting/hunting-data',
}

ORG = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': f'{BASE}/#organization',
    'name': 'HuntSmart Canada',
    'url': f'{BASE}/',
    'logo': f'{BASE}/images/logo.png',
    'description': 'Data-backed research and decision tools for British Columbia and Alberta hunters.'
}


def write(path, text):
    target = SITE / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding='utf-8')


def jsonld(data):
    return '<script type="application/ld+json">' + json.dumps(data, separators=(',', ':'), ensure_ascii=False) + '</script>'


def breadcrumb(items):
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {'@type': 'ListItem', 'position': i + 1, 'name': name, 'item': url}
            for i, (name, url) in enumerate(items)
        ]
    }


def page_schema(title, canonical, description, kind='WebPage'):
    return {
        '@context': 'https://schema.org',
        '@type': kind,
        'name': title,
        'headline': title,
        'url': canonical,
        'mainEntityOfPage': canonical,
        'description': description,
        'dateModified': TODAY,
        'publisher': {'@id': f'{BASE}/#organization'},
        'author': {'@id': f'{BASE}/#organization'},
    }


def source_block(extra=''):
    return f'''<section class="rail-card" id="sources-methodology">
<h2>Sources &amp; methodology</h2>
<p>HuntSmart organizes and analyzes public hunting information to make opportunities easier to compare. It is a decision-support tool, not a substitute for the current law or official synopsis.</p>
<ul>
<li><a href="{OFFICIAL['regs']}" rel="external">B.C. Hunting and Trapping Regulations Synopsis</a></li>
<li><a href="{OFFICIAL['leh']}" rel="external">B.C. Limited Entry Hunting</a></li>
<li><a href="{OFFICIAL['data']}" rel="external">B.C. hunting data and LEH draw reports</a></li>
</ul>
{extra}
<p><strong>Last reviewed:</strong> October 27, 2026. Always verify current seasons, eligibility, boundaries, closures and legal requirements with the Province of British Columbia before hunting.</p>
</section>'''


def render_page(slug, title, description, eyebrow, intro, sections, related, sources_extra='', kind='Article'):
    canonical = f'{BASE}/{slug.strip("/")}/'
    body_sections = ''.join(f'<section><h2>{heading}</h2>{body}</section>' for heading, body in sections)
    related_html = ''.join(f'<a href="{href}">{label}</a>' for label, href in related)
    schema = page_schema(title, canonical, description, kind)
    crumbs = breadcrumb([
        ('HuntSmart Canada', f'{BASE}/'),
        ('BC Hunting', f'{BASE}/bc-hunting/'),
        (title, canonical),
    ]) if slug.strip('/') != 'bc-hunting' else breadcrumb([
        ('HuntSmart Canada', f'{BASE}/'),
        ('BC Hunting', canonical),
    ])
    document = f'''<!doctype html>
<html lang="en-CA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{html.escape(title)} | HuntSmart Canada</title>
<meta name="description" content="{html.escape(description, quote=True)}">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="article">
<meta property="og:title" content="{html.escape(title, quote=True)} | HuntSmart Canada">
<meta property="og:description" content="{html.escape(description, quote=True)}">
<meta property="og:url" content="{canonical}">
<meta property="og:site_name" content="HuntSmart Canada">
<link rel="stylesheet" href="/blog.css?v=20261027seo">
{jsonld(ORG)}
{jsonld(schema)}
{jsonld(crumbs)}
<style>
.answer-box{{padding:18px 20px;border:1px solid rgba(40,70,48,.18);border-radius:14px;background:rgba(245,248,244,.92);margin:0 0 26px}}
.answer-box strong{{display:block;margin-bottom:6px}}
.topic-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin:20px 0 28px}}
.topic-card{{display:block;padding:18px;border:1px solid rgba(40,70,48,.16);border-radius:14px;text-decoration:none;color:inherit;background:#fff}}
.topic-card strong{{display:block;margin-bottom:6px}}
.article-body section{{margin-bottom:30px}}
.article-body h2{{scroll-margin-top:90px}}
.article-body table{{width:100%;border-collapse:collapse;margin:16px 0 24px;font-size:.95rem}}
.article-body th,.article-body td{{border-bottom:1px solid rgba(0,0,0,.12);padding:10px;text-align:left;vertical-align:top}}
</style>
</head>
<body>
<header class="resource-nav"><a class="resource-brand" href="/"><strong>HuntSmart <span>Canada</span></strong><small>Data-backed hunting research</small></a><nav aria-label="Resource navigation"><a href="/">App Home</a><a href="/blog/">Resources</a><a class="active" href="/bc-hunting/">BC Hunting</a><a href="/methodology/">Methodology</a></nav><a class="resource-app-btn" href="/">Open HuntSmart</a></header>
<main class="article-shell">
<header class="article-header"><div class="eyebrow">{eyebrow}</div><h1>{title}</h1><p class="dek">{description}</p><div class="article-byline"><span>HuntSmart Canada</span><span>Updated Oct 27, 2026</span><span>Official sources linked below</span></div></header>
<div class="article-layout"><article class="article-body">
<div class="answer-box"><strong>Quick answer</strong><p>{intro}</p></div>
{body_sections}
{source_block(sources_extra)}
<div class="article-bottom-cta"><div><h3>Research the actual opportunities</h3><p>Use HuntSmart to compare hunting opportunities, maps and historical data in context.</p></div><a href="/">Open HuntSmart →</a></div>
</article><aside class="article-rail"><div class="rail-card"><h3>Related BC hunting research</h3><div class="rail-links">{related_html}</div></div><div class="rail-card"><h3>Research standards</h3><p>HuntSmart separates official rules from third-party analysis and shows when content was last reviewed.</p><a href="/methodology/">Read our methodology →</a></div></aside></div>
</main>
<footer class="resource-footer"><div class="resource-footer-inner"><div><h4>HuntSmart Canada</h4><p>Data-backed hunting research for B.C. and Alberta.</p></div><div><h4>BC Hunting</h4><div class="footer-links"><a href="/bc-hunting/">BC Hunting Guide</a><a href="/bc-hunting/general-open-season/">General Open Season</a><a href="/blog/how-does-bc-leh-work/">Limited Entry Hunting</a></div></div><div><h4>Trust</h4><div class="footer-links"><a href="/methodology/">Methodology</a><a href="/about/">About HuntSmart</a></div></div></div><div class="resource-footer-bottom"><span>© 2026 HuntSmart Canada</span><span>Always verify current legal requirements with official provincial sources.</span></div></footer>
</body></html>'''
    write(f'{slug.strip("/")}/index.html', document)


write('robots.txt', f'''User-agent: OAI-SearchBot
Allow: /
Disallow: /admin/

User-agent: *
Allow: /
Disallow: /admin/

Sitemap: {BASE}/sitemap.xml
''')

render_page(
    'bc-hunting',
    'British Columbia Hunting Research Guide',
    'A practical starting point for researching B.C. hunting: Limited Entry Hunting, General Open Seasons, management units, species, regulations and HuntSmart data tools.',
    'BC Hunting Guide',
    'British Columbia uses both General Open Seasons (GOS) and Limited Entry Hunting (LEH). Which system applies depends on the species, location, season and animal class, so hunters should research the exact opportunity and verify it against current provincial regulations.',
    [
        ('Start with LEH vs GOS', '<p>B.C. describes two broad season systems. General Open Seasons are available to licensed hunters who meet the applicable requirements, while LEH uses a draw to limit participation in particular opportunities. Some species can be managed under either system depending on the area and season.</p><div class="topic-grid"><a class="topic-card" href="/bc-hunting/general-open-season/"><strong>General Open Season</strong><span>Understand open seasons, restrictions and how to research them.</span></a><a class="topic-card" href="/blog/how-does-bc-leh-work/"><strong>Limited Entry Hunting</strong><span>Understand hunt codes, draw authorizations and historical odds.</span></a><a class="topic-card" href="/bc-hunting/leh-vs-gos/"><strong>LEH vs GOS</strong><span>Compare the two systems side by side.</span></a></div>'),
        ('Research by species', '<div class="topic-grid"><a class="topic-card" href="/bc-hunting/moose/"><strong>Moose</strong><span>LEH, GOS and research workflow.</span></a><a class="topic-card" href="/bc-hunting/elk/"><strong>Elk</strong><span>LEH, GOS and research workflow.</span></a></div><p>Species-level research should always be narrowed to the current region, management unit, season dates and animal class before you make a hunting decision.</p>'),
        ('Regions and management units', '<p>B.C. hunting rules and opportunity data are organized geographically. HuntSmart uses region and management-unit context to help hunters move from a province-wide question to the specific areas that matter.</p><p><a href="/bc-hunting/regions-and-wmus/">Learn how B.C. regions and management units fit together →</a></p>'),
        ('Use official rules for legal decisions', f'<p>HuntSmart is designed to make public information easier to research and compare. The legal decision should always be made from the current provincial rules and maps. Start with the <a href="{OFFICIAL["regs"]}">B.C. Hunting and Trapping Regulations Synopsis</a>.</p>'),
    ],
    [('General Open Season', '/bc-hunting/general-open-season/'), ('LEH vs GOS', '/bc-hunting/leh-vs-gos/'), ('BC LEH guide', '/blog/how-does-bc-leh-work/'), ('Regions & WMUs', '/bc-hunting/regions-and-wmus/')],
)

render_page(
    'bc-hunting/general-open-season',
    'What Is General Open Season Hunting in British Columbia?',
    'Learn how General Open Season hunting works in B.C., how it differs from LEH, and how to research species, management units, season dates and restrictions.',
    'BC General Open Season',
    'A General Open Season is an open hunting season governed by the current provincial rules rather than participation being allocated through an LEH draw. “Open” does not mean unrestricted: season dates, licences, bag limits, animal-class rules, management-unit boundaries, closures and other conditions can still apply.',
    [
        ('How GOS differs from LEH', '<p>The Province of British Columbia explains that GOS and LEH are the two broad types of hunting seasons available to licensed hunters. GOS manages harvest through tools such as season length, restrictions on class of animal and bag limits; LEH adds a draw that restricts the number of hunters for a defined opportunity.</p>'),
        ('A safe research workflow', '<ol><li>Choose the species you want to research.</li><li>Identify the region and management unit.</li><li>Read the current open-season table and any footnotes.</li><li>Check animal-class, licence and bag-limit requirements.</li><li>Check maps, closures, access restrictions and special-area rules.</li><li>Verify the final plan against the current provincial synopsis and law.</li></ol>'),
        ('Why a map alone is not enough', '<p>A map can show where a management unit or hunt area is located, but it does not replace the rule text. Dates, sex or age class, weapon restrictions, special areas and other conditions can change the legal opportunity even within the same broader region.</p>'),
        ('Where HuntSmart fits', '<p>HuntSmart helps organize GOS information alongside maps and other research context so you can narrow the province to relevant opportunities faster. It should be used as a research layer, with the current provincial publication as the legal source of truth.</p>'),
    ],
    [('BC Hunting Guide', '/bc-hunting/'), ('LEH vs GOS', '/bc-hunting/leh-vs-gos/'), ('Moose research', '/bc-hunting/moose/'), ('Elk research', '/bc-hunting/elk/')],
)

render_page(
    'bc-hunting/leh-vs-gos',
    'BC LEH vs General Open Season: What Is the Difference?',
    'A side-by-side explanation of British Columbia Limited Entry Hunting and General Open Seasons, including participation, management approach and research workflow.',
    'LEH vs GOS',
    'The central difference is participation control: General Open Seasons are open to licensed hunters who satisfy the applicable rules, while Limited Entry Hunting uses a draw to allocate a limited number of authorizations for specified opportunities.',
    [
        ('Side-by-side comparison', '<table><thead><tr><th>Question</th><th>General Open Season</th><th>Limited Entry Hunting</th></tr></thead><tbody><tr><td>How do you participate?</td><td>Meet the applicable licensing and season requirements.</td><td>Apply to the draw and receive the required authorization.</td></tr><tr><td>How is pressure controlled?</td><td>Tools can include season length, animal-class restrictions and bag limits.</td><td>Participation is additionally controlled through a limited number of authorizations.</td></tr><tr><td>What must you research?</td><td>Species, MU, dates, class, licences, limits, closures and special rules.</td><td>All of the applicable hunt rules plus hunt code, draw information and authorization conditions.</td></tr></tbody></table>'),
        ('Can the same species appear under both?', '<p>Yes. Provincial guidance notes that, depending on location, time of year and animal class, a species may be managed under LEH, GOS or both. That is why “Is moose GOS?” or “Is elk LEH?” is too broad without an area and season.</p>'),
        ('How HuntSmart helps', '<p>HuntSmart is most useful after you narrow the question to a species and geography. It can then organize opportunity details, historical draw context and mapping so you can compare realistic options.</p>'),
    ],
    [('General Open Season', '/bc-hunting/general-open-season/'), ('How BC LEH works', '/blog/how-does-bc-leh-work/'), ('BC LEH odds', '/blog/bc-leh-odds-guide/'), ('BC Hunting Guide', '/bc-hunting/')],
)

render_page(
    'bc-hunting/regions-and-wmus',
    'BC Hunting Regions and Management Units Explained',
    'Understand how British Columbia hunting regions and management units are used to organize seasons, maps, regulations and hunting opportunity research.',
    'Regions & WMUs',
    'British Columbia divides hunting geography into regions and management units. The management unit is often the practical geographic key for reading open-season tables, maps and area-specific rules, while LEH opportunities can also use defined hunt areas and hunt codes.',
    [
        ('Why management units matter', '<p>Many hunting rules are geographic. Before comparing dates or opportunities, make sure you are looking at the correct management unit and any special-area map or boundary that modifies the broader rule.</p>'),
        ('Region is a starting point, not the final answer', '<p>A statement such as “Region 3 elk” is usually not specific enough for a legal or planning decision. Research should continue down to the applicable management unit, season, animal class and any mapped special area.</p>'),
        ('Use map and text together', '<p>HuntSmart maps help hunters understand where opportunities are located, while official tables and regulatory text define the actual conditions. Treat the map as geographic context and the current official publication as the legal source.</p>'),
    ],
    [('BC Hunting Guide', '/bc-hunting/'), ('General Open Season', '/bc-hunting/general-open-season/'), ('HuntSmart map guide', '/blog/how-to-use-huntsmart-map/')],
)

for species, intro in [
    ('moose', 'Moose hunting opportunities in B.C. can be managed through LEH, GOS or different rules depending on location, season and animal class. Start by identifying the exact area you can hunt, then determine which season system applies.'),
    ('elk', 'Elk hunting opportunities in B.C. vary substantially by region, management unit, season and animal class. Some opportunities use General Open Seasons while others use Limited Entry Hunting, so the exact location and dates matter.'),
]:
    title_species = species.title()
    render_page(
        f'bc-hunting/{species}',
        f'BC {title_species} Hunting Research Guide',
        f'A research framework for B.C. {species} hunting: LEH vs GOS, management units, season rules, maps, historical context and official sources.',
        f'BC {title_species}',
        intro,
        [
            ('1. Identify realistic geography', f'<p>Start with the B.C. regions and management units you can realistically hunt. {title_species} opportunities can differ sharply between nearby areas, so province-wide summaries should only be a starting point.</p>'),
            ('2. Determine whether the opportunity is GOS or LEH', '<p>Check the current provincial rules for the exact area, dates and animal class. If the opportunity is LEH, use the relevant hunt code and draw information. If it is GOS, confirm all open-season conditions and footnotes.</p>'),
            ('3. Compare more than one metric', '<p>For LEH, historical draw odds help show demand and authorization pressure, but they are not a prediction of the next draw. For any hunt, also consider season timing, access, terrain, regulations and available harvest information.</p>'),
            ('4. Verify the final plan', f'<p>Before hunting, verify your plan against the <a href="{OFFICIAL["regs"]}">current B.C. synopsis</a> and applicable legal rules.</p>'),
        ],
        [('BC Hunting Guide', '/bc-hunting/'), ('General Open Season', '/bc-hunting/general-open-season/'), ('How BC LEH works', '/blog/how-does-bc-leh-work/'), ('Regions & WMUs', '/bc-hunting/regions-and-wmus/')],
    )

render_page(
    'methodology',
    'HuntSmart Canada Data Sources and Methodology',
    'How HuntSmart Canada sources, organizes and presents hunting regulations, LEH draw information, historical data and map context.',
    'Methodology',
    'HuntSmart is a research and decision-support layer built around public hunting information. We distinguish official rules from HuntSmart analysis, identify source material, and avoid presenting historical draw statistics as guaranteed future outcomes.',
    [
        ('Official information comes first', f'<p>Core B.C. references include the <a href="{OFFICIAL["regs"]}">Hunting and Trapping Regulations Synopsis</a>, the <a href="{OFFICIAL["leh"]}">Limited Entry Hunting program</a>, and <a href="{OFFICIAL["data"]}">provincial hunting datasets</a>. Where legal wording matters, users should consult the applicable legislation and current official publications.</p>'),
        ('How HuntSmart treats draw odds', '<p>Historical draw information is descriptive, not predictive. Application demand, authorizations, rules and applicant behaviour can change. HuntSmart uses historical values to provide context and trend visibility rather than a guarantee of future success.</p>'),
        ('How HuntSmart treats GOS information', '<p>General Open Season information is organized for research, but legal eligibility can depend on details such as management unit, season date, animal class, licence, bag limit, special-area rule or closure. Users should verify every final plan with the current provincial source.</p>'),
        ('Update and correction standard', '<p>Pages show a review date. When official information changes, HuntSmart should update the affected resource and preserve a clear distinction between the official rule and any HuntSmart interpretation or analysis.</p>'),
    ],
    [('BC Hunting Guide', '/bc-hunting/'), ('About HuntSmart', '/about/'), ('BC LEH guide', '/blog/how-does-bc-leh-work/')],
    kind='WebPage',
)

render_page(
    'about',
    'About HuntSmart Canada',
    'HuntSmart Canada builds data-backed hunting research tools that help hunters compare opportunities, understand historical context and navigate public hunting information.',
    'About',
    'HuntSmart Canada is a hunting research platform focused on turning public draw, season, harvest and map information into clearer decision tools for hunters, while keeping official provincial sources as the authority for legal requirements.',
    [
        ('What HuntSmart is for', '<p>HuntSmart helps hunters move from a broad question to a short list of realistic opportunities using filters, maps, historical context and explanatory resources.</p>'),
        ('What HuntSmart is not', '<p>HuntSmart is not the legal authority for hunting regulations and does not replace the current provincial synopsis, legislation, licences, authorizations or official maps.</p>'),
        ('Editorial approach', '<p>Our resources aim to answer practical hunting research questions directly, cite official sources and distinguish factual source material from HuntSmart analysis.</p>'),
    ],
    [('Methodology', '/methodology/'), ('BC Hunting Guide', '/bc-hunting/'), ('Resources', '/blog/')],
    kind='AboutPage',
)

org_script = jsonld(ORG)
existing_pages = [
    SITE / 'index.html',
    SITE / 'blog/index.html',
    SITE / 'blog/how-to-use-huntsmart/index.html',
    SITE / 'blog/how-does-bc-leh-work/index.html',
    SITE / 'blog/bc-leh-odds-guide/index.html',
    SITE / 'blog/how-to-use-huntsmart-map/index.html',
]
for p in existing_pages:
    if not p.exists():
        continue
    text = p.read_text(encoding='utf-8')
    if f'{BASE}/#organization' not in text:
        text = text.replace('</head>', org_script + '\n</head>', 1)
    if '/methodology/' not in text and '</footer>' in text:
        text = text.replace('</footer>', '<nav aria-label="HuntSmart research links" style="text-align:center;padding:12px 20px 24px;font-size:.9rem"><a href="/bc-hunting/">BC Hunting Guide</a> · <a href="/bc-hunting/general-open-season/">General Open Season</a> · <a href="/methodology/">Data &amp; Methodology</a> · <a href="/about/">About</a></nav></footer>', 1)
    p.write_text(text, encoding='utf-8')

for rel in ['blog/how-does-bc-leh-work/index.html', 'blog/bc-leh-odds-guide/index.html']:
    p = SITE / rel
    if not p.exists():
        continue
    text = p.read_text(encoding='utf-8')
    if 'id="sources-methodology"' not in text:
        block = source_block('<p>For LEH research, HuntSmart uses published draw information as historical context. Previous-year odds and historical trends do not guarantee future draw results.</p>')
        marker = '<div class="article-bottom-cta">'
        if marker in text:
            text = text.replace(marker, block + '\n' + marker, 1)
    p.write_text(text, encoding='utf-8')

legacy_pairs = {
    'how-does-bc-leh-work.html': 'blog/how-does-bc-leh-work/index.html',
    'bc-leh-odds-guide.html': 'blog/bc-leh-odds-guide/index.html',
}
for legacy, canonical in legacy_pairs.items():
    src = SITE / canonical
    dst = SITE / legacy
    if src.exists() and dst.exists():
        dst.write_text(src.read_text(encoding='utf-8'), encoding='utf-8')

urls = [
    '/', '/blog/', '/blog/how-to-use-huntsmart-map/', '/blog/how-to-use-huntsmart/',
    '/blog/how-does-bc-leh-work/', '/blog/bc-leh-odds-guide/',
    '/bc-hunting/', '/bc-hunting/general-open-season/', '/bc-hunting/leh-vs-gos/',
    '/bc-hunting/regions-and-wmus/', '/bc-hunting/moose/', '/bc-hunting/elk/',
    '/methodology/', '/about/'
]
xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for url in urls:
    xml.extend(['  <url>', f'    <loc>{BASE}{url}</loc>', f'    <lastmod>{TODAY}</lastmod>', '  </url>'])
xml.append('</urlset>')
write('sitemap.xml', '\n'.join(xml) + '\n')

assert 'User-agent: OAI-SearchBot' in (SITE / 'robots.txt').read_text(encoding='utf-8')
assert (SITE / 'bc-hunting/index.html').exists()
assert (SITE / 'bc-hunting/general-open-season/index.html').exists()
assert (SITE / 'methodology/index.html').exists()
assert f'{BASE}/bc-hunting/' in (SITE / 'sitemap.xml').read_text(encoding='utf-8')
assert 'Sources &amp; methodology' in (SITE / 'blog/how-does-bc-leh-work/index.html').read_text(encoding='utf-8')
print('SEO/AEO post-build complete: AI crawler rules, BC hunting hubs, trust pages, source blocks and sitemap verified.')
