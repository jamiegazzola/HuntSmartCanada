const ODDS_STEPS = [0,1,2,5,10,20,50,75];
const MU_NAMES = {1:"Vancouver Island",2:"Lower Mainland",3:"Thompson",4:"Kootenay",5:"Cariboo",6:"Skeena",7:"Omineca / Peace",8:"Okanagan"};

// ── MAIN STATE ──
let selSpecies = new Set();
let selClass = new Set();
let selMUs = new Set();
let selMUsFull = new Set(); // full BC WMU IDs like '4-01' for map filter
let selSpecialTags = new Set(); // 'shared' | 'archery'
let selSeasonFrom = ''; // YYYY-MM-DD from sidebar date filter
let selSeasonTo = '';   // YYYY-MM-DD from sidebar date filter

// ── BC MAP STATE ──
let bcMapOpen = false;
let bcMapInitialized = false;
let bcLeafletMapInstance = null;
let bcWmuGeoLayer = null;
let bcWmuGeoJSON = null;
const BC_WMU_GEOJSON_URL = 'https://raw.githubusercontent.com/jamiegazzola/HuntSmartCanada/main/bc_wmu.geojson';
let selMinOdds = 0;
let selMinHarvest = 0;
let sortMode = 'odds';
let filtered = [];

// ── FILTER PAGE STATE ──
let fpSelSpecies = new Set();
let fpSelClass = new Set();
let fpSelMUs = new Set();
let fpMinOdds = 0;
let fpMinHarvest = 0;
const FP_HARVEST_STEPS = [0,10,20,30,40,50,60,70];
let abFpMinHarvest = 0;

// ── BAP / MANAGEMENT AREA FILTER STATE ──
let selAreas = new Set(); // applied from filter page fpSelBap

// ── BC ACTUAL ODDS ────────────────────────────────────────────────────────────
// Use actual draw success % from data catalogue rather than synopsis odds ratio.
// 2025 results are incomplete (draw just ran), so 2024 is the last reliable year.
const BC_ACTUAL_ODDS_YEAR = 2025;

function getBCActualOdds(r) {
  if (isNewSynopsisHunt(r)) return null;
  // Prefer the restored actual-results percentage on the row. Some yearly values are
  // rounded to 0.0 in source history for ultra-low odds (ex: 6002), which is misleading.
  const pct = parseFloat(r['%']);
  if (isFinite(pct) && pct > 0) return pct;
  const ydo = r.yearly_draw_odds || {};
  const yv = ydo[BC_ACTUAL_ODDS_YEAR] !== undefined ? parseFloat(ydo[BC_ACTUAL_ODDS_YEAR]) : NaN;
  if (isFinite(yv) && yv > 0) return yv;
  if (isFinite(pct)) return pct;
  const years = Object.keys(ydo).map(Number).filter(y => y <= BC_ACTUAL_ODDS_YEAR).sort((a,b)=>b-a);
  for (const y of years) {
    const v = parseFloat(ydo[y]);
    if (isFinite(v) && v > 0) return v;
  }
  return years.length > 0 ? parseFloat(ydo[years[0]]) : null;
}

function padHuntCode(code) {
  const s = String(code ?? '').trim();
  return /^\d+$/.test(s) ? s.padStart(4, '0') : s;
}

function bcDrawStableKey(r) {
  if (!r) return '';
  const parts = [r.Species, padHuntCode(r.Code), r.MU, r.Zone, r.Season];
  return parts.map(v => String(v ?? '').trim()).join('_').replace(/[\s\/\\'"]/g, '_');
}

function bcDrawLegacyKey(r) {
  if (!r) return '';
  return (String(r.Species || '') + '_' + String(r.Class || '') + '_' + String(r.MU || '')).replace(/[\s\/\\'"]/g, '_');
}

function bcSavedMatchesDraw(saved, r) {
  if (!saved || !r) return false;
  const savedCode = padHuntCode(saved.Code);
  const drawCode = padHuntCode(r.Code);
  if (saved._key && (saved._key === bcDrawStableKey(r) || saved._key === bcDrawLegacyKey(r))) return true;
  if (savedCode && drawCode && savedCode === drawCode) {
    const sameSpecies = !saved.Species || !r.Species || String(saved.Species) === String(r.Species);
    const sameMU = !saved.MU || !r.MU || String(saved.MU) === String(r.MU);
    return sameSpecies && sameMU;
  }
  return false;
}

function isNewSynopsisHunt(r) {
  if (!r) return false;
  const odds = String(r.Odds ?? '').trim().toUpperCase();
  return r.is_new === true || odds === 'N/A' || odds === 'NA';
}

function bcOddsForChart(r) {
  if (isNewSynopsisHunt(r)) return {};
  const ydo = r.yearly_draw_odds || {};
  return Object.fromEntries(Object.entries(ydo).filter(([y]) => parseInt(y) <= BC_ACTUAL_ODDS_YEAR));
}

// ── CHART VIEW STATE (10yr vs all-time toggle) ──
const _chartViewState = new Map(); // chartId → 'ten' | 'all'
(function injectChartToggleCSS() {
  if (document.getElementById('chart-toggle-css')) return;
  const s = document.createElement('style');
  s.id = 'chart-toggle-css';
  s.textContent = `
    .chart-toggle-wrap { position: relative; }
    .chart-toggle-pills {
      position: absolute; top: 2px; right: 0;
      display: flex; gap: 2px; z-index: 2;
    }
    .chart-toggle-btn {
      font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
      padding: 2px 7px; border-radius: 20px; border: 1px solid var(--border);
      background: transparent; color: var(--text-muted);
      cursor: pointer; transition: background 0.15s, color 0.15s, border-color 0.15s;
      font-family: 'DM Sans', sans-serif;
    }
    .chart-toggle-btn:hover { border-color: var(--text-secondary); color: var(--text-secondary); }
    .chart-toggle-btn.active {
      background: var(--accent, #c47a1a); border-color: var(--accent, #c47a1a);
      color: #fff;
    }
  `;
  (document.head || document.documentElement).appendChild(s);
})();

// ── SAVED DRAWS STATE ──
let savedDraws = JSON.parse(localStorage.getItem('huntodds_saved') || '[]');
let abSavedDraws = JSON.parse(localStorage.getItem('huntodds_ab_saved') || '[]');
let compareMode = false;
let compareSelected = new Set();

// ── STAR / SAVE — BC ─────────────────────────────────────────
function isStarred(r) {
  if (!r) return false;
  return savedDraws.some(s => bcSavedMatchesDraw(s, r));
}

function toggleStar(i) {
  const r = filtered[i];
  if (!r) return;
  const key = bcDrawStableKey(r);
  const idx = savedDraws.findIndex(s => bcSavedMatchesDraw(s, r));
  if (idx >= 0) {
    savedDraws.splice(idx, 1);
    import('./sync.js').then(m => m.syncRemoveBCDraw(key));
  } else {
    const entry = { ...r, _key: key };
    savedDraws.push(entry);
    import('./sync.js').then(m => m.syncSaveBCDraw(entry));
  }
  localStorage.setItem('huntodds_saved', JSON.stringify(savedDraws));
  updateSavedBadge();
  const btn = document.querySelector(`.star-btn[onclick*="toggleStar(${i})"]`);
  if (btn) btn.classList.toggle('starred', idx < 0);
}


// ── PAGE NAV ──
function showPage(page) {
  const pages = ['homePage','filterPage','drawsPage','savedPage','mapPage',
                 'abProfilePage','abFilterPage','abDrawsPage','drawDetailPage',
                 'bcOpenSeasonsPage'];
  pages.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const map = {
    home:'homePage', filter:'filterPage', draws:'drawsPage',
    saved:'savedPage', map:'mapPage',
    abProfile:'abProfilePage', abFilter:'abFilterPage', abDraws:'abDrawsPage',
    drawDetail:'drawDetailPage',
    bcOpenSeasons:'bcOpenSeasonsPage'
  };
  if (map[page]) { const el = document.getElementById(map[page]); if(el) el.style.display='block'; }

  // Desktop nav active states
  document.getElementById('navHome').classList.toggle('active', page==='home');
  const navBC = document.getElementById('navBC');
  if(navBC) navBC.classList.toggle('active', page==='filter'||page==='draws');
  const navBCOS = document.getElementById('navBCOS');
  if(navBCOS) navBCOS.classList.toggle('active', page==='bcOpenSeasons');
  const navMap = document.getElementById('navMap');
  if(navMap) navMap.classList.toggle('active', page==='map');
  const navAB = document.getElementById('navAlberta');
  if(navAB) navAB.classList.toggle('active', page==='abProfile'||page==='abFilter'||page==='abDraws');
  document.getElementById('navSaved').classList.toggle('active', page==='saved');

  // Mobile nav active states
  const mNavHome = document.getElementById('mNavHome');
  const mNavBC = document.getElementById('mNavBC');
  const mNavAB = document.getElementById('mNavAlberta');
  const mNavSaved = document.getElementById('mNavSaved');
  if(mNavHome) mNavHome.classList.toggle('active', page==='home');
  if(mNavBC) mNavBC.classList.toggle('active', page==='filter'||page==='draws');
  const mNavBCOS = document.getElementById('mNavBCOS');
  if(mNavBCOS) mNavBCOS.classList.toggle('active', page==='bcOpenSeasons');
  const mNavMap = document.getElementById('mNavMap');
  if(mNavMap) mNavMap.classList.toggle('active', page==='map');
  if(mNavAB) mNavAB.classList.toggle('active', page==='abProfile'||page==='abFilter'||page==='abDraws');
  if(mNavSaved) mNavSaved.classList.toggle('active', page==='saved');

  // Close hamburger menu
  closeNavMenu();

  if (page==='filter') { fpBuildChips(); fpBuildClassChips(); fpBuildMU(); fpBuildBapChips(); fpUpdateCta(); }
  if (page==='draws') { buildMUList(); buildSpeciesChips(); buildClassChips(); buildSpecialTagChips(); loadWriteups().then(()=>applyFilters()); applyFilters(); _trackBCSearch('filter_bc'); }
  if (page==='saved') renderSavedPage();
  if (page==='map') { fullMapInit(); setTimeout(() => checkMobile(), 50); _trackBCSearch('map_main'); }
  if (page==='abProfile') renderAbProfilePage();
  if (page==='abFilter') {
    Promise.all([loadABData(),loadABHarvest(),loadABElkHistory(),loadABMooseHistory(),loadABMuleDeerHistory(),loadABAntelopeHistory(),loadABWTDeerHistory(),loadABBisonHistory()]).then(()=>{
      abFpBuildChips(); abFpBuildClassChips(); abFpBuildWMU(); abFpUpdateCount();
    });
  }
  if (page==='abDraws') {
    Promise.all([loadABData(),loadABHarvest(),loadABElkHistory(),loadABMooseHistory(),loadABMuleDeerHistory(),loadABAntelopeHistory(),loadABWTDeerHistory(),loadABBisonHistory()]).then(()=>{
      abApplyFilters();
      const _s = typeof abSelSpecies !== 'undefined' && abSelSpecies.size === 1 ? [...abSelSpecies][0] : 'All';
      if (window.HS && window.HS.trackSearch) window.HS.trackSearch('AB', _s, 'map_ab');
    });
    setTimeout(() => checkMobile(), 50);
  }
  if (page==='compare') renderComparePage();
  if (page==='bcOpenSeasons') { if (typeof initOpenSeasonsPage === 'function') initOpenSeasonsPage(); }
  window.scrollTo(0,0);
}

function goToAlberta() {
  Promise.all([loadABData(),loadABHarvest(),loadABElkHistory(),loadABMooseHistory(),loadABMuleDeerHistory(),loadABAntelopeHistory(),loadABWTDeerHistory(),loadABBisonHistory()]).then(() => {
    showPage(abProfile ? 'abFilter' : 'abProfile');
  });
}


function filterBySpecies(s) {
  selSpecies.clear();
  selSpecies.add(bcSpeciesGroup(s));
  showPage('draws');
  buildSpeciesChips();
  buildMUList();
  buildClassChips();
  applyFilters();
}



// ── BC species display/filter helpers ──────────────────────────────────────
// Keep real synopsis species separate. Do NOT collapse Roosevelt/Rocky Elk or
// Bighorn/Thinhorn Sheep into one chip, because those are distinct hunt groups.
function bcSpeciesGroup(species) {
  // Keep species categories exact for BC: Bighorn Sheep, Thinhorn Sheep,
  // Roosevelt Elk, and Rocky Mountain Elk must remain separate chips/cards.
  return String(species || '').trim();
}
function bcSpeciesMatchesAnySelected(species, selectedSet) {
  if (!selectedSet || selectedSet.size === 0) return true;
  const exact = bcSpeciesGroup(species);
  for (const selected of selectedSet) {
    if (bcSpeciesGroup(selected) === exact) return true;
  }
  return false;
}

// ── BC special hunt badges / filters ──────────────────────────────────────
// Keep this deliberately small: only tags that are immediately useful and clear.
const BC_ARCHERY_ONLY_CODES = new Set(["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2143", "2144", "2145", "2146", "2160", "2161", "2162", "2163", "2164", "2165", "2166", "2167", "2168", "2169", "2170", "2171", "4219", "4220", "4221", "4222", "4223", "4224", "4225", "4226", "4227", "4228", "4229", "4230", "4231", "4232", "4233"]);

function bcIsSharedHunt(r) {
  if (!r) return false;
  if (r.is_shared_hunt === true) return true;
  if (r.is_shared_hunt === false) return false;
  if (Array.isArray(r.special_tags) && r.special_tags.includes('shared')) return true;

  // The 2026-27 synopsis states Shared Hunts are only available for Moose or Bison,
  // and the Bison/Moose tables state those hunts are open to single applicants or shared groups.
  const species = String(r.Species || '').trim().toLowerCase();
  return species === 'moose' || species === 'bison';
}

function bcIsArcheryOnly(r) {
  if (!r) return false;
  if (r.is_archery_only === true) return true;
  if (r.is_archery_only === false) return false;
  if (Array.isArray(r.special_tags) && r.special_tags.includes('archery')) return true;

  // Do not infer this from Notes. Some regular hunts mention archery/private-land restrictions.
  // Use the exact hunt codes that appear under ARCHERY ONLY SEASONS in the synopsis.
  return BC_ARCHERY_ONLY_CODES.has(padHuntCode(r.Code));
}

function bcSpecialTagsForDraw(r) {
  const tags = [];
  if (bcIsSharedHunt(r)) tags.push({ key: 'shared', label: 'Shared Hunt' });
  if (bcIsArcheryOnly(r)) tags.push({ key: 'archery', label: 'Archery Only' });
  return tags;
}
function renderBCSpecialBadges(r) {
  const tags = bcSpecialTagsForDraw(r);
  if (!tags.length) return '';
  return '<div class="hunt-badges">' + tags.map(t => '<span class="hunt-badge hunt-badge-' + t.key + '">' + t.label + '</span>').join('') + '</div>';
}
function buildSpecialTagChips() {
  const wrap = document.getElementById('specialTagChips');
  if (!wrap) return;
  const tags = [
    { key: 'shared', label: 'Shared Hunt' },
    { key: 'archery', label: 'Archery Only' }
  ];
  wrap.innerHTML = tags.map(t =>
    '<div class="chip' + (selSpecialTags.has(t.key) ? ' active' : '') + '" onclick="toggleSpecialTag(\'' + t.key + '\')">' + t.label + '</div>'
  ).join('');
  const clear = document.getElementById('clearSpecialTags');
  if (clear) clear.classList.toggle('visible', selSpecialTags.size > 0);
}
function toggleSpecialTag(tag) {
  if (selSpecialTags.has(tag)) selSpecialTags.delete(tag); else selSpecialTags.add(tag);
  buildSpecialTagChips();
  applyFilters();
}
function bcDrawMatchesSpecialTags(r) {
  if (selSpecialTags.size === 0) return true;
  for (const tag of selSpecialTags) {
    if (tag === 'shared' && !bcIsSharedHunt(r)) return false;
    if (tag === 'archery' && !bcIsArcheryOnly(r)) return false;
  }
  return true;
}

const _BC_MONTHS = {
  jan:1, january:1, feb:2, february:2, mar:3, march:3, apr:4, april:4,
  may:5, jun:6, june:6, jul:7, july:7, aug:8, august:8, sep:9, sept:9, september:9,
  oct:10, october:10, nov:11, november:11, dec:12, december:12
};
function bcSeasonDay(monthNum, dayNum) {
  const monthDays = [0,31,28,31,30,31,30,31,31,30,31,30,31];
  let doy = dayNum;
  for (let m = 1; m < monthNum; m++) doy += monthDays[m];
  // BC LEH seasons mostly start in Aug and can run into Jan. Treat Jan-Jul as next-year dates.
  return monthNum < 8 ? doy + 365 : doy;
}
function bcDateInputToSeasonDay(value) {
  if (!value) return null;
  const parts = String(value).split('-').map(Number);
  if (parts.length !== 3 || !parts[1] || !parts[2]) return null;
  return bcSeasonDay(parts[1], parts[2]);
}
function bcParseSeasonIntervals(seasonText) {
  const text = String(seasonText || '').replace(/–/g, '-').replace(/—/g, '-');
  const re = /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t)?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s*(\d{1,2})\s*-\s*(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t)?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)?\.?\s*(\d{1,2})\b/gi;
  const intervals = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const sm = _BC_MONTHS[m[1].toLowerCase().replace('.', '')];
    const sd = parseInt(m[2], 10);
    const em = m[3] ? _BC_MONTHS[m[3].toLowerCase().replace('.', '')] : sm;
    const ed = parseInt(m[4], 10);
    if (!sm || !em || !sd || !ed) continue;
    let start = bcSeasonDay(sm, sd);
    let end = bcSeasonDay(em, ed);
    if (end < start) end += 365;
    intervals.push([start, end]);
  }
  return intervals;
}
function bcDrawOverlapsSeasonFilter(r) {
  const start = bcDateInputToSeasonDay(selSeasonFrom);
  const end0 = bcDateInputToSeasonDay(selSeasonTo);
  if (start === null && end0 === null) return true;
  let filterStart = start !== null ? start : end0;
  let filterEnd = end0 !== null ? end0 : start;
  if (filterEnd < filterStart) filterEnd += 365;
  const intervals = bcParseSeasonIntervals(r.Season);
  if (!intervals.length) return true;
  return intervals.some(([a,b]) => a <= filterEnd && b >= filterStart);
}
function setSeasonDateFilter(which, value) {
  if (which === 'from') selSeasonFrom = value || '';
  if (which === 'to') selSeasonTo = value || '';
  const clear = document.getElementById('clearSeasonDate');
  if (clear) clear.classList.toggle('visible', !!(selSeasonFrom || selSeasonTo));
  applyFilters();
}
function clearSeasonDateFilter() {
  selSeasonFrom = '';
  selSeasonTo = '';
  const from = document.getElementById('seasonDateFrom');
  const to = document.getElementById('seasonDateTo');
  if (from) from.value = '';
  if (to) to.value = '';
  const clear = document.getElementById('clearSeasonDate');
  if (clear) clear.classList.remove('visible');
  applyFilters();
}

// ── FILTERS ──
function oddsClass(p) { return p >= 20 ? 'green' : p >= 5 ? 'yellow' : 'red'; }
function fmt(p) {
  const n = parseFloat(p);
  if (isNaN(n)||n==null) return '?%';
  if (n > 0 && n.toFixed(1) === '0.0') return n.toFixed(2) + '%';
  return (n>=10 ? Math.round(n) : n.toFixed(1)) + '%';
}
function fmtFill(f) {
  if (f==null||isNaN(f)) return null;
  return Math.round(f*100) + '%';
}
function fillClass(f) {
  if (f==null) return 'fill-none';
  if (f >= 0.70) return 'fill-high';
  if (f >= 0.40) return 'fill-mid';
  return 'fill-low';
}
function fillLabel(f) {
  if (f==null) return null;
  if (f >= 0.70) return 'High success';
  if (f >= 0.40) return 'Moderate';
  return 'Low success';
}
function buildMiniChart(yearlyData) {
  if (!yearlyData || Object.keys(yearlyData).length === 0) return '';
  const entries = Object.entries(yearlyData).sort((a,b)=>a[0]-b[0]).slice(-10);
  if (entries.length < 2) return '';
  const vals = entries.map(e => parseFloat(e[1]));
  const max = Math.max(...vals, 0.01);
  const bars = entries.map(([yr, val]) => {
    const h = Math.round((parseFloat(val)/max)*28);
    const pct = Math.round(parseFloat(val)*100);
    return `<div class="mc-bar" style="height:${h}px;background:#4ade80" title="${yr}: ${pct}%"></div>`;
  }).join('');
  return `<div class="mini-chart">${bars}</div>`;
}

function buildGreenBarChart(yearlyOdds, cardIndex, chartTitle, viewMode, abSpecies, abWmu) {
  if (!yearlyOdds || Object.keys(yearlyOdds).length === 0) return '';
  const allSorted = Object.entries(yearlyOdds)
    .filter(([y]) => String(y).slice(0,4) < '2026')  // exclude incomplete current year
    .sort((a,b) => String(a[0]).slice(0,4).localeCompare(String(b[0]).slice(0,4)));
  const hasExtra = allSorted.length > 10;
  const chartId = 'gbc_' + String(cardIndex).replace(/[^a-zA-Z0-9]/g, '_');
  const activeMode = viewMode || _chartViewState.get(chartId) || 'ten';
  const entries = activeMode === 'all' ? allSorted : allSorted.slice(-10);
  if (entries.length < 2) return '';

  const TITLE_H = 32;
  const W = 560, H = 170 + TITLE_H;
  const PAD_L = 46, PAD_R = 14, PAD_T = 22 + TITLE_H, PAD_B = 30;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const baseY = PAD_T + plotH;
  const TIP_H = 34, TIP_W = 64;

  const vals = entries.map(e => parseFloat(e[1]));
  const maxV = Math.max(...vals, 0.01);
  const n = entries.length;
  const slotW = plotW / n;

  // Compute avg + colour for title
  const rawAvg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const avgPct = (rawAvg % 1 < 0.05 ? Math.round(rawAvg) : rawAvg.toFixed(1)) + '%';
  const avgCol = rawAvg >= 50 ? '#4ade80' : rawAvg >= 25 ? '#facc15' : '#f87171';
  const nYrsLP = n;

  // Y scale snapped to clean increments, strictly bounded to data
  const lpTickStep = maxV <= 15 ? 5 : maxV <= 30 ? 10 : maxV <= 60 ? 25 : 25;
  const lpMaxTick = Math.ceil(maxV / lpTickStep) * lpTickStep;
  const lpTicks = [];
  for (let t = 0; t <= lpMaxTick; t += lpTickStep) lpTicks.push(t);

  const gridLines = lpTicks.map(tick => {
    const ty = baseY - (tick / lpMaxTick) * plotH;
    if (tick === 0) return '<line x1="' + PAD_L + '" y1="' + ty.toFixed(1) + '" x2="' + (W - PAD_R) + '" y2="' + ty.toFixed(1) + '" stroke="#2a2e32" stroke-width="0.8"/>';
    return '<line x1="' + PAD_L + '" y1="' + ty.toFixed(1) + '" x2="' + (W - PAD_R) + '" y2="' + ty.toFixed(1) + '" stroke="#2a2e32" stroke-width="0.8"/>' +
      '<text x="' + (PAD_L - 8) + '" y="' + (ty + 3.5).toFixed(1) + '" text-anchor="end" font-size="10" fill="#404850" font-family="DM Sans,sans-serif">' + tick + '%</text>';
  }).join('');

  const xAxisLine = '<line x1="' + PAD_L + '" y1="' + baseY + '" x2="' + (W - PAD_R) + '" y2="' + baseY + '" stroke="#2a2e32" stroke-width="1"/>';
  const yAxisLine = '<line x1="' + PAD_L + '" y1="' + PAD_T + '" x2="' + PAD_L + '" y2="' + baseY + '" stroke="#2a2e32" stroke-width="1"/>';

  const lollipops = entries.map(([yr, v], i) => {
    const fv = parseFloat(v);
    const cx = PAD_L + (i + 0.5) * slotW;
    const cy = baseY - Math.max(0, (fv / lpMaxTick) * plotH);
    const pct = fv % 1 < 0.05 ? Math.round(fv) + '' : fv.toFixed(1);
    const col = fv >= 50 ? '#4ade80' : fv >= 25 ? '#facc15' : '#f87171';
    const stemTop = Math.min(cy, baseY - 2);
    const tipX = Math.min(Math.max(cx - TIP_W / 2, PAD_L), W - PAD_R - TIP_W);
    const tipY = Math.max(cy - TIP_H - 10, PAD_T);
    return '<g onmouseenter="var t=this.querySelector(\'.lptip\');t.style.display=\'block\'" onmouseleave="var t=this.querySelector(\'.lptip\');t.style.display=\'none\'" style="cursor:default">' +
      '<line x1="' + cx.toFixed(1) + '" y1="' + baseY + '" x2="' + cx.toFixed(1) + '" y2="' + stemTop.toFixed(1) + '" stroke="' + col + '" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>' +
      '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="7" fill="' + col + '" opacity="0.95"/>' +
      '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="2.8" fill="#111214"/>' +
      '<rect x="' + (cx - slotW/2).toFixed(1) + '" y="' + PAD_T + '" width="' + slotW.toFixed(1) + '" height="' + (plotH + PAD_B) + '" fill="transparent"/>' +
      '<g class="lptip" style="display:none;pointer-events:none">' +
      '<rect x="' + tipX.toFixed(1) + '" y="' + tipY.toFixed(1) + '" width="' + TIP_W + '" height="' + TIP_H + '" rx="4" fill="#1e293b" stroke="' + col + '" stroke-width="1.2"/>' +
      '<text x="' + (tipX + TIP_W/2).toFixed(1) + '" y="' + (tipY + 13).toFixed(1) + '" text-anchor="middle" font-size="9" font-weight="600" fill="#94a3b8" font-family="DM Sans,sans-serif">' + yr + '</text>' +
      '<text x="' + (tipX + TIP_W/2).toFixed(1) + '" y="' + (tipY + 27).toFixed(1) + '" text-anchor="middle" font-size="12" font-weight="700" fill="' + col + '" font-family="DM Sans,sans-serif">' + pct + '%</text>' +
      '</g></g>';
  }).join('');

  const labelIdxs = new Set([0, n - 1]);
  if (n >= 5) labelIdxs.add(Math.floor(n / 2));
  const yearLabels = entries.map(([yr], idx) => {
    if (!labelIdxs.has(idx)) return '';
    const cx = PAD_L + (idx + 0.5) * slotW;
    return '<text x="' + cx.toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" fill="#6b7a8d" font-size="11" font-family="DM Sans,sans-serif">' + String(yr).slice(0, 7) + '</text>';
  }).join('');

  // Title: left-aligned, plain part + coloured avg inline using tspan
  const gbcModeLabel = activeMode === 'all' ? 'ALL TIME' : 'LAST ' + nYrsLP + ' YRS';
  const titlePrefix = abWmu ? ('WMU ' + abWmu + ' HARVEST SUCCESS %') : 'HARVEST SUCCESS %';
  const basePart = titlePrefix + '  \u00b7  ' + gbcModeLabel + '  \u00b7  AVG ';
  const titleEl =
    '<text x="' + PAD_L + '" y="' + (TITLE_H - 6) + '" text-anchor="start" font-size="11" font-weight="700" fill="#6b7a8d" font-family="DM Sans,sans-serif" letter-spacing="0.03em">' +
    basePart +
    '<tspan fill="' + avgCol + '">' + avgPct + '</tspan>' +
    '</text>';

  const svgHtml = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible">' +
    titleEl + gridLines + xAxisLine + yAxisLine + lollipops + yearLabels + '</svg>';

  const btnTen = '<button onclick="event.stopPropagation();toggleChartView(\'' + chartId + '\',\'ten\',this)" class="chart-toggle-btn' + (activeMode==='ten'?' active':'') + '" data-mode="ten">10 YR</button>';
  const btnAll = '<button onclick="event.stopPropagation();toggleChartView(\'' + chartId + '\',\'all\',this)" class="chart-toggle-btn' + (activeMode==='all'?' active':'') + '" data-mode="all">ALL</button>';
  const speciesAttr = abSpecies ? ' data-ab-species="' + abSpecies + '"' : '';
  const wmuAttr = abWmu ? ' data-ab-wmu="' + abWmu + '"' : '';
  // Always wrap in toggle div (needed for data-* attrs and toggle to work);
  // only show pills when there are more than 10 years of data
  const pillsHTML = hasExtra ? '<div class="chart-toggle-pills">' + btnTen + btnAll + '</div>' : '';
  return '<div class="chart-toggle-wrap" data-chart-id="' + chartId + '" data-chart-type="harvest" data-card-index="' + cardIndex + '"' + speciesAttr + wmuAttr + '>' +
    pillsHTML +
    svgHtml + '</div>';
}
// ── CHART TOGGLE (10yr ↔ all-time) ──────────────────────────────────────────
function toggleChartView(chartId, mode, btn) {
  _chartViewState.set(chartId, mode);
  const wrap = document.querySelector('[data-chart-id="' + chartId + '"]');
  if (!wrap) return;

  // Update pill button states
  wrap.querySelectorAll('.chart-toggle-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });

  const chartType = wrap.dataset.chartType;
  const cardIndex = wrap.dataset.cardIndex;

  if (chartType === 'odds') {
    // Rebuild odds line chart
    const weightedAvg = wrap.dataset.weightedAvg ? parseFloat(wrap.dataset.weightedAvg) : null;
    // Find the source data from the draw record
    let yearlyData = null;
    // Try BC filtered draws first
    if (typeof filtered !== 'undefined') {
      const idx = parseInt(cardIndex);
      if (!isNaN(idx) && filtered[idx]) yearlyData = filtered[idx].yearly_draw_odds;
    }
    // Try detail page data
    if (!yearlyData && typeof _drawDetailData !== 'undefined' && _drawDetailData) {
      yearlyData = _drawDetailData.type === 'BC' ? _drawDetailData.data.yearly_draw_odds
                 : _drawDetailData.type === 'AB' ? _drawDetailData.data.yearlyOddsObj : null;
    }
    if (!yearlyData) return;
    const newSvg = buildOddsLineChart(yearlyData, cardIndex, weightedAvg, null, mode);
    wrap.outerHTML = newSvg;
  } else if (chartType === 'harvest') {
    // Rebuild harvest bar chart
    let yearlyData = null;
    const abSpecies = wrap.dataset.abSpecies || null;
    const abWmu = wrap.dataset.abWmu || null;

    // Try AB history lookup first (if this is an AB harvest chart)
    if (abSpecies && abWmu) {
      const s = abSpecies.toLowerCase();
      let histObj = null;
      if (s === 'elk' && typeof AB_ELK_HISTORY !== 'undefined') histObj = AB_ELK_HISTORY?.[abWmu];
      else if (s === 'moose' && typeof AB_MOOSE_HISTORY !== 'undefined') histObj = AB_MOOSE_HISTORY?.[abWmu];
      else if (['mule deer','muledeer','mule_deer'].includes(s) && typeof AB_MULEDEER_HISTORY !== 'undefined') histObj = AB_MULEDEER_HISTORY?.[abWmu];
      else if (['antelope','pronghorn','pronghorn antelope'].includes(s) && typeof AB_ANTELOPE_HISTORY !== 'undefined') histObj = AB_ANTELOPE_HISTORY?.[abWmu];
      else if (['white-tailed deer','white tailed deer','whitetail','whitetailed deer','white-tail'].includes(s) && typeof AB_WTDEER_HISTORY !== 'undefined') histObj = AB_WTDEER_HISTORY?.[abWmu];
      else if (s.includes('bison') && typeof AB_BISON_HISTORY !== 'undefined' && AB_BISON_HISTORY) {
        histObj = Object.fromEntries(AB_BISON_HISTORY.map(r => [r.season, r.pct]));
      }
      if (histObj) yearlyData = Object.fromEntries(Object.entries(histObj).sort((a,b) => +a[0] - +b[0]));
    }

    // Try BC filtered draws
    if (!yearlyData && typeof filtered !== 'undefined') {
      const numIdx = parseInt(cardIndex.replace(/\D/g,''));
      if (!isNaN(numIdx) && filtered[numIdx]) {
        const raw = filtered[numIdx].yearly_fill_rates || {};
        yearlyData = Object.fromEntries(Object.entries(raw).map(([y,v])=>[y,parseFloat(v)*100]));
      }
    }
    // Try detail page BC harvest
    if (!yearlyData && typeof _drawDetailData !== 'undefined' && _drawDetailData && _drawDetailData.type === 'BC') {
      const raw = _drawDetailData.data.yearly_fill_rates || {};
      yearlyData = Object.fromEntries(Object.entries(raw).map(([y,v])=>[y,parseFloat(v)*100]));
    }
    if (!yearlyData) return;
    const newSvg = buildGreenBarChart(yearlyData, cardIndex, null, mode, abSpecies, abWmu);
    wrap.outerHTML = newSvg;
  }
}

// ── Compute 10yr harvest avg from bar chart data (single source of truth for badge) ──
function computeHarvestAvg(yearlyData) {
  if (!yearlyData) return null;
  const vals = Object.entries(yearlyData)
    .filter(([y]) => String(y).slice(0,4) < '2026')  // exclude incomplete current year
    .sort((a,b) => String(a[0]).slice(0,4).localeCompare(String(b[0]).slice(0,4)))
    .slice(-10)
    .map(e => parseFloat(e[1]))
    .filter(v => isFinite(v) && v >= 0);
  if (vals.length < 1) return null;
  const avg = vals.reduce((a,b)=>a+b,0) / vals.length;
  // yearly_fill_rates stores decimals (0.29 = 29%); AB history stores percents (29)
  // Detect by whether all values are <= 1
  const isDecimal = vals.every(v => v <= 1);
  return Math.round(isDecimal ? avg * 100 : avg);
}

function computeABHarvestAvg(species, wmu) {
  const s = (species||'').toLowerCase();
  if (s === 'elk' && AB_ELK_HISTORY?.[wmu]) return computeHarvestAvg(AB_ELK_HISTORY[wmu]);
  if (s === 'moose' && AB_MOOSE_HISTORY?.[wmu]) return computeHarvestAvg(AB_MOOSE_HISTORY[wmu]);
  if (['mule deer','muledeer','mule_deer'].includes(s) && AB_MULEDEER_HISTORY?.[wmu]) return computeHarvestAvg(AB_MULEDEER_HISTORY[wmu]);
  if (['antelope','pronghorn','pronghorn antelope'].includes(s) && AB_ANTELOPE_HISTORY?.[wmu]) return computeHarvestAvg(AB_ANTELOPE_HISTORY[wmu]);
  if (['white-tailed deer','white tailed deer','whitetail','whitetailed deer','white-tail'].includes(s) && AB_WTDEER_HISTORY?.[wmu]) return computeHarvestAvg(AB_WTDEER_HISTORY[wmu]);
  if (s.includes('bison') && AB_BISON_HISTORY?.length) {
    const vals = AB_BISON_HISTORY.slice(-10).map(r=>r.pct);
    return vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : null;
  }
  return null;
}

// Cached version — reset when AB data reloads
const _abHarvestAvgCache = new Map();
function computeABHarvestAvgCached(species, wmu) {
  const key = species + '||' + wmu;
  if (_abHarvestAvgCache.has(key)) return _abHarvestAvgCache.get(key);
  const v = computeABHarvestAvg(species, wmu);
  _abHarvestAvgCache.set(key, v);
  return v;
}


function buildOddsLineChart(yearlyOdds, cardIndex, weightedAvg, chartTitle, viewMode) {
  if (!yearlyOdds || Object.keys(yearlyOdds).length === 0) return '';
  const allSorted = Object.entries(yearlyOdds).sort((a,b) => +a[0] - +b[0])
    .filter(e => isFinite(parseFloat(e[1])) && parseFloat(e[1]) > 0 && parseFloat(e[1]) <= 100);
  const hasExtra = allSorted.length > 10;
  const chartId = 'olc_' + String(cardIndex).replace(/[^a-zA-Z0-9]/g, '_');
  const activeMode = viewMode || _chartViewState.get(chartId) || 'ten';
  const entries = activeMode === 'all' ? allSorted : allSorted.slice(-10);
  if (entries.length < 2) return '';

  const TITLE_H = 32;
  const W = 560, H = 140 + TITLE_H, PAD_L = 46, PAD_R = 14, PAD_T = 22 + TITLE_H, PAD_B = 24;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const baseY = PAD_T + plotH;
  const TIP_H = 34, TIP_W = 64;

  const vals = entries.map(e => parseFloat(e[1]));
  const maxV = Math.max(...vals, 0.01);
  const minYr = +entries[0][0];
  const maxYr = +entries[entries.length - 1][0];
  const yrSpan = maxYr - minYr || 1;
  const nYrsOL = entries.length;

  // Y scale snapped to clean increments, strictly bounded to data
  const olTickStep = maxV <= 15 ? 5 : maxV <= 30 ? 10 : maxV <= 60 ? 25 : 25;
  const olMaxTick = Math.ceil(maxV / olTickStep) * olTickStep;
  const olTicks = [];
  for (let t = 0; t <= olMaxTick; t += olTickStep) olTicks.push(t);

  const pts = entries.map(([yr, v]) => ({
    x: PAD_L + ((+yr - minYr) / yrSpan) * plotW,
    y: PAD_T + plotH - (parseFloat(v) / olMaxTick) * plotH,
    yr: yr, v: parseFloat(v)
  }));

  const segments = [];
  let seg = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (+pts[i].yr - +pts[i-1].yr > 2) { segments.push(seg); seg = [pts[i]]; }
    else seg.push(pts[i]);
  }
  segments.push(seg);

  const linePath = segments.map(s =>
    'M' + s[0].x.toFixed(1) + ',' + s[0].y.toFixed(1) +
    s.slice(1).map(p => ' L' + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join('')
  ).join(' ');

  const fillPath = segments.filter(s => s.length > 1).map(s =>
    'M' + s[0].x.toFixed(1) + ',' + baseY.toFixed(1) +
    ' L' + s[0].x.toFixed(1) + ',' + s[0].y.toFixed(1) +
    s.slice(1).map(p => ' L' + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join('') +
    ' L' + s[s.length-1].x.toFixed(1) + ',' + baseY.toFixed(1) + ' Z'
  ).join(' ');

  const labelIdxs = new Set([0, pts.length - 1]);
  if (pts.length >= 5) labelIdxs.add(Math.floor(pts.length / 2));
  if (pts.length >= 9) { labelIdxs.add(Math.floor(pts.length / 4)); labelIdxs.add(Math.floor(3 * pts.length / 4)); }
  const yearLabels = pts.filter((_, i) => labelIdxs.has(i))
    .map(p => '<text x="' + p.x.toFixed(1) + '" y="' + (H - 2) + '" text-anchor="middle" fill="#6b7a8d" font-size="11" font-family="DM Sans,sans-serif">' + p.yr + '</text>')
    .join('');

  const gridLinesY = olTicks.map(tick => {
    const ty = baseY - (tick / olMaxTick) * plotH;
    if (tick === 0) return '<line x1="' + PAD_L + '" y1="' + ty.toFixed(1) + '" x2="' + (W - PAD_R) + '" y2="' + ty.toFixed(1) + '" stroke="#2a2e32" stroke-width="0.8"/>';
    return '<line x1="' + PAD_L + '" y1="' + ty.toFixed(1) + '" x2="' + (W - PAD_R) + '" y2="' + ty.toFixed(1) + '" stroke="#2a2e32" stroke-width="0.8"/>' +
      '<text x="' + (PAD_L - 8) + '" y="' + (ty + 3.5).toFixed(1) + '" text-anchor="end" font-size="10" fill="#404850" font-family="DM Sans,sans-serif">' + tick + '%</text>';
  }).join('');

  const xAxisLineOL = '<line x1="' + PAD_L + '" y1="' + baseY + '" x2="' + (W - PAD_R) + '" y2="' + baseY + '" stroke="#2a2e32" stroke-width="1"/>';
  const yAxisLineOL = '<line x1="' + PAD_L + '" y1="' + PAD_T + '" x2="' + PAD_L + '" y2="' + baseY + '" stroke="#2a2e32" stroke-width="1"/>';

  const olAvgCol = weightedAvg != null ? (weightedAvg >= 50 ? '#4ade80' : weightedAvg >= 25 ? '#facc15' : '#f87171') : '#4a7fd4';
  const olAvgFmt = weightedAvg != null ? (weightedAvg % 1 < 0.05 ? Math.round(weightedAvg) : weightedAvg.toFixed(1)) + '%' : null;
  const olModeLabel = activeMode === 'all' ? 'ALL TIME' : 'LAST ' + nYrsOL + ' YRS';
  const olBasePart = 'DRAW ODDS %  \u00b7  ' + olModeLabel + (olAvgFmt ? '  \u00b7  AVG ' : '');
  const titleElOL =
    '<text x="' + PAD_L + '" y="' + (TITLE_H - 6) + '" text-anchor="start" font-size="11" font-weight="700" fill="#6b7a8d" font-family="DM Sans,sans-serif" letter-spacing="0.03em">' +
    olBasePart +
    (olAvgFmt ? '<tspan fill="' + olAvgCol + '">' + olAvgFmt + '</tspan>' : '') +
    '</text>';

  let avgLine = '';
  if (weightedAvg != null && weightedAvg > 0) {
    const avgY = Math.max(PAD_T + 1, Math.min(baseY - 1, PAD_T + plotH - (weightedAvg / olMaxTick) * plotH));
    avgLine = '<line x1="' + PAD_L + '" y1="' + avgY.toFixed(1) + '" x2="' + (W - PAD_R) + '" y2="' + avgY.toFixed(1) + '" stroke="#4a7fd4" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.8"/>';
  }

  const dots = pts.map(p => {
    const pct = p.v % 1 < 0.05 ? Math.round(p.v) + '' : p.v.toFixed(1);
    const tipX = Math.min(Math.max(p.x - TIP_W / 2, PAD_L), W - PAD_R - TIP_W);
    const tipY = Math.max(p.y - TIP_H - 8, PAD_T);
    return '<g onmouseenter="var t=this.querySelector(\'.odtip\');t.style.display=\'block\'" onmouseleave="var t=this.querySelector(\'.odtip\');t.style.display=\'none\'" style="cursor:default">' +
      '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="5" fill="#1a3a6e" stroke="#4a7fd4" stroke-width="2"/>' +
      '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="12" fill="transparent"/>' +
      '<g class="odtip" style="display:none;pointer-events:none">' +
      '<rect x="' + tipX.toFixed(1) + '" y="' + tipY.toFixed(1) + '" width="' + TIP_W + '" height="' + TIP_H + '" rx="4" fill="#1e293b" stroke="#4a7fd4" stroke-width="1.2"/>' +
      '<text x="' + (tipX + TIP_W/2).toFixed(1) + '" y="' + (tipY + 13).toFixed(1) + '" text-anchor="middle" font-size="9" font-weight="600" fill="#94a3b8" font-family="DM Sans,sans-serif">' + p.yr + '</text>' +
      '<text x="' + (tipX + TIP_W/2).toFixed(1) + '" y="' + (tipY + 27).toFixed(1) + '" text-anchor="middle" font-size="12" font-weight="700" fill="#4a7fd4" font-family="DM Sans,sans-serif">' + pct + '%</text>' +
      '</g></g>';
  }).join('');

  const gradId = 'og' + String(cardIndex).replace(/[^a-zA-Z0-9]/g, '_');
  const svgHtml = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible">' +
    '<defs><linearGradient id="' + gradId + '" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0%" stop-color="#1e4fa0" stop-opacity="0.3"/>' +
    '<stop offset="100%" stop-color="#1e4fa0" stop-opacity="0.02"/>' +
    '</linearGradient></defs>' +
    titleElOL + gridLinesY + xAxisLineOL + yAxisLineOL +
    '<path d="' + fillPath + '" fill="url(#' + gradId + ')"/>' +
    avgLine +
    '<path d="' + linePath + '" fill="none" stroke="#2563c7" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
    dots + yearLabels + '</svg>';

  if (!hasExtra) return svgHtml;

  const btnTen = '<button onclick="event.stopPropagation();toggleChartView(\'' + chartId + '\',\'ten\',this)" class="chart-toggle-btn' + (activeMode==='ten'?' active':'') + '" data-mode="ten">10 YR</button>';
  const btnAll = '<button onclick="event.stopPropagation();toggleChartView(\'' + chartId + '\',\'all\',this)" class="chart-toggle-btn' + (activeMode==='all'?' active':'') + '" data-mode="all">ALL</button>';
  return '<div class="chart-toggle-wrap" data-chart-id="' + chartId + '" data-chart-type="odds" data-card-index="' + cardIndex + '" data-weighted-avg="' + (weightedAvg||'') + '">' +
    '<div class="chart-toggle-pills">' + btnTen + btnAll + '</div>' +
    svgHtml + '</div>';
}
function onSlider(v) {
  selMinOdds = ODDS_STEPS[parseInt(v)];
  const d=document.getElementById('oddsDisplay'), u=document.getElementById('oddsUnit'), s=document.getElementById('oddsSubLabel');
  if (selMinOdds===0) { d.textContent='Any'; u.textContent=''; s.textContent='All draws'; }
  else { d.textContent=selMinOdds; u.textContent='%+'; s.textContent='Min '+selMinOdds+'% odds'; }
  applyFilters();
}

function buildSpeciesChips() {
  const all = [...new Set(DATA.map(r => bcSpeciesGroup(r.Species)))].filter(Boolean).sort();
  document.getElementById('speciesChips').innerHTML = all.map(s =>
    `<div class="chip${selSpecies.has(s)?' active':''}" onclick="toggleSpecies('${s}')">${s}</div>`
  ).join('');
  document.getElementById('clearSpecies').classList.toggle('visible', selSpecies.size>0);
}

function buildMUList() {
  const relevant = selSpecies.size===0 ? DATA : DATA.filter(r => bcSpeciesMatchesAnySelected(r.Species, selSpecies));
  const nums = [...new Set(relevant.map(r=>r.MU_General))].sort((a,b)=>a-b);
  document.getElementById('muList').innerHTML = nums.map(n =>
    `<div class="mu-item${selMUs.has(n)?' active':''}" onclick="toggleMU(${n})">
      <span class="mu-num">${n}</span>
      <span class="mu-name">${MU_NAMES[n]||''}</span>
    </div>`
  ).join('');
  document.getElementById('clearMU').classList.toggle('visible', selMUs.size>0);
}

function toggleSpecies(s) {
  s = bcSpeciesGroup(s);
  if (selSpecies.has(s)) selSpecies.delete(s); else selSpecies.add(s);
  // Clear region filter when species changes so a stale region does not silently
  // hide valid draws for the newly selected species.
  selMUs.clear();
  buildSpeciesChips(); buildMUList(); if (typeof bcUpdateMapStyles === 'function') bcUpdateMapStyles(); applyFilters();
}

function toggleMU(n) {
  if (selMUs.has(n)) selMUs.delete(n); else selMUs.add(n);
  buildMUList(); applyFilters();
}

function buildClassChips() {
  const wrap = document.getElementById('classChips');
  if (!wrap) return;
  ['Antlered','Antlerless','Any'].forEach(c => {
    // chips are static in HTML, just toggle active class
  });
  wrap.innerHTML = ['Antlered','Antlerless','Any'].map(c =>
    `<div class="chip${selClass.has(c)?' active':''}" onclick="toggleClass('${c}')">${c}</div>`
  ).join('');
  const cl = document.getElementById('clearClass');
  if (cl) cl.classList.toggle('visible', selClass.size > 0);
}
function toggleClass(c) {
  if (selClass.has(c)) selClass.delete(c); else selClass.add(c);
  buildClassChips(); applyFilters();
}

function clearFilter(type) {
  if (type==='species') { selSpecies.clear(); buildSpeciesChips(); buildMUList(); if (typeof bcUpdateMapStyles === 'function') bcUpdateMapStyles(); }
  if (type==='mu') { selMUs.clear(); selMUsFull.clear(); bcUpdateMapChips(); bcUpdateMapStyles(); buildMUList(); }
  if (type==='class') { selClass.clear(); buildClassChips(); }
  if (type==='special') { selSpecialTags.clear(); buildSpecialTagChips(); }
  if (type==='seasonDate') { clearSeasonDateFilter(); return; }
  applyFilters();
}

function setSort(mode) {
  sortMode = mode;
  document.getElementById('sortOddsBtn').classList.toggle('active', mode==='odds');
  const ssBtn = document.getElementById('sortSuccessBtn');
  if (ssBtn) ssBtn.classList.toggle('active', mode==='success');
  const seasonBtn = document.getElementById('sortSeasonBtn');
  if (seasonBtn) seasonBtn.classList.toggle('active', mode==='season');
  applyFilters();
}

function resetAll() {
  selSpecies.clear(); selMUs.clear(); selMUsFull.clear(); selMinOdds=0; selMinHarvest=0; selClass.clear(); selSpecialTags.clear(); selSeasonFrom=''; selSeasonTo='';
    document.getElementById('oddsSlider').value=0;
  onSlider(0);
  bcUpdateMapChips(); bcUpdateMapStyles();
  buildSpeciesChips(); buildMUList(); if (typeof bcUpdateMapStyles === 'function') bcUpdateMapStyles(); buildClassChips(); buildSpecialTagChips();
  const seasonFromEl = document.getElementById('seasonDateFrom');
  const seasonToEl = document.getElementById('seasonDateTo');
  if (seasonFromEl) seasonFromEl.value = '';
  if (seasonToEl) seasonToEl.value = '';
  const clearSeasonEl = document.getElementById('clearSeasonDate');
  if (clearSeasonEl) clearSeasonEl.classList.remove('visible');
  applyFilters();
}

function applyFilters() {
  const q = (document.getElementById('search') ? document.getElementById('search').value : '').toLowerCase();
  filtered = DATA.filter(r => {
    if (selSpecies.size>0 && !bcSpeciesMatchesAnySelected(r.Species, selSpecies)) return false;
    if (selMUs.size>0 && !selMUs.has(r.MU_General)) return false;
    if (selMUsFull.size>0 && !selMUsFull.has(bcNormalizeMU(r.MU))) return false;
    if (selAreas.size>0 && !selAreas.has(r.Area)) return false;
    if ((getBCActualOdds(r) ?? 0) < selMinOdds) return false;
    if (selMinHarvest > 0) {
      const hr = computeHarvestAvg(r.yearly_fill_rates);
      if (hr === null || hr < selMinHarvest) return false;
    }
    if (!bcDrawMatchesSpecialTags(r)) return false;
    if (!bcDrawOverlapsSeasonFilter(r)) return false;
    if (selClass.size > 0) {
      const cls = (r.Class || '').toLowerCase();
      const match = [...selClass].some(c => {
        if (c === 'Antlered') return (cls.includes('antlered') || cls.includes('bull')) && !cls.includes('antlerless');
        if (c === 'Antlerless') return cls.includes('antlerless') || cls.includes('cow');
        if (c === 'Any') return !cls.includes('antlered') && !cls.includes('antlerless') && !cls.includes('bull') && !cls.includes('cow');
        return false;
      });
      if (!match) return false;
    }
    if (q) {
      const hay = [r.Species,r.MU,r.Area,r.Zone,r.Class,r.Season,r.Notes,r.MU_Name].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (sortMode !== 'odds' && sortMode !== 'success') sortMode = 'odds';
  if (sortMode==='odds') {
    filtered.sort((a,b)=>(getBCActualOdds(b)||0)-(getBCActualOdds(a)||0));
  } else if (sortMode==='success') {
    filtered.sort((a,b) => {
      const fa = computeHarvestAvg(a.yearly_fill_rates);
      const fb = computeHarvestAvg(b.yearly_fill_rates);
      if (fb === null && fa === null) return 0;
      if (fb === null) return -1;
      if (fa === null) return 1;
      return fb - fa;
    });
  }

  const tags=[];
  selSpecies.forEach(s=>tags.push(s));
  selMUs.forEach(m=>tags.push(m+' — '+(MU_NAMES[m]||'')));
  if (selMinOdds>0) tags.push('≥ '+selMinOdds+'%');
  selSpecialTags.forEach(t => tags.push(t === 'shared' ? 'Shared Hunt' : 'Archery Only'));
  if (selSeasonFrom || selSeasonTo) tags.push('Season dates');


  let title='All Draws';
  if (selSpecies.size===1) title=[...selSpecies][0];
  else if (selSpecies.size>1) title=[...selSpecies].join(', ');
  document.getElementById('resultsTitle').textContent=title;
  document.getElementById('countDisplay').textContent=filtered.length.toLocaleString();

  renderCards();
}

function toggleWriteup(btn) {
  const body = btn.nextElementSibling;
  const arrow = btn.querySelector('span');
  const open = body.style.display !== 'none';
  body.style.display = open ? 'none' : 'block';
  arrow.textContent = open ? '▾' : '▴';
}

function toggleCard(i) {
  const el=document.getElementById('exp-'+i);
  const btn=document.getElementById('expbtn-'+i);
  if (!el) return;
  const open=el.classList.contains('open');
  if (open) { el.classList.remove('open'); btn.textContent='▾ Show details'; }
  else {
    el.classList.add('open');
    btn.textContent='▴ Hide details';
    // Init the LEH zone map for this card if not already done
    const r = filtered[i];
    if (r && typeof bcCardMapInit === 'function') {
      const mapContainerId = 'lehMap_' + i + '_' + padHuntCode(r.Code);
      const mapEl = document.getElementById(mapContainerId);
      if (mapEl) {
        // Check if a live Mapbox GL map already exists for this container
        const hasLiveMap = typeof _lehCardMaps !== 'undefined' && _lehCardMaps[mapContainerId];
        if (!hasLiveMap) {
          // No live map yet (first open, or was Leaflet before) — init fresh
          mapEl._lehInited = true;
          const s = (r.Species || '').toUpperCase();
          let speciesType = 'MOUNTAIN SHEEP';
          if (s.includes('GOAT'))                                        speciesType = 'MOUNTAIN GOAT';
          else if (s.includes('MOOSE'))                                  speciesType = 'MOOSE';
          else if (s.includes('ELK'))                                    speciesType = 'ELK';
          else if (s.includes('CARIBOU'))                                speciesType = 'CARIBOU';
          else if (s.includes('BEAR'))                                   speciesType = 'BLACK BEAR';
          else if (s.includes('MULE') || s.includes('BLACK-TAILED'))    speciesType = 'MULE DEER';
          else if (s.includes('WHITE-TAILED') || s.includes('WHITETAIL')) speciesType = 'WHITE-TAILED DEER';
          else if (s.includes('BISON'))                                  speciesType = 'BISON';
          else if (s.includes('TURKEY'))                                 speciesType = 'TURKEY';
          else if (s.includes('SHEEP') || s.includes('THINHORN') || s.includes('BIGHORN')) speciesType = 'MOUNTAIN SHEEP';
          // Delay init so card expand CSS transition completes before
          // Mapbox GL measures container dimensions
          setTimeout(() => bcCardMapInit(mapContainerId, r.MU, r.Zone || '', speciesType), 80);
        } else {
          bcCardMapInvalidate(mapContainerId);
        }
      }
    }
  }
}

function toggleSavedCard(key) {
  const el  = document.getElementById('saved-exp-' + key);
  const btn = document.getElementById('saved-expbtn-' + key);
  if (!el) return;
  const open = el.classList.contains('open');
  if (open) { el.classList.remove('open'); if (btn) btn.textContent = '▾ Show details'; }
  else {
    el.classList.add('open');
    if (btn) btn.textContent = '▴ Hide details';
    // Saved cards use the same expand HTML as the main BC cards. Initialize any
    // zone maps inside the expanded saved card once the container is visible.
    initVisibleBCZoneMaps(el);
  }
}

function initVisibleBCZoneMaps(scope) {
  const root = scope || document;
  if (!root.querySelectorAll) return;
  root.querySelectorAll('.leh-card-map').forEach(mapEl => {
    const id = mapEl.id;
    if (!id || mapEl.dataset.mapInitQueued === '1') return;
    const hasLiveMap = typeof _lehCardMaps !== 'undefined' && _lehCardMaps[id];
    if (hasLiveMap) { if (typeof bcCardMapInvalidate === 'function') bcCardMapInvalidate(id); return; }
    const mu = mapEl.dataset.mu || '';
    const zone = mapEl.dataset.zone || '';
    const speciesType = mapEl.dataset.speciesType || 'MOUNTAIN SHEEP';
    if (typeof bcCardMapInit === 'function') {
      mapEl.dataset.mapInitQueued = '1';
      setTimeout(() => {
        bcCardMapInit(id, mu, zone, speciesType);
        mapEl.dataset.mapInitQueued = '0';
      }, 80);
    }
  });
}

// Builds expand HTML for a BC draw — used by both draw cards and saved cards
function buildBCExpandHTML(r, idPrefix) {
  const isNewDraw = isNewSynopsisHunt(r);
  const actualPct = getBCActualOdds(r);
  const hasDrawOdds = actualPct !== null;
  const pct = hasDrawOdds ? fmt(actualPct) : 'No data';
  const fr  = computeHarvestAvg(r.yearly_fill_rates);
  const frFmt = fr !== null ? fr + '%' : null;
  const frCls = fr !== null ? (fr >= 50 ? 'fill-high' : fr >= 25 ? 'fill-mid' : 'fill-low') : 'fill-none';

  const chartData = bcOddsForChart(r);
  const allEntries = Object.entries(chartData);
  const last10 = allEntries.sort((a,b)=>+a[0]-+b[0])
    .filter(e=>isFinite(parseFloat(e[1])) && parseFloat(e[1]) > 0 && parseFloat(e[1]) <= 100);
  const nYrs = Math.min(last10.length, 10);
  const oddsChartHTML = last10.length < 2
    ? '<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)"><div class="chart-label">Draw odds % by year — no actual results data</div></div>'
    : (() => {
        const wavg10 = Math.min(100, +(last10.slice(-10).reduce((s,e)=>s+parseFloat(e[1]),0)/nYrs).toFixed(1));
        return '<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">' +
          buildOddsLineChart(Object.fromEntries(last10), idPrefix, wavg10, 'Draw odds % by year' + (nYrs < 10 ? ' (' + nYrs + ' yrs)' : '')) +
          '</div>';
      })();

  const harvestChartHTML = fr!=null && Object.keys(r.yearly_fill_rates||{}).length>1
    ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">
        ${buildGreenBarChart(Object.fromEntries(Object.entries(r.yearly_fill_rates||{}).map(([y,v])=>[y,parseFloat(v)*100])), 'bc'+idPrefix, 'Harvest success % by year · AVG ' + (fr !== null ? fr + '%' : '—'))}
      </div>` : '';

  const writeupHTML = r.writeup ? (() => {
    const cleanText = t => (t||'').replace(/\u2014/g,'-').replace(/\u2013/g,'-').replace(/\u2018|\u2019/g,"'").replace(/\u201C|\u201D/g,'"');
    const parts = r.writeup.split('|||');
    const terrain = cleanText(parts[0]);
    const access  = cleanText(parts[1]);
    const notesWarn = r.Notes ? `<div class="tc-warn"><svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1.5L13 12.5H1L7 1.5Z" stroke="#c47a1a" stroke-width="1.2" stroke-linejoin="round"/><path d="M7 6v3" stroke="#c47a1a" stroke-width="1.2" stroke-linecap="round"/><circle cx="7" cy="10.5" r="0.6" fill="#c47a1a"/></svg><span>${r.Notes}</span></div>` : '';
    return '<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">' +
      '<button onclick="event.stopPropagation();toggleWriteup(this)" class="tc-toggle-btn">✦ Terrain &amp; Access <span class="tc-arrow">▾</span></button>' +
      '<div class="writeup-body tc-card" style="display:none;margin-top:10px">' +
      (terrain ? '<div class="tc-section"><div class="tc-section-label"><svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M1 12L5 5l3 4 2-3 3 6H1z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/></svg>Terrain &amp; conditions</div><div class="tc-body">' + terrain + '</div></div>' : '') +
      (access ? '<div class="tc-section"><div class="tc-section-label"><svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="2.5" stroke="currentColor" stroke-width="1.1"/><path d="M2 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>Access &amp; what to expect</div><div class="tc-body">' + access + '</div>' + notesWarn + '</div>' : (notesWarn ? '<div class="tc-section">' + notesWarn + '</div>' : '')) +
      '</div></div>';
  })() : '';

  // ── LEH Zone Map ──
  const mapContainerId = `lehMap_${idPrefix}_${padHuntCode(r.Code)}`;
  const mapSpeciesType = (() => {
    const s = (r.Species || '').toUpperCase();
    if (s.includes('SHEEP') || s.includes('THINHORN') || s.includes('BIGHORN')) return 'MOUNTAIN SHEEP';
    if (s.includes('GOAT'))    return 'MOUNTAIN GOAT';
    if (s.includes('MOOSE'))   return 'MOOSE';
    if (s.includes('ELK'))     return 'ELK';
    if (s.includes('CARIBOU')) return 'CARIBOU';
    if (s.includes('BEAR'))    return 'BLACK BEAR';
    if (s.includes('MULE') || s.includes('BLACK-TAILED')) return 'MULE DEER';
    if (s.includes('WHITE-TAILED') || s.includes('WHITETAIL')) return 'WHITE-TAILED DEER';
    if (s.includes('BISON'))   return 'BISON';
    if (s.includes('TURKEY'))  return 'TURKEY';
    return 'MOUNTAIN SHEEP';
  })();
  const hasZoneModifier = r.Zone && /[\*\+]/.test(r.Zone);
  const zoneLabel = r.Zone ? `Zone ${r.Zone} · MU ${r.MU}` : `MU ${r.MU}`;
  const mapHTML = `
    <div class="leh-card-map-wrap" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted)">Zone Map</span>
          <span style="display:inline-flex;align-items:center;gap:4px;background:rgba(240,180,41,.12);border:1px solid rgba(240,180,41,.4);color:#f0b429;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px">${zoneLabel}</span>${hasZoneModifier ? '<span style="font-size:9px;color:var(--text-muted,#666)">Partial area — see regs</span>' : ''}
        </div>
        <div style="display:flex;gap:3px;align-items:center">
          <button id="${mapContainerId}_btn_satellite" class="leh-map-btn active" data-tile="satellite" onclick="event.stopPropagation();bcCardMapSetLayer('${mapContainerId}','satellite')">Satellite</button>
          <button id="${mapContainerId}_btn_topo" class="leh-map-btn" data-tile="topo" onclick="event.stopPropagation();bcCardMapSetLayer('${mapContainerId}','topo')">Topo</button>
          <button class="leh-map-btn leh-map-expand-btn" onclick="event.stopPropagation();bcCardMapToggleFullscreen('${mapContainerId}')" title="Expand map" style="width:26px;padding:0;font-size:13px;display:flex;align-items:center;justify-content:center">⛶</button>
        </div>
      </div>
      <div id="${mapContainerId}"
           data-mu="${r.MU}"
           data-zone="${r.Zone || ''}"
           data-species-type="${mapSpeciesType}"
           class="leh-card-map"
           style="width:100%;aspect-ratio:1/1;height:auto;border-radius:8px;overflow:hidden;background:#1a1a1a"></div>
      <div id="${mapContainerId}_status" style="font-size:10px;color:var(--text-muted);padding:4px 2px;font-family:monospace"></div>
    </div>`;

    return `
    ${renderBCSpecialBadges(r)}
    <div class="expand-grid">
      <div class="ei"><div class="ei-label">Full MU</div><div class="ei-val">${r.MU}</div></div>
      <div class="ei"><div class="ei-label">Draw Code</div><div class="ei-val">${padHuntCode(r.Code)}</div></div>
      <div class="ei"><div class="ei-label">Zone</div><div class="ei-val">${r.Zone||'—'}</div></div>
      <div class="ei"><div class="ei-label">Season</div><div class="ei-val">${r.Season}</div></div>
      <div class="ei"><div class="ei-label">Draw Odds</div><div class="ei-val">${isNewDraw ? '<span class="new-draw-pill">NEW</span> No data' : pct}</div></div>
      <div class="ei"><div class="ei-label">Tags Available</div><div class="ei-val">${r.Tags}</div></div>
      ${r.fill_rate_alltime!=null?`<div class="ei"><div class="ei-label">Harvest Success (all-time)</div><div class="ei-val">${fmtFill(r.fill_rate_alltime)} <span style="font-size:10px;color:${(r.fill_rate_years||0)>=10?'#4ade80':(r.fill_rate_years||0)>=4?'#facc15':'#f87171'}">(${r.fill_rate_years} yrs)</span></div></div>`:''}
      ${r.Notes?`<div class="ei ei-note">📝 ${r.Notes}</div>`:''}
    </div>
    ${oddsChartHTML}${harvestChartHTML}${writeupHTML}${mapHTML}`;
}

function renderCards() {
  const grid=document.getElementById('cardsGrid');
  if (!grid) return;

  // Cancel any older chunked render that may still be queued.
  // This prevents stale cards from a previous, larger result set from
  // appending underneath the current filtered matches.
  const renderToken = String(Date.now()) + '_' + Math.random().toString(36).slice(2);
  grid.dataset.renderToken = renderToken;

  if (!filtered.length) {
    grid.innerHTML=`<div class="empty"><div class="empty-title">No draws found</div><p>Try adjusting your filters.</p></div>`;
    return;
  }
  const show=filtered.slice(0,300);
  if (WRITEUPS) show.forEach(r=>{ if(!r.writeup){const k=`${r.Species}_${r.MU}_${padHuntCode(r.Code)}`;if(WRITEUPS[k])r.writeup=WRITEUPS[k];}});

  function buildBCCard(r,i) {
    const isNewDraw = isNewSynopsisHunt(r);
    const actualPct = getBCActualOdds(r);
    const hasDrawOdds = actualPct !== null;
    const pct = hasDrawOdds ? fmt(actualPct) : (isNewDraw ? 'NEW' : 'No data');
    const cls = hasDrawOdds ? oddsClass(actualPct) : 'new-draw-card';
    const fr = computeHarvestAvg(r.yearly_fill_rates);
    const frFmt = fr !== null ? fr + '%' : null;
    const frCls = fr !== null ? (fr >= 50 ? 'fill-high' : fr >= 25 ? 'fill-mid' : 'fill-low') : 'fill-none';

    const expandHTML = buildBCExpandHTML(r, i);

    return `<div class="card ${cls}" style="position:relative">
      <button class="star-btn ${isStarred(r) ? 'starred' : ''}" onclick="event.stopPropagation();toggleStar(${i})" title="Save draw">\u2605</button>
      <div class="card-header">
        <div>
          <div class="card-species">${r.Species}</div>
          <div class="card-class">${r.Class}${r.Zone?' &nbsp;·&nbsp; Zone '+r.Zone:''}</div>
          ${isNewDraw ? '<span class="new-draw-pill">NEW</span>' : ''}
          ${renderBCSpecialBadges(r)}
          ${fr!=null?`<span class="fill-badge ${frCls}" data-tooltip="Harvest Success Rate: % of drawn hunters who reported harvesting an animal, averaged over available years."><span class="fill-pct">${frFmt}</span><span class="fill-sub">&nbsp;Harvest Success</span></span>`:`<span class="fill-badge fill-none"><span class="fill-sub">No Harvest Data</span></span>`}
        </div>
        <div class="odds-badge ${hasDrawOdds ? '' : 'new-draw-odds'}" data-tooltip="${hasDrawOdds ? 'Draw Odds: % of applicants who were drawn in ' + BC_ACTUAL_ODDS_YEAR + ' (actual result from BC data catalogue).' : 'New or no matching actual-results row yet — no draw odds data.'}">
          <div class="odds-pct">${pct}</div>
          <div class="odds-ratio">${hasDrawOdds ? BC_ACTUAL_ODDS_YEAR : 'No data yet'}</div>
        </div>
      </div>
      <div class="card-info">
        <div class="ci"><div class="ci-label">Area</div><div class="ci-val hl">${r.Area}</div></div>
        <div class="ci"><div class="ci-label">Region</div><div class="ci-val">${r.MU_General} — ${r.MU_Name}</div></div>
        <div class="ci"><div class="ci-label">MU</div><div class="ci-val">${r.MU}</div></div>
        <div class="ci"><div class="ci-label">Tags</div><div class="ci-val">${r.Tags}</div></div>
        ${(function(){ var pill=typeof renderDriveTimePill==='function'?renderDriveTimePill('BC',r.MU):''; return pill?'<div class="ci ci-drive">'+pill+'</div>':''; })()}
      </div>
      <div class="card-footer">
        <div class="cf-item">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="1" y="2" width="10" height="9" rx="1.2" stroke="currentColor" stroke-width="1.2"/><path d="M4 1v2M8 1v2M1 5h10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
          ${r.Season}
        </div>
        ${typeof renderDriveTimePill === 'function' ? renderDriveTimePill('BC', r.MU) : ''}
      </div>
      <div class="card-expand" id="exp-${i}">${expandHTML}</div>
      <button class="expand-toggle" id="expbtn-${i}" onclick="toggleCard(${i})">▾ Show details</button>
    </div>`;
  }

  // Chunked render — paint first 30 cards immediately
  const CHUNK = 30;
  grid.innerHTML = show.slice(0, CHUNK).map((r,i) => buildBCCard(r,i)).join('');
  if (filtered.length>300) {
    grid.innerHTML+=`<div class="overflow-note">Showing 300 of ${filtered.length.toLocaleString()} — refine filters for more specific results</div>`;
  }

  if (show.length > CHUNK) {
    let offset = CHUNK;
    const overflowNote = grid.lastElementChild && grid.lastElementChild.classList.contains('overflow-note') ? grid.lastElementChild : null;
    function renderNextBCChunk() {
      // Abort if a newer render has started
      if (String(grid.dataset.renderToken) !== String(renderToken)) return;
      if (offset >= show.length) return;
      if (!grid.isConnected) return;
      const batch = show.slice(offset, offset + CHUNK);
      const tmp = document.createElement('div');
      tmp.innerHTML = batch.map((r,j) => buildBCCard(r, offset+j)).join('');
      while (tmp.firstChild) {
        try {
          if (overflowNote && grid.contains(overflowNote)) grid.insertBefore(tmp.firstChild, overflowNote);
          else grid.appendChild(tmp.firstChild);
        } catch(e) { break; }
      }
      offset += CHUNK;
      if (offset < show.length) requestAnimationFrame(renderNextBCChunk);
    }
    requestAnimationFrame(renderNextBCChunk);
  }
}

// Startup handled in startApp()

// ── SEARCH TRACKING HELPER ───────────────────────────────────
function _trackBCSearch(method) {
  const species = selSpecies.size === 1 ? [...selSpecies][0] : (selSpecies.size === 0 ? 'All' : 'Multiple');
  if (window.HS && window.HS.trackSearch) window.HS.trackSearch('BC', species, method || 'filter_bc');
}


// Keep BC zone maps reliable on Saved and Compare tabs, even when those cards are
// rendered by bc-saved-compare.js after this file loads.
window.addEventListener('load', function() {
  if (typeof window.renderSavedPage === 'function' && !window.renderSavedPage._hsZoneMapWrapped) {
    const originalRenderSavedPage = window.renderSavedPage;
    window.renderSavedPage = function() {
      const out = originalRenderSavedPage.apply(this, arguments);
      setTimeout(() => initVisibleBCZoneMaps(document.getElementById('savedPage') || document), 120);
      return out;
    };
    window.renderSavedPage._hsZoneMapWrapped = true;
  }
  if (typeof window.toggleCompare === 'function' && !window.toggleCompare._hsZoneMapWrapped) {
    const originalToggleCompare = window.toggleCompare;
    window.toggleCompare = function() {
      const out = originalToggleCompare.apply(this, arguments);
      setTimeout(() => initVisibleBCZoneMaps(document.getElementById('savedPage') || document), 160);
      return out;
    };
    window.toggleCompare._hsZoneMapWrapped = true;
  }
  if (typeof window.buildComparePanel === 'function' && !window.buildComparePanel._hsZoneMapWrapped) {
    const originalBuildComparePanel = window.buildComparePanel;
    window.buildComparePanel = function() {
      const out = originalBuildComparePanel.apply(this, arguments);
      setTimeout(() => initVisibleBCZoneMaps(document.getElementById('savedPage') || document), 160);
      return out;
    };
    window.buildComparePanel._hsZoneMapWrapped = true;
  }
});


// HuntSmart V8.0 — Saved species filter by active province
let hsSavedSpeciesFilter = localStorage.getItem('huntodds_saved_species_filter') || '';
function hsSavedCurrentProvince() {
  try {
    if (typeof savedProvince !== 'undefined') return savedProvince;
  } catch(e) {}
  const bcBtn = document.getElementById('savedBtnBC');
  const abBtn = document.getElementById('savedBtnAB');
  if (abBtn && abBtn.classList.contains('active')) return 'AB';
  if (bcBtn && bcBtn.classList.contains('active')) return 'BC';
  return 'BC';
}
function hsSavedSpeciesOf(item, province) {
  if (!item) return '';
  return String(province === 'AB' ? (item.species || item.Species || '') : (item.Species || item.species || '')).trim();
}
function hsBuildSavedSpeciesOptions() {
  const sel = document.getElementById('savedSpeciesFilter');
  const row = document.getElementById('savedFilterRow');
  if (!sel) return;
  const prov = hsSavedCurrentProvince();
  const list = prov === 'AB' ? (Array.isArray(abSavedDraws) ? abSavedDraws : []) : (Array.isArray(savedDraws) ? savedDraws : []);
  const species = [...new Set(list.map(x => hsSavedSpeciesOf(x, prov)).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  if (row) row.style.display = list.length ? 'flex' : 'none';
  const current = species.includes(hsSavedSpeciesFilter) ? hsSavedSpeciesFilter : '';
  if (current !== hsSavedSpeciesFilter) {
    hsSavedSpeciesFilter = '';
    localStorage.setItem('huntodds_saved_species_filter', '');
  }
  sel.innerHTML = '<option value="">All species</option>' + species.map(sp => `<option value="${String(sp).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}">${String(sp).replace(/&/g,'&amp;').replace(/</g,'&lt;')}</option>`).join('');
  sel.value = hsSavedSpeciesFilter || '';
}
function setSavedSpeciesFilter(value) {
  hsSavedSpeciesFilter = String(value || '');
  localStorage.setItem('huntodds_saved_species_filter', hsSavedSpeciesFilter);
  if (typeof renderSavedPage === 'function') renderSavedPage();
}
window.setSavedSpeciesFilter = setSavedSpeciesFilter;
(function hsInstallSavedSpeciesFilter(){
  function install() {
    if (typeof renderSavedPage !== 'function' || renderSavedPage._hsSpeciesFilterWrapped) return false;
    const originalRenderSavedPage = renderSavedPage;
    const wrappedRenderSavedPage = function() {
      const prov = hsSavedCurrentProvince();
      const filter = hsSavedSpeciesFilter;
      let oldBC, oldAB;
      if (filter) {
        if (prov === 'BC' && Array.isArray(savedDraws)) {
          oldBC = savedDraws;
          savedDraws = savedDraws.filter(x => hsSavedSpeciesOf(x, 'BC') === filter);
        } else if (prov === 'AB' && Array.isArray(abSavedDraws)) {
          oldAB = abSavedDraws;
          abSavedDraws = abSavedDraws.filter(x => hsSavedSpeciesOf(x, 'AB') === filter);
        }
      }
      try { return originalRenderSavedPage.apply(this, arguments); }
      finally {
        if (oldBC) savedDraws = oldBC;
        if (oldAB) abSavedDraws = oldAB;
        setTimeout(hsBuildSavedSpeciesOptions, 0);
      }
    };
    wrappedRenderSavedPage._hsSpeciesFilterWrapped = true;
    renderSavedPage = wrappedRenderSavedPage;
    window.renderSavedPage = wrappedRenderSavedPage;
    return true;
  }
  const tick = () => { if (!install()) setTimeout(tick, 150); };
  tick();
  // Reset the species dropdown when the user switches province so each province has its own clean list.
  const wrapProvince = () => {
    if (typeof setSavedProvince === 'function' && !setSavedProvince._hsSpeciesFilterWrapped) {
      const old = setSavedProvince;
      const nw = function(prov) {
        hsSavedSpeciesFilter = '';
        localStorage.setItem('huntodds_saved_species_filter', '');
        const out = old.apply(this, arguments);
        setTimeout(hsBuildSavedSpeciesOptions, 0);
        return out;
      };
      nw._hsSpeciesFilterWrapped = true;
      setSavedProvince = nw;
      window.setSavedProvince = nw;
    } else {
      setTimeout(wrapProvince, 150);
    }
  };
  setTimeout(wrapProvince, 300);
})();
