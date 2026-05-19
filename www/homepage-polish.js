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
