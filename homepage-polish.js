(function() {
  'use strict';

  /* ── only runs on the home page ── */
  function isHome() {
    var hp = document.getElementById('homePage');
    return hp && hp.style.display !== 'none';
  }

  /* ══════════════════════════════════════
     1. CURSOR GLOW
  ══════════════════════════════════════ */
  var glow = document.createElement('div');
  glow.className = 'hs-cursor-glow';
  document.body.appendChild(glow);

  document.addEventListener('mousemove', function(e) {
    glow.style.left = e.clientX + 'px';
    glow.style.top  = e.clientY + 'px';
    if (isHome()) glow.classList.add('active');
    else glow.classList.remove('active');
  });
  document.addEventListener('mouseleave', function() {
    glow.classList.remove('active');
  });

  /* ══════════════════════════════════════
     2. PARALLAX HERO
  ══════════════════════════════════════ */
  function parallax() {
    if (!isHome()) return;
    var bg = document.querySelector('.hero-photo-bg');
    if (!bg) return;
    var scrollY = window.scrollY;
    var hero    = document.querySelector('.hero-photo');
    if (!hero) return;
    var heroH   = hero.offsetHeight;
    if (scrollY > heroH) return;
    var pct = scrollY / heroH;
    bg.style.transform = 'scale(1.08) translateY(' + (pct * 28) + '%)';
  }
  window.addEventListener('scroll', parallax, { passive: true });

  /* ══════════════════════════════════════
     3. SCROLL REVEAL — staggered
  ══════════════════════════════════════ */
  function addRevealClasses() {
    /* section inners */
    document.querySelectorAll('.home-section-inner, .home-stats-strip').forEach(function(el) {
      el.classList.add('hs-reveal');
    });

    /* individual HIW steps — staggered */
    document.querySelectorAll('.hiw-step').forEach(function(el, i) {
      el.classList.add('hs-reveal', 'hs-delay-' + ((i % 4) + 1));
    });

    /* feature cards — staggered */
    document.querySelectorAll('.feat-card').forEach(function(el, i) {
      el.classList.add('hs-reveal', 'hs-delay-' + ((i % 4) + 1));
    });
  }

  var revealObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('hs-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.07 });

  function observeReveal() {
    document.querySelectorAll('.hs-reveal').forEach(function(el) {
      revealObserver.observe(el);
    });
  }

  /* ══════════════════════════════════════
     4. NUMBER COUNTERS
     Uses actual stats from your index.html
  ══════════════════════════════════════ */
  var counters = [
    { selector: '.home-stat-num', targets: [] }
  ];

  /* Map each stat element to its real end value */
  var statData = [
    { suffix: '',  end: 1138 },   /* BC draw codes      */
    { suffix: '',  end: 1236 },   /* Alberta draws      */
    { suffix: '+', end: 25   },   /* Years of BC data   */
    { suffix: '',  end: 10   },   /* BC species         */
    { suffix: '',  end: 8    }    /* AB species         */
  ];

  function animateCounter(el, endVal, suffix, duration) {
    var startTime = null;
    var startVal  = 0;
    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      /* ease out cubic */
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.round(startVal + (endVal - startVal) * eased);
      el.textContent = current.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = endVal.toLocaleString() + suffix;
    }
    requestAnimationFrame(step);
  }

  function initCounters() {
    var statEls = document.querySelectorAll('.home-stat-num');
    statEls.forEach(function(el, i) {
      if (!statData[i]) return;
      /* store original text so counters don't break on re-init */
      el.dataset.end    = statData[i].end;
      el.dataset.suffix = statData[i].suffix;
      el.dataset.counted = '0';
    });

    var counterObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          if (el.dataset.counted === '1') return;
          el.dataset.counted = '1';
          animateCounter(
            el,
            parseInt(el.dataset.end),
            el.dataset.suffix || '',
            1400
          );
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.4 });

    statEls.forEach(function(el) {
      if (el.dataset.end) counterObserver.observe(el);
    });
  }

  /* ══════════════════════════════════════
     INIT — run now + re-run when showPage
     switches back to home
  ══════════════════════════════════════ */
  function init() {
    if (!isHome()) return;
    addRevealClasses();
    observeReveal();
    initCounters();
  }

  /* hook into your existing showPage function */
  var _origShowPage = window.showPage;
  window.showPage = function(page) {
    if (_origShowPage) _origShowPage(page);
    if (page === 'home') {
      setTimeout(init, 60);
    } else {
      glow.classList.remove('active');
    }
  };

  /* initial load */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

/* HuntSmart preview — map overlay opacity controller.
   Isolated from navigation: only touches map paint properties and opacity UI. */
(function () {
  'use strict';

  var opacityPct = 100;
  var mapHooked = null;

  function clampPct(value) {
    var n = Number(value);
    if (!Number.isFinite(n)) return opacityPct;
    return Math.max(0, Math.min(100, n));
  }

  function setBoundaryVisibility() {
    try {
      if (typeof fullMapInstance === 'undefined' || !fullMapInstance) return;
      if (typeof _LYR_WMU_LINE !== 'undefined' && fullMapInstance.getLayer(_LYR_WMU_LINE)) {
        fullMapInstance.setPaintProperty(_LYR_WMU_LINE, 'line-opacity', 0.82);
      }
      if (typeof _LYR_LEH_LINE !== 'undefined' && fullMapInstance.getLayer(_LYR_LEH_LINE)) {
        fullMapInstance.setPaintProperty(_LYR_LEH_LINE, 'line-opacity', 0.9);
      }
    } catch (e) {
      console.warn('[HuntSmart preview] Could not preserve map boundaries:', e);
    }
  }

  function applyOpacity() {
    try {
      if (typeof fullMapSetLEHOpacity === 'function') {
        // Existing map API uses 0 = fully visible, 1 = fully transparent.
        fullMapSetLEHOpacity(1 - opacityPct / 100);
        setBoundaryVisibility();
      }
    } catch (e) {
      console.warn('[HuntSmart preview] Overlay opacity update failed:', e);
    }
    syncControls();
    hookMapStyleChanges();
  }

  function syncControls() {
    var desktop = document.getElementById('hsPreviewOverlayOpacity');
    var desktopValue = document.getElementById('hsPreviewOverlayOpacityValue');
    if (desktop && Number(desktop.value) !== opacityPct) desktop.value = String(opacityPct);
    if (desktopValue) desktopValue.textContent = Math.round(opacityPct) + '%';

    var modal = document.getElementById('hsModal');
    if (modal) {
      var ranges = modal.querySelectorAll('.hs-slider-row input[type="range"], .hs-modal-slider-row input[type="range"]');
      ranges.forEach(function (range) {
        var row = range.parentElement;
        if (!row || !row.querySelector('#hsOpV, #hsOpacityVal')) return;
        if (Number(range.value) !== opacityPct) range.value = String(opacityPct);
        var value = row.querySelector('#hsOpV, #hsOpacityVal');
        if (value) value.textContent = Math.round(opacityPct) + '%';
      });
    }
  }

  function hookMapStyleChanges() {
    try {
      if (typeof fullMapInstance === 'undefined' || !fullMapInstance || mapHooked === fullMapInstance) return;
      mapHooked = fullMapInstance;
      var reapply = function () {
        window.setTimeout(function () {
          if (opacityPct !== 100) applyOpacity();
        }, 80);
      };
      fullMapInstance.on('style.load', reapply);
    } catch (e) {
      console.warn('[HuntSmart preview] Could not hook map style changes:', e);
    }
  }

  window.fullMapSetOverlayOpacity = function (value) {
    opacityPct = clampPct(value);
    applyOpacity();
  };

  function addDesktopControl() {
    if (document.getElementById('hsPreviewOverlayOpacity')) return;
    var toolbar = document.querySelector('#mapPage .fullmap-toolbar-main, #mapPage .fullmap-toolbar-right, #mapPage .fullmap-topbar-right');
    if (!toolbar) return;

    var clearBtn = document.getElementById('fullMapClearBtn');
    var label = document.createElement('label');
    label.className = 'hs-preview-opacity-control';
    label.title = 'Adjust coloured WMU and LEH overlay fill';
    label.innerHTML = '<span class="hs-preview-opacity-label">Overlay</span>' +
      '<input id="hsPreviewOverlayOpacity" type="range" min="0" max="100" step="5" value="100" aria-label="Overlay fill opacity">' +
      '<span id="hsPreviewOverlayOpacityValue" class="hs-preview-opacity-value">100%</span>';

    if (clearBtn && clearBtn.parentElement === toolbar) toolbar.insertBefore(label, clearBtn);
    else toolbar.appendChild(label);

    label.querySelector('input').addEventListener('input', function () {
      window.fullMapSetOverlayOpacity(this.value);
    });
  }

  function addStyles() {
    if (document.getElementById('hsPreviewOpacityStyles')) return;
    var style = document.createElement('style');
    style.id = 'hsPreviewOpacityStyles';
    style.textContent =
      '@media (min-width:769px){' +
      '#mapPage .hs-preview-opacity-control{display:flex;align-items:center;gap:6px;height:34px;padding:0 9px;border:1px solid rgba(255,255,255,.12);border-radius:9px;background:rgba(255,255,255,.045);white-space:nowrap;flex:0 0 auto}' +
      '#mapPage .hs-preview-opacity-label{font-size:10px;font-weight:800;color:var(--text-muted,#8a948d);letter-spacing:.02em}' +
      '#mapPage #hsPreviewOverlayOpacity{width:78px;margin:0;accent-color:#4ade80;cursor:pointer}' +
      '#mapPage .hs-preview-opacity-value{min-width:28px;font-size:10px;font-weight:900;color:#4ade80;text-align:right}' +
      '}' +
      '@media (min-width:769px) and (max-width:1100px){#mapPage .hs-preview-opacity-label{display:none}#mapPage #hsPreviewOverlayOpacity{width:62px}#mapPage .hs-preview-opacity-control{padding:0 7px;gap:4px}}';
    document.head.appendChild(style);
  }

  function isOpacitySlider(target) {
    if (!target || target.tagName !== 'INPUT' || target.type !== 'range') return false;
    var row = target.parentElement;
    return !!(row && row.querySelector('#hsOpV, #hsOpacityVal'));
  }

  // Fix both existing mobile Layers-sheet implementations without replacing them.
  document.addEventListener('input', function (event) {
    if (!isOpacitySlider(event.target)) return;
    opacityPct = clampPct(event.target.value);
    applyOpacity();
  });

  var modal = document.getElementById('hsModal');
  if (modal && typeof MutationObserver !== 'undefined') {
    new MutationObserver(function () { syncControls(); }).observe(modal, { childList: true, subtree: true });
  }

  function initOpacityPreview() {
    addStyles();
    addDesktopControl();
    syncControls();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initOpacityPreview);
  else initOpacityPreview();
})();
