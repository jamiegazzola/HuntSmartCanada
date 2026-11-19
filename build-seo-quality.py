"""Small, deterministic SEO corrections for HuntSmart's generated public pages.

Runs after all page generators so later builds cannot reintroduce duplicated
metadata. This does not alter maps, account flows or the consumer homepage UI.
"""

from pathlib import Path
import html
import re

SITE = Path("site")


def read(relative):
    path = SITE / relative
    if not path.is_file():
        raise SystemExit(f"SEO quality: required generated page missing: {path}")
    return path.read_text(encoding="utf-8")


def save(relative, text):
    (SITE / relative).write_text(text, encoding="utf-8")


def change_head(relative, *, title=None, description=None):
    document = read(relative)
    match = re.search(r"<head\b[^>]*>(.*?)</head>", document, re.I | re.S)
    if not match:
        raise SystemExit(f"SEO quality: no head found in {relative}")

    head = match.group(1)
    if title is not None:
        new_title = f"<title>{html.escape(title)}</title>"
        head, count = re.subn(r"<title\b[^>]*>.*?</title>", lambda _: new_title,
                              head, count=1, flags=re.I | re.S)
        if count != 1:
            raise SystemExit(f"SEO quality: missing title in {relative}")

        og_pattern = r'<meta\b(?=[^>]*\bproperty\s*=\s*["\x27]og:title["\x27])[^>]*>'
        head = re.sub(og_pattern,
                      lambda _: f'<meta property="og:title" content="{html.escape(title, quote=True)}">',
                      head, flags=re.I)

    if description is not None:
        tag = f'<meta name="description" content="{html.escape(description, quote=True)}">'
        desc_pattern = r'<meta\b(?=[^>]*\bname\s*=\s*["\x27]description["\x27])[^>]*>'
        if re.search(desc_pattern, head, flags=re.I):
            head = re.sub(desc_pattern, lambda _: tag, head, count=1, flags=re.I)
        else:
            head = "\n" + tag + "\n" + head
        if len(re.findall(desc_pattern, head, flags=re.I)) != 1:
            raise SystemExit(f"SEO quality: ambiguous meta description in {relative}")

    save(relative, document[:match.start(1)] + head + document[match.end(1):])


def insert_once(relative, marker, block, *, sentinel):
    document = read(relative)
    if sentinel in document:
        return
    if document.count(marker) != 1:
        raise SystemExit(f"SEO quality: expected one insertion marker in {relative}")
    save(relative, document.replace(marker, block + "\n" + marker, 1))


# The app homepage deliberately stays free of research link strips.
change_head(
    "index.html",
    description=(
        "Explore BC and Alberta hunting draws, LEH odds, historical trends and "
        "interactive hunting maps with HuntSmart Canada."
    ),
)

# These two URLs serve different intents: a practical moose guide and a
# data-led longitudinal research article.
change_head(
    "bc-hunting/moose-leh-odds/index.html",
    title="BC Moose LEH Odds: Compare Hunt Codes | HuntSmart",
)

# Separate adjacent analyses rather than publishing the same search snippet.
change_head(
    "blog/easiest-bc-leh-draws-stability/index.html",
    description=(
        "Compare easier BC LEH draws using historical median odds and "
        "year-to-year stability, with species and region filters."
    ),
)
change_head(
    "blog/which-bc-leh-odds-are-most-stable/index.html",
    description=(
        "Explore which BC LEH hunt codes have the steadiest draw odds across "
        "2016–2025, with interactive trends and volatility comparisons."
    ),
)

# Make the highest-impression informational guide's search snippet and next
# action more direct. Preserve the original substantive article and its H1.
change_head(
    "blog/how-does-bc-leh-work/index.html",
    title="How BC LEH Works: Hunt Codes, Draws & Odds | HuntSmart",
    description=(
        "Understand BC Limited Entry Hunting (LEH): hunt codes, applications, "
        "authorizations and draw odds. Learn how to compare opportunities."
    ),
)
insert_once(
    "blog/how-does-bc-leh-work/index.html",
    '<h2 id="hunt">',
    '<p><strong>Looking for your next step?</strong> '
    '<a href="/bc-hunting/what-is-a-hunt-code/">Learn how hunt codes work</a>, '
    'then <a href="/bc-hunting/leh-results-and-odds/">read LEH results and odds</a>. '
    'Use the current provincial synopsis for official application requirements.</p>',
    sentinel='Looking for your next step?',
)

# Turn the citation index into a useful destination rather than a thin page.
insert_once(
    "research/index.html",
    "<h2>Source transparency</h2>",
    (
        '<h2>How to use these sources</h2>'
        '<p>Start with a question about a specific species, season or management unit. '
        'The BC Hunting guide explains the terminology, the LEH Data Explorer '
        'explains how to interpret draw histories, and the methodology page '
        'documents the sources and limitations of HuntSmart research. '
        'Link directly to the relevant page when citing a particular analysis '
        'instead of linking to the homepage.</p>'
        '<p>Historical LEH percentages describe past draws; they are not '
        'predictions or guarantees. Changes in application demand, hunt codes, '
        'authorizations and regulations may make years less comparable. '
        'When a figure matters to a decision, check the source year, the '
        'exact hunt and the available history before relying on it.</p>'
        '<h2>Official hunting information</h2>'
        '<p>HuntSmart is a research aid, not the legal authority for seasons '
        'or eligibility. Consult the '
        '<a href="https://www2.gov.bc.ca/gov/content/sports-culture/recreation/fishing-hunting/hunting/limited-entry-hunting">'
        'BC Limited Entry Hunting information</a> and the '
        '<a href="https://www2.gov.bc.ca/gov/content/sports-culture/recreation/fishing-hunting/hunting/regulations-synopsis">'
        'current BC Hunting Regulations Synopsis</a> for applicable rules. '
        'Researchers can also review the '
        '<a href="/blog/bc-moose-leh-odds-trends/">moose draw trends</a> '
        'and the <a href="/blog/bc-general-open-season-explorer/">'
        'general open season explorer</a> as examples of HuntSmart analyses.</p>'
    ),
    sentinel="How to use these sources",
)

# Explicit, crawlable related links on a topical hub. They must not be added to
# the consumer homepage (its cleanup/build assertions prohibit them).
related = (
    '<section aria-labelledby="huntsmart-related-research">'
    '<h2 id="huntsmart-related-research">More BC hunting research</h2>'
    '<p>Explore HuntSmart data and interactive analyses alongside the practical guides.</p>'
    '<ul>'
    '<li><a href="/blog/bc-general-open-season-explorer/">BC General Open Season Explorer</a></li>'
    '<li><a href="/blog/bc-moose-leh-odds-trends/">BC Moose LEH Draw Trends</a></li>'
    '<li><a href="/blog/easiest-bc-leh-draws-stability/">Easier BC LEH Draws and Stability</a></li>'
    '<li><a href="/blog/which-bc-leh-odds-are-most-stable/">Which BC LEH Odds Are Most Stable?</a></li>'
    '<li><a href="/research/">Research Sources and Citation Guide</a></li>'
    '</ul></section>'
)
insert_once("bc-hunting/index.html", "</article>", related,
            sentinel='id="huntsmart-related-research"')

# Fail the build if a target is missing or the intended SEO links disappear.
for url in (
    "blog/bc-general-open-season-explorer/index.html",
    "blog/bc-moose-leh-odds-trends/index.html",
    "blog/easiest-bc-leh-draws-stability/index.html",
    "blog/which-bc-leh-odds-are-most-stable/index.html",
):
    read(url)
hub = read("bc-hunting/index.html")
for slug in (
    "/blog/bc-general-open-season-explorer/",
    "/blog/bc-moose-leh-odds-trends/",
    "/blog/easiest-bc-leh-draws-stability/",
    "/blog/which-bc-leh-odds-are-most-stable/",
    "/research/",
):
    if f'href="{slug}"' not in hub:
        raise SystemExit(f"SEO quality: missing hub link {slug}")

if '<meta name="description"' not in read("index.html").split("</head>", 1)[0]:
    raise SystemExit("SEO quality: homepage missing description")

print("SEO quality complete: homepage description, unique snippets, LEH guide, citation index and internal links verified.")
