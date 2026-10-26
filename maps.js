

// ── HuntSmart filter-map helpers (dark Leaflet tiles + expand control + species-aware styling) ──
function hsAddDarkLeafletTiles(map) {
  if (!map || typeof L === 'undefined') return null;
  try {
    const token = (typeof MAPBOX_TOKEN !== 'undefined') ? MAPBOX_TOKEN : '';
    if (token) {
      return L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/256/{z}/{x}/{y}@2x?access_token=' + token, {
        attribution: '',
        tileSize: 256,
        maxZoom: 19
      }).addTo(map);
    }
  } catch (e) {}
  return L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);
}

function hsInstallLeafletExpandControl(containerId, mapInstance, label) {
  const container = document.getElementById(containerId);
  if (!container || container.dataset.hsExpandInstalled === '1') return;
  container.dataset.hsExpandInstalled = '1';
  container.classList.add('hs-filter-map-container');

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'hs-map-expand-btn';
  btn.textContent = 'Expand';
  btn.title = 'Expand map';

  function invalidateMap() {
    setTimeout(function(){ try { mapInstance && mapInstance.invalidateSize(); } catch(_) {} }, 80);
    setTimeout(function(){ try { mapInstance && mapInstance.invalidateSize(); } catch(_) {} }, 240);
    setTimeout(function(){ try { mapInstance && mapInstance.invalidateSize(); } catch(_) {} }, 520);
  }

  function expandToBody() {
    if (container.dataset.hsFullscreen === '1') return;
    const ph = document.createElement('div');
    ph.className = 'hs-filter-map-placeholder';
    ph.style.height = (container.offsetHeight || 320) + 'px';
    ph.style.width = '100%';
    container._hsOriginalParent = container.parentNode;
    container._hsOriginalNextSibling = container.nextSibling;
    container._hsPlaceholder = ph;
    container.parentNode.insertBefore(ph, container);
    document.body.appendChild(container);
    container.dataset.hsFullscreen = '1';
    container.classList.add('hs-filter-map-fullscreen');
    document.body.classList.add('hs-filter-map-modal-open');
    btn.textContent = 'Collapse';
    btn.title = 'Collapse map';
    invalidateMap();
  }

  function collapseToOriginalPlace() {
    if (container.dataset.hsFullscreen !== '1') return;
    const parent = container._hsOriginalParent;
    const next = container._hsOriginalNextSibling;
    const ph = container._hsPlaceholder;
    if (parent) {
      if (next && next.parentNode === parent) parent.insertBefore(container, next);
      else parent.appendChild(container);
    }
    if (ph && ph.parentNode) ph.parentNode.removeChild(ph);
    container.dataset.hsFullscreen = '0';
    container.classList.remove('hs-filter-map-fullscreen');
    document.body.classList.remove('hs-filter-map-modal-open');
    btn.textContent = 'Expand';
    btn.title = 'Expand map';
    invalidateMap();
  }

  btn.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (container.dataset.hsFullscreen === '1') collapseToOriginalPlace();
    else expandToBody();
  };

  container._hsCollapseMap = collapseToOriginalPlace;
  container.appendChild(btn);
}

function hsBcWMUHasSpecies(id, selectedSet, data) {
  data = data || (typeof DATA !== 'undefined' ? DATA : []);
  if (!selectedSet || selectedSet.size === 0) return data.some(r => bcMUMatchesPolygon(r.MU, id));
  return data.some(r => bcMUMatchesPolygon(r.MU, id) && (typeof bcSpeciesMatchesAnySelected === 'function' ? bcSpeciesMatchesAnySelected(r.Species, selectedSet) : selectedSet.has(r.Species)));
}

function hsAbWMUHasSpecies(id, selectedSet, cards) {
  cards = cards || ((typeof buildABCards === 'function') ? buildABCards().filter(c => c !== null) : []);
  if (!selectedSet || selectedSet.size === 0) return cards.some(c => typeof abCardMatchesWMU === 'function' ? abCardMatchesWMU(c, id) : String(c.wmu) === String(id));
  return cards.some(c => (typeof abCardMatchesWMU === 'function' ? abCardMatchesWMU(c, id) : String(c.wmu) === String(id)) && selectedSet.has(c.species));
}

let abMapOpen = false;
let abMapInitialized = false;
let abLeafletMapInstance = null;
let abWmuGeoLayer = null;
let abLastFilteredCards = []; // cache of last abApplyFilters result, used by map tooltips

// ── EMBEDDED WMU GEOJSON ──
// Approximate polygon shapes for all major Alberta WMUs.
// Source: Alberta Open Government Data (public domain).
// Coords are [lng, lat] pairs in WGS84.
// AB_WMU_GEOJSON is defined in ab-wmu-geojson.js (loaded via script tag in index.html)
// const AB_WMU_GEOJSON = ...;

// ── ZONE COLOR BY BEST DRAW ODDS FOR THAT WMU ──
// Heat map: green = good odds, yellow = moderate, red = tough, grey = no data
function abWmuFillColor(wmuNum) {
  const num = parseInt(String(wmuNum));
  if (isNaN(num)) return '#888';
  const century = Math.floor(num / 100) * 100;
  switch (century) {
    case 100: return '#4a9e6b';  // deep teal-green
    case 200: return '#2e86ab';  // steel blue
    case 300: return '#7b5ea7';  // muted purple
    case 400: return '#c47c2b';  // warm amber
    case 500: return '#c0392b';  // brick red
    case 600: return '#2e8b7a';  // seafoam teal
    case 700: return '#d4a017';  // golden yellow
    case 800: return '#7a6c2e';  // olive brown
    case 900: return '#5a7a9e';  // slate blue
    default:  return '#888';     // grey — no data
  }
}

// ── STYLE FUNCTION ──
// ── AB WMU NORMALIZATION ──
// Draws with multi-WMU strings (e.g. "102, 118") or sub-area labels
// (e.g. "300 (Area A)") need to be matched against individual polygon IDs.
// abCardMatchesWMU(card, polygonId) returns true if the card belongs to that polygon.
function abNormalizeWMU(raw) {
  // Strip " (Area A/B/...)" suffix → "300 (Area A)" → "300"
  return String(raw || '').replace(/\s*\(Area\s+[^)]+\)/gi, '').trim();
}
function abCardMatchesWMU(card, polygonId) {
  const raw = abNormalizeWMU(card.wmu);
  // Split comma-separated multi-WMU strings and check each part
  return raw.split(',').some(part => part.trim() === polygonId);
}
// Build the set of polygon IDs that have at least one matching card.
// Handles multi-WMU and normalized Area strings.
function abBuildWmuSet(cards) {
  const s = new Set();
  for (const c of cards) {
    const raw = abNormalizeWMU(c.wmu);
    for (const part of raw.split(',')) {
      const id = part.trim();
      if (id) s.add(id);
    }
  }
  return s;
}

// Cache of WMU ids that have real cards — rebuilt by abUpdateMapStyles after each filter run
let _abWmuWithCards = null;

function abWmuGetStyle(feature, isSelected) {
  const id = String(feature.properties.WMUNIT_NUM || '');
  const allCards = (typeof buildABCards === 'function') ? buildABCards().filter(c => c !== null) : [];
  const hasAnyDraws = AB_DATA.length === 0 || (_abWmuWithCards ? _abWmuWithCards.has(id) : allCards.some(c => abCardMatchesWMU(c, id)));
  const speciesActive = typeof abSelSpecies !== 'undefined' && abSelSpecies.size > 0;
  const matchesSpecies = !speciesActive || hsAbWMUHasSpecies(id, abSelSpecies, allCards);
  return {
    fillColor: isSelected ? '#4ade80' : (matchesSpecies ? abWmuFillColor(id) : '#1f2933'),
    fillOpacity: isSelected ? 0.75 : (!hasAnyDraws ? 0.10 : (speciesActive ? (matchesSpecies ? 0.46 : 0.08) : 0.38)),
    color: isSelected ? '#ffffff' : (speciesActive && matchesSpecies ? 'rgba(255,255,255,.22)' : '#1a1a1a'),
    weight: isSelected ? 2.5 : 0.7,
    opacity: isSelected ? 1.0 : (speciesActive && !matchesSpecies ? 0.28 : 0.85)
  };
}

// ── UPDATE ALL ZONE STYLES (called after selection changes) ──
function abUpdateMapStyles() {
  if (!abWmuGeoLayer) return;
  // Rebuild the set of WMUs that have real cards (post-buildABCards quota filter)
  if (AB_DATA.length > 0) {
    const allCards = buildABCards().filter(c => c !== null);
    _abWmuWithCards = abBuildWmuSet(allCards);
  }
  abWmuGeoLayer.eachLayer(layer => {
    const id = String(layer.feature.properties.WMUNIT_NUM || '');
    layer.setStyle(abWmuGetStyle(layer.feature, abSelWMU.has(id)));
  });
  abUpdateMapChips();
  // Keep dropdown in sync
  const dropdown = document.querySelector('#abWMUList select');
  if (dropdown) dropdown.value = abSelWMU.size === 1 ? [...abSelWMU][0] : '';
}

// ── CHIP ROW BELOW MAP ──
function abUpdateMapChips() {
  const chips = document.getElementById('abMapChips');
  if (!chips) return;
  if (abSelWMU.size === 0) {
    chips.innerHTML = '<span style="font-size:11px;color:var(--text-muted)">Click zones to filter · multi-select supported</span>';
    return;
  }
  const sorted = [...abSelWMU].sort((a,b)=>parseInt(a)-parseInt(b));
  chips.innerHTML = sorted.map(w =>
    `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px 3px 10px;background:rgba(74,222,128,.15);border:1px solid rgba(74,222,128,.35);border-radius:12px;font-size:11px;font-weight:700;color:#4ade80;cursor:default">
      WMU&nbsp;${w}
      <span onclick="abToggleWMU('${w}')" style="cursor:pointer;opacity:.65;font-size:14px;line-height:1;margin-left:1px" title="Remove">×</span>
    </span>`
  ).join('');
  // Add clear all if multiple
  if (abSelWMU.size > 1) {
    chips.innerHTML += `<span onclick="abSidebarClearFilter('wmu')" style="font-size:11px;color:var(--text-muted);text-decoration:underline;cursor:pointer;padding:3px 6px">Clear all</span>`;
  }
}

// ── AUTO-OPEN MAP (called on page load — no button press needed) ──
function abAutoOpenMap() {
  const panel = document.getElementById('abMapPanel');
  const btn = document.getElementById('abMapToggleBtn');
  if (!panel) return;
  // Already open — just make sure Leaflet size is valid
  if (abMapOpen) {
    setTimeout(() => abLeafletMapInstance && abLeafletMapInstance.invalidateSize(), 150);
    return;
  }
  abMapOpen = true;
  panel.style.display = 'block';
  if (btn) {
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Close Map`;
    btn.style.background = 'rgba(74,222,128,.18)';
  }
  const container = document.getElementById('abLeafletMap');
  const containerIsStale = container && !container._leaflet_id;
  if (!abMapInitialized || containerIsStale) {
    abMapInitialized = false;
    abLeafletMapInstance = null;
    abWmuGeoLayer = null;
    abInitLeafletMap();
  } else {
    setTimeout(() => abLeafletMapInstance && abLeafletMapInstance.invalidateSize(), 150);
  }
}

// ── TOGGLE MAP PANEL OPEN/CLOSE ──
function abToggleMap() {
  const panel = document.getElementById('abMapPanel');
  const btn = document.getElementById('abMapToggleBtn');
  if (!panel || !btn) return;
  abMapOpen = !abMapOpen;
  panel.style.display = abMapOpen ? 'block' : 'none';
  btn.innerHTML = abMapOpen
    ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Close Map`
    : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg> Filter by Map`;
  btn.style.background = abMapOpen ? 'rgba(74,222,128,.18)' : 'rgba(74,222,128,.08)';
  if (abMapOpen) {
    // If the container div was re-rendered by abBuildWMUList(), Leaflet's
    // _leaflet_id marker will be gone — detect this and re-init from scratch.
    const container = document.getElementById('abLeafletMap');
    const containerIsStale = container && !container._leaflet_id;
    if (!abMapInitialized || containerIsStale) {
      abMapInitialized = false;
      abLeafletMapInstance = null;
      abWmuGeoLayer = null;
      abInitLeafletMap();
    } else {
      setTimeout(() => abLeafletMapInstance && abLeafletMapInstance.invalidateSize(), 150);
    }
  }
}

// ── INIT LEAFLET MAP ──
function abInitLeafletMap() {
  if (abMapInitialized) return;
  abMapInitialized = true;

  // Make sure Leaflet CSS is loaded
  if (!document.querySelector('link[href*="leaflet"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(link);
  }

  function initWhenReady() {
    abLeafletMapInstance = L.map('abLeafletMap', {
      center: [54.0, -115.0],
      zoom: 5,
      minZoom: 4,
      maxZoom: 13,
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: true,   // always on
      touchZoom: true,         // pinch zoom always on
      tap: true
    });

    L.control.attribution({ prefix: '© <a href="https://openstreetmap.org/copyright" target="_blank">OSM</a>', position: 'bottomright' }).addTo(abLeafletMapInstance);
    hsInstallLeafletExpandControl('abLeafletMap', abLeafletMapInstance, 'Alberta');

    // Hide the scroll hint — no longer needed since zoom is always active
    const hint = document.getElementById('abMapScrollHint');
    if (hint) hint.style.display = 'none';

    // OpenStreetMap tile layer — same as albertahuntmap.ca
    hsAddDarkLeafletTiles(abLeafletMapInstance);

    // Add WMU polygons from embedded GeoJSON
    abWmuGeoLayer = L.geoJSON(AB_WMU_GEOJSON, {
      style: feature => abWmuGetStyle(feature, false),
      onEachFeature: (feature, layer) => {
        const id = String(feature.properties.WMUNIT_NUM || '');
        const hasDraws = AB_DATA.length === 0 || (() => {
          const allCards = buildABCards().filter(c => c !== null);
          return allCards.some(c => abCardMatchesWMU(c, id));
        })();

        // Hover effects — selected zones keep their green style, only unselected get white glow
        layer.on('mouseover', function(e) {
          const isSelected = abSelWMU.has(id);
          if (!isSelected) {
            this.setStyle({ fillColor: '#ffffff', fillOpacity: 0.35, weight: 1.5, color: '#ffffff' });
          } else {
            // Brighten slightly to acknowledge hover, but keep selected look
            this.setStyle({ fillColor: '#4ade80', fillOpacity: 0.92, weight: 3, color: '#ffffff' });
          }
          // Count how many cards would show for this WMU under current non-WMU filters.
          // We take the already-filtered result set and count cards matching this WMU,
          // OR if this WMU is not currently selected we count from the full filtered-minus-WMU set.
          let wmuCardCount;
          if (abSelWMU.has(id)) {
            // WMU is already in the filter — count cards in the current result that match it
            wmuCardCount = abLastFilteredCards.filter(c => abCardMatchesWMU(c, id)).length;
          } else {
            // WMU is not selected — simulate adding it: apply all current non-WMU filters to all cards
            const allCards = buildABCards().filter(c => c !== null);
            const thresh = AB_ODDS_STEPS[abMinOdds] || 0;
            wmuCardCount = allCards.filter(c => {
              if (!abCardMatchesWMU(c, id)) return false;
              if (abSelSpecies.size > 0 && !abSelSpecies.has(c.species)) return false;
              if (abSelClass.size > 0) {
                const d = (c.draw || '').toLowerCase();
                const match = [...abSelClass].some(cl => {
                  if (cl === 'Antlered') return d.includes('antlered') && !d.includes('antlerless');
                  if (cl === 'Antlerless') return d.includes('antlerless');
                  if (cl === 'Any') return !d.includes('antlered') && !d.includes('antlerless');
                  return false;
                });
                if (!match) return false;
              }
              const odds = c.personalOdds !== null ? c.personalOdds : c.latestOdds;
              if (odds < thresh) return false;
              if (abProfileFilter === 'has_profile' && isNaN(c.userPts)) return false;
              if (abProfileFilter === 'above_threshold' && c.thresholdStatus !== 'above') return false;
              if (abProfileFilter === 'below_threshold' && c.thresholdStatus !== 'below') return false;
              return true;
            }).length;
          }
          const tipText = wmuCardCount > 0
            ? `<b style="color:#4ade80">WMU ${id}</b><br><span style="font-size:11px;color:#aaa">${wmuCardCount} draw${wmuCardCount !== 1 ? 's' : ''} available</span>`
            : `<b>WMU ${id}</b><br><span style="font-size:11px;color:#888">No draws match current filters</span>`;
          this.bindTooltip(tipText, {
            sticky: true,
            direction: 'top',
            offset: [0, -4],
            opacity: 1,
            className: 'ab-wmu-tip'
          }).openTooltip(e.latlng);
        });

        layer.on('mouseout', function() {
          // Always restore to the correct persistent style (selected = green, unselected = default)
          this.setStyle(abWmuGetStyle(feature, abSelWMU.has(id)));
          this.closeTooltip();
        });

        // Click: toggle zone in filter
        layer.on('click', function() {
          if (!hasDraws) return; // don't select zones with no draws
          abToggleWMU(id);
          // abToggleWMU already calls abUpdateMapStyles + abApplyFilters
        });
      }
    }).addTo(abLeafletMapInstance);

    // Fit map to Alberta bounds
    abLeafletMapInstance.fitBounds([[49.0, -120.0], [60.0, -110.0]]);
    abUpdateMapChips();
  }

  // If Leaflet already loaded, init immediately; otherwise load it first
  if (typeof L !== 'undefined') {
    initWhenReady();
  } else {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    script.onload = initWhenReady;
    document.head.appendChild(script);
  }
}


// ══════════════════════════════════════════════════════════════
// ── BC WMU INTERACTIVE MAP
// ══════════════════════════════════════════════════════════════

function bcWmuFillColor(wmuId) {
  const region = parseInt((wmuId || '').split('-')[0]);
  if (region === 1) return '#4a8f5a';
  if (region === 2) return '#6aab76';
  if (region === 3) return '#9bc46a';
  if (region === 4) return '#c49a35';
  if (region === 5) return '#c06828';
  if (region === 6) return '#7a8fd4';
  if (region === 7) return '#a064c8';
  if (region === 8) return '#5ab8c4';
  if (region === 9) return '#c45a8a';
  return '#666';
}

function bcWmuGetStyle(feature, isSelected) {
  const id = feature.properties.wmu_id || '';
  const hasAnyDraws = DATA.length === 0 || DATA.some(r => bcMUMatchesPolygon(r.MU, id));
  const speciesActive = typeof selSpecies !== 'undefined' && selSpecies.size > 0;
  const matchesSpecies = !speciesActive || hsBcWMUHasSpecies(id, selSpecies, DATA);
  return {
    fillColor:    isSelected ? '#4ade80' : (matchesSpecies ? bcWmuFillColor(id) : '#1f2933'),
    fillOpacity:  isSelected ? 0.75 : (!hasAnyDraws ? 0.10 : (speciesActive ? (matchesSpecies ? 0.46 : 0.08) : 0.38)),
    color:        isSelected ? '#ffffff' : (speciesActive && matchesSpecies ? 'rgba(255,255,255,.22)' : '#18241e'),
    weight:       isSelected ? 2.5 : 0.7,
    opacity:      isSelected ? 1.0 : (speciesActive && !matchesSpecies ? 0.28 : 0.85)
  };
}

function bcToggleWMUFull(id) {
  if (selMUsFull.has(id)) selMUsFull.delete(id); else selMUsFull.add(id);
  bcUpdateMapStyles();
  applyFilters();
}

function bcUpdateMapStyles() {
  if (!bcWmuGeoLayer) return;
  bcWmuGeoLayer.eachLayer(function(layer) {
    const id = layer.feature.properties.wmu_id || '';
    layer.setStyle(bcWmuGetStyle(layer.feature, selMUsFull.has(id)));
  });
  bcUpdateMapChips();
}

function bcUpdateMapChips() {
  const chips = document.getElementById('bcMapChips');
  if (!chips) return;
  if (selMUsFull.size === 0) {
    chips.innerHTML = '<span style="font-size:11px;color:var(--text-muted)">Click zones to filter · multi-select supported</span>';
    return;
  }
  const sorted = [...selMUsFull].sort();
  chips.innerHTML = sorted.map(id =>
    '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px 3px 10px;background:rgba(74,222,128,.15);border:1px solid rgba(74,222,128,.35);border-radius:12px;font-size:11px;font-weight:700;color:#4ade80;cursor:default">' +
      'WMU\u00a0' + id +
      '<span onclick="bcToggleWMUFull(\'' + id + '\')" style="cursor:pointer;opacity:.65;font-size:14px;line-height:1;margin-left:1px" title="Remove">\u00d7</span>' +
    '</span>'
  ).join('');
  if (selMUsFull.size > 1) {
    chips.innerHTML += '<span onclick="selMUsFull.clear();bcUpdateMapStyles();applyFilters();" style="font-size:11px;color:var(--text-muted);text-decoration:underline;cursor:pointer;padding:3px 6px">Clear all</span>';
  }
}

function bcToggleMap() {
  const panel = document.getElementById('bcMapPanel');
  const btn = document.getElementById('bcMapToggleBtn');
  if (!panel || !btn) return;
  bcMapOpen = !bcMapOpen;
  panel.style.display = bcMapOpen ? 'block' : 'none';
  btn.innerHTML = bcMapOpen
    ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Close Map'
    : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg> Filter by Map';
  btn.style.background = bcMapOpen ? 'rgba(74,222,128,.18)' : 'rgba(74,222,128,.08)';
  if (bcMapOpen) {
    var container = document.getElementById('bcLeafletMap');
    if (!bcMapInitialized || (container && !container._leaflet_id)) {
      bcMapInitialized = false;
      bcLeafletMapInstance = null;
      bcWmuGeoLayer = null;
      bcInitLeafletMap();
    } else {
      setTimeout(function() { bcLeafletMapInstance && bcLeafletMapInstance.invalidateSize(); }, 150);
    }
  }
}

function bcInitLeafletMap() {
  if (bcMapInitialized) return;
  bcMapInitialized = true;

  if (!document.querySelector('link[href*="leaflet"]')) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(link);
  }

  function doInit() {
    if (bcWmuGeoJSON) {
      bcRenderMap(bcWmuGeoJSON);
    } else {
      var container = document.getElementById('bcLeafletMap');
      if (container) {
        var loader = document.createElement('div');
        loader.id = 'bcMapLoader';
        loader.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:500;background:var(--bg-secondary,#111);border-radius:10px';
        loader.innerHTML = '<span style="font-size:12px;color:var(--text-muted)">Loading BC map\u2026</span>';
        container.appendChild(loader);
      }
      bcWmuGeoJSON = BC_WMU_GEOJSON;
      var loader = document.getElementById('bcMapLoader');
      if (loader) loader.remove();
      bcRenderMap(BC_WMU_GEOJSON);
    }
  }

  if (typeof L !== 'undefined') {
    doInit();
  } else {
    var script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    script.onload = doInit;
    document.head.appendChild(script);
  }
}

// ── BC MU NORMALIZATION ──
// Some BC draw records have modifier suffixes (*, **, ***, +) that denote
// partial-area or special-condition hunts within the same base WMU polygon.
// Strip those suffixes so map polygon matching works for all variants.
function bcNormalizeMU(mu) {
  // Strip trailing modifier suffixes (* +), then remove leading zeros from
  // the sub-number so "5-01" normalizes to "5-1" to match GeoJSON IDs.
  const stripped = String(mu || '').replace(/[\*\+]+$/, '').trim();
  return stripped.replace(/^(\d+)-0*(\d+)$/, '$1-$2');
}
function bcMUMatchesPolygon(mu, polygonId) {
  return bcNormalizeMU(mu) === bcNormalizeMU(polygonId);
}

function bcRenderMap(geojson) {
  var container = document.getElementById('bcLeafletMap');
  if (!container) return;

  bcLeafletMapInstance = L.map('bcLeafletMap', {
    center: [54.0, -124.0],
    zoom: 5,
    minZoom: 4,
    maxZoom: 13,
    zoomControl: true,
    attributionControl: false,
    scrollWheelZoom: true,
    touchZoom: true
  });

  L.control.attribution({ prefix: '© <a href="https://openstreetmap.org/copyright" target="_blank">OSM</a>', position: 'bottomright' }).addTo(bcLeafletMapInstance);
  hsInstallLeafletExpandControl('bcLeafletMap', bcLeafletMapInstance, 'BC');

  hsAddDarkLeafletTiles(bcLeafletMapInstance);

  var wmusWithDraws = new Set(DATA.map(function(r) { return bcNormalizeMU(r.MU); }));

  bcWmuGeoLayer = L.geoJSON(geojson, {
    style: function(feature) { return bcWmuGetStyle(feature, false); },
    onEachFeature: function(feature, layer) {
      var id = feature.properties.wmu_id || '';
      var hasDraws = wmusWithDraws.has(id);

      layer.on('mouseover', function(e) {
        var isSelected = selMUsFull.has(id);
        if (!isSelected) {
          this.setStyle({ fillColor: '#ffffff', fillOpacity: 0.35, weight: 1.5, color: '#ffffff' });
        } else {
          this.setStyle({ fillColor: '#4ade80', fillOpacity: 0.92, weight: 3, color: '#ffffff' });
        }
        var cardCount = isSelected
          ? filtered.filter(function(r) { return bcMUMatchesPolygon(r.MU, id); }).length
          : DATA.filter(function(r) {
              if (!bcMUMatchesPolygon(r.MU, id)) return false;
              if (selSpecies.size > 0 && !(typeof bcSpeciesMatchesAnySelected === 'function' ? bcSpeciesMatchesAnySelected(r.Species, selSpecies) : selSpecies.has(r.Species))) return false;
              if ((r['%'] || 0) < selMinOdds) return false;
              return true;
            }).length;
        var tipText = cardCount > 0
          ? '<b style="color:#4ade80">WMU ' + id + '</b><br><span style="font-size:11px;color:#aaa">' + cardCount + ' draw' + (cardCount !== 1 ? 's' : '') + ' available</span>'
          : '<b>WMU ' + id + '</b><br><span style="font-size:11px;color:#888">No draws match filters</span>';
        this.bindTooltip(tipText, { sticky: true, direction: 'top', offset: [0, -4], opacity: 1, className: 'ab-wmu-tip' }).openTooltip(e.latlng);
      });

      layer.on('mouseout', function() {
        this.setStyle(bcWmuGetStyle(feature, selMUsFull.has(id)));
        this.closeTooltip();
      });

      layer.on('click', function() {
        if (!hasDraws) return;
        bcToggleWMUFull(id);
      });
    }
  }).addTo(bcLeafletMapInstance);

  bcLeafletMapInstance.fitBounds([[48.3, -139.0], [60.0, -114.0]]);
  bcUpdateMapChips();
}

// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// ── FULL-PAGE MAP TAB — Mapbox GL JS (3D terrain)
// ══════════════════════════════════════════════════════════════

let fullMapProvince    = 'BC';
let fullMapInitialized = { BC: false, AB: false };
let fullMapInstance    = null;
let fullMapGeoLayer    = null; // kept for pin location lookup
let fullMapSelRegions  = new Set();
let fullMapSelectedSpecies = '';
let fullMapSelectedWMU = '';
let _fullMapUserMarker = null;
let _fullMapUserAccuracy = null;
let fullMapSortMode    = 'odds';

let _fullMapStyle      = 'streets';
let _fullMapTerrain3D  = false;
let _fullMapLEHVisible = false;
let _fullMapLEHLoading = false;
let _fullMapLEHOpacity = 0.035; // V9: outline-first LEH zones, only a tiny default fill
let _fullMapWMUOpacity = 1.0; // multiplier: 1 = full, 0 = invisible
let _fullMapLEHSpecies = ''; // empty = user must select a species before LEH zones draw
let _hoveredWMU        = null;
let _hoveredLEH        = null;
let _activeLEH         = null;

// ── LEH zone type colours ──
const _LEH_COLORS = {
  'MOUNTAIN SHEEP':    '#e8a838',
  'MOUNTAIN GOAT':     '#60a5fa',
  'MOOSE':             '#4ade80',
  'ELK':               '#f97316',
  'CARIBOU':           '#a78bfa',
  'BLACK BEAR':        '#94a3b8',
  'MULE DEER':         '#fbbf24',
  'WHITE-TAILED DEER': '#f472b6',
  'BISON':             '#fb923c',
  'TURKEY':            '#34d399',
};

// Mapbox style URLs — highest quality available
const _MB_STYLES = {
  streets:   'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',  // Maxar Vivid + Vexcel aerial (sub-metre resolution)
  topo:      'mapbox://styles/mapbox/outdoors-v12',           // Mapbox Outdoors — contours, hillshade, terrain labels
};

// Layer/source IDs
const _SRC_WMU        = 'wmu-src';
const _LYR_WMU_FILL   = 'wmu-fill';
const _LYR_WMU_LINE   = 'wmu-line';
const _SRC_LEH        = 'leh-src';
const _LYR_LEH_FILL   = 'leh-fill';
const _LYR_LEH_LINE   = 'leh-line';
const _LYR_LEH_HOVER_FILL = 'leh-hover-fill';
const _LYR_LEH_HOVER_LINE = 'leh-hover-line';

// BC region colours (for fill expression)
const _BC_REGION_COLORS = {
  '1':'#4a8f5a','2':'#6aab76','3':'#9bc46a','4':'#c49a35',
  '5':'#c06828','6':'#7a8fd4','7':'#a064c8','8':'#5ab8c4','9':'#c45a8a'
};

// ── Province switch ──
function fullMapSetProvince(prov) {
  if (fullMapProvince === prov) return;
  fullMapProvince = prov;
  fullMapSelRegions.clear();
  fullMapSelectedSpecies = '';
  fullMapSelectedWMU = '';
  const bcBtn = document.getElementById('mapToggleBC');
  const abBtn = document.getElementById('mapToggleAB');
  if (bcBtn) bcBtn.classList.toggle('active', prov === 'BC');
  if (abBtn) abBtn.classList.toggle('active', prov === 'AB');
  if (fullMapInstance) { fullMapInstance.remove(); fullMapInstance = null; fullMapGeoLayer = null; }
  fullMapInitialized[prov] = false;
  fullMapHideResults();
  fullMapBuildSelectors();
  fullMapUpdateChips();
  fullMapUpdateLEHSpeciesDropdown();
  fullMapMobileRefresh();
  fullMapInit();
}

// ── Entry point ──
let _fullMapGateAttempts = 0;
function fullMapInit() {
  if (fullMapInitialized[fullMapProvince]) {
    if (fullMapInstance) fullMapInstance.resize();
    return;
  }

  const loading = document.getElementById('fullMapLoading');
  const txt     = document.getElementById('fullMapLoadingText');
  if (loading) loading.style.display = 'flex';
  if (txt) txt.textContent = `Loading ${fullMapProvince === 'BC' ? 'BC' : 'Alberta'} map…`;

  function doInit() {
    // Get token from config.js
    const token = (typeof MAPBOX_TOKEN !== 'undefined') ? MAPBOX_TOKEN : '';
    if (!token) {
      if (loading) loading.innerHTML = '<span style="color:#f87171;font-size:12px">Mapbox token missing. Add config.js.</span>';
      return;
    }
    mapboxgl.accessToken = token;
    if (fullMapProvince === 'BC') _fullMapInitBC();
    else _fullMapInitAB();
  }

  if (window.mapboxgl) {
    doInit();
  } else {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js';
    script.onload = doInit;
    script.onerror = () => { if (loading) loading.innerHTML = '<span style="color:#f87171;font-size:12px">Failed to load map.</span>'; };
    document.head.appendChild(script);
  }
}

// ── Build base Mapbox map ──
function _fullMapBuild(center, zoom) {
  const container = document.getElementById('fullMapLeaflet');
  if (!container) return null;
  container.innerHTML = '';

  const map = new mapboxgl.Map({
    container: 'fullMapLeaflet',
    style: _MB_STYLES[_fullMapStyle] || _MB_STYLES.satellite,
    center, zoom,
    minZoom: 3, maxZoom: 20,
    projection: 'mercator',
    // 512px tiles = sharper imagery at same zoom (Mapbox GL default)
    // Unlocks Maxar Vivid + Vexcel aerial sub-metre tiles for BC/AB
  });

  map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

  return map;
}


function _fullMapFitProvinceOverview(prov) {
  if (!fullMapInstance) return;
  const bounds = prov === 'AB'
    ? [[-120.2, 48.8], [-109.6, 60.2]]
    : [[-139.3, 48.1], [-113.8, 60.2]];
  fullMapInstance.resize();
  fullMapInstance.fitBounds(bounds, {
    padding: { top: 28, bottom: 28, left: 28, right: 28 },
    duration: 0,
    bearing: 0,
    pitch: 0
  });
  if (fullMapInstance.getPitch && fullMapInstance.getPitch() !== 0) {
    fullMapInstance.jumpTo({ pitch: 0, bearing: 0 });
  }
}

// ── BC init ──
function _fullMapInitBC() {
  fullMapInitialized['BC'] = true;
  const map = _fullMapBuild([-126.3, 54.4], 4.15);
  if (!map) return;
  fullMapInstance = map;

  map.on('load', () => {
    const loading = document.getElementById('fullMapLoading');
    if (loading) loading.style.display = 'none';
    fullMapBuildSelectors();
    setTimeout(hsRailBootstrap, 80);

    const geojson = bcWmuGeoJSON || BC_WMU_GEOJSON;
    bcWmuGeoJSON = geojson;

    map.addSource(_SRC_WMU, { type: 'geojson', data: geojson, generateId: true });

    // Build fill-color expression using region prefix
    const colorExpr = ['case', ['boolean', ['feature-state', 'selected'], false], '#4ade80'];
    const matchExpr = ['match',
      ['slice', ['get', 'wmu_id'], 0, ['index-of', '-', ['get', 'wmu_id']]],
      ...Object.entries(_BC_REGION_COLORS).flatMap(([k,v]) => [k, v]),
      '#555555'
    ];
    colorExpr.push(matchExpr);

    map.addLayer({
      id: _LYR_WMU_FILL, type: 'fill', source: _SRC_WMU,
      paint: {
        'fill-color': colorExpr,
        'fill-opacity': ['case',
          ['boolean', ['feature-state', 'selected'], false], 0.75,
          ['boolean', ['feature-state', 'hovered'],  false], 0.5,
          ['boolean', ['feature-state', 'matchesSpecies'],  false], 0.44,
          0.08
        ],
      }
    });

    map.addLayer({
      id: _LYR_WMU_LINE, type: 'line', source: _SRC_WMU,
      paint: {
        'line-color': ['case', ['boolean', ['feature-state', 'selected'], false], '#ffffff', '#1a2a1a'],
        'line-width':  ['case', ['boolean', ['feature-state', 'selected'], false], 2.5, 0.7],
        'line-opacity': 0.8,
      }
    });

    // Set feature states
    geojson.features.forEach((feat, i) => {
      const id = feat.properties.wmu_id || '';
      const hasDraws = DATA.some(r => bcMUMatchesPolygon(r.MU, id));
      const matchesSpecies = _fullMapUnitMatchesSpecies(id);
      map.setFeatureState({ source: _SRC_WMU, id: i }, { hasDraws, matchesSpecies, selected: false, hovered: false });
    });

    // Hover
    map.on('mousemove', _LYR_WMU_FILL, e => {
      const lehHit = _getTopLEHFeatureAtPoint(e);
      if (lehHit && _showLEHMapTooltip(e, lehHit)) { _setLEHHoverFromFeature(lehHit); map.getCanvas().style.cursor = 'crosshair'; return; }
      _clearLEHHover();
      if (!e.features.length) return;
      const feat = e.features[0];
      const id = feat.properties.wmu_id || '';
      if (_hoveredWMU !== null && _hoveredWMU !== feat.id) {
        map.setFeatureState({ source: _SRC_WMU, id: _hoveredWMU }, { hovered: false });
      }
      _hoveredWMU = feat.id;
      map.setFeatureState({ source: _SRC_WMU, id: feat.id }, { hovered: true });
      map.getCanvas().style.cursor = 'pointer';
      _showMapTooltip(e, id, 'BC');
    });
    map.on('mouseleave', _LYR_WMU_FILL, () => {
      _clearLEHHover();
      if (_hoveredWMU !== null) { map.setFeatureState({ source: _SRC_WMU, id: _hoveredWMU }, { hovered: false }); _hoveredWMU = null; }
      map.getCanvas().style.cursor = '';
      _hideMapTooltip();
    });

    // Click
    map.on('click', _LYR_WMU_FILL, e => {
      if (e.originalEvent && e.originalEvent._hsWMUToggledFromLEH) return;
      const id = e.features[0].properties.wmu_id || '';
      if (!DATA.some(r => bcMUMatchesPolygon(r.MU, id))) return;
      _fullMapToggleRegion(id, e.features[0].id);
    });

    _syncTileButtons();
    _fullMapFitProvinceOverview('BC');
    // Resize + refit a few frames later so the opening view is correct after
    // nav/topbar layout finishes measuring.
    setTimeout(() => { if (fullMapProvince === 'BC' && fullMapInstance === map && fullMapSelRegions.size === 0) { map.resize(); _fullMapFitProvinceOverview('BC'); } }, 80);
    setTimeout(() => { if (fullMapProvince === 'BC' && fullMapInstance === map && fullMapSelRegions.size === 0) { map.resize(); _fullMapFitProvinceOverview('BC'); } }, 250);
    fullMapUpdateLEHSpeciesDropdown();
    if (_fullMapTerrain3D) _applyTerrain(true);
  });

  map.on('error', e => console.error('[Map]', e.error));
}

// ── AB init ──
function _fullMapInitAB() {
  fullMapInitialized['AB'] = true;
  const map = _fullMapBuild([-115.0, 54.3], 4.35);
  if (!map) return;
  fullMapInstance = map;

  map.on('load', async () => {
    await Promise.all([loadABData(), loadABHarvest()]);
    const loading = document.getElementById('fullMapLoading');
    if (loading) loading.style.display = 'none';
    fullMapBuildSelectors();
    setTimeout(hsRailBootstrap, 80);

    map.addSource(_SRC_WMU, { type: 'geojson', data: AB_WMU_GEOJSON, generateId: true });

    map.addLayer({
      id: _LYR_WMU_FILL, type: 'fill', source: _SRC_WMU,
      paint: {
        'fill-color': ['case', ['boolean', ['feature-state', 'selected'], false], '#4ade80',
          ['match', ['to-string', ['floor', ['/', ['to-number', ['get', 'WMUNIT_NUM'], 0], 100]]],
            '1','#4a8f9a','2','#6aab8a','3','#9bc47a','4','#c49a45','5','#c07838','6','#8a7fd4','#5a8fa8']
        ],
        'fill-opacity': ['case',
          ['boolean', ['feature-state', 'selected'], false], 0.75,
          ['boolean', ['feature-state', 'hovered'],  false], 0.5,
          ['boolean', ['feature-state', 'matchesSpecies'],  false], 0.44,
          0.08
        ],
      }
    });

    map.addLayer({
      id: _LYR_WMU_LINE, type: 'line', source: _SRC_WMU,
      paint: {
        'line-color': ['case', ['boolean', ['feature-state', 'selected'], false], '#ffffff', '#1a1a2a'],
        'line-width':  ['case', ['boolean', ['feature-state', 'selected'], false], 2.5, 0.7],
        'line-opacity': 0.8,
      }
    });

    const allCards = buildABCards().filter(c => c !== null);
    AB_WMU_GEOJSON.features.forEach((feat, i) => {
      const id = String(feat.properties.WMUNIT_NUM || '');
      const hasDraws = allCards.some(c => abCardMatchesWMU(c, id));
      const matchesSpecies = _fullMapUnitMatchesSpecies(id);
      map.setFeatureState({ source: _SRC_WMU, id: i }, { hasDraws, matchesSpecies, selected: false, hovered: false });
    });

    map.on('mousemove', _LYR_WMU_FILL, e => {
      if (!e.features.length) return;
      const feat = e.features[0];
      const id = String(feat.properties.WMUNIT_NUM || '');
      if (_hoveredWMU !== null && _hoveredWMU !== feat.id) {
        map.setFeatureState({ source: _SRC_WMU, id: _hoveredWMU }, { hovered: false });
      }
      _hoveredWMU = feat.id;
      map.setFeatureState({ source: _SRC_WMU, id: feat.id }, { hovered: true });
      map.getCanvas().style.cursor = 'pointer';
      _showMapTooltip(e, id, 'AB');
    });
    map.on('mouseleave', _LYR_WMU_FILL, () => {
      if (_hoveredWMU !== null) { map.setFeatureState({ source: _SRC_WMU, id: _hoveredWMU }, { hovered: false }); _hoveredWMU = null; }
      map.getCanvas().style.cursor = '';
      _hideMapTooltip();
    });

    map.on('click', _LYR_WMU_FILL, e => {
      const id = String(e.features[0].properties.WMUNIT_NUM || '');
      const allCards = buildABCards().filter(c => c !== null);
      if (!allCards.some(c => abCardMatchesWMU(c, id))) return;
      _fullMapToggleRegion(id, e.features[0].id);
    });

    _syncTileButtons();
    _fullMapFitProvinceOverview('AB');
    setTimeout(() => { if (fullMapProvince === 'AB' && fullMapInstance === map && fullMapSelRegions.size === 0) { map.resize(); _fullMapFitProvinceOverview('AB'); } }, 80);
    setTimeout(() => { if (fullMapProvince === 'AB' && fullMapInstance === map && fullMapSelRegions.size === 0) { map.resize(); _fullMapFitProvinceOverview('AB'); } }, 250);
    fullMapUpdateLEHSpeciesDropdown();
    fullMapMobileRefresh();
    if (_fullMapTerrain3D) _applyTerrain(true);
  });
}


// ── Tooltip ──
let _mapTooltipEl = null;

function _ensureMapTooltip() {
  if (!_mapTooltipEl) {
    _mapTooltipEl = document.createElement('div');
    _mapTooltipEl.style.cssText = 'position:fixed;z-index:9000;pointer-events:none;background:#1a1a1a;border:1px solid #3a3a3a;border-radius:8px;padding:7px 12px;font-size:12px;color:#e8e8e8;box-shadow:0 4px 16px rgba(0,0,0,.6);white-space:nowrap';
    document.body.appendChild(_mapTooltipEl);
  }
  return _mapTooltipEl;
}

function _positionMapTooltip(e) {
  if (!_mapTooltipEl || !e || !e.originalEvent) return;
  _mapTooltipEl.style.left = (e.originalEvent.clientX + 14) + 'px';
  _mapTooltipEl.style.top  = (e.originalEvent.clientY - 10) + 'px';
}

function _showLEHMapTooltip(e, feature) {
  if (!feature || !feature.properties) return false;
  const p = feature.properties;
  const el = _ensureMapTooltip();
  el.style.borderColor = '#f0b429';
  const label = p.label || _lehFormatZoneLabel('', p.mu || '', p.zoneLetter || '');
  const species = p.zt || '';
  el.innerHTML = `<b style="color:#f0b429">${label}</b>${species ? `<br><span style="font-size:10px;color:#aaa">${species}</span>` : ''}`;
  el.style.display = 'block';
  _positionMapTooltip(e);
  fullMapMobileShowZonePill(label, species);
  return true;
}

function _getTopLEHFeatureAtPoint(e) {
  if (!fullMapInstance || !e || !e.point) return null;
  const layers = [_LYR_LEH_FILL, _LYR_LEH_LINE].filter(id => fullMapInstance.getLayer(id));
  if (!layers.length) return null;
  const hits = fullMapInstance.queryRenderedFeatures(e.point, { layers });
  return hits && hits.length ? hits[0] : null;
}



function _getTopWMUFeatureAtPoint(e) {
  if (!fullMapInstance || !e || !e.point || !fullMapInstance.getLayer(_LYR_WMU_FILL)) return null;
  const hits = fullMapInstance.queryRenderedFeatures(e.point, { layers: [_LYR_WMU_FILL] });
  return hits && hits.length ? hits[0] : null;
}

function _setLEHFeatureState(featureId, patch) {
  if (!fullMapInstance || featureId == null || !fullMapInstance.getSource(_SRC_LEH)) return;
  try { fullMapInstance.setFeatureState({ source: _SRC_LEH, id: featureId }, patch); } catch(e) {}
}

function _setLEHHoverFilter(featureId) {
  if (!fullMapInstance) return;
  const fid = featureId == null ? '__none__' : String(featureId);
  const filter = ['any',
    ['==', ['get', 'id'], fid],
    ['==', ['to-string', ['id']], fid]
  ];
  [_LYR_LEH_HOVER_FILL, _LYR_LEH_HOVER_LINE].forEach(layerId => {
    if (fullMapInstance.getLayer(layerId)) {
      try { fullMapInstance.setFilter(layerId, filter); } catch(e) {}
    }
  });
}

function _clearLEHHover() {
  if (_hoveredLEH != null) {
    _setLEHFeatureState(_hoveredLEH, { hovered: false });
    _hoveredLEH = null;
  }
  // Keep a tapped/active zone highlighted on mobile; otherwise remove the hover highlight.
  _setLEHHoverFilter(_activeLEH);
}

function _setLEHHoverFromFeature(f) {
  if (!f) return;
  const id = f.id ?? f.properties?.id;
  if (id == null) return;
  if (_hoveredLEH !== id) {
    _clearLEHHover();
    _hoveredLEH = id;
  }
  _setLEHFeatureState(id, { hovered: true });
  _setLEHHoverFilter(id);
}

function _setLEHActiveFromFeature(f) {
  if (!f) return;
  const id = f.id ?? f.properties?.id;
  if (id == null) return;
  if (_activeLEH != null && _activeLEH !== id) _setLEHFeatureState(_activeLEH, { active: false });
  _activeLEH = id;
  _setLEHFeatureState(id, { active: true, hovered: true });
  _setLEHHoverFilter(id);
}

function _showMapTooltip(e, id, prov) {
  // LEH zones sit inside WMUs, so Mapbox can fire the WMU hover at the same time.
  // Always give LEH zones priority so the tooltip says "Zone A of MU 3-17" instead of only "WMU 3-17".
  if (prov === 'BC') {
    const lehHit = _getTopLEHFeatureAtPoint(e);
    if (lehHit && _showLEHMapTooltip(e, lehHit)) return;
  }
  let cnt = prov === 'BC'
    ? DATA.filter(r => bcMUMatchesPolygon(r.MU, id) && _fullMapDrawMatchesSpeciesName(r.Species)).length
    : (() => { const c = buildABCards().filter(x=>x); return c.filter(x => abCardMatchesWMU(x, id) && _fullMapDrawMatchesSpeciesName(x.species)).length; })();
  const el = _ensureMapTooltip();
  el.style.borderColor = '#3a3a3a';
  el.innerHTML = `<b style="color:#4ade80">WMU ${id}</b><br><span style="font-size:11px;color:#aaa">${cnt||'No'} draw${cnt!==1?'s':''}</span>`;
  el.style.display = 'block';
  _positionMapTooltip(e);
}
function _hideMapTooltip() {
  if (_mapTooltipEl) _mapTooltipEl.style.display = 'none';
  fullMapMobileHideZonePill();
}


// ══════════════════════════════════════════════════════════════
// ── MAP SEARCH (WMU units + Mapbox Geocoder for cities) ──
// ══════════════════════════════════════════════════════════════

let _searchDebounceTimer = null;
let _searchGeocodeCtrl   = null; // AbortController for in-flight geocode
let _searchCursorIdx     = -1;
let _searchLastItems     = [];

// Fast local city suggestions so partial searches like “kel” show Kelowna immediately.
const FULLMAP_LOCAL_CITIES = [
  // BC
  { prov:'BC', label:'Vancouver', sub:'City · Lower Mainland', coords:[-123.1207,49.2827] },
  { prov:'BC', label:'Victoria', sub:'City · Vancouver Island', coords:[-123.3656,48.4284] },
  { prov:'BC', label:'Kelowna', sub:'City · Okanagan', coords:[-119.4960,49.8880] },
  { prov:'BC', label:'Kamloops', sub:'City · Thompson', coords:[-120.3273,50.6745] },
  { prov:'BC', label:'Prince George', sub:'City · Omineca', coords:[-122.7497,53.9171] },
  { prov:'BC', label:'Williams Lake', sub:'City · Cariboo', coords:[-122.1418,52.1418] },
  { prov:'BC', label:'Smithers', sub:'City · Skeena', coords:[-127.1669,54.7825] },
  { prov:'BC', label:'Cranbrook', sub:'City · Kootenay', coords:[-115.7688,49.5096] },
  { prov:'BC', label:'Fort St. John', sub:'City · Peace', coords:[-120.8462,56.2524] },
  { prov:'BC', label:'Terrace', sub:'City · Skeena', coords:[-128.6035,54.5182] },
  { prov:'BC', label:'Prince Rupert', sub:'City · Skeena', coords:[-130.3208,54.3150] },
  { prov:'BC', label:'Penticton', sub:'City · Okanagan', coords:[-119.5937,49.4991] },
  { prov:'BC', label:'Nelson', sub:'City · Kootenay', coords:[-117.2948,49.4928] },
  { prov:'BC', label:'Revelstoke', sub:'City · Kootenay', coords:[-118.2023,50.9981] },
  { prov:'BC', label:'Merritt', sub:'City · Thompson', coords:[-120.7896,50.1123] },
  // AB
  { prov:'AB', label:'Calgary', sub:'City · Alberta', coords:[-114.0719,51.0447] },
  { prov:'AB', label:'Edmonton', sub:'City · Alberta', coords:[-113.4938,53.5461] },
  { prov:'AB', label:'Red Deer', sub:'City · Alberta', coords:[-113.8112,52.2681] },
  { prov:'AB', label:'Lethbridge', sub:'City · Alberta', coords:[-112.8451,49.6956] },
  { prov:'AB', label:'Medicine Hat', sub:'City · Alberta', coords:[-110.6766,50.0405] },
  { prov:'AB', label:'Grande Prairie', sub:'City · Alberta', coords:[-118.8027,55.1707] },
  { prov:'AB', label:'Fort McMurray', sub:'City · Alberta', coords:[-111.3803,56.7267] },
  { prov:'AB', label:'Hinton', sub:'Town · Alberta', coords:[-117.5857,53.4001] },
  { prov:'AB', label:'Jasper', sub:'Town · Alberta', coords:[-118.0814,52.8737] },
  { prov:'AB', label:'Banff', sub:'Town · Alberta', coords:[-115.5708,51.1784] },
];
function _searchRankText(label, q) {
  const l = String(label || '').toLowerCase();
  if (l === q) return 0;
  if (l.startsWith(q)) return 1;
  if (l.includes(q)) return 2;
  return 9;
}
function _searchDedupeAndLimit(items, limit = 3) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = `${item.type}|${String(item.label || '').toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}

// Called on every keystroke
function fullMapHandleSearch(val) {
  const clearBtn = document.getElementById('fullMapSearchClear');
  if (clearBtn) clearBtn.style.display = val ? 'block' : 'none';

  clearTimeout(_searchDebounceTimer);
  if (!val.trim()) { _searchHideResults(); return; }

  // Show loading immediately
  _searchShowLoading();

  _searchDebounceTimer = setTimeout(() => _searchRun(val.trim()), 280);
}


function _searchParseCoords(query) {
  const raw = String(query || '').trim();
  if (!raw) return null;

  // Supports: 50.123,-122.55 | 50.123 -122.55 | N50.123 W122.55 | 50.123N 122.55W
  let normalized = raw
    .replace(/,/g, ' ')
    .replace(/([NSEW])/gi, ' $1 ')
    .replace(/\s+/g, ' ')
    .trim();

  const nums = normalized.match(/[-+]?\d+(?:\.\d+)?/g);
  if (!nums || nums.length < 2) return null;

  let a = parseFloat(nums[0]);
  let b = parseFloat(nums[1]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;

  const upper = raw.toUpperCase();
  const hasS = /(^|[^A-Z])S\s*\d|\d\s*S/.test(upper);
  const hasW = /(^|[^A-Z])W\s*\d|\d\s*W/.test(upper);
  const hasE = /(^|[^A-Z])E\s*\d|\d\s*E/.test(upper);

  // Default to lat,lng because that is how hunters usually type coordinates.
  let lat = a;
  let lng = b;

  // If first number clearly looks like longitude and second like latitude, swap.
  if (Math.abs(a) > 90 && Math.abs(b) <= 90) {
    lng = a;
    lat = b;
  }

  if (hasS) lat = -Math.abs(lat);
  if (hasW) lng = -Math.abs(lng);
  if (hasE) lng = Math.abs(lng);

  // BC/AB are west longitudes. If someone types N50 W122 but the minus is missing,
  // keep western Canada searches useful by flipping positive longitudes over 90.
  if (!hasE && lng > 90) lng = -Math.abs(lng);

  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  const inCanadaWest = lat >= 48 && lat <= 61 && lng >= -140 && lng <= -109;
  if (!inCanadaWest) return null;

  return [lng, lat];
}

function _searchCoordLabel(coords) {
  return `${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}`;
}

function _searchRun(query) {
  const q = String(query || '').trim().toLowerCase();
  const ranked = [];

  function add(item, score) {
    ranked.push({ ...item, _score: score });
  }

  // ── 0. Coordinate search (local, instant) ──
  const coord = _searchParseCoords(query);
  if (coord) {
    add({
      type: 'coords',
      label: _searchCoordLabel(coord),
      sub: 'Coordinates',
      icon: '',
      badge: 'GPS',
      coords: coord,
      action: () => _searchFlyToCoords(coord, 12),
    }, 0);
  }

  // ── 1. Local city suggestions — fast partial matches like “kel” → Kelowna ──
  FULLMAP_LOCAL_CITIES
    .filter(c => !c.prov || c.prov === fullMapProvince)
    .map(c => ({ ...c, rank: _searchRankText(c.label, q) }))
    .filter(c => c.rank < 9)
    .sort((a,b) => a.rank - b.rank || a.label.localeCompare(b.label))
    .forEach(c => add({
      type: 'city',
      label: c.label,
      sub: c.sub,
      icon: '',
      badge: 'City',
      coords: c.coords,
      action: () => _searchFlyToCoords(c.coords, 9.5),
    }, 10 + c.rank));

  // ── 2. WMU unit search (local, instant) ──
  if (fullMapProvince === 'BC') {
    const geojson = (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON) ||
                    (typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON);
    if (geojson && geojson.features) {
      geojson.features.forEach(feat => {
        const id = feat.properties.wmu_id || '';
        const label = `WMU ${id}`;
        const rank = Math.min(_searchRankText(id, q), _searchRankText(label, q));
        if (rank < 9) {
          const hasDraws = (typeof DATA !== 'undefined') && DATA.some(r => bcMUMatchesPolygon(r.MU, id));
          add({
            type: 'wmu',
            label,
            sub: hasDraws ? 'Has draws in dataset' : 'No draws in current filter',
            icon: '',
            badge: 'WMU',
            action: () => _searchFlyToWMU_BC(id, feat),
          }, 20 + rank);
        }
      });
    }
  } else if (typeof AB_WMU_GEOJSON !== 'undefined' && AB_WMU_GEOJSON.features) {
    AB_WMU_GEOJSON.features.forEach(feat => {
      const id = String(feat.properties.WMUNIT_NUM || '');
      const name = feat.properties.WMUNIT_NAM || feat.properties.NAME || '';
      const label = `WMU ${id}${name ? ' — ' + name : ''}`;
      const rank = Math.min(_searchRankText(id, q), _searchRankText(label, q), name ? _searchRankText(name, q) : 9);
      if (rank < 9) {
        add({
          type: 'wmu',
          label,
          sub: 'Alberta Wildlife Management Unit',
          icon: '',
          badge: 'WMU',
          action: () => _searchFlyToWMU_AB(id, feat),
        }, 20 + rank);
      }
    });
  }

  ranked.sort((a,b) => a._score - b._score || String(a.label).localeCompare(String(b.label)));
  const localResults = _searchDedupeAndLimit(ranked, 3);

  // Show local matches immediately. If we already have 3, no need for a network geocode.
  _searchRenderResults(localResults);
  if (localResults.length >= 3) return;

  // ── 3. Mapbox fallback for cities/places not in the local list ──
  if (_searchGeocodeCtrl) { try { _searchGeocodeCtrl.abort(); } catch(e) {} }
  _searchGeocodeCtrl = new AbortController();

  const token = (typeof MAPBOX_TOKEN !== 'undefined') ? MAPBOX_TOKEN : '';
  if (!token) return;

  const bbox = fullMapProvince === 'BC'
    ? '-139.1,48.3,-114.0,60.1'
    : '-120.0,49.0,-110.0,60.0';

  const remaining = Math.max(1, 3 - localResults.length);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
    `?access_token=${token}&bbox=${bbox}&types=place,locality,neighborhood,poi&limit=${remaining}&country=CA`;

  fetch(url, { signal: _searchGeocodeCtrl.signal })
    .then(r => r.json())
    .then(data => {
      const geoResults = (data.features || []).map(f => ({
        type: 'city',
        label: f.text || f.place_name,
        sub: f.place_name,
        icon: '',
        badge: 'City',
        coords: f.center,
        action: () => _searchFlyToCoords(f.center, 10),
      }));
      _searchRenderResults(_searchDedupeAndLimit([...localResults, ...geoResults], 3));
    })
    .catch(err => {
      if (err.name !== 'AbortError') _searchRenderResults(localResults);
    });
}

function _searchRenderResults(items) {
  _searchLastItems = items;
  _searchCursorIdx = -1;
  const el = document.getElementById('fullMapSearchResults');
  if (!el) return;

  if (!items.length) {
    el.innerHTML = '<div class="fsr-no-results">No results found</div>';
  } else {
    el.innerHTML = items.map((item, i) => `
      <div class="fsr-item" data-idx="${i}" onmousedown="fullMapSearchSelect(${i})">
        <div style="flex:1;min-width:0">
          <div class="fsr-label" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.label}</div>
          <div class="fsr-sub" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.sub}</div>
        </div>
        <span class="fsr-badge ${item.type}">${item.badge}</span>
      </div>
    `).join('');
  }

  el.classList.add('visible');
}

function _searchShowLoading() {
  const el = document.getElementById('fullMapSearchResults');
  if (!el) return;
  el.innerHTML = '<div class="fsr-loading">Searching…</div>';
  el.classList.add('visible');
}

function _searchHideResults() {
  const el = document.getElementById('fullMapSearchResults');
  if (el) el.classList.remove('visible');
  _searchLastItems = [];
  _searchCursorIdx = -1;
}

function fullMapSearchSelect(idx) {
  const item = _searchLastItems[idx];
  if (!item) return;
  item.action();
  // Clear search box
  const input = document.getElementById('fullMapSearchInput');
  if (input) input.value = '';
  const clearBtn = document.getElementById('fullMapSearchClear');
  if (clearBtn) clearBtn.style.display = 'none';
  _searchHideResults();
}

function fullMapSearchKeydown(e) {
  const items = _searchLastItems;
  if (!items.length) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    _searchCursorIdx = Math.min(_searchCursorIdx + 1, items.length - 1);
    _searchHighlightCursor();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    _searchCursorIdx = Math.max(_searchCursorIdx - 1, 0);
    _searchHighlightCursor();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const idx = _searchCursorIdx >= 0 ? _searchCursorIdx : 0;
    fullMapSearchSelect(idx);
  } else if (e.key === 'Escape') {
    _searchHideResults();
  }
}

function _searchHighlightCursor() {
  const el = document.getElementById('fullMapSearchResults');
  if (!el) return;
  el.querySelectorAll('.fsr-item').forEach((row, i) => {
    row.style.background = i === _searchCursorIdx ? '#252525' : '';
  });
}

function fullMapSearchFocus() {
  const input = document.getElementById('fullMapSearchInput');
  if (input && input.value.trim()) fullMapHandleSearch(input.value);
}

function fullMapSearchBlur() {
  // Slight delay so onmousedown on result fires first
  setTimeout(_searchHideResults, 200);
}

function fullMapSearchClear() {
  const input = document.getElementById('fullMapSearchInput');
  if (input) { input.value = ''; input.focus(); }
  const clearBtn = document.getElementById('fullMapSearchClear');
  if (clearBtn) clearBtn.style.display = 'none';
  _searchHideResults();
}

// ── Fly to BC WMU ──
function _searchFlyToWMU_BC(id, feat) {
  if (!fullMapInstance) return;
  fullMapSelectWMU(id, false);
  _fullMapFitFeature(feat, 13);
}

// ── Fly to AB WMU ──
function _searchFlyToWMU_AB(id, feat) {
  if (!fullMapInstance) return;
  fullMapSelectWMU(id, false);
  _fullMapFitFeature(feat, 12);
}

// ── Fly to geocoded city ──
function _searchFlyToCoords(center, zoom) {
  if (!fullMapInstance) return;
  fullMapInstance.flyTo({ center, zoom, duration: 1000, essential: true });
}

// ── Toggle region ──
function _fullMapToggleRegion(id, featureId) {
  if (fullMapSelRegions.has(id)) {
    fullMapSelRegions.delete(id);
    if (featureId != null) fullMapInstance.setFeatureState({ source: _SRC_WMU, id: featureId }, { selected: false });
  } else {
    fullMapSelRegions.add(id);
    if (featureId != null) fullMapInstance.setFeatureState({ source: _SRC_WMU, id: featureId }, { selected: true });
  }
  fullMapSelectedWMU = fullMapSelRegions.size === 1 ? [...fullMapSelRegions][0] : '';
  if (!fullMapSelRegions.size) _removeLEHLayers();
  fullMapBuildSelectors();
  fullMapRefreshStyles();
  fullMapUpdateChips();
  if (fullMapSelRegions.size) fullMapShowResults(); else fullMapHideResults();
  fullMapUpdateLEHSpeciesDropdown();
  fullMapMobileRefresh();
}



// ── Main Map species / WMU selectors ─────────────────────────
function _fullMapNormSpecies(s) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}
function _fullMapDrawMatchesSpeciesName(species) {
  return !fullMapSelectedSpecies || _fullMapNormSpecies(species) === _fullMapNormSpecies(fullMapSelectedSpecies);
}
function _fullMapUnitMatchesSpecies(id) {
  if (fullMapProvince === 'BC') {
    if (typeof DATA === 'undefined') return false;
    if (!fullMapSelectedSpecies) return DATA.some(r => bcMUMatchesPolygon(r.MU, id));
    return DATA.some(r => bcMUMatchesPolygon(r.MU, id) && _fullMapDrawMatchesSpeciesName(r.Species));
  }
  if (typeof AB_DATA === 'undefined' || !AB_DATA.length || typeof buildABCards !== 'function') return false;
  const cards = buildABCards().filter(Boolean);
  if (!fullMapSelectedSpecies) return cards.some(c => abCardMatchesWMU(c, id));
  return cards.some(c => abCardMatchesWMU(c, id) && _fullMapDrawMatchesSpeciesName(c.species));
}
function _fullMapAllSpecies() {
  if (fullMapProvince === 'BC') {
    if (typeof DATA === 'undefined') return [];
    return [...new Set(DATA.map(r => r.Species).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  }
  if (typeof AB_DATA !== 'undefined' && AB_DATA.length) {
    if (typeof buildABCards === 'function') {
      return [...new Set(buildABCards().filter(Boolean).map(c => c.species).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    }
    return [...new Set(AB_DATA.map(r=>r.species).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  }
  return [];
}
function _fullMapAllWMUs() {
  if (fullMapProvince === 'BC') {
    const geojson = (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON) || (typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON);
    if (!geojson || !geojson.features || typeof DATA === 'undefined') return [];
    return geojson.features.map(f => f.properties.wmu_id || '').filter(id => id && DATA.some(r => bcMUMatchesPolygon(r.MU, id))).sort((a,b)=>{
      const pa=a.split('-').map(Number), pb=b.split('-').map(Number); return (pa[0]-pb[0]) || (pa[1]-pb[1]);
    });
  }
  if (typeof AB_WMU_GEOJSON === 'undefined') return [];
  const cards = (typeof AB_DATA !== 'undefined' && AB_DATA.length && typeof buildABCards === 'function') ? buildABCards().filter(Boolean) : [];
  return AB_WMU_GEOJSON.features.map(f => String(f.properties.WMUNIT_NUM || '')).filter(id => id && (!cards.length || cards.some(c => abCardMatchesWMU(c, id)))).sort((a,b)=>parseInt(a)-parseInt(b));
}
function fullMapBuildSelectors() {
  const speciesSel = document.getElementById('fullMapSpeciesSelect');
  if (speciesSel) {
    const species = _fullMapAllSpecies();
    speciesSel.innerHTML = '<option value="">All species</option>' + species.map(sp => `<option value="${String(sp).replace(/"/g,'&quot;')}">${sp}</option>`).join('');
    speciesSel.value = species.includes(fullMapSelectedSpecies) ? fullMapSelectedSpecies : '';
    if (fullMapSelectedSpecies && !species.includes(fullMapSelectedSpecies)) fullMapSelectedSpecies = '';
  }
}
function fullMapSetSpecies(species) {
  fullMapSelectedSpecies = String(species || '').trim();
  fullMapRefreshStyles();
  fullMapUpdateChips();
  if (fullMapSelRegions.size) fullMapShowResults(); else fullMapHideResults();
  fullMapUpdateLEHSpeciesDropdown();
  fullMapMobileRefresh();
}
function fullMapSelectWMU(id, zoomTo) {
  id = String(id || '').trim();
  fullMapSelectedWMU = id;
  fullMapSelRegions.clear();
  if (!id) {
    fullMapRefreshStyles();
    fullMapUpdateChips();
    fullMapHideResults();
    fullMapBuildSelectors();
    return;
  }
  fullMapSelRegions.add(id);
  fullMapRefreshStyles();
  fullMapUpdateChips();
  fullMapBuildSelectors();
  fullMapShowResults();
  fullMapUpdateLEHSpeciesDropdown();
  if (zoomTo) {
    const geojson = fullMapProvince === 'BC'
      ? ((typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON) || (typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON))
      : (typeof AB_WMU_GEOJSON !== 'undefined' ? AB_WMU_GEOJSON : null);
    const feat = geojson && geojson.features ? geojson.features.find(f => (fullMapProvince === 'BC' ? (f.properties.wmu_id || '') : String(f.properties.WMUNIT_NUM || '')) === id) : null;
    if (feat) _fullMapFitFeature(feat, fullMapProvince === 'BC' ? 13 : 12);
  }
  fullMapMobileRefresh();
}
function _fullMapFitFeature(feat, maxZoom) {
  if (!fullMapInstance || !feat || typeof turf === 'undefined') return;
  const bbox = turf.bbox(feat);
  fullMapInstance.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 80, duration: 900, maxZoom });
}
function fullMapLocateUser() {
  const btn = document.getElementById('fullMapLocateBtn');
  if (!navigator.geolocation) { alert('Location is not available in this browser.'); return; }
  if (btn) { btn.disabled = true; btn.textContent = 'Locating…'; }
  navigator.geolocation.getCurrentPosition(pos => {
    if (btn) { btn.disabled = false; btn.textContent = 'Locate'; }
    const lng = pos.coords.longitude;
    const lat = pos.coords.latitude;
    const accuracy = pos.coords.accuracy || 0;
    if (!fullMapInstance) return;
    const el = document.createElement('div');
    el.className = 'fullmap-user-location-dot';
    if (_fullMapUserMarker) _fullMapUserMarker.remove();
    _fullMapUserMarker = new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat([lng, lat]).addTo(fullMapInstance);
    const circle = (typeof turf !== 'undefined' && turf.circle) ? turf.circle([lng, lat], Math.max(accuracy, 25) / 1000, { steps: 48, units: 'kilometers' }) : null;
    if (circle) {
      if (fullMapInstance.getSource('user-accuracy-src')) fullMapInstance.getSource('user-accuracy-src').setData(circle);
      else {
        fullMapInstance.addSource('user-accuracy-src', { type: 'geojson', data: circle });
        fullMapInstance.addLayer({ id: 'user-accuracy-fill', type: 'fill', source: 'user-accuracy-src', paint: { 'fill-color': '#60a5fa', 'fill-opacity': 0.14 } });
        fullMapInstance.addLayer({ id: 'user-accuracy-line', type: 'line', source: 'user-accuracy-src', paint: { 'line-color': '#60a5fa', 'line-width': 1.5, 'line-opacity': 0.65 } });
      }
    }
    fullMapInstance.flyTo({ center: [lng, lat], zoom: 11, duration: 1000, essential: true });
  }, err => {
    if (btn) { btn.disabled = false; btn.textContent = 'Locate'; }
    alert(err && err.code === 1 ? 'Location permission is off. Enable location access in your browser to use this.' : 'Could not get your location right now.');
  }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
}

// ── Refresh all selection states ──
function fullMapRefreshStyles() {
  if (!fullMapInstance || !fullMapInstance.getSource(_SRC_WMU)) return;
  const geojson = fullMapProvince === 'BC' ? (bcWmuGeoJSON || BC_WMU_GEOJSON) : AB_WMU_GEOJSON;
  geojson.features.forEach((feat, i) => {
    const id = fullMapProvince === 'BC' ? (feat.properties.wmu_id||'') : String(feat.properties.WMUNIT_NUM||'');
    fullMapInstance.setFeatureState({ source: _SRC_WMU, id: i }, {
      selected: fullMapSelRegions.has(id),
      matchesSpecies: _fullMapUnitMatchesSpecies(id)
    });
  });
}

// ── Tile switcher ──
function fullMapSetTile(type) {
  if (!_MB_STYLES[type] || !fullMapInstance) return;
  _fullMapStyle = type;
  _syncTileButtons();
  fullMapMobileRefresh();
  const center  = fullMapInstance.getCenter();
  const zoom    = fullMapInstance.getZoom();
  const bearing = fullMapInstance.getBearing();
  const pitch   = fullMapInstance.getPitch();
  fullMapInstance.setStyle(_MB_STYLES[type]);
  fullMapInstance.once('style.load', () => {
    _reAddWMULayers();
    if (_fullMapLEHVisible) _reAddLEHLayer();

    // Keep the map flat unless the user explicitly turned 3D on.
    if (_fullMapTerrain3D) {
      _applyTerrain(true);
      fullMapInstance.jumpTo({ center, zoom, bearing, pitch });
    } else {
      fullMapInstance.setTerrain(null);
      if (fullMapInstance.getLayer('sky')) fullMapInstance.removeLayer('sky');
      fullMapInstance.jumpTo({ center, zoom, bearing: 0, pitch: 0 });
    }
    const btn = document.getElementById('fullMap3DBtn');
    if (btn) { btn.classList.toggle('active', _fullMapTerrain3D); btn.textContent = _fullMapTerrain3D ? '3D ✓' : '3D'; }
  });
}

function _syncTileButtons() {
  ['streets','satellite','topo'].forEach(t => {
    const btn = document.getElementById('fullMapTile_' + t);
    if (btn) btn.classList.toggle('active', t === _fullMapStyle);
  });
}

function _reAddWMULayers() {
  if (!fullMapInstance) return;
  const geojson = fullMapProvince === 'BC' ? (bcWmuGeoJSON||BC_WMU_GEOJSON) : AB_WMU_GEOJSON;
  if (!fullMapInstance.getSource(_SRC_WMU)) {
    fullMapInstance.addSource(_SRC_WMU, { type: 'geojson', data: geojson, generateId: true });
  }

  const colorExpr = fullMapProvince === 'BC'
    ? ['case', ['boolean',['feature-state','selected'],false], '#4ade80',
        ['match', ['slice',['get','wmu_id'],0,['index-of','-',['get','wmu_id']]],
          ...Object.entries(_BC_REGION_COLORS).flatMap(([k,v])=>[k,v]), '#555555']]
    : ['case', ['boolean',['feature-state','selected'],false], '#4ade80',
        ['match', ['to-string',['floor',['/',['to-number',['get','WMUNIT_NUM'],0],100]]],
          '1','#4a8f9a','2','#6aab8a','3','#9bc47a','4','#c49a45','5','#c07838','6','#8a7fd4','#5a8fa8']];

  if (!fullMapInstance.getLayer(_LYR_WMU_FILL)) {
    fullMapInstance.addLayer({
      id: _LYR_WMU_FILL, type: 'fill', source: _SRC_WMU,
      paint: { 'fill-color': colorExpr, 'fill-opacity': ['case',['boolean',['feature-state','selected'],false],0.75,['boolean',['feature-state','hovered'],false],0.5,['boolean',['feature-state','matchesSpecies'],false],0.44,0.08] }
    });
  }
  if (!fullMapInstance.getLayer(_LYR_WMU_LINE)) {
    fullMapInstance.addLayer({
      id: _LYR_WMU_LINE, type: 'line', source: _SRC_WMU,
      paint: { 'line-color':['case',['boolean',['feature-state','selected'],false],'#ffffff','#1a2a1a'], 'line-width':['case',['boolean',['feature-state','selected'],false],2.5,0.7], 'line-opacity':0.8 }
    });
  }

  // Restore feature states
  geojson.features.forEach((feat, i) => {
    const id = fullMapProvince === 'BC' ? (feat.properties.wmu_id||'') : String(feat.properties.WMUNIT_NUM||'');
    const hasDraws = fullMapProvince === 'BC'
      ? DATA.some(r => bcMUMatchesPolygon(r.MU, id))
      : (() => { const c = buildABCards().filter(x=>x); return c.some(x => abCardMatchesWMU(x,id)); })();
    const matchesSpecies = _fullMapUnitMatchesSpecies(id);
    fullMapInstance.setFeatureState({ source: _SRC_WMU, id: i }, { hasDraws, matchesSpecies, selected: fullMapSelRegions.has(id), hovered: false });
  });
}

// ── 3D Terrain ──
function fullMapToggle3D() {
  _fullMapTerrain3D = !_fullMapTerrain3D;
  _applyTerrain(_fullMapTerrain3D);
  const btn = document.getElementById('fullMap3DBtn');
  if (btn) { btn.classList.toggle('active', _fullMapTerrain3D); btn.textContent = _fullMapTerrain3D ? '3D ✓' : '3D'; }
  if (typeof fullMapSyncBasemapPanel === 'function') fullMapSyncBasemapPanel();
  fullMapMobileRefresh();
}


function _applyTerrain(on) {
  if (!fullMapInstance) return;
  if (on) {
    // mapbox-terrain-dem-v1: 512px tiles, maxzoom 14 — highest quality Mapbox DEM
    if (!fullMapInstance.getSource('mapbox-dem')) {
      fullMapInstance.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14
      });
    }
    // exaggeration 1.6 makes BC/AB mountains dramatic but not absurd
    fullMapInstance.setTerrain({ source: 'mapbox-dem', exaggeration: 1.6 });
    // Add sky layer for atmosphere if not already present (satellite + topo)
    if (!fullMapInstance.getLayer('sky')) {
      fullMapInstance.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 90.0],
          'sky-atmosphere-sun-intensity': 15
        }
      });
    }
    fullMapInstance.easeTo({ pitch: 58, bearing: -12, duration: 1000 });
  } else {
    fullMapInstance.setTerrain(null);
    // Remove sky layer when terrain is off
    if (fullMapInstance.getLayer('sky')) fullMapInstance.removeLayer('sky');
    fullMapInstance.easeTo({ pitch: 0, bearing: 0, duration: 700 });
  }
}

// ── LEH overlay ──
function fullMapSetLEHSpecies(species) {
  _fullMapLEHSpecies = _lehNormalizeSpecies(species);
  _updateLEHBtn();
  fullMapMobileRefresh();
  if (!_fullMapLEHSpecies) {
    _removeLEHLayers();
    return;
  }
  fullMapShowLEHForMUs([...fullMapSelRegions]);
}

function _lehDisplaySpeciesName(species) {
  return String(species || '').trim();
}
function _lehSpeciesAvailableFromDraws(mus) {
  const out = new Set();
  if (typeof DATA === 'undefined') return [];
  const selected = new Set((mus || []).map(mu => _lehCleanMU(mu)));
  for (const r of DATA) {
    if (!r || !r.MU || !r.Species) continue;
    if (selected.has(_lehCleanMU(r.MU))) out.add(_lehDisplaySpeciesName(r.Species));
  }
  return [...out].sort((a,b) => a.localeCompare(b));
}
function _lehZoneTypeForSpecies(species) {
  const s = String(species || '').trim().toUpperCase();
  if (!s) return '';
  // LEH polygon data stores these as broad zone-map types, while the app's
  // hunt cards keep the synopsis species separate.
  if (s.includes('BIGHORN') || s.includes('THINHORN') || s.includes('SHEEP')) return 'MOUNTAIN SHEEP';
  if (s.includes('ROOSEVELT') || s.includes('ROCKY') || s === 'ELK' || s.includes(' ELK')) return 'ELK';
  return _lehNormalizeSpecies(s);
}
function _titleCaseSpecies(sp) {
  return String(sp || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function fullMapUpdateLEHSpeciesDropdown() {
  const sel = document.getElementById('fullMapLEHSpecies');
  const wrap = document.getElementById('fullMapLEHSpeciesWrap');

  function hideAndClear() {
    if (wrap) wrap.style.display = 'none';
    if (sel) { sel.innerHTML = '<option value="">Choose species</option>'; sel.value = ''; sel.disabled = true; }
    _fullMapLEHSpecies = '';
    _removeLEHLayers();
    _updateLEHBtn();
  }

  if (fullMapProvince !== 'BC') { hideAndClear(); return; }

  const mus = [...fullMapSelRegions];
  if (!mus.length) { hideAndClear(); return; }

  const species = _lehSpeciesAvailableFromDraws(mus);
  if (!species.length) { hideAndClear(); return; }

  const normalizedSpecies = species.map(sp => _lehNormalizeSpecies(sp));
  const selectedNorm = _lehNormalizeSpecies(fullMapSelectedSpecies || '');

  // Species-first flow: if a species is already selected and exists in this WMU,
  // automatically show its LEH zones. WMU-first flow: show a dropdown limited
  // to species that actually exist in the selected WMU(s).
  let current = '';
  if (selectedNorm && normalizedSpecies.includes(selectedNorm)) current = selectedNorm;
  else if (normalizedSpecies.includes(_fullMapLEHSpecies)) current = _fullMapLEHSpecies;

  _fullMapLEHSpecies = current;

  if (sel) {
    sel.disabled = false;
    sel.innerHTML = '<option value="">Choose species</option>' +
      species.map(sp => {
        const val = _lehNormalizeSpecies(sp);
        return `<option value="${val}">${_titleCaseSpecies(sp)}</option>`;
      }).join('');
    sel.value = current;
  }
  if (wrap) wrap.style.display = 'flex';

  if (!current) _removeLEHLayers();
  else fullMapShowLEHForMUs(mus);
  _updateLEHBtn();
}

function fullMapShowLEHForMUs(muSet) {
  if (!fullMapInstance) return;
  const mus = Array.isArray(muSet) ? muSet : [...muSet];
  _removeLEHLayers();
  if (mus.length === 0 || fullMapProvince !== 'BC') { _updateLEHBtn(); return; }
  if (!_fullMapLEHSpecies) { _updateLEHBtn(); return; }
  _fullMapLEHLoading = true;

  _lehGetZones().then(data => {
    _fullMapLEHLoading = false;
    const zones   = data.zones    || data;
    const muIndex = data.mu_index || {};
    const zoneIds = new Set();
    for (const mu of mus) {
      _lehZoneIdsForMU(muIndex, mu).forEach(id => zoneIds.add(id));
    }
    const features = [...zoneIds]
      .filter(id => zones[id] && _lehNormalizeSpecies(zones[id].zt) === _lehZoneTypeForSpecies(_fullMapLEHSpecies))
      .map(id => {
        const z = zones[id];
        const zoneLetter = _lehZoneLetterFromId(id);
        const label = _lehFormatZoneLabel(z.lb, z.mu, zoneLetter);
        return { type:'Feature', id, properties:{ id, label, zt:_lehNormalizeSpecies(z.zt), mu:z.mu, zoneLetter }, geometry:z.g };
      });
    if (!features.length) { _updateLEHBtn(); return; }

    const geojson = { type:'FeatureCollection', features };
    if (!fullMapInstance.getSource(_SRC_LEH)) {
      fullMapInstance.addSource(_SRC_LEH, { type:'geojson', data:geojson });
    } else {
      fullMapInstance.getSource(_SRC_LEH).setData(geojson);
    }

    const colorMatch = '#f0b429'; // V9: all LEH zones use gold outlines; species is already filtered

    const lehFillOpacityExpr = ['case',
      ['boolean', ['feature-state', 'active'], false], 0.30,
      ['boolean', ['feature-state', 'hovered'], false], 0.24,
      _fullMapLEHOpacity
    ];
    const lehLineColorExpr = ['case',
      ['boolean', ['feature-state', 'active'], false], '#ffffff',
      ['boolean', ['feature-state', 'hovered'], false], '#ffffff',
      '#f0b429'
    ];
    const lehLineWidthExpr = ['case',
      ['boolean', ['feature-state', 'active'], false], 7.0,
      ['boolean', ['feature-state', 'hovered'], false], 6.2,
      2.1
    ];

    if (!fullMapInstance.getLayer(_LYR_LEH_FILL)) {
      fullMapInstance.addLayer({ id:_LYR_LEH_FILL, type:'fill', source:_SRC_LEH,
        paint:{ 'fill-color':colorMatch, 'fill-opacity':lehFillOpacityExpr }
      }, _LYR_WMU_LINE);
    } else {
      fullMapInstance.setPaintProperty(_LYR_LEH_FILL, 'fill-color', colorMatch);
      fullMapInstance.setPaintProperty(_LYR_LEH_FILL, 'fill-opacity', lehFillOpacityExpr);
    }
    if (!fullMapInstance.getLayer(_LYR_LEH_LINE)) {
      fullMapInstance.addLayer({ id:_LYR_LEH_LINE, type:'line', source:_SRC_LEH,
        paint:{ 'line-color':lehLineColorExpr, 'line-width':lehLineWidthExpr, 'line-opacity':1.0 }
      });
    } else {
      fullMapInstance.setPaintProperty(_LYR_LEH_LINE, 'line-color', lehLineColorExpr);
      fullMapInstance.setPaintProperty(_LYR_LEH_LINE, 'line-width', lehLineWidthExpr);
      fullMapInstance.setPaintProperty(_LYR_LEH_LINE, 'line-opacity', 1.0);
    }


    // Dedicated hover/tap layers. These sit above the normal LEH overlay and use a
    // filter instead of feature-state, so the hovered zone visibly illuminates even
    // when a selected WMU fill is underneath it.
    const emptyHoverFilter = ['==', ['get', 'id'], '__none__'];
    if (!fullMapInstance.getLayer(_LYR_LEH_HOVER_FILL)) {
      fullMapInstance.addLayer({ id:_LYR_LEH_HOVER_FILL, type:'fill', source:_SRC_LEH,
        filter: emptyHoverFilter,
        paint:{ 'fill-color':'#f0b429', 'fill-opacity':0.46 }
      });
    }
    if (!fullMapInstance.getLayer(_LYR_LEH_HOVER_LINE)) {
      fullMapInstance.addLayer({ id:_LYR_LEH_HOVER_LINE, type:'line', source:_SRC_LEH,
        filter: emptyHoverFilter,
        paint:{ 'line-color':'#ffffff', 'line-width':7.5, 'line-opacity':1.0 }
      });
    }
    _setLEHHoverFilter(_activeLEH);

    if (!fullMapInstance._lehTooltipBound) {
      fullMapInstance._lehTooltipBound = true;
      fullMapInstance.on('mouseenter', _LYR_LEH_FILL, e => {
        fullMapInstance.getCanvas().style.cursor = 'crosshair';
        const f = (e.features && e.features[0]) || _getTopLEHFeatureAtPoint(e);
        if (f) { _setLEHHoverFromFeature(f); _showLEHMapTooltip(e, f); }
      });
      fullMapInstance.on('mousemove', _LYR_LEH_FILL, e => {
        fullMapInstance.getCanvas().style.cursor = 'crosshair';
        const f = (e.features && e.features[0]) || _getTopLEHFeatureAtPoint(e);
        if (f) { _setLEHHoverFromFeature(f); _showLEHMapTooltip(e, f); }
      });
      fullMapInstance.on('click', _LYR_LEH_FILL, e => {
        const wmuHit = _getTopWMUFeatureAtPoint(e);
        if (wmuHit) {
          const id = fullMapProvince === 'BC' ? (wmuHit.properties.wmu_id || '') : String(wmuHit.properties.WMUNIT_NUM || '');
          if (id) {
            if (e.originalEvent) e.originalEvent._hsWMUToggledFromLEH = true;
            _fullMapToggleRegion(id, wmuHit.id);
            return;
          }
        }
        const f = (e.features && e.features[0]) || _getTopLEHFeatureAtPoint(e);
        if (f) { _setLEHActiveFromFeature(f); _showLEHMapTooltip(e, f); }
      });
      fullMapInstance.on('mouseleave', _LYR_LEH_FILL, () => { fullMapInstance.getCanvas().style.cursor = ''; _clearLEHHover(); _hideMapTooltip(); });
    }

    _fullMapLEHVisible = true;
    _updateLEHBtn();
  }).catch(err => { _fullMapLEHLoading = false; console.error('[LEH]', err); _updateLEHBtn(); });
}

function _removeLEHLayers() {
  if (!fullMapInstance) return;
  [_LYR_LEH_HOVER_LINE, _LYR_LEH_HOVER_FILL, _LYR_LEH_LINE, _LYR_LEH_FILL].forEach(id => { if (fullMapInstance.getLayer(id)) fullMapInstance.removeLayer(id); });
  if (fullMapInstance.getSource(_SRC_LEH)) fullMapInstance.removeSource(_SRC_LEH);
  _fullMapLEHVisible = false;
  _hoveredLEH = null;
  _activeLEH = null;
}

function _reAddLEHLayer() { fullMapShowLEHForMUs([...fullMapSelRegions]); }

function fullMapToggleLEH() {
  if (_fullMapLEHLoading) return;
  if (_fullMapLEHVisible) { _removeLEHLayers(); _updateLEHBtn(); return; }
  if (!_fullMapLEHSpecies) {
    const sel = document.getElementById('fullMapLEHSpecies');
    if (sel && !sel.disabled) sel.focus();
    _updateLEHBtn();
    return;
  }
  fullMapShowLEHForMUs([...fullMapSelRegions]);
}

function fullMapSetLEHOpacity(val) {
  // Slider left = fully visible, right = completely invisible
  const sliderVal = parseFloat(val);
  _fullMapWMUOpacity = 1 - sliderVal;
  _fullMapLEHOpacity = (1 - sliderVal) * 0.035; // V9: tiny normal fill, outlines remain visible

  if (fullMapInstance && fullMapInstance.getLayer(_LYR_WMU_FILL)) {
    const m = _fullMapWMUOpacity;
    fullMapInstance.setPaintProperty(_LYR_WMU_FILL, 'fill-opacity', ['case',
      ['boolean', ['feature-state', 'selected'], false], 0.75 * m,
      ['boolean', ['feature-state', 'hovered'],  false], 0.5  * m,
      ['boolean', ['feature-state', 'matchesSpecies'],  false], 0.44 * m,
      0.08 * m
    ]);
    fullMapInstance.setPaintProperty(_LYR_WMU_LINE, 'line-opacity', 0.8 * m);
  }

  if (fullMapInstance && fullMapInstance.getLayer(_LYR_LEH_FILL)) {
    fullMapInstance.setPaintProperty(_LYR_LEH_FILL, 'fill-opacity', ['case', ['boolean', ['feature-state', 'active'], false], 0.30, ['boolean', ['feature-state', 'hovered'], false], 0.24, _fullMapLEHOpacity]);
  }
}

function _updateLEHBtn() {
  const btn = document.getElementById('fullMapLEHToggle');
  const sel = document.getElementById('fullMapLEHSpecies');
  if (btn) {
    btn.classList.toggle('active', _fullMapLEHVisible);
    btn.disabled = fullMapProvince !== 'BC' || !fullMapSelRegions.size || !_fullMapLEHSpecies;
    btn.textContent = _fullMapLEHVisible ? 'LEH Zones ✓' : 'LEH Zones';
  }
  if (sel) sel.value = _fullMapLEHSpecies || '';
  fullMapMobileSyncToolState();
}

// ── Chips row ──
function fullMapEscapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function fullMapJsArg(s) { return JSON.stringify(String(s == null ? '' : s)); }
function fullMapUpdateChips() {
  const row = document.getElementById('fullMapChipsRow');
  if (!row) return;
  const regions = [...fullMapSelRegions];
  if (!regions.length && !fullMapSelectedSpecies) {
    row.innerHTML = '';
    row.style.display = 'none';
    return;
  }
  const pieces = [];
  if (fullMapSelectedSpecies) {
    pieces.push(`<span class="fullmap-selected-chip species-chip">${fullMapEscapeHtml(fullMapSelectedSpecies)}</span>`);
  }
  regions.forEach(id => {
    pieces.push(`<button type="button" class="fullmap-selected-chip wmu-chip" onclick="event.stopPropagation();fullMapRemoveRegion(${fullMapJsArg(id)})">WMU ${fullMapEscapeHtml(id)} <span aria-hidden="true">×</span></button>`);
  });
  row.innerHTML = pieces.join('');
  row.style.display = 'flex';
}

function fullMapRemoveRegion(id) {
  fullMapSelRegions.delete(id);
  fullMapSelectedWMU = fullMapSelRegions.size === 1 ? [...fullMapSelRegions][0] : '';
  fullMapBuildSelectors();
  fullMapRefreshStyles();
  fullMapUpdateChips();
  if (!fullMapSelRegions.size) fullMapHideResults(); else fullMapShowResults();
  fullMapUpdateLEHSpeciesDropdown();
  fullMapMobileRefresh();
}


function fullMapClearAll() {
  fullMapSelRegions.clear();
  fullMapSelectedWMU = '';
  fullMapSelectedSpecies = '';
  const sp = document.getElementById('fullMapSpeciesSelect');
  if (sp) sp.value = '';
  const search = document.getElementById('fullMapSearchInput');
  if (search) search.value = '';
  _removeLEHLayers();
  fullMapBuildSelectors();
  fullMapRefreshStyles();
  fullMapUpdateChips();
  fullMapHideResults();
  fullMapUpdateLEHSpeciesDropdown();
  fullMapMobileRefresh();
}


// ── Results drawer ──
function fullMapHideResults() {
  const d = document.getElementById('fullMapResultsDrawer');
  if (d) { d.style.display = 'none'; d.classList.remove('is-collapsed'); }
  setTimeout(() => fullMapInstance && fullMapInstance.resize(), 50);
  fullMapMobileRefresh();
}


function fullMapCloseResults() {
  fullMapSelRegions.clear();
  fullMapSelectedWMU = '';
  fullMapRefreshStyles(); fullMapUpdateChips(); fullMapHideResults(); fullMapUpdateLEHSpeciesDropdown();
}

function fullMapShowResults() {
  const drawer = document.getElementById('fullMapResultsDrawer');
  if (!drawer) return;
  const regions = [...fullMapSelRegions];
  let cards;

  if (fullMapProvince === 'BC') {
    cards = DATA.filter(r => regions.some(id => bcMUMatchesPolygon(r.MU, id)) && _fullMapDrawMatchesSpeciesName(r.Species)).map(r => {
      const isNewDraw = (typeof isNewSynopsisHunt === 'function') ? isNewSynopsisHunt(r) : !!r.is_new;
      const rawOdds = parseFloat(r['%']);
      return {
        _type:'BC', species:r.Species, mu:r.MU, code:r.Code, zone:r.Zone || '',
        odds:(!isNewDraw && isFinite(rawOdds)) ? rawOdds : null, isNew: isNewDraw,
        success:computeHarvestAvg(r.yearly_fill_rates),
        season:r.Season||'', class:r.Class||''
      };
    });
  } else {
    const allCards = buildABCards().filter(c=>c!==null);
    cards = allCards.filter(c => regions.some(id => abCardMatchesWMU(c,id)) && _fullMapDrawMatchesSpeciesName(c.species)).map(c => ({
      _type:'AB', species:c.species, mu:c.wmu, code:c.draw,
      odds:c.personalOdds!==null?c.personalOdds:c.latestOdds,
      success:c.harvestSuccess, season:c.season||'', class:c.draw||''
    }));
  }

  if (fullMapSortMode==='odds')        cards.sort((a,b)=>b.odds-a.odds);
  else if (fullMapSortMode==='success') cards.sort((a,b)=>(b.success??-1)-(a.success??-1));

  const grid  = document.getElementById('fullMapResultsGrid');
  const title = document.getElementById('fullMapResultsTitle');
  const count = document.getElementById('fullMapResultsCount');
  if (title) title.textContent = `${fullMapSelectedSpecies ? fullMapSelectedSpecies + ' · ' : ''}${regions.length===1?'WMU '+regions[0]:regions.length+' WMUs'}`;
  if (count) count.textContent = `${cards.length.toLocaleString()} draw${cards.length!==1?'s':''}`;

  if (grid) {
    grid.innerHTML = cards.length === 0
      ? '<div class="fm-no-results">No draws found for this species / WMU combination.</div>'
      : cards.map(c => {
          const cls = c.isNew ? 'new' : (fullMapProvince==='BC' ? ((c.odds||0)>=5?'green':(c.odds||0)>=1?'yellow':'red') : ((c.odds||0)>=20?'green':(c.odds||0)>=5?'yellow':'red'));
          const oddsStr = c.isNew ? 'NEW' : (c.odds!=null ? (((c.odds > 0 && c.odds.toFixed(1)==='0.0') ? c.odds.toFixed(2) : (c.odds>=10?Math.round(c.odds):c.odds.toFixed(1))) + '%') : 'No data');
          const succStr = c.success!=null?((c.success>=10?Math.round(c.success):c.success.toFixed(1))+'%'):null;
          const succCls = c.success!=null?(c.success>=(fullMapProvince==='BC'?40:50)?'fill-high':c.success>=(fullMapProvince==='BC'?20:25)?'fill-mid':'fill-low'):'fill-none';
          const click = c._type==='BC'?`openBCDrawDetailFromMap('${c.code}','${c.mu}')`:`openABDrawDetailFromMap('${c.code}','${c.mu}')`;
          const areaLabel = c._type === 'BC' ? (c.zone ? `Zone ${c.zone}` : 'Zone —') : (c.code || 'Draw');
          return `<div class="fm-card ${cls}" onclick="${click}" style="cursor:pointer">
            <div class="fm-card-top"><div><div class="fm-card-species">${c.species}</div><div class="fm-card-meta">WMU ${c.mu}${c.class?' · '+c.class:''}</div></div><div class="fm-card-odds ${cls}">${oddsStr}</div></div>
            <div class="fm-card-bottom"><span class="fm-card-code">${areaLabel}</span>${succStr?`<span class="fm-card-success ${succCls}">${succStr} success</span>`:`<span class="fm-card-success fill-none">No success data</span>`}${c.season&&c.season!=='1'?`<span class="fm-card-code">${c.season}</span>`:''}</div>
          </div>`;
        }).join('');
  }

  drawer.style.display = 'flex';
  drawer.style.flexDirection = 'column';
  if (fullMapMobileIsNarrow()) drawer.classList.add('is-collapsed');
  setTimeout(() => fullMapInstance && fullMapInstance.resize(), 80);
  fullMapMobileRefresh();
}


function fullMapSetSort(mode, btn) {
  if (mode !== 'odds' && mode !== 'success') mode = 'odds';
  fullMapSortMode = mode;
  document.querySelectorAll('.fullmap-sort-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (fullMapSelRegions.size) {
    fullMapShowResults();
    // On mobile, changing the sort from inside the Cards drawer should not collapse/close it.
    const drawer = document.getElementById('fullMapResultsDrawer');
    if (drawer && fullMapMobileIsNarrow()) drawer.classList.remove('is-collapsed');
  }
}

function fullMapGoToDraws() {
  if (fullMapProvince === 'BC') {
    selMUsFull.clear(); fullMapSelRegions.forEach(id => selMUsFull.add(id));
    selMUs.clear(); fullMapSelRegions.forEach(id => { const r=parseInt((id||'').split('-')[0]); if(!isNaN(r)) selMUs.add(r); });
    showPage('draws'); bcUpdateMapStyles();
  } else {
    abSelWMU.clear(); fullMapSelRegions.forEach(id => abSelWMU.add(id)); showPage('abDraws');
  }
}

// ── Fullscreen ──
let _fullMapIsFullscreen = false;
let _fullMapCollapseBtn  = null;

function fullMapToggleFullscreen() {
  const page = document.querySelector('.fullmap-page');
  const btn  = document.getElementById('fullMapExpandBtn');
  if (!page) return;
  _fullMapIsFullscreen = !_fullMapIsFullscreen;

  if (_fullMapIsFullscreen) {
    page.classList.add('is-fullscreen');
    document.body.style.overflow = 'hidden';
    if (btn) { btn.title = 'Collapse map'; btn.textContent = '⛶'; }

    // Inject a fixed collapse button so it's always visible in fullscreen
    if (!_fullMapCollapseBtn) {
      _fullMapCollapseBtn = document.createElement('button');
      _fullMapCollapseBtn.id = 'fullMapCollapseFloating';
      _fullMapCollapseBtn.innerHTML = '✕&nbsp;&nbsp;Collapse';
      _fullMapCollapseBtn.title = 'Exit fullscreen (Esc)';
      _fullMapCollapseBtn.onclick = fullMapToggleFullscreen;
      _fullMapCollapseBtn.style.cssText = [
        'position:fixed',
        'top:14px',
        'right:14px',
        'z-index:10100',
        'background:rgba(20,20,20,0.92)',
        'color:#e8e8e8',
        'border:1px solid rgba(255,255,255,0.18)',
        'border-radius:8px',
        'padding:7px 16px 7px 12px',
        'font-size:12px',
        'font-weight:600',
        'cursor:pointer',
        'letter-spacing:0.02em',
        'box-shadow:0 4px 18px rgba(0,0,0,0.55)',
        'backdrop-filter:blur(6px)',
        'transition:background 0.15s,border-color 0.15s',
      ].join(';');
      _fullMapCollapseBtn.addEventListener('mouseenter', () => {
        _fullMapCollapseBtn.style.background = 'rgba(74,222,128,0.18)';
        _fullMapCollapseBtn.style.borderColor = 'rgba(74,222,128,0.55)';
        _fullMapCollapseBtn.style.color = '#4ade80';
      });
      _fullMapCollapseBtn.addEventListener('mouseleave', () => {
        _fullMapCollapseBtn.style.background = 'rgba(20,20,20,0.92)';
        _fullMapCollapseBtn.style.borderColor = 'rgba(255,255,255,0.18)';
        _fullMapCollapseBtn.style.color = '#e8e8e8';
      });
      document.body.appendChild(_fullMapCollapseBtn);
    }
    _fullMapCollapseBtn.style.display = 'block';

  } else {
    page.classList.remove('is-fullscreen');
    document.body.style.overflow = '';
    if (btn) { btn.title = 'Expand map'; btn.textContent = '⛶'; }
    if (_fullMapCollapseBtn) _fullMapCollapseBtn.style.display = 'none';
  }
  setTimeout(() => fullMapInstance && fullMapInstance.resize(), 50);
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && _fullMapIsFullscreen) fullMapToggleFullscreen(); });



// ══════════════════════════════════════════════════════════════
// ── BC DRAW CARD MINI-MAP  (real LEH zone polygons)
// ══════════════════════════════════════════════════════════════
//
// Usage: call bcCardMapInit(containerId, mu, zone, speciesType) once the
// card's map <div> is visible.
//
//   containerId  — id of the <div> to render into (must have a fixed height)
//   mu           — MU string exactly as in the draw data, e.g. "6-20"
//   zone         — zone letter, e.g. "A"  (pass "" or null if no sub-zone)
//   speciesType  — "MOUNTAIN SHEEP" | "MOUNTAIN GOAT" | "MOOSE" | "ELK" |
//                  "CARIBOU" | "BLACK BEAR" | "MULE DEER" | "WHITE-TAILED DEER"
//                  | "BISON" | "TURKEY"
//
// The function is safe to call multiple times (idempotent per container).

// Species name → single-letter zone-ID prefix used in leh_zones.json
const _LEH_SPECIES_PREFIX = {
  'MOUNTAIN SHEEP':    'S',
  'MOUNTAIN GOAT':     'G',
  'MOOSE':             'M',
  'ELK':               'E',
  'CARIBOU':           'C',
  'BLACK BEAR':        'U',
  'MULE DEER':         'D',
  'WHITE-TAILED DEER': 'W',
  'BISON':             'B',
  'TURKEY':            'T',
};


// ── LEH zones cache & fetch ──
let _lehZonesCache = null;
function _lehGetZones() {
  if (_lehZonesCache) return Promise.resolve(_lehZonesCache);
  const urls = ['./leh_zones.json', '/leh_zones.json', 'https://raw.githubusercontent.com/jamiegazzola/HuntSmartCanada/main/leh_zones.json'];
  let lastErr = null;
  const tryNext = (i) => {
    if (i >= urls.length) throw (lastErr || new Error('LEH zones unavailable'));
    return fetch(urls[i], { cache: 'force-cache' })
      .then(r => { if (!r.ok) throw new Error(`${urls[i]} HTTP ${r.status}`); return r.json(); })
      .catch(err => { lastErr = err; return tryNext(i + 1); });
  };
  return tryNext(0).then(d => { _lehZonesCache = d; return d; });
}

function _lehNormalizeSpecies(speciesType) {
  const s = String(speciesType || '').trim().toUpperCase();
  if (!s) return '';
  if (s.includes('SHEEP') || s.includes('BIGHORN') || s.includes('THINHORN')) return 'MOUNTAIN SHEEP';
  if (s.includes('GOAT')) return 'MOUNTAIN GOAT';
  if (s.includes('MOOSE')) return 'MOOSE';
  if (s.includes('ELK')) return 'ELK';
  if (s.includes('CARIBOU')) return 'CARIBOU';
  if (s.includes('BLACK') && s.includes('BEAR')) return 'BLACK BEAR';
  if (s.includes('MULE') || s.includes('BLACK-TAILED')) return 'MULE DEER';
  if (s.includes('WHITE') || s.includes('WHITETAIL')) return 'WHITE-TAILED DEER';
  if (s.includes('BISON')) return 'BISON';
  if (s.includes('TURKEY')) return 'TURKEY';
  return s;
}

function _lehCleanMU(mu) {
  // Keep LEH/map/dropdown comparisons consistent across:
  // 5-01 vs 5-1, 6-20* vs 6-20, 6-20+ vs 6-20.
  return bcNormalizeMU(mu);
}

function _lehMUVariants(mu) {
  const raw = _lehCleanMU(mu);
  const out = new Set([raw]);
  const m = raw.match(/^(\d+)\s*-\s*(\d+)$/);
  if (m) {
    const region = String(parseInt(m[1], 10));
    const unitNum = parseInt(m[2], 10);
    if (!Number.isNaN(unitNum)) {
      out.add(`${region}-${unitNum}`);
      out.add(`${region}-${String(unitNum).padStart(2, '0')}`);
    }
  }
  return [...out].filter(Boolean);
}

function _lehFindWMUFeature(mu) {
  const geo = (typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON) || (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON);
  if (!geo || !geo.features) return null;
  const variants = new Set(_lehMUVariants(mu).map(v => v.replace(/^0+/, '')));
  return geo.features.find(f => variants.has(String(f.properties?.wmu_id || '').trim())) || null;
}

function _lehGeometryBounds(geom) {
  const coords = [];
  const walk = (g) => {
    if (!g) return;
    if (g.type === 'Point') coords.push(g.coordinates);
    else if (g.type === 'Polygon') g.coordinates.forEach(r => r.forEach(c => coords.push(c)));
    else if (g.type === 'MultiPolygon') g.coordinates.forEach(p => p.forEach(r => r.forEach(c => coords.push(c))));
    else if (g.type === 'LineString') g.coordinates.forEach(c => coords.push(c));
    else if (g.type === 'MultiLineString') g.coordinates.forEach(r => r.forEach(c => coords.push(c)));
    else if (g.type === 'GeometryCollection') g.geometries.forEach(walk);
  };
  walk(geom);
  const good = coords.filter(c => Array.isArray(c) && isFinite(c[0]) && isFinite(c[1]));
  if (!good.length) return null;
  const lngs = good.map(c => c[0]);
  const lats = good.map(c => c[1]);
  return [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
}

function _lehZoneIdsForMU(muIndex, mu) {
  const ids = new Set();
  for (const v of _lehMUVariants(mu)) {
    (muIndex[v] || []).forEach(id => ids.add(id));
  }
  return [...ids];
}

function _lehFormatZoneLabel(label, mu, zoneLetter) {
  const txt = String(label || '').trim();
  const match = txt.match(/^Zone\s+([A-Z]+)\s+of\s+(.+)$/i);
  if (match) return `Zone ${match[1].toUpperCase()} of MU ${match[2].trim()}`;
  if (zoneLetter) return `Zone ${String(zoneLetter).toUpperCase()} of MU ${_lehCleanMU(mu)}`;
  if (/^\d+-\d+/.test(txt)) return `MU ${txt}`;
  return txt || `MU ${_lehCleanMU(mu)}`;
}

function _lehZoneLetterFromId(id) {
  const m = String(id || '').match(/([A-Z]+)$/);
  return m ? m[1] : '';
}

// ── Find the best matching zone ID for a draw card ──
// Zone IDs in leh_zones.json are formatted as: PREFIX_MU+ZONE  e.g. "S_4-23B"
// prefix = species letter, MU = management unit, ZONE = zone letter
function _lehFindZoneId(zones, muIndex, mu, zone, speciesType) {
  const prefix = _LEH_SPECIES_PREFIX[_lehZoneTypeForSpecies(speciesType)] || 'S';
  const cleanZone = String(zone || '').replace(/[^A-Za-z]/g, '').toUpperCase();
  const variants = _lehMUVariants(mu);
  const candidates = _lehZoneIdsForMU(muIndex, mu).filter(id => id.startsWith(prefix + '_'));

  // Strategy 1: exact match using all MU variants, e.g. C_6-20B or C_6-20, 6-18B
  if (cleanZone) {
    for (const v of variants) {
      const exact = prefix + '_' + v + cleanZone;
      if (zones[exact]) return exact;
    }
    const byZone = candidates.find(id => id.endsWith(cleanZone));
    if (byZone) return byZone;
  }

  // Strategy 2: first zone for this MU/species
  if (candidates.length) return candidates[0];

  // Never fall back to another species inside cards — that caused turkey/goat/etc.
  // zones to appear on unrelated species cards.
  return null;
}

function _lehSpeciesForSelectedMUsFromData(data, mus) {
  const zones = data.zones || data;
  const muIndex = data.mu_index || {};
  const names = new Set();
  for (const mu of mus || []) {
    for (const id of _lehZoneIdsForMU(muIndex, mu)) {
      if (zones[id]?.zt) names.add(_lehNormalizeSpecies(zones[id].zt));
    }
  }
  return [...names].sort();
}
// Track card map instances so we can destroy them if the card is re-rendered
const _lehCardMaps = {};

function bcCardMapInit(containerId, mu, zone, speciesType) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Guard against CSS overrides: the card map must have a real pixel height
  // before Mapbox reads the container size.
  container.classList.add('leh-card-map');
  container.style.width = '100%';
  container.style.aspectRatio = '1 / 1';
  container.style.height = 'auto';
  container.style.minHeight = '0';

  // Destroy any previous map instance in this container
  if (_lehCardMaps[containerId]) {
    try { _lehCardMaps[containerId].remove(); } catch(e) {}
    delete _lehCardMaps[containerId];
    container.innerHTML = '';
    delete container._leaflet_id; // legacy cleanup
  }

  // Strip BC draw modifiers from zone letter: "A*" -> "A"
  const cleanZone = zone ? zone.replace(/[^A-Za-z]/g, '') : '';
  // Strip trailing modifiers from MU but keep leading zeros (LEH data uses them)
  const cleanMU = mu.replace(/[\*\+]+$/, '').trim();
  const prefix = _LEH_SPECIES_PREFIX[_lehZoneTypeForSpecies(speciesType)] || 'S';

  // ── Decide tile type from buttons (default satellite) ──
  const activeBtn = container.closest('.leh-card-map-wrap')?.querySelector('.leh-map-btn.active');
  const tileType  = (activeBtn?.dataset?.tile) || 'satellite';

  // Mapbox token — use same token as full map
  const token = (typeof MAPBOX_TOKEN !== 'undefined') ? MAPBOX_TOKEN : '';

  function _doMapboxInit() {
    mapboxgl.accessToken = token;

    const mapStyle = tileType === 'topo'
      ? 'mapbox://styles/mapbox/outdoors-v12'
      : 'mapbox://styles/mapbox/satellite-streets-v12'; // Maxar Vivid / Vexcel aerial

    const map = new mapboxgl.Map({
      container: containerId,
      style: mapStyle,
      center: [-124.5, 54.5],
      zoom: 6,
      minZoom: 4,
      maxZoom: 18,
      projection: 'mercator',
      scrollZoom: true,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    _lehCardMaps[containerId] = map;
    // Store tile type on instance for toggle function
    map._lehCurrentTile = tileType;

    // Card map resize safety: expanded cards can finish animating after Mapbox
    // initializes, so force a few resize passes to prevent blank maps.
    setTimeout(() => { if (_lehCardMaps[containerId] === map) map.resize(); }, 50);
    setTimeout(() => { if (_lehCardMaps[containerId] === map) map.resize(); }, 180);
    setTimeout(() => { if (_lehCardMaps[containerId] === map) map.resize(); }, 400);
    setTimeout(() => { if (_lehCardMaps[containerId] === map) map.resize(); }, 900);

    const statusEl = document.getElementById(containerId + '_status');
    function setStatus(msg, ok) {
      if (!statusEl) return;
      statusEl.textContent = msg;
      statusEl.style.color = ok ? 'var(--text-muted, #666)' : '#f87171';
    }
    setStatus('Loading zone…', true);

    map.on('load', () => {
      // Card maps start in flat 2D. Terrain can distort LEH zone reading in small cards.

      _lehGetZones().then(data => {
        if (!_lehCardMaps[containerId]) return; // card closed

        const zones   = data.zones    || data;
        const muIndex = data.mu_index || {};

        // ── WMU context layer: show the full management unit behind the LEH zone ──
        const wmuFeature = _lehFindWMUFeature(cleanMU);
        const wmuBounds = wmuFeature ? _lehGeometryBounds(wmuFeature.geometry) : null;
        if (wmuFeature) {
          map.addSource('card-wmu', {
            type: 'geojson',
            data: { type: 'Feature', properties: { id: cleanMU }, geometry: wmuFeature.geometry }
          });
          map.addLayer({
            id: 'card-wmu-fill', type: 'fill', source: 'card-wmu',
            paint: { 'fill-color': '#4ade80', 'fill-opacity': 0.045 }
          });
          map.addLayer({
            id: 'card-wmu-line', type: 'line', source: 'card-wmu',
            paint: { 'line-color': '#ffffff', 'line-width': 2.1, 'line-opacity': 0.92 }
          });
        }

        // ── Context layer: all LEH zones for this MU/species ──
        const contextIds = new Set(_lehZoneIdsForMU(muIndex, cleanMU).filter(id => id.startsWith(prefix + '_')));
        const muFeatures = [...contextIds]
          .filter(id => zones[id])
          .map(id => {
            const z = zones[id];
            // Extract zone letter from ID e.g. "D_3-32A" → "Zone A", "D_3-32B" → "Zone B"
            const zoneLetterMatch = id.match(/([A-Z]+)$/);
            const zoneLetter = zoneLetterMatch ? zoneLetterMatch[1] : '';
            return { type: 'Feature', id, properties: { id, label: _lehFormatZoneLabel(z.lb, z.mu, zoneLetter), zt: z.zt, mu: z.mu, zoneLetter }, geometry: z.g };
          });

        if (muFeatures.length > 0) {
          map.addSource('card-ctx', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: muFeatures }
          });
          map.addLayer({
            id: 'card-ctx-fill', type: 'fill', source: 'card-ctx',
            paint: { 'fill-color': '#f0b429', 'fill-opacity': 0.025 }
          });
          map.addLayer({
            id: 'card-ctx-line', type: 'line', source: 'card-ctx',
            paint: { 'line-color': '#f0b429', 'line-width': 2.0, 'line-opacity': 1.0 }
          });

          // Tooltip is handled by the single robust hover listener below.
          // Do not bind a second layer-specific popup here, or two tooltips appear.
        }

        // ── Highlight layer: the specific drawn zone ──
        const resolvedId = _lehFindZoneId(zones, muIndex, mu, cleanZone, speciesType);
        let highlightBounds = null;

        if (resolvedId && zones[resolvedId]) {
          const z = zones[resolvedId];
          const hasModifier = zone && /[\*\+]/.test(zone);
          map.addSource('card-zone', {
            type: 'geojson',
            data: { type: 'Feature', properties: { id: resolvedId, label: _lehFormatZoneLabel(z.lb, z.mu, _lehZoneLetterFromId(resolvedId)), partial: hasModifier, zt: z.zt, mu: z.mu }, geometry: z.g }
          });
          map.addLayer({
            id: 'card-zone-fill', type: 'fill', source: 'card-zone',
            paint: { 'fill-color': '#f0b429', 'fill-opacity': 0.06 }
          });
          map.addLayer({
            id: 'card-zone-line', type: 'line', source: 'card-zone',
            paint: { 'line-color': '#9a5f08', 'line-width': 3.3, 'line-opacity': 1.0 }
          });

          // Fit map to zone bounds
          const coords = [];
          const collectCoords = (geom) => {
            if (!geom) return;
            if (geom.type === 'Polygon') geom.coordinates[0].forEach(c => coords.push(c));
            else if (geom.type === 'MultiPolygon') geom.coordinates.forEach(p => p[0].forEach(c => coords.push(c)));
          };
          collectCoords(z.g);
          if (coords.length) {
            const lngs = coords.map(c => c[0]), lats = coords.map(c => c[1]);
            highlightBounds = [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
          }
        } else if (muFeatures.length > 0) {
          // Fall back to fitting the whole MU
          const allCoords = [];
          muFeatures.forEach(f => {
            const g = f.geometry;
            if (!g) return;
            if (g.type === 'Polygon') g.coordinates[0].forEach(c => allCoords.push(c));
            else if (g.type === 'MultiPolygon') g.coordinates.forEach(p => p[0].forEach(c => allCoords.push(c)));
          });
          if (allCoords.length) {
            const lngs = allCoords.map(c => c[0]), lats = allCoords.map(c => c[1]);
            highlightBounds = [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
          }
        }

        const fitBounds = wmuBounds || highlightBounds;
        if (fitBounds) {
          map.fitBounds(fitBounds, {
            padding: 34,
            maxZoom: wmuBounds ? 9.8 : 11,
            duration: 800
          });
        }

        const label = resolvedId && zones[resolvedId] ? _lehFormatZoneLabel(zones[resolvedId].lb, zones[resolvedId].mu, _lehZoneLetterFromId(resolvedId)) : `MU ${mu}`;
        const resolvedZoneLetter = _lehZoneLetterFromId(resolvedId);
        const resolvedZoneDisplay = label;
        setStatus(resolvedZoneDisplay, true);

        
        // V9 card hover/tap highlight: draw a temporary darker outline over the zone
        // under the pointer, and keep it on tap for mobile users.
        function _cardSetHoverFeature(hit) {
          if (!map.getSource('card-hover-zone')) return;
          if (!hit) {
            map.getSource('card-hover-zone').setData({ type:'FeatureCollection', features: [] });
            return;
          }
          map.getSource('card-hover-zone').setData({
            type: 'FeatureCollection',
            features: [{ type: 'Feature', properties: hit.properties || {}, geometry: hit.geometry }]
          });
        }
        if (!map.getSource('card-hover-zone')) {
          map.addSource('card-hover-zone', { type: 'geojson', data: { type:'FeatureCollection', features: [] } });
          map.addLayer({ id:'card-hover-fill', type:'fill', source:'card-hover-zone',
            paint:{ 'fill-color':'#f0b429', 'fill-opacity':0.24 }
          });
          map.addLayer({ id:'card-hover-line', type:'line', source:'card-hover-zone',
            paint:{ 'line-color':'#6f3f00', 'line-width':5.0, 'line-opacity':1 }
          });
        }

        // Robust card hover: query top LEH layer under the cursor. This works even when
        // the highlighted zone and context zones overlap, and it also works in fullscreen.
        if (!map._hsLehHoverBound) {
          map._hsLehHoverBound = true;
          const hoverPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, className: 'leh-card-tip' });
          map.on('mousemove', e => {
            const hoverLayers = ['card-zone-fill','card-ctx-fill','card-zone-line','card-ctx-line'].filter(id => map.getLayer(id));
            if (!hoverLayers.length) return;
            const hits = map.queryRenderedFeatures(e.point, { layers: hoverLayers });
            if (!hits.length) {
              map.getCanvas().style.cursor = '';
              _cardSetHoverFeature(null);
              hoverPopup.remove();
              return;
            }
            _cardSetHoverFeature(hits[0]);
            const props = hits[0].properties || {};
            const zoneLabel = props.label || _lehFormatZoneLabel('', props.mu || mu, props.zoneLetter || '');
            map.getCanvas().style.cursor = 'crosshair';
            hoverPopup.setLngLat(e.lngLat)
              .setHTML(`<b style="color:#f0b429">${zoneLabel}</b>${props.zt ? `<br><span style="font-size:10px;color:#aaa">${props.zt}</span>` : ''}`)
              .addTo(map);
          });
          map.on('mouseleave', () => {
            map.getCanvas().style.cursor = '';
            _cardSetHoverFeature(null);
            hoverPopup.remove();
          });
          map.on('click', e => {
            const hoverLayers = ['card-zone-fill','card-ctx-fill','card-zone-line','card-ctx-line'].filter(id => map.getLayer(id));
            if (!hoverLayers.length) return;
            const hits = map.queryRenderedFeatures(e.point, { layers: hoverLayers });
            if (!hits.length) return;
            _cardSetHoverFeature(hits[0]);
            const props = hits[0].properties || {};
            const zoneLabel = props.label || _lehFormatZoneLabel('', props.mu || mu, props.zoneLetter || '');
            hoverPopup.setLngLat(e.lngLat)
              .setHTML(`<b style="color:#f0b429">${zoneLabel}</b>${props.zt ? `<br><span style="font-size:10px;color:#aaa">${props.zt}</span>` : ''}`)
              .addTo(map);
          });
        }

        // Single hover tooltip is handled by the robust card hover block above.


      }).catch(err => {
        console.error('[bcCardMapInit zone]', err);
        setStatus('Zone data unavailable', false);
      });
    });

    map.on('error', e => console.warn('[cardMap]', e.error?.message || e));
  }

  // Load Mapbox GL JS if needed (may already be loaded by full map tab)
  if (window.mapboxgl) {
    _doMapboxInit();
  } else {
    if (!document.querySelector('link[href*="mapbox-gl"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css';
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js';
    script.onload = _doMapboxInit;
    script.onerror = () => {
      const s = document.getElementById(containerId + '_status');
      if (s) { s.textContent = 'Map unavailable'; s.style.color = '#f87171'; }
    };
    document.head.appendChild(script);
  }
}


// Called by the Satellite / Topo toggle buttons rendered in the card HTML
// e.g. onclick="bcCardMapSetLayer('cardMapDiv_6038', 'topo')"
// Now re-initialises the Mapbox map with the new style (preserves 3D terrain)
function bcCardMapSetLayer(containerId, type) {
  const map = _lehCardMaps[containerId];
  if (!map) return;
  if (map._lehCurrentTile === type) return;

  // Sync button states
  ['satellite', 'topo'].forEach(t => {
    const btn = document.getElementById(`${containerId}_btn_${t}`);
    if (btn) btn.classList.toggle('active', t === type);
  });

  // Read the map container's parent to get the mu/zone/species we need to re-init
  // These are stored as data attributes on the map container by the card HTML
  const container = document.getElementById(containerId);
  if (!container) return;
  const mu          = container.dataset.mu          || '';
  const zone        = container.dataset.zone        || '';
  const speciesType = container.dataset.speciesType || '';

  if (mu) {
    // Full re-init with new style (Mapbox can't swap satellite<->outdoors in-place easily)
    bcCardMapInit(containerId, mu, zone, speciesType);
  } else {
    // Fallback: just swap style and reapply terrain
    const newStyle = type === 'topo'
      ? 'mapbox://styles/mapbox/outdoors-v12'
      : 'mapbox://styles/mapbox/satellite-streets-v12';
    const center  = map.getCenter();
    const zoom    = map.getZoom();
    const pitch   = map.getPitch();
    const bearing = map.getBearing();
    map.setStyle(newStyle);
    map._lehCurrentTile = type;
    map.once('style.load', () => {
      map.jumpTo({ center, zoom, pitch: 0, bearing: 0 });
    });
  }
}

// Resize Mapbox GL map when card becomes visible (call after expanding card)
function bcCardMapInvalidate(containerId) {
  const map = _lehCardMaps[containerId];
  if (map) setTimeout(() => map.resize(), 80);
}

// ── Card map fullscreen ──
const _bcCardMapFullscreen = {};
function bcCardMapToggleFullscreen(containerId) {
  const mapDiv = document.getElementById(containerId);
  if (!mapDiv) return;
  const expandBtn = document.querySelector(`[onclick*="bcCardMapToggleFullscreen('${containerId}')"]`);

  const resizeSoon = () => {
    [60, 180, 420, 850].forEach(ms => setTimeout(() => {
      const m = _lehCardMaps[containerId];
      if (m && typeof m.resize === 'function') m.resize();
    }, ms));
  };

  if (_bcCardMapFullscreen[containerId]) {
    const { overlay, placeholder, oldStyle } = _bcCardMapFullscreen[containerId];
    if (placeholder?.parentNode) placeholder.parentNode.replaceChild(mapDiv, placeholder);
    mapDiv.setAttribute('style', oldStyle || 'height:280px;width:100%;border-radius:8px;overflow:hidden;background:#1a1a1a');
    if (overlay?.parentNode) overlay.parentNode.removeChild(overlay);
    delete _bcCardMapFullscreen[containerId];
    if (expandBtn) { expandBtn.textContent = '⛶'; expandBtn.title = 'Expand map'; }
    document.body.style.overflow = '';
    resizeSoon();
    return;
  }

  const oldStyle = mapDiv.getAttribute('style') || '';
  const placeholder = document.createElement('div');
  placeholder.style.height = mapDiv.offsetHeight ? `${mapDiv.offsetHeight}px` : '280px';
  placeholder.style.width = '100%';
  placeholder.style.borderRadius = '8px';
  placeholder.style.background = '#111';
  mapDiv.parentNode?.replaceChild(placeholder, mapDiv);

  const overlay = document.createElement('div');
  overlay.className = 'leh-card-fullscreen-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:#0d0d0d;display:flex;flex-direction:column;width:100vw;height:100vh;overflow:hidden';

  const bar = document.createElement('div');
  bar.style.cssText = 'display:flex;align-items:center;justify-content:flex-end;padding:8px 14px;background:rgba(18,18,18,0.96);border-bottom:1px solid #2e2e2e;flex:0 0 auto;backdrop-filter:blur(4px);gap:10px;min-height:45px';

  ['satellite', 'topo'].forEach(t => {
    const tb = document.createElement('button');
    tb.className = 'leh-map-btn' + ((_lehCardMaps[containerId]?._lehCurrentTile === t) ? ' active' : '');
    tb.dataset.tile = t;
    tb.textContent = t.charAt(0).toUpperCase() + t.slice(1);
    tb.id = `${containerId}_btn_${t}`;
    tb.style.cssText = 'font-size:11px;padding:4px 12px;';
    tb.onclick = () => { bcCardMapSetLayer(containerId, t); resizeSoon(); };
    bar.appendChild(tb);
  });

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕&nbsp;&nbsp;Collapse';
  closeBtn.className = 'leh-map-btn';
  closeBtn.style.cssText = 'font-size:12px;padding:5px 16px;margin-left:auto;font-weight:600;';
  closeBtn.title = 'Exit fullscreen (Esc)';
  closeBtn.onclick = () => bcCardMapToggleFullscreen(containerId);
  bar.appendChild(closeBtn);

  overlay.appendChild(bar);
  mapDiv.style.cssText = 'flex:1 1 auto;min-height:0;width:100vw;height:calc(100vh - 45px);border-radius:0;overflow:hidden;background:#1a1a1a;position:relative;display:block';
  overlay.appendChild(mapDiv);
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  _bcCardMapFullscreen[containerId] = { overlay, placeholder, oldStyle };
  if (expandBtn) { expandBtn.textContent = '✕'; expandBtn.title = 'Collapse map'; }
  resizeSoon();
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') Object.keys(_bcCardMapFullscreen).forEach(id => bcCardMapToggleFullscreen(id));
});

// ══════════════════════════════════════════════════════
// HUNTSMART MOBILE MAP — ONX-STYLE RAIL UI HELPERS
// Desktop untouched. All mobile logic lives here.
// ══════════════════════════════════════════════════════

// ── HARD KILL: neutralise old fm-mobile sheet/tools before they can show ──
(function() {
  // Noop all old sheet functions immediately
  const noop = function(){};
  window.fullMapMobileOpenSheet  = noop;
  window.fullMapMobileCloseSheet = noop;
  window.fullMapMobileCardsToggle = function(){ if(typeof hsCardsToggle==='function') hsCardsToggle(); };
  // Hide any elements that got injected before this script ran
  function killOldMobileEls() {
    ['fmMobileTools','fmMobileStatus','fmMobileZonePill','fmMobileScrim','fmMobileSheet'].forEach(function(id){
      var el = document.getElementById(id);
      if (el) { el.style.cssText = 'display:none!important'; }
    });
    document.querySelectorAll('.fm-mobile-tool,.fm-mobile-tools,.fm-mobile-status,.fm-mobile-scrim,.fm-mobile-sheet,.fm-mobile-zone-pill').forEach(function(el){
      el.style.cssText = 'display:none!important';
    });
  }
  killOldMobileEls();
  document.addEventListener('DOMContentLoaded', killOldMobileEls);
  setTimeout(killOldMobileEls, 100);
  setTimeout(killOldMobileEls, 500);
})();



function fullMapMobileIsNarrow() {
  return window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
}

// ── Inject the rail + cluster + zone pill + modal scrim into #fullMapLeaflet ──
function hsRailInit() {
  if (!fullMapMobileIsNarrow()) return;
  const container = document.querySelector('.fullmap-container');
  if (!container || document.getElementById('hsRail')) return;

  // Province toggle already in topbar via HTML.
  // Inject species button replacing the native select.
  _hsInjectSpeciesBtn();

  // Rail (4 main buttons)
  const rail = document.createElement('div');
  rail.className = 'hs-rail';
  rail.id = 'hsRail';
  rail.innerHTML = `
    <button type="button" class="hs-rail-btn" id="hsRailLayers" onclick="hsOpenModal('layers')" aria-label="Map layers">
      <span class="hs-rail-btn-icon">&#9635;</span>
      <span class="hs-rail-btn-label">Layers</span>
    </button>
    <button type="button" class="hs-rail-btn" id="hsRailSearch" onclick="hsOpenModal('search')" aria-label="Search">
      <span class="hs-rail-btn-icon">&#8981;</span>
      <span class="hs-rail-btn-label">Search</span>
    </button>
    <button type="button" class="hs-rail-btn" id="hsRailCards" onclick="hsCardsToggle()" aria-label="Draw cards">
      <span class="hs-rail-btn-icon">&#9636;</span>
      <span class="hs-rail-btn-label">Cards</span>
    </button>
    <button type="button" class="hs-rail-btn" id="hsRailLEH" onclick="hsOpenModal('leh')" aria-label="LEH zones">
      <span class="hs-rail-btn-icon">&#9672;</span>
      <span class="hs-rail-btn-label">LEH</span>
    </button>
  `;
  container.appendChild(rail);

  // Bottom-right cluster (+, −, 3D)
  const cluster = document.createElement('div');
  cluster.className = 'hs-br-cluster';
  cluster.id = 'hsBrCluster';
  cluster.innerHTML = `
    <button type="button" class="hs-br-btn" onclick="fullMapZoomIn()" aria-label="Zoom in">
      <span class="hs-br-btn-icon">+</span>
      <span class="hs-br-btn-label">Zoom</span>
    </button>
    <button type="button" class="hs-br-btn" onclick="fullMapZoomOut()" aria-label="Zoom out">
      <span class="hs-br-btn-icon">&#8722;</span>
      <span class="hs-br-btn-label">Zoom</span>
    </button>
    <button type="button" class="hs-br-btn toggle" id="hs3DBtn" onclick="hsToggle3D()" aria-label="Toggle 3D">
      <span class="hs-br-btn-icon" id="hs3DBtnLabel">3D</span>
      <span class="hs-br-btn-label">Mode</span>
    </button>
  `;
  container.appendChild(cluster);

  // Zone pill (top-left, amber)
  const pill = document.createElement('div');
  pill.className = 'hs-zone-pill';
  pill.id = 'hsZonePill';
  pill.setAttribute('aria-live', 'polite');
  pill.innerHTML = `
    <span class="hs-zone-pill-dot"></span>
    <span class="hs-zone-pill-name" id="hsZonePillName"></span>
    <span class="hs-zone-pill-div"></span>
    <span class="hs-zone-pill-sub" id="hsZonePillSub"></span>
    <span class="hs-zone-pill-div"></span>
    <span class="hs-zone-pill-hint">swipe &#8593;</span>
  `;
  pill.addEventListener('touchstart', _hsDrawerSwipeStart, { passive: true });
  container.appendChild(pill);

  // Modal scrim
  const scrim = document.createElement('div');
  scrim.className = 'hs-modal-scrim';
  scrim.id = 'hsModalScrim';
  scrim.addEventListener('click', hsCloseModal);
  container.appendChild(scrim);

  hsSync3DBtn();
}

// ── Species button replacing native <select> ──
function _hsInjectSpeciesBtn() {
  const sel = document.getElementById('fullMapSpeciesSelect');
  if (!sel || document.getElementById('hsSpeciesBtn')) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'hs-species-btn';
  btn.id = 'hsSpeciesBtn';
  btn.setAttribute('aria-haspopup', 'listbox');
  btn.innerHTML = `<span id="hsSpeciesBtnText">All species</span><span class="hs-species-arr">&#9660;</span>`;
  btn.onclick = hsToggleSpeciesDrop;
  sel.parentNode.insertBefore(btn, sel.nextSibling);
}

function hsToggleSpeciesDrop() {
  const existing = document.getElementById('hsSpeciesDrop');
  if (existing) { existing.remove(); _hsSpeciesBtnClose(); return; }
  const sel = document.getElementById('fullMapSpeciesSelect');
  if (!sel) return;
  const btn = document.getElementById('hsSpeciesBtn');
  if (btn) btn.classList.add('open');
  const drop = document.createElement('div');
  drop.className = 'hs-species-drop';
  drop.id = 'hsSpeciesDrop';
  const options = Array.from(sel.options);
  drop.innerHTML = options.map(o =>
    `<div class="hs-species-row${o.value === sel.value ? ' active' : ''}" data-val="${o.value}">${o.text}</div>`
  ).join('');
  drop.querySelectorAll('.hs-species-row').forEach(row => {
    row.addEventListener('click', () => {
      sel.value = row.dataset.val;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      const btnText = document.getElementById('hsSpeciesBtnText');
      if (btnText) btnText.textContent = row.textContent || 'All species';
      drop.remove();
      _hsSpeciesBtnClose();
    });
  });
  const container = document.querySelector('.fullmap-container') || document.querySelector('.fullmap-page');
  if (container) container.appendChild(drop);
  // Close on outside tap
  setTimeout(() => {
    document.addEventListener('touchstart', _hsCloseSpeciesDropOutside, { once: true, passive: true });
  }, 50);
}

function _hsCloseSpeciesDropOutside(e) {
  const drop = document.getElementById('hsSpeciesDrop');
  const btn  = document.getElementById('hsSpeciesBtn');
  if (drop && btn && !drop.contains(e.target) && !btn.contains(e.target)) {
    drop.remove();
    _hsSpeciesBtnClose();
  }
}
function _hsSpeciesBtnClose() {
  const btn = document.getElementById('hsSpeciesBtn');
  if (btn) btn.classList.remove('open');
  const arr = btn && btn.querySelector('.hs-species-arr');
  if (arr) arr.innerHTML = '&#9660;';
}

// ── 3D toggle ──
function hsToggle3D() {
  fullMapToggle3D();
  hsSync3DBtn();
}
function hsSync3DBtn() {
  const btn = document.getElementById('hs3DBtn');
  const lbl = document.getElementById('hs3DBtnLabel');
  if (!btn || !lbl) return;
  const is3D = !!_fullMapTerrain3D;
  lbl.textContent = is3D ? '2D' : '3D';
  btn.classList.toggle('active', is3D);
}

// ── Zone pill ──
function fullMapMobileShowZonePill(label, species) {
  if (!fullMapMobileIsNarrow()) return;
  const pill = document.getElementById('hsZonePill');
  const name = document.getElementById('hsZonePillName');
  const sub  = document.getElementById('hsZonePillSub');
  if (!pill || !name) return;
  name.textContent = label || '';
  if (sub) sub.textContent = species || '';
  pill.classList.add('visible');
}
function fullMapMobileHideZonePill() {
  const pill = document.getElementById('hsZonePill');
  if (pill) pill.classList.remove('visible');
}

// ── Modal open/close ──
function hsOpenModal(type) {
  if (!fullMapMobileIsNarrow()) return;
  const scrim = document.getElementById('hsModalScrim');
  if (!scrim) return;

  // Mark active rail button
  document.querySelectorAll('.hs-rail-btn').forEach(b => b.classList.remove('active'));
  const map = { layers: 'hsRailLayers', search: 'hsRailSearch', leh: 'hsRailLEH' };
  if (map[type]) { const b = document.getElementById(map[type]); if (b) b.classList.add('active'); }

  scrim.innerHTML = '';
  const modal = document.createElement('div');
  modal.className = 'hs-modal';
  modal.id = 'hsModal';
  modal.addEventListener('click', e => e.stopPropagation());

  if (type === 'layers')  modal.innerHTML = _hsLayersHTML();
  if (type === 'search')  { modal.innerHTML = _hsSearchHTML(); }
  if (type === 'leh')     modal.innerHTML = _hsLEHHTML();

  scrim.appendChild(modal);
  scrim.classList.add('visible');

  if (type === 'search') {
    setTimeout(() => { const inp = document.getElementById('hsSearchInput'); if (inp) inp.focus(); }, 80);
  }
}

function hsCloseModal() {
  const scrim = document.getElementById('hsModalScrim');
  if (scrim) { scrim.classList.remove('visible'); scrim.innerHTML = ''; }
  document.querySelectorAll('.hs-rail-btn').forEach(b => b.classList.remove('active'));
  _hsSyncCardsBtn();
}

// ── Layers modal HTML ──
function _hsLayersHTML() {
  const s = _fullMapStyle || 'streets';
  const is3D = !!_fullMapTerrain3D;
  const opacity = typeof _fullMapWMUOpacity !== 'undefined' ? Math.round((1 - _fullMapWMUOpacity) * 100) : 75;
  const btn = (label, cls, active, onclick) =>
    `<button type="button" class="hs-modal-choice ${cls}${active?' active':''}" onclick="${onclick}">${label}</button>`;
  return `
    <div class="hs-modal-head">
      <span class="hs-modal-title">Map layers</span>
      <button type="button" class="hs-modal-close" onclick="hsCloseModal()">&#10005;</button>
    </div>
    <div class="hs-modal-section-label">Map type</div>
    <div class="hs-modal-seg3">
      ${btn('Streets','map-type',s==='streets',"hsSetTile('streets')")}
      ${btn('Satellite','map-type',s==='satellite',"hsSetTile('satellite')")}
      ${btn('Topo','map-type',s==='topo',"hsSetTile('topo')")}
    </div>
    <div class="hs-modal-section-label">Mode</div>
    <div class="hs-modal-seg2">
      ${btn('2D','mode',!is3D,"hsSet3D(false)")}
      ${btn('3D','mode',is3D,"hsSet3D(true)")}
    </div>
    <div class="hs-modal-section-label">Overlay opacity</div>
    <div class="hs-modal-slider-row">
      <input type="range" min="0" max="100" step="1" value="${opacity}" oninput="hsSetOpacity(this.value)">
      <span class="hs-modal-slider-val" id="hsOpacityVal">${opacity}%</span>
    </div>
    <div class="hs-modal-note">Lower opacity keeps terrain visible while WMU outlines stay readable.</div>
  `;
}

function hsSetTile(type) {
  fullMapSetTile(type);
  const modal = document.getElementById('hsModal');
  if (modal) modal.innerHTML = _hsLayersHTML();
}
function hsSet3D(on) {
  if (!!_fullMapTerrain3D !== on) fullMapToggle3D();
  hsSync3DBtn();
  const modal = document.getElementById('hsModal');
  if (modal) modal.innerHTML = _hsLayersHTML();
}
function hsSetOpacity(val) {
  const v = document.getElementById('hsOpacityVal');
  if (v) v.textContent = Math.round(val) + '%';
  if (typeof fullMapSetLEHOpacity === 'function') fullMapSetLEHOpacity(1 - val / 100);
}

// ── Search modal HTML ──
function _hsSearchHTML() {
  return `
    <div class="hs-modal-head">
      <span class="hs-modal-title">Search</span>
      <button type="button" class="hs-modal-close" onclick="hsCloseModal()">&#10005;</button>
    </div>
    <div class="hs-search-input-wrap">
      <span class="hs-search-icon">&#8981;</span>
      <input class="hs-search-input" id="hsSearchInput" type="text"
        placeholder="City, WMU, or coordinates\u2026"
        autocomplete="off"
        oninput="hsHandleSearch(this.value)">
    </div>
    <div id="hsSearchResults"></div>
  `;
}

function hsHandleSearch(val) {
  // Reuse existing fullMapMobileHandleSearch logic, adapted to new result container
  const box = document.getElementById('hsSearchResults');
  if (!box) return;
  const query = String(val || '').trim();
  const q = query.toLowerCase();
  if (!q) { box.innerHTML = ''; return; }

  const out = [];
  const coord = typeof _searchParseCoords === 'function' ? _searchParseCoords(query) : null;
  if (coord) out.push({ label: typeof _searchCoordLabel === 'function' ? _searchCoordLabel(coord) : query, sub: 'Coordinates', badge: 'city', action: () => { if (typeof _searchFlyToCoords === 'function') _searchFlyToCoords(coord, 12); } });

  if (fullMapProvince === 'BC') {
    const geojson = (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON) || (typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON);
    (geojson?.features || []).forEach(feat => {
      const id = feat.properties.wmu_id || '';
      if (id.toLowerCase().includes(q)) out.push({ label: `WMU ${id}`, sub: 'BC Wildlife Unit', badge: 'wmu', action: () => { if (typeof _searchFlyToWMU_BC === 'function') _searchFlyToWMU_BC(id, feat); } });
    });
  } else {
    (typeof AB_WMU_GEOJSON !== 'undefined' ? AB_WMU_GEOJSON : { features: [] })?.features?.forEach(feat => {
      const id = String(feat.properties.WMUNIT_NUM || '');
      const name = feat.properties.WMUNIT_NAM || '';
      if (id.includes(q) || name.toLowerCase().includes(q)) out.push({ label: `WMU ${id}`, sub: name || 'Alberta WMU', badge: 'wmu', action: () => { if (typeof _searchFlyToWMU_AB === 'function') _searchFlyToWMU_AB(id, feat); } });
    });
  }

  window._hsSearchRows = out.slice(0, 5);
  _hsRenderSearchResults(window._hsSearchRows);

  // Geocode via Mapbox
  const token = typeof MAPBOX_TOKEN !== 'undefined' ? MAPBOX_TOKEN : '';
  if (!token) return;
  if (window._hsGeoCtrl) { try { window._hsGeoCtrl.abort(); } catch(e) {} }
  window._hsGeoCtrl = new AbortController();
  const bbox = fullMapProvince === 'BC' ? '-139.1,48.3,-114.0,60.1' : '-120.0,49.0,-110.0,60.0';
  fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&bbox=${bbox}&types=place,locality,neighborhood&limit=4&country=CA`, { signal: window._hsGeoCtrl.signal })
    .then(r => r.json())
    .then(data => {
      const cityRows = (data.features || []).map(f => ({ label: f.text || f.place_name, sub: f.place_name, badge: 'city', action: () => { if (typeof _searchFlyToCoords === 'function') _searchFlyToCoords(f.center, 10); } }));
      const rows = [...(window._hsSearchRows || []), ...cityRows].slice(0, 8);
      window._hsSearchRows = rows;
      _hsRenderSearchResults(rows);
    })
    .catch(() => {});
}

function _hsRenderSearchResults(rows) {
  const box = document.getElementById('hsSearchResults');
  if (!box) return;
  box.innerHTML = rows.length
    ? rows.map((r, i) => `
        <div class="hs-search-result" onclick="hsPickSearch(${i})">
          <div>
            <div class="hs-search-result-name">${r.label}</div>
            <div class="hs-search-result-sub">${r.sub}</div>
          </div>
          <span class="hs-search-badge ${r.badge}">${r.badge === 'wmu' ? 'WMU' : 'City'}</span>
        </div>`).join('')
    : '';
}

function hsPickSearch(i) {
  const row = (window._hsSearchRows || [])[i];
  if (!row) return;
  row.action();
  hsCloseModal();
}

// ── LEH modal HTML ──
function _hsLEHHTML() {
  if (fullMapProvince !== 'BC') {
    return `<div class="hs-modal-head"><span class="hs-modal-title">LEH zones</span><button type="button" class="hs-modal-close" onclick="hsCloseModal()">&#10005;</button></div><div class="hs-modal-note" style="border-color:rgba(240,180,41,.2);background:rgba(240,180,41,.06);color:#7a6030">LEH zone overlays are only available for British Columbia right now.</div>`;
  }
  if (!fullMapSelRegions || !fullMapSelRegions.size) {
    return `<div class="hs-modal-head"><span class="hs-modal-title">LEH zones</span><button type="button" class="hs-modal-close" onclick="hsCloseModal()">&#10005;</button></div><div class="hs-modal-note" style="border-color:rgba(240,180,41,.2);background:rgba(240,180,41,.06);color:#7a6030">Tap a WMU on the map first, then choose a species to show LEH zones.</div>`;
  }
  const species = typeof _lehSpeciesAvailableFromDraws === 'function' ? _lehSpeciesAvailableFromDraws([...fullMapSelRegions]) : [];
  const opts = ['<option value="">Select species</option>', ...species.map(sp => {
    const val = typeof _lehNormalizeSpecies === 'function' ? _lehNormalizeSpecies(sp) : sp;
    return `<option value="${val}"${_fullMapLEHSpecies === val ? ' selected' : ''}>${sp}</option>`;
  })].join('');
  return `
    <div class="hs-modal-head">
      <span class="hs-modal-title">LEH zones</span>
      <button type="button" class="hs-modal-close" onclick="hsCloseModal()">&#10005;</button>
    </div>
    <div class="hs-modal-section-label">Species</div>
    <select class="hs-leh-select" onchange="hsSetLEHSpecies(this.value)">${opts}</select>
    <div class="hs-modal-note">LEH zones appear on the map once a species is selected.</div>
  `;
}

function hsSetLEHSpecies(val) {
  if (typeof fullMapSetLEHSpecies === 'function') fullMapSetLEHSpecies(val);
  const modal = document.getElementById('hsModal');
  if (modal) modal.innerHTML = _hsLEHHTML();
  const railBtn = document.getElementById('hsRailLEH');
  if (railBtn) railBtn.classList.toggle('active', !!val);
}

// ── Cards drawer ──
function hsCardsToggle() {
  if (!fullMapMobileIsNarrow()) return;
  const drawer = document.getElementById('fullMapResultsDrawer');
  const body   = document.querySelector('.fullmap-body');
  const cluster = document.getElementById('hsBrCluster');
  if (!drawer) { hsOpenModal('leh'); return; }

  if (drawer.style.display === 'none' || !drawer.style.display) {
    // Open: show drawer, reflow map, hide zoom cluster
    fullMapShowResults && fullMapShowResults();
    drawer.style.display = '';
    if (body) body.classList.add('drawer-open');
    if (cluster) cluster.classList.add('drawer-open');
    // Pulse the handle once
    const titleRow = drawer.querySelector('.fullmap-results-title-row');
    if (titleRow) { titleRow.classList.add('pulse'); setTimeout(() => titleRow.classList.remove('pulse'), 1400); }
  } else {
    // Close
    drawer.style.display = 'none';
    if (body) body.classList.remove('drawer-open');
    if (cluster) { cluster.classList.remove('drawer-open'); }
  }
  setTimeout(() => fullMapInstance && fullMapInstance.resize(), 60);
  _hsSyncCardsBtn();
}

// Swipe-up on zone pill opens cards
let _hsSwipeStartY = 0;
function _hsDrawerSwipeStart(e) {
  _hsSwipeStartY = e.touches[0].clientY;
  document.addEventListener('touchend', _hsDrawerSwipeEnd, { once: true, passive: true });
}
function _hsDrawerSwipeEnd(e) {
  const dy = _hsSwipeStartY - e.changedTouches[0].clientY;
  if (dy > 30) hsCardsToggle();
}

function _hsSyncCardsBtn() {
  const btn    = document.getElementById('hsRailCards');
  const drawer = document.getElementById('fullMapResultsDrawer');
  if (!btn) return;
  const open = drawer && drawer.style.display !== 'none' && drawer.style.display !== '';
  btn.classList.toggle('active', open);
}

// ── Public API — called by existing maps.js code ──
function fullMapMobileRefresh() {
  hsSync3DBtn();
  _hsSyncCardsBtn();
  if (fullMapMobileIsNarrow()) setTimeout(() => fullMapInstance && fullMapInstance.resize(), 60);
}

// Keep old fmMobileZonePill calls working (called from WMU click handlers)
function fullMapMobileUpdateStatus() { /* replaced by zone pill */ }
function fullMapMobileSyncToolState() { _hsSyncCardsBtn(); hsSync3DBtn(); }

// ── Init: called after map is ready ──
function hsRailBootstrap() {
  if (!fullMapMobileIsNarrow()) return;
  hsRailInit();
  // Sync species button text with current select value
  const sel = document.getElementById('fullMapSpeciesSelect');
  const btnText = document.getElementById('hsSpeciesBtnText');
  if (sel && btnText) btnText.textContent = sel.options[sel.selectedIndex]?.text || 'All species';
  // Keep in sync when province/species changes
  if (sel) sel.addEventListener('change', () => {
    const t = document.getElementById('hsSpeciesBtnText');
    if (t) t.textContent = sel.options[sel.selectedIndex]?.text || 'All species';
  });
}

window.addEventListener('resize', () => fullMapMobileRefresh());


// ── MAIN MAP V3 floating control helpers ─────────────────────
function fullMapZoomIn() {
  if (fullMapInstance) fullMapInstance.zoomIn({ duration: 250 });
}
function fullMapZoomOut() {
  if (fullMapInstance) fullMapInstance.zoomOut({ duration: 250 });
}
function fullMapResetNorth() {
  if (!fullMapInstance) return;
  fullMapInstance.easeTo({ bearing: 0, pitch: _fullMapTerrain3D ? 58 : 0, duration: 500 });
}
function fullMapOpenBasemapPanel() {
  const panel = document.getElementById('fullMapBasemapPanel');
  if (!panel) return;
  panel.style.display = panel.style.display === 'none' || !panel.style.display ? 'block' : 'none';
  fullMapSyncBasemapPanel();
}
function fullMapCloseBasemapPanel() {
  const panel = document.getElementById('fullMapBasemapPanel');
  if (panel) panel.style.display = 'none';
}
function fullMapSet3D(on) {
  const want = !!on;
  if (_fullMapTerrain3D !== want) fullMapToggle3D();
  else fullMapSyncBasemapPanel();
}
function fullMapSyncBasemapPanel() {
  ['streets','satellite','topo'].forEach(t => {
    const btn = document.getElementById('fullMapTile_' + t);
    if (btn) btn.classList.toggle('active', t === _fullMapStyle);
  });
  const b2 = document.getElementById('fullMap2DPanelBtn');
  const b3 = document.getElementById('fullMap3DPanelBtn');
  const mb2 = document.getElementById('fullMapMap2DBtn');
  const mb3 = document.getElementById('fullMapMap3DBtn');
  if (b2) b2.classList.toggle('active', !_fullMapTerrain3D);
  if (b3) b3.classList.toggle('active', _fullMapTerrain3D);
  if (mb2) mb2.classList.toggle('active', !_fullMapTerrain3D);
  if (mb3) mb3.classList.toggle('active', _fullMapTerrain3D);
}

// Keep the custom basemap panel in sync whenever existing controls change state.
(function fullMapV3SyncHooks(){
  const oldTile = window.fullMapSetTile || fullMapSetTile;
  if (oldTile && !oldTile._v3Wrapped) {
    const wrapped = function(type) {
      const result = oldTile.apply(this, arguments);
      setTimeout(fullMapSyncBasemapPanel, 0);
      return result;
    };
    wrapped._v3Wrapped = true;
    window.fullMapSetTile = wrapped;
    fullMapSetTile = wrapped;
  }
  const old3D = window.fullMapToggle3D || fullMapToggle3D;
  if (old3D && !old3D._v3Wrapped) {
    const wrapped3D = function() {
      const result = old3D.apply(this, arguments);
      setTimeout(fullMapSyncBasemapPanel, 0);
      return result;
    };
    wrapped3D._v3Wrapped = true;
    window.fullMapToggle3D = wrapped3D;
    fullMapToggle3D = wrapped3D;
  }
})();

// Main Map V6.9 — preserve camera on basemap change. Do not reset selected WMU/species/view.
(function(){
  if (typeof fullMapSetTile !== 'function') return;
  const patched = function(type){
    if (!_MB_STYLES[type] || !fullMapInstance) return;
    _fullMapStyle = type;
    try { _syncTileButtons(); } catch(e) {}
    try { fullMapMobileRefresh(); } catch(e) {}
    const camera = {
      center: fullMapInstance.getCenter(),
      zoom: fullMapInstance.getZoom(),
      bearing: fullMapInstance.getBearing(),
      pitch: fullMapInstance.getPitch()
    };
    const was3d = !!_fullMapTerrain3D;
    fullMapInstance.setStyle(_MB_STYLES[type]);
    fullMapInstance.once('style.load', () => {
      try { _reAddWMULayers(); } catch(e) {}
      try { if (_fullMapLEHVisible) _reAddLEHLayer(); } catch(e) {}
      try { fullMapInstance.jumpTo(camera); } catch(e) {}
      try {
        if (was3d) _applyTerrain(true);
        else { fullMapInstance.setTerrain(null); if (fullMapInstance.getLayer('sky')) fullMapInstance.removeLayer('sky'); }
      } catch(e) {}
      try { fullMapSyncBasemapPanel(); } catch(e) {}
    });
  };
  window.fullMapSetTile = patched;
  try { fullMapSetTile = patched; } catch(e) {}
})();


// V7.8 Map tab return context wrappers for draw detail
window.openBCDrawDetailFromMap = function(code, mu) {
  window.__drawDetailReturnPage = 'map';
  window.__drawDetailReturnState = { province: fullMapProvince, species: fullMapSelectedSpecies, wmus: [...fullMapSelRegions] };
  if (typeof openDrawDetailByKey === 'function') openDrawDetailByKey(code, mu);
};
window.openABDrawDetailFromMap = function(draw, wmu) {
  window.__drawDetailReturnPage = 'map';
  window.__drawDetailReturnState = { province: fullMapProvince, species: fullMapSelectedSpecies, wmus: [...fullMapSelRegions] };
  if (typeof openABDrawDetailByKey === 'function') openABDrawDetailByKey(draw, wmu);
};

// V8.4 — mobile 3D toggle sync + default 2D safety
(function(){
  function syncSingle3DButton(){
    try {
      const btn = document.getElementById('fullMapMap3DToggleBtn');
      if (btn) {
        btn.classList.toggle('active', !!_fullMapTerrain3D);
        btn.textContent = _fullMapTerrain3D ? '2D' : '3D';
        btn.setAttribute('aria-label', _fullMapTerrain3D ? 'Switch to 2D map' : 'Switch to 3D terrain');
      }
      const old2 = document.getElementById('fullMapMap2DBtn');
      const old3 = document.getElementById('fullMapMap3DBtn');
      if (old2) old2.classList.toggle('active', !_fullMapTerrain3D);
      if (old3) old3.classList.toggle('active', _fullMapTerrain3D);
    } catch(e) {}
  }
  window.fullMapSyncSingle3DButton = syncSingle3DButton;

  const prevSync = window.fullMapSyncBasemapPanel || (typeof fullMapSyncBasemapPanel === 'function' ? fullMapSyncBasemapPanel : null);
  if (prevSync && !prevSync._v84Single3D) {
    const wrappedSync = function(){
      const r = prevSync.apply(this, arguments);
      syncSingle3DButton();
      return r;
    };
    wrappedSync._v84Single3D = true;
    window.fullMapSyncBasemapPanel = wrappedSync;
    try { fullMapSyncBasemapPanel = wrappedSync; } catch(e) {}
  }

  const prevToggle = window.fullMapToggle3D || (typeof fullMapToggle3D === 'function' ? fullMapToggle3D : null);
  if (prevToggle && !prevToggle._v84Single3D) {
    const wrappedToggle = function(){
      const r = prevToggle.apply(this, arguments);
      setTimeout(syncSingle3DButton, 0);
      return r;
    };
    wrappedToggle._v84Single3D = true;
    window.fullMapToggle3D = wrappedToggle;
    try { fullMapToggle3D = wrappedToggle; } catch(e) {}
  }

  const prevSet3D = window.fullMapSet3D || (typeof fullMapSet3D === 'function' ? fullMapSet3D : null);
  if (prevSet3D && !prevSet3D._v84Single3D) {
    const wrappedSet = function(on){
      const r = prevSet3D.apply(this, arguments);
      setTimeout(syncSingle3DButton, 0);
      return r;
    };
    wrappedSet._v84Single3D = true;
    window.fullMapSet3D = wrappedSet;
    try { fullMapSet3D = wrappedSet; } catch(e) {}
  }

  // Mobile should always enter the Map tab flat/2D unless the user presses 3D.
  const prevInit = window.fullMapInit || (typeof fullMapInit === 'function' ? fullMapInit : null);
  if (prevInit && !prevInit._v84Default2D) {
    const wrappedInit = function(){
      if (window.matchMedia && window.matchMedia('(max-width: 820px)').matches) _fullMapTerrain3D = false;
      const r = prevInit.apply(this, arguments);
      setTimeout(syncSingle3DButton, 120);
      return r;
    };
    wrappedInit._v84Default2D = true;
    window.fullMapInit = wrappedInit;
    try { fullMapInit = wrappedInit; } catch(e) {}
  }

  document.addEventListener('DOMContentLoaded', syncSingle3DButton);
  setTimeout(syncSingle3DButton, 400);
})();


(function(){
  if(window.__hsMobileRail)return;
  window.__hsMobileRail=true;
  var $=function(id){return document.getElementById(id);};
  var mob=function(){return window.innerWidth<=768;};
  function resize(){try{if(window.fullMapInstance&&fullMapInstance.resize)fullMapInstance.resize();}catch(e){}}
  function boot(){
    if(!mob())return;
    var prov=(typeof fullMapProvince!=='undefined')?fullMapProvince:'BC';
    _sp(prov);
    var sel=$('fullMapSpeciesSelect');
    if(sel){_st(sel);if(!sel._hl){sel._hl=1;sel.addEventListener('change',function(){_st(sel);});}}
    _s3();_wd();
    setTimeout(resize,80);setTimeout(resize,300);setTimeout(resize,700);setTimeout(resize,1500);
  }
  function _st(sel){var t=$('hsSpeciesBtnText');if(t)t.textContent=(sel.options[sel.selectedIndex]?sel.options[sel.selectedIndex].text:null)||'All species';}
  function _sp(prov){
    var bc=$('hsTpBC'),ab=$('hsTpAB');if(!bc||!ab)return;
    bc.className=prov==='BC'?'hs-tp-pill hs-tp-active':'hs-tp-pill hs-tp-dim';
    ab.className=prov==='AB'?'hs-tp-pill hs-tp-active':'hs-tp-pill hs-tp-dim';
  }
  var _op=window.fullMapSetProvince;
  window.fullMapSetProvince=function(p){if(_op)_op(p);_sp(p);};
  window.hsToggleSpeciesDrop=function(){
    var d=$('hsSpeciesDrop');if(!d)return;
    if(d.style.display==='block'){d.style.display='none';return;}
    var sel=$('fullMapSpeciesSelect');if(!sel)return;
    var h='';
    Array.from(sel.children).forEach(function(c){
      if(c.tagName==='OPTGROUP'){h+='<div class="hs-species-group">'+c.label+'</div>';Array.from(c.children).forEach(function(o){h+='<div class="hs-species-row'+(o.value===sel.value?' hs-active':'')+'" onclick="hsPick(\''+o.value.replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\',this)">'+o.text+'</div>';});}
      else{h+='<div class="hs-species-row'+(c.value===sel.value?' hs-active':'')+'" onclick="hsPick(\''+c.value.replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\',this)">'+c.text+'</div>';}
    });
    d.innerHTML=h;d.style.display='block';
    setTimeout(function(){document.addEventListener('touchstart',function(e){var dd=$('hsSpeciesDrop'),bb=$('hsSpeciesBtn');if(dd&&bb&&!dd.contains(e.target)&&!bb.contains(e.target))dd.style.display='none';},{once:true,passive:true});},50);
  };
  window.hsPick=function(val,row){
    var sel=$('fullMapSpeciesSelect');if(sel){sel.value=val;sel.dispatchEvent(new Event('change',{bubbles:true}));}
    var t=$('hsSpeciesBtnText');if(t)t.textContent=row.textContent||'All species';
    var d=$('hsSpeciesDrop');if(d)d.style.display='none';
  };
  window.fullMapMobileShowZonePill=function(name,sub){
    if(!mob())return;
    var pill=$('hsZonePill'),nm=$('hsZonePillName'),dv=$('hsZonePillDiv'),sb=$('hsZonePillSub');
    if(!pill||!nm)return;
    pill.classList.remove('hs-hiding');nm.textContent=name||'';
    if(sub){if(dv)dv.style.display='';if(sb)sb.textContent=sub;}
    else{if(dv)dv.style.display='none';if(sb)sb.textContent='';}
    pill.style.display='flex';
  };
  window.fullMapMobileHideZonePill=function(){
    var pill=$('hsZonePill');if(!pill||pill.style.display==='none')return;
    pill.classList.add('hs-hiding');setTimeout(function(){pill.style.display='none';pill.classList.remove('hs-hiding');},160);
  };
  window.fullMapMobileUpdateStatus=function(){};
  window.fullMapMobileSyncToolState=function(){_s3();_sc();};
  window.fullMapMobileRefresh=function(){if(mob()){_s3();_sc();resize();}};
  window.hsToggle3D=function(){if(typeof fullMapToggle3D==='function')fullMapToggle3D();_s3();};
  function _s3(){
    var btn=$('hs3DBtn'),lbl=$('hs3DLabel');if(!btn||!lbl)return;
    var is=!!(typeof _fullMapTerrain3D!=='undefined'&&_fullMapTerrain3D);
    lbl.textContent=is?'2D':'3D';btn.classList.toggle('hs-active',is);
  }
  window.hsOpenModal=function(type){
    if(!mob())return;
    var sc=$('hsScrim'),mo=$('hsModal');if(!sc||!mo)return;
    ['hsRbLayers','hsRbSearch','hsRbCards','hsRbLEH'].forEach(function(id){var b=$(id);if(b)b.classList.remove('hs-active');});
    var map={layers:'hsRbLayers',search:'hsRbSearch',leh:'hsRbLEH'};
    if(map[type]){var b=$(map[type]);if(b)b.classList.add('hs-active');}
    if(type==='layers')mo.innerHTML=_lh();
    if(type==='search')mo.innerHTML=_sh();
    if(type==='leh')mo.innerHTML=_eh();
    sc.classList.add('hs-open');sc.style.cssText='display:flex!important';
    if(type==='search')setTimeout(function(){var i=$('hsSearchInput');if(i)i.focus();},80);
  };
  (function(){function f(){var s=document.getElementById('hsScrim');if(s&&!s.classList.contains('hs-open'))s.style.cssText='display:none!important';}f();setTimeout(f,300);setTimeout(f,1000);document.addEventListener('DOMContentLoaded',f);})();
  window.hsCloseModal=function(){
    var sc=$('hsScrim');if(sc){sc.classList.remove('hs-open');sc.style.cssText='display:none!important';}
    ['hsRbLayers','hsRbSearch','hsRbLEH'].forEach(function(id){var b=$(id);if(b)b.classList.remove('hs-active');});
  };
  function _lh(){
    var s=(typeof _fullMapStyle!=='undefined'&&_fullMapStyle)||'streets';
    var i3=!!(typeof _fullMapTerrain3D!=='undefined'&&_fullMapTerrain3D);
    function B(l,c,on,f){return '<button type="button" class="hs-sc '+c+(on?' hs-on':'')+'" onclick="'+f+'">'+l+'</button>';}
    return '<div class="hs-mh"><span class="hs-mt">Map layers</span><button type="button" class="hs-mx" onclick="hsCloseModal()">&#10005;</button></div>'
      +'<div class="hs-ml">Map type</div><div class="hs-seg3">'+B('Streets','hs-mt-btn',s==='streets',"hsSetTile('streets')")+B('Satellite','hs-mt-btn',s==='satellite',"hsSetTile('satellite')")+B('Topo','hs-mt-btn',s==='topo',"hsSetTile('topo')")+'</div>'
      +'<div class="hs-ml">Mode</div><div class="hs-seg2">'+B('2D','hs-mode',!i3,"hsSet3D(false)")+B('3D','hs-mode',!!i3,"hsSet3D(true)")+'</div>'
      +'<div class="hs-ml">Overlay opacity</div>'
      +'<div class="hs-slider-row"><input type="range" min="0" max="100" value="75" oninput="var v=document.getElementById(\'hsOpV\');if(v)v.textContent=Math.round(this.value)+\'%\'"><span class="hs-sv" id="hsOpV">75%</span></div>';
  }
  window.hsSetTile=function(t){if(typeof fullMapSetTile==='function')fullMapSetTile(t);var m=$('hsModal');if(m)m.innerHTML=_lh();};
  window.hsSet3D=function(on){var cur=!!(typeof _fullMapTerrain3D!=='undefined'&&_fullMapTerrain3D);if(cur!==on&&typeof fullMapToggle3D==='function')fullMapToggle3D();_s3();var m=$('hsModal');if(m)m.innerHTML=_lh();};
  function _sh(){
    return '<div class="hs-mh"><span class="hs-mt">Search</span><button type="button" class="hs-mx" onclick="hsCloseModal()">&#10005;</button></div>'
      +'<div class="hs-sinwrap"><span class="hs-sico">&#8981;</span><input class="hs-sinput" id="hsSearchInput" type="text" placeholder="City, WMU, or coordinates\u2026" autocomplete="off" oninput="hsSearch(this.value)"></div>'
      +'<div id="hsSearchResults"></div>';
  }
  window.hsSearch=function(val){
    var box=$('hsSearchResults');if(!box)return;
    var q=(val||'').trim().toLowerCase();if(!q){box.innerHTML='';return;}
    var rows=[];
    try{var geo=window.bcWmuGeoJSON||window.BC_WMU_GEOJSON;(geo&&geo.features||[]).forEach(function(f){var id=f.properties.wmu_id||'';if(id.toLowerCase().indexOf(q)>=0)rows.push({label:'WMU '+id,sub:'BC Wildlife Unit',badge:'hs-badge-wmu',fly:function(){try{if(typeof _searchFlyToWMU_BC==='function')_searchFlyToWMU_BC(id,f);}catch(e){}}});});}catch(e){}
    window._hsRows=rows.slice(0,5);_rr(window._hsRows);
    var tok=typeof MAPBOX_TOKEN!=='undefined'?MAPBOX_TOKEN:'';if(!tok)return;
    if(window._hsGC){try{window._hsGC.abort();}catch(e){}}window._hsGC=new AbortController();
    var bbox=(typeof fullMapProvince!=='undefined'&&fullMapProvince==='AB')?'-120,49,-110,60':'-139,48,-114,60';
    fetch('https://api.mapbox.com/geocoding/v5/mapbox.places/'+encodeURIComponent(val)+'.json?access_token='+tok+'&bbox='+bbox+'&types=place,locality&limit=3&country=CA',{signal:window._hsGC.signal})
      .then(function(r){return r.json();}).then(function(d){var cr=(d.features||[]).map(function(f){return{label:f.text||f.place_name,sub:f.place_name,badge:'hs-badge-city',fly:function(){try{if(typeof _searchFlyToCoords==='function')_searchFlyToCoords(f.center,10);}catch(e){}}};});var all=(window._hsRows||[]).concat(cr).slice(0,8);window._hsRows=all;_rr(all);}).catch(function(){});
  };
  function _rr(rows){var box=$('hsSearchResults');if(!box)return;box.innerHTML=rows.map(function(r,i){return '<div class="hs-sres" onclick="hsPickSearch('+i+'"><div><div class="hs-sres-name">'+r.label+'</div><div class="hs-sres-sub">'+r.sub+'</div></div><span class="hs-badge '+r.badge+'">'+(r.badge==='hs-badge-wmu'?'WMU':'City')+'</span></div>';}).join('');}
  window.hsPickSearch=function(i){var r=(window._hsRows||[])[i];if(r){r.fly();hsCloseModal();}};
  function _eh(){
    if(typeof fullMapProvince==='undefined'||fullMapProvince!=='BC')return '<div class="hs-mh"><span class="hs-mt">LEH zones</span><button type="button" class="hs-mx" onclick="hsCloseModal()">&#10005;</button></div><div class="hs-mnote hs-mnote-amber">LEH zones are only available for British Columbia.</div>';
    return '<div class="hs-mh"><span class="hs-mt">LEH zones</span><button type="button" class="hs-mx" onclick="hsCloseModal()">&#10005;</button></div>'
      +'<div class="hs-ml">Species</div><select class="hs-msel" onchange="if(typeof fullMapSetLEHSpecies===\'function\')fullMapSetLEHSpecies(this.value)"><option value="">Select species</option><option>Moose</option><option>Mule Deer</option><option>Elk</option><option>Sheep</option><option>Goat</option></select>'
      +'<div class="hs-mnote">LEH zones appear once a species is selected.</div>';
  }
  window.hsCardsToggle=function(){
    if(!mob())return;
    var drawer=$('fullMapResultsDrawer'),body=$('fullMapBody'),cluster=$('hsBrCluster'),btn=$('hsRbCards');
    if(!drawer)return;
    var open=drawer.classList.contains('hs-drawer-open');
    if(open){drawer.classList.remove('hs-drawer-open');if(body)body.classList.remove('hs-drawer-open');if(cluster)cluster.classList.remove('hs-hidden');if(btn)btn.classList.remove('hs-active');}
    else{if(typeof fullMapShowResults==='function')fullMapShowResults();drawer.classList.add('hs-drawer-open');if(body)body.classList.add('hs-drawer-open');if(cluster)cluster.classList.add('hs-hidden');if(btn)btn.classList.add('hs-active');setTimeout(resize,80);}
  };
  function _sc(){var drawer=$('fullMapResultsDrawer'),btn=$('hsRbCards');if(!btn)return;btn.classList.toggle('hs-active',!!(drawer&&drawer.classList.contains('hs-drawer-open')));}
  function _wd(){var d=$('fullMapResultsDrawer');if(!d||d._hw)return;d._hw=1;new MutationObserver(function(){_sc();}).observe(d,{attributes:true,attributeFilter:['class']});}
  setTimeout(boot,200);setTimeout(boot,700);
  window.addEventListener('resize',function(){if(mob()){boot();resize();}});
  document.addEventListener('visibilitychange',function(){if(!document.hidden&&mob()){setTimeout(boot,150);setTimeout(resize,300);}});
})();
