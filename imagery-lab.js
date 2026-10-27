/* HuntSmart Unified Interactive Map controller.
   Legacy filename retained by build pipeline; this replaces the old Imagery Lab UI.
   Goals: one Interactive Map tab, BC LEH default, GOS alternate mode, Alberta unchanged,
   persistent geographic scope, and guided map walkthroughs. */
(function () {
  'use strict';

  if (window.__HUNTSMART_INTERACTIVE_MAP_V1__) return;
  window.__HUNTSMART_INTERACTIVE_MAP_V1__ = true;

  const state = {
    mode: 'leh',
    province: 'BC',
    switching: false,
    guide: null,
    guideSnapshot: null,
    guideBoundTarget: null
  };

  const rawShowPage = typeof window.showPage === 'function' ? window.showPage : null;
  const rawFullMapSetProvince = typeof window.fullMapSetProvince === 'function' ? window.fullMapSetProvince : null;

  function normalize(s) {
    return String(s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function safe(fn, fallback) {
    try { return fn(); } catch (e) { return fallback; }
  }

  function currentVisibleSurface() {
    const gos = document.getElementById('bcOpenSeasonsPage');
    if (gos && gos.style.display !== 'none') return 'gos';
    const map = document.getElementById('mapPage');
    if (map && map.style.display !== 'none') return 'leh';
    return '';
  }

  function getGOSRegionKeys() {
    try {
      if (typeof osSelectedRegionKeys === 'function') return osSelectedRegionKeys().map(String);
    } catch (e) {}
    try {
      if (typeof osSelectedRegions !== 'undefined' && osSelectedRegions instanceof Set) return [...osSelectedRegions].map(String);
    } catch (e) {}
    try {
      if (typeof osSelectedRegion !== 'undefined' && osSelectedRegion != null && String(osSelectedRegion)) return [String(osSelectedRegion)];
    } catch (e) {}
    return [];
  }

  function getGOSWMU() {
    try { return String(osSelectedWMU || ''); } catch (e) { return ''; }
  }

  function getGOSSpecies() {
    try { return String(osSelSpecies || ''); } catch (e) { return ''; }
  }

  function getLEHWMUs() {
    try { return [...fullMapSelRegions].map(String); } catch (e) { return []; }
  }

  function getLEHSpecies() {
    try { return String(fullMapSelectedSpecies || ''); } catch (e) { return ''; }
  }

  function regionKeyForWMU(wmu) {
    const id = String(wmu || '');
    if (!id) return '';
    try {
      if (typeof osWMURegion === 'function') {
        const k = osWMURegion(id);
        if (k) return String(k);
      }
    } catch (e) {}
    return id.split('-')[0] || '';
  }

  function captureCamera(map) {
    if (!map || typeof map.getCenter !== 'function') return null;
    try {
      const c = map.getCenter();
      return {
        center: [c.lng, c.lat],
        zoom: map.getZoom(),
        pitch: typeof map.getPitch === 'function' ? map.getPitch() : 0,
        bearing: typeof map.getBearing === 'function' ? map.getBearing() : 0
      };
    } catch (e) { return null; }
  }

  function captureCurrent() {
    const surface = currentVisibleSurface();
    if (surface === 'gos') {
      return {
        surface: 'gos', province: 'BC', mode: 'gos',
        regions: getGOSRegionKeys(),
        wmu: getGOSWMU(),
        species: getGOSSpecies(),
        month: safe(() => String(osSelMonth || ''), ''),
        method: safe(() => String(osSelMethod || ''), ''),
        camera: safe(() => captureCamera(osMapInstance), null)
      };
    }
    if (surface === 'leh') {
      return {
        surface: 'leh', province: safe(() => String(fullMapProvince || 'BC'), 'BC'), mode: 'leh',
        wmus: getLEHWMUs(),
        species: getLEHSpecies(),
        camera: safe(() => captureCamera(fullMapInstance), null),
        style: safe(() => String(_fullMapStyle || 'satellite'), 'satellite'),
        terrain3D: safe(() => !!_fullMapTerrain3D, false)
      };
    }
    return { surface: '', province: state.province, mode: state.mode };
  }

  function waitFor(test, cb, attempts) {
    let left = attempts || 30;
    const tick = function () {
      let ok = false;
      try { ok = !!test(); } catch (e) {}
      if (ok) { cb(); return; }
      left -= 1;
      if (left > 0) setTimeout(tick, 100);
    };
    tick();
  }

  function mapSpeciesToLEH(species) {
    const requested = normalize(species);
    if (!requested) return '';
    const available = safe(() => _fullMapAllSpecies(), []);
    const exact = available.find(s => normalize(s) === requested);
    if (exact) return exact;
    const aliases = [
      [/bighorn sheep|thinhorn sheep|stone sheep|dall sheep/, /mountain sheep|sheep/],
      [/mule deer black tailed|black tailed deer|blacktail/, /mule deer/],
      [/white tailed deer|whitetail deer/, /white tailed deer|whitetail/]
    ];
    for (const pair of aliases) {
      if (!pair[0].test(requested)) continue;
      const hit = available.find(s => pair[1].test(normalize(s)));
      if (hit) return hit;
    }
    return '';
  }

  function contextualGOSRows(ignoreSpecies) {
    try {
      if (typeof osSelectedRegionsRows === 'function') return osSelectedRegionsRows({ ignoreSpecies: !!ignoreSpecies });
    } catch (e) {}
    try {
      if (typeof BC_OS_DATA !== 'undefined') {
        return BC_OS_DATA.filter(r => typeof osRowPassesGlobalFilters === 'function' ? osRowPassesGlobalFilters(r, !!ignoreSpecies) : true);
      }
    } catch (e) {}
    return [];
  }

  function mapSpeciesToGOS(species) {
    const requested = normalize(species);
    if (!requested) return '';
    const rows = contextualGOSRows(true);
    const available = [...new Set(rows.map(r => r.species).filter(Boolean))];
    const exact = available.find(s => normalize(s) === requested);
    if (exact) return exact;
    if (/mountain sheep|sheep/.test(requested)) {
      const regions = getGOSRegionKeys();
      const preferred = regions.some(k => ['3','4','5'].includes(String(k))) ? /bighorn/ : /thinhorn|stone/;
      const hit = available.find(s => preferred.test(normalize(s))) || available.find(s => /sheep/.test(normalize(s)));
      if (hit) return hit;
    }
    if (/mule deer/.test(requested)) {
      const hit = available.find(s => /mule deer|black tailed/.test(normalize(s)));
      if (hit) return hit;
    }
    return '';
  }

  function refreshGOSSpeciesOptions() {
    const select = document.getElementById('osSpeciesSel');
    if (!select) return;
    const selected = getGOSSpecies();
    const rows = contextualGOSRows(true);
    let species = [...new Set(rows.map(r => r.species).filter(Boolean))].sort((a,b) => a.localeCompare(b));
    if (selected && !species.includes(selected)) species = [selected].concat(species);
    select.innerHTML = '<option value="">All species</option>' + species.map(sp => '<option value="' + String(sp).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;') + '">' + sp + '</option>').join('');
    select.value = selected;
  }

  function refreshGOS() {
    try { if (typeof osSyncFilterControls === 'function') osSyncFilterControls(); } catch (e) {}
    try { if (typeof osRefreshMapStates === 'function') osRefreshMapStates(); } catch (e) {}
    try { if (typeof osRenderPanel === 'function') osRenderPanel(); } catch (e) {}
    refreshGOSSpeciesOptions();
    syncShellbars();
  }

  function selectRegionExclusive(regionKey) {
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
      refreshGOS();
      if (typeof osFitRegions === 'function') osFitRegions([key]);
    } catch (e) { console.warn('[Interactive Map] Region selection failed', e); }
  }

  function selectSpeciesScoped(species) {
    try {
      const keepWMU = typeof osSelectedWMU !== 'undefined' ? osSelectedWMU : null;
      osSelSpecies = String(species || '');
      if (typeof osSelectedOpportunity !== 'undefined') osSelectedOpportunity = '';
      if (typeof osSelectedWMU !== 'undefined') osSelectedWMU = keepWMU;
      if (typeof osUserClosedPanel !== 'undefined') osUserClosedPanel = false;
      refreshGOS();
    } catch (e) { console.warn('[Interactive Map] Species filter failed', e); }
  }

  function setMonthScoped(value) {
    try {
      const keepWMU = typeof osSelectedWMU !== 'undefined' ? osSelectedWMU : null;
      osSelMonth = String(value || '');
      if (typeof osSelectedOpportunity !== 'undefined') osSelectedOpportunity = '';
      if (typeof osSelectedWMU !== 'undefined') osSelectedWMU = keepWMU;
      if (typeof osUserClosedPanel !== 'undefined') osUserClosedPanel = false;
      refreshGOS();
    } catch (e) {}
  }

  function setMethodScoped(value) {
    try {
      const keepWMU = typeof osSelectedWMU !== 'undefined' ? osSelectedWMU : null;
      osSelMethod = String(value || '');
      if (typeof osSelectedOpportunity !== 'undefined') osSelectedOpportunity = '';
      if (typeof osSelectedWMU !== 'undefined') osSelectedWMU = keepWMU;
      if (typeof osUserClosedPanel !== 'undefined') osUserClosedPanel = false;
      refreshGOS();
    } catch (e) {}
  }

  function patchGOSScope() {
    try { osToggleRegionSelection = selectRegionExclusive; } catch (e) {}
    try { osSelectRegion = selectRegionExclusive; } catch (e) {}
    try { osSelectSpecies = selectSpeciesScoped; } catch (e) {}
    try { osOnSpecies = selectSpeciesScoped; } catch (e) {}
    try { osOnMonth = setMonthScoped; } catch (e) {}
    try { osOnMethod = setMethodScoped; } catch (e) {}
    window.osToggleRegionSelection = selectRegionExclusive;
    window.osSelectRegion = selectRegionExclusive;
    window.osSelectSpecies = selectSpeciesScoped;
    window.osOnSpecies = selectSpeciesScoped;
    window.osOnMonth = setMonthScoped;
    window.osOnMethod = setMethodScoped;
  }

  function fitLEHRegion(regionKey) {
    try {
      if (!fullMapInstance || typeof turf === 'undefined') return;
      const geo = (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON) || (typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON);
      if (!geo || !geo.features) return;
      const feats = geo.features.filter(f => regionKeyForWMU(f.properties && f.properties.wmu_id) === String(regionKey));
      if (!feats.length) return;
      const box = turf.bbox({ type:'FeatureCollection', features:feats });
      fullMapInstance.fitBounds([[box[0],box[1]],[box[2],box[3]]], { padding:70, maxZoom:8.8, duration:700 });
    } catch (e) {}
  }

  function selectLEHRegion(regionKey) {
    try {
      const key = String(regionKey || '');
      if (!key) return;
      const ids = _fullMapAllWMUs().filter(id => regionKeyForWMU(id) === key);
      fullMapSelRegions.clear();
      ids.forEach(id => fullMapSelRegions.add(id));
      fullMapSelectedWMU = '';
      fullMapRefreshStyles();
      fullMapUpdateChips();
      if (ids.length) fullMapShowResults(); else fullMapHideResults();
      fullMapUpdateLEHSpeciesDropdown();
      fullMapMobileRefresh();
      fitLEHRegion(key);
    } catch (e) { console.warn('[Interactive Map] LEH region scope failed', e); }
  }

  function applyCamera(map, camera) {
    if (!map || !camera || !camera.center) return;
    try { map.jumpTo({ center:camera.center, zoom:camera.zoom, pitch:camera.pitch || 0, bearing:camera.bearing || 0 }); } catch (e) {}
  }

  function applyTransferToGOS(snapshot) {
    if (!snapshot) return;
    waitFor(() => typeof osMapInstance !== 'undefined' && osMapInstance, function () {
      patchGOSScope();
      const wmus = snapshot.wmus || (snapshot.wmu ? [snapshot.wmu] : []);
      const regionKeys = snapshot.regions && snapshot.regions.length ? snapshot.regions : [...new Set(wmus.map(regionKeyForWMU).filter(Boolean))];
      if (regionKeys.length === 1) selectRegionExclusive(regionKeys[0]);
      const targetWmu = snapshot.wmu || (wmus.length === 1 ? wmus[0] : '');
      if (targetWmu) {
        try { if (typeof osSelectWMU === 'function') osSelectWMU(targetWmu); } catch (e) {}
      }
      const mappedSpecies = mapSpeciesToGOS(snapshot.species || '');
      if (mappedSpecies) selectSpeciesScoped(mappedSpecies);
      if (snapshot.month) setMonthScoped(snapshot.month);
      if (snapshot.method) setMethodScoped(snapshot.method);
      setTimeout(() => applyCamera(osMapInstance, snapshot.camera), 120);
      syncShellbars();
    });
  }

  function applyTransferToLEH(snapshot) {
    if (!snapshot) return;
    waitFor(() => typeof fullMapInstance !== 'undefined' && fullMapInstance, function () {
      const wmus = snapshot.wmus || (snapshot.wmu ? [snapshot.wmu] : []);
      const regions = snapshot.regions && snapshot.regions.length ? snapshot.regions : [...new Set(wmus.map(regionKeyForWMU).filter(Boolean))];
      if (snapshot.wmu) {
        try { fullMapSelectWMU(snapshot.wmu, false); } catch (e) {}
      } else if (wmus.length === 1) {
        try { fullMapSelectWMU(wmus[0], false); } catch (e) {}
      } else if (regions.length === 1) {
        selectLEHRegion(regions[0]);
      }
      const mapped = mapSpeciesToLEH(snapshot.species || '');
      if (mapped) {
        try { fullMapSetSpecies(mapped); } catch (e) {}
      }
      if (snapshot.style && ['satellite','topo','streets'].includes(snapshot.style)) {
        try { if (_fullMapStyle !== snapshot.style) fullMapSetTile(snapshot.style); } catch (e) {}
      }
      setTimeout(() => applyCamera(fullMapInstance, snapshot.camera), 180);
      syncShellbars();
    });
  }

  function callRawShowPage(page) {
    if (rawShowPage) return rawShowPage.call(window, page);
  }

  function openInteractive(mode, opts) {
    opts = opts || {};
    const targetProvince = opts.province || (mode === 'gos' ? 'BC' : state.province || 'BC');
    if (state.switching) return;
    state.switching = true;
    const transfer = opts.transfer || null;

    if (mode === 'gos') {
      state.mode = 'gos';
      state.province = 'BC';
      callRawShowPage('bcOpenSeasons');
      setTimeout(function () {
        patchGOSScope();
        ensureShellbars();
        syncShellbars();
        if (transfer) applyTransferToGOS(transfer);
        state.switching = false;
      }, 80);
      return;
    }

    state.mode = 'leh';
    state.province = targetProvince;
    callRawShowPage('map');
    setTimeout(function () {
      try {
        if (typeof fullMapProvince !== 'undefined' && fullMapProvince !== targetProvince && rawFullMapSetProvince) rawFullMapSetProvince(targetProvince);
        else if (typeof fullMapInit === 'function') fullMapInit();
      } catch (e) {}
      ensureShellbars();
      syncShellbars();
      if (transfer && targetProvince === 'BC') applyTransferToLEH(transfer);
      state.switching = false;
    }, 80);
  }

  function switchMode(mode) {
    if (state.province === 'AB' && mode === 'gos') {
      state.province = 'BC';
    }
    const snapshot = captureCurrent();
    openInteractive(mode, { province: mode === 'gos' ? 'BC' : state.province, transfer: snapshot });
  }

  function switchProvince(province) {
    const prov = String(province || 'BC').toUpperCase();
    const snapshot = captureCurrent();
    if (prov === 'AB') {
      state.province = 'AB';
      openInteractive('leh', { province:'AB', transfer:null });
    } else {
      state.province = 'BC';
      if (state.mode === 'gos') openInteractive('gos', { province:'BC', transfer:snapshot });
      else openInteractive('leh', { province:'BC', transfer:snapshot });
    }
  }

  function scopeLabel() {
    if (state.province === 'AB') return 'Alberta draw map';
    if (state.mode === 'gos') {
      const regions = getGOSRegionKeys();
      const wmu = getGOSWMU();
      const species = getGOSSpecies();
      const bits = ['BC'];
      if (regions.length === 1) bits.push('Region ' + regions[0]);
      if (wmu) bits.push('WMU ' + wmu);
      if (species) bits.push(species);
      return bits.join('  ›  ');
    }
    const wmus = getLEHWMUs();
    const species = getLEHSpecies();
    const regions = [...new Set(wmus.map(regionKeyForWMU).filter(Boolean))];
    const bits = ['BC'];
    if (regions.length === 1 && wmus.length > 1) bits.push('Region ' + regions[0]);
    if (wmus.length === 1) bits.push('WMU ' + wmus[0]);
    if (species) bits.push(species);
    return bits.join('  ›  ');
  }

  function shellHTML() {
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

  function ensureShellbar(page, surface) {
    if (!page) return;
    let bar = page.querySelector(':scope > .hs-im-shellbar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'hs-im-shellbar';
      bar.dataset.surface = surface;
      bar.innerHTML = shellHTML();
      page.insertBefore(bar, page.firstChild);
      bar.addEventListener('click', function (e) {
        const p = e.target.closest('[data-hs-im-province]');
        if (p) { switchProvince(p.dataset.hsImProvince); return; }
        const m = e.target.closest('[data-hs-im-mode]');
        if (m) { switchMode(m.dataset.hsImMode); return; }
        if (e.target.closest('[data-hs-im-guide]')) openGuideChooser();
      });
    }
  }

  function ensureShellbars() {
    ensureShellbar(document.getElementById('mapPage'), 'leh');
    ensureShellbar(document.getElementById('bcOpenSeasonsPage'), 'gos');
  }

  function syncNav() {
    ['navHome','navBC','navAlberta','navMap','navSaved','navBCOS'].forEach(id => {
      const el = document.getElementById(id); if (el) el.classList.remove('active');
    });
    if (currentVisibleSurface()) {
      const map = document.getElementById('navMap');
      if (map) map.classList.add('active');
    }
  }

  function syncShellbars() {
    ensureShellbars();
    document.querySelectorAll('.hs-im-shellbar').forEach(bar => {
      bar.querySelectorAll('[data-hs-im-province]').forEach(btn => btn.classList.toggle('active', btn.dataset.hsImProvince === state.province));
      const mode = bar.querySelector('.hs-im-mode');
      if (mode) mode.style.display = state.province === 'BC' ? '' : 'none';
      bar.querySelectorAll('[data-hs-im-mode]').forEach(btn => btn.classList.toggle('active', btn.dataset.hsImMode === state.mode));
      const scope = bar.querySelector('[data-hs-im-scope]');
      if (scope) scope.textContent = scopeLabel();
    });
    syncNav();
  }

  function patchNavigation() {
    const navMap = document.getElementById('navMap');
    if (navMap) {
      navMap.textContent = 'Interactive Map';
      navMap.onclick = function () { openInteractive('leh', { province:'BC' }); };
    }
    const mNavMap = document.getElementById('mNavMap');
    if (mNavMap) {
      mNavMap.textContent = 'Interactive Map';
      mNavMap.onclick = function () { openInteractive('leh', { province:'BC' }); try { closeNavMenu(); } catch(e) {} };
    }
    ['navBCOS','mNavBCOS'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
    document.querySelectorAll('.home-footer-link').forEach(btn => {
      if (/^map$/i.test((btn.textContent || '').trim())) {
        btn.textContent = 'Interactive Map';
        btn.onclick = function () { openInteractive('leh', { province:'BC' }); };
      }
    });
    document.querySelectorAll('button.hiw-btn').forEach(btn => {
      if (/open map/i.test(btn.textContent || '')) {
        btn.textContent = 'Open Interactive Map';
        btn.onclick = function () { openInteractive('leh', { province:'BC' }); };
      }
    });
  }

  function patchShowPage() {
    if (!rawShowPage) return;
    window.showPage = function (page) {
      if (page === 'map') { openInteractive('leh', { province:'BC' }); return; }
      if (page === 'bcOpenSeasons') { openInteractive('gos', { province:'BC' }); return; }
      const result = rawShowPage.apply(window, arguments);
      setTimeout(syncNav, 0);
      return result;
    };
  }

  function patchProvinceSetter() {
    if (!rawFullMapSetProvince) return;
    const patched = function (prov) {
      const result = rawFullMapSetProvince.apply(window, arguments);
      state.province = String(prov || 'BC').toUpperCase();
      state.mode = 'leh';
      setTimeout(syncShellbars, 0);
      return result;
    };
    try { fullMapSetProvince = patched; } catch (e) {}
    window.fullMapSetProvince = patched;
  }

  function removeExperimentalUI() {
    ['hsImageryLabBtn','hsTerrainLaunch','hsWorldSettingsBtn','hsImageryPanel','hsTerrainPanel','hsWorldSettingsPanel'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  }

  function ensureGuide() {
    let root = document.getElementById('hsInteractiveGuide');
    if (root) return root;
    root = document.createElement('aside');
    root.id = 'hsInteractiveGuide';
    root.className = 'hs-im-guide';
    root.setAttribute('aria-live','polite');
    root.innerHTML = '<div class="hs-im-guide-head"><div><span>GUIDED WALKTHROUGH</span><strong id="hsImGuideTitle">Learn the map</strong></div><button type="button" id="hsImGuideClose" aria-label="Close guide">×</button></div><div id="hsImGuideBody" class="hs-im-guide-body"></div>';
    document.body.appendChild(root);
    root.querySelector('#hsImGuideClose').addEventListener('click', exitGuide);
    return root;
  }

  function openGuideChooser() {
    const root = ensureGuide();
    clearGuideTarget();
    state.guide = null;
    root.classList.add('open');
    root.querySelector('#hsImGuideTitle').textContent = 'Choose a walkthrough';
    root.querySelector('#hsImGuideBody').innerHTML =
      '<p class="hs-im-guide-intro">Learn the real HuntSmart map by using the controls yourself.</p>' +
      '<button type="button" class="hs-im-guide-choice" data-tour="leh"><b>Research an LEH hunt</b><span>Species, WMUs, draw results and terrain.</span></button>' +
      '<button type="button" class="hs-im-guide-choice" data-tour="gos"><b>Research a General Open Season</b><span>Region scope, species, WMUs and regulations.</span></button>' +
      '<button type="button" class="hs-im-guide-choice" data-tour="map"><b>Learn the map</b><span>Search, basemap and 3D controls.</span></button>';
    root.querySelectorAll('[data-tour]').forEach(btn => btn.addEventListener('click', () => startTour(btn.dataset.tour)));
  }

  const TOURS = {
    leh: [
      { title:'Limited Entry mode', text:'BC opens in Limited Entry by default. This mode connects WMUs to LEH draw opportunities and historical draw data.', target:'[data-hs-im-mode="leh"]' },
      { title:'Choose a species', text:'Select the species you want to research. Your geographic selection stays in place when you change species.', target:'#fullMapSpeciesSelect', action:'change' },
      { title:'Choose a WMU', text:'Click a WMU on the map. HuntSmart will scope the draw results to that geography instead of broadening your search elsewhere.', target:'#fullMapLeaflet', action:'click' },
      { title:'Read the matching draws', text:'The results panel is derived from the same selected geography and species shown on the map.', target:'#fullMapResultsDrawer' },
      { title:'Change the map style', text:'Use Satellite, Topo or Dark without losing your hunt selections.', target:'.fullmap-basemap-buttons', action:'click' },
      { title:'Inspect terrain in 3D', text:'3D changes the terrain view only. It never resets your hunt research.', target:'#fullMapMap3DToggleBtn', action:'click' },
      { title:'You are ready', text:'Switch to General Open Seasons at any time and HuntSmart will preserve the most specific geography it can.', finish:true }
    ],
    gos: [
      { title:'General Open Seasons', text:'GOS uses the same BC geography but answers a different question: what can you hunt without drawing this LEH opportunity?', target:'[data-hs-im-mode="gos"]' },
      { title:'Choose a region', text:'Click a BC region. Once selected, that region becomes your scope until you explicitly leave it.', target:'#osMap', action:'click' },
      { title:'Choose a species', text:'Now choose a species. HuntSmart only highlights matching WMUs inside your selected region.', target:'#osSpeciesSel', action:'change' },
      { title:'Choose a matching WMU', text:'Click a highlighted WMU to narrow the scope again. Changing species afterward will keep this WMU selected.', target:'#osMap', action:'click' },
      { title:'Read the season rules', text:'Season dates, class, method, bag limit and notes are shown for the current scope.', target:'#osResultsPanel' },
      { title:'Optional hunting layers', text:'Use Layers for contextual hunting intelligence such as historical wildfire. These layers do not change the legal season results.', target:'#osLayersBtn', action:'click' },
      { title:'You are ready', text:'The official provincial regulations remain the legal source. HuntSmart makes the research faster and easier to understand.', finish:true }
    ],
    map: [
      { title:'Search', text:'Search a city, WMU or coordinates without clearing your research filters.', target:'.fullmap-floating-search, .os-search-wrap' },
      { title:'Map style', text:'Satellite shows land cover, Topo emphasizes terrain, and Dark gives a clean geographic view.', target:'.fullmap-basemap-buttons, .os-basemap-buttons', action:'click' },
      { title:'2D and 3D', text:'Use 3D to read terrain relief. Switching views does not alter hunting data.', target:'#fullMapMap3DToggleBtn, .os-2d3d-toggle', action:'click' },
      { title:'Switch hunting systems', text:'LEH and GOS share geography. Switching systems preserves region, WMU and species wherever possible.', target:'.hs-im-mode', action:'click' },
      { title:'Done', text:'You can reopen Guide at any time.', finish:true }
    ]
  };

  function snapshotForGuide() {
    return captureCurrent();
  }

  function restoreGuideSnapshot(snapshot) {
    if (!snapshot || !snapshot.surface) return;
    if (snapshot.province === 'AB') openInteractive('leh', { province:'AB' });
    else if (snapshot.mode === 'gos') openInteractive('gos', { province:'BC', transfer:snapshot });
    else openInteractive('leh', { province:'BC', transfer:snapshot });
  }

  function startTour(type) {
    state.guideSnapshot = snapshotForGuide();
    state.guide = { type:type, step:0 };
    if (type === 'gos' && currentVisibleSurface() !== 'gos') switchMode('gos');
    if (type === 'leh' && (currentVisibleSurface() !== 'leh' || state.province !== 'BC')) openInteractive('leh', { province:'BC', transfer:captureCurrent() });
    setTimeout(renderGuideStep, 250);
  }

  function clearGuideTarget() {
    document.querySelectorAll('.hs-im-guide-target').forEach(el => el.classList.remove('hs-im-guide-target'));
    state.guideBoundTarget = null;
  }

  function targetForStep(step) {
    if (!step || !step.target) return null;
    const selectors = step.target.split(',').map(s => s.trim());
    for (const sel of selectors) {
      const visible = [...document.querySelectorAll(sel)].find(el => el.getClientRects().length && getComputedStyle(el).display !== 'none');
      if (visible) return visible;
    }
    return null;
  }

  function renderGuideStep() {
    const root = ensureGuide();
    const guide = state.guide;
    if (!guide) return;
    const steps = TOURS[guide.type] || [];
    const step = steps[guide.step];
    if (!step) { finishGuide(); return; }
    clearGuideTarget();
    root.classList.add('open');
    root.querySelector('#hsImGuideTitle').textContent = step.title;
    const body = root.querySelector('#hsImGuideBody');
    const progress = Math.round(((guide.step + 1) / steps.length) * 100);
    body.innerHTML = '<div class="hs-im-guide-progress"><i style="width:' + progress + '%"></i></div>' +
      '<div class="hs-im-guide-count">Step ' + (guide.step + 1) + ' of ' + steps.length + '</div>' +
      '<p>' + step.text + '</p>' +
      '<div class="hs-im-guide-actions"><button type="button" data-guide-back ' + (guide.step === 0 ? 'disabled' : '') + '>Back</button>' +
      (step.finish ? '<button type="button" data-guide-finish>Explore freely</button>' : '<button type="button" data-guide-next ' + (step.action ? 'disabled' : '') + '>' + (step.action ? 'Complete the highlighted action' : 'Next') + '</button>') + '</div>';
    const target = targetForStep(step);
    if (target) {
      target.classList.add('hs-im-guide-target');
      state.guideBoundTarget = target;
      try { target.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'nearest' }); } catch (e) {}
    }
    const back = body.querySelector('[data-guide-back]');
    if (back) back.addEventListener('click', () => { if (guide.step > 0) { guide.step -= 1; renderGuideStep(); } });
    const next = body.querySelector('[data-guide-next]');
    if (next && !step.action) next.addEventListener('click', advanceGuide);
    const finish = body.querySelector('[data-guide-finish]');
    if (finish) finish.addEventListener('click', finishGuide);
  }

  function advanceGuide() {
    if (!state.guide) return;
    state.guide.step += 1;
    renderGuideStep();
  }

  function finishGuide() {
    clearGuideTarget();
    state.guide = null;
    state.guideSnapshot = null;
    const root = ensureGuide();
    root.classList.remove('open');
  }

  function exitGuide() {
    const snapshot = state.guideSnapshot;
    clearGuideTarget();
    state.guide = null;
    state.guideSnapshot = null;
    const root = ensureGuide();
    root.classList.remove('open');
    if (snapshot) restoreGuideSnapshot(snapshot);
  }

  function guideActionListener(e) {
    const guide = state.guide;
    if (!guide) return;
    const step = (TOURS[guide.type] || [])[guide.step];
    if (!step || !step.action || !state.guideBoundTarget) return;
    if (e.type !== step.action) return;
    if (state.guideBoundTarget === e.target || state.guideBoundTarget.contains(e.target)) {
      setTimeout(advanceGuide, 260);
    }
  }

  function observeUI() {
    const observer = new MutationObserver(function () {
      removeExperimentalUI();
      ensureShellbars();
      syncShellbars();
    });
    observer.observe(document.documentElement, { childList:true, subtree:true });
  }

  function exposeDebugAPI() {
    window.__HUNTSMART_INTERACTIVE_MAP__ = {
      version: '1.0.0',
      open: openInteractive,
      switchMode: switchMode,
      switchProvince: switchProvince,
      getState: function () {
        const snap = captureCurrent();
        return {
          controller: { mode:state.mode, province:state.province },
          surface: snap.surface,
          regions: snap.regions || [],
          wmu: snap.wmu || '',
          wmus: snap.wmus || [],
          species: snap.species || '',
          scopeLabel: scopeLabel()
        };
      },
      selectGOSRegion: selectRegionExclusive,
      setGOSSpecies: selectSpeciesScoped,
      activeGOSWMUs: function () { try { return typeof osActiveWMUs === 'function' ? [...osActiveWMUs()].map(String) : []; } catch(e) { return []; } }
    };
  }

  function bootstrap() {
    patchNavigation();
    patchShowPage();
    patchProvinceSetter();
    patchGOSScope();
    ensureShellbars();
    removeExperimentalUI();
    exposeDebugAPI();
    syncShellbars();
    observeUI();
    document.addEventListener('change', guideActionListener, true);
    document.addEventListener('click', guideActionListener, true);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state.guide) exitGuide(); });
    setTimeout(removeExperimentalUI, 500);
    setTimeout(removeExperimentalUI, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap, { once:true });
  else bootstrap();
})();
