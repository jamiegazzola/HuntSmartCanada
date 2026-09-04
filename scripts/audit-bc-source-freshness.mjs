import fs from 'node:fs';

const DRAWS_PATH = process.argv[2] || 'draws.json';
const OUT_PATH = process.argv[3] || 'bc-source-freshness-report.json';
const LEH_SURVEY_CSV_URL = 'https://catalogue.data.gov.bc.ca/dataset/0d34d609-bed6-4ac1-8fdc-0dcd8cc939e9/resource/67f9b4c7-b6d3-4473-9145-a711956f65c1/download/leh-survey-estimates-1984-to-2023.csv';

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
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  if (!rows.length) return { headers: [], records: [] };
  rows[0][0] = rows[0][0].replace(/^\uFEFF/, '');
  const headers = rows[0];
  const records = rows.slice(1).filter(r => r.some(c => c !== '')).map(r => {
    const o = {};
    for (let i = 0; i < headers.length; i++) o[headers[i]] = r[i] ?? '';
    return o;
  });
  return { headers, records };
}

const expectedHeaders = [
  'Year','Species','Region','LEH Hunt Area','WMU','Zone','Season 1 Start','Season 1 End',
  'Season 2 Start','Season 2 End','Animal Class','Hunt Code','Available Authorizations',
  'First Choice Applicants','Authorized Animals','Issued Authorizations','Surveys Sent','Respondents',
  'Estimated Hunters','Estimated Kills','Estimated Adult Male Kills','Estimated Adult Male Spike Fork Kills',
  'Estimated Adult female Kills','Estimated Juvenile Kills','Estimated Unknown Kills','Estimated Days','Days Per Kill'
];

const res = await fetch(LEH_SURVEY_CSV_URL, { headers: { 'user-agent': 'HuntSmart-source-freshness-audit/1.0' } });
if (!res.ok) throw new Error(`LEH survey request failed: ${res.status}`);
const text = await res.text();
const { headers, records } = parseCsv(text);

const years = records.map(r => Number.parseInt(r.Year, 10)).filter(Number.isInteger);
const uniqueYears = [...new Set(years)].sort((a,b)=>a-b);
const minYear = uniqueYears[0] ?? null;
const maxYear = uniqueYears.at(-1) ?? null;
const countsByYear = Object.fromEntries(uniqueYears.map(y => [String(y), years.filter(v => v === y).length]));
const missingExpectedHeaders = expectedHeaders.filter(h => !headers.includes(h));
const unexpectedHeaders = headers.filter(h => !expectedHeaders.includes(h));

let embeddedLatestYear = null;
let embeddedHistoryObservations = 0;
let embedded2024 = 0;
let embedded2025 = 0;
if (fs.existsSync(DRAWS_PATH)) {
  const draws = JSON.parse(fs.readFileSync(DRAWS_PATH, 'utf8'));
  for (const r of Array.isArray(draws) ? draws : []) {
    const h = r && typeof r.yearly_fill_rates === 'object' && r.yearly_fill_rates ? r.yearly_fill_rates : {};
    for (const y of Object.keys(h)) {
      const n = Number.parseInt(y, 10);
      if (!Number.isInteger(n)) continue;
      embeddedHistoryObservations++;
      if (embeddedLatestYear == null || n > embeddedLatestYear) embeddedLatestYear = n;
      if (n === 2024) embedded2024++;
      if (n === 2025) embedded2025++;
    }
  }
}

const report = {
  schema_version: 1,
  generated_at: new Date().toISOString(),
  scope: 'source-freshness-and-schema-only',
  output_contract: 'No hunt identifiers, locations, success rates, rankings, or recommendations are emitted.',
  official_leh_survey: {
    http_status: res.status,
    row_count: records.length,
    min_year: minYear,
    max_year: maxYear,
    has_2024_rows: countsByYear['2024'] > 0,
    has_2025_rows: countsByYear['2025'] > 0,
    rows_in_2024: countsByYear['2024'] || 0,
    rows_in_2025: countsByYear['2025'] || 0,
    year_count: uniqueYears.length,
    schema_header_count: headers.length,
    schema_matches_expected: missingExpectedHeaders.length === 0,
    missing_expected_headers: missingExpectedHeaders,
    unexpected_headers: unexpectedHeaders
  },
  current_embedded_history: {
    observations: embeddedHistoryObservations,
    latest_year_label_present: embeddedLatestYear,
    observations_labelled_2024: embedded2024,
    observations_labelled_2025: embedded2025
  },
  conclusions: [
    maxYear != null ? `The verified LEH survey resource currently contains records through ${maxYear}.` : 'No usable survey years were found.',
    countsByYear['2024'] ? 'The verified resource contains 2024 rows.' : 'The verified resource does not contain 2024 rows.',
    countsByYear['2025'] ? 'The verified resource contains 2025 rows.' : 'The verified resource does not contain 2025 rows.',
    embeddedLatestYear && maxYear && embeddedLatestYear > maxYear
      ? 'The app contains history labels newer than the verified hunt-specific survey resource, so those newer values require separate provenance before they can be treated as the same metric.'
      : 'The app does not contain history labels newer than the verified hunt-specific survey resource.'
  ]
};

fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
