from __future__ import annotations

from pathlib import Path
import json
import re

SITE = Path('site')
BASE = 'https://huntsmartcanada.ca'
TODAY_DISPLAY = 'October 27, 2026'
TODAY_ISO = '2026-10-27'
AUTHOR_ID = f'{BASE}/#jamie-gazzola'
ORG_ID = f'{BASE}/#organization'

BC = {
    'regs': 'https://www2.gov.bc.ca/gov/content/sports-culture/recreation/fishing-hunting/hunting/regulations-synopsis',
    'leh': 'https://www2.gov.bc.ca/gov/content/sports-culture/recreation/fishing-hunting/hunting/limited-entry-hunting',
    'data': 'https://www2.gov.bc.ca/gov/content/sports-culture/recreation/fishing-hunting/hunting/hunting-data',
    'law': 'https://www.bclaws.gov.bc.ca/civix/document/id/lc/statreg/134_93_01',
}
AB = {
    'regs': 'https://www.alberta.ca/fishing-hunting-and-trapping-regulations',
    'open': 'https://open.alberta.ca/',
}

PERSON_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': AUTHOR_ID,
    'name': 'Jamie Gazzola',
    'affiliation': {'@id': ORG_ID},
    'knowsAbout': [
        'British Columbia Limited Entry Hunting',
        'British Columbia hunting regulations',
        'Hunting draw data analysis',
        'Canadian hunting opportunity research',
    ],
}

SOURCE_DATA_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': f'{BASE}/#provincial-hunting-source-data',
    'name': 'Official provincial hunting source data used by HuntSmart Canada',
    'description': (
        'HuntSmart Canada organizes official provincial hunting regulations, Limited Entry Hunting '
        'publications and draw information, management-unit context, and published harvest reports '
        'into comparable research tools. HuntSmart calculations and normalization are secondary analysis.'
    ),
    'creator': [
        {'@type': 'GovernmentOrganization', 'name': 'Province of British Columbia'},
        {'@type': 'GovernmentOrganization', 'name': 'Government of Alberta'},
    ],
    'isBasedOn': [BC['regs'], BC['leh'], BC['data'], BC['law'], AB['regs'], AB['open']],
    'dateModified': TODAY_ISO,
}

STYLE = '''<style id="huntsmart-trust-style">
.hs-trust{margin:34px 0;padding:22px 24px;border:1px solid rgba(81,116,91,.32);border-radius:14px;background:linear-gradient(145deg,rgba(19,27,22,.98),rgba(29,42,33,.96));color:#dfe8e1;box-shadow:0 12px 32px rgba(0,0,0,.08)}
.hs-trust h2{margin:0 0 10px!important;color:#f3f7f4!important;font-size:24px!important}.hs-trust h3{margin:18px 0 6px;color:#e9f0eb;font-size:15px}.hs-trust p,.hs-trust li{color:#b9c7bd!important;line-height:1.65}.hs-trust a{color:#8ed0a0!important}.hs-trust-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:16px 0}.hs-trust-chip{padding:12px 14px;border:1px solid rgba(137,173,147,.2);border-radius:10px;background:rgba(255,255,255,.035)}.hs-trust-chip strong{display:block;color:#eef4ef;font-size:12px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px}.hs-trust-chip span{color:#aab8ae;font-size:13px}.hs-trust ul{margin:8px 0 0;padding-left:20px}.hs-trust-note{margin-top:16px;padding-top:14px;border-top:1px solid rgba(137,173,147,.18);font-size:12px;color:#94a299!important}@media(max-width:720px){.hs-trust-grid{grid-template-columns:1fr}.hs-trust{padding:18px}}
</style>'''

BC_TRUST = f'''<section class="hs-trust" id="data-provenance" aria-labelledby="data-provenance-title">
<h2 id="data-provenance-title">Data sources, authorship &amp; verification</h2>
<p><strong>HuntSmart does not invent provincial hunting data.</strong> Our B.C. research is built from official Province of British Columbia hunting publications and public records, then normalized and organized by HuntSmart so hunters can compare opportunities more easily.</p>
<div class="hs-trust-grid">
<div class="hs-trust-chip"><strong>Research &amp; analysis</strong><span>Jamie Gazzola · HuntSmart Canada</span></div>
<div class="hs-trust-chip"><strong>Last source review</strong><span>{TODAY_DISPLAY}</span></div>
<div class="hs-trust-chip"><strong>Historical draw window</strong><span>2016–2025 where usable hunt-level records are available</span></div>
<div class="hs-trust-chip"><strong>Legal source of truth</strong><span>Province of British Columbia</span></div>
</div>
<h3>Primary B.C. sources</h3>
<ul>
<li><a href="{BC['data']}" rel="external">Province of B.C. hunting data and LEH draw reports</a> — published draw and hunting data used for historical context.</li>
<li><a href="{BC['leh']}" rel="external">B.C. Limited Entry Hunting</a> — current LEH program information, hunt codes, application rules and official publications.</li>
<li><a href="{BC['regs']}" rel="external">B.C. Hunting and Trapping Regulations Synopsis</a> — current seasons, management units, restrictions, bag limits and regulatory guidance.</li>
<li><a href="{BC['law']}" rel="external">B.C. Limited Entry Hunting Regulation</a> — consolidated legal regulation under the Wildlife Act.</li>
</ul>
<h3>What HuntSmart adds</h3>
<p>HuntSmart standardizes species names, hunt codes, management-unit context, season/class labels and historical yearly fields so records can be filtered and compared consistently. Where the source provides yearly draw-success values, HuntSmart displays those values and derives comparison metrics such as multi-year medians, trend context and volatility. Those derived metrics are <strong>HuntSmart analysis</strong>, not figures published by the Province.</p>
<h3>Limits</h3>
<p>Historical draw results are descriptive, not predictive. Applicant demand, authorization counts, hunt boundaries, seasons, class restrictions and regulations can change. A historical percentage should never be treated as a guaranteed future draw probability or as legal hunting advice.</p>
<p class="hs-trust-note">For any legal hunting decision, verify the current synopsis, LEH publication, maps, closures and applicable legislation directly with the Province of British Columbia.</p>
</section>'''

METHODOLOGY_DETAIL = f'''<section class="hs-trust" id="source-inventory" aria-labelledby="source-inventory-title">
<h2 id="source-inventory-title">HuntSmart source inventory</h2>
<p>HuntSmart is a secondary research and decision-support layer. The underlying hunting rules and public statistics come from provincial governments; HuntSmart's role is to clean, normalize, connect and explain those records.</p>
<h3>British Columbia</h3>
<ul>
<li><a href="{BC['data']}" rel="external">Province of B.C. hunting data and LEH draw reports</a></li>
<li><a href="{BC['leh']}" rel="external">Province of B.C. Limited Entry Hunting publications and program information</a></li>
<li><a href="{BC['regs']}" rel="external">B.C. Hunting and Trapping Regulations Synopsis</a></li>
<li><a href="{BC['law']}" rel="external">B.C. Limited Entry Hunting Regulation under the Wildlife Act</a></li>
</ul>
<p>For B.C. LEH trend tools, HuntSmart currently compares hunt-level historical draw-success fields from 2016–2025 where enough usable history exists. Finalized 2025 actual draw-success values are preferred when present. Coverage can vary by hunt because provincial publications, hunt codes and opportunity structures change over time.</p>
<h3>Alberta</h3>
<ul>
<li><a href="{AB['regs']}" rel="external">Government of Alberta hunting regulations and annual draw publications</a></li>
<li><a href="{AB['open']}" rel="external">Open Government Alberta</a> — published hunter-harvest reports and related public datasets.</li>
</ul>
<p>Supported Alberta harvest-history tools use published provincial harvest reports, with historical series normalized into HuntSmart's WMU/species structure for comparison. Page-level coverage depends on which official reports are available for that species and year.</p>
<h3>Transformation and quality controls</h3>
<ol>
<li>Preserve the official hunt code, species, geography, season/class and reported historical values where available.</li>
<li>Normalize inconsistent labels and formats so the same opportunity can be compared across years.</li>
<li>Keep official source values separate from HuntSmart-derived calculations such as medians, trend direction, stability or ranking.</li>
<li>Exclude or flag records that do not have enough usable history for a specific analysis rather than silently filling gaps.</li>
<li>Re-check current legal rules against the applicable provincial source before presenting regulation-dependent guidance.</li>
</ol>
<h3>Editorial responsibility</h3>
<p><strong>Research and analysis:</strong> Jamie Gazzola, HuntSmart Canada. <strong>Publisher:</strong> HuntSmart Canada. <strong>Last source review:</strong> {TODAY_DISPLAY}. HuntSmart is independent of the Province of British Columbia and the Government of Alberta and is not an official government service.</p>
</section>'''


def canonical_from_text(text: str, path: Path) -> str:
    match = re.search(r'<link\s+rel=["\']canonical["\']\s+href=["\']([^"\']+)', text, flags=re.I)
    if match:
        return match.group(1)
    rel = path.relative_to(SITE).as_posix()
    if rel.endswith('/index.html'):
        rel = rel[:-10]
    return f'{BASE}/{rel.lstrip("/")}'


def inject_schema(text: str, canonical: str) -> str:
    text = text.replace(f'"author":{{"@id":"{ORG_ID}"}}', f'"author":{{"@id":"{AUTHOR_ID}"}}')
    text = text.replace(f'"author": {{"@id": "{ORG_ID}"}}', f'"author": {{"@id": "{AUTHOR_ID}"}}')
    if '<meta name="author"' not in text:
        text = text.replace('</head>', '<meta name="author" content="Jamie Gazzola · HuntSmart Canada">\n</head>', 1)
    if AUTHOR_ID not in text:
        provenance = {
            '@context': 'https://schema.org',
            '@type': 'CreativeWork',
            '@id': canonical.rstrip('/') + '/#research-provenance',
            'name': 'HuntSmart Canada research provenance',
            'url': canonical,
            'author': {'@id': AUTHOR_ID},
            'publisher': {'@id': ORG_ID},
            'isBasedOn': {'@id': f'{BASE}/#provincial-hunting-source-data'},
            'citation': [BC['data'], BC['leh'], BC['regs'], BC['law']],
            'dateModified': TODAY_ISO,
        }
        payload = ''.join(
            '<script type="application/ld+json">' + json.dumps(obj, separators=(',', ':'), ensure_ascii=False) + '</script>'
            for obj in (PERSON_SCHEMA, SOURCE_DATA_SCHEMA, provenance)
        )
        text = text.replace('</head>', payload + '\n</head>', 1)
    return text


def insert_visible_trust(text: str, block: str) -> str:
    if 'id="data-provenance"' in text or 'id="source-inventory"' in text:
        return text
    for marker in ('<div class="article-bottom-cta">', '<div class="method">', '</article>', '</main>'):
        if marker in text:
            return text.replace(marker, block + '\n' + marker, 1)
    return text


def patch_page(path: Path, methodology: bool = False) -> None:
    text = path.read_text(encoding='utf-8')
    canonical = canonical_from_text(text, path)
    text = inject_schema(text, canonical)
    if 'id="huntsmart-trust-style"' not in text:
        text = text.replace('</head>', STYLE + '\n</head>', 1)
    text = insert_visible_trust(text, METHODOLOGY_DETAIL if methodology else BC_TRUST)
    path.write_text(text, encoding='utf-8')


for root in (SITE / 'bc-hunting', SITE / 'blog'):
    if root.exists():
        for page in root.rglob('index.html'):
            patch_page(page)

methodology = SITE / 'methodology/index.html'
if methodology.exists():
    patch_page(methodology, methodology=True)

about = SITE / 'about/index.html'
if about.exists():
    patch_page(about)

checks = [
    SITE / 'bc-hunting/elk-leh-odds/index.html',
    SITE / 'bc-hunting/moose-leh-odds/index.html',
    SITE / 'blog/how-does-bc-leh-work/index.html',
    SITE / 'methodology/index.html',
]
for page in checks:
    if not page.exists():
        raise SystemExit(f'Trust layer expected page missing: {page}')
    text = page.read_text(encoding='utf-8')
    if 'Jamie Gazzola' not in text or 'Province of British Columbia' not in text:
        raise SystemExit(f'Trust layer missing authorship/source evidence in {page}')
    if AUTHOR_ID not in text:
        raise SystemExit(f'Trust layer missing Person schema in {page}')

print('Trust layer complete: human authorship, provincial source provenance, transformation notes and limitations injected across research pages.')
