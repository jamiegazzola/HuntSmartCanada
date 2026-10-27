/* HuntSmart Unified Interactive Map controller v1.1
   Legacy filename retained by the existing build pipeline.
   Consumer behavior: one Interactive Map tab, BC LEH default, BC GOS alternate,
   Alberta preserved, strict geographic scope, and guided walkthroughs. */
(function () {
  'use strict';

  if (window.__HUNTSMART_INTERACTIVE_MAP_V11__) return;
  window.__HUNTSMART_INTERACTIVE_MAP_V11__ = true;
  window.__HUNTSMART_INTERACTIVE_MAP_SCRIPT_LOADED__ = true;

  const state = {
    mode: 'leh',
    province: 'BC',
    switching: false,
    guide: null,
    guideSnapshot: null,
    guideTarget: null
  };

  const rawShowPage = typeof window.showPage === 'function' ? window.showPage : null;
  const rawFullMapSetProvince = typeof window.fullMapSetProvince === 'function' ? window.fullMapSetProvince : null;

  function safe(fn, fallback) {
    try { return fn(); } catch (_) { return fallback; }
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function visible(el) {
    return !!(el && el.getClientRects().length && getComputedStyle(el).display !== 'none');
  }

  function surface() {
    if (visible(document.getElementById('bcOpenSeasonsPage'))) return 'gos';
    if (visible(document.getElementById('mapPage'))) return 'leh';
    return '';
  }

  function gosRegions() {
    try {
      if (typeof osSelectedRegionKeys === 'function') return osSelectedRegionKeys().map(String);
    } catch (_) {}
    try {
      if (typeof osSelectedRegions !== 'undefined' && osSelectedRegions instanceof Set) return [...osSelectedRegions].map(String);
    } catch (_) {}
    try {
      if (typeof osSelectedRegion !== 'undefined' && osSelectedRegion != null && String(osSelectedRegion)) return [String(osSelectedRegion)];
    } catch (_) {}
    return [];
  }

  function gosWMU() {
    try { return String(osSelectedWMU || ''); } catch (_) { return ''; }
  }

  function gosSpecies() {
    try { return String(osSelSpecies || ''); } catch (_) { return ''; }
  }

  function lehWMUs() {
    try { return [...fullMapSelRegions].map(String); } catch (_) { return []; }
  }

  function lehSpecies() {
    try { return String(fullMapSelectedSpecies || ''); } catch (_) { return ''; }
  }

  function regionForWMU(wmu) {
    const id = String(wmu || '');
    if (!id) return '';
    try {
      if (typeof osWMURegion === 'function') {
        const region = osWMURegion(id);
        if (region) return String(region);
      }
    } catch (_) {}
    return id.split('-')[0] || '';
  }

  function camera(map) {
    if (!map || typeof map.getCenter !== 'function') return null;
    try {
      const c = map.getCenter();
      return {
        center: [c.lng, c.lat],
        zoom: map.getZoom(),
        pitch: typeof map.getPitch === 'function' ? map.getPitch() : 0,
        bearing: typeof map.getBearing === 'function' ? map.getBearing() : 0
      };
    } catch (_) { return null; }
  }

  function snapshot() {
    if (surface() === 'gos') {
      return {
        mode: 'gos', province: 'BC', regions: gosRegions(), wmu: gosWMU(), species: gosSpecies(),
        month: safe(() => String(osSelMonth || ''), ''),
        method: safe(() => String(osSelMethod || ''), ''),
        camera: safe(() => camera(osMapInstance), null)
      };
    }
    if (surface() === 'leh') {
      return {
        mode: 'leh', province: safe(() => String(fullMapProvince || state.province), state.province),
        wmus: lehWMUs(), species: lehSpecies(),
        style: safe(() => String(_fullMapStyle || 'satellite'), 'satellite'),
        terrain3D: safe(() => !!_fullMapTerrain3D, false),
        camera: safe(() => camera(fullMapInstance), null)
      };
    }
    return { mode: state.mode, province: state.province };
  }

  function waitFor(test, callback, attempts) {
    let left = attempts || 50;
    const run = function () {
      let ready = false;
      try { ready = !!test(); } catch (_) {}
      if (ready) return callback();
      left -= 1;
      if (left > 0) setTimeout(run, 100);
    };
    run();
  }

  function removeExperimentalUI() {
    [
      'hsImageryLabBtn','hsImageryPanel',
      'hsTerrainLaunch','hsTerrainPanel',
      'hsWorldSettingsBtn','hsWorldSettingsPanel'
    ].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  }

  function contextualGOSRows(ignoreSpecies) {
    try {
      if (typeof osSelectedRegionsRows === 'function') return osSelectedRegionsRows({ ignoreSpecies: !!ignoreSpecies });
    } catch (_) {}
    try {
      if (typeof BC_OS_DATA !== 'undefined') {
        return BC_OS_DATA.filter(row => typeof osRowPassesGlobalFilters === 'function' ? osRowPassesGlobalFilters(row, !!ignoreSpecies) : true);
      }
    } catch (_) {}
    return [];
  }

  function refreshGOSSpeciesOptions() {
    const select = document.getElementById('osSpeciesSel');
    if (!select) return;
    const selected = gosSpecies();
    const rows = contextualGOSRows(true);
    let species = [...new Set(rows.map(r => r.species).filter(Boolean))].sort((a,b) => a.localeCompare(b));
    if (selected && !species.includes(selected)) species.unshift(selected);
    select.innerHTML = '<option value="">All species</option>' + species.map(sp => '<option value="' + esc(sp) + '">' + esc(sp) + '</option>').join('');
    select.value = selected;
  }

  function refreshGOS(options) {
    const opts = options || {};
    try { if (typeof osSyncFilterControls === 'function') osSyncFilterControls(); } catch (_) {}
    try { if (typeof osRefreshMapStates === 'function') osRefreshMapStates(); } catch (_) {}
    try { if (typeof osRenderPanel === 'function') osRenderPanel(); } catch (_) {}
    refreshGOSSpeciesOptions();
    syncUI();
    if (opts.fitRegion) {
      try { if (typeof osFitRegions === 'function') osFitRegions([opts.fitRegion]); } catch (_) {}
    }
  }

  // Geography is an explicit scope. Choosing species/month/method never broadens it.
  function setGOSRegion(regionKey) {
    const key = String(regionKey || '');
    if (!key) return;
    try {
      if (typeof osSelectedRegions !== 'undefined' && osSelectedRegions instanceof Set) {
        osSelectedRegions.clear();
        osSelectedRegions.add(key);
        if (typeof osSyncSelectedRegionVar === 'function') osSyncSelectedRegionVar();
      } else if (typeof osSelectedRegion !== 'undefined') {
        osSelectedRegion = key;
      }
      if (typeof osSelectedWMU !== 'undefined') osSelectedWMU = null;
      if (typeof osSelectedOpportunity !== 'undefined') osSelectedOpportunity = '';
      if (typeof osUserClosedPanel !== 'undefined') osUserClosedPanel = false;
      refreshGOS({ fitRegion:key });
    } catch (error) {
      console.warn('[Interactive Map] Could not set GOS region', error);
    }
  }

  function setGOSSpecies(species) {
    try {
      const keepWMU = typeof osSelectedWMU !== 'undefined' ? osSelectedWMU : null;
      osSelSpecies = String(species || '');
      if (typeof osSelectedOpportunity !== 'undefined') osSelectedOpportunity = '';
      if (typeof osSelectedWMU !== 'undefined') osSelectedWMU = keepWMU;
      if (typeof osUserClosedPanel !== 'undefined') osUserClosedPanel = false;
      refreshGOS();
    } catch (error) {
      console.warn('[Interactive Map] Could not set GOS species', error);
    }
  }

  function setGOSMonth(month) {
    try {
      const keepWMU = typeof osSelectedWMU !== 'undefined' ? osSelectedWMU : null;
      osSelMonth = String(month || '');
      if (typeof osSelectedOpportunity !== 'undefined') osSelectedOpportunity = '';
      if (typeof osSelectedWMU !== 'undefined') osSelectedWMU = keepWMU;
      if (typeof osUserClosedPanel !== 'undefined') osUserClosedPanel = false;
      refreshGOS();
    } catch (_) {}
  }

  function setGOSMethod(method) {
    try {
      const keepWMU = typeof osSelectedWMU !== 'undefined' ? osSelectedWMU : null;
      osSelMethod = String(method || '');
      if (typeof osSelectedOpportunity !== 'undefined') osSelectedOpportunity = '';
      if (typeof osSelectedWMU !== 'undefined') osSelectedWMU = keepWMU;
      if (typeof osUserClosedPanel !== 'undefined') osUserClosedPanel = false;
      refreshGOS();
    } catch (_) {}
  }

  function patchGOSScope() {
    try { osToggleRegionSelection = setGOSRegion; } catch (_) {}
    try { osSelectRegion = setGOSRegion; } catch (_) {}
    try { osSelectSpecies = setGOSSpecies; } catch (_) {}
    try { osOnSpecies = setGOSSpecies; } catch (_) {}
    try { osOnMonth = setGOSMonth; } catch (_) {}
    try { osOnMethod = setGOSMethod; } catch (_) {}
    window.osToggleRegionSelection = setGOSRegion;
    window.osSelectRegion = setGOSRegion;
    window.osSelectSpecies = setGOSSpecies;
    window.osOnSpecies = setGOSSpecies;
    window.osOnMonth = setGOSMonth;
    window.osOnMethod = setGOSMethod;
  }

  function speciesForLEH(species) {
    const requested = normalize(species);
    if (!requested) return '';
    const all = safe(() => _fullMapAllSpecies(), []);
    let hit = all.find(s => normalize(s) === requested);
    if (hit) return hit;
    if (/bighorn sheep|thinhorn sheep|stone sheep|dall sheep|mountain sheep/.test(requested)) {
      hit = all.find(s => /sheep/.test(normalize(s)));
      if (hit) return hit;
    }
    if (/black tailed|blacktail|mule deer/.test(requested)) {
      hit = all.find(s => /mule deer/.test(normalize(s)));
      if (hit) return hit;
    }
    return '';
  }

  function speciesForGOS(species) {
    const requested = normalize(species);
    if (!requested) return '';
    const all = [...new Set(contextualGOSRows(true).map(r => r.species).filter(Boolean))];
    let hit = all.find(s => normalize(s) === requested);
    if (hit) return hit;
    if (/sheep/.test(requested)) {
      const regionKeys = gosRegions();
      const wanted = regionKeys.some(k => ['3','4','5'].includes(String(k))) ? /bighorn/ : /thinhorn|stone/;
      hit = all.find(s => wanted.test(normalize(s))) || all.find(s => /sheep/.test(normalize(s)));
      if (hit) return hit;
    }
    if (/mule deer/.test(requested)) {
      hit = all.find(s => /mule deer|black tailed/.test(normalize(s)));
      if (hit) return hit;
    }
    return '';
  }

  function fitLEHRegion(regionKey) {
    try {
      if (!fullMapInstance || typeof turf === 'undefined') return;
      const geo = (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON) || (typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON);
      const features = (geo && geo.features || []).filter(f => regionForWMU(f.properties && f.properties.wmu_id) === String(regionKey));
      if (!features.length) return;
      const box = turf.bbox({ type:'FeatureCollection', features });
      fullMapInstance.fitBounds([[box[0],box[1]],[box[2],box[3]]], { padding:70, maxZoom:8.8, duration:650 });
    } catch (_) {}
  }

  function setLEHRegion(regionKey) {
    try {
      const key = String(regionKey || '');
      if (!key) return;
      const ids = _fullMapAllWMUs().filter(id => regionForWMU(id) === key);
      fullMapSelRegions.clear();
      ids.forEach(id => fullMapSelRegions.add(id));
      fullMapSelectedWMU = '';
      fullMapRefreshStyles();
      fullMapUpdateChips();
      if (ids.length) fullMapShowResults(); else fullMapHideResults();
      fullMapUpdateLEHSpeciesDropdown();
      fullMapMobileRefresh();
      fitLEHRegion(key);
      syncUI();
    } catch (error) {
      console.warn('[Interactive Map] Could not set LEH region', error);
    }
  }

  function applyCamera(map, snap) {
    if (!map || !snap || !snap.center) return;
    try { map.jumpTo({ center:snap.center, zoom:snap.zoom, pitch:snap.pitch || 0, bearing:snap.bearing || 0 }); } catch (_) {}
  }

  function transferToGOS(from) {
    waitFor(() => typeof osMapInstance !== 'undefined' && !!osMapInstance, function () {
      patchGOSScope();
      const wmus = from.wmus || (from.wmu ? [from.wmu] : []);
      const regions = from.regions && from.regions.length ? from.regions : [...new Set(wmus.map(regionForWMU).filter(Boolean))];
      if (regions.length === 1) setGOSRegion(regions[0]);
      const targetWMU = from.wmu || (wmus.length === 1 ? wmus[0] : '');
      if (targetWMU) {
        try { if (typeof osSelectWMU === 'function') osSelectWMU(targetWMU); } catch (_) {}
      }
      const mapped = speciesForGOS(from.species || '');
      if (mapped) setGOSSpecies(mapped);
      if (from.month) setGOSMonth(from.month);
      if (from.method) setGOSMethod(from.method);
      setTimeout(() => applyCamera(osMapInstance, from.camera), 100);
      syncUI();
    });
  }

  function transferToLEH(from) {
    waitFor(() => typeof fullMapInstance !== 'undefined' && !!fullMapInstance, function () {
      const wmus = from.wmus || (from.wmu ? [from.wmu] : []);
      const regions = from.regions && from.regions.length ? from.regions : [...new Set(wmus.map(regionForWMU).filter(Boolean))];
      if (from.wmu) {
        try { fullMapSelectWMU(from.wmu, false); } catch (_) {}
      } else if (wmus.length === 1) {
        try { fullMapSelectWMU(wmus[0], false); } catch (_) {}
      } else if (regions.length === 1) {
        setLEHRegion(regions[0]);
      }
      const mapped = speciesForLEH(from.species || '');
      if (mapped) {
        try { fullMapSetSpecies(mapped); } catch (_) {}
      }
      if (from.style && ['satellite','topo','streets'].includes(from.style)) {
        try { if (_fullMapStyle !== from.style) fullMapSetTile(from.style); } catch (_) {}
      }
      setTimeout(() => applyCamera(fullMapInstance, from.camera), 150);
      syncUI();
    });
  }

  function shellMarkup() {
    return '<div class="hs-im-title"><span class="hs-im-kicker">HUNT RESEARCH</span><strong>Interactive Map</strong></div>' +
      '<div class="hs-im-controls">' +
        '<div class="hs-im-seg hs-im-province" aria-label="Province">' +
          '<button type="button" data-hs-im-province="BC">BC</button>' +
          '<button type="button" data-hs-im-province="AB">Alberta</button>' +
        '</div>' +
        '<div class="hs-im-seg hs-im-mode" aria-label="BC hunting system">' +
          '<button type="button" data-hs-im-mode="leh">Limited Entry</button>' +
          '<button type="button" data-hs-im-mode="gos">General Open Seasons</button>' +
        '</div>' +
        '<button type="button" class="hs-im-guide-btn" data-hs-im-guide>Guide</button>' +
      '</div>' +
      '<div class="hs-im-scope" data-hs-im-scope></div>';
  }

  function ensureShell(page, kind) {
    if (!page) return;
    let bar = page.querySelector('.hs-im-shellbar');
    if (bar) return;
    bar = document.createElement('div');
    bar.className = 'hs-im-shellbar';
    bar.dataset.surface = kind;
    bar.innerHTML = shellMarkup();
    page.insertBefore(bar, page.firstChild);
    bar.addEventListener('click', function (event) {
      const province = event.target.closest('[data-hs-im-province]');
      if (province) return switchProvince(province.dataset.hsImProvince);
      const mode = event.target.closest('[data-hs-im-mode]');
      if (mode) return switchMode(mode.dataset.hsImMode);
      if (event.target.closest('[data-hs-im-guide]')) openGuide();
    });
  }

  function ensureShells() {
    ensureShell(document.getElementById('mapPage'), 'leh');
    ensureShell(document.getElementById('bcOpenSeasonsPage'), 'gos');
  }

  function scopeText() {
    if (state.province === 'AB') return 'Alberta draw map';
    const bits = ['BC'];
    if (state.mode === 'gos') {
      const regions = gosRegions();
      const wmu = gosWMU();
      if (regions.length === 1) bits.push('Region ' + regions[0]);
      if (wmu) bits.push('WMU ' + wmu);
      if (gosSpecies()) bits.push(gosSpecies());
    } else {
      const wmus = lehWMUs();
      const regions = [...new Set(wmus.map(regionForWMU).filter(Boolean))];
      if (regions.length === 1 && wmus.length > 1) bits.push('Region ' + regions[0]);
      if (wmus.length === 1) bits.push('WMU ' + wmus[0]);
      if (lehSpecies()) bits.push(lehSpecies());
    }
    return bits.join('  ›  ');
  }

  function syncNav() {
    ['navHome','navBC','navAlberta','navMap','navSaved','navBCOS'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });
    if (surface()) {
      const map = document.getElementById('navMap');
      if (map) map.classList.add('active');
    }
  }

  function syncUI() {
    ensureShells();
    const label = scopeText();
    document.querySelectorAll('.hs-im-shellbar').forEach(bar => {
      bar.querySelectorAll('[data-hs-im-province]').forEach(btn => btn.classList.toggle('active', btn.dataset.hsImProvince === state.province));
      const modeGroup = bar.querySelector('.hs-im-mode');
      if (modeGroup) modeGroup.style.display = state.province === 'BC' ? '' : 'none';
      bar.querySelectorAll('[data-hs-im-mode]').forEach(btn => btn.classList.toggle('active', btn.dataset.hsImMode === state.mode));
      const scope = bar.querySelector('[data-hs-im-scope]');
      if (scope && scope.textContent !== label) scope.textContent = label;
    });
    syncNav();
  }

  function callRawPage(page) {
    if (rawShowPage) return rawShowPage.call(window, page);
  }

  function openInteractive(mode, options) {
    const opts = options || {};
    if (state.switching) return;
    state.switching = true;
    const from = opts.transfer || null;

    if (mode === 'gos') {
      state.mode = 'gos';
      state.province = 'BC';
      callRawPage('bcOpenSeasons');
      setTimeout(function () {
        patchGOSScope();
        removeExperimentalUI();
        syncUI();
        if (from) transferToGOS(from);
        state.switching = false;
      }, 100);
      return;
    }

    state.mode = 'leh';
    state.province = String(opts.province || state.province || 'BC').toUpperCase();
    callRawPage('map');
    setTimeout(function () {
      try {
        if (rawFullMapSetProvince && typeof fullMapProvince !== 'undefined' && fullMapProvince !== state.province) rawFullMapSetProvince(state.province);
        else if (typeof fullMapInit === 'function') fullMapInit();
      } catch (_) {}
      removeExperimentalUI();
      syncUI();
      if (from && state.province === 'BC') transferToLEH(from);
      state.switching = false;
    }, 100);
  }

  function switchMode(mode) {
    const next = mode === 'gos' ? 'gos' : 'leh';
    if (next === state.mode && ((next === 'gos' && surface() === 'gos') || (next === 'leh' && surface() === 'leh'))) return;
    const from = snapshot();
    openInteractive(next, { province: next === 'gos' ? 'BC' : state.province, transfer:from });
  }

  function switchProvince(province) {
    const next = String(province || 'BC').toUpperCase();
    const from = snapshot();
    if (next === 'AB') {
      state.province = 'AB';
      state.mode = 'leh';
      openInteractive('leh', { province:'AB' });
    } else {
      state.province = 'BC';
      openInteractive(state.mode === 'gos' ? 'gos' : 'leh', { province:'BC', transfer:from });
    }
  }

  function patchNavigation() {
    const navMap = document.getElementById('navMap');
    if (navMap) {
      navMap.textContent = 'Interactive Map';
      navMap.onclick = function () { openInteractive('leh', { province:'BC' }); };
    }
    const mobileMap = document.getElementById('mNavMap');
    if (mobileMap) {
      mobileMap.textContent = 'Interactive Map';
      mobileMap.onclick = function () {
        openInteractive('leh', { province:'BC' });
        try { closeNavMenu(); } catch (_) {}
      };
    }
    ['navBCOS','mNavBCOS'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    document.querySelectorAll('.home-footer-link').forEach(el => {
      if (/^map$/i.test((el.textContent || '').trim())) {
        el.textContent = 'Interactive Map';
        el.onclick = function () { openInteractive('leh', { province:'BC' }); };
      }
    });
    document.querySelectorAll('.hiw-btn').forEach(el => {
      if (/open map/i.test(el.textContent || '')) {
        el.textContent = 'Open Interactive Map';
        el.onclick = function () { openInteractive('leh', { province:'BC' }); };
      }
    });
  }

  function patchGlobalNavigation() {
    if (!rawShowPage) return;
    window.showPage = function (page) {
      if (page === 'map') return openInteractive('leh', { province:'BC' });
      if (page === 'bcOpenSeasons') return openInteractive('gos', { province:'BC' });
      const result = rawShowPage.apply(window, arguments);
      setTimeout(syncNav, 0);
      return result;
    };
  }

  function patchProvinceSetter() {
    if (!rawFullMapSetProvince) return;
    const wrapped = function (province) {
      const result = rawFullMapSetProvince.apply(window, arguments);
      state.province = String(province || 'BC').toUpperCase();
      state.mode = 'leh';
      setTimeout(syncUI, 0);
      return result;
    };
    try { fullMapSetProvince = wrapped; } catch (_) {}
    window.fullMapSetProvince = wrapped;
  }

  function ensureGuide() {
    let guide = document.getElementById('hsInteractiveGuide');
    if (guide) return guide;
    guide = document.createElement('aside');
    guide.id = 'hsInteractiveGuide';
    guide.className = 'hs-im-guide';
    guide.setAttribute('aria-live', 'polite');
    guide.innerHTML = '<div class="hs-im-guide-head"><div><span>GUIDED WALKTHROUGH</span><strong id="hsImGuideTitle">Learn HuntSmart</strong></div><button type="button" id="hsImGuideClose" aria-label="Close guide">×</button></div><div class="hs-im-guide-body" id="hsImGuideBody"></div>';
    document.body.appendChild(guide);
    guide.querySelector('#hsImGuideClose').addEventListener('click', exitGuide);
    return guide;
  }

  const TOURS = {
    leh: [
      {title:'Limited Entry mode', text:'BC Interactive Map opens in Limited Entry by default. LEH connects geography to draw opportunities and historical results.', target:'[data-hs-im-mode="leh"]'},
      {title:'Choose a species', text:'Choose the species you want to research. Geography stays selected when species changes.', target:'#fullMapSpeciesSelect', event:'change'},
      {title:'Choose a WMU', text:'Click a WMU. HuntSmart scopes the draw results to that geography instead of broadening elsewhere.', target:'#fullMapLeaflet', event:'click'},
      {title:'Read matching draws', text:'The results panel uses the same WMU and species shown on the map.', target:'#fullMapResultsDrawer'},
      {title:'Change map style', text:'Satellite, Topo and Dark change only the basemap. Your hunt selections remain.', target:'.fullmap-basemap-buttons', event:'click'},
      {title:'Use 3D terrain', text:'3D changes terrain presentation only; it never resets your hunt research.', target:'#fullMapMap3DToggleBtn, #fullMap3DBtn', event:'click'},
      {title:'Ready to explore', text:'Switch to General Open Seasons at any time. HuntSmart preserves the most specific shared geography it can.', finish:true}
    ],
    gos: [
      {title:'General Open Seasons', text:'GOS uses the same BC geography but shows seasons that do not depend on the selected LEH opportunity.', target:'[data-hs-im-mode="gos"]'},
      {title:'Choose a region', text:'Click a region. That region becomes your scope until you explicitly leave it.', target:'#osMap', event:'click'},
      {title:'Choose a species', text:'Now choose a species. HuntSmart highlights matching WMUs only inside the selected region.', target:'#osSpeciesSel', event:'change'},
      {title:'Choose a matching WMU', text:'Click a highlighted WMU to narrow the geography again. Changing species will keep the WMU selected.', target:'#osMap', event:'click'},
      {title:'Read the season rules', text:'Review season dates, class, method, bag limit and notes for the current scope.', target:'#osResultsPanel'},
      {title:'Optional hunting layers', text:'Layers such as historical wildfire add context without changing legal season results.', target:'#osLayersBtn', event:'click'},
      {title:'Ready to explore', text:'HuntSmart speeds up research; current provincial regulations remain the legal source.', finish:true}
    ],
    map: [
      {title:'Search', text:'Search city, WMU or coordinates without clearing your research filters.', target:'.fullmap-floating-search, .os-search-wrap'},
      {title:'Map style', text:'Satellite emphasizes land cover, Topo emphasizes terrain and Dark gives a clean geographic view.', target:'.fullmap-basemap-buttons, .os-basemap-buttons', event:'click'},
      {title:'2D and 3D', text:'Use 3D to read relief without changing hunting data.', target:'#fullMapMap3DToggleBtn, #fullMap3DBtn, .os-2d3d-toggle', event:'click'},
      {title:'Switch systems', text:'LEH and GOS share geography. Switching preserves region, WMU and species wherever possible.', target:'.hs-im-mode', event:'click'},
      {title:'Done', text:'Reopen Guide any time.', finish:true}
    ]
  };

  function clearGuideTarget() {
    document.querySelectorAll('.hs-im-guide-target').forEach(el => el.classList.remove('hs-im-guide-target'));
    state.guideTarget = null;
  }

  function firstVisible(selectors) {
    if (!selectors) return null;
    for (const selector of selectors.split(',').map(s => s.trim())) {
      const el = [...document.querySelectorAll(selector)].find(visible);
      if (el) return el;
    }
    return null;
  }

  function openGuide() {
    const guide = ensureGuide();
    clearGuideTarget();
    state.guide = null;
    guide.classList.add('open');
    guide.querySelector('#hsImGuideTitle').textContent = 'Choose a walkthrough';
    guide.querySelector('#hsImGuideBody').innerHTML =
      '<p class="hs-im-guide-intro">Learn the real HuntSmart map by using the controls yourself.</p>' +
      '<button type="button" class="hs-im-guide-choice" data-tour="leh"><b>Research an LEH hunt</b><span>Species, WMUs, draw results and terrain.</span></button>' +
      '<button type="button" class="hs-im-guide-choice" data-tour="gos"><b>Research a General Open Season</b><span>Region scope, species, WMUs and regulations.</span></button>' +
      '<button type="button" class="hs-im-guide-choice" data-tour="map"><b>Learn the map</b><span>Search, map styles and 3D.</span></button>';
    guide.querySelectorAll('[data-tour]').forEach(button => button.addEventListener('click', () => startGuide(button.dataset.tour)));
  }

  function startGuide(type) {
    state.guideSnapshot = snapshot();
    state.guide = { type, step:0 };
    if (type === 'gos' && surface() !== 'gos') switchMode('gos');
    if (type === 'leh' && (surface() !== 'leh' || state.province !== 'BC')) openInteractive('leh', { province:'BC', transfer:snapshot() });
    setTimeout(renderGuide, 250);
  }

  function renderGuide() {
    if (!state.guide) return;
    const guide = ensureGuide();
    const steps = TOURS[state.guide.type] || [];
    const step = steps[state.guide.step];
    if (!step) return finishGuide();
    clearGuideTarget();
    guide.classList.add('open');
    guide.querySelector('#hsImGuideTitle').textContent = step.title;
    const body = guide.querySelector('#hsImGuideBody');
    const progress = Math.round(((state.guide.step + 1) / steps.length) * 100);
    body.innerHTML = '<div class="hs-im-guide-progress"><i style="width:' + progress + '%"></i></div>' +
      '<div class="hs-im-guide-count">Step ' + (state.guide.step + 1) + ' of ' + steps.length + '</div>' +
      '<p>' + esc(step.text) + '</p>' +
      '<div class="hs-im-guide-actions"><button type="button" data-guide-back ' + (state.guide.step === 0 ? 'disabled' : '') + '>Back</button>' +
      (step.finish ? '<button type="button" data-guide-finish>Explore freely</button>' : '<button type="button" data-guide-next ' + (step.event ? 'disabled' : '') + '>' + (step.event ? 'Complete highlighted action' : 'Next') + '</button>') + '</div>';
    const target = firstVisible(step.target);
    if (target) {
      target.classList.add('hs-im-guide-target');
      state.guideTarget = target;
    }
    const back = body.querySelector('[data-guide-back]');
    if (back) back.addEventListener('click', () => { if (state.guide && state.guide.step > 0) { state.guide.step -= 1; renderGuide(); } });
    const next = body.querySelector('[data-guide-next]');
    if (next && !step.event) next.addEventListener('click', advanceGuide);
    const finish = body.querySelector('[data-guide-finish]');
    if (finish) finish.addEventListener('click', finishGuide);
  }

  function advanceGuide() {
    if (!state.guide) return;
    state.guide.step += 1;
    renderGuide();
  }

  function finishGuide() {
    clearGuideTarget();
    state.guide = null;
    state.guideSnapshot = null;
    ensureGuide().classList.remove('open');
  }

  function exitGuide() {
    const restore = state.guideSnapshot;
    clearGuideTarget();
    state.guide = null;
    state.guideSnapshot = null;
    ensureGuide().classList.remove('open');
    if (!restore) return;
    if (restore.province === 'AB') openInteractive('leh', { province:'AB' });
    else if (restore.mode === 'gos') openInteractive('gos', { province:'BC', transfer:restore });
    else openInteractive('leh', { province:'BC', transfer:restore });
  }

  function guideAction(event) {
    if (!state.guide || !state.guideTarget) return;
    const step = (TOURS[state.guide.type] || [])[state.guide.step];
    if (!step || step.event !== event.type) return;
    if (event.target === state.guideTarget || state.guideTarget.contains(event.target)) setTimeout(advanceGuide, 220);
  }

  function exposeAPI() {
    window.__HUNTSMART_INTERACTIVE_MAP__ = {
      version: '1.1.0',
      open: openInteractive,
      switchMode,
      switchProvince,
      selectGOSRegion: setGOSRegion,
      setGOSSpecies,
      activeGOSWMUs: function () {
        try { return typeof osActiveWMUs === 'function' ? [...osActiveWMUs()].map(String) : []; } catch (_) { return []; }
      },
      getState: function () {
        const snap = snapshot();
        return {
          controller: { mode:state.mode, province:state.province },
          surface: surface(),
          regions: snap.regions || [],
          wmu: snap.wmu || '',
          wmus: snap.wmus || [],
          species: snap.species || '',
          scopeLabel: scopeText()
        };
      }
    };
  }

  function bootstrap() {
    patchNavigation();
    patchGlobalNavigation();
    patchProvinceSetter();
    patchGOSScope();
    ensureShells();
    removeExperimentalUI();
    exposeAPI();
    syncUI();
    document.addEventListener('click', guideAction, true);
    document.addEventListener('change', guideAction, true);
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && state.guide) exitGuide(); });
    setTimeout(removeExperimentalUI, 300);
    setTimeout(removeExperimentalUI, 900);
  }

  try {
    // This script is injected after the map markup and map controller scripts.
    // Bootstrap immediately so external fonts/analytics cannot delay map controls.
    bootstrap();
    window.__HUNTSMART_INTERACTIVE_MAP_BOOT_OK__ = true;
  } catch (error) {
    window.__HUNTSMART_INTERACTIVE_MAP_BOOT_ERROR__ = String(error && (error.stack || error.message) || error);
    console.error('[Interactive Map] bootstrap failed', error);
  }
})();
