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
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// ── FULL-PAGE MAP TAB — Mapbox GL JS (3D terrain)
// ══════════════════════════════════════════════════════════════

let fullMapProvince    = 'BC';
let fullMapInitialized = { BC: false, AB: false };
let fullMapInstance    = null;
let fullMapGeoLayer    = null; // kept for pin location lookup
let fullMapSelRegions  = new Set();
let fullMapSortMode    = 'odds';

let _fullMapStyle      = 'satellite';
let _fullMapTerrain3D  = false;
let _fullMapLEHVisible = false;
let _fullMapLEHLoading = false;
let _fullMapLEHOpacity = 0.35;
let _hoveredWMU        = null;

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
  document.getElementById('mapToggleBC').classList.toggle('active', prov === 'BC');
  document.getElementById('mapToggleAB').classList.toggle('active', prov === 'AB');
  if (fullMapInstance) { fullMapInstance.remove(); fullMapInstance = null; fullMapGeoLayer = null; }
  fullMapInitialized[prov] = false;
  fullMapHideResults();
  fullMapUpdateChips();
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

  map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-left');
  map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

  // Auto-enable 3D terrain for satellite and topo on first load
  map.on('load', () => {
    if (_fullMapStyle === 'satellite' || _fullMapStyle === 'topo') {
      if (!_fullMapTerrain3D) {
        _applyTerrain(true);
        _fullMapTerrain3D = true;
        const btn = document.getElementById('fullMap3DBtn');
        if (btn) { btn.classList.add('active'); btn.textContent = '3D ✓'; }
      }
    }
  });

  return map;
}

// ── BC init ──
function _fullMapInitBC() {
  fullMapInitialized['BC'] = true;
  const map = _fullMapBuild([-124.0, 54.0], 5);
  if (!map) return;
  fullMapInstance = map;

  map.on('load', () => {
    const loading = document.getElementById('fullMapLoading');
    if (loading) loading.style.display = 'none';

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
          ['boolean', ['feature-state', 'hasDraws'],  false], 0.38,
          0.12
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
      map.setFeatureState({ source: _SRC_WMU, id: i }, { hasDraws, selected: false, hovered: false });
    });

    // Hover
    map.on('mousemove', _LYR_WMU_FILL, e => {
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
      if (_hoveredWMU !== null) { map.setFeatureState({ source: _SRC_WMU, id: _hoveredWMU }, { hovered: false }); _hoveredWMU = null; }
      map.getCanvas().style.cursor = '';
      _hideMapTooltip();
    });

    // Click
    map.on('click', _LYR_WMU_FILL, e => {
      const id = e.features[0].properties.wmu_id || '';
      if (!DATA.some(r => bcMUMatchesPolygon(r.MU, id))) return;
      _fullMapToggleRegion(id, e.features[0].id);
    });

    _syncTileButtons();
    if (_fullMapTerrain3D) _applyTerrain(true);
  });

  map.on('error', e => console.error('[Map]', e.error));
}

// ── AB init ──
function _fullMapInitAB() {
  fullMapInitialized['AB'] = true;
  const map = _fullMapBuild([-115.0, 54.0], 5);
  if (!map) return;
  fullMapInstance = map;

  map.on('load', async () => {
    await Promise.all([loadABData(), loadABHarvest()]);
    const loading = document.getElementById('fullMapLoading');
    if (loading) loading.style.display = 'none';

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
          ['boolean', ['feature-state', 'hasDraws'],  false], 0.38,
          0.12
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
      map.setFeatureState({ source: _SRC_WMU, id: i }, { hasDraws, selected: false, hovered: false });
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
    if (_fullMapTerrain3D) _applyTerrain(true);
  });
}

// ── Tooltip ──
let _mapTooltipEl = null;
function _showMapTooltip(e, id, prov) {
  let cnt = prov === 'BC'
    ? DATA.filter(r => bcMUMatchesPolygon(r.MU, id)).length
    : (() => { const c = buildABCards().filter(x=>x); return c.filter(x => abCardMatchesWMU(x, id)).length; })();
  if (!_mapTooltipEl) {
    _mapTooltipEl = document.createElement('div');
    _mapTooltipEl.style.cssText = 'position:fixed;z-index:9000;pointer-events:none;background:#1a1a1a;border:1px solid #3a3a3a;border-radius:8px;padding:7px 12px;font-size:12px;color:#e8e8e8;box-shadow:0 4px 16px rgba(0,0,0,.6);white-space:nowrap';
    document.body.appendChild(_mapTooltipEl);
  }
  _mapTooltipEl.innerHTML = `<b style="color:#4ade80">WMU ${id}</b><br><span style="font-size:11px;color:#aaa">${cnt||'No'} draw${cnt!==1?'s':''}</span>`;
  _mapTooltipEl.style.display = 'block';
  _mapTooltipEl.style.left = (e.originalEvent.clientX + 14) + 'px';
  _mapTooltipEl.style.top  = (e.originalEvent.clientY - 10) + 'px';
}
function _hideMapTooltip() {
  if (_mapTooltipEl) _mapTooltipEl.style.display = 'none';
}

// ══════════════════════════════════════════════════════════════
// ── MAP SEARCH (WMU units + Mapbox Geocoder for cities) ──
// ══════════════════════════════════════════════════════════════

let _searchDebounceTimer = null;
let _searchGeocodeCtrl   = null; // AbortController for in-flight geocode
let _searchCursorIdx     = -1;
let _searchLastItems     = [];

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

function _searchRun(query) {
  const results = [];
  const q = query.toLowerCase();

  // ── 1. WMU unit search (local, instant) ──
  const prov = fullMapProvince;

  if (prov === 'BC') {
    const geojson = (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON) ||
                    (typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON);
    if (geojson && geojson.features) {
      geojson.features.forEach(feat => {
        const id = feat.properties.wmu_id || '';
        if (id.toLowerCase().includes(q)) {
          const hasDraws = (typeof DATA !== 'undefined') && DATA.some(r => bcMUMatchesPolygon(r.MU, id));
          results.push({
            type: 'wmu',
            label: `WMU ${id}`,
            sub: hasDraws ? 'Has draws in dataset' : 'No draws in current filter',
            icon: '🦌',
            badge: 'WMU',
            action: () => _searchFlyToWMU_BC(id, feat),
          });
        }
      });
    }
  } else {
    if (typeof AB_WMU_GEOJSON !== 'undefined' && AB_WMU_GEOJSON.features) {
      AB_WMU_GEOJSON.features.forEach(feat => {
        const id = String(feat.properties.WMUNIT_NUM || '');
        const name = feat.properties.WMUNIT_NAM || feat.properties.NAME || '';
        if (id.includes(q) || name.toLowerCase().includes(q)) {
          results.push({
            type: 'wmu',
            label: `WMU ${id}${name ? ' — ' + name : ''}`,
            sub: 'Alberta Wildlife Management Unit',
            icon: '🦌',
            badge: 'WMU',
            action: () => _searchFlyToWMU_AB(id, feat),
          });
        }
      });
    }
  }

  // Sort WMU results: exact match first, then starts-with, then contains
  results.sort((a, b) => {
    const aId = a.label.replace('WMU ', '').toLowerCase();
    const bId = b.label.replace('WMU ', '').toLowerCase();
    const aExact = aId === q ? 0 : aId.startsWith(q) ? 1 : 2;
    const bExact = bId === q ? 0 : bId.startsWith(q) ? 1 : 2;
    return aExact - bExact;
  });

  // Cap WMU results at 5 to leave room for geocoder
  const wmuResults = results.slice(0, 5);

  // ── 2. Geocode for cities (Mapbox API) ──
  // Cancel any in-flight request
  if (_searchGeocodeCtrl) { try { _searchGeocodeCtrl.abort(); } catch(e) {} }
  _searchGeocodeCtrl = new AbortController();

  const token = (typeof MAPBOX_TOKEN !== 'undefined') ? MAPBOX_TOKEN : '';
  if (!token) {
    _searchRenderResults(wmuResults);
    return;
  }

  // Bias search to BC or AB bounding box
  const bbox = fullMapProvince === 'BC'
    ? '-139.1,48.3,-114.0,60.1'
    : '-120.0,49.0,-110.0,60.0';

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
    `?access_token=${token}&bbox=${bbox}&types=place,locality,neighborhood,poi&limit=3&country=CA`;

  fetch(url, { signal: _searchGeocodeCtrl.signal })
    .then(r => r.json())
    .then(data => {
      const cityResults = (data.features || []).map(f => ({
        type: 'city',
        label: f.text || f.place_name,
        sub: f.place_name,
        icon: '📍',
        badge: 'City',
        coords: f.center, // [lng, lat]
        action: () => _searchFlyToCoords(f.center, 10),
      }));
      _searchRenderResults([...wmuResults, ...cityResults]);
    })
    .catch(err => {
      if (err.name !== 'AbortError') {
        _searchRenderResults(wmuResults);
      }
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
        <span class="fsr-icon">${item.icon}</span>
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
  const bbox = turf.bbox(feat);             // [minLng, minLat, maxLng, maxLat]
  fullMapInstance.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], {
    padding: 80, duration: 900, maxZoom: 13
  });
  // Also select it if it has draws
  const geojson = (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON) ||
                  (typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON);
  if (!geojson) return;
  const hasDraws = (typeof DATA !== 'undefined') && DATA.some(r => bcMUMatchesPolygon(r.MU, id));
  if (hasDraws) {
    // Find feature index for setFeatureState
    const idx = geojson.features.findIndex(f => (f.properties.wmu_id || '') === id);
    if (idx >= 0) {
      if (!fullMapSelRegions.has(id)) {
        fullMapSelRegions.add(id);
        fullMapInstance.setFeatureState({ source: _SRC_WMU, id: idx }, { selected: true });
        fullMapUpdateChips();
        fullMapShowResults();
      }
    }
  }
}

// ── Fly to AB WMU ──
function _searchFlyToWMU_AB(id, feat) {
  if (!fullMapInstance) return;
  const bbox = turf.bbox(feat);
  fullMapInstance.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], {
    padding: 80, duration: 900, maxZoom: 12
  });
  // Select it if has draws
  const allCards = (typeof buildABCards === 'function') ? buildABCards().filter(c => c !== null) : [];
  const hasDraws = allCards.some(c => abCardMatchesWMU(c, id));
  if (hasDraws) {
    const idx = AB_WMU_GEOJSON.features.findIndex(f => String(f.properties.WMUNIT_NUM || '') === id);
    if (idx >= 0 && !fullMapSelRegions.has(id)) {
      fullMapSelRegions.add(id);
      fullMapInstance.setFeatureState({ source: _SRC_WMU, id: idx }, { selected: true });
      fullMapUpdateChips();
      fullMapShowResults();
    }
  }
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
  fullMapUpdateChips();
  fullMapShowResults();
  fullMapShowLEHForMUs([...fullMapSelRegions]);
}

// ── Refresh all selection states ──
function fullMapRefreshStyles() {
  if (!fullMapInstance || !fullMapInstance.getSource(_SRC_WMU)) return;
  const geojson = fullMapProvince === 'BC' ? (bcWmuGeoJSON || BC_WMU_GEOJSON) : AB_WMU_GEOJSON;
  geojson.features.forEach((feat, i) => {
    const id = fullMapProvince === 'BC' ? (feat.properties.wmu_id||'') : String(feat.properties.WMUNIT_NUM||'');
    fullMapInstance.setFeatureState({ source: _SRC_WMU, id: i }, { selected: fullMapSelRegions.has(id) });
  });
}

// ── Tile switcher ──
function fullMapSetTile(type) {
  if (!_MB_STYLES[type] || !fullMapInstance) return;
  _fullMapStyle = type;
  _syncTileButtons();
  const center  = fullMapInstance.getCenter();
  const zoom    = fullMapInstance.getZoom();
  const bearing = fullMapInstance.getBearing();
  const pitch   = fullMapInstance.getPitch();
  fullMapInstance.setStyle(_MB_STYLES[type]);
  fullMapInstance.once('style.load', () => {
    _reAddWMULayers();
    if (_fullMapLEHVisible) _reAddLEHLayer();

    // Re-add sky layer state holder (removed with style swap)
    // Then apply terrain: auto-on for satellite/topo, off for streets
    if (type === 'satellite' || type === 'topo') {
      _applyTerrain(true);
      _fullMapTerrain3D = true;
    } else {
      // Streets mode: flat map, reset pitch
      _fullMapTerrain3D = false;
      fullMapInstance.setTerrain(null);
      fullMapInstance.easeTo({ pitch: 0, bearing: 0, duration: 700 });
    }
    const btn = document.getElementById('fullMap3DBtn');
    if (btn) { btn.classList.toggle('active', _fullMapTerrain3D); btn.textContent = _fullMapTerrain3D ? '3D ✓' : '3D'; }

    // Restore camera position (but use new pitch if 3D auto-enabled)
    if (type !== 'satellite' && type !== 'topo') {
      fullMapInstance.jumpTo({ center, zoom, bearing, pitch });
    } else {
      fullMapInstance.jumpTo({ center, zoom });
    }
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
      paint: { 'fill-color': colorExpr, 'fill-opacity': ['case',['boolean',['feature-state','selected'],false],0.75,['boolean',['feature-state','hovered'],false],0.5,['boolean',['feature-state','hasDraws'],false],0.38,0.12] }
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
    fullMapInstance.setFeatureState({ source: _SRC_WMU, id: i }, { hasDraws, selected: fullMapSelRegions.has(id), hovered: false });
  });
}

// ── 3D Terrain ──
function fullMapToggle3D() {
  _fullMapTerrain3D = !_fullMapTerrain3D;
  _applyTerrain(_fullMapTerrain3D);
  const btn = document.getElementById('fullMap3DBtn');
  if (btn) { btn.classList.toggle('active', _fullMapTerrain3D); btn.textContent = _fullMapTerrain3D ? '3D ✓' : '3D'; }
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
function fullMapShowLEHForMUs(muSet) {
  if (!fullMapInstance) return;
  const mus = Array.isArray(muSet) ? muSet : [...muSet];
  _removeLEHLayers();
  if (mus.length === 0) { _updateLEHBtn(); return; }
  _fullMapLEHLoading = true;

  _lehGetZones().then(data => {
    _fullMapLEHLoading = false;
    const zones   = data.zones    || data;
    const muIndex = data.mu_index || {};
    const zoneIds = new Set();
    for (const mu of mus) {
      const cleanMU = mu.replace(/[\*\+]+$/, '').trim();
      (muIndex[cleanMU] || []).forEach(id => zoneIds.add(id));
    }
    const features = [...zoneIds].filter(id => zones[id]).map(id => {
      const z = zones[id];
      return { type:'Feature', id, properties:{ id, label:z.lb, zt:z.zt, mu:z.mu }, geometry:z.g };
    });
    if (!features.length) { _updateLEHBtn(); return; }

    const geojson = { type:'FeatureCollection', features };
    if (!fullMapInstance.getSource(_SRC_LEH)) {
      fullMapInstance.addSource(_SRC_LEH, { type:'geojson', data:geojson });
    } else {
      fullMapInstance.getSource(_SRC_LEH).setData(geojson);
    }

    // Build match expression for colours
    const colorMatch = ['match', ['get','zt'], ...Object.entries(_LEH_COLORS).flatMap(([k,v])=>[k,v]), '#888888'];

    if (!fullMapInstance.getLayer(_LYR_LEH_FILL)) {
      fullMapInstance.addLayer({ id:_LYR_LEH_FILL, type:'fill', source:_SRC_LEH,
        paint:{ 'fill-color':colorMatch, 'fill-opacity':_fullMapLEHOpacity }
      }, _LYR_WMU_FILL);
    } else {
      fullMapInstance.setPaintProperty(_LYR_LEH_FILL, 'fill-color', colorMatch);
      fullMapInstance.setPaintProperty(_LYR_LEH_FILL, 'fill-opacity', _fullMapLEHOpacity);
    }
    if (!fullMapInstance.getLayer(_LYR_LEH_LINE)) {
      fullMapInstance.addLayer({ id:_LYR_LEH_LINE, type:'line', source:_SRC_LEH,
        paint:{ 'line-color':colorMatch, 'line-width':1.5, 'line-opacity':0.9 }
      });
    }

    // LEH tooltip
    fullMapInstance.on('mouseenter', _LYR_LEH_FILL, e => {
      const p = e.features[0].properties;
      const col = _LEH_COLORS[p.zt] || '#888';
      if (!_mapTooltipEl) {
        _mapTooltipEl = document.createElement('div');
        _mapTooltipEl.style.cssText = 'position:fixed;z-index:9000;pointer-events:none;background:#1a1a1a;border:1px solid #3a3a3a;border-radius:8px;padding:7px 12px;font-size:12px;color:#e8e8e8;box-shadow:0 4px 16px rgba(0,0,0,.6);white-space:nowrap';
        document.body.appendChild(_mapTooltipEl);
      }
      _mapTooltipEl.innerHTML = `<b style="color:${col}">${p.label}</b><br><span style="font-size:10px;color:#aaa">${p.zt} · MU ${p.mu}</span>`;
      _mapTooltipEl.style.display = 'block';
    });
    fullMapInstance.on('mousemove', _LYR_LEH_FILL, e => {
      if (_mapTooltipEl) { _mapTooltipEl.style.left=(e.originalEvent.clientX+14)+'px'; _mapTooltipEl.style.top=(e.originalEvent.clientY-10)+'px'; }
    });
    fullMapInstance.on('mouseleave', _LYR_LEH_FILL, () => { _hideMapTooltip(); });

    _fullMapLEHVisible = true;
    _updateLEHBtn();
  }).catch(err => { _fullMapLEHLoading = false; console.error('[LEH]', err); });
}

function _removeLEHLayers() {
  if (!fullMapInstance) return;
  [_LYR_LEH_LINE, _LYR_LEH_FILL].forEach(id => { if (fullMapInstance.getLayer(id)) fullMapInstance.removeLayer(id); });
  if (fullMapInstance.getSource(_SRC_LEH)) fullMapInstance.removeSource(_SRC_LEH);
  _fullMapLEHVisible = false;
}

function _reAddLEHLayer() { fullMapShowLEHForMUs([...fullMapSelRegions]); }

function fullMapToggleLEH() {
  if (_fullMapLEHLoading) return;
  if (_fullMapLEHVisible) { _removeLEHLayers(); _updateLEHBtn(); }
  else fullMapShowLEHForMUs([...fullMapSelRegions]);
}

function fullMapSetLEHOpacity(val) {
  _fullMapLEHOpacity = parseFloat(val);
  if (fullMapInstance && fullMapInstance.getLayer(_LYR_LEH_FILL)) {
    fullMapInstance.setPaintProperty(_LYR_LEH_FILL, 'fill-opacity', _fullMapLEHOpacity);
  }
}

function _updateLEHBtn() {
  const btn = document.getElementById('fullMapLEHToggle');
  if (!btn) return;
  btn.classList.toggle('active', _fullMapLEHVisible);
  btn.textContent = _fullMapLEHVisible ? 'LEH Zones ✓' : 'LEH Zones';
}

// ── Chips row ──
function fullMapUpdateChips() {
  const row = document.getElementById('fullMapChipsRow');
  if (!row) return;
  if (!fullMapSelRegions.size) {
    row.innerHTML = '<span style="font-size:11px;color:var(--text-muted)">No regions selected — showing all</span>';
    return;
  }
  row.innerHTML = [...fullMapSelRegions].sort().map(id =>
    `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px 3px 10px;background:rgba(74,222,128,.15);border:1px solid rgba(74,222,128,.35);border-radius:12px;font-size:11px;font-weight:700;color:#4ade80">
      WMU&nbsp;${id}
      <span onclick="fullMapRemoveRegion('${id}')" style="cursor:pointer;opacity:.65;font-size:14px;line-height:1">×</span>
    </span>`
  ).join('') + (fullMapSelRegions.size > 1 ? `<span onclick="fullMapClearAll()" style="font-size:11px;color:var(--text-muted);text-decoration:underline;cursor:pointer;padding:3px 6px">Clear all</span>` : '');
}

function fullMapRemoveRegion(id) {
  fullMapSelRegions.delete(id);
  fullMapRefreshStyles();
  fullMapUpdateChips();
  if (!fullMapSelRegions.size) fullMapHideResults(); else fullMapShowResults();
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
  const d = document.getElementById('fullMapResultsDrawer');
  if (d) d.style.display = 'none';
  setTimeout(() => fullMapInstance && fullMapInstance.resize(), 50);
}

function fullMapCloseResults() {
  fullMapSelRegions.clear(); fullMapRefreshStyles(); fullMapUpdateChips(); fullMapHideResults();
}

function fullMapShowResults() {
  const drawer = document.getElementById('fullMapResultsDrawer');
  if (!drawer) return;
  const regions = [...fullMapSelRegions];
  let cards;

  if (fullMapProvince === 'BC') {
    cards = DATA.filter(r => regions.some(id => bcMUMatchesPolygon(r.MU, id))).map(r => ({
      _type:'BC', species:r.Species, mu:r.MU, code:r.Code,
      odds:r['%']||0, success:computeHarvestAvg(r.yearly_fill_rates),
      season:r.Season||'', class:r.Class||''
    }));
  } else {
    const allCards = buildABCards().filter(c=>c!==null);
    cards = allCards.filter(c => regions.some(id => abCardMatchesWMU(c,id))).map(c => ({
      _type:'AB', species:c.species, mu:c.wmu, code:c.draw,
      odds:c.personalOdds!==null?c.personalOdds:c.latestOdds,
      success:c.harvestSuccess, season:c.season||'', class:c.draw||''
    }));
  }

  if (fullMapSortMode==='odds')        cards.sort((a,b)=>b.odds-a.odds);
  else if (fullMapSortMode==='success') cards.sort((a,b)=>(b.success??-1)-(a.success??-1));
  else if (fullMapSortMode==='season')  cards.sort((a,b)=>String(a.season).localeCompare(String(b.season)));

  const grid  = document.getElementById('fullMapResultsGrid');
  const title = document.getElementById('fullMapResultsTitle');
  const count = document.getElementById('fullMapResultsCount');
  if (title) title.textContent = `Draws for ${regions.length===1?'WMU '+regions[0]:regions.length+' regions'}`;
  if (count) count.textContent = `${cards.length.toLocaleString()} draw${cards.length!==1?'s':''}`;

  if (grid) {
    grid.innerHTML = cards.length === 0
      ? '<div class="fm-no-results">No draws found for the selected region(s).</div>'
      : cards.map(c => {
          const cls = fullMapProvince==='BC' ? (c.odds>=5?'green':c.odds>=1?'yellow':'red') : (c.odds>=20?'green':c.odds>=5?'yellow':'red');
          const oddsStr = c.odds!=null?((c.odds>=10?Math.round(c.odds):c.odds.toFixed(1))+'%'):'?%';
          const succStr = c.success!=null?((c.success>=10?Math.round(c.success):c.success.toFixed(1))+'%'):null;
          const succCls = c.success!=null?(c.success>=(fullMapProvince==='BC'?40:50)?'fill-high':c.success>=(fullMapProvince==='BC'?20:25)?'fill-mid':'fill-low'):'fill-none';
          const click = c._type==='BC'?`openDrawDetailByKey('${c.code}','${c.mu}')`:`openABDrawDetailByKey('${c.code}','${c.mu}')`;
          return `<div class="fm-card ${cls}" onclick="${click}" style="cursor:pointer">
            <div class="fm-card-top"><div><div class="fm-card-species">${c.species}</div><div class="fm-card-meta">WMU ${c.mu}${c.class?' · '+c.class:''}</div></div><div class="fm-card-odds ${cls}">${oddsStr}</div></div>
            <div class="fm-card-bottom"><span class="fm-card-code">${c.code||''}</span>${succStr?`<span class="fm-card-success ${succCls}">${succStr} success</span>`:`<span class="fm-card-success fill-none">No success data</span>`}${c.season&&c.season!=='1'?`<span class="fm-card-code">${c.season}</span>`:''}</div>
          </div>`;
        }).join('');
  }

  drawer.style.display = 'flex';
  drawer.style.flexDirection = 'column';
  setTimeout(() => fullMapInstance && fullMapInstance.resize(), 80);
}

function fullMapSetSort(mode, btn) {
  fullMapSortMode = mode;
  document.querySelectorAll('.fullmap-sort-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (fullMapSelRegions.size) fullMapShowResults();
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
  return fetch('leh_zones.json')
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(d => { _lehZonesCache = d; return d; });
}

// ── Find the best matching zone ID for a draw card ──
// Zone IDs in leh_zones.json are formatted as: PREFIX_MU+ZONE  e.g. "S_4-23B"
// prefix = species letter, MU = management unit, ZONE = zone letter
function _lehFindZoneId(zones, muIndex, mu, zone, speciesType) {
  const prefix = _LEH_SPECIES_PREFIX[(speciesType || '').toUpperCase()] || 'S';
  const cleanMU = mu.replace(/[\*\+]+$/, '').trim();
  const cleanZone = (zone || '').replace(/[^A-Za-z]/g, '').toUpperCase();

  // Strategy 1: exact match PREFIX_MU+ZONE  e.g. "S_4-23B"
  if (cleanZone) {
    const exact = prefix + '_' + cleanMU + cleanZone;
    if (zones[exact]) return exact;
  }

  // Strategy 2: scan all zones for this MU and match prefix + zone letter
  const candidates = muIndex[cleanMU] || [];
  if (cleanZone) {
    // match prefix and zone letter at end of ID
    const byPrefix = candidates.find(id =>
      id.startsWith(prefix + '_') && id.endsWith(cleanZone)
    );
    if (byPrefix) return byPrefix;

    // match any prefix with zone letter
    const anyPrefix = candidates.find(id => id.endsWith(cleanZone));
    if (anyPrefix) return anyPrefix;
  }

  // Strategy 3: just the first zone with matching prefix for this MU
  const firstByPrefix = candidates.find(id => id.startsWith(prefix + '_'));
  if (firstByPrefix) return firstByPrefix;

  // Strategy 4: first zone for MU regardless of species
  return candidates[0] || null;
}

// Track card map instances so we can destroy them if the card is re-rendered
const _lehCardMaps = {};

function bcCardMapInit(containerId, mu, zone, speciesType) {
  const container = document.getElementById(containerId);
  if (!container) return;

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
  const prefix = _LEH_SPECIES_PREFIX[(speciesType || '').toUpperCase()] || 'S';

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
      scrollZoom: false,  // avoid page-scroll hijack inside card
      attributionControl: false,
    });

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    _lehCardMaps[containerId] = map;
    // Store tile type on instance for toggle function
    map._lehCurrentTile = tileType;

    const statusEl = document.getElementById(containerId + '_status');
    function setStatus(msg, ok) {
      if (!statusEl) return;
      statusEl.textContent = msg;
      statusEl.style.color = ok ? 'var(--text-muted, #666)' : '#f87171';
    }
    setStatus('Loading zone…', true);

    map.on('load', () => {
      // ── Add 3D terrain (DEM) — works for both satellite and topo ──
      map.addSource('card-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14
      });
      map.setTerrain({ source: 'card-dem', exaggeration: 1.5 });

      // Sky atmosphere layer
      map.addLayer({
        id: 'card-sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 90.0],
          'sky-atmosphere-sun-intensity': 12
        }
      });

      _lehGetZones().then(data => {
        if (!_lehCardMaps[containerId]) return; // card closed

        const zones   = data.zones    || data;
        const muIndex = data.mu_index || {};

        // ── Context layer: all zones for this MU ──
        const contextIds = new Set(muIndex[cleanMU] || []);
        const muFeatures = [...contextIds]
          .filter(id => zones[id])
          .map(id => {
            const z = zones[id];
            // Extract zone letter from ID e.g. "D_3-32A" → "Zone A", "D_3-32B" → "Zone B"
            const zoneLetterMatch = id.match(/([A-Z]+)$/);
            const zoneLetter = zoneLetterMatch ? zoneLetterMatch[1] : '';
            return { type: 'Feature', id, properties: { id, label: z.lb, zt: z.zt, zoneLetter }, geometry: z.g };
          });

        if (muFeatures.length > 0) {
          map.addSource('card-ctx', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: muFeatures }
          });
          map.addLayer({
            id: 'card-ctx-fill', type: 'fill', source: 'card-ctx',
            paint: { 'fill-color': '#5b8def', 'fill-opacity': 0.10 }
          });
          map.addLayer({
            id: 'card-ctx-line', type: 'line', source: 'card-ctx',
            paint: { 'line-color': '#5b8def', 'line-width': 1.2, 'line-opacity': 0.7, 'line-dasharray': [3, 3] }
          });

          // Hover tooltip on all context zones — shows "Zone A", "Zone B" etc.
          const ctxPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, className: 'leh-card-tip' });
          let ctxHovered = null;
          map.on('mousemove', 'card-ctx-fill', e => {
            if (!e.features.length) return;
            const props = e.features[0].properties;
            const zl = props.zoneLetter ? `Zone ${props.zoneLetter}` : (props.label || `MU ${mu}`);
            map.getCanvas().style.cursor = 'crosshair';
            ctxHovered = e.features[0].id;
            ctxPopup.setLngLat(e.lngLat)
              .setHTML(`<b style="color:#5b8def">${zl}</b><br><span style="font-size:10px;color:#aaa">${props.zt || ''}</span>`)
              .addTo(map);
          });
          map.on('mouseleave', 'card-ctx-fill', () => {
            map.getCanvas().style.cursor = '';
            ctxPopup.remove();
            ctxHovered = null;
          });
        }

        // ── Highlight layer: the specific drawn zone ──
        const resolvedId = _lehFindZoneId(zones, muIndex, mu, cleanZone, speciesType);
        let highlightBounds = null;

        if (resolvedId && zones[resolvedId]) {
          const z = zones[resolvedId];
          const hasModifier = zone && /[\*\+]/.test(zone);
          map.addSource('card-zone', {
            type: 'geojson',
            data: { type: 'Feature', properties: { id: resolvedId, label: z.lb, partial: hasModifier }, geometry: z.g }
          });
          map.addLayer({
            id: 'card-zone-fill', type: 'fill', source: 'card-zone',
            paint: { 'fill-color': '#f0b429', 'fill-opacity': 0.22 }
          });
          map.addLayer({
            id: 'card-zone-line', type: 'line', source: 'card-zone',
            paint: { 'line-color': '#f0b429', 'line-width': 2.5, 'line-opacity': 1.0 }
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

        if (highlightBounds) {
          map.fitBounds(highlightBounds, {
            padding: 32,
            maxZoom: 11,
            // Slight pitch for 3D feel
            pitch: 40,
            bearing: -8,
            duration: 800
          });
        }

        const label = resolvedId && zones[resolvedId] ? zones[resolvedId].lb : `MU ${mu}`;
        // Extract zone letter from resolvedId for tooltip e.g. "D_3-32C" → "Zone C"
        const resolvedZoneLetter = resolvedId ? (resolvedId.match(/([A-Z]+)$/) || [])[1] : '';
        const resolvedZoneDisplay = resolvedZoneLetter ? `Zone ${resolvedZoneLetter}` : label;
        setStatus(resolvedZoneDisplay, true);

        // Tooltip popup on highlighted zone hover
        const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, className: 'leh-card-tip' });
        map.on('mouseenter', 'card-zone-fill', e => {
          map.getCanvas().style.cursor = 'pointer';
          const props = e.features[0].properties;
          const zl = resolvedZoneLetter ? `Zone ${resolvedZoneLetter}` : (props.label || label);
          popup.setLngLat(e.lngLat)
            .setHTML(`<b style="color:#f0b429">${zl}</b>${props.partial ? '<br><span style="font-size:9px;color:#aaa">★ Partial area — see regulations</span>' : ''}`)
            .addTo(map);
        });
        map.on('mouseleave', 'card-zone-fill', () => { map.getCanvas().style.cursor = ''; popup.remove(); });

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
      if (!map.getSource('card-dem')) {
        map.addSource('card-dem', { type: 'raster-dem', url: 'mapbox://mapbox.mapbox-terrain-dem-v1', tileSize: 512, maxzoom: 14 });
      }
      map.setTerrain({ source: 'card-dem', exaggeration: 1.5 });
      map.jumpTo({ center, zoom, pitch, bearing });
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
  const expandBtn = mapDiv.closest('div')?.parentElement?.querySelector('.leh-map-expand-btn') ||
                    document.querySelector(`[onclick*="bcCardMapToggleFullscreen('${containerId}')"]`);

  if (_bcCardMapFullscreen[containerId]) {
    // ── Collapse ──
    const { overlay, placeholder } = _bcCardMapFullscreen[containerId];
    if (placeholder?.parentNode) placeholder.parentNode.replaceChild(mapDiv, placeholder);
    mapDiv.style.height = '280px';
    mapDiv.style.borderRadius = '8px';
    if (overlay?.parentNode) overlay.parentNode.removeChild(overlay);
    delete _bcCardMapFullscreen[containerId];
    if (expandBtn) { expandBtn.textContent = '⛶'; expandBtn.title = 'Expand map'; }
    document.body.style.overflow = '';
  } else {
    // ── Expand ──
    const placeholder = document.createElement('div');
    placeholder.style.height = '280px';
    mapDiv.parentNode?.replaceChild(placeholder, mapDiv);

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:#0d0d0d;display:flex;flex-direction:column';

    // Top bar with collapse button — always visible
    const bar = document.createElement('div');
    bar.style.cssText = [
      'display:flex',
      'align-items:center',
      'justify-content:flex-end',
      'padding:8px 14px',
      'background:rgba(18,18,18,0.96)',
      'border-bottom:1px solid #2e2e2e',
      'flex-shrink:0',
      'backdrop-filter:blur(4px)',
      'gap:10px',
    ].join(';');

    // Layer toggle buttons in the bar (Satellite / Topo)
    const mu          = mapDiv.dataset.mu          || '';
    const zone        = mapDiv.dataset.zone        || '';
    const speciesType = mapDiv.dataset.speciesType || '';
    if (mu) {
      ['satellite', 'topo'].forEach(t => {
        const tb = document.createElement('button');
        tb.className = 'leh-map-btn' + ((_lehCardMaps[containerId]?._lehCurrentTile === t) ? ' active' : '');
        tb.textContent = t.charAt(0).toUpperCase() + t.slice(1);
        tb.id = `${containerId}_btn_${t}`;
        tb.style.cssText = 'font-size:11px;padding:4px 12px;';
        tb.onclick = () => bcCardMapSetLayer(containerId, t);
        bar.appendChild(tb);
      });
    }

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕&nbsp;&nbsp;Collapse';
    closeBtn.className = 'leh-map-btn';
    closeBtn.style.cssText = 'font-size:12px;padding:5px 16px;margin-left:auto;font-weight:600;';
    closeBtn.title = 'Exit fullscreen (Esc)';
    closeBtn.onclick = () => bcCardMapToggleFullscreen(containerId);
    bar.appendChild(closeBtn);

    overlay.appendChild(bar);
    mapDiv.style.height = 'calc(100vh - 45px)';
    mapDiv.style.borderRadius = '0';
    overlay.appendChild(mapDiv);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    _bcCardMapFullscreen[containerId] = { overlay, placeholder };
    if (expandBtn) { expandBtn.textContent = '✕'; expandBtn.title = 'Collapse map'; }
  }

  // Mapbox GL resize (replaces Leaflet invalidateSize)
  setTimeout(() => {
    const m = _lehCardMaps[containerId];
    if (m && typeof m.resize === 'function') m.resize();
    else if (m && typeof m.invalidateSize === 'function') m.invalidateSize(); // legacy fallback
  }, 60);
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') Object.keys(_bcCardMapFullscreen).forEach(id => bcCardMapToggleFullscreen(id));
});
