/* HuntSmart Canada — preview-only DOM changes layered over the current production build. */
(function () {
  'use strict';

  function setLink(id, label, href) {
    const el = document.getElementById(id);
    if (!el) return;
    if (label) {
      const badge = el.querySelector('.saved-count-badge');
      el.textContent = label;
      if (badge) el.append(' ', badge);
    }
    el.setAttribute('href', href);
  }

  function card(icon, title, copy) {
    return '<div class="feat-card"><div class="feat-card-icon">' + icon + '</div><div class="feat-card-content"><div class="feat-card-title">' + title + '</div><p class="feat-card-desc">' + copy + '</p></div></div>';
  }

  function methodologyMarkup() {
    return '<section class="methodology-page" id="methodologyPage" style="display:none">' +
      '<div class="methodology-hero"><button type="button" class="methodology-back" onclick="showPage(\'home\')">← Back to HuntSmart</button>' +
      '<h1>Data &amp; Methodology</h1><p>Understand where HuntSmart information comes from, what each number means, and what still needs to be confirmed in the current official regulations.</p></div>' +
      '<div class="methodology-grid">' +
      '<article class="methodology-card"><span>01</span><h2>Official source data</h2><p>Draw, authorization, applicant, harvest, season and boundary information is organized from provincial government publications and datasets. Jurisdiction and source years remain attached to the information wherever available.</p></article>' +
      '<article class="methodology-card"><span>02</span><h2>Draw odds</h2><p>Historical odds are calculated from the applicants and authorizations reported for that draw and year. Alberta priority analysis depends on the profile information entered by the user and the priority-level information available in the source data.</p></article>' +
      '<article class="methodology-card"><span>03</span><h2>Harvest results</h2><p>Harvest success describes how often issued opportunities resulted in a reported successful harvest. Available years and reporting methods can vary by species, draw and province.</p></article>' +
      '<article class="methodology-card"><span>04</span><h2>Maps and boundaries</h2><p>WMU, LEH and open-season map layers are planning aids. Boundaries, access, closures and legal descriptions must always be checked against current official sources before hunting.</p></article>' +
      '</div><div class="methodology-notice"><strong>Planning tool, not a regulation.</strong><p>HuntSmart helps compare opportunities and organize research. The current provincial synopsis, regulations, closures and official notices remain authoritative.</p><button type="button" class="pro-sub-btn" onclick="showPage(\'filter\')">Explore BC Draws</button></div></section>';
  }

  function patchShowPage() {
    if (typeof window.showPage !== 'function' || window.__hsMethodologyPatched) return;
    window.__hsMethodologyPatched = true;
    const original = window.showPage;
    window.showPage = function (page) {
      const methodology = document.getElementById('methodologyPage');
      if (methodology) methodology.style.display = 'none';
      original(page);
      if (page === 'methodology' && methodology) methodology.style.display = 'block';
    };
  }

  function apply() {
    document.querySelector('.hs-trial-bar')?.remove();
    document.querySelector('.hero-eyebrow')?.remove();

    const heroBody = document.querySelector('.hero-body');
    if (heroBody) heroBody.textContent = 'Draw odds, harvest success, historical trends, and personalized priority analysis for BC and Alberta hunters — all in one place.';

    setLink('navHome', 'Home', '#home');
    setLink('navBC', 'BC Draws', '#bc-draws');
    setLink('navBCOS', 'Open Seasons', '#open-seasons');
    setLink('navAlberta', 'AB Draws', '#alberta-draws');
    setLink('navMap', 'Map', '#map');
    setLink('navSaved', 'Saved', '#saved');
    setLink('mNavHome', 'Home', '#home');
    setLink('mNavBC', 'BC Draws', '#bc-draws');
    setLink('mNavBCOS', 'Open Seasons', '#open-seasons');
    setLink('mNavAlberta', 'Alberta Draws', '#alberta-draws');
    setLink('mNavMap', 'Map', '#map');
    setLink('mNavSaved', 'Saved', '#saved');

    const brand = document.querySelector('.nav-brand');
    if (brand) brand.setAttribute('href', '#home');
    const hamburger = document.getElementById('navHamburger');
    if (hamburger) {
      hamburger.type = 'button';
      hamburger.setAttribute('aria-label', 'Open navigation menu');
      hamburger.setAttribute('aria-controls', 'navMobileMenu');
      hamburger.setAttribute('aria-expanded', 'false');
    }

    const howTitle = document.querySelector('.hiw-section .home-section-title');
    if (howTitle) howTitle.textContent = 'Find stronger opportunities in four clear steps.';

    const featTitle = document.querySelector('.feat-section .home-section-title');
    if (featTitle) featTitle.textContent = 'The information that matters before you apply.';
    const featGrid = document.querySelector('.feat-section .feat-grid');
    if (featGrid) {
      featGrid.classList.add('feat-grid--focused');
      featGrid.innerHTML =
        card('📈', 'Historical Odds & Trends', 'Review applicant totals, authorizations, annual odds, and long-term changes instead of relying on one season.') +
        card('🎯', 'Personal Alberta Analysis', 'Enter your priority information once and compare your position across eligible Alberta opportunities.') +
        card('🗺️', 'Maps & Smart Filters', 'Explore WMUs visually, then narrow results by species, area, odds, season dates, and harvest success.') +
        card('🔖', 'Harvest, Save & Compare', 'Consider historical harvest results, shortlist promising draws, and compare your options side by side.');
    }

    const pro = document.querySelector('.pro-section');
    if (pro) {
      pro.className = 'home-section beta-section';
      pro.innerHTML = '<div class="home-section-inner beta-section-inner"><div><div class="home-section-label">Free public beta</div><h2 class="home-section-title">Plan with the full HuntSmart toolkit.</h2><p class="beta-section-sub">HuntSmart is currently free while the product, data coverage and mobile experience are being refined. No trial countdown and no credit card required.</p><div class="beta-actions"><button type="button" class="pro-sub-btn" onclick="showPage(\'filter\')">Explore BC Draws</button><button type="button" class="pro-sub-btn pro-sub-btn--ghost" onclick="showPage(\'methodology\')">Data &amp; Methodology</button></div></div><div class="trust-card"><div class="trust-card-kicker">Built for informed planning</div><h3>Know what the numbers mean.</h3><p>Source years vary by dataset. HuntSmart clearly separates historical results from current regulations and encourages verification before applying or hunting.</p><button type="button" class="trust-link" onclick="showPage(\'methodology\')">Read the methodology →</button></div></div>';
    }

    if (!document.getElementById('methodologyPage')) document.body.insertAdjacentHTML('beforeend', methodologyMarkup());

    document.querySelectorAll('footer, .site-footer').forEach(footer => {
      footer.innerHTML = footer.innerHTML.replace(/©\s*2025/g, '© 2026');
      if (!footer.querySelector('[data-methodology-link]')) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.methodologyLink = 'true';
        button.className = 'trust-link';
        button.textContent = 'Data & Methodology';
        button.addEventListener('click', function () { showPage('methodology'); });
        footer.appendChild(button);
      }
    });

    document.querySelectorAll('button:not([type])').forEach(function (button) { button.type = 'button'; });
    patchShowPage();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once: true });
  else apply();
})();
