const ODDS_STEPS = [0,1,2,5,10,20,50,75];
const MU_NAMES = {1:"Vancouver Island",2:"Lower Mainland",3:"Thompson",4:"Kootenay",5:"Cariboo",6:"Skeena",7:"Omineca / Peace",8:"Okanagan"};

// ── MAIN STATE ──
let selSpecies = new Set();
let selClass = new Set();
let selMUs = new Set();
let selMUsFull = new Set(); // full BC WMU IDs like '4-01' for map filter

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
const BC_ACTUAL_ODDS_YEAR = 2024;

function getBCActualOdds(r) {
  const ydo = r.yearly_draw_odds || {};
  if (ydo[BC_ACTUAL_ODDS_YEAR] !== undefined) return parseFloat(ydo[BC_ACTUAL_ODDS_YEAR]);
  const years = Object.keys(ydo).map(Number).filter(y => y <= BC_ACTUAL_ODDS_YEAR).sort((a,b)=>b-a);
  return years.length > 0 ? parseFloat(ydo[years[0]]) : null;
}

function bcOddsForChart(r) {
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
  const key = r._key || (r.Species + '_' + r.Class + '_' + (r.MU || '')).replace(/[\s\/\\'"]/g, '_');
  return savedDraws.some(s => s._key === key);
}

function toggleStar(i) {
  const r = filtered[i];
  if (!r) return;
  const key = r._key || (r.Species + '_' + r.Class + '_' + (r.MU || '')).replace(/[\s\/\\'"]/g, '_');
  const idx = savedDraws.findIndex(s => s._key === key);
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
  if (page==='draws') { buildMUList(); buildSpeciesChips(); buildClassChips(); loadWriteups().then(()=>applyFilters()); applyFilters(); _trackBCSearch('filter_bc'); }
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
  selSpecies.add(s);
  showPage('draws');
  buildSpeciesChips();
  buildMUList();
  buildClassChips();
  applyFilters();
}


// ── FILTERS ──
function oddsClass(p) { return p >= 20 ? 'green' : p >= 5 ? 'yellow' : 'red'; }
function fmt(p) {
  if (isNaN(p)||p==null) return '?%';
  return (p>=10 ? Math.round(p) : p.toFixed(1)) + '%';
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
    .filter(([y]) => String(y).slice(0,4) < '2025')  // exclude incomplete current year
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
    .filter(([y]) => String(y).slice(0,4) < '2025')  // exclude incomplete current year
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
  const all = [...new Set(DATA.map(r=>r.Species))].sort();
  document.getElementById('speciesChips').innerHTML = all.map(s =>
    `<div class="chip${selSpecies.has(s)?' active':''}" onclick="toggleSpecies('${s}')">${s}</div>`
  ).join('');
  document.getElementById('clearSpecies').classList.toggle('visible', selSpecies.size>0);
}

function buildMUList() {
  const relevant = selSpecies.size===0 ? DATA : DATA.filter(r=>selSpecies.has(r.Species));
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
  if (selSpecies.has(s)) selSpecies.delete(s); else selSpecies.add(s);
  // Clear region filter when species changes — different species live in different
  // regions so a stale selMUs silently excludes valid draws (e.g. Thinhorn Sheep
  // are only in region 6 but Bighorn are in 3/4/8 — keeping region 4 selected
  // when adding Thinhorn hides all 6 Thinhorn draws)
  selMUs.clear();
  buildSpeciesChips(); buildMUList(); applyFilters();
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
  if (type==='species') { selSpecies.clear(); buildSpeciesChips(); buildMUList(); }
  if (type==='mu') { selMUs.clear(); selMUsFull.clear(); bcUpdateMapChips(); bcUpdateMapStyles(); buildMUList(); }
  if (type==='class') { selClass.clear(); buildClassChips(); }
  applyFilters();
}

function setSort(mode) {
  sortMode = mode;
  document.getElementById('sortOddsBtn').classList.toggle('active', mode==='odds');
  const ssBtn = document.getElementById('sortSuccessBtn');
  if (ssBtn) ssBtn.classList.toggle('active', mode==='success');
  document.getElementById('sortSeasonBtn').classList.toggle('active', mode==='season');
  applyFilters();
}

function resetAll() {
  selSpecies.clear(); selMUs.clear(); selMUsFull.clear(); selMinOdds=0; selMinHarvest=0; selClass.clear();
    document.getElementById('oddsSlider').value=0;
  onSlider(0);
  bcUpdateMapChips(); bcUpdateMapStyles();
  buildSpeciesChips(); buildMUList(); buildClassChips(); applyFilters();
}

function applyFilters() {
  const q = (document.getElementById('search') ? document.getElementById('search').value : '').toLowerCase();
  filtered = DATA.filter(r => {
    if (selSpecies.size>0 && !selSpecies.has(r.Species)) return false;
    if (selMUs.size>0 && !selMUs.has(r.MU_General)) return false;
    if (selMUsFull.size>0 && !selMUsFull.has(bcNormalizeMU(r.MU))) return false;
    if (selAreas.size>0 && !selAreas.has(r.Area)) return false;
    if ((r['%']||0) < selMinOdds) return false;
    if (selMinHarvest > 0) {
      const hr = computeHarvestAvg(r.yearly_fill_rates);
      if (hr === null || hr < selMinHarvest) return false;
    }
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

  // Season sort: Aug=earliest; pre-Aug months wrap to end
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
  } else {
    filtered.sort((a,b)=>{
      const adj = v => { const n = v||9999; return n < 800 ? n + 1200 : n; };
      return adj(a.Season_Sort) - adj(b.Season_Sort);
    });
  }

  const tags=[];
  selSpecies.forEach(s=>tags.push(s));
  selMUs.forEach(m=>tags.push(m+' — '+(MU_NAMES[m]||'')));
  if (selMinOdds>0) tags.push('≥ '+selMinOdds+'%');


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
  else { el.classList.add('open'); btn.textContent='▴ Hide details'; }
}

function toggleSavedCard(key) {
  const el  = document.getElementById('saved-exp-' + key);
  const btn = document.getElementById('saved-expbtn-' + key);
  if (!el) return;
  const open = el.classList.contains('open');
  if (open) { el.classList.remove('open'); if (btn) btn.textContent = '▾ Show details'; }
  else       { el.classList.add('open');    if (btn) btn.textContent = '▴ Hide details'; }
}

// Builds expand HTML for a BC draw — used by both draw cards and saved cards
function buildBCExpandHTML(r, idPrefix) {
  const actualPct = getBCActualOdds(r);
  const pct = actualPct !== null ? fmt(actualPct) : fmt(r['%']);
  const fr  = computeHarvestAvg(r.yearly_fill_rates);
  const frFmt = fr !== null ? fr + '%' : null;
  const frCls = fr !== null ? (fr >= 50 ? 'fill-high' : fr >= 25 ? 'fill-mid' : 'fill-low') : 'fill-none';

  const chartData = bcOddsForChart(r);
  const allEntries = Object.entries(chartData);
  const last10 = allEntries.sort((a,b)=>+a[0]-+b[0])
    .filter(e=>isFinite(parseFloat(e[1])) && parseFloat(e[1]) > 0 && parseFloat(e[1]) <= 100);
  const nYrs = Math.min(last10.length, 10);
  const oddsChartHTML = last10.length < 2
    ? '<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)"><div class="chart-label">Draw odds % by year — no data available</div></div>'
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

  return `
    <div class="expand-grid">
      <div class="ei"><div class="ei-label">Full MU</div><div class="ei-val">${r.MU}</div></div>
      <div class="ei"><div class="ei-label">Draw Code</div><div class="ei-val">${r.Code}</div></div>
      <div class="ei"><div class="ei-label">Zone</div><div class="ei-val">${r.Zone||'—'}</div></div>
      <div class="ei"><div class="ei-label">Season</div><div class="ei-val">${r.Season}</div></div>
      <div class="ei"><div class="ei-label">Draw Odds (${BC_ACTUAL_ODDS_YEAR} actual)</div><div class="ei-val">${pct}</div></div>
      <div class="ei"><div class="ei-label">Tags Available</div><div class="ei-val">${r.Tags}</div></div>
      ${r.fill_rate_alltime!=null?`<div class="ei"><div class="ei-label">Harvest Success (all-time)</div><div class="ei-val">${fmtFill(r.fill_rate_alltime)} <span style="font-size:10px;color:${(r.fill_rate_years||0)>=10?'#4ade80':(r.fill_rate_years||0)>=4?'#facc15':'#f87171'}">(${r.fill_rate_years} yrs)</span></div></div>`:''}
      ${r.Notes?`<div class="ei ei-note">📝 ${r.Notes}</div>`:''}
    </div>
    ${oddsChartHTML}${harvestChartHTML}${writeupHTML}`;
}

function renderCards() {
  const grid=document.getElementById('cardsGrid');
  if (!filtered.length) {
    grid.innerHTML=`<div class="empty"><div class="empty-title">No draws found</div><p>Try adjusting your filters.</p></div>`;
    return;
  }
  const show=filtered.slice(0,300);
  if (WRITEUPS) show.forEach(r=>{ if(!r.writeup){const k=`${r.Species}_${r.MU}_${r.Code}`;if(WRITEUPS[k])r.writeup=WRITEUPS[k];}});

  function buildBCCard(r,i) {
    const actualPct = getBCActualOdds(r);
    const pct = actualPct !== null ? fmt(actualPct) : fmt(r['%']);
    const cls = oddsClass(actualPct !== null ? actualPct : r['%']);
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
          ${fr!=null?`<span class="fill-badge ${frCls}" data-tooltip="Harvest Success Rate: % of drawn hunters who reported harvesting an animal, averaged over available years."><span class="fill-pct">${frFmt}</span><span class="fill-sub">&nbsp;Harvest Success</span></span>`:`<span class="fill-badge fill-none"><span class="fill-sub">No Harvest Data</span></span>`}
        </div>
        <div class="odds-badge" data-tooltip="Draw Odds: % of applicants who were drawn in ${BC_ACTUAL_ODDS_YEAR} (actual result from BC data catalogue).">
          <div class="odds-pct">${pct}</div>
          <div class="odds-ratio">${BC_ACTUAL_ODDS_YEAR}</div>
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
    const renderToken = Date.now();
    grid.dataset.renderToken = renderToken;
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

