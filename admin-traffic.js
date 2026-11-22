/* HuntSmart Analytics Archive.
   Aggregated, dated metrics only. Provider dashboards are the live source of truth.
   No provider keys, access tokens, email addresses or account IDs in browser code. */
(() => {
  'use strict';

  const POSTHOG_URL = 'https://us.posthog.com/project/753105/dashboard/2385147';
  const section = document.createElement('section');
  section.id = 'hsTrafficReport';
  section.className = 'hs-traffic';
  section.setAttribute('aria-label', 'Traffic and engagement');
  section.innerHTML = [
    '<div class="hs-traffic-head">',
      '<div><div class="hs-traffic-kicker">Traffic & engagement</div>',
        '<h2 class="hs-traffic-title">How hunters use HuntSmart.</h2>',
        '<p class="hs-traffic-description">Website audience, session quality and historical search discovery.',
        ' Anonymous visitors and Firebase members are reported separately.</p>',
      '</div>',
      '<div class="hs-traffic-head-actions">',
        '<a class="hs-traffic-live" href="' + POSTHOG_URL + '" target="_blank" rel="noopener noreferrer">',
          'View live analytics <span aria-hidden="true">↗</span></a>',
        '<span class="hs-traffic-freshness" id="hsTrafficFreshness">Loading archive…</span>',
      '</div>',
    '</div>',
    '<div class="hs-traffic-toolbar" aria-label="Visitor analytics period">',
      '<div class="hs-traffic-switch"><span class="hs-traffic-switch-label">Recent traffic</span>',
        '<button type="button" class="active" data-traffic-window="7d" aria-pressed="true">7 days</button>',
        '<button type="button" data-traffic-window="30d" aria-pressed="false">30 days</button>',
      '</div>',
      '<span class="hs-traffic-source"><span class="hs-traffic-source-dot"></span> PostHog · dated archive</span>',
    '</div>',
    '<div class="hs-traffic-kpis" id="hsTrafficKpis" aria-live="polite">',
      '<p class="hs-traffic-caption">Loading traffic report…</p>',
    '</div>',
    '<div class="hs-traffic-panels">',
      '<div class="hs-traffic-panel">',
        '<div class="hs-traffic-panel-title"><div><h3>Google Search history</h3>',
          '<p class="hs-traffic-caption">Both verified domains, combined. Search clicks are not website visitors.</p></div>',
          '<div class="hs-traffic-chart-actions">',
            '<button type="button" class="active" data-search-metric="clicks" aria-pressed="true">Clicks</button>',
            '<button type="button" data-search-metric="impressions" aria-pressed="false">Impressions</button>',
          '</div>',
        '</div>',
        '<div class="hs-traffic-bars" id="hsTrafficBars" aria-label="Monthly Google Search performance"></div>',
        '<div class="hs-traffic-legend" id="hsTrafficLegend"></div>',
        '<div class="hs-traffic-chart-footer"><span>* Partial month: June 21–30 or November 1–18.</span>',
          '<button type="button" id="hsTrafficExport">Export CSV</button></div>',
      '</div>',
      '<div class="hs-traffic-panel">',
        '<h3>How to read this dashboard</h3>',
        '<p class="hs-traffic-caption">Different services measure different user behaviours.</p>',
        '<ul class="hs-traffic-notes" id="hsTrafficNotes"></ul>',
        '<div class="hs-traffic-actions">',
          '<a href="' + POSTHOG_URL + '" target="_blank" rel="noopener noreferrer">PostHog · live</a>',
          '<a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer">Google Analytics</a>',
          '<a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">Search Console</a>',
        '</div>',
      '</div>',
    '</div>'
  ].join('');

  let data = null;
  let currentWindow = '7d';
  let currentSearchMetric = 'clicks';

  function formatNumber(n) {
    return Number.isFinite(Number(n)) ? Number(n).toLocaleString('en-CA', {maximumFractionDigits: 0}) : '—';
  }
  function formatDuration(sec) {
    if (!Number.isFinite(sec)) return '—';
    const value = Math.round(sec);
    return Math.floor(value / 60) + 'm ' + String(value % 60).padStart(2, '0') + 's';
  }
  function tile(label, value, detail) {
    const element = document.createElement('div');
    element.className = 'hs-traffic-kpi';
    for (const [className, content] of [
      ['hs-traffic-kpi-label', label],
      ['hs-traffic-kpi-value', value],
      ['hs-traffic-kpi-sub', detail]
    ]) {
      const el = document.createElement('div');
      el.className = className;
      el.textContent = content;
      element.appendChild(el);
    }
    return element;
  }
  function note(label, detail) {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = label + ' ';
    li.appendChild(strong);
    li.appendChild(document.createTextNode(detail));
    return li;
  }
  function getWindow() {
    const ph = data.sources.posthog;
    if (ph.windows && ph.windows[currentWindow]) return ph.windows[currentWindow];
    // Fallback for the original pre-sync report.
    return ph;
  }
  function renderKpis() {
    const ph = getWindow();
    const ga4 = data.sources.ga4;
    const search = data.sources.searchConsole;
    const kpis = section.querySelector('#hsTrafficKpis');
    kpis.replaceChildren(
      tile('Website visitors', formatNumber(ph.visitors), 'PostHog · anonymous + logged-in, ' + currentWindow),
      tile('Sessions', formatNumber(ph.sessions), 'PostHog · ' + currentWindow),
      tile('Average session', formatDuration(Number(ph.averageSessionSeconds)), 'PostHog · ' + currentWindow),
      tile('Bounce rate', Number.isFinite(ph.bounceRate) ? (ph.bounceRate * 100).toFixed(1) + '%' : '—', 'PostHog · ' + currentWindow),
      tile('GA4 homepage users', formatNumber(ga4.homepageActiveUsers), ga4.range + ' · production homepage only'),
      tile('Organic Google clicks', formatNumber(search.clicks), search.range + ' · ' + formatNumber(search.impressions) + ' impressions')
    );
    section.querySelectorAll('[data-traffic-window]').forEach(b => {
      const selected = b.dataset.trafficWindow === currentWindow;
      b.classList.toggle('active', selected);
      b.setAttribute('aria-pressed', String(selected));
    });
  }
  function renderSearch() {
    const search = data.sources.searchConsole;
    const months = search.months;
    const impressions = currentSearchMetric === 'impressions';
    const values = months.map(m => impressions ? m.impressions : m.legacy + m.current);
    const peak = Math.max(1, ...values);
    const chart = section.querySelector('#hsTrafficBars');
    chart.replaceChildren();

    months.forEach((m, i) => {
      const row = document.createElement('div');
      row.className = 'hs-traffic-bar-row';
      row.setAttribute('title', m.month + ': ' + values[i] + (impressions ? ' impressions' : ' Google clicks'));
      const month = document.createElement('span');
      month.className = 'hs-traffic-bar-month';
      month.textContent = m.month + (m.partial ? '*' : '');
      const track = document.createElement('div');
      track.className = 'hs-traffic-bar-track';
      const legacyAmount = impressions ? m.legacyImpressions : m.legacy;
      const currentAmount = impressions ? m.currentImpressions : m.current;
      const old = document.createElement('span');
      const fresh = document.createElement('span');
      old.className = 'hs-traffic-bar-old';
      fresh.className = 'hs-traffic-bar-new';
      old.style.width = (100 * legacyAmount / peak) + '%';
      fresh.style.width = (100 * currentAmount / peak) + '%';
      track.append(old, fresh);
      const number = document.createElement('span');
      number.className = 'hs-traffic-bar-number';
      number.textContent = formatNumber(values[i]);
      row.append(month, track, number);
      chart.appendChild(row);
    });

    const legend = section.querySelector('#hsTrafficLegend');
    legend.replaceChildren();
    const entries = [['Legacy Netlify', 'var(--forest)'], ['Current .ca', 'var(--gold)']];
    entries.forEach(([label, colour]) => {
      const el = document.createElement('span');
      const swatch = document.createElement('i');
      swatch.className = 'hs-traffic-swatch';
      swatch.style.background = colour;
      el.append(swatch, document.createTextNode(label));
      legend.appendChild(el);
    });
    section.querySelectorAll('[data-search-metric]').forEach(b => {
      const selected = b.dataset.searchMetric === currentSearchMetric;
      b.classList.toggle('active', selected);
      b.setAttribute('aria-pressed', String(selected));
    });
  }
  function renderNotes() {
    const ga4 = data.sources.ga4;
    const ph = data.sources.posthog;
    const search = data.sources.searchConsole;
    section.querySelector('#hsTrafficNotes').replaceChildren(
      note('Visitors:', 'PostHog counts browser identifiers, including people who never log in. Counts begin ' + (ph.firstTracked || 'at installation') + '.'),
      note('Session duration:', 'An average session is not the same as GA4 engaged time. Very short or one-event sessions can affect both metrics.'),
      note('Search clicks:', 'Google search referrals across the legacy Netlify and current .ca domains. ' +
        formatNumber(search.legacyClicks) + ' old-domain + ' + formatNumber(search.currentClicks) + ' current-domain clicks.'),
      note('Registered accounts:', 'Firebase registrations and subscription data are in Users & Product below; they are not visitor counts.'),
      note('Data quality:', 'Traffic snapshots exclude configured test accounts where possible, but development activity may remain. Open PostHog for current results.')
    );
    const label = section.querySelector('#hsTrafficFreshness');
    const rawDate = data.lastUpdated || data.reportVersion;
    const timestamp = new Date(rawDate);
    const valid = !Number.isNaN(timestamp.getTime());
    const formatted = valid ? timestamp.toLocaleDateString('en-CA',
      {timeZone:'America/Vancouver',month:'short',day:'numeric',year:'numeric'}) : rawDate;
    label.textContent = 'Snapshot: ' + formatted;
    const age = valid ? Date.now() - timestamp.getTime() : null;
    label.classList.toggle('stale', Number.isFinite(age) && age > 48 * 3600 * 1000);
  }
  function exportCsv() {
    if (!data) return;
    const rows = [['Month', 'Legacy Netlify clicks', 'Current .ca clicks', 'Combined clicks',
      'Legacy impressions', 'Current impressions', 'Combined impressions']];
    data.sources.searchConsole.months.forEach(m => rows.push(
      [m.month, m.legacy, m.current, m.legacy + m.current,
        m.legacyImpressions, m.currentImpressions, m.impressions]
    ));
    const csv = rows.map(row => row.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\r\n') + '\r\n';
    const url = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'huntsmart-search-history-2026.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
  async function init() {
    const main = document.querySelector('main');
    if (!main || document.getElementById('hsTrafficReport')) return;
    main.insertBefore(section, main.firstChild);
    section.querySelectorAll('[data-traffic-window]').forEach(b => b.addEventListener('click', () => {
      if (!data) return;
      currentWindow = b.dataset.trafficWindow;
      renderKpis();
    }));
    section.querySelectorAll('[data-search-metric]').forEach(b => b.addEventListener('click', () => {
      if (!data) return;
      currentSearchMetric = b.dataset.searchMetric;
      renderSearch();
    }));
    section.querySelector('#hsTrafficExport').addEventListener('click', exportCsv);
    try {
      const response = await fetch('/admin-traffic-data.json', {cache:'no-store'});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const archive = await response.json();
      if (!archive?.sources?.searchConsole || !archive.sources.ga4 || !archive.sources.posthog) {
        throw new Error('Missing analytics sources');
      }
      data = archive;
      renderKpis();
      renderSearch();
      renderNotes();
    } catch (error) {
      const kpis = section.querySelector('#hsTrafficKpis');
      const warning = document.createElement('p');
      warning.className = 'hs-traffic-error';
      warning.textContent = 'Analytics archive unavailable. Use the live PostHog link to check current traffic.';
      kpis.replaceChildren(warning);
      section.querySelector('#hsTrafficFreshness').textContent = 'Archive unavailable';
      console.warn('[admin-traffic] report unavailable', error);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();