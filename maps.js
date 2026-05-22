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
  const hasDraws = AB_DATA.length === 0 || (_abWmuWithCards ? _abWmuWithCards.has(id) : AB_DATA.some(r => abCardMatchesWMU(r, id)));
  return {
    fillColor: isSelected ? '#4ade80' : abWmuFillColor(id),
    fillOpacity: isSelected ? 0.75 : hasDraws ? 0.38 : 0.15,
    color: isSelected ? '#ffffff' : '#1a1a1a',
    weight: isSelected ? 2.5 : 0.7,
    opacity: isSelected ? 1.0 : 0.75
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

    // Hide the scroll hint — no longer needed since zoom is always active
    const hint = document.getElementById('abMapScrollHint');
    if (hint) hint.style.display = 'none';

    // OpenStreetMap tile layer — same as albertahuntmap.ca
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '',
      subdomains: 'abc',
      maxZoom: 19
    }).addTo(abLeafletMapInstance);

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
            this.setStyle({ fillColor: '#ffffff', fillOpacity: 0.45, weight: 1.5, color: '#4ade80' });
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
  const hasDraws = DATA.length === 0 || DATA.some(r => bcMUMatchesPolygon(r.MU, id));
  return {
    fillColor:    isSelected ? '#4ade80' : bcWmuFillColor(id),
    fillOpacity:  isSelected ? 0.75 : hasDraws ? 0.38 : 0.15,
    color:        isSelected ? '#ffffff' : '#1a1a1a',
    weight:       isSelected ? 2.5 : 0.7,
    opacity:      isSelected ? 1.0 : 0.75
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
  return bcNormalizeMU(mu) === polygonId;
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

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '',
    subdomains: 'abc',
    maxZoom: 19
  }).addTo(bcLeafletMapInstance);

  var wmusWithDraws = new Set(DATA.map(function(r) { return bcNormalizeMU(r.MU); }));

  bcWmuGeoLayer = L.geoJSON(geojson, {
    style: function(feature) { return bcWmuGetStyle(feature, false); },
    onEachFeature: function(feature, layer) {
      var id = feature.properties.wmu_id || '';
      var hasDraws = wmusWithDraws.has(id);

      layer.on('mouseover', function(e) {
        var isSelected = selMUsFull.has(id);
        if (!isSelected) {
          this.setStyle({ fillColor: '#ffffff', fillOpacity: 0.45, weight: 1.5, color: '#4ade80' });
        } else {
          this.setStyle({ fillColor: '#4ade80', fillOpacity: 0.92, weight: 3, color: '#ffffff' });
        }
        var cardCount = isSelected
          ? filtered.filter(function(r) { return bcMUMatchesPolygon(r.MU, id); }).length
          : DATA.filter(function(r) {
              if (!bcMUMatchesPolygon(r.MU, id)) return false;
              if (selSpecies.size > 0 && !selSpecies.has(r.Species)) return false;
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
// ── FULL-PAGE MAP TAB (BC / AB toggle)
// ══════════════════════════════════════════════════════════════

let fullMapProvince   = 'BC';    // 'BC' | 'AB'
let fullMapInitialized = { BC: false, AB: false };
let fullMapInstance   = null;
let fullMapGeoLayer   = null;
let fullMapSelRegions = new Set();  // selected WMU IDs
let fullMapSortMode   = 'odds';

// ── Switch province ──
function fullMapSetProvince(prov) {
  if (fullMapProvince === prov) return;
  // Deactivate pin mode before switching (map gets destroyed)
  if (_pinModeActive) fullMapTogglePinMode();
  fullMapProvince = prov;
  fullMapSelRegions.clear();
  fullMapShowLEHForMUs([]);

  // Toggle button states
  document.getElementById('mapToggleBC').classList.toggle('active', prov === 'BC');
  document.getElementById('mapToggleAB').classList.toggle('active', prov === 'AB');

  // Destroy existing Leaflet map so it can reinitialise for the new province
  if (fullMapInstance) {
    fullMapInstance.remove();
    fullMapInstance = null;
    fullMapGeoLayer = null;
    // Clear the leaflet container so it can be reused
    const container = document.getElementById('fullMapLeaflet');
    if (container) { container.innerHTML = ''; delete container._leaflet_id; }
  }
  fullMapInitialized[prov] = false;

  // Hide results
  fullMapHideResults();
  fullMapUpdateChips();

  // Reinit
  fullMapInit();
}

// ── Called by showPage('map') ──
let _fullMapGateAttempts = 0;
function fullMapInit() {
  if (fullMapInitialized[fullMapProvince]) {
    setTimeout(() => fullMapInstance && fullMapInstance.invalidateSize(), 150);
    return;
  }

  const loading = document.getElementById('fullMapLoading');
  const txt     = document.getElementById('fullMapLoadingText');
  if (loading) loading.style.display = 'flex';
  if (txt) txt.textContent = `Loading ${fullMapProvince === 'BC' ? 'BC' : 'Alberta'} map…`;

  // Ensure Leaflet is loaded
  function doInit() {
    if (fullMapProvince === 'BC') {
      _fullMapInitBC();
    } else {
      _fullMapInitAB();
    }
  }

  if (typeof L !== 'undefined') {
    doInit();
  } else {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    script.onload = doInit;
    document.head.appendChild(script);
  }
}

// ── Full map tile layers & LEH overlay state ──
let _fullMapCurrentTile = 'streets';
let _fullMapTileLayers  = {};
let _fullMapLEHLayer    = null;
let _fullMapLEHVisible  = false;
let _fullMapLEHLoading  = false;

const _FULLMAP_TILES = {
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    opts: { attribution: '© <a href="https://openstreetmap.org/copyright">OSM</a>', subdomains: 'abc', maxZoom: 19 }
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    opts: { attribution: 'Esri World Imagery', maxZoom: 17 }
  },
  topo: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    opts: { attribution: 'Esri World Topo', maxZoom: 17 }
  }
};

// ── Switch tile layer on the full map ──
function fullMapSetTile(type) {
  if (!fullMapInstance) return;
  if (_fullMapCurrentTile === type) return;
  if (_fullMapTileLayers[_fullMapCurrentTile]) {
    fullMapInstance.removeLayer(_fullMapTileLayers[_fullMapCurrentTile]);
  }
  if (!_fullMapTileLayers[type]) {
    const t = _FULLMAP_TILES[type];
    _fullMapTileLayers[type] = L.tileLayer(t.url, t.opts);
  }
  _fullMapTileLayers[type].addTo(fullMapInstance);
  // Ensure WMU layer stays on top
  if (fullMapGeoLayer) fullMapGeoLayer.bringToFront();
  if (_fullMapLEHLayer) _fullMapLEHLayer.bringToFront();
  _fullMapCurrentTile = type;
  // Sync pill buttons
  ['streets','satellite','topo'].forEach(t => {
    const btn = document.getElementById('fullMapTile_' + t);
    if (btn) btn.classList.toggle('active', t === type);
  });
}


// ══════════════════════════════════════════════════════
// ── PIN SYSTEM ──────────────────────────────────────
// ══════════════════════════════════════════════════════

const PIN_CATS = [
  { id: 'camp',    label: '⛺ Camp',     color: '#f0b429' },
  { id: 'glassing',label: '🔭 Glassing', color: '#60a5fa' },
  { id: 'access',  label: '🛻 Access',   color: '#4ade80' },
  { id: 'sighting',label: '🦌 Sighting', color: '#f87171' },
  { id: 'waypoint',label: '📍 Waypoint', color: '#c084fc' },
];

let _pinModeActive  = false;
let _pinMapClickFn  = null;  // stored so we can remove it

// Load pins from localStorage
function _pinsLoad(province) {
  try {
    return JSON.parse(localStorage.getItem('hs_pins_' + province) || '[]');
  } catch { return []; }
}

function _pinsSave(province, pins) {
  try { localStorage.setItem('hs_pins_' + province, JSON.stringify(pins)); } catch {}
}

function _pinNextId() {
  return 'p' + Date.now() + Math.random().toString(36).slice(2, 6);
}

// ── Build a custom Leaflet DivIcon for a pin ──
function _pinIcon(cat) {
  const c = PIN_CATS.find(p => p.id === cat) || PIN_CATS[4];
  return L.divIcon({
    className: '',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
    html: `<div style="
      width:28px;height:36px;display:flex;align-items:center;justify-content:center;
      filter:drop-shadow(0 2px 6px rgba(0,0,0,.7));
    ">
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
          fill="${c.color}" stroke="rgba(0,0,0,.4)" stroke-width="1.5"/>
        <circle cx="14" cy="14" r="6" fill="rgba(0,0,0,.35)"/>
      </svg>
    </div>`
  });
}

// ── Render popup HTML for a pin ──
function _pinPopupHTML(pin) {
  const catBtns = PIN_CATS.map(c => {
    const active = pin.cat === c.id;
    return `<button class="hs-pin-cat-btn"
      style="background:${active ? c.color + '33' : 'transparent'};
             border-color:${active ? c.color : '#333'};
             color:${active ? c.color : '#666'};"
      onclick="hsPinSetCat('${pin.id}','${c.id}')">${c.label}</button>`;
  }).join('');

  return `<div class="hs-pin-popup-inner">
    <div class="hs-pin-popup-label">
      <span id="hsPinIcon_${pin.id}">${PIN_CATS.find(p=>p.id===pin.cat)?.label || '📍'}</span>
    </div>
    <div class="hs-pin-popup-coords">${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}</div>
    <input class="hs-pin-popup-input" id="hsPinLabel_${pin.id}"
      value="${pin.label || ''}" placeholder="Add a label…"
      oninput="hsPinUpdateLabel('${pin.id}',this.value)"
    />
    <div class="hs-pin-popup-cats">${catBtns}</div>
    <div class="hs-pin-popup-actions">
      <button class="hs-pin-action-btn hs-pin-save-btn" onclick="hsPinSaveClose('${pin.id}')">✓ Save</button>
      <button class="hs-pin-action-btn hs-pin-del-btn"  onclick="hsPinDelete('${pin.id}')">✕ Delete</button>
    </div>
  </div>`;
}

// ── Global refs: id → { marker, pin } ──
const _pinMarkers = {};  // province-keyed: { BC: {id:{marker,pin}}, AB: {...} }

function _pinMarkersForProv() {
  const p = fullMapProvince || 'BC';
  if (!_pinMarkers[p]) _pinMarkers[p] = {};
  return _pinMarkers[p];
}

// ── Add a single pin marker to the map ──
function _pinAddMarker(pin) {
  if (!fullMapInstance) return;
  const marker = L.marker([pin.lat, pin.lng], {
    icon: _pinIcon(pin.cat),
    zIndexOffset: 1000,
    draggable: true,
  });

  marker.bindPopup(_pinPopupHTML(pin), {
    className: 'hs-pin-popup',
    maxWidth: 240,
    minWidth: 210,
  });

  // Update position in storage when dragged
  marker.on('dragend', function() {
    const ll = this.getLatLng();
    pin.lat = +ll.lat.toFixed(6);
    pin.lng = +ll.lng.toFixed(6);
    _pinPersist();
    // Refresh popup with new coords
    marker.setPopupContent(_pinPopupHTML(pin));
  });

  marker.addTo(fullMapInstance);
  _pinMarkersForProv()[pin.id] = { marker, pin };
}

// ── Load & render all saved pins for current province ──
function _pinLoadAndRender() {
  const prov = fullMapProvince || 'BC';
  const pins = _pinsLoad(prov);
  pins.forEach(p => _pinAddMarker(p));
}

// ── Persist current province's pins ──
function _pinPersist() {
  const prov = fullMapProvince || 'BC';
  const markers = _pinMarkersForProv();
  const pins = Object.values(markers).map(m => m.pin);
  _pinsSave(prov, pins);
}

// ── Toggle pin drop mode ──
function fullMapTogglePinMode() {
  _pinModeActive = !_pinModeActive;
  const btn     = document.getElementById('fullMapPinBtn');
  const mapEl   = document.getElementById('fullMapLeaflet');

  if (_pinModeActive) {
    btn && btn.classList.add('active');
    btn && (btn.textContent = '📍 Pinning…');
    mapEl && mapEl.classList.add('pin-mode-cursor');

    // Register map click
    _pinMapClickFn = function(e) {
      if (!_pinModeActive) return;
      const pin = {
        id:    _pinNextId(),
        lat:   +e.latlng.lat.toFixed(6),
        lng:   +e.latlng.lng.toFixed(6),
        label: '',
        cat:   'waypoint',
      };
      _pinAddMarker(pin);
      _pinPersist();
      // Open popup immediately
      const ref = _pinMarkersForProv()[pin.id];
      if (ref) ref.marker.openPopup();
    };
    fullMapInstance && fullMapInstance.on('click', _pinMapClickFn);
  } else {
    btn && btn.classList.remove('active');
    btn && (btn.textContent = '📍 Pins');
    mapEl && mapEl.classList.remove('pin-mode-cursor');
    if (_pinMapClickFn && fullMapInstance) {
      fullMapInstance.off('click', _pinMapClickFn);
      _pinMapClickFn = null;
    }
  }
}

// ── Public callbacks called from popup HTML ──
window.hsPinUpdateLabel = function(id, val) {
  const ref = _pinMarkersForProv()[id];
  if (!ref) return;
  ref.pin.label = val;
};

window.hsPinSetCat = function(id, catId) {
  const ref = _pinMarkersForProv()[id];
  if (!ref) return;
  ref.pin.cat = catId;
  ref.marker.setIcon(_pinIcon(catId));
  ref.marker.setPopupContent(_pinPopupHTML(ref.pin));
};

window.hsPinSaveClose = function(id) {
  _pinPersist();
  const ref = _pinMarkersForProv()[id];
  if (ref) ref.marker.closePopup();
};

window.hsPinDelete = function(id) {
  const ref = _pinMarkersForProv()[id];
  if (!ref) return;
  ref.marker.closePopup();
  fullMapInstance && fullMapInstance.removeLayer(ref.marker);
  delete _pinMarkersForProv()[id];
  _pinPersist();
};

// ── LEH species colours ──
const _LEH_COLORS = {
  'MOUNTAIN SHEEP':    '#f0b429',
  'MOUNTAIN GOAT':     '#a78bfa',
  'MOOSE':             '#34d399',
  'ELK':               '#f87171',
  'CARIBOU':           '#60a5fa',
  'BLACK BEAR':        '#fb923c',
  'MULE DEER':         '#a3e635',
  'WHITE-TAILED DEER': '#e879f9',
  'BISON':             '#fbbf24',
  'TURKEY':            '#94a3b8',
};

// Cached zone data once loaded — { zones: {id: zone}, mu_index: {mu: [zoneIds]} }
let _lehZonesCache = null;

function _lehGetZones() {
  if (_lehZonesCache) return Promise.resolve(_lehZonesCache);
  return fetch('leh_zones.json')
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(d => { _lehZonesCache = d; return d; });
}

// Resolve the best matching zone ID for a draw card
// mu: raw MU string from draws.json (e.g. "1-09", "6-20")
// zone: zone letter possibly with modifiers (e.g. "A*", "B***")
// speciesType: "MOUNTAIN SHEEP" etc.
function _lehFindZoneId(zones, muIndex, mu, zone, speciesType) {
  const LEH_PREFIX = {
    'MOUNTAIN SHEEP':'S','MOUNTAIN GOAT':'G','MOOSE':'M','ELK':'E',
    'CARIBOU':'C','BLACK BEAR':'U','MULE DEER':'D','WHITE-TAILED DEER':'W',
    'BISON':'B','TURKEY':'T'
  };
  const prefix = LEH_PREFIX[speciesType] || '';
  // Strip trailing * + modifiers from MU, keep leading zeros
  const cleanMU = mu.replace(/[\*\+]+$/, '').trim();
  // Strip non-alpha from zone letter
  const cleanZone = zone.replace(/[^A-Za-z]/g, '');

  // Get all zone IDs for this MU from the index
  const candidates = (muIndex[cleanMU] || []);

  // 1. Exact: prefix + MU + zone (e.g. "E_7-20A")
  if (cleanZone) {
    const exact = candidates.find(id => id === prefix + '_' + cleanMU + cleanZone);
    if (exact) return exact;
    // Also try against multi-MU zone IDs that contain this MU
    const multiExact = candidates.find(id => {
      if (!id.startsWith(prefix + '_')) return false;
      const zLetter = id.replace(/^[A-Z]_[^A-Z]+/, ''); // last char(s) = zone letter
      return zLetter === cleanZone;
    });
    if (multiExact) return multiExact;
  }

  // 2. Species + MU no zone (e.g. "E_7-20")
  const noZone = candidates.find(id => id === prefix + '_' + cleanMU);
  if (noZone) return noZone;

  // 3. Any zone for this MU + species prefix
  const anyZone = candidates.find(id => id.startsWith(prefix + '_'));
  if (anyZone) return anyZone;

  return null;
}

// ── Show LEH zones for a specific set of MUs ──
// Called automatically when user selects region(s) on the map.
// muSet: Set or Array of MU id strings e.g. ['3-17']
function fullMapShowLEHForMUs(muSet) {
  if (!fullMapInstance) return;

  // Remove existing LEH layer
  if (_fullMapLEHLayer) {
    fullMapInstance.removeLayer(_fullMapLEHLayer);
    _fullMapLEHLayer = null;
  }

  const mus = new Set(muSet);
  if (mus.size === 0) {
    _fullMapLEHVisible = false;
    _updateLEHPill();
    return;
  }

  const btn = document.getElementById('fullMapLEHToggle');

  _lehGetZones().then(data => {
    const zones   = data.zones    || data;
    const muIndex = data.mu_index || {};
    // Collect all zone IDs for the selected MUs (via mu_index for multi-MU zone support)
    const zoneIds = new Set();
    for (const mu of mus) {
      const cleanMU = mu.replace(/[\*\+]+$/, '').trim();
      (muIndex[cleanMU] || []).forEach(id => zoneIds.add(id));
    }
    const features = [...zoneIds]
      .filter(id => zones[id])
      .map(id => {
        const z = zones[id];
        return { type: 'Feature', properties: { id, label: z.lb, zt: z.zt, mu: z.mu }, geometry: z.g };
      });

    if (features.length === 0) return;

    _fullMapLEHLayer = L.geoJSON(
      { type: 'FeatureCollection', features },
      {
        style: feat => {
          const col = _LEH_COLORS[feat.properties.zt] || '#888';
          return { color: col, weight: 1.5, opacity: 0.85, fillColor: col, fillOpacity: 0.12 };
        },
        onEachFeature: (feat, layer) => {
          const col = _LEH_COLORS[feat.properties.zt] || '#888';
          layer.bindTooltip(
            `<b style="color:${col}">${feat.properties.label}</b><br><span style="font-size:10px;color:#aaa">${feat.properties.zt} · MU ${feat.properties.mu}</span>`,
            { sticky: true, direction: 'top', className: 'leh-card-tip', offset: [0,-4] }
          );
        }
      }
    );

    if (_fullMapLEHVisible) {
      _fullMapLEHLayer.addTo(fullMapInstance);
      if (fullMapGeoLayer) fullMapGeoLayer.bringToFront();
    }
    _updateLEHPill();
  }).catch(err => console.error('[LEH overlay]', err));
}

// ── Toggle LEH visibility on/off (pill button) ──

// ── Map fullscreen expand / collapse ──
let _fullMapIsFullscreen = false;

function fullMapToggleFullscreen() {
  const page = document.querySelector('.fullmap-page');
  const btn  = document.getElementById('fullMapExpandBtn');
  if (!page || !btn) return;

  _fullMapIsFullscreen = !_fullMapIsFullscreen;

  if (_fullMapIsFullscreen) {
    page.classList.add('is-fullscreen');
    btn.title     = 'Collapse map';
    btn.textContent = '✕';
    // Prevent body scroll while fullscreen
    document.body.style.overflow = 'hidden';
  } else {
    page.classList.remove('is-fullscreen');
    btn.title     = 'Expand map';
    btn.textContent = '⛶';
    document.body.style.overflow = '';
  }

  // Give Leaflet a tick to see its new size, then re-centre
  setTimeout(() => {
    if (fullMapInstance) {
      fullMapInstance.invalidateSize();
    }
  }, 50);
}

// Close fullscreen on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && _fullMapIsFullscreen) {
    fullMapToggleFullscreen();
  }
});

function fullMapToggleLEH() {
  if (_fullMapLEHLoading) return;
  _fullMapLEHVisible = !_fullMapLEHVisible;

  if (_fullMapLEHVisible) {
    // Show layer if it exists, otherwise trigger for current selection
    if (_fullMapLEHLayer) {
      _fullMapLEHLayer.addTo(fullMapInstance);
      if (fullMapGeoLayer) fullMapGeoLayer.bringToFront();
    } else if (fullMapSelRegions.size > 0) {
      fullMapShowLEHForMUs([...fullMapSelRegions]);
      return; // _updateLEHPill called inside
    }
  } else {
    if (_fullMapLEHLayer) fullMapInstance.removeLayer(_fullMapLEHLayer);
  }
  _updateLEHPill();
}

function _updateLEHPill() {
  const btn = document.getElementById('fullMapLEHToggle');
  if (!btn) return;
  const hasZones = _fullMapLEHLayer !== null;
  if (_fullMapLEHVisible && hasZones) {
    btn.classList.add('active');
    btn.textContent = 'LEH Zones ✓';
  } else if (!_fullMapLEHVisible) {
    btn.classList.remove('active');
    btn.textContent = 'LEH Zones';
  } else {
    // visible=true but no zones loaded yet (no selection)
    btn.classList.remove('active');
    btn.textContent = 'LEH Zones';
  }
}

// ── Build Leaflet map ──
function _fullMapBuildBase(center, zoom, bounds) {
  const container = document.getElementById('fullMapLeaflet');
  if (!container) return null;
  if (container._leaflet_id) { container.innerHTML = ''; delete container._leaflet_id; }

  // Reset tile/LEH state when rebuilding
  _fullMapTileLayers = {};
  _fullMapLEHLayer = null;
  _fullMapLEHVisible = true;  // zones auto-show when a region is selected
  _fullMapCurrentTile = 'streets';

  const map = L.map('fullMapLeaflet', {
    center, zoom, minZoom: 4, maxZoom: 13,
    zoomControl: true, scrollWheelZoom: true, touchZoom: true
  });

  // Default streets tile
  const t = _FULLMAP_TILES.streets;
  _fullMapTileLayers.streets = L.tileLayer(t.url, t.opts).addTo(map);

  if (bounds) map.fitBounds(bounds);
  return map;
}

// ── BC MAP ──
function _fullMapInitBC() {
  fullMapInitialized['BC'] = true;
  fullMapInstance = _fullMapBuildBase([54.0, -124.0], 5, [[48.3, -139.0],[60.0,-114.0]]);
  if (!fullMapInstance) return;

  function render(geojson) {
    bcWmuGeoJSON = bcWmuGeoJSON || geojson;
    fullMapGeoLayer = L.geoJSON(geojson, {
      style: feature => _fullMapBCStyle(feature, false),
      onEachFeature: (feature, layer) => {
        const id = feature.properties.wmu_id || '';
        const hasDraws = DATA.some(r => bcMUMatchesPolygon(r.MU, id));

        layer.on('mouseover', function(e) {
          const sel = fullMapSelRegions.has(id);
          this.setStyle(sel
            ? { fillColor:'#4ade80', fillOpacity:0.92, weight:3, color:'#fff' }
            : { fillColor:'#fff',    fillOpacity:0.4,  weight:1.5, color:'#4ade80' });
          const cnt = DATA.filter(r => bcMUMatchesPolygon(r.MU, id)).length;
          this.bindTooltip(
            `<b style="color:#4ade80">WMU ${id}</b><br><span style="font-size:11px;color:#aaa">${cnt || 'No'} draw${cnt!==1?'s':''}</span>`,
            { sticky:true, direction:'top', offset:[0,-4], opacity:1, className:'ab-wmu-tip' }
          ).openTooltip(e.latlng);
        });
        layer.on('mouseout', function() {
          this.setStyle(_fullMapBCStyle(feature, fullMapSelRegions.has(id)));
          this.closeTooltip();
        });
        layer.on('click', function() {
          if (!hasDraws) return;
          if (fullMapSelRegions.has(id)) fullMapSelRegions.delete(id);
          else fullMapSelRegions.add(id);
          fullMapRefreshStyles();
          fullMapUpdateChips();
          fullMapShowResults();
          // Auto-update LEH zone overlay for selected MUs
          fullMapShowLEHForMUs([...fullMapSelRegions]);
        });
      }
    }).addTo(fullMapInstance);

    const loading = document.getElementById('fullMapLoading');
    if (loading) loading.style.display = 'none';
    _pinLoadAndRender();
  }

  if (bcWmuGeoJSON) {
    render(bcWmuGeoJSON);
  } else {
    bcWmuGeoJSON = BC_WMU_GEOJSON;
    render(BC_WMU_GEOJSON);
  }
}

function _fullMapBCStyle(feature, isSelected) {
  const id = feature.properties.wmu_id || '';
  const hasDraws = DATA.length === 0 || DATA.some(r => bcMUMatchesPolygon(r.MU, id));
  return {
    fillColor:    isSelected ? '#4ade80' : bcWmuFillColor(id),
    fillOpacity:  isSelected ? 0.75 : hasDraws ? 0.38 : 0.15,
    color:        isSelected ? '#ffffff' : '#1a1a1a',
    weight:       isSelected ? 2.5 : 0.7,
    opacity:      isSelected ? 1.0 : 0.75
  };
}

// ── AB MAP ──
function _fullMapInitAB() {
  fullMapInitialized['AB'] = true;

  async function build() {
    // Make sure AB data is loaded before rendering tooltips
    await Promise.all([loadABData(), loadABHarvest()]);

    fullMapInstance = _fullMapBuildBase([54.0, -115.0], 5, [[49.0,-120.0],[60.0,-110.0]]);
    if (!fullMapInstance) return;

    fullMapGeoLayer = L.geoJSON(AB_WMU_GEOJSON, {
      style: feature => _fullMapABStyle(feature, false),
      onEachFeature: (feature, layer) => {
        const id = String(feature.properties.WMUNIT_NUM || '');
        const allCards = buildABCards().filter(c => c !== null);
        const hasDraws = allCards.some(c => abCardMatchesWMU(c, id));

        layer.on('mouseover', function(e) {
          const sel = fullMapSelRegions.has(id);
          this.setStyle(sel
            ? { fillColor:'#4ade80', fillOpacity:0.92, weight:3, color:'#fff' }
            : { fillColor:'#fff',    fillOpacity:0.4,  weight:1.5, color:'#4ade80' });
          const cnt = allCards.filter(c => abCardMatchesWMU(c, id)).length;
          this.bindTooltip(
            `<b style="color:#4ade80">WMU ${id}</b><br><span style="font-size:11px;color:#aaa">${cnt || 'No'} draw${cnt!==1?'s':''}</span>`,
            { sticky:true, direction:'top', offset:[0,-4], opacity:1, className:'ab-wmu-tip' }
          ).openTooltip(e.latlng);
        });
        layer.on('mouseout', function() {
          this.setStyle(_fullMapABStyle(feature, fullMapSelRegions.has(id)));
          this.closeTooltip();
        });
        layer.on('click', function() {
          if (!hasDraws) return;
          if (fullMapSelRegions.has(id)) fullMapSelRegions.delete(id);
          else fullMapSelRegions.add(id);
          fullMapRefreshStyles();
          fullMapUpdateChips();
          fullMapShowResults();
          // Auto-update LEH zone overlay for selected MUs
          fullMapShowLEHForMUs([...fullMapSelRegions]);
        });
      }
    }).addTo(fullMapInstance);

    const loading = document.getElementById('fullMapLoading');
    if (loading) loading.style.display = 'none';
    _pinLoadAndRender();
  }

  build().catch(err => {
    console.error('[fullMap AB]', err);
    const l = document.getElementById('fullMapLoading');
    if (l) l.innerHTML = '<span style="color:#f87171;font-size:12px">Failed to load Alberta map.</span>';
  });
}

function _fullMapABStyle(feature, isSelected) {
  const id = String(feature.properties.WMUNIT_NUM || '');
  // reuse abWmuGetStyle if available, otherwise fallback
  if (typeof abWmuGetStyle === 'function') {
    const hasDraws = AB_DATA.length === 0 || (() => {
      const allCards = buildABCards().filter(c => c !== null);
      return allCards.some(c => abCardMatchesWMU(c, id));
    })();
    return {
      fillColor:    isSelected ? '#4ade80' : abWmuFillColor(id),
      fillOpacity:  isSelected ? 0.75 : hasDraws ? 0.38 : 0.15,
      color:        isSelected ? '#ffffff' : '#1a1a1a',
      weight:       isSelected ? 2.5 : 0.7,
      opacity:      isSelected ? 1.0 : 0.75
    };
  }
  return { fillColor: isSelected ? '#4ade80' : '#6aab76', fillOpacity: 0.4, color:'#1a1a1a', weight:0.7 };
}

// ── Refresh all layer styles ──
function fullMapRefreshStyles() {
  if (!fullMapGeoLayer) return;
  fullMapGeoLayer.eachLayer(layer => {
    const props = layer.feature.properties;
    const id = fullMapProvince === 'BC'
      ? (props.wmu_id || '')
      : String(props.WMUNIT_NUM || '');
    const styleFn = fullMapProvince === 'BC' ? _fullMapBCStyle : _fullMapABStyle;
    layer.setStyle(styleFn(layer.feature, fullMapSelRegions.has(id)));
  });
}

// ── Chips row ──
function fullMapUpdateChips() {
  const row = document.getElementById('fullMapChipsRow');
  if (!row) return;
  if (fullMapSelRegions.size === 0) {
    row.innerHTML = '<span style="font-size:11px;color:var(--text-muted)">No regions selected — showing all</span>';
    return;
  }
  const sorted = [...fullMapSelRegions].sort();
  row.innerHTML = sorted.map(id =>
    `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px 3px 10px;background:rgba(74,222,128,.15);border:1px solid rgba(74,222,128,.35);border-radius:12px;font-size:11px;font-weight:700;color:#4ade80;cursor:default">
      WMU&nbsp;${id}
      <span onclick="fullMapRemoveRegion('${id}')" style="cursor:pointer;opacity:.65;font-size:14px;line-height:1;margin-left:1px" title="Remove">×</span>
    </span>`
  ).join('');
  if (fullMapSelRegions.size > 1) {
    row.innerHTML += `<span onclick="fullMapClearAll()" style="font-size:11px;color:var(--text-muted);text-decoration:underline;cursor:pointer;padding:3px 6px">Clear all</span>`;
  }
}

function fullMapRemoveRegion(id) {
  fullMapSelRegions.delete(id);
  fullMapRefreshStyles();
  fullMapUpdateChips();
  if (fullMapSelRegions.size === 0) fullMapHideResults();
  else fullMapShowResults();
  fullMapShowLEHForMUs([...fullMapSelRegions]);
}

function fullMapClearAll() {
  fullMapSelRegions.clear();
  fullMapRefreshStyles();
  fullMapUpdateChips();
  fullMapHideResults();
  fullMapShowLEHForMUs([]);
}

// ── Results drawer ──
function fullMapHideResults() {
  const drawer = document.getElementById('fullMapResultsDrawer');
  if (drawer) drawer.style.display = 'none';
  // Re-expand map now that panel is closed
  setTimeout(() => fullMapInstance && fullMapInstance.invalidateSize(), 50);
}

function fullMapCloseResults() {
  fullMapSelRegions.clear();
  fullMapRefreshStyles();
  fullMapUpdateChips();
  fullMapHideResults();
}

function fullMapShowResults() {
  const drawer = document.getElementById('fullMapResultsDrawer');
  if (!drawer) return;

  const regions = [...fullMapSelRegions];
  let cards;

  if (fullMapProvince === 'BC') {
    cards = DATA.filter(r => regions.some(id => bcMUMatchesPolygon(r.MU, id))).map(r => ({
      _type: 'BC',
      species: r.Species,
      mu: r.MU,
      code: r.Code,
      odds: r['%'] || 0,
      success: computeHarvestAvg(r.yearly_fill_rates),
      season: r.Season || '',
      class: r.Class || ''
    }));
  } else {
    const allCards = buildABCards().filter(c => c !== null);
    cards = allCards
      .filter(c => regions.some(id => abCardMatchesWMU(c, id)))
      .map(c => ({
        _type: 'AB',
        species: c.species,
        mu: c.wmu,
        code: c.draw,
        odds: c.personalOdds !== null ? c.personalOdds : c.latestOdds,
        success: c.harvestSuccess,
        season: c.season || '',
        class: c.draw || ''
      }));
  }

  // Sort
  if (fullMapSortMode === 'odds') {
    cards.sort((a,b) => b.odds - a.odds);
  } else if (fullMapSortMode === 'success') {
    cards.sort((a,b) => {
      const as = a.success ?? -1, bs = b.success ?? -1;
      return bs - as;
    });
  } else if (fullMapSortMode === 'season') {
    cards.sort((a,b) => String(a.season).localeCompare(String(b.season)));
  }

  // Render header
  const grid = document.getElementById('fullMapResultsGrid');
  const title = document.getElementById('fullMapResultsTitle');
  const count = document.getElementById('fullMapResultsCount');
  const regionLabel = regions.length === 1 ? `WMU ${regions[0]}` : `${regions.length} regions`;
  if (title) title.textContent = `Draws for ${regionLabel}`;
  if (count) count.textContent = `${cards.length.toLocaleString()} draw${cards.length !== 1 ? 's' : ''}`;

  if (grid) {
    if (cards.length === 0) {
      grid.innerHTML = '<div class="fm-no-results">No draws found for the selected region(s) with current filters.</div>';
    } else {
      grid.innerHTML = cards.map(c => {
        const cls = (fullMapProvince === 'BC')
          ? (c.odds >= 5 ? 'green' : c.odds >= 1 ? 'yellow' : 'red')
          : (c.odds >= 20 ? 'green' : c.odds >= 5 ? 'yellow' : 'red');
        const oddsStr = c.odds != null ? ((c.odds >= 10 ? Math.round(c.odds) : c.odds.toFixed(1)) + '%') : '?%';
        const succStr = c.success != null ? ((c.success >= 10 ? Math.round(c.success) : c.success.toFixed(1)) + '%') : null;
        const succCls = c.success != null
          ? (c.success >= (fullMapProvince==='BC'?40:50) ? 'fill-high' : c.success >= (fullMapProvince==='BC'?20:25) ? 'fill-mid' : 'fill-low')
          : 'fill-none';
        const clickHandler = c._type === 'BC'
          ? `openDrawDetailByKey('${c.code}','${c.mu}')`
          : `openABDrawDetailByKey('${c.code}','${c.mu}')`;
        return `<div class="fm-card ${cls}" onclick="${clickHandler}" style="cursor:pointer">
          <div class="fm-card-top">
            <div>
              <div class="fm-card-species">${c.species}</div>
              <div class="fm-card-meta">WMU ${c.mu}${c.class ? ' · ' + c.class : ''}</div>
            </div>
            <div class="fm-card-odds ${cls}" data-tooltip="Draw Odds: chance of being selected in the most recent draw year.">${oddsStr}</div>
          </div>
          <div class="fm-card-bottom">
            <span class="fm-card-code">${c.code || ''}</span>
            ${succStr
              ? `<span class="fm-card-success ${succCls}" data-tooltip="Harvest Success: % of drawn hunters who successfully harvested.">${succStr} success</span>`
              : `<span class="fm-card-success fill-none">No success data</span>`}
            ${c.season && c.season !== '1' ? `<span class="fm-card-code">${c.season}</span>` : ''}
          </div>
        </div>`;
      }).join('');
    }
  }

  // Show panel
  drawer.style.display = 'flex';
  drawer.style.flexDirection = 'column';

  // Let Leaflet know it now shares width with the side panel
  setTimeout(() => fullMapInstance && fullMapInstance.invalidateSize(), 80);
}

function fullMapSetSort(mode, btn) {
  fullMapSortMode = mode;
  document.querySelectorAll('.fullmap-sort-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (fullMapSelRegions.size > 0) fullMapShowResults();
}

// ── Go to full draws page with map selections applied ──
function fullMapGoToDraws() {
  if (fullMapProvince === 'BC') {
    // Apply the WMU selections to the BC filter
    selMUsFull.clear();
    fullMapSelRegions.forEach(id => selMUsFull.add(id));
    // Also set region filters from WMU regions
    selMUs.clear();
    fullMapSelRegions.forEach(id => {
      const region = parseInt((id || '').split('-')[0]);
      if (!isNaN(region)) selMUs.add(region);
    });
    showPage('draws');
    bcUpdateMapStyles();
  } else {
    // Apply WMU selections to AB filter
    abSelWMU.clear();
    fullMapSelRegions.forEach(id => abSelWMU.add(id));
    showPage('abDraws');
  }
}


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

// _lehGetZones() is defined above in the fullMap section — shared cache for both card maps and overlay

// Track card map instances so we can destroy them if the card is re-rendered
const _lehCardMaps = {};

function bcCardMapInit(containerId, mu, zone, speciesType) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Destroy any previous Leaflet instance in this container
  if (_lehCardMaps[containerId]) {
    try { _lehCardMaps[containerId].remove(); } catch(e) {}
    delete _lehCardMaps[containerId];
    container.innerHTML = '';
    delete container._leaflet_id;
  }

  // Strip BC draw modifiers from zone letter: "A*" -> "A"
  const cleanZone = zone ? zone.replace(/[^A-Za-z]/g, '') : '';
  // Strip trailing modifiers from MU but keep leading zeros (LEH data uses them)
  const cleanMU = mu.replace(/[\*\+]+$/, '').trim();
  const prefix = _LEH_SPECIES_PREFIX[(speciesType || '').toUpperCase()] || 'S';

  // Satellite layer (default) + topo option — driven by the toggle buttons
  // that sit above each card map (rendered in the card HTML, see bcCardMapToggle)
  const tileLayers = {
    satellite: L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Esri', maxZoom: 17 }
    ),
    topo: L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Esri', maxZoom: 17 }
    )
  };

  // Default centre on BC if we can't zoom to the zone
  const map = L.map(containerId, {
    center: [54.5, -124.5],
    zoom: 6,
    minZoom: 4,
    maxZoom: 15,
    zoomControl: true,
    attributionControl: true,
    scrollWheelZoom: false,   // avoid page-scroll hijack inside card
    tap: true
  });

  tileLayers.satellite.addTo(map);
  _lehCardMaps[containerId] = map;

  // Store layer refs on the map object so bcCardMapSetLayer can swap them
  map._lehTileLayers = tileLayers;
  map._lehCurrentTile = 'satellite';

  // Show a subtle status message while loading
  const statusEl = document.getElementById(containerId + '_status');
  function setStatus(msg, ok) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.style.color = ok ? 'var(--text-muted, #666)' : '#f87171';
  }
  setStatus('Loading zone…', true);

  _lehGetZones().then(data => {
    const zones    = data.zones    || data;   // support both {zones,mu_index} and flat formats
    const muIndex  = data.mu_index || {};

    // Ensure Leaflet is still alive (card may have been closed)
    if (!_lehCardMaps[containerId]) return;

    // ── Context layer: all zones for this MU (dim blue outlines) ──
    // Use mu_index to get all zones that include this MU (handles multi-MU zones)
    const contextIds = new Set(muIndex[cleanMU] || []);
    const muFeatures = [...contextIds]
      .filter(id => zones[id])   // guard: skip IDs that don't exist in zones
      .map(id => {
        const z = zones[id];
        return { type: 'Feature', properties: { id, label: z.lb, zt: z.zt }, geometry: z.g };
      });

    if (muFeatures.length > 0) {
      L.geoJSON({ type: 'FeatureCollection', features: muFeatures }, {
        style: {
          color: '#5b8def', weight: 1, opacity: 0.45,
          fillColor: '#5b8def', fillOpacity: 0.05, dashArray: '4,4'
        },
        onEachFeature: (feat, lyr) => {
          lyr.bindTooltip(
            `<b style="color:#5b8def">${feat.properties.label}</b><br><span style="font-size:10px;color:#888">${feat.properties.zt}</span>`,
            { sticky: true, direction: 'top', className: 'leh-card-tip' }
          );
        }
      }).addTo(map);
    }

    // ── Highlight layer: the specific drawn zone (gold border) ──
    const resolvedId = _lehFindZoneId(zones, muIndex, mu, cleanZone, speciesType);

    let highlightBounds = null;
    if (resolvedId && zones[resolvedId]) {
      const z = zones[resolvedId];
      // Show disclaimer if zone has modifier (partial area)
      const hasModifier = zone && /[\*\+]/.test(zone);
      const highlightLayer = L.geoJSON(
        { type: 'Feature', properties: { id: resolvedId, label: z.lb, partial: hasModifier }, geometry: z.g },
        {
          style: {
            color: '#f0b429', weight: 2.5, opacity: 1,
            fillColor: '#f0b429', fillOpacity: 0.14
          },
          onEachFeature: (feat, lyr) => {
            lyr.bindTooltip(
              `<b style="color:#f0b429">${z.lb}</b><br><span style="font-size:10px;color:#aaa">${z.zt}</span>${hasModifier ? '<br><span style="font-size:9px;color:#888">★ Partial area — see regulations</span>' : ''}`,
              { sticky: true, direction: 'top', className: 'leh-card-tip' }
            );
          }
        }
      ).addTo(map);
      highlightBounds = highlightLayer.getBounds();
    } else if (muFeatures.length > 0) {
      // No exact zone match — fall back to fitting the whole MU
      const fallback = L.geoJSON({ type: 'FeatureCollection', features: muFeatures });
      highlightBounds = fallback.getBounds();
    }

    if (highlightBounds && highlightBounds.isValid()) {
      map.fitBounds(highlightBounds, { padding: [28, 28], maxZoom: 11 });
    }

    const label = resolvedId && zones[resolvedId] ? zones[resolvedId].lb : `MU ${mu}`;
    setStatus(label, true);
  }).catch(err => {
    console.error('[bcCardMapInit] zone load error:', err);
    setStatus('Zone data unavailable', false);
  });
}

// Called by the Satellite / Topo toggle buttons rendered in the card HTML
// e.g. onclick="bcCardMapSetLayer('cardMapDiv_6038', 'topo')"
function bcCardMapSetLayer(containerId, type) {
  const map = _lehCardMaps[containerId];
  if (!map || !map._lehTileLayers) return;
  if (map._lehCurrentTile === type) return;
  map.removeLayer(map._lehTileLayers[map._lehCurrentTile]);
  map._lehTileLayers[type].addTo(map);
  map._lehCurrentTile = type;

  // Sync button states — buttons must have id="[containerId]_btn_satellite" etc.
  ['satellite', 'topo'].forEach(t => {
    const btn = document.getElementById(`${containerId}_btn_${t}`);
    if (btn) btn.classList.toggle('active', t === type);
  });
}

// Invalidate size when a card map becomes visible (call after expanding card)
function bcCardMapInvalidate(containerId) {
  const map = _lehCardMaps[containerId];
  if (map) setTimeout(() => map.invalidateSize(), 80);
}
// ── Card map fullscreen expand / collapse ──
const _bcCardMapFullscreen = {};  // containerId → { overlay, origHeight }

function bcCardMapToggleFullscreen(containerId) {
  const mapDiv  = document.getElementById(containerId);
  if (!mapDiv) return;

  // Find the expand button
  const header = mapDiv.closest('div[style*="margin-top:12px"]') ||
                 mapDiv.parentElement;
  const btn = header ? header.querySelector('.leh-map-expand-btn') : null;

  if (_bcCardMapFullscreen[containerId]) {
    // ── COLLAPSE ──
    const { overlay } = _bcCardMapFullscreen[containerId];

    // Move map back into its original spot
    const placeholder = document.getElementById(containerId + '_placeholder');
    if (placeholder) {
      placeholder.replaceWith(mapDiv);
    }
    mapDiv.style.height    = '280px';
    mapDiv.style.position  = '';
    mapDiv.style.borderRadius = '8px';

    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    delete _bcCardMapFullscreen[containerId];

    if (btn) { btn.textContent = '⛶'; btn.title = 'Expand map'; }
    document.body.style.overflow = '';
  } else {
    // ── EXPAND ──
    // Leave a placeholder so the card doesn't collapse
    const placeholder = document.createElement('div');
    placeholder.id = containerId + '_placeholder';
    placeholder.style.height = '280px';
    mapDiv.parentNode.replaceChild(placeholder, mapDiv);

    // Full-screen overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:10000',
      'background:#111', 'display:flex', 'flex-direction:column'
    ].join(';');

    // Header bar inside overlay
    const bar = document.createElement('div');
    bar.style.cssText = [
      'display:flex', 'align-items:center', 'justify-content:flex-end',
      'padding:8px 12px', 'gap:8px',
      'background:var(--bg-secondary,#1a1a1a)',
      'border-bottom:1px solid var(--border,#2e2e2e)',
      'flex-shrink:0'
    ].join(';');

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕  Collapse';
    closeBtn.className = 'leh-map-btn';
    closeBtn.style.cssText = 'font-size:12px;padding:5px 14px;';
    closeBtn.onclick = () => bcCardMapToggleFullscreen(containerId);
    bar.appendChild(closeBtn);
    overlay.appendChild(bar);

    // Map fills the rest
    mapDiv.style.height   = 'calc(100vh - 45px)';
    mapDiv.style.position = 'relative';
    mapDiv.style.borderRadius = '0';
    overlay.appendChild(mapDiv);

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    _bcCardMapFullscreen[containerId] = { overlay };
    if (btn) { btn.textContent = '✕'; btn.title = 'Collapse map'; }
  }

  // Let Leaflet re-measure its new size
  setTimeout(() => {
    if (_lehCardMaps && _lehCardMaps[containerId]) {
      _lehCardMaps[containerId].invalidateSize();
    }
  }, 50);
}

// Close card map fullscreen on Escape
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    Object.keys(_bcCardMapFullscreen).forEach(id => bcCardMapToggleFullscreen(id));
  }
});


