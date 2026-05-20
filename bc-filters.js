// BAP / Management Area filter state (kept for apply logic, UI removed)
let fpSelBap = new Set();

// BC filter page map state
let fpBcMapOpen = false;
let fpBcMapInitialized = false;
let fpBcLeafletInstance = null;
let fpBcGeoLayer = null;
let fpBcSelWMU = new Set(); // WMU full IDs selected on filter page map
let fpSelMUsFull = fpBcSelWMU; // alias for apply function

function fpBcToggleMap() {
  const panel = document.getElementById('fpBcMapPanel');
  const btn = document.getElementById('fpBcMapBtn');
  if (!panel || !btn) return;
  fpBcMapOpen = !fpBcMapOpen;
  panel.style.display = fpBcMapOpen ? 'block' : 'none';
  btn.style.background = fpBcMapOpen ? 'rgba(74,222,128,.22)' : 'rgba(74,222,128,.1)';
  btn.innerHTML = fpBcMapOpen
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Close Map`
    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg> Filter by Map`;
  if (fpBcMapOpen) {
    const container = document.getElementById('fpBcLeafletMap');
    if (!fpBcMapInitialized || (container && !container._leaflet_id)) {
      fpBcMapInitialized = false; fpBcLeafletInstance = null; fpBcGeoLayer = null;
      fpBcInitMap();
    } else {
      setTimeout(() => fpBcLeafletInstance && fpBcLeafletInstance.invalidateSize(), 150);
    }
  }
}

function fpBcInitMap() {
  if (fpBcMapInitialized) return;
  fpBcMapInitialized = true;
  function doInit() {
    const container = document.getElementById('fpBcLeafletMap');
    if (!container) return;
    if (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON) {
      fpBcRenderMap(bcWmuGeoJSON);
    } else if (typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON) {
      bcWmuGeoJSON = BC_WMU_GEOJSON;
      fpBcRenderMap(BC_WMU_GEOJSON);
    }
  }
  if (typeof L !== 'undefined') doInit();
  else {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    s.onload = doInit;
    document.head.appendChild(s);
  }
}

function fpBcRenderMap(geojson) {
  const container = document.getElementById('fpBcLeafletMap');
  if (!container) return;
  if (container._leaflet_id) { container.innerHTML = ''; delete container._leaflet_id; }

  fpBcLeafletInstance = L.map('fpBcLeafletMap', {
    center: [54.0, -124.0], zoom: 5, minZoom: 4, maxZoom: 13,
    zoomControl: true, scrollWheelZoom: true, touchZoom: true, attributionControl: false
  });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { subdomains: 'abc', maxZoom: 19 }).addTo(fpBcLeafletInstance);

  const wmusWithDraws = new Set(DATA.map(r => bcNormalizeMU(r.MU)));

  fpBcGeoLayer = L.geoJSON(geojson, {
    style: feature => fpBcGetStyle(feature, fpBcSelWMU.has(feature.properties.wmu_id || '')),
    onEachFeature: (feature, layer) => {
      const id = feature.properties.wmu_id || '';
      const hasDraws = wmusWithDraws.has(id);

      layer.on('mouseover', function(e) {
        const sel = fpBcSelWMU.has(id);
        this.setStyle(sel
          ? { fillColor: '#4ade80', fillOpacity: 0.92, weight: 3, color: '#fff' }
          : { fillColor: '#fff', fillOpacity: 0.4, weight: 1.5, color: '#4ade80' });
        const cnt = DATA.filter(r => bcNormalizeMU(r.MU) === id).length;
        const tipText = cnt > 0
          ? `<b style="color:#4ade80">WMU ${id}</b><br><span style="font-size:11px;color:#aaa">${cnt} draw${cnt !== 1 ? 's' : ''} available</span>`
          : `<b>WMU ${id}</b><br><span style="font-size:11px;color:#888">No draws</span>`;
        this.bindTooltip(tipText, { sticky: true, direction: 'top', offset: [0, -4], opacity: 1, className: 'ab-wmu-tip' }).openTooltip(e.latlng);
      });
      layer.on('mouseout', function() {
        this.setStyle(fpBcGetStyle(feature, fpBcSelWMU.has(id)));
        this.closeTooltip();
      });
      layer.on('click', function() {
        if (!hasDraws) return;
        fpBcSelWMU.has(id) ? fpBcSelWMU.delete(id) : fpBcSelWMU.add(id);
        fpBcRefreshAllStyles();
        fpBcRefreshChips();
        fpUpdateCta();
      });
    }
  }).addTo(fpBcLeafletInstance);
  fpBcLeafletInstance.fitBounds([[48.3, -139.0], [60.0, -114.0]]);
}

function fpBcGetStyle(feature, isSelected) {
  const id = feature.properties.wmu_id || '';
  const hasDraws = DATA.length === 0 || DATA.some(r => bcNormalizeMU(r.MU) === id);
  return {
    fillColor:   isSelected ? '#4ade80' : (typeof bcWmuFillColor === 'function' ? bcWmuFillColor(id) : '#6aab76'),
    fillOpacity: isSelected ? 0.75 : hasDraws ? 0.38 : 0.15,
    color:       isSelected ? '#ffffff' : '#1a1a1a',
    weight:      isSelected ? 2.5 : 0.7,
    opacity:     isSelected ? 1.0 : 0.75
  };
}

function fpBcRefreshAllStyles() {
  if (!fpBcGeoLayer) return;
  fpBcGeoLayer.eachLayer(layer => {
    const id = layer.feature.properties.wmu_id || '';
    layer.setStyle(fpBcGetStyle(layer.feature, fpBcSelWMU.has(id)));
  });
}

function fpBcRefreshChips() {
  const chips = document.getElementById('fpBcMapChips');
  if (!chips) return;
  if (fpBcSelWMU.size === 0) {
    chips.innerHTML = '<span style="font-size:11px;color:var(--text-muted)">Click WMUs to filter</span>';
    return;
  }
  chips.innerHTML = [...fpBcSelWMU].sort().map(id =>
    `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px 3px 10px;background:rgba(74,222,128,.15);border:1px solid rgba(74,222,128,.35);border-radius:12px;font-size:11px;font-weight:700;color:#4ade80">WMU&nbsp;${id}<span onclick="fpBcSelWMU.delete('${id}');fpBcRefreshAllStyles();fpBcRefreshChips();fpUpdateCta()" style="cursor:pointer;opacity:.65;font-size:14px;line-height:1;margin-left:1px">×</span></span>`
  ).join('');
  if (fpBcSelWMU.size > 1) {
    chips.innerHTML += `<span onclick="fpBcSelWMU.clear();fpBcRefreshAllStyles();fpBcRefreshChips();fpUpdateCta()" style="font-size:11px;color:var(--text-muted);text-decoration:underline;cursor:pointer;padding:3px 6px">Clear all</span>`;
  }
}

function fpBuildBapChips() {
  // BAP chip UI removed; kept so fpReset() doesn't error
}

function fpToggleBap(a) {
  if (fpSelBap.has(a)) fpSelBap.delete(a); else fpSelBap.add(a);
  fpUpdateCta();
}

function fpBuildClassChips() {
  const wrap = document.getElementById('fpClassChips');
  if (!wrap) return;
  wrap.innerHTML = ['Antlered','Antlerless','Any'].map(c =>
    `<div class="fp-chip${fpSelClass.has(c)?' active':''}" onclick="fpToggleClass('${c}')">${c}</div>`
  ).join('');
  const cl = document.getElementById('fpClearClass');
  if (cl) cl.classList.toggle('vis', fpSelClass.size > 0);
}
function fpToggleClass(c) {
  if (fpSelClass.has(c)) fpSelClass.delete(c); else fpSelClass.add(c);
  fpBuildClassChips(); fpUpdateCta();
}

function fpBuildChips() {
  const all = [...new Set(DATA.map(r=>r.Species))].sort();
  document.getElementById('fpSpeciesChips').innerHTML = all.map(s =>
    `<div class="fp-chip${fpSelSpecies.has(s)?' active':''}" onclick="fpToggleSpecies('${s}')">${s}</div>`
  ).join('');
  const cl = document.getElementById('fpClearSpecies');
  if (cl) cl.classList.toggle('vis', fpSelSpecies.size > 0);
}

function fpBuildMU() {
  const wrap = document.getElementById('fpMUGrid');
  if (!wrap) return;
  const relevant = fpSelSpecies.size===0 ? DATA : DATA.filter(r=>fpSelSpecies.has(r.Species));
  const nums = [...new Set(relevant.map(r=>r.MU_General))].sort((a,b)=>a-b);
  wrap.innerHTML = nums.map(n =>
    `<div class="fp-mu-btn${fpSelMUs.has(n)?' active':''}" onclick="fpToggleMU(${n})">
      <div class="fp-mu-num">${n}</div>
      <div class="fp-mu-name">${MU_NAMES[n]||''}</div>
    </div>`
  ).join('');
  const cl = document.getElementById('fpClearMU');
  if (cl) cl.classList.toggle('vis', fpSelMUs.size > 0);
}

function fpToggleSpecies(s) {
  if (fpSelSpecies.has(s)) fpSelSpecies.delete(s); else fpSelSpecies.add(s);
  const relevant = fpSelSpecies.size===0 ? DATA : DATA.filter(r=>fpSelSpecies.has(r.Species));
  const validMUs = new Set(relevant.map(r=>r.MU_General));
  fpSelMUs.forEach(m => { if (!validMUs.has(m)) fpSelMUs.delete(m); });
  fpBuildChips(); fpBuildMU(); fpUpdateCta();
}

function fpToggleMU(n) {
  if (fpSelMUs.has(n)) fpSelMUs.delete(n); else fpSelMUs.add(n);
  fpBuildMU(); fpUpdateCta();
}

function fpClearFilter(type) {
  if (type==='species') { fpSelSpecies.clear(); fpBuildChips(); fpBuildMU(); }
  if (type==='class') { fpSelClass.clear(); fpBuildClassChips(); }
  if (type==='mu') { fpSelMUs.clear(); fpBuildMU(); }
  if (type==='bap') { fpSelBap.clear(); }
  if (type==='map') { fpBcSelWMU.clear(); fpBcRefreshAllStyles(); fpBcRefreshChips(); }
  fpUpdateCta();
}

function fpOnSlider(v) {
  fpMinOdds = ODDS_STEPS[parseInt(v)];
  const n=document.getElementById('fpOddsNum'), u=document.getElementById('fpOddsUnit'), h=document.getElementById('fpOddsHint');
  if (fpMinOdds===0) { n.textContent='Any'; u.textContent=''; h.textContent='Showing all draws'; }
  else { n.textContent=fpMinOdds; u.textContent='%+'; h.textContent='Min '+fpMinOdds+'% odds'; }
  fpUpdateCta();
}


function fpOnHarvestSlider(v) {
  fpMinHarvest = FP_HARVEST_STEPS[parseInt(v)];
  const n=document.getElementById('fpHarvestNum'), u=document.getElementById('fpHarvestUnit'), h=document.getElementById('fpHarvestHint');
  if (!n) return;
  if (fpMinHarvest===0) { n.textContent='Any'; u.textContent=''; h.textContent='Showing all draws'; }
  else { n.textContent=fpMinHarvest; u.textContent='%+'; h.textContent='Min '+fpMinHarvest+'% success'; }
  fpUpdateCta();
}

function fpReset() {
  fpSelSpecies.clear(); fpSelClass.clear(); fpSelMUs.clear(); fpSelBap.clear(); fpBcSelWMU.clear(); fpMinOdds=0; fpMinHarvest=0;
  const sl = document.getElementById('fpOddsSlider');
  if (sl) { sl.value=0; fpOnSlider(0); }
  const hs = document.getElementById('fpHarvestSlider');
  if (hs) { hs.value=0; fpOnHarvestSlider(0); }
}

function fpUpdateCta() {
  const count = DATA.filter(r => {
    if (fpSelSpecies.size>0 && !fpSelSpecies.has(r.Species)) return false;
    if (fpSelMUs.size>0 && !fpSelMUs.has(r.MU_General)) return false;
    if (fpBcSelWMU.size>0 && !fpBcSelWMU.has(bcNormalizeMU(r.MU))) return false;
    if (fpSelBap.size>0 && !fpSelBap.has(r.Area)) return false;
    if ((r['%']||0) < fpMinOdds) return false;
    if (fpMinHarvest > 0) {
      const hr = computeHarvestAvg(r.yearly_fill_rates);
      if (hr === null || hr < fpMinHarvest) return false;
    }
    if (fpSelClass.size > 0) {
      const cls = (r.Class || '').toLowerCase();
      const match = [...fpSelClass].some(c => {
        if (c === 'Antlered') return (cls.includes('antlered') || cls.includes('bull')) && !cls.includes('antlerless');
        if (c === 'Antlerless') return cls.includes('antlerless') || cls.includes('cow');
        if (c === 'Any') return !cls.includes('antlered') && !cls.includes('antlerless') && !cls.includes('bull') && !cls.includes('cow');
        return false;
      });
      if (!match) return false;
    }
    return true;
  }).length;
  const num = document.getElementById('fpMatchNum');
  if (num) num.textContent = count.toLocaleString();
  const lbl = document.getElementById('fpCtaLabel');
  if (lbl) lbl.textContent = 'Show Results';
}

function applyFiltersAndGoToDraws() {
  // ── AUTH GATE ─────────────────────────────────────────────────
  if (!window._authUser) {
    window._pendingShowResults = 'bc';
    window.openAuthModal && window.openAuthModal();
    return;
  }
  selSpecies = new Set(fpSelSpecies);
  selClass = new Set(fpSelClass);
  selMUs = new Set(fpSelMUs);
  selMinOdds = fpMinOdds;
  selMinHarvest = fpMinHarvest;
  // Apply BAP filter to the draws page (store in global selAreas)
  if (typeof selAreas !== 'undefined') selAreas = new Set(fpSelBap);
  // Apply WMU full IDs from filter page map
  if (typeof selMUsFull !== 'undefined') {
    selMUsFull.clear();
    fpBcSelWMU.forEach(id => selMUsFull.add(id));
  }
  // Sync the draws-page slider before showPage so applyFilters picks it up
  const idx = ODDS_STEPS.indexOf(fpMinOdds);
  const sl = document.getElementById('oddsSlider');
  if (sl && idx >= 0) sl.value = idx;
  // showPage('draws') already calls buildMUList, buildSpeciesChips, buildClassChips, applyFilters
  showPage('draws');
}




// [saved vars moved to top]

function saveToStorage() {
  try { localStorage.setItem('huntodds_saved', JSON.stringify(savedDraws)); } catch(e) {}
  updateSavedBadge();
}

function updateSavedBadge() {
  const badge = document.getElementById('savedBadge');
  const badgeMobile = document.getElementById('savedBadgeMobile');
  const total = savedDraws.length + abSavedDraws.length;
  [badge, badgeMobile].forEach(b => {
    if (!b) return;
    if (total > 0) { b.textContent = total; b.style.display = 'inline-flex'; }
    else { b.style.display = 'none'; }
  });
}

function abSaveToStorage() {
  try { localStorage.setItem('huntodds_ab_saved', JSON.stringify(abSavedDraws)); } catch(e) {}
  updateSavedBadge();
}

function abIsStarred(c) {
  const key = 'AB|' + c.species + '|' + c.wmu + '|' + c.draw;
  return abSavedDraws.some(s => s._key === key);
}

function abToggleStar(i) {
  const c = abLastFilteredCards[i];
  if (!c) return;
  const key = 'AB|' + c.species + '|' + c.wmu + '|' + c.draw;
  const idx = abSavedDraws.findIndex(s => s._key === key);
  if (idx >= 0) {
    abSavedDraws.splice(idx, 1);
  } else {
    abSavedDraws.push({...c, _key: key, _province: 'AB'});
  }
  abSaveToStorage();
  const btn = document.querySelector('button.star-btn[data-abidx="' + i + '"]');
  if (btn) {
    const starred = abIsStarred(c);
    btn.classList.toggle('starred', starred);
    btn.style.opacity = starred ? '1' : '';
  }
}

function abRemoveSaved(key) {
  abSavedDraws = abSavedDraws.filter(s => s._key !== key);
  abSaveToStorage();
  renderComparePage();
}

function isStarred(r) {
  const key = r.Species + '|' + r.MU + '|' + r.Code;
  return savedDraws.some(s => s._key === key);
}

function toggleStar(i) {
  const r = filtered[i];
  if (!r) return;
  const key = r.Species + '|' + r.MU + '|' + r.Code;
  const idx = savedDraws.findIndex(s => s._key === key);
  if (idx >= 0) {
    savedDraws.splice(idx, 1);
  } else {
    savedDraws.push({...r, _key: key});
  }
  saveToStorage();
  // Update just this card's star without full re-render
  const btn = document.querySelector(`button.star-btn[onclick*="toggleStar(${i})"]`);
  if (btn) btn.classList.toggle('starred', isStarred(r));
}

function removeSaved(key) {
  savedDraws = savedDraws.filter(s => s._key !== key);
  saveToStorage();
  renderSavedPage();
}

function clearAllSaved() {
  if (!confirm('Remove all saved draws?')) return;
  savedDraws = [];
  abSavedDraws = [];
  compareSelected.clear();
  saveToStorage();
  abSaveToStorage();
  renderSavedPage();
  updateSavedBadge();
}

function toggleCompare() {
  compareMode = !compareMode;
  compareSelected.clear();
  document.getElementById('comparePanel').style.display = 'none';
  renderSavedPage();
}

function closeCompare() {
  compareMode = false;
  compareSelected.clear();
  document.getElementById('comparePanel').style.display = 'none';
  renderSavedPage();
}

function toggleCompareSelect(key) {
  if (compareSelected.has(key)) {
    compareSelected.delete(key);
  } else {
    if (compareSelected.size >= 4) {
      alert('Compare up to 4 draws at a time.');
      return;
    }
    compareSelected.add(key);
  }
  renderSavedPage();
}

function launchCompare() {
  if (compareSelected.size >= 2) buildComparePanel();
}

