/* HuntSmart hunt-detail chrome guard.
   Hides the duplicate sticky nav injected below the primary app header while
   the selected-hunt page is open, without changing navigation elsewhere. */
(function () {
  'use strict';
  if (window.__HS_DETAIL_CHROME_GUARD__) return;
  window.__HS_DETAIL_CHROME_GUARD__ = true;

  const HIDDEN_CLASS = 'hs-detail-redundant-nav';

  function detailVisible() {
    const page = document.getElementById('drawDetailPage');
    if (!page) return false;
    const cs = getComputedStyle(page);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && page.getClientRects().length > 0;
  }

  function clearHiddenNavs() {
    document.querySelectorAll('nav.' + HIDDEN_CLASS).forEach(nav => nav.classList.remove(HIDDEN_CLASS));
  }

  function syncDetailChrome() {
    clearHiddenNavs();
    if (!detailVisible()) return;

    const navs = Array.from(document.querySelectorAll('nav')).filter(nav => {
      if (nav.id === 'hsMobileTabbar' || nav.classList.contains('hs-mobile-tabbar')) return false;
      const cs = getComputedStyle(nav);
      const r = nav.getBoundingClientRect();
      return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    });

    if (navs.length < 2) return;
    navs.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

    // The real app header is the topmost visible nav. Hunt detail should begin
    // directly below it; any second full-width sticky nav in the next 56px band
    // is duplicate chrome and must not cover Back / Save / Compare.
    const primary = navs[0];
    navs.forEach(nav => {
      if (nav === primary) return;
      const r = nav.getBoundingClientRect();
      const fullWidth = r.width >= window.innerWidth * 0.9;
      const secondBand = r.top >= 48 && r.top <= 76 && r.height >= 40 && r.height <= 72;
      if (fullWidth && secondBand) nav.classList.add(HIDDEN_CLASS);
    });
  }

  function installStyle() {
    if (document.getElementById('hsDetailChromeGuardCss')) return;
    const style = document.createElement('style');
    style.id = 'hsDetailChromeGuardCss';
    style.textContent = 'nav.' + HIDDEN_CLASS + '{display:none!important;}';
    document.head.appendChild(style);
  }

  function install() {
    installStyle();
    syncDetailChrome();

    const detail = document.getElementById('drawDetailPage');
    if (detail && !detail.__hsDetailChromeObserved) {
      detail.__hsDetailChromeObserved = true;
      new MutationObserver(() => requestAnimationFrame(syncDetailChrome)).observe(detail, {
        attributes: true,
        attributeFilter: ['style', 'class'],
        childList: true,
        subtree: false
      });
    }

    window.addEventListener('resize', syncDetailChrome, { passive: true });
    window.addEventListener('pageshow', syncDetailChrome, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
