/* HuntSmart Canada — progressive UX improvements.
   Keeps existing draw, map, auth and data logic intact. */
(function () {
  'use strict';

  const routeForPage = {
    home: '#home',
    filter: '#bc-draws',
    draws: '#bc-results',
    saved: '#saved',
    map: '#map',
    abProfile: '#alberta-profile',
    abFilter: '#alberta-draws',
    abDraws: '#alberta-results',
    drawDetail: '#draw-detail',
    bcOpenSeasons: '#open-seasons',
    methodology: '#methodology'
  };
  const pageForRoute = Object.fromEntries(Object.entries(routeForPage).map(([page, hash]) => [hash, page]));
  const titleForPage = {
    home: 'HuntSmart Canada — Know Your Draw Odds',
    filter: 'BC Draw Finder — HuntSmart Canada',
    draws: 'BC Draw Results — HuntSmart Canada',
    saved: 'Saved Draws — HuntSmart Canada',
    map: 'Interactive Hunting Map — HuntSmart Canada',
    abProfile: 'Alberta Priority Profile — HuntSmart Canada',
    abFilter: 'Alberta Draw Finder — HuntSmart Canada',
    abDraws: 'Alberta Draw Results — HuntSmart Canada',
    bcOpenSeasons: 'BC General Open Seasons — HuntSmart Canada',
    methodology: 'Data & Methodology — HuntSmart Canada'
  };

  let routingFromHistory = false;
  const originalShowPage = window.showPage;
  if (typeof originalShowPage === 'function') {
    window.showPage = function improvedShowPage(page) {
      closeFilterSheets();
      originalShowPage(page);
      document.title = titleForPage[page] || 'HuntSmart Canada';
      if (!routingFromHistory && routeForPage[page] && location.hash !== routeForPage[page]) {
        history.pushState({ hsPage: page }, '', routeForPage[page]);
      }
      document.documentElement.dataset.hsPage = page;
      window.setTimeout(() => enhanceDynamicContent(document), 0);
    };
  }

  function navigateFromLocation() {
    const page = pageForRoute[location.hash];
    if (!page || typeof window.showPage !== 'function') return;
    routingFromHistory = true;
    try {
      if (page === 'abFilter' && typeof window.goToAlberta === 'function') window.goToAlberta();
      else window.showPage(page);
    } finally {
      window.setTimeout(() => { routingFromHistory = false; }, 0);
    }
  }

  window.addEventListener('popstate', navigateFromLocation);
  window.addEventListener('hashchange', navigateFromLocation);

  let lastWasMobile = window.innerWidth <= 768;
  window.addEventListener('resize', function () {
    const isMobile = window.innerWidth <= 768;
    if (isMobile !== lastWasMobile) {
      closeFilterSheets();
      lastWasMobile = isMobile;
    }
  });

  function buttonLabel(button) {
    return (button.getAttribute('title') || button.textContent || '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[→←×✕↺⌕⛶]/g, '')
      .trim();
  }

  function enhanceDynamicContent(root) {
    root.querySelectorAll('button:not([type])').forEach(button => button.type = 'button');
    root.querySelectorAll('button:not([aria-label])').forEach(button => {
      const label = buttonLabel(button);
      if (label && label.length <= 80) button.setAttribute('aria-label', label);
    });
    root.querySelectorAll('select:not([aria-label])').forEach(select => {
      const label = select.closest('label')?.childNodes?.[0]?.textContent?.trim() || select.title || 'Select an option';
      select.setAttribute('aria-label', label);
    });
    root.querySelectorAll('#countDisplay, #abCountDisplay, #fpMatchNum, #abFpMatchNum, #savedSubtitle').forEach(el => {
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'true');
    });
  }

  function addFreshnessNotes() {
    const targets = [
      document.querySelector('#drawsPage .draws-title-block'),
      document.querySelector('#abDrawsPage .draws-title-block')
    ];
    targets.forEach(target => {
      if (!target || target.querySelector('.data-freshness-note')) return;
      const note = document.createElement('div');
      note.className = 'data-freshness-note';
      note.textContent = 'Historical data years vary by draw · Confirm current regulations before applying';
      target.appendChild(note);
    });
  }

  let backdrop;
  function getBackdrop() {
    if (backdrop) return backdrop;
    backdrop = document.createElement('div');
    backdrop.className = 'hs-filter-backdrop';
    backdrop.hidden = true;
    backdrop.addEventListener('click', closeFilterSheets);
    document.body.appendChild(backdrop);
    return backdrop;
  }

  function syncFilterSheetState() {
    const open = Boolean(document.querySelector('#sidebarInner.open, #abSidebarInner.open'));
    const layer = getBackdrop();
    layer.hidden = !open;
    document.body.classList.toggle('hs-filter-sheet-open', open);
  }

  function closeFilterSheets() {
    document.querySelectorAll('#sidebarInner.open, #abSidebarInner.open').forEach(el => el.classList.remove('open'));
    document.querySelectorAll('#sidebarArrow.open, #abSidebarArrow.open').forEach(el => el.classList.remove('open'));
    if (backdrop) backdrop.hidden = true;
    document.body.classList.remove('hs-filter-sheet-open');
  }
  window.hsCloseFilterSheets = closeFilterSheets;

  if (typeof window.toggleSidebar === 'function') {
    const original = window.toggleSidebar;
    window.toggleSidebar = function () { original(); syncFilterSheetState(); };
  }
  if (typeof window.toggleAbSidebar === 'function') {
    const original = window.toggleAbSidebar;
    window.toggleAbSidebar = function () { original(); syncFilterSheetState(); };
  }

  function syncHamburgerState() {
    const btn = document.getElementById('navHamburger');
    const menu = document.getElementById('navMobileMenu');
    if (btn && menu) btn.setAttribute('aria-expanded', menu.classList.contains('open') ? 'true' : 'false');
  }
  if (typeof window.toggleNavMenu === 'function') {
    const original = window.toggleNavMenu;
    window.toggleNavMenu = function () { original(); syncHamburgerState(); };
  }
  if (typeof window.closeNavMenu === 'function') {
    const original = window.closeNavMenu;
    window.closeNavMenu = function () { original(); syncHamburgerState(); };
  }

  function init() {
    enhanceDynamicContent(document);
    addFreshnessNotes();
    syncHamburgerState();
    if (!location.hash) history.replaceState({ hsPage: 'home' }, '', '#home');
    else navigateFromLocation();
  }

  const observer = new MutationObserver(records => {
    records.forEach(record => record.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) enhanceDynamicContent(node);
    }));
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
