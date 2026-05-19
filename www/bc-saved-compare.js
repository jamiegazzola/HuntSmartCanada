// ══════════════════════════════════════════════════════════════
// ── BC-SAVED-COMPARE.JS
// Merged saved draws page: BC + AB in one tab, compare modal.
// ══════════════════════════════════════════════════════════════

// ── STATE ────────────────────────────────────────────────────
let savedProvince = 'BC';
let savedSortMode = 'odds';

// ── REMOVE SINGLE SAVED DRAW ─────────────────────────────────
function removeSaved(key) {
  const idx = savedDraws.findIndex(s => s._key === key);
  if (idx >= 0) {
    savedDraws.splice(idx, 1);
    import('./sync.js').then(m => m.syncRemoveBCDraw(key));
    localStorage.setItem('huntodds_saved', JSON.stringify(savedDraws));
    compareSelected.delete(key);
    updateSavedBadge();
    renderSavedPage();
  }
}

// ── UNSAVE ALL SELECTED DRAWS ─────────────────────────────────
function unsaveSelected() {
  if (!compareSelected.size) return;
  const keys = [...compareSelected];
  if (savedProvince === 'BC') {
    keys.forEach(key => {
      const idx = savedDraws.findIndex(s => s._key === key);
      if (idx >= 0) {
        savedDraws.splice(idx, 1);
        import('./sync.js').then(m => m.syncRemoveBCDraw(key));
      }
    });
    localStorage.setItem('huntodds_saved', JSON.stringify(savedDraws));
  } else {
    keys.forEach(key => {
      const idx = abSavedDraws.findIndex(s => s._key === key);
      if (idx >= 0) {
        abSavedDraws.splice(idx, 1);
        import('./sync.js').then(m => m.syncRemoveABDraw(key));
      }
    });
    localStorage.setItem('huntodds_ab_saved', JSON.stringify(abSavedDraws));
  }
  compareSelected.clear();
  compareMode = false;
  updateSavedBadge();
  renderSavedPage();
}

// ── CLEAR ALL FOR ACTIVE PROVINCE ────────────────────────────
function clearProvinceSaved() {
  if (savedProvince === 'BC') {
    if (!savedDraws.length) return;
    savedDraws.forEach(d => import('./sync.js').then(m => m.syncRemoveBCDraw(d._key)));
    savedDraws = [];
    localStorage.setItem('huntodds_saved', JSON.stringify([]));
  } else {
    if (!abSavedDraws.length) return;
    abSavedDraws.forEach(d => import('./sync.js').then(m => m.syncRemoveABDraw(d._key)));
    abSavedDraws = [];
    localStorage.setItem('huntodds_ab_saved', JSON.stringify([]));
  }
  compareMode = false;
  compareSelected.clear();
  updateSavedBadge();
  renderSavedPage();
}

// ── BADGE ─────────────────────────────────────────────────────
function updateSavedBadge() {
  const total = (savedDraws?.length || 0) + (abSavedDraws?.length || 0);
  ['savedBadge', 'savedBadgeMobile'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = total;
    el.style.display = total > 0 ? 'inline-flex' : 'none';
  });
  const bcCount = document.getElementById('savedCountBC');
  const abCount = document.getElementById('savedCountAB');
  if (bcCount) bcCount.textContent = savedDraws?.length || 0;
  if (abCount) abCount.textContent = abSavedDraws?.length || 0;
}

// ── PROVINCE TOGGLE ──────────────────────────────────────────
function setSavedProvince(prov) {
  savedProvince = prov;
  compareMode = false;
  compareSelected.clear();
  document.getElementById('savedBtnBC')?.classList.toggle('active', prov === 'BC');
  document.getElementById('savedBtnAB')?.classList.toggle('active', prov === 'AB');
  renderSavedPage();
}

// ── SORT ─────────────────────────────────────────────────────
function setSavedSort(mode) {
  savedSortMode = mode;
  document.getElementById('savedSortOdds')?.classList.toggle('active', mode === 'odds');
  document.getElementById('savedSortHarvest')?.classList.toggle('active', mode === 'harvest');
  renderSavedPage();
}

// ── COMPARE TOGGLE ───────────────────────────────────────────
function toggleCompare() {
  compareMode = !compareMode;
  compareSelected.clear();
  renderSavedPage();
}

function launchCompare() {
  if (compareSelected.size >= 2) {
    if (savedProvince === 'BC') buildComparePanel();
    else buildABComparePanel();
  }
}

function toggleCompareSelect(key) {
  if (compareSelected.has(key)) {
    compareSelected.delete(key);
  } else if (compareSelected.size < 4) {
    compareSelected.add(key);
  }
  _refreshSelectUI(key);
  _updateActionBar();
}

// Refresh just the visual state of one card without full re-render
function _refreshSelectUI(key) {
  const card = document.querySelector(`[data-savekey="${CSS.escape(key)}"]`);
  if (card) card.classList.toggle('compare-selected', compareSelected.has(key));
  const cb = document.querySelector(`[data-comparecb="${CSS.escape(key)}"]`);
  if (cb) cb.checked = compareSelected.has(key);
}

function _updateActionBar() {
  const compareBtn  = document.getElementById('compareBtn');
  const unsaveBtn   = document.getElementById('unsaveSelectedBtn');
  const sel = compareSelected.size;

  if (compareBtn) {
    if (sel >= 2) {
      compareBtn.textContent = `Compare ${sel} →`;
      compareBtn.onclick = launchCompare;
      compareBtn.classList.add('ready');
      compareBtn.disabled = false;
    } else {
      compareBtn.textContent = sel === 1 ? 'Select 1 more' : 'Select draws';
      compareBtn.onclick = null;
      compareBtn.classList.remove('ready');
      compareBtn.disabled = true;
    }
  }
  if (unsaveBtn) {
    unsaveBtn.style.display = sel > 0 ? 'inline-flex' : 'none';
    unsaveBtn.textContent = sel === 1 ? 'Unsave 1' : `Unsave ${sel}`;
  }
}

// ── MAIN RENDER ──────────────────────────────────────────────
function renderSavedPage() {
  const grid      = document.getElementById('savedCardsGrid');
  const compareBtn = document.getElementById('compareBtn');
  const unsaveBtn  = document.getElementById('unsaveSelectedBtn');
  const clearBtn   = document.getElementById('clearProvBtn');
  const subtitle   = document.getElementById('savedSubtitle');
  const sortBar    = document.getElementById('savedSortBar');
  if (!grid) return;

  updateSavedBadge();

  const draws = savedProvince === 'BC' ? savedDraws : abSavedDraws;

  // Clear button — province-specific, always visible if draws exist
  if (clearBtn) {
    clearBtn.style.display = draws.length > 0 ? 'inline-flex' : 'none';
    clearBtn.textContent = `Clear ${savedProvince}`;
  }

  // Sort bar
  if (sortBar) sortBar.style.display = draws.length > 1 ? 'flex' : 'none';

  // Empty state
  if (draws.length === 0) {
    compareMode = false;
    compareSelected.clear();
    if (compareBtn) compareBtn.style.display = 'none';
    if (unsaveBtn)  unsaveBtn.style.display  = 'none';
    const cta = savedProvince === 'BC'
      ? `<button class="hero-cta" onclick="showPage('filter')" style="margin-top:16px;width:auto;padding:11px 24px;font-size:13px">Browse BC Draws</button>`
      : `<button class="hero-cta" onclick="goToAlberta()" style="margin-top:16px;width:auto;padding:11px 24px;font-size:13px">Browse Alberta Draws</button>`;
    grid.innerHTML = `
      <div class="saved-empty">
        <div class="saved-empty-icon">☆</div>
        <div class="saved-empty-title">No saved ${savedProvince === 'BC' ? 'BC' : 'Alberta'} draws yet</div>
        <p class="saved-empty-sub">Tap the ★ on any draw card to save it here.</p>
        ${cta}
      </div>`;
    if (subtitle) subtitle.textContent = 'Your shortlisted hunts.';
    return;
  }

  // Action bar state
  if (compareBtn) {
    compareBtn.style.display = draws.length >= 2 ? 'inline-flex' : 'none';
    if (compareMode) {
      _updateActionBar();
    } else {
      compareBtn.textContent = 'Compare';
      compareBtn.onclick = toggleCompare;
      compareBtn.classList.remove('ready');
      compareBtn.disabled = false;
    }
  }
  if (unsaveBtn) {
    unsaveBtn.style.display = compareMode && compareSelected.size > 0 ? 'inline-flex' : 'none';
  }

  // Subtitle
  if (subtitle) {
    subtitle.textContent = compareMode
      ? `Select 2–4 draws to compare.`
      : `${draws.length} saved draw${draws.length !== 1 ? 's' : ''}.`;
  }

  // Sort
  const sorted = [...draws].sort((a, b) => {
    if (savedSortMode === 'harvest') {
      const fa = savedProvince === 'BC'
        ? computeHarvestAvg(a.yearly_fill_rates)
        : computeABHarvestAvg(a.species, a.wmu);
      const fb = savedProvince === 'BC'
        ? computeHarvestAvg(b.yearly_fill_rates)
        : computeABHarvestAvg(b.species, b.wmu);
      if (fb === null && fa === null) return 0;
      if (fb === null) return -1;
      if (fa === null) return 1;
      return fb - fa;
    }
    const ao = savedProvince === 'BC' ? (a['%'] || 0) : (a.personalOdds !== null ? a.personalOdds : a.latestOdds || 0);
    const bo = savedProvince === 'BC' ? (b['%'] || 0) : (b.personalOdds !== null ? b.personalOdds : b.latestOdds || 0);
    return bo - ao;
  });

  grid.innerHTML = savedProvince === 'BC'
    ? sorted.map(r => _buildBCSavedCard(r)).join('')
    : sorted.map(c => _buildABSavedCard(c)).join('');
}

// ── BC SAVED CARD ─────────────────────────────────────────────
function _buildBCSavedCard(r) {
  const cls    = oddsClass(r['%']), pct = fmt(r['%']);
  const fr     = computeHarvestAvg(r.yearly_fill_rates);
  const frFmt  = fr !== null ? fr + '%' : null;
  const frCls  = fr !== null ? (fr >= 50 ? 'fill-high' : fr >= 25 ? 'fill-mid' : 'fill-low') : 'fill-none';
  const isSel  = compareSelected.has(r._key);
  return `
    <div class="card ${cls}${isSel ? ' compare-selected' : ''}" style="position:relative" data-savekey="${r._key}">
      <button class="star-btn starred" onclick="removeSaved('${r._key}')" title="Unsave">★</button>
      <div class="card-header">
        <div>
          <div class="card-species">${r.Species}</div>
          <div class="card-class">${r.Class}${r.Zone ? ' &nbsp;·&nbsp; Zone ' + r.Zone : ''}</div>
          ${frFmt
            ? `<span class="fill-badge ${frCls}"><span class="fill-pct">${frFmt}</span><span class="fill-sub">&nbsp;Harvest Success</span></span>`
            : `<span class="fill-badge fill-none"><span class="fill-sub">No Harvest Data</span></span>`}
        </div>
        <div class="odds-badge">
          <div class="odds-pct">${pct}</div>
          <div class="odds-ratio">${r.Odds}</div>
        </div>
      </div>
      <div class="card-info">
        <div class="ci"><div class="ci-label">Area</div><div class="ci-val hl">${r.Area}</div></div>
        <div class="ci"><div class="ci-label">Region</div><div class="ci-val">${r.MU_General} — ${r.MU_Name}</div></div>
        <div class="ci"><div class="ci-label">MU</div><div class="ci-val">${r.MU}</div></div>
        <div class="ci"><div class="ci-label">Tags</div><div class="ci-val">${r.Tags}</div></div>
      </div>
      <div class="card-footer">
        <div class="cf-item">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="1" y="2" width="10" height="9" rx="1.2" stroke="currentColor" stroke-width="1.2"/><path d="M4 1v2M8 1v2M1 5h10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
          ${r.Season}
        </div>
        <div class="cf-item">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 8l1.5-4h5L10 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="3.5" cy="9" r="1" fill="currentColor"/><circle cx="8.5" cy="9" r="1" fill="currentColor"/><path d="M1 8h10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
          ${r.Drive}
        </div>
      </div>
      <div class="card-expand" id="saved-exp-${r._key}">${buildBCExpandHTML(r, 'sv_'+r._key)}</div>
      <button class="expand-toggle" id="saved-expbtn-${r._key}" onclick="event.stopPropagation();toggleSavedCard('${r._key}')">▾ Show details</button>
      ${compareMode ? `
        <label class="saved-card-select-bar${isSel ? ' selected' : ''}" data-comparecb="${r._key}">
          <input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleCompareSelect('${r._key}')">
          <span>${isSel ? '✓ Selected' : 'Select to compare'}</span>
        </label>` : ''}
    </div>`;
}

// ── AB SAVED CARD ─────────────────────────────────────────────
function _buildABSavedCard(c) {
  const displayOdds = c.personalOdds !== null ? c.personalOdds : c.latestOdds;
  const cls = abOddsClass(displayOdds);
  const harvestAvg = computeABHarvestAvg(c.species, c.wmu);
  const harvestFmt = harvestAvg !== null ? harvestAvg + '%' : null;
  const harvestCls = harvestAvg !== null ? (harvestAvg >= 50 ? 'fill-high' : harvestAvg >= 25 ? 'fill-mid' : 'fill-low') : null;
  const abClassLabel = (() => {
    const d = (c.draw || '').toLowerCase();
    if (d.includes('antlerless')) return 'Antlerless';
    if (d.includes('antlered')) return 'Antlered';
    return 'Any';
  })();
  const isSel = compareSelected.has(c._key);
  return `
    <div class="card ${cls}${isSel ? ' compare-selected' : ''}" style="position:relative" data-savekey="${c._key}">
      <button class="star-btn starred" onclick="abRemoveSaved('${c._key}')" title="Unsave">★</button>
      <div class="card-header">
        <div style="flex:1;min-width:0">
          <div class="card-species">${c.species}</div>
          <div class="card-class">${abClassLabel}&nbsp;·&nbsp;WMU ${c.wmu}</div>
          ${harvestFmt
            ? `<span class="fill-badge ${harvestCls}"><span class="fill-pct">${harvestFmt}</span><span class="fill-sub">&nbsp;Harvest Success</span></span>`
            : `<span class="fill-badge fill-none"><span class="fill-sub">No Harvest Data</span></span>`}
        </div>
        <div class="odds-badge" style="flex-shrink:0">
          <div class="odds-pct">${abFmt(displayOdds)}</div>
          <div class="odds-ratio">${c.latestYear}</div>
        </div>
      </div>
      <div class="card-info">
        <div class="ci"><div class="ci-label">Draw</div><div class="ci-val hl">${c.draw}</div></div>
        <div class="ci"><div class="ci-label">WMU</div><div class="ci-val">${c.wmu}</div></div>
        ${c.season && c.season !== '1' ? `<div class="ci"><div class="ci-label">Season</div><div class="ci-val">${c.season}</div></div>` : ''}
        ${c.minPtsToDraw !== null ? `<div class="ci"><div class="ci-label">Min Pts</div><div class="ci-val">${c.minPtsToDraw} pts</div></div>` : ''}
      </div>
      <div class="card-expand" id="saved-ab-exp-${c._key}"><div style="padding:12px;color:var(--text-muted);font-size:12px">Loading details…</div></div>
      <button class="expand-toggle" id="saved-ab-expbtn-${c._key}" onclick="event.stopPropagation();abToggleSavedCard('${c._key}')">▾ Show details</button>
      ${compareMode ? `
        <label class="saved-card-select-bar${isSel ? ' selected' : ''}" data-comparecb="${c._key}">
          <input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleCompareSelect('${c._key}')">
          <span>${isSel ? '✓ Selected' : 'Select to compare'}</span>
        </label>` : ''}
    </div>`;
}

// ── BC COMPARE MODAL ──────────────────────────────────────────
function buildComparePanel() {
  const draws = savedDraws.filter(s => compareSelected.has(s._key));
  if (draws.length < 2) return;

  const existing = document.getElementById('compareModal');
  if (existing) existing.remove();

  const COLORS = ['#4a7fd4', '#4caf82', '#e6a817', '#e05c5c'];
  const n = draws.length;

  function buildOddsSparkline(r, color) {
    const entries = Object.entries(r.yearly_draw_odds || {})
      .sort((a,b) => +a[0] - +b[0]).slice(-10)
      .filter(e => isFinite(parseFloat(e[1])) && parseFloat(e[1]) > 0);
    if (entries.length < 2) return '<div style="font-size:11px;color:var(--text-muted);padding:16px 0;text-align:center">No historical data</div>';
    const W = 220, H = 64, PL = 4, PR = 4, PT = 6, PB = 18;
    const vals = entries.map(e => parseFloat(e[1]));
    const maxV = Math.max(...vals, 0.1);
    const minYr = +entries[0][0], maxYr = +entries[entries.length-1][0];
    const yrSpan = maxYr - minYr || 1;
    const pw = W - PL - PR, ph = H - PT - PB;
    const pts = entries.map(([yr,v]) => ({
      x: PL + ((+yr - minYr)/yrSpan)*pw,
      y: PT + ph - (parseFloat(v)/maxV)*ph,
      yr, v: parseFloat(v)
    }));
    const line = 'M' + pts.map(p => p.x.toFixed(1)+','+p.y.toFixed(1)).join(' L');
    const fill = `M${PL},${PT+ph} L` + pts.map(p => p.x.toFixed(1)+','+p.y.toFixed(1)).join(' L') + ` L${pts[pts.length-1].x.toFixed(1)},${PT+ph} Z`;
    const avg = vals.reduce((a,b)=>a+b,0)/vals.length;
    const avgY = (PT + ph - (avg/maxV)*ph).toFixed(1);
    const labels = [entries[0], entries[Math.floor(entries.length/2)], entries[entries.length-1]];
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">
      <defs><linearGradient id="sg${r.Code||Math.random().toString(36).slice(2)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="0.35"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      <path d="${fill}" fill="url(#sg${r.Code||'x'})" />
      <line x1="${PL}" y1="${avgY}" x2="${W-PR}" y2="${avgY}" stroke="${color}" stroke-opacity="0.3" stroke-width="1" stroke-dasharray="3,3"/>
      <path d="${line}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      ${pts.map(p=>`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.5" fill="${color}"/>`).join('')}
      ${labels.map(([yr])=>{const p=pts.find(x=>x.yr===yr);return p?`<text x="${p.x.toFixed(1)}" y="${H-4}" text-anchor="middle" font-size="8" fill="var(--text-muted)">${yr}</text>`:''}).join('')}
    </svg>`;
  }

  function buildSuccessChart(r, color) {
    const entries = Object.entries(r.yearly_fill_rates || {})
      .sort((a,b) => +a[0] - +b[0]).slice(-8)
      .filter(e => parseFloat(e[1]) >= 0);
    if (entries.length < 2) return '<div style="font-size:11px;color:var(--text-muted);padding:16px 0;text-align:center">No historical data</div>';
    const W = 220, H = 64, PB = 18, PT = 6;
    const barW = Math.min(22, (W - 8) / entries.length - 3);
    const totalW = entries.length * (barW + 3) - 3;
    const startX = (W - totalW) / 2;
    const bars = entries.map(([yr, val], i) => {
      const v = Math.min(parseFloat(val), 1);
      const bh = Math.max(2, Math.round(v * (H - PT - PB)));
      const x = startX + i * (barW + 3);
      const y = PT + (H - PT - PB) - bh;
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW}" height="${bh}" rx="2" fill="${color}" fill-opacity="${0.4 + v*0.5}"/>
        <text x="${(x + barW/2).toFixed(1)}" y="${H - 4}" text-anchor="middle" font-size="8" fill="var(--text-muted)">${yr.slice(-2)}</text>`;
    }).join('');
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">${bars}</svg>`;
  }

  function statBar(val, maxVal, color) {
    const pct = maxVal > 0 ? Math.min(100, (val/maxVal)*100) : 0;
    return `<div style="height:5px;background:rgba(255,255,255,0.07);border-radius:3px;margin-top:5px;overflow:hidden">
      <div style="height:100%;width:${pct.toFixed(1)}%;background:${color};border-radius:3px;transition:width 0.6s ease"></div>
    </div>`;
  }

  const maxOdds    = Math.max(...draws.map(d => d['%'] || 0), 0.01);
  const maxFill    = Math.max(...draws.map(d => d.fill_rate_3yr || 0), 0.01);
  const maxTags    = Math.max(...draws.map(d => parseInt(d.Tags) || 0), 1);
  const maxDriveKm = Math.max(...draws.map(d => {
    const m = (d.Drive||'').match(/(\d[\d,]*)\s*km/);
    return m ? parseInt(m[1].replace(',','')) : 0;
  }), 1);

  const cols = draws.map((r, i) => {
    const color = COLORS[i % COLORS.length];
    const oddsVal = r['%'] || 0;
    const fillVal = r.fill_rate_3yr;
    const fillAllTime = r.fill_rate_alltime;
    const driveKm = (() => { const m = (r.Drive||'').match(/(\d[\d,]*)\s*km/); return m ? parseInt(m[1].replace(',','')) : 0; })();
    const driveHrs = (r.Drive||'').match(/\(([^)]+)\)/)?.[1] || '';
    const tags = parseInt(r.Tags) || 0;
    const oddsColor = oddsVal >= 5 ? '#4caf82' : oddsVal >= 1 ? '#e6a817' : '#e05c5c';
    const fillColor = fillVal >= 0.7 ? '#4caf82' : fillVal >= 0.4 ? '#e6a817' : fillVal != null ? '#e05c5c' : 'var(--text-muted)';
    return `<div class="cmp-col" style="--col-color:${color}">
      <div class="cmp-col-header" style="border-top:3px solid ${color}">
        <div class="cmp-species">${r.Species}</div>
        <div class="cmp-class">${r.Class}${r.Zone ? ' · Zone ' + r.Zone : ''}</div>
        <div class="cmp-area">${r.Area} · MU ${r.MU}</div>
        <div class="cmp-region" style="color:${color}">${r.MU_General} — ${r.MU_Name}</div>
      </div>
      <div class="cmp-section">
        <div class="cmp-section-label">KEY STATS</div>
        <div class="cmp-stat">
          <div class="cmp-stat-label">Draw Odds</div>
          <div class="cmp-stat-val" style="color:${oddsColor}">${fmt(oddsVal)}</div>
          <div class="cmp-stat-sub">${r.Odds || '—'}</div>
          ${statBar(oddsVal, maxOdds, oddsColor)}
        </div>
        <div class="cmp-stat">
          <div class="cmp-stat-label">3-Yr Success Rate</div>
          <div class="cmp-stat-val" style="color:${fillColor}">${fillVal != null ? fmtFill(fillVal) : '—'}</div>
          ${fillVal != null ? statBar(fillVal, maxFill, fillColor) : ''}
        </div>
        ${fillAllTime != null ? `<div class="cmp-stat">
          <div class="cmp-stat-label">All-Time Success Rate</div>
          <div class="cmp-stat-val">${fmtFill(fillAllTime)}</div>
          <div class="cmp-stat-sub">${r.fill_rate_years || '?'} yrs data</div>
        </div>` : ''}
        <div class="cmp-stat">
          <div class="cmp-stat-label">Tags Available</div>
          <div class="cmp-stat-val">${tags || '—'}</div>
          ${statBar(tags, maxTags, color)}
        </div>
      </div>
      <div class="cmp-section">
        <div class="cmp-section-label">HUNT DETAILS</div>
        <div class="cmp-detail-row"><span class="cmp-dl">Season</span><span class="cmp-dv">${r.Season || '—'}</span></div>
        <div class="cmp-detail-row"><span class="cmp-dl">Draw Code</span><span class="cmp-dv">${r.Code || '—'}</span></div>
        <div class="cmp-detail-row"><span class="cmp-dl">Drive</span><span class="cmp-dv">${driveKm > 0 ? driveKm.toLocaleString() + ' km' : '—'}${driveHrs ? ' ('+driveHrs+')' : ''}</span></div>
        ${statBar(driveKm, maxDriveKm, color)}
      </div>
      <div class="cmp-section">
        <div class="cmp-section-label">DRAW ODDS HISTORY</div>
        ${buildOddsSparkline(r, color)}
      </div>
      <div class="cmp-section">
        <div class="cmp-section-label">SUCCESS RATE HISTORY</div>
        ${buildSuccessChart(r, color)}
      </div>
    </div>`;
  }).join('');

  const legend = draws.map((r,i) => `
    <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-dim)">
      <div style="width:10px;height:10px;border-radius:50%;background:${COLORS[i%COLORS.length]};flex-shrink:0"></div>
      ${r.Species} · ${r.Area} MU ${r.MU}
    </div>`).join('');

  const modal = document.createElement('div');
  modal.id = 'compareModal';
  modal.innerHTML = `
    <div class="cmp-backdrop" onclick="closeCompareModal()"></div>
    <div class="cmp-modal">
      <div class="cmp-modal-header">
        <div>
          <div class="cmp-modal-title">BC Draw Comparison</div>
          <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:6px">${legend}</div>
        </div>
        <button class="cmp-close-btn" onclick="closeCompareModal()">✕ Close</button>
      </div>
      <div class="cmp-cols" style="--n-cols:${n}">${cols}</div>
    </div>`;
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => modal.classList.add('cmp-visible'));
}

// ── AB COMPARE MODAL ──────────────────────────────────────────
function buildABComparePanel() {
  const draws = abSavedDraws.filter(s => compareSelected.has(s._key));
  if (draws.length < 2) return;

  const existing = document.getElementById('compareModal');
  if (existing) existing.remove();

  const COLORS = ['#4a7fd4', '#4caf82', '#e6a817', '#e05c5c'];
  const n = draws.length;

  function statBar(val, maxVal, color) {
    const pct = maxVal > 0 ? Math.min(100, (val/maxVal)*100) : 0;
    return `<div style="height:5px;background:rgba(255,255,255,0.07);border-radius:3px;margin-top:5px;overflow:hidden">
      <div style="height:100%;width:${pct.toFixed(1)}%;background:${color};border-radius:3px;transition:width 0.6s ease"></div>
    </div>`;
  }

  const maxOdds    = Math.max(...draws.map(d => d.personalOdds !== null ? d.personalOdds : d.latestOdds || 0), 0.01);
  const maxHarvest = Math.max(...draws.map(d => computeABHarvestAvg(d.species, d.wmu) || 0), 0.01);

  const cols = draws.map((c, i) => {
    const color = COLORS[i % COLORS.length];
    const displayOdds = c.personalOdds !== null ? c.personalOdds : c.latestOdds;
    const harvest = computeABHarvestAvg(c.species, c.wmu);
    const oddsColor    = displayOdds >= 20 ? '#4caf82' : displayOdds >= 5 ? '#e6a817' : '#e05c5c';
    const harvestColor = harvest >= 50 ? '#4caf82' : harvest >= 25 ? '#e6a817' : harvest !== null ? '#e05c5c' : 'var(--text-muted)';
    const abClassLabel = (() => {
      const d = (c.draw || '').toLowerCase();
      if (d.includes('antlerless')) return 'Antlerless';
      if (d.includes('antlered')) return 'Antlered';
      return 'Any';
    })();
    return `<div class="cmp-col" style="--col-color:${color}">
      <div class="cmp-col-header" style="border-top:3px solid ${color}">
        <div class="cmp-species">${c.species}</div>
        <div class="cmp-class">${abClassLabel} · WMU ${c.wmu}</div>
        <div class="cmp-area">${c.draw}</div>
        <div class="cmp-region" style="color:${color}">${c.latestYear}</div>
      </div>
      <div class="cmp-section">
        <div class="cmp-section-label">KEY STATS</div>
        <div class="cmp-stat">
          <div class="cmp-stat-label">Draw Odds</div>
          <div class="cmp-stat-val" style="color:${oddsColor}">${abFmt(displayOdds)}</div>
          ${c.personalOdds !== null ? `<div class="cmp-stat-sub">${c.userPts} pt${c.userPts !== 1 ? 's' : ''} odds</div>` : ''}
          ${statBar(displayOdds, maxOdds, oddsColor)}
        </div>
        <div class="cmp-stat">
          <div class="cmp-stat-label">Harvest Success</div>
          <div class="cmp-stat-val" style="color:${harvestColor}">${harvest !== null ? harvest + '%' : '—'}</div>
          ${harvest !== null ? statBar(harvest, maxHarvest, harvestColor) : ''}
        </div>
        ${c.minPtsToDraw !== null ? `<div class="cmp-stat">
          <div class="cmp-stat-label">Min Pts to Draw</div>
          <div class="cmp-stat-val">${c.minPtsToDraw} pts</div>
        </div>` : ''}
        <div class="cmp-stat">
          <div class="cmp-stat-label">Quota (${c.latestYear})</div>
          <div class="cmp-stat-val">${c.quota || '—'}</div>
        </div>
      </div>
      <div class="cmp-section">
        <div class="cmp-section-label">HUNT DETAILS</div>
        <div class="cmp-detail-row"><span class="cmp-dl">WMU</span><span class="cmp-dv">${c.wmu}</span></div>
        ${c.season && c.season !== '1' ? `<div class="cmp-detail-row"><span class="cmp-dl">Season</span><span class="cmp-dv">${c.season}</span></div>` : ''}
        <div class="cmp-detail-row"><span class="cmp-dl">Yrs of data</span><span class="cmp-dv">${c.numYears}</span></div>
      </div>
    </div>`;
  }).join('');

  const legend = draws.map((c,i) => `
    <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-dim)">
      <div style="width:10px;height:10px;border-radius:50%;background:${COLORS[i%COLORS.length]};flex-shrink:0"></div>
      ${c.species} · WMU ${c.wmu}
    </div>`).join('');

  const modal = document.createElement('div');
  modal.id = 'compareModal';
  modal.innerHTML = `
    <div class="cmp-backdrop" onclick="closeCompareModal()"></div>
    <div class="cmp-modal">
      <div class="cmp-modal-header">
        <div>
          <div class="cmp-modal-title">Alberta Draw Comparison</div>
          <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:6px">${legend}</div>
        </div>
        <button class="cmp-close-btn" onclick="closeCompareModal()">✕ Close</button>
      </div>
      <div class="cmp-cols" style="--n-cols:${n}">${cols}</div>
    </div>`;
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => modal.classList.add('cmp-visible'));
}

function closeCompareModal() {
  const modal = document.getElementById('compareModal');
  if (modal) {
    modal.classList.remove('cmp-visible');
    setTimeout(() => { modal.remove(); document.body.style.overflow = ''; }, 300);
  }
}
