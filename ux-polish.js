/* HuntSmart paid-product UX polish — preview branch only */
(function () {
  'use strict';

  var ICONS = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/></svg>',
    draws: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M22 19V2"/></svg>',
    seasons: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/><path d="m8 15 2 2 5-5"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/></svg>',
    saved: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3Z"/></svg>'
  };

  function qs(id) { return document.getElementById(id); }

  function updateProductCopy() {
    var gos = qs('navBCOS');
    var mgos = qs('mNavBCOS');
    if (gos) gos.textContent = 'Open Seasons';
    if (mgos) mgos.textContent = 'Open Seasons';

    var eyebrow = document.querySelector('.hero-eyebrow');
    if (eyebrow && /2025\s+Season/i.test(eyebrow.textContent || '')) {
      eyebrow.textContent = 'British Columbia & Alberta · 2026/27 Season';
    }

    document.querySelectorAll('[data-hs-gos-copy]').forEach(function (el) {
      el.textContent = 'Open Seasons';
    });
  }

  /* ───────────────────────────────────────────────────────────
     MOBILE TAB BAR
     ─────────────────────────────────────────────────────────── */
  function buildMobileTabs() {
    if (qs('hsMobileTabbar')) return;

    var bar = document.createElement('nav');
    bar.id = 'hsMobileTabbar';
    bar.className = 'hs-mobile-tabbar';
    bar.setAttribute('aria-label', 'Primary navigation');
    bar.innerHTML =
      '<button class="hs-mobile-tab" data-tab="home" type="button">' + ICONS.home + '<span>Home</span></button>' +
      '<button class="hs-mobile-tab" data-tab="draws" type="button">' + ICONS.draws + '<span>Draws</span></button>' +
      '<button class="hs-mobile-tab" data-tab="seasons" type="button">' + ICONS.seasons + '<span>Seasons</span></button>' +
      '<button class="hs-mobile-tab" data-tab="map" type="button">' + ICONS.map + '<span>Map</span></button>' +
      '<button class="hs-mobile-tab" data-tab="saved" type="button">' + ICONS.saved + '<span>Saved</span></button>';
    document.body.appendChild(bar);

    var backdrop = document.createElement('div');
    backdrop.id = 'hsDrawsSheetBackdrop';
    backdrop.className = 'hs-draws-sheet-backdrop';
    backdrop.innerHTML =
      '<div class="hs-draws-sheet" role="dialog" aria-modal="true" aria-label="Choose draw system">' +
        '<div class="hs-draws-sheet-handle"></div>' +
        '<div class="hs-draws-sheet-title">Draws</div>' +
        '<div class="hs-draws-sheet-sub">Choose a province. Your filters and saved hunts stay separate for each draw system.</div>' +
        '<button type="button" class="hs-draws-choice" data-draw-choice="bc"><span><strong>British Columbia</strong><span>LEH odds, success history and hunt codes</span></span><span class="hs-draws-choice-arrow">→</span></button>' +
        '<button type="button" class="hs-draws-choice" data-draw-choice="ab"><span><strong>Alberta</strong><span>Personalized odds using your priority points</span></span><span class="hs-draws-choice-arrow">→</span></button>' +
      '</div>';
    document.body.appendChild(backdrop);

    function closeSheet() { backdrop.classList.remove('open'); }
    function openSheet() { backdrop.classList.add('open'); }

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeSheet();
      var choice = e.target.closest('[data-draw-choice]');
      if (!choice) return;
      e.preventDefault();
      e.stopPropagation();
      closeSheet();
      if (choice.dataset.drawChoice === 'bc') {
        if (typeof window.showPage === 'function') window.showPage('filter');
      } else if (typeof window.goToAlberta === 'function') {
        window.goToAlberta();
      }
    });

    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('.hs-mobile-tab');
      if (!btn) return;
      var tab = btn.dataset.tab;
      if (tab === 'draws') { openSheet(); return; }
      if (tab === 'home' && typeof window.showPage === 'function') window.showPage('home');
      if (tab === 'seasons' && typeof window.showPage === 'function') window.showPage('bcOpenSeasons');
      if (tab === 'map' && typeof window.showPage === 'function') window.showPage('map');
      if (tab === 'saved' && typeof window.showPage === 'function') window.showPage('saved');
    });

    syncMobileTabs();
  }

  function visiblePageId() {
    var ids = ['homePage','filterPage','drawsPage','savedPage','mapPage','abProfilePage','abFilterPage','abDrawsPage','drawDetailPage','bcOpenSeasonsPage'];
    for (var i = 0; i < ids.length; i++) {
      var el = qs(ids[i]);
      if (!el) continue;
      var cs = window.getComputedStyle(el);
      if (cs.display !== 'none' && cs.visibility !== 'hidden') return ids[i];
    }
    return '';
  }

  function activeTabForPage(page) {
    if (page === 'home') return 'home';
    if (page === 'map') return 'map';
    if (page === 'saved') return 'saved';
    if (page === 'bcOpenSeasons') return 'seasons';
    if (page === 'drawDetail') return window.__drawDetailReturnPage === 'map' ? 'map' : 'draws';
    if (['filter','draws','abProfile','abFilter','abDraws'].indexOf(page) >= 0) return 'draws';
    return null;
  }

  function pageNameFromVisibleId(id) {
    var map = {
      homePage:'home', filterPage:'filter', drawsPage:'draws', savedPage:'saved', mapPage:'map',
      abProfilePage:'abProfile', abFilterPage:'abFilter', abDrawsPage:'abDraws',
      drawDetailPage:'drawDetail', bcOpenSeasonsPage:'bcOpenSeasons'
    };
    return map[id] || 'home';
  }

  function syncMobileTabs(page) {
    var bar = qs('hsMobileTabbar');
    if (!bar) return;
    page = page || pageNameFromVisibleId(visiblePageId());
    var active = activeTabForPage(page);
    bar.querySelectorAll('.hs-mobile-tab').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.tab === active);
    });
  }

  function hookPageNavigation() {
    if (typeof window.showPage !== 'function' || window.showPage._hsPaidUxWrapped) return;
    var previous = window.showPage;
    var wrapped = function (page) {
      var out = previous.apply(this, arguments);
      window.setTimeout(function () {
        syncMobileTabs(page);
        enhanceDetailPage();
        enhanceCards();
      }, 30);
      return out;
    };
    wrapped._hsPaidUxWrapped = true;
    window.showPage = wrapped;
  }

  /* ───────────────────────────────────────────────────────────
     RESULT CARD ACTION HIERARCHY
     ─────────────────────────────────────────────────────────── */
  function addCardActions(card, index, province) {
    if (!card || card.dataset.hsUxEnhanced === '1') return;
    var expand = card.querySelector('.card-expand');
    var toggle = card.querySelector('.expand-toggle');
    if (!expand || !toggle) return;

    card.dataset.hsUxEnhanced = '1';
    var actions = document.createElement('div');
    actions.className = 'hs-card-actions';

    var view = document.createElement('button');
    view.type = 'button';
    view.className = 'hs-view-hunt-btn';
    view.textContent = 'View hunt';
    view.setAttribute('aria-label', 'Open full hunt details');
    view.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      window.__drawDetailReturnPage = province === 'AB' ? 'abDraws' : 'draws';
      if (province === 'AB' && typeof window.openABDrawDetail === 'function') window.openABDrawDetail(index);
      if (province === 'BC' && typeof window.openDrawDetail === 'function') window.openDrawDetail(index);
    });

    toggle.addEventListener('click', function (e) { e.stopPropagation(); });
    if (/show details/i.test(toggle.textContent || '')) toggle.textContent = 'Quick details';

    expand.parentNode.insertBefore(actions, expand);
    actions.appendChild(view);
    actions.appendChild(toggle);
  }

  function enhanceCards() {
    var bc = qs('cardsGrid');
    if (bc) bc.querySelectorAll(':scope > .card').forEach(function (card, i) { addCardActions(card, i, 'BC'); });
    var ab = qs('abCardsGrid');
    if (ab) ab.querySelectorAll(':scope > .card').forEach(function (card, i) { addCardActions(card, i, 'AB'); });
  }

  function watchCardGrids() {
    ['cardsGrid','abCardsGrid'].forEach(function (id) {
      var grid = qs(id);
      if (!grid || grid.dataset.hsUxObserved === '1') return;
      grid.dataset.hsUxObserved = '1';
      new MutationObserver(function () { window.requestAnimationFrame(enhanceCards); })
        .observe(grid, { childList: true });
    });
  }

  /* ───────────────────────────────────────────────────────────
     SELECTED HUNT DETAIL: SUMMARY FIRST, EVIDENCE SECOND
     ─────────────────────────────────────────────────────────── */
  function detailRowValue(labelStartsWith) {
    var rows = document.querySelectorAll('#drawDetailPage .dd-row');
    for (var i = 0; i < rows.length; i++) {
      var label = rows[i].querySelector('.dd-lbl');
      var value = rows[i].querySelector('.dd-val');
      if (!label || !value) continue;
      if ((label.textContent || '').trim().toLowerCase().indexOf(labelStartsWith.toLowerCase()) === 0) {
        return (value.textContent || '').trim();
      }
    }
    return '';
  }

  function metric(label, value) {
    if (!value || value === '—') return '';
    return '<div class="hs-dd-metric"><div class="hs-dd-metric-label">' + label + '</div><div class="hs-dd-metric-value">' + value + '</div></div>';
  }

  function enhanceDetailPage() {
    var page = qs('drawDetailPage');
    if (!page || window.getComputedStyle(page).display === 'none') return;
    var hero = page.querySelector('.dd-hero');
    if (!hero) return;

    var big = hero.querySelector('.dd-odds-big');
    var isNew = big && (big.textContent || '').trim().toUpperCase() === 'NEW';
    if (isNew) {
      var sub = hero.querySelector('.dd-odds-sub');
      var ratio = hero.querySelector('.dd-odds-ratio');
      if (sub) sub.textContent = 'New hunt';
      if (ratio) ratio.textContent = 'No historical results yet';
    }

    if (!page.querySelector('.hs-dd-metrics')) {
      var drawCode = detailRowValue('Draw Code');
      var season = detailRowValue('Season');
      var tags = detailRowValue('Tags Available') || detailRowValue('Quota');
      var drive = detailRowValue('Drive Time');
      var harvest = detailRowValue('Harvest Success');

      var strip = document.createElement('div');
      strip.className = 'hs-dd-metrics';
      strip.innerHTML =
        metric('Draw code', drawCode) +
        metric('Season', season) +
        metric(tags && /pts/i.test(tags) ? 'Priority' : 'Tags / quota', tags) +
        metric(drive ? 'Drive estimate' : 'Harvest success', drive || harvest);
      if (strip.children.length) hero.insertAdjacentElement('afterend', strip);
    }

    if (isNew && !page.querySelector('.hs-dd-new-note')) {
      var note = document.createElement('div');
      note.className = 'hs-dd-new-note';
      note.innerHTML = '<strong>New for 2026/27.</strong><span>This hunt has no prior draw-odds or harvest history yet. HuntSmart will add historical performance as official results become available.</span>';
      var metrics = page.querySelector('.hs-dd-metrics');
      if (metrics) metrics.insertAdjacentElement('afterend', note);
      else hero.insertAdjacentElement('afterend', note);
    }
  }

  function watchDetailPage() {
    var page = qs('drawDetailPage');
    if (!page || page.dataset.hsUxObserved === '1') return;
    page.dataset.hsUxObserved = '1';
    new MutationObserver(function () { window.requestAnimationFrame(enhanceDetailPage); })
      .observe(page, { childList: true, subtree: false });
  }

  function init() {
    updateProductCopy();
    buildMobileTabs();
    hookPageNavigation();
    watchCardGrids();
    watchDetailPage();
    enhanceCards();
    enhanceDetailPage();
    syncMobileTabs();

    /* Cards are rendered asynchronously; one delayed sweep catches initial chunks. */
    window.setTimeout(function () {
      watchCardGrids();
      enhanceCards();
      updateProductCopy();
      syncMobileTabs();
    }, 600);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
