#!/usr/bin/env node

/**
 * HuntSmart BC data-integrity audit.
 *
 * This script intentionally emits aggregate QA only. It does not output hunt
 * identifiers, names, codes, MUs, success rates, rankings, or recommendations.
 *
 * Usage:
 *   node scripts/audit-bc-data-integrity.mjs [draws.json] [report.json]
 */

import fs from 'node:fs';
import path from 'node:path';

const inputPath = process.argv[2] || 'draws.json';
const outputPath = process.argv[3] || 'bc-data-integrity-report.json';

function fail(message) {
  console.error(`[audit] ${message}`);
  process.exit(1);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function numeric(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function round(value, digits = 4) {
  const p = 10 ** digits;
  return Math.round((value + Number.EPSILON) * p) / p;
}

function increment(obj, key, amount = 1) {
  obj[key] = (obj[key] || 0) + amount;
}

function sortedNumericObject(obj) {
  return Object.fromEntries(
    Object.entries(obj).sort((a, b) => Number(a[0]) - Number(b[0]))
  );
}

function normalizeHistoryValue(raw) {
  const n = numeric(raw);
  if (n === null) return { valid: false, scale: 'invalid', normalized: null };
  if (n < 0) return { valid: false, scale: 'negative', normalized: null };
  if (n <= 1) return { valid: true, scale: 'fraction', normalized: n };
  if (n <= 100) return { valid: true, scale: 'percent', normalized: n / 100 };
  return { valid: false, scale: 'over-100', normalized: null };
}

let raw;
try {
  raw = fs.readFileSync(inputPath, 'utf8');
} catch (err) {
  fail(`Cannot read ${inputPath}: ${err.message}`);
}

let rows;
try {
  rows = JSON.parse(raw);
} catch (err) {
  fail(`Invalid JSON in ${inputPath}: ${err.message}`);
}

if (!Array.isArray(rows)) fail(`${inputPath} must contain a top-level JSON array`);

const coverageHistogram = {};
const observationYearHistogram = {};
const fieldPresence = {
  yearly_fill_rates: 0,
  fill_rate_years: 0,
  fill_rate_alltime: 0,
  harvest_match_confidence: 0,
  harvest_match_method: 0,
  actual_results_match: 0,
  actual_results_match_reason: 0,
};

let malformedHistoryObjects = 0;
let totalHistoryObservations = 0;
let zeroObservations = 0;
let invalidObservationValues = 0;
let invalidYearKeys = 0;
let mixedScaleHistories = 0;
let fillRateYearsMismatch = 0;
let storedAverageMismatch = 0;
let storedAverageUncheckable = 0;
let duplicateCurrentIdentityRows = 0;
let rowsWithDuplicateYearKeysImpossibleToRepresent = 0;
let rowsWithAtLeastOneHistoryValue = 0;
let rowsWithNoHistory = 0;
let rowsWithHistoryGaps = 0;
let totalInternalMissingYears = 0;
let rowsWithFutureHistoryYears = 0;
let rowsWithPre1980HistoryYears = 0;

// Duplicate detection is performed internally, but identities are never emitted.
const currentIdentityCounts = new Map();

for (const row of rows) {
  if (!isObject(row)) continue;

  for (const field of Object.keys(fieldPresence)) {
    if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
      fieldPresence[field] += 1;
    }
  }

  const identity = JSON.stringify([
    row.Species ?? null,
    row.MU ?? null,
    row.Code ?? null,
    row.Zone ?? null,
    row.Class ?? null,
    row.Season ?? null,
  ]);
  currentIdentityCounts.set(identity, (currentIdentityCounts.get(identity) || 0) + 1);

  const hist = row.yearly_fill_rates;
  if (hist === undefined || hist === null) {
    rowsWithNoHistory += 1;
    increment(coverageHistogram, '0');
    continue;
  }
  if (!isObject(hist)) {
    malformedHistoryObjects += 1;
    rowsWithNoHistory += 1;
    increment(coverageHistogram, '0');
    continue;
  }

  const entries = Object.entries(hist);
  increment(coverageHistogram, String(entries.length));

  if (entries.length === 0) {
    rowsWithNoHistory += 1;
  } else {
    rowsWithAtLeastOneHistoryValue += 1;
  }

  const validYears = [];
  const scales = new Set();
  const normalizedValues = [];

  for (const [yearRaw, valueRaw] of entries) {
    totalHistoryObservations += 1;

    const year = Number(yearRaw);
    if (!/^\d{4}$/.test(String(yearRaw)) || !Number.isInteger(year)) {
      invalidYearKeys += 1;
    } else {
      validYears.push(year);
      increment(observationYearHistogram, String(year));
      if (year > new Date().getFullYear()) rowsWithFutureHistoryYears += 1;
      if (year < 1980) rowsWithPre1980HistoryYears += 1;
    }

    const parsed = normalizeHistoryValue(valueRaw);
    if (!parsed.valid) {
      invalidObservationValues += 1;
      continue;
    }
    scales.add(parsed.scale);
    normalizedValues.push(parsed.normalized);
    if (parsed.normalized === 0) zeroObservations += 1;
  }

  if (scales.size > 1) mixedScaleHistories += 1;

  const storedYears = numeric(row.fill_rate_years);
  if (storedYears !== null && storedYears !== entries.length) {
    fillRateYearsMismatch += 1;
  }

  const storedAverageRaw = numeric(row.fill_rate_alltime);
  if (storedAverageRaw !== null && normalizedValues.length > 0) {
    const storedParsed = normalizeHistoryValue(storedAverageRaw);
    if (!storedParsed.valid) {
      storedAverageUncheckable += 1;
    } else {
      const recomputed = normalizedValues.reduce((a, b) => a + b, 0) / normalizedValues.length;
      // Tolerance accounts for stored values rounded to three decimals.
      if (Math.abs(storedParsed.normalized - recomputed) > 0.005) {
        storedAverageMismatch += 1;
      }
    }
  } else if (storedAverageRaw !== null) {
    storedAverageUncheckable += 1;
  }

  if (validYears.length >= 2) {
    const minYear = Math.min(...validYears);
    const maxYear = Math.max(...validYears);
    const uniqueYears = new Set(validYears).size;
    const internalMissing = Math.max(0, (maxYear - minYear + 1) - uniqueYears);
    if (internalMissing > 0) {
      rowsWithHistoryGaps += 1;
      totalInternalMissingYears += internalMissing;
    }
  }

  // JSON objects cannot retain duplicate property names after parsing; this
  // metric is kept explicit in the report so callers know this limitation.
  rowsWithDuplicateYearKeysImpossibleToRepresent += 0;
}

for (const count of currentIdentityCounts.values()) {
  if (count > 1) duplicateCurrentIdentityRows += count;
}

const coverageCounts = Object.fromEntries(
  Object.entries(coverageHistogram).sort((a, b) => Number(a[0]) - Number(b[0]))
);

function countAtLeast(n) {
  return Object.entries(coverageHistogram)
    .filter(([years]) => Number(years) >= n)
    .reduce((sum, [, count]) => sum + count, 0);
}

const totalRows = rows.length;
const pct = n => totalRows ? round((n / totalRows) * 100, 2) : 0;

const report = {
  schema_version: 1,
  generated_at: new Date().toISOString(),
  source_file: path.basename(inputPath),
  scope: 'aggregate-data-integrity-only',
  privacy_note: 'No hunt identifiers, codes, management units, success rates, rankings, or recommendations are emitted.',
  totals: {
    records: totalRows,
    records_with_history: rowsWithAtLeastOneHistoryValue,
    records_without_history: rowsWithNoHistory,
    history_observations: totalHistoryObservations,
    zero_value_observations: zeroObservations,
  },
  coverage: {
    records_by_number_of_history_years: coverageCounts,
    records_with_at_least_2_years: countAtLeast(2),
    records_with_at_least_5_years: countAtLeast(5),
    records_with_at_least_10_years: countAtLeast(10),
    records_with_at_least_15_years: countAtLeast(15),
    pct_with_at_least_5_years: pct(countAtLeast(5)),
    pct_with_at_least_10_years: pct(countAtLeast(10)),
    observation_count_by_year: sortedNumericObject(observationYearHistogram),
    records_with_internal_history_gaps: rowsWithHistoryGaps,
    total_internal_missing_year_slots: totalInternalMissingYears,
  },
  integrity_findings: {
    malformed_yearly_fill_rates: malformedHistoryObjects,
    invalid_history_year_keys: invalidYearKeys,
    invalid_history_values: invalidObservationValues,
    histories_with_mixed_fraction_and_percent_scales: mixedScaleHistories,
    fill_rate_years_count_mismatches: fillRateYearsMismatch,
    fill_rate_alltime_recompute_mismatches: storedAverageMismatch,
    fill_rate_alltime_uncheckable: storedAverageUncheckable,
    duplicate_current_identity_rows: duplicateCurrentIdentityRows,
    future_year_occurrences: rowsWithFutureHistoryYears,
    pre_1980_year_occurrences: rowsWithPre1980HistoryYears,
    duplicate_year_keys_after_json_parse: rowsWithDuplicateYearKeysImpossibleToRepresent,
  },
  provenance_field_presence: fieldPresence,
  notes: [
    'A zero-valued observation is counted as an explicit observation, not as missing data.',
    'Missing calendar years are measured only between the earliest and latest year already present for a record; this does not assert that the hunt existed in those missing years.',
    'Average checks normalize 0..1 fractions and 0..100 percentages before comparison.',
    'This audit does not create or infer historical lineages and does not alter draws.json.',
  ],
};

try {
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n');
} catch (err) {
  fail(`Cannot write ${outputPath}: ${err.message}`);
}

console.log(JSON.stringify(report, null, 2));
