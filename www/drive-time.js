// ── DRIVE-TIME.JS — Drive time helper ────────────────────────
// Reads from DRIVE_TIMES (loaded from data/drive-times.json via data.js)
// and CITIES (from cities.js).
// Home city stored in localStorage + Firestore via auth/sync.

const DRIVE_TIME_LS_KEY = 'hs_home_city';

// ── GET / SET HOME CITY ──────────────────────────────────────
function getHomeCity() {
  return localStorage.getItem(DRIVE_TIME_LS_KEY) || null;
}

function setHomeCity(cityId) {
  if (!cityId) {
    localStorage.removeItem(DRIVE_TIME_LS_KEY);
  } else {
    localStorage.setItem(DRIVE_TIME_LS_KEY, cityId);
  }
  // Re-render visible cards so drive pills update immediately
  if (typeof applyFilters === 'function') applyFilters();
  if (typeof abApplyFilters === 'function') abApplyFilters();
}
window.setHomeCity = setHomeCity;
window.getHomeCity = getHomeCity;

// ── NORMALIZE MU KEY ─────────────────────────────────────────
// draws.json uses '1-03', drive-times.json uses '1-03' too (kept raw)
// Just pass mu directly — keys match draws.json format
function _normalizeBCKey(mu) {
  return (mu || '').trim();
}

// ── FORMAT HOURS ─────────────────────────────────────────────
function formatDriveHours(h) {
  if (h == null || isNaN(h)) return null;
  if (h < 1) {
    const mins = Math.round(h * 60 / 5) * 5; // round to nearest 5 min
    return `${mins}min`;
  }
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60 / 15) * 15; // round to nearest 15 min
  if (mins === 0) return `${hrs}h`;
  if (mins === 60) return `${hrs + 1}h`;
  return `${hrs}h ${mins}min`;
}
window.formatDriveHours = formatDriveHours;

// ── GET DRIVE TIME FOR A BC WMU ───────────────────────────────
// Returns { h, km, formatted } or null
function getBCDriveTime(mu) {
  const cityId = getHomeCity();
  if (!cityId || typeof DRIVE_TIMES === 'undefined') return null;
  const cityData = DRIVE_TIMES[cityId];
  if (!cityData) return null;
  const key = _normalizeBCKey(mu);
  const entry = cityData[key];
  if (!entry) return null;
  return {
    h:         entry.h,
    km:        entry.km,
    formatted: formatDriveHours(entry.h),
  };
}
window.getBCDriveTime = getBCDriveTime;

// ── GET DRIVE TIME FOR AN AB WMU ─────────────────────────────
// wmu should be the raw WMU number string e.g. "422"
function getABDriveTime(wmu) {
  const cityId = getHomeCity();
  if (!cityId || typeof DRIVE_TIMES === 'undefined') return null;
  const cityData = DRIVE_TIMES[cityId];
  if (!cityData) return null;
  // AB keys are prefixed with 'ab_'
  // Handle comma-separated WMUs — use first one
  const firstWmu = String(wmu || '').split(',')[0].trim();
  const entry = cityData['ab_' + firstWmu];
  if (!entry) return null;
  return {
    h:         entry.h,
    km:        entry.km,
    formatted: formatDriveHours(entry.h),
  };
}
window.getABDriveTime = getABDriveTime;

// ── RENDER DRIVE TIME PILL ────────────────────────────────────
// Returns HTML string for the drive time pill shown on cards
// province: 'BC' | 'AB', id: MU string
function renderDriveTimePill(province, id) {
  const cityId = getHomeCity();

  // No city set — show a subtle nudge to set one
  if (!cityId) {
    return `<span class="drive-set-city" onclick="event.stopPropagation();window.openHomeCityModal&&window.openHomeCityModal()">🚗 Set home city for drive times</span>`;
  }

  const dt = province === 'BC' ? getBCDriveTime(id) : getABDriveTime(id);
  if (!dt) return '';

  const cityName = (CITIES.find(c => c.id === cityId) || {}).name || cityId;

  return `<div class="drive-pill" title="Estimated drive time — tap your avatar to change city">
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
      <path d="M2 8l1.5-4h5L10 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="3.5" cy="9" r="1" fill="currentColor"/>
      <circle cx="8.5" cy="9" r="1" fill="currentColor"/>
      <path d="M1 8h10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    </svg>
    <span class="drive-pill-time">~${dt.formatted}</span>
    <span class="drive-pill-city">from ${cityName}</span>
  </div>`;
}
window.renderDriveTimePill = renderDriveTimePill;

// ── CITY DROPDOWN HTML ────────────────────────────────────────
// Generates the <select> dropdown grouped by province
function buildCitySelectHTML(selectId, currentCityId) {
  const bcCities = CITIES.filter(c => c.province === 'BC');
  const abCities = CITIES.filter(c => c.province === 'AB');

  const opts = (cities) => cities.map(c =>
    `<option value="${c.id}"${c.id === currentCityId ? ' selected' : ''}>${c.name}</option>`
  ).join('');

  return `<select id="${selectId}" class="city-select" onchange="window._onCitySelectChange(this.value)">
    <option value="">— Select your city —</option>
    <optgroup label="British Columbia">${opts(bcCities)}</optgroup>
    <optgroup label="Alberta">${opts(abCities)}</optgroup>
  </select>`;
}
window.buildCitySelectHTML = buildCitySelectHTML;

window._onCitySelectChange = function(cityId) {
  setHomeCity(cityId || null);
  // Update any open settings modal display
  const lbl = document.getElementById('homeCityLabel');
  if (lbl) {
    const city = CITIES.find(c => c.id === cityId);
    lbl.textContent = city ? city.name : 'Not set';
  }
  // Persist to Firestore if logged in
  if (typeof syncSaveHomeCity === 'function') syncSaveHomeCity(cityId || null);
};
