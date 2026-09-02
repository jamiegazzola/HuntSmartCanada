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
     5. MAP LAYER OPACITY — preview only
     Attaches without replacing HuntSmart navigation functions.
  ══════════════════════════════════════ */
  var _hsWmuOpacity = 100;
  var _hsBoundMap = null;
  var _hsMapObserver = null;

  try {
    var savedWmuOpacity = localStorage.getItem('hs_map_wmu_opacity');
    if (savedWmuOpacity !== null) _hsWmuOpacity = parseInt(savedWmuOpacity, 10);
  } catch (e) {}
  if (isNaN(_hsWmuOpacity)) _hsWmuOpacity = 100;

  function getFullMap() {
    try {
      return (typeof fullMapInstance !== 'undefined') ? fullMapInstance : null;
    } catch (e) {
      return null;
    }
  }

  function applyWmuOpacity() {
    var map = getFullMap();
    if (!map || !map.getLayer || !map.setPaintProperty || !map.getLayer('wmu-fill')) return;
    var factor = Math.max(0, Math.min(1, _hsWmuOpacity / 100));

    map.setPaintProperty('wmu-fill', 'fill-opacity', [
      'case',
      ['boolean', ['feature-state', 'selected'], false], 0.75 * factor,
      ['boolean', ['feature-state', 'hovered'], false], 0.50 * factor,
      ['boolean', ['feature-state', 'hasDraws'], false], 0.38 * factor,
      0.12 * factor
    ]);

    if (map.getLayer('wmu-line')) {
      map.setPaintProperty('wmu-line', 'line-opacity', Math.max(0.12, 0.8 * factor));
    }
  }

  function applyLehLineOpacity(val) {
    var map = getFullMap();
    if (!map || !map.getLayer || !map.setPaintProperty || !map.getLayer('leh-line')) return;
    var opacity = Math.max(0, Math.min(1, parseFloat(val) || 0));
    map.setPaintProperty('leh-line', 'line-opacity', opacity === 0 ? 0 : Math.min(0.9, 0.9 * (opacity / 0.35)));
  }

  function applySavedLehOpacity() {
    var slider = document.getElementById('fullMapLEHOpacity');
    if (!slider) return;

    try {
      var saved = localStorage.getItem('hs_map_leh_opacity');
      if (saved !== null) slider.value = saved;
    } catch (e) {}

    try {
      if (typeof fullMapSetLEHOpacity === 'function') fullMapSetLEHOpacity(slider.value);
    } catch (e) {}
    applyLehLineOpacity(slider.value);
  }

  function bindMapEvents() {
    var map = getFullMap();
    if (!map || !map.on || map === _hsBoundMap) return;
    _hsBoundMap = map;

    map.on('load', function() {
      setTimeout(function() {
        applyWmuOpacity();
        applySavedLehOpacity();
      }, 100);
    });

    map.on('style.load', function() {
      setTimeout(function() {
        applyWmuOpacity();
        applySavedLehOpacity();
      }, 100);
    });
  }

  function initMapOpacityControls() {
    try {
      var mapPage = document.getElementById('mapPage');
      if (!mapPage || mapPage.style.display === 'none') return;

      var lehBtn = document.getElementById('fullMapLEHToggle');
      if (!lehBtn || !lehBtn.parentNode) return;
      var topbarRow = lehBtn.parentNode;

      var wrap = document.getElementById('hsMapWmuOpacityWrap');
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'hsMapWmuOpacityWrap';
        wrap.style.cssText = 'display:flex;align-items:center;gap:5px;white-space:nowrap';
        wrap.innerHTML =
          '<span style="font-size:10px;color:#888">WMU opacity</span>' +
          '<input id="hsMapWmuOpacity" type="range" min="0" max="100" step="5" value="' + _hsWmuOpacity + '" ' +
          'title="Fade WMU colours" style="width:68px;accent-color:#4ade80;cursor:pointer;vertical-align:middle">';
        topbarRow.insertBefore(wrap, lehBtn);

        var wmuSlider = document.getElementById('hsMapWmuOpacity');
        if (wmuSlider) {
          wmuSlider.addEventListener('input', function() {
            _hsWmuOpacity = parseInt(this.value, 10);
            if (isNaN(_hsWmuOpacity)) _hsWmuOpacity = 100;
            try { localStorage.setItem('hs_map_wmu_opacity', String(_hsWmuOpacity)); } catch (e) {}
            applyWmuOpacity();
          });
        }
      }

      var lehSlider = document.getElementById('fullMapLEHOpacity');
      if (lehSlider) {
        lehSlider.min = '0';
        lehSlider.max = '0.8';
        lehSlider.step = '0.05';
        lehSlider.title = 'Fade LEH zone colours';

        var lehLabel = lehSlider.previousElementSibling;
        if (lehLabel && /opacity/i.test(lehLabel.textContent || '')) {
          lehLabel.textContent = 'LEH opacity';
        }

        if (!lehSlider.dataset.hsOpacityBound) {
          lehSlider.dataset.hsOpacityBound = '1';
          lehSlider.addEventListener('input', function() {
            try { localStorage.setItem('hs_map_leh_opacity', this.value); } catch (e) {}
            applyLehLineOpacity(this.value);
          });
        }
      }

      bindMapEvents();
      applyWmuOpacity();
      applySavedLehOpacity();
    } catch (e) {
      /* Preview helper must never interfere with HuntSmart's core controls. */
    }
  }

  function scheduleMapOpacityInit() {
    setTimeout(initMapOpacityControls, 50);
    setTimeout(initMapOpacityControls, 250);
    setTimeout(initMapOpacityControls, 700);
    setTimeout(initMapOpacityControls, 1400);
  }

  function watchMapPage() {
    var mapPage = document.getElementById('mapPage');
    if (!mapPage || typeof MutationObserver === 'undefined') return;
    if (_hsMapObserver) _hsMapObserver.disconnect();
    _hsMapObserver = new MutationObserver(function() {
      if (mapPage.style.display !== 'none') scheduleMapOpacityInit();
    });
    _hsMapObserver.observe(mapPage, { attributes: true, attributeFilter: ['style', 'class'] });
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
  function start() {
    init();
    watchMapPage();
    scheduleMapOpacityInit();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

})();
