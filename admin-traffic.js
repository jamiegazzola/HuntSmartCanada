/* Source-specific traffic snapshots. No admin secrets, API keys, or personal data. */
(() => {
  'use strict';
  const report = document.createElement('section');
  report.className = 'hs-traffic';
  report.id = 'hsTrafficReport';
  report.setAttribute('aria-label','Traffic and engagement');
  report.innerHTML =
    '<div class="hs-traffic-head"><div>' +
      '<div class="hs-traffic-kicker">Traffic & engagement</div>' +
      '<h2 class="hs-traffic-title">Beyond registered accounts.</h2>' +
      '<p class="hs-traffic-description">Anonymous traffic, session engagement and recovered search history. ' +
      'Each number retains its own definition, source and date range.</p>' +
    '</div><span class="hs-traffic-freshness">Historical snapshots · not live counts</span></div>' +
    '<div class="hs-traffic-kpis" id="hsTrafficKpis"><p class="hs-traffic-caption">Loading verified snapshots…</p></div>' +
    '<div class="hs-traffic-panels">' +
      '<div class="hs-traffic-panel"><h3>Google Search acquisition</h3>' +
        '<p class="hs-traffic-caption">Old Netlify + current .ca property · June–November 2026 · partial first and last month</p>' +
        '<div class="hs-traffic-bars" id="hsTrafficBars"></div>' +
        '<div class="hs-traffic-legend"><span><i class="hs-traffic-swatch" style="background:var(--forest)"></i>Legacy Netlify</span>' +
          '<span><i class="hs-traffic-swatch" style="background:var(--gold)"></i>Current .ca</span></div>' +
      '</div>' +
      '<div class="hs-traffic-panel"><h3>What these numbers mean</h3>' +
        '<p class="hs-traffic-caption">Keep these sources separate to avoid inflated or misleading totals.</p>' +
        '<ul class="hs-traffic-notes" id="hsTrafficNotes"></ul>' +
        '<div class="hs-traffic-actions">' +
          '<a href="https://us.posthog.com/project/753105/web" target="_blank" rel="noopener noreferrer">Live PostHog</a>' +
          '<a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer">GA4</a>' +
          '<a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">Search Console</a>' +
        '</div>' +
      '</div>' +
    '</div>';

  function count(n) { return Math.round(n).toLocaleString('en-CA'); }
  function time(sec) {
    const n = Math.round(sec);
    return n >= 60 ? Math.floor(n / 60) + 'm ' + String(n % 60).padStart(2, '0') + 's' : n + 's';
  }
  function card(label, value, details) {
    const item = document.createElement('div');
    item.className = 'hs-traffic-kpi';
    const l = document.createElement('div');
    const v = document.createElement('div');
    const s = document.createElement('div');
    l.className = 'hs-traffic-kpi-label'; l.textContent = label;
    v.className = 'hs-traffic-kpi-value'; v.textContent = value;
    s.className = 'hs-traffic-kpi-sub'; s.textContent = details;
    item.append(l,v,s);
    return item;
  }
  function note(title, description) {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = title + ' ';
    li.append(strong, document.createTextNode(description));
    return li;
  }
  function render(data) {
    const s = data.sources.searchConsole;
    const ga = data.sources.ga4;
    const ph = data.sources.posthog;
    const summary = document.getElementById('hsTrafficKpis');
    summary.replaceChildren(
      card('Visitors · PostHog', count(ph.visitors), ph.range + ' · ' + count(ph.sessions) + ' sessions'),
      card('Avg session · PostHog', time(ph.averageSessionSeconds), ph.range + ' · measured session length'),
      card('Homepage users · GA4', count(ga.homepageActiveUsers), ga.range + ' · production homepage only'),
      card('Google Search clicks', count(s.clicks), s.range + ' · ' + count(s.impressions) + ' impressions')
    );
    const bars = document.getElementById('hsTrafficBars');
    bars.replaceChildren();
    const peak = Math.max(...s.months.map(m => m.legacy + m.current), 1);
    for (const m of s.months) {
      const line = document.createElement('div');
      line.className = 'hs-traffic-bar-row';
      const month = document.createElement('span');
      month.className = 'hs-traffic-bar-month';
      month.textContent = m.month + (m.partial ? '*' : '');
      const track = document.createElement('div');
      track.className = 'hs-traffic-bar-track';
      const old = document.createElement('span');
      old.className = 'hs-traffic-bar-old';
      old.style.width = (m.legacy / peak * 100) + '%';
      const current = document.createElement('span');
      current.className = 'hs-traffic-bar-new';
      current.style.width = (m.current / peak * 100) + '%';
      track.append(old, current);
      const total = document.createElement('span');
      total.className = 'hs-traffic-bar-number';
      total.textContent = count(m.legacy + m.current);
      line.append(month, track, total);
      bars.append(line);
    }
    const notes = document.getElementById('hsTrafficNotes');
    notes.replaceChildren(
      note('PostHog:', 'Recorded visitors and session duration since installation, not a six-month average. First-period snapshot; open PostHog for updated totals.'),
      note('GA4:', 'The homepage figure excludes preview hosts, but it is not a deduplicated count of all website visitors. ' +
        count(ga.homepageViews) + ' homepage pageviews; approximately ' + time(ga.homepageEngagedSeconds / ga.homepageActiveUsers) +
        ' of engaged homepage time per active user (not session duration).'),
      note('Search Console:', 'Combined search clicks from the two domains, not unique visitors or sessions; ' +
        count(s.legacyClicks) + ' old-domain clicks and ' + count(s.currentClicks) + ' new-domain clicks.'),
      note('Registered accounts:', 'Firebase counts remain in Users & Product below. Search clicks, visitors and accounts must not be added together.')
    );
    report.querySelector('.hs-traffic-freshness').textContent = 'Verified snapshots · ' + data.reportVersion;
  }
  async function init() {
    const main = document.querySelector('main');
    if (!main || document.getElementById('hsTrafficReport')) return;
    main.insertBefore(report, main.firstChild);
    try {
      const response = await fetch('/admin-traffic-data.json', {cache:'no-store'});
      if (!response.ok) throw new Error('Snapshot unavailable: HTTP ' + response.status);
      const data = await response.json();
      if (!data || !data.sources || !data.sources.searchConsole ||
          !data.sources.ga4 || !data.sources.posthog) throw new Error('Invalid traffic snapshot');
      render(data);
    } catch (error) {
      document.getElementById('hsTrafficKpis').innerHTML =
        '<p class="hs-traffic-error">Traffic snapshot unavailable. Use the source links below for current data.</p>';
      console.warn('[admin-traffic] snapshot unavailable', error);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
