'use strict';

// Pure-data production checks. No personal visitor identifiers or API secrets.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(process.cwd(), fs.existsSync('site/admin-traffic-data.json') ? 'site' : '.');
const read = filename => fs.readFileSync(path.join(root, filename), 'utf8');
const report = JSON.parse(read('admin-traffic-data.json'));
const gsc = report.sources?.searchConsole;
const ph = report.sources?.posthog;
const ga4 = report.sources?.ga4;
assert(gsc && ph && ga4, 'Missing required analytics data source');
assert(!Number.isNaN(Date.parse(report.lastUpdated)), 'Invalid analytics report timestamp');
assert(Array.isArray(gsc.months) && gsc.months.length >= 6, 'Missing historical Search Console months');
const sum = key => gsc.months.reduce((n, row) => n + row[key], 0);
assert.equal(sum('legacy'), gsc.legacyClicks, 'Legacy clicks mismatch');
assert.equal(sum('current'), gsc.currentClicks, 'Current-domain clicks mismatch');
assert.equal(sum('legacy') + sum('current'), gsc.clicks, 'Combined clicks mismatch');
assert.equal(sum('impressions'), gsc.impressions, 'Search impressions mismatch');
assert.equal(sum('legacyImpressions'), gsc.legacyImpressions, 'Legacy impressions mismatch');
assert.equal(sum('currentImpressions'), gsc.currentImpressions, 'Current impressions mismatch');
for (const row of gsc.months) {
  assert.equal(row.legacyImpressions + row.currentImpressions, row.impressions,
    'Month impressions do not reconcile: ' + row.month);
}
for (const [window, stats] of Object.entries(ph.windows || {})) {
  assert(['7d','30d'].includes(window), 'Unknown PostHog report window');
  for (const key of ['visitors','sessions','views','averageSessionSeconds','bounceRate']) {
    assert(typeof stats[key] === 'number' && Number.isFinite(stats[key]) && stats[key] >= 0,
      window + ' has an invalid ' + key);
  }
  assert(stats.bounceRate <= 1, 'Bounce rate must be a 0–1 fraction');
}
assert(ph.windows?.['7d'] && ph.windows?.['30d'], 'Both rolling time windows must exist');
for (const key of ['visitors','sessions','views']) {
  assert(ph.windows['7d'][key] <= ph.windows['30d'][key],
    'A 7-day count cannot exceed the overlapping 30-day count: ' + key);
}
assert(Number.isFinite(ga4.homepageActiveUsers) && ga4.homepageActiveUsers >= 0, 'Invalid GA4 metric');
const frontend = read('admin-traffic.js');
assert(frontend.includes('data-traffic-window') && frontend.includes('data-search-metric'),
  'Interactive range or chart controls missing');
assert(frontend.includes('View live analytics'), 'Live provider link not displayed');
const tracking = read('hs-analytics.js');
assert(tracking.includes("analyticsHost !== 'huntsmartcanada.ca'"), 'Production-only analytics guard missing');
assert(tracking.includes("'hunt_detail_view'") && tracking.includes("'map_tool_used'"),
  'Deliberate HuntSmart interaction events missing');
console.log('[HuntSmart analytics QA] validated sources, rolling windows, charts and privacy guards');
