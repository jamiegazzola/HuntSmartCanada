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
  if (!Number.isFinite(n) || n < 0) return null;
  return n > 1 ? n / 100 : n;
}

function normText(v) {
  return String(v ?? '').trim().toUpperCase().replace(/\s+/g, ' ');
}

function identitySignature(r) {
  // Deliberately exclude season dates because dates move from year to year while the
  // underlying opportunity can remain the same. These fields represent the stable
  // official identity dimensions available in the survey file.
  return [
    normText(r['Species']),
    normText(r['Region']),
    normText(r['LEH Hunt Area']),
    normText(r['WMU']),
    normText(r['Zone']),
    normText(r['Animal Class'])
  ].join('|');
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

const draws = JSON.parse(fs.readFileSync(DRAWS_PATH, 'utf8'));
if (!Array.isArray(draws)) throw new Error('draws.json must be an array');

const response = await fetch(CSV_URL, { headers: { 'user-agent': 'HuntSmart-data-integrity-audit/1.0' } });
if (!response.ok) throw new Error(`Official CSV request failed: ${response.status}`);
const official = parseCsv(await response.text());

// Index official observations by code/year. Keep only rows that can independently
// reproduce the success rate and retain a stable official identity signature.
const byCode = new Map();
for (const r of official) {
  const code = normalizeCode(r['Hunt Code']);
  const year = Number.parseInt(r['Year'], 10);
  const hunters = Number(r['Estimated Hunters']);
  const kills = Number(r['Estimated Kills']);
  if (!code || !Number.isInteger(year) || !Number.isFinite(hunters) || hunters <= 0 || !Number.isFinite(kills) || kills < 0) continue;
  const obs = { year, rate: kills / hunters, sig: identitySignature(r) };
  if (!byCode.has(code)) byCode.set(code, new Map());
  const years = byCode.get(code);
  if (!years.has(year)) years.set(year, []);
  years.get(year).push(obs);
}

const shortHistoryRecords = draws.filter(r => {
  const h = r && typeof r.yearly_fill_rates === 'object' && r.yearly_fill_rates ? r.yearly_fill_rates : {};
  const n = Object.entries(h).filter(([y, v]) => Number.isInteger(Number.parseInt(y, 10)) && normalizeRate(v) != null).length;
  return n >= 2 && n <= 3;
});

const candidates = [];
let rejectedIdentityDrift = 0;
let rejectedRateMismatch = 0;
let rejectedAmbiguousOfficialRows = 0;

for (const r of shortHistoryRecords) {
  const hist = r.yearly_fill_rates || {};
  const existingEntries = Object.entries(hist)
    .map(([y, v]) => [Number.parseInt(y, 10), normalizeRate(v)])
    .filter(([y, v]) => Number.isInteger(y) && v != null);

  const code = normalizeCode(r.Code);
  const officialYears = code ? byCode.get(code) : null;
  if (!officialYears) continue;

  let overlap = 0;
  let matchedOverlap = 0;
  let failedOverlap = 0;
  let ambiguousOverlap = 0;
  const anchorSignatures = new Set();

  for (const [year, storedRate] of existingEntries) {
    const rows = officialYears.get(year) || [];
    if (!rows.length) continue;
    overlap++;
    if (rows.length !== 1) { ambiguousOverlap++; continue; }
    const delta = Math.abs(rows[0].rate - storedRate);
    if (delta <= 0.015) {
      matchedOverlap++;
      anchorSignatures.add(rows[0].sig);
    } else failedOverlap++;
  }

  if (failedOverlap > 0) { rejectedRateMismatch++; continue; }
  if (ambiguousOverlap > 0) { rejectedAmbiguousOfficialRows++; continue; }
  if (matchedOverlap < 1) continue;
  if (anchorSignatures.size !== 1) { rejectedIdentityDrift++; continue; }

  const anchorSig = [...anchorSignatures][0];

  // Only recover years where the official code points to exactly one survey row and
  // that row has the exact same stable identity dimensions as the overlap anchor.
  const sameIdentityOfficialYears = [...officialYears.entries()]
    .filter(([, rows]) => rows.length === 1 && rows[0].sig === anchorSig)
    .map(([year]) => year)
    .sort((a, b) => a - b);

  // If the same code is attached to another official identity in other years, those
  // years are explicitly excluded rather than silently merged.
  const differentIdentityYears = [...officialYears.entries()]
    .filter(([, rows]) => rows.length === 1 && rows[0].sig !== anchorSig)
    .map(([year]) => year);

  const existingYears = existingEntries.map(([y]) => y).sort((a, b) => a - b);
  const recoverableYears = sameIdentityOfficialYears.filter(y => !existingYears.includes(y));
  const combinedYears = [...new Set([...existingYears, ...sameIdentityOfficialYears])].sort((a, b) => a - b);

  candidates.push({
    before: existingYears.length,
    same_identity_official_years: sameIdentityOfficialYears.length,
    combined_verified_years: combinedYears.length,
    additional_verified_years: recoverableYears.length,
    overlap_years_checked: overlap,
    overlap_years_reproduced: matchedOverlap,
    earliest_verified_year: combinedYears[0] ?? null,
    latest_verified_year: combinedYears.at(-1) ?? null,
    excluded_same_code_different_identity_years: differentIdentityYears.length,
    has_internal_gaps_after_recovery: combinedYears.length > 1 && combinedYears.some((y, i) => i > 0 && y - combinedYears[i - 1] > 1)
  });
}

candidates.sort((a, b) =>
  b.additional_verified_years - a.additional_verified_years ||
  b.combined_verified_years - a.combined_verified_years ||
  a.before - b.before
);

const improved = candidates.filter(x => x.additional_verified_years > 0);
const improvements = improved.map(x => x.additional_verified_years).sort((a, b) => a - b);
const best = improved[0] || null;
const median = improvements.length ? improvements[Math.floor(improvements.length / 2)] : 0;

const report = {
  schema_version: 2,
  generated_at: new Date().toISOString(),
  scope: 'anonymized-data-quality-proof-of-concept',
  source: {
    current_records: DRAWS_PATH,
    official_survey: 'BC Limited Entry Hunting Survey Estimates 1984 to 2023'
  },
  output_contract: 'No hunt code, species, management unit, area, success rate, ranking, or recommendation is emitted.',
  method: {
    candidate_existing_history_years: '2 or 3',
    matching: 'same hunt code plus exact stable official identity signature; no inferred code-change lineage',
    stable_identity_fields: 'species + region + LEH hunt area + WMU + zone + animal class',
    rate_confirmation: 'at least one overlapping year independently reproduces stored rate within 1.5 percentage points; zero disagreeing or ambiguous overlap rows',
    identity_drift_handling: 'same-code years with a different official identity signature are excluded',
    enrichment_status: 'proof-of-concept only; draws.json is not modified'
  },
  aggregate: {
    short_history_records_examined: shortHistoryRecords.length,
    exact_code_and_identity_confirmed_records: candidates.length,
    confirmed_records_with_additional_verified_years: improved.length,
    median_additional_verified_years_among_improved: median,
    max_additional_verified_years: improvements.length ? Math.max(...improvements) : 0,
    rejected_for_rate_mismatch: rejectedRateMismatch,
    rejected_for_ambiguous_official_overlap: rejectedAmbiguousOfficialRows,
    rejected_for_anchor_identity_drift: rejectedIdentityDrift
  },
  example_record_a: best ? {
    existing_history_years_before: best.before,
    verified_history_years_after: best.combined_verified_years,
    additional_verified_years_found: best.additional_verified_years,
    overlap_years_checked: best.overlap_years_checked,
    overlap_years_reproduced: best.overlap_years_reproduced,
    verified_year_span: [best.earliest_verified_year, best.latest_verified_year],
    same_code_different_identity_years_excluded: best.excluded_same_code_different_identity_years,
    internal_gaps_remain: best.has_internal_gaps_after_recovery,
    note: 'Record identity intentionally omitted. Only same-code, same-official-identity years are counted.'
  } : null,
  interpretation: [
    'This is a conservative data-quality recovery test, not a user-facing enrichment run.',
    'A positive result demonstrates that some short histories are caused by pipeline coverage gaps even before any code-change lineage logic is considered.',
    'No current data file is modified by this workflow.'
  ]
};

fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
