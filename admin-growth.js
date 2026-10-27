import { initializeApp, getApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDgiLQD2MVdX-OoeviFpQSRPT6isZNJVVQ',
  authDomain: 'huntsmart-canada.firebaseapp.com',
  projectId: 'huntsmart-canada',
  storageBucket: 'huntsmart-canada.firebasestorage.app',
  messagingSenderId: '342472703908',
  appId: '1:342472703908:web:f9ca542982549d4e1d8b31',
  measurementId: 'G-VK3HNNDEW2'
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
let users = [];
let rangeDays = 30;

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function asDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function withinRange(user) {
  if (!rangeDays) return true;
  const created = asDate(user.createdAt);
  if (!created) return false;
  return Date.now() - created.getTime() <= rangeDays * 86400000;
}

function isPro(user) {
  const tier = String(user.subscriptionTier || '').toLowerCase();
  const status = String(user.subscriptionStatus || '').toLowerCase();
  return tier === 'pro_monthly' || tier === 'pro_annual' ||
    (status === 'active' && tier.startsWith('pro'));
}

function normalizedSource(user) {
  const raw = String(user.firstTouchSource || user.referralSource || 'direct').trim().toLowerCase();
  if (!raw || raw === 'direct' || raw === '(direct)') return 'Direct';
  if (raw.includes('google') && !raw.includes('ads')) return 'Google Organic';
  if (raw.includes('google_ads') || raw.includes('google ads')) return 'Google Ads';
  if (raw.includes('facebook') || raw === 'fb' || raw.includes('fb.com')) return 'Facebook';
  if (raw.includes('instagram')) return 'Instagram';
  if (raw.includes('youtube') || raw.includes('youtu.be')) return 'YouTube';
  if (raw.includes('reddit')) return 'Reddit';
  if (raw.includes('bing') && !raw.includes('ads')) return 'Bing Organic';
  if (raw.includes('microsoft_ads')) return 'Microsoft Ads';
  if (raw.includes('huntsmartcanada')) return 'Legacy internal referral';
  return raw.replace(/^www\./, '').replace(/(^|[-_.])\w/g, m => m.toUpperCase());
}

function articlePath(user) {
  const path = String(user.firstTouchPath || '').trim();
  return path.startsWith('/blog') ? path.replace(/\/+$/, '/') : '';
}

function articleLabel(path) {
  const labels = {
    '/blog/': 'Blog & Resources',
    '/blog/how-to-use-huntsmart-map/': 'How to Use the HuntSmart Map',
    '/blog/how-to-use-huntsmart/': 'How to Use HuntSmart Canada',
    '/blog/how-does-bc-leh-work/': 'How Does BC LEH Work?',
    '/blog/bc-leh-odds-guide/': 'BC LEH Odds Guide'
  };
  return labels[path] || path.replace(/^\/blog\/?/, '').replace(/\/$/, '').replace(/-/g, ' ') || 'Blog & Resources';
}

function formatDate(value) {
  const d = asDate(value);
  if (!d) return '—';
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

function pct(num, den) {
  return den ? `${Math.round(num / den * 100)}%` : '—';
}

function aggregate(list, keyFn) {
  const map = new Map();
  list.forEach(user => {
    const key = keyFn(user);
    if (!key) return;
    const row = map.get(key) || { key, signups: 0, pro: 0, latest: null };
    row.signups += 1;
    if (isPro(user)) row.pro += 1;
    const created = asDate(user.createdAt);
    if (created && (!row.latest || created > row.latest)) row.latest = created;
    map.set(key, row);
  });
  return Array.from(map.values()).sort((a, b) => b.signups - a.signups || b.pro - a.pro);
}

function mount() {
  const main = document.querySelector('main');
  if (!main || document.getElementById('hsGrowthIntelligence')) return;

  const section = document.createElement('section');
  section.id = 'hsGrowthIntelligence';
  section.className = 'hs-growth-intelligence';
  section.innerHTML = `
    <div class="hs-growth-head">
      <div>
        <div class="hs-growth-kicker">Growth & Content Intelligence</div>
        <div class="hs-growth-title">How HuntSmart is growing.</div>
        <div class="hs-growth-sub">Acquisition attribution, blog impact and account conversion — tied to the source and content that first brought each measured user to HuntSmart.</div>
      </div>
      <div class="hs-growth-range" aria-label="Growth dashboard timeframe">
        <button type="button" data-days="7">7 days</button>
        <button type="button" class="active" data-days="30">30 days</button>
        <button type="button" data-days="0">All time</button>
      </div>
    </div>

    <div class="hs-growth-takeaway">
      <div class="hs-growth-takeaway-label">2-minute takeaway</div>
      <p id="hsGrowthTakeaway">Loading acquisition and content attribution…</p>
    </div>

    <div class="hs-growth-cards">
      <div class="hs-growth-card featured"><div class="label">New accounts</div><div class="value" id="gNewAccounts">—</div><div class="detail" id="gNewAccountsDetail">selected period</div></div>
      <div class="hs-growth-card"><div class="label">Blog-attributed</div><div class="value green" id="gBlogAccounts">—</div><div class="detail">accounts whose first measured landing was blog content</div></div>
      <div class="hs-growth-card"><div class="label">Blog → Pro</div><div class="value" id="gBlogPro">—</div><div class="detail" id="gBlogProDetail">current Pro status</div></div>
      <div class="hs-growth-card"><div class="label">Attribution coverage</div><div class="value" id="gCoverage">—</div><div class="detail">accounts with first-touch source captured</div></div>
      <div class="hs-growth-card"><div class="label">Top signup source</div><div class="value" id="gTopSource" style="font-size:1.35rem;line-height:1.1">—</div><div class="detail" id="gTopSourceDetail">—</div></div>
      <div class="hs-growth-card"><div class="label">Top blog landing</div><div class="value" id="gTopBlog" style="font-size:1.15rem;line-height:1.15">—</div><div class="detail" id="gTopBlogDetail">—</div></div>
    </div>

    <div class="hs-growth-grid">
      <div class="hs-growth-panel">
        <div class="hs-growth-panel-head"><h3>Acquisition → Account</h3><span class="hs-growth-note">first measured source</span></div>
        <div class="hs-growth-table-wrap"><table class="hs-growth-table"><thead><tr><th>Source</th><th>Signups</th><th>Pro</th><th>Pro rate</th><th>Latest</th></tr></thead><tbody id="hsAcquisitionRows"></tbody></table></div>
      </div>
      <div class="hs-growth-panel">
        <div class="hs-growth-panel-head"><h3>Blog Impact → Account</h3><span class="hs-growth-note">first landing page</span></div>
        <div class="hs-growth-table-wrap"><table class="hs-growth-table"><thead><tr><th>Article</th><th>Signups</th><th>Pro</th><th>Pro rate</th><th>Latest</th></tr></thead><tbody id="hsBlogRows"></tbody></table></div>
      </div>
    </div>

    <div class="hs-growth-status">
      <div class="hs-growth-status-card"><i class="hs-growth-status-dot"></i><div><strong>GA4 event tracking active</strong><span>G-VK3HNNDEW2 · page views, blog views, blog→app clicks and interactive-map engagement are collected for anonymous traffic.</span></div></div>
      <div class="hs-growth-status-card"><i class="hs-growth-status-dot"></i><div><strong>First-touch attribution active</strong><span>Source, campaign and landing page persist across blog→app navigation and are saved when a user creates an account.</span></div></div>
      <div class="hs-growth-status-card"><i class="hs-growth-status-dot pending"></i><div><strong>Google Search Console</strong><span>Sitemap is ready. Search queries, impressions, clicks and ranking position will appear once the .ca property is verified and connected through Search Console/Windsor.</span></div></div>
    </div>
  `;

  main.insertBefore(section, main.firstChild);

  const oldStats = main.querySelector('.stats-grid');
  if (oldStats) {
    const heading = document.createElement('div');
    heading.className = 'hs-user-product-heading';
    heading.innerHTML = '<h2>Users & Product</h2><span>existing HuntSmart analytics</span>';
    oldStats.parentNode.insertBefore(heading, oldStats);
  }

  section.querySelectorAll('.hs-growth-range button').forEach(button => {
    button.addEventListener('click', () => {
      section.querySelectorAll('.hs-growth-range button').forEach(b => b.classList.remove('active'));
      button.classList.add('active');
      rangeDays = Number(button.dataset.days || 0);
      render();
    });
  });
}

function render() {
  const scoped = users.filter(withinRange);
  const measured = scoped.filter(u => u.firstTouchSource || u.referralSource);
  const blogUsers = scoped.filter(u => articlePath(u));
  const blogPro = blogUsers.filter(isPro);
  const sourceRows = aggregate(scoped, normalizedSource);
  const blogRows = aggregate(blogUsers, articlePath);
  const topSource = sourceRows[0];
  const topBlog = blogRows[0];

  document.getElementById('gNewAccounts').textContent = scoped.length.toLocaleString();
  document.getElementById('gNewAccountsDetail').textContent = rangeDays ? `created in the last ${rangeDays} days` : 'all measured accounts';
  document.getElementById('gBlogAccounts').textContent = blogUsers.length.toLocaleString();
  document.getElementById('gBlogPro').textContent = blogPro.length.toLocaleString();
  document.getElementById('gBlogProDetail').textContent = `${pct(blogPro.length, blogUsers.length)} of blog-attributed accounts are currently Pro`;
  document.getElementById('gCoverage').textContent = pct(measured.length, scoped.length);
  document.getElementById('gTopSource').textContent = topSource ? topSource.key : '—';
  document.getElementById('gTopSourceDetail').textContent = topSource ? `${topSource.signups} signup${topSource.signups === 1 ? '' : 's'} · ${topSource.pro} Pro` : 'No source data in this period';
  document.getElementById('gTopBlog').textContent = topBlog ? articleLabel(topBlog.key) : '—';
  document.getElementById('gTopBlogDetail').textContent = topBlog ? `${topBlog.signups} signup${topBlog.signups === 1 ? '' : 's'} · ${topBlog.pro} Pro` : 'Blog first-touch attribution starts with this release';

  const acquisitionBody = document.getElementById('hsAcquisitionRows');
  acquisitionBody.innerHTML = sourceRows.length ? sourceRows.slice(0, 10).map(row => `
    <tr><td class="primary-cell">${esc(row.key)}</td><td>${row.signups}</td><td>${row.pro}</td><td>${pct(row.pro, row.signups)}</td><td class="muted">${formatDate(row.latest)}</td></tr>`).join('') :
    '<tr><td colspan="5" class="hs-growth-empty">No acquisition data in this period.</td></tr>';

  const blogBody = document.getElementById('hsBlogRows');
  blogBody.innerHTML = blogRows.length ? blogRows.slice(0, 10).map(row => `
    <tr><td class="primary-cell">${esc(articleLabel(row.key))}<div class="muted" style="font-family:var(--mono);font-size:8px;margin-top:3px">${esc(row.key)}</div></td><td>${row.signups}</td><td>${row.pro}</td><td>${pct(row.pro, row.signups)}</td><td class="muted">${formatDate(row.latest)}</td></tr>`).join('') :
    '<tr><td colspan="5" class="hs-growth-empty">No blog-attributed signups yet. New first-touch tracking begins with this deployment.</td></tr>';

  let takeaway;
  if (!scoped.length) {
    takeaway = 'No accounts were created in the selected period. GA4 is still collecting anonymous traffic and blog engagement independently.';
  } else {
    const sourceText = topSource ? `${topSource.key} is the leading signup source with ${topSource.signups} account${topSource.signups === 1 ? '' : 's'}` : 'source attribution is still building';
    const blogText = topBlog ? `${articleLabel(topBlog.key)} is the leading blog landing page with ${topBlog.signups} attributed signup${topBlog.signups === 1 ? '' : 's'}` : 'blog-to-account attribution starts with this release';
    takeaway = `${scoped.length} account${scoped.length === 1 ? '' : 's'} joined ${rangeDays ? `in the last ${rangeDays} days` : 'across the measured period'}. ${sourceText}. ${blogText}. ${blogPro.length ? `${blogPro.length} blog-attributed account${blogPro.length === 1 ? '' : 's'} ${blogPro.length === 1 ? 'is' : 'are'} currently Pro.` : ''}`;
  }
  document.getElementById('hsGrowthTakeaway').textContent = takeaway.trim();
}

async function loadGrowth() {
  mount();
  try {
    const snap = await getDocs(collection(db, 'users'));
    users = snap.docs.map(docSnap => ({ uid: docSnap.id, ...docSnap.data() }));
    render();
  } catch (error) {
    console.warn('[admin-growth] could not read users', error);
    const takeaway = document.getElementById('hsGrowthTakeaway');
    if (takeaway) takeaway.textContent = 'Growth attribution is instrumented, but this browser cannot read the aggregate user collection. Existing Firestore admin-read access must be available for the dashboard to populate.';
    ['hsAcquisitionRows', 'hsBlogRows'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<tr><td colspan="5" class="hs-growth-empty">Aggregate data unavailable in this session.</td></tr>';
    });
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadGrowth);
else loadGrowth();
