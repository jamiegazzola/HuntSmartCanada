import fs from 'node:fs';

const DRAWS_PATH = process.argv[2] || 'draws.json';
const OUT_PATH = process.argv[3] || 'bc-lineage-potential-report.json';
const CSV_URL = 'https://catalogue.data.gov.bc.ca/dataset/0d34d609-bed6-4ac1-8fdc-0dcd8cc939e9/resource/67f9b4c7-b6d3-4473-9145-a711956f65c1/download/leh-survey-estimates-1984-to-2023.csv';

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else quoted = false;
      } else cell += ch;
    } else {
      if (ch === '"') quoted = true;
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
  }
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  if (!rows.length) return [];
  rows[0][0] = rows[0][0].replace(/^\uFEFF/, '');
  const headers = rows[0];
  return rows.slice(1).filter(r => r.some(c => c !== '')).map(r => {
    const o = {};
    for (let i = 0; i < headers.length; i++) o[headers[i]] = r[i] ?? '';
    return o;
  });
}

function norm(v) {
  return String(v ?? '')
    .trim()
    .toUpperCase()
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ');
}

function normCode(v) {
  const s = String(v ?? '').trim();
  const digits = s.replace(/\D/g, '');
  return digits ? digits.padStart(4, '0') : norm(s);
}

function normWmu(v) {
  const s = norm(v).replace(/\s/g, '');
  const m = s.match(/^(\d+)[-–](\d+)$/);
  if (!m) return s;
  return `${Number(m[1])}-${String(Number(m[2])).padStart(2, '0')}`;
}

function currentHistoryYears(r) {
  const h = r && r.yearly_fill_rates && typeof r.yearly_fill_rates === 'object' ? r.yearly_fill_rates : {};
  return Object.keys(h)
    .map(y => Number.parseInt(y, 10))
    .filter(Number.isInteger)
    .sort((a, b) => a - b);
}

function coreSig(r) {
  return [
    norm(r.species),
    norm(r.region),
    norm(r.area),
    normWmu(r.wmu),
    norm(r.zone),
    norm(r.animalClass)
  ].join('|');
}

const MONTHS = new Map([
  ['JAN',1],['JANUARY',1],['FEB',2],['FEBRUARY',2],['MAR',3],['MARCH',3],
  ['APR',4],['APRIL',4],['MAY',5],['JUN',6],['JUNE',6],['JUL',7],['JULY',7],
  ['AUG',8],['AUGUST',8],['SEP',9],['SEPT',9],['SEPTEMBER',9],['OCT',10],['OCTOBER',10],
  ['NOV',11],['NOVEMBER',11],['DEC',12],['DECEMBER',12]
]);

function parseMonthDay(v) {
  const raw = String(v ?? '').trim();
  if (!raw) return null;
  const s = raw.replace(/,/g, '').replace(/\s+/g, ' ').trim();
  let m;

  // ISO or year-first numeric.
  if ((m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/))) return [Number(m[2]), Number(m[3])];
  // Month/day/year.
  if ((m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/))) return [Number(m[1]), Number(m[2])];
  // Month/day with no year.
  if ((m = s.match(/^(\d{1,2})[-/](\d{1,2})$/))) return [Number(m[1]), Number(m[2])];
  // Day-MonthName[-Year] or Day MonthName [Year].
  if ((m = s.match(/^(\d{1,2})[-\s]([A-Z]{3,9})(?:[-\s](\d{2,4}))?$/i))) {
    const month = MONTHS.get(m[2].toUpperCase());
    return month ? [month, Number(m[1])] : null;
  }
  // MonthName-Day[-Year] or MonthName Day [Year].
  if ((m = s.match(/^([A-Z]{3,9})[-\s](\d{1,2})(?:[-\s](\d{2,4}))?$/i))) {
    const month = MONTHS.get(m[1].toUpperCase());
    return month ? [month, Number(m[2])] : null;
  }

  // Conservative Date fallback. Supply a fixed non-leap year when absent.
  const hasYear = /\b\d{4}\b/.test(s);
  const parsed = new Date(hasYear ? s : `${s} 2001`);
  if (!Number.isNaN(parsed.getTime())) return [parsed.getUTCMonth() + 1, parsed.getUTCDate()];
  return null;
}

function dayOfYear(md) {
  if (!md) return null;
  const [month, day] = md;
  if (!(month >= 1 && month <= 12 && day >= 1 && day <= 31)) return null;
  const d = new Date(Date.UTC(2001, month - 1, day));
  if (d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  return Math.floor((d - Date.UTC(2001, 0, 1)) / 86400000) + 1;
}

function seasonProfile(r) {
  return [
    dayOfYear(parseMonthDay(r.s1s)),
    dayOfYear(parseMonthDay(r.s1e)),
    dayOfYear(parseMonthDay(r.s2s)),
    dayOfYear(parseMonthDay(r.s2e))
  ];
}

function hasPrimarySeason(r) {
  const p = seasonProfile(r);
  return Number.isFinite(p[0]) && Number.isFinite(p[1]);
}

function seasonCompatible(a, b, toleranceDays = 16) {
  const pa = seasonProfile(a);
  const pb = seasonProfile(b);
  const firstA = pa.slice(0, 2).every(Number.isFinite);
  const firstB = pb.slice(0, 2).every(Number.isFinite);
  if (!firstA || !firstB) return false;
  const secondA = pa.slice(2).every(Number.isFinite);
  const secondB = pb.slice(2).every(Number.isFinite);
  if (secondA !== secondB) return false;
  const n = secondA ? 4 : 2;
  for (let i = 0; i < n; i++) if (Math.abs(pa[i] - pb[i]) > toleranceDays) return false;
  return true;
}

function officialRecord(r) {
  return {
    year: Number.parseInt(r['Year'], 10),
    code: normCode(r['Hunt Code']),
    species: r['Species'],
    region: r['Region'],
    area: r['LEH Hunt Area'],
    wmu: r['WMU'],
    zone: r['Zone'],
    animalClass: r['Animal Class'],
    s1s: r['Season 1 Start'],
    s1e: r['Season 1 End'],
    s2s: r['Season 2 Start'],
    s2e: r['Season 2 End']
  };
}

function currentMeta(r) {
  return {
    code: normCode(r.Code),
    species: norm(r.Species),
    wmu: normWmu(r.MU),
    zone: norm(r.Zone),
    animalClass: norm(r.Class)
  };
}

function matchesCurrent(o, c, tier) {
  if (o.code !== c.code) return false;
  if (tier >= 1 && c.species && norm(o.species) !== c.species) return false;
  if (tier >= 2 && c.wmu && normWmu(o.wmu) !== c.wmu) return false;
  if (tier >= 3 && c.animalClass && norm(o.animalClass) !== c.animalClass) return false;
  if (tier >= 4 && c.zone && norm(o.zone) !== c.zone) return false;
  return true;
}

function chooseAnchor(allOfficial, current) {
  for (const tier of [4, 3, 2, 1, 0]) {
    const matches = allOfficial.filter(o => Number.isInteger(o.year) && matchesCurrent(o, current, tier));
    if (!matches.length) continue;
    const latestYear = Math.max(...matches.map(o => o.year));
    const latest = matches.filter(o => o.year === latestYear);
    const signatures = [...new Set(latest.map(coreSig))];
    if (signatures.length === 1) {
      const sig = signatures[0];
      const anchorRows = latest.filter(o => coreSig(o) === sig);
      return { sig, anchor: anchorRows[0], tier, latestYear };
    }
  }
  return null;
}

function uniqueYears(rows) {
  return [...new Set(rows.map(r => r.year).filter(Number.isInteger))].sort((a, b) => a - b);
}

function median(nums) {
  if (!nums.length) return 0;
  const a = [...nums].sort((x, y) => x - y);
  const i = Math.floor(a.length / 2);
  return a.length % 2 ? a[i] : (a[i - 1] + a[i]) / 2;
}

const draws = JSON.parse(fs.readFileSync(DRAWS_PATH, 'utf8'));
if (!Array.isArray(draws)) throw new Error('draws.json must be an array');

const res = await fetch(CSV_URL, { headers: { 'user-agent': 'HuntSmart-lineage-integrity-audit/1.1' } });
if (!res.ok) throw new Error(`Official LEH survey request failed: ${res.status}`);
const officialRaw = parseCsv(await res.text());
const official = officialRaw.map(officialRecord).filter(r => Number.isInteger(r.year) && r.code);

const byCore = new Map();
for (const o of official) {
  const sig = coreSig(o);
  if (!byCore.has(sig)) byCore.set(sig, []);
  byCore.get(sig).push(o);
}

const short = draws.filter(r => {
  const n = currentHistoryYears(r).length;
  return n >= 2 && n <= 3;
});

const results = [];
const anchorTierCounts = {};
let unanchored = 0;

for (const r of short) {
  const beforeYears = currentHistoryYears(r);
  const c = currentMeta(r);
  const chosen = chooseAnchor(official, c);
  if (!chosen) { unanchored++; continue; }
  anchorTierCounts[String(chosen.tier)] = (anchorTierCounts[String(chosen.tier)] || 0) + 1;

  const lineageRows = byCore.get(chosen.sig) || [];
  const exactRows = lineageRows.filter(o => o.code === c.code);
  const exactYears = uniqueYears(exactRows);

  const differentCodeRows = lineageRows.filter(o => o.code !== c.code);
  const byYear = new Map();
  for (const o of differentCodeRows) {
    if (!byYear.has(o.year)) byYear.set(o.year, []);
    byYear.get(o.year).push(o);
  }

  const strongPredYears = [];
  const reviewPredYears = [];
  let ambiguousPredYears = 0;
  const strongCodes = new Set([c.code]);

  for (const [year, rows] of byYear.entries()) {
    const codes = [...new Set(rows.map(x => x.code))];
    if (codes.length !== 1) { ambiguousPredYears++; continue; }
    const compatible = rows.some(x => seasonCompatible(chosen.anchor, x));
    if (compatible) {
      strongPredYears.push(year);
      strongCodes.add(codes[0]);
    } else {
      reviewPredYears.push(year);
    }
  }

  strongPredYears.sort((a, b) => a - b);
  reviewPredYears.sort((a, b) => a - b);
  const highConfidenceYears = [...new Set([...exactYears, ...strongPredYears])].sort((a, b) => a - b);
  const gainExactVsLegacy = Math.max(0, exactYears.length - beforeYears.length);
  const gainHighConfidenceVsLegacy = Math.max(0, highConfidenceYears.length - beforeYears.length);

  results.push({
    before: beforeYears.length,
    anchored_latest_official_year: chosen.latestYear,
    anchor_tier: chosen.tier,
    anchor_primary_season_parseable: hasPrimarySeason(chosen.anchor),
    exact_code_official_years: exactYears.length,
    exact_code_gain_over_legacy: gainExactVsLegacy,
    strong_predecessor_years: strongPredYears.length,
    review_predecessor_years: reviewPredYears.length,
    ambiguous_predecessor_years: ambiguousPredYears,
    high_confidence_total_years: highConfidenceYears.length,
    high_confidence_gain_over_legacy: gainHighConfidenceVsLegacy,
    distinct_codes_in_high_confidence_lineage: strongCodes.size,
    earliest_high_confidence_year: highConfidenceYears[0] ?? null,
    latest_high_confidence_year: highConfidenceYears.at(-1) ?? null
  });
}

const improvedExact = results.filter(x => x.exact_code_gain_over_legacy > 0);
const improvedLineage = results.filter(x => x.high_confidence_gain_over_legacy > 0);
const withStrongPredecessor = results.filter(x => x.strong_predecessor_years > 0);
const withReviewPredecessor = results.filter(x => x.review_predecessor_years > 0);
const withAmbiguity = results.filter(x => x.ambiguous_predecessor_years > 0);

const coverageBuckets = { '2-3': 0, '4-5': 0, '6-9': 0, '10-14': 0, '15-19': 0, '20+': 0 };
for (const x of results) {
  const n = x.high_confidence_total_years;
  if (n <= 3) coverageBuckets['2-3']++;
  else if (n <= 5) coverageBuckets['4-5']++;
  else if (n <= 9) coverageBuckets['6-9']++;
  else if (n <= 14) coverageBuckets['10-14']++;
  else if (n <= 19) coverageBuckets['15-19']++;
  else coverageBuckets['20+']++;
}

const topExamples = [...results]
  .filter(x => x.high_confidence_gain_over_legacy > 0)
  .sort((a, b) => b.high_confidence_gain_over_legacy - a.high_confidence_gain_over_legacy || b.high_confidence_total_years - a.high_confidence_total_years)
  .slice(0, 5)
  .map((x, i) => ({
    anonymized_record: String.fromCharCode(65 + i),
    legacy_years_before: x.before,
    exact_code_official_years: x.exact_code_official_years,
    strong_predecessor_years: x.strong_predecessor_years,
    high_confidence_years_after: x.high_confidence_total_years,
    additional_high_confidence_years: x.high_confidence_gain_over_legacy,
    distinct_codes_in_lineage: x.distinct_codes_in_high_confidence_lineage,
    verified_year_span: [x.earliest_high_confidence_year, x.latest_high_confidence_year],
    review_years_not_included: x.review_predecessor_years,
    ambiguous_years_not_included: x.ambiguous_predecessor_years
  }));

const parseableOfficialPrimary = official.filter(hasPrimarySeason).length;
const parseableAnchors = results.filter(x => x.anchor_primary_season_parseable).length;

const report = {
  schema_version: 2,
  generated_at: new Date().toISOString(),
  scope: 'anonymized-leh-lineage-and-coverage-audit',
  output_contract: 'No hunt code, species, management unit, area, success rate, ranking, or recommendation is emitted.',
  source: {
    current_records: DRAWS_PATH,
    official_survey: 'BC Limited Entry Hunting Survey Estimates 1984 to 2024',
    official_rows: official.length,
    official_year_range: [Math.min(...official.map(x => x.year)), Math.max(...official.map(x => x.year))],
    official_rows_with_parseable_primary_season: parseableOfficialPrimary
  },
  method: {
    target_records: 'current HuntSmart records with 2 or 3 legacy yearly_fill_rates observations',
    anchor: 'current code plus progressively strict metadata, resolving to one stable official identity in the latest matching survey year',
    anchor_tiers: '4=code+species+WMU+class+zone, 3=code+species+WMU+class, 2=code+species+WMU, 1=code+species, 0=code-only unique latest official identity',
    stable_identity: 'species + region + LEH hunt area + WMU + zone + animal class',
    exact_code_coverage: 'all official survey years retaining the anchor stable identity and current hunt code',
    strong_predecessor_candidate: 'same stable identity, different code, unique code for that year, and season boundaries within 16 days of the latest official anchor',
    review_policy: 'season-inconsistent or ambiguous predecessor years are counted separately and excluded from high-confidence totals',
    metric_policy: 'legacy success values are not used to validate identity because the legacy data may represent a different source/metric',
    mutation: 'No application data is modified.'
  },
  aggregate: {
    short_history_records_examined: short.length,
    records_anchored_to_official_identity: results.length,
    records_unanchored: unanchored,
    anchor_tier_counts: anchorTierCounts,
    anchors_with_parseable_primary_season: parseableAnchors,
    records_with_more_exact_code_official_years_than_legacy: improvedExact.length,
    median_exact_code_years_added_among_improved: median(improvedExact.map(x => x.exact_code_gain_over_legacy)),
    max_exact_code_years_added: improvedExact.length ? Math.max(...improvedExact.map(x => x.exact_code_gain_over_legacy)) : 0,
    records_with_strong_predecessor_code_years: withStrongPredecessor.length,
    records_with_review_only_predecessor_years: withReviewPredecessor.length,
    records_with_ambiguous_predecessor_years: withAmbiguity.length,
    records_with_more_high_confidence_years_than_legacy: improvedLineage.length,
    median_high_confidence_years_added_among_improved: median(improvedLineage.map(x => x.high_confidence_gain_over_legacy)),
    max_high_confidence_years_added: improvedLineage.length ? Math.max(...improvedLineage.map(x => x.high_confidence_gain_over_legacy)) : 0,
    high_confidence_coverage_buckets: coverageBuckets
  },
  examples: topExamples,
  interpretation: [
    'Exact-code official coverage is evaluated independently from the legacy success metric, avoiding false rejection caused by mixing different historical data sources.',
    'Different-code years are not auto-merged; only conservative same-identity, season-compatible years are counted as strong predecessor candidates.',
    'The report measures whether a lineage-aware rebuild can materially improve historical coverage before any user-facing data migration.'
  ]
};

fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
