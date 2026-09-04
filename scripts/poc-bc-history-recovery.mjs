import fs from 'node:fs';

const DRAWS_PATH = process.argv[2] || 'draws.json';
const OUT_PATH = process.argv[3] || 'bc-history-recovery-poc.json';
const CSV_URL = 'https://catalogue.data.gov.bc.ca/dataset/0d34d609-bed6-4ac1-8fdc-0dcd8cc939e9/resource/67f9b4c7-b6d3-4473-9145-a711956f65c1/download/leh-survey-estimates-1984-to-2023.csv';

function normalizeCode(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const digits = s.replace(/\D/g, '');
  if (!digits) return s.toUpperCase();
  return digits.padStart(4, '0');
}

function normalizeRate(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (n < 0) return null;
  return n > 1 ? n / 100 : n;
}

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

function round2(n) { return Math.round(n * 100) / 100; }

const draws = JSON.parse(fs.readFileSync(DRAWS_PATH, 'utf8'));
if (!Array.isArray(draws)) throw new Error('draws.json must be an array');

const response = await fetch(CSV_URL, { headers: { 'user-agent': 'HuntSmart-data-integrity-audit/1.0' } });
if (!response.ok) throw new Error(`Official CSV request failed: ${response.status}`);
const officialText = await response.text();
const official = parseCsv(officialText);

// Index official observations by hunt code and year. We intentionally retain only
// rows with both Estimated Hunters and Estimated Kills because those are sufficient
// to independently recompute the survey success rate for validation.
const byCode = new Map();
for (const r of official) {
  const code = normalizeCode(r['Hunt Code']);
  const year = Number.parseInt(r['Year'], 10);
  const hunters = Number(r['Estimated Hunters']);
  const kills = Number(r['Estimated Kills']);
  if (!code || !Number.isInteger(year) || !Number.isFinite(hunters) || hunters <= 0 || !Number.isFinite(kills) || kills < 0) continue;
  const obs = { year, rate: kills / hunters };
  if (!byCode.has(code)) byCode.set(code, new Map());
  const years = byCode.get(code);
  if (!years.has(year)) years.set(year, []);
  years.get(year).push(obs);
}

const candidates = [];
for (const r of draws) {
  const hist = r && typeof r.yearly_fill_rates === 'object' && r.yearly_fill_rates ? r.yearly_fill_rates : {};
  const existingEntries = Object.entries(hist)
    .map(([y, v]) => [Number.parseInt(y, 10), normalizeRate(v)])
    .filter(([y, v]) => Number.isInteger(y) && v != null);
  if (existingEntries.length < 2 || existingEntries.length > 3) continue;

  const code = normalizeCode(r.Code);
  const officialYears = code ? byCode.get(code) : null;
  if (!officialYears) continue;

  let overlap = 0;
  let matchedOverlap = 0;
  let failedOverlap = 0;
  let ambiguousOverlap = 0;
  const matchedYears = [];

  for (const [year, storedRate] of existingEntries) {
    const rows = officialYears.get(year) || [];
    if (!rows.length) continue;
    overlap++;
    if (rows.length !== 1) { ambiguousOverlap++; continue; }
    const delta = Math.abs(rows[0].rate - storedRate);
    // 1.5 percentage points allows for rounding in the pre-existing dataset while
    // remaining strict enough to catch mismatched identities or incompatible formulas.
    if (delta <= 0.015) { matchedOverlap++; matchedYears.push(year); }
    else failedOverlap++;
  }

  // Conservative proof-of-concept identity gate:
  // - at least one exact overlapping year must independently reproduce the stored rate
  // - no overlapping year may disagree
  // - no overlapping year may be ambiguous in the official source
  // This does NOT infer code changes or historical lineage.
  const confirmed = matchedOverlap >= 1 && failedOverlap === 0 && ambiguousOverlap === 0;
  if (!confirmed) continue;

  const unambiguousOfficialYears = [...officialYears.entries()]
    .filter(([, rows]) => rows.length === 1)
    .map(([year]) => year)
    .sort((a, b) => a - b);

  const existingYears = existingEntries.map(([y]) => y).sort((a, b) => a - b);
  const recoverableYears = unambiguousOfficialYears.filter(y => !existingYears.includes(y));
  const combinedYears = [...new Set([...existingYears, ...unambiguousOfficialYears])].sort((a, b) => a - b);

  candidates.push({
    before: existingYears.length,
    exact_official_years: unambiguousOfficialYears.length,
    combined_verified_years: combinedYears.length,
    additional_exact_years: recoverableYears.length,
    overlap_years_checked: overlap,
    overlap_years_reproduced: matchedOverlap,
    earliest_verified_year: combinedYears[0] ?? null,
    latest_verified_year: combinedYears.at(-1) ?? null,
    has_internal_gaps_after_exact_recovery: combinedYears.length > 1 && combinedYears.some((y, i) => i > 0 && y - combinedYears[i - 1] > 1)
  });
}

candidates.sort((a, b) =>
  b.additional_exact_years - a.additional_exact_years ||
  b.combined_verified_years - a.combined_verified_years ||
  a.before - b.before
);

const best = candidates[0] || null;
const improved = candidates.filter(x => x.additional_exact_years > 0);
const improvements = improved.map(x => x.additional_exact_years).sort((a, b) => a - b);
const median = improvements.length ? improvements[Math.floor(improvements.length / 2)] : 0;

const report = {
  schema_version: 1,
  generated_at: new Date().toISOString(),
  scope: 'anonymized-data-quality-proof-of-concept',
  source: {
    current_records: DRAWS_PATH,
    official_survey: 'BC Limited Entry Hunting Survey Estimates 1984 to 2023'
  },
  safety_and_output_contract: 'No hunt code, species, management unit, area, success rate, ranking, or recommendation is emitted.',
  method: {
    candidate_existing_history_years: '2 or 3',
    matching: 'same hunt code only; no inferred code-change lineage',
    identity_confirmation: 'at least one overlapping year independently reproduces stored rate within 1.5 percentage points, with zero disagreeing or ambiguous overlapping years',
    enrichment_status: 'proof-of-concept only; draws.json is not modified'
  },
  aggregate: {
    short_history_records_examined: draws.filter(r => {
      const h = r && typeof r.yearly_fill_rates === 'object' && r.yearly_fill_rates ? r.yearly_fill_rates : {};
      const n = Object.entries(h).filter(([y, v]) => Number.isInteger(Number.parseInt(y, 10)) && normalizeRate(v) != null).length;
      return n >= 2 && n <= 3;
    }).length,
    identity_confirmed_exact_code_records: candidates.length,
    confirmed_records_with_additional_exact_years: improved.length,
    median_additional_exact_years_among_improved: median,
    max_additional_exact_years: improvements.length ? Math.max(...improvements) : 0
  },
  example_record_a: best ? {
    existing_history_years_before: best.before,
    verified_history_years_after_exact_code_recovery: best.combined_verified_years,
    additional_verified_years_found: best.additional_exact_years,
    overlap_years_checked: best.overlap_years_checked,
    overlap_years_reproduced: best.overlap_years_reproduced,
    verified_year_span: [best.earliest_verified_year, best.latest_verified_year],
    internal_gaps_remain: best.has_internal_gaps_after_exact_recovery,
    note: 'Record identity intentionally omitted. This result uses only exact-code continuity and does not infer historical code changes.'
  } : null,
  interpretation: [
    'This run tests whether short histories can be expanded from the official hunt-code survey without any fuzzy lineage matching.',
    'A positive result demonstrates a data-pipeline coverage gap, not permission to auto-merge every historical row.',
    'Code-change lineage would require a separate conservative identity review and is not performed here.'
  ]
};

fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
