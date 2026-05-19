// ── COMPARE PAGE REMOVED ─────────────────────────────────────
// Compare functionality merged into the Saved tab.
// See bc-saved-compare.js → buildComparePanel / buildABComparePanel



// ══════════════════════════════════════════════════════════════
// ── HOMEPAGE province cards (dynamic update)
// ══════════════════════════════════════════════════════════════
function initHomePage() {
  // Update AB stats once data is available
  if (AB_DATA.length > 0) {
    const abDrawCount = document.getElementById('abHomeDrawCount');
    const cards = buildABCards();
    if (abDrawCount) abDrawCount.textContent = cards.length.toLocaleString();
  }
}


// ── PROFILE FILTER HELPER ──
function abSetProfileFilter(mode, btn) {
  abProfileFilter = mode;
  document.querySelectorAll('#abDrawsPage .chips-wrap .chip').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  abApplyFilters();
}




// ══════════════════════════════════════════════════════════════
// ── ALBERTA WMU MAP FILTER
// Uses embedded GeoJSON — no external API calls needed.
// WMU polygons are approximate shapes based on official AB map.
// Toggle: sidebar "Filter by Map" button above WMU dropdown.
// Selecting zones on map directly drives abSelWMU + abApplyFilters.
// ══════════════════════════════════════════════════════════════



// ══════════════════════════════════════════════════════════════
// ── HOME CITY MODAL
// ══════════════════════════════════════════════════════════════
function openHomeCityModal() {
  const existing = document.getElementById('homeCityModal');
  if (existing) { existing.remove(); return; }

  const currentCityId = typeof getHomeCity === 'function' ? getHomeCity() : null;
  const cityHtml = typeof buildCitySelectHTML === 'function'
    ? buildCitySelectHTML('homeCitySelect', currentCityId)
    : '<p style="color:var(--text-muted)">City list loading…</p>';

  const modal = document.createElement('div');
  modal.id = 'homeCityModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML = `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:28px 24px;width:100%;max-width:360px;box-shadow:0 16px 48px rgba(0,0,0,0.5)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
        <div>
          <div style="font-size:16px;font-weight:700;color:var(--text)">Home City</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:3px">Drive times shown from your city on every draw card</div>
        </div>
        <button onclick="document.getElementById('homeCityModal').remove()" style="background:none;border:none;color:var(--text-muted);font-size:20px;cursor:pointer;padding:4px;line-height:1">✕</button>
      </div>
      ${cityHtml}
      <div style="margin-top:16px;display:flex;gap:10px">
        <button onclick="document.getElementById('homeCityModal').remove()" style="flex:1;padding:10px;background:var(--bg-input,#1e2a1e);border:1px solid var(--border);border-radius:10px;color:var(--text-muted);font-size:13px;cursor:pointer">Cancel</button>
        <button onclick="window._saveHomeCityAndClose()" style="flex:1;padding:10px;background:var(--accent-bright,#4ade80);border:none;border-radius:10px;color:#0a0f0a;font-size:13px;font-weight:700;cursor:pointer">Save</button>
      </div>
      <div id="homeCityStatus" style="margin-top:10px;font-size:12px;color:var(--accent-bright);text-align:center;min-height:16px"></div>
    </div>
  `;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}
window.openHomeCityModal = openHomeCityModal;

window._saveHomeCityAndClose = function() {
  const sel = document.getElementById('homeCitySelect');
  if (!sel) return;
  const cityId = sel.value || null;
  if (typeof setHomeCity === 'function') setHomeCity(cityId);
  if (typeof syncSaveHomeCity === 'function') syncSaveHomeCity(cityId);
  const status = document.getElementById('homeCityStatus');
  if (status) {
    const city = cityId && typeof CITIES !== 'undefined' ? CITIES.find(c => c.id === cityId) : null;
    status.textContent = city ? `✓ Set to ${city.name}` : '✓ Cleared';
  }
  setTimeout(() => {
    const modal = document.getElementById('homeCityModal');
    if (modal) modal.remove();
  }, 800);
};
