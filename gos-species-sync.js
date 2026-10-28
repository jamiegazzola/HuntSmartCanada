/* HuntSmart GOS species sync
   One canonical species list for desktop + mobile, derived from live GOS data. */
(function () {
  'use strict';
  if (window.__HS_GOS_SPECIES_SYNC__) return;
  window.__HS_GOS_SPECIES_SYNC__ = true;
  window.__HS_GOS_SPECIES_SYNC_VERSION__ = '2026-10-28-gos-species-v1';

  var BIG_GAME = new Set([
    'Mule Deer (Black-tailed)',
    'White-tailed Deer',
    'Deer',
    'Fallow Deer',
    'Moose',
    'Elk',
    'Caribou',
    'Bison',
    'Bighorn Mountain Sheep',
    'Thinhorn Mountain Sheep',
    'Mountain Sheep',
    'Mountain Goat',
    'Black Bear',
    'Grizzly Bear',
    'Cougar',
    'Wolf',
    'Coyote',
    'Bobcat',
    'Lynx',
    'Wolverine'
  ]);

  var collator = typeof Intl !== 'undefined' && Intl.Collator
    ? new Intl.Collator('en-CA', { sensitivity: 'base', numeric: true })
    : null;
  var rebuilding = false;
  var selectObserver = null;

  function alpha(a, b) {
    if (collator) return collator.compare(String(a), String(b));
    return String(a).localeCompare(String(b));
  }

  function clean(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function getDataSpecies() {
    var rows = [];
    try {
      if (typeof BC_OS_DATA !== 'undefined' && Array.isArray(BC_OS_DATA)) rows = BC_OS_DATA;
    } catch (_) {}
    var seen = new Set();
    rows.forEach(function (row) {
      var species = clean(row && row.species);
      if (species) seen.add(species);
    });
    return Array.from(seen);
  }

  function partitionSpecies(species) {
    return {
      big: species.filter(function (name) { return BIG_GAME.has(name); }).sort(alpha),
      other: species.filter(function (name) { return !BIG_GAME.has(name); }).sort(alpha)
    };
  }

  function option(value, label) {
    var el = document.createElement('option');
    el.value = value;
    el.textContent = label;
    return el;
  }

  function appendGroup(select, label, values) {
    if (!values.length) return;
    var group = document.createElement('optgroup');
    group.label = label;
    values.forEach(function (name) { group.appendChild(option(name, name)); });
    select.appendChild(group);
  }

  function expectedValues() {
    var parts = partitionSpecies(getDataSpecies());
    return parts.big.concat(parts.other);
  }

  function currentValues(select) {
    return Array.from(select ? select.options : []).map(function (opt) { return clean(opt.value); }).filter(Boolean);
  }

  function sameValues(a, b) {
    return a.length === b.length && a.every(function (value, index) { return value === b[index]; });
  }

  function rebuildSelect(force) {
    var select = document.getElementById('osSpeciesSel');
    if (!select || rebuilding) return false;
    var species = getDataSpecies();
    if (!species.length) return false;
    var parts = partitionSpecies(species);
    var expected = parts.big.concat(parts.other);
    if (!force && sameValues(currentValues(select), expected)) {
      select.dataset.hsSpeciesSynced = '1';
      return true;
    }

    rebuilding = true;
    var current = clean(select.value);
    if (!current) {
      try { current = clean(typeof osSelSpecies !== 'undefined' ? osSelSpecies : ''); } catch (_) {}
    }
    select.replaceChildren();
    select.appendChild(option('', 'All species'));
    appendGroup(select, 'Big Game', parts.big);
    appendGroup(select, 'Small Game & Birds', parts.other);
    select.value = expected.includes(current) ? current : '';
    select.dataset.built = '1';
    select.dataset.hsSpeciesSynced = '1';
    rebuilding = false;
    syncMobileLabel();
    return true;
  }

  function syncMobileLabel() {
    var select = document.getElementById('osSpeciesSel');
    var label = document.getElementById('gosSpeciesBtnText');
    if (!select || !label) return;
    var selected = select.options && select.selectedIndex >= 0 ? select.options[select.selectedIndex] : null;
    label.textContent = selected && selected.value ? selected.textContent : 'All species';
  }

  function closeDrop() {
    var drop = document.getElementById('gosSpeciesDrop');
    var button = document.getElementById('gosSpeciesBtn');
    if (drop) drop.style.display = 'none';
    if (button) button.setAttribute('aria-expanded', 'false');
  }

  function pickSpecies(value) {
    rebuildSelect(false);
    var select = document.getElementById('osSpeciesSel');
    if (!select) return;
    select.value = value;
    try {
      if (typeof window.osOnSpecies === 'function') window.osOnSpecies(value);
      else select.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (_) {
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    syncMobileLabel();
    closeDrop();
  }

  function makeRow(opt) {
    var row = document.createElement('div');
    row.className = 'hs-species-row' + (opt.selected ? ' hs-active' : '');
    row.setAttribute('role', 'option');
    row.setAttribute('aria-selected', opt.selected ? 'true' : 'false');
    row.setAttribute('tabindex', '0');
    row.textContent = opt.textContent;
    function choose() { pickSpecies(opt.value); }
    row.addEventListener('click', choose);
    row.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        choose();
      }
    });
    return row;
  }

  function renderMobileDrop() {
    if (!rebuildSelect(false)) return false;
    var select = document.getElementById('osSpeciesSel');
    var drop = document.getElementById('gosSpeciesDrop');
    if (!select || !drop) return false;
    drop.replaceChildren();

    Array.from(select.children).forEach(function (child) {
      if (child.tagName === 'OPTGROUP') {
        var header = document.createElement('div');
        header.className = 'hs-species-group';
        header.textContent = child.label;
        drop.appendChild(header);
        Array.from(child.children).forEach(function (opt) { drop.appendChild(makeRow(opt)); });
      } else if (child.tagName === 'OPTION') {
        drop.appendChild(makeRow(child));
      }
    });
    return true;
  }

  window.gosToggleSpeciesDrop = function () {
    var drop = document.getElementById('gosSpeciesDrop');
    var button = document.getElementById('gosSpeciesBtn');
    if (!drop || !button) return;
    if (getComputedStyle(drop).display !== 'none' && drop.style.display !== 'none') {
      closeDrop();
      return;
    }
    if (!renderMobileDrop()) return;
    drop.style.display = 'block';
    button.setAttribute('aria-expanded', 'true');
  };

  window.gosPickSpecies = pickSpecies;

  function installStyles() {
    if (document.getElementById('hsGosSpeciesSyncStyles')) return;
    var style = document.createElement('style');
    style.id = 'hsGosSpeciesSyncStyles';
    style.textContent = [
      '@media(max-width:768px){',
      '#bcOpenSeasonsPage #gosSpeciesDrop{max-height:min(68dvh,560px)!important;overflow-y:auto!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;scrollbar-width:thin!important}',
      '#bcOpenSeasonsPage #gosSpeciesDrop .hs-species-group{position:sticky;top:0;z-index:2;padding:9px 14px 7px!important;background:rgba(14,18,16,.98)!important;color:#7f8d83!important;font-size:9px!important;font-weight:800!important;letter-spacing:.09em!important;text-transform:uppercase!important;border-top:1px solid rgba(255,255,255,.07)!important;border-bottom:1px solid rgba(255,255,255,.06)!important}',
      '#bcOpenSeasonsPage #gosSpeciesDrop .hs-species-row{min-height:44px!important;display:flex!important;align-items:center!important;padding:0 14px!important;cursor:pointer!important}',
      '}'
    ].join('');
    document.head.appendChild(style);
  }

  function watchSelect() {
    var select = document.getElementById('osSpeciesSel');
    if (!select || selectObserver) return;
    select.addEventListener('change', function () {
      syncMobileLabel();
      setTimeout(function () { rebuildSelect(false); }, 0);
    });
    selectObserver = new MutationObserver(function () {
      if (rebuilding) return;
      var expected = expectedValues();
      if (expected.length && !sameValues(currentValues(select), expected)) rebuildSelect(true);
      else syncMobileLabel();
    });
    selectObserver.observe(select, { childList: true, subtree: true });
  }

  function refresh() {
    installStyles();
    rebuildSelect(false);
    watchSelect();
    syncMobileLabel();
    var button = document.getElementById('gosSpeciesBtn');
    if (button) {
      button.setAttribute('aria-haspopup', 'listbox');
      if (!button.hasAttribute('aria-expanded')) button.setAttribute('aria-expanded', 'false');
    }
    var drop = document.getElementById('gosSpeciesDrop');
    if (drop) {
      drop.setAttribute('role', 'listbox');
      drop.setAttribute('aria-label', 'GOS species');
    }
  }

  document.addEventListener('pointerdown', function (event) {
    var drop = document.getElementById('gosSpeciesDrop');
    var button = document.getElementById('gosSpeciesBtn');
    if (!drop || !button || getComputedStyle(drop).display === 'none') return;
    if (!drop.contains(event.target) && !button.contains(event.target)) closeDrop();
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh, { once: true });
  else refresh();
  [80, 250, 700, 1500, 2800].forEach(function (delay) { setTimeout(refresh, delay); });
  window.addEventListener('pageshow', function () { setTimeout(refresh, 0); });
  window.hsRefreshGosSpecies = refresh;
})();
