/* HuntSmart growth analytics + first-touch attribution.
   No PII is sent here. Attribution is stored first-party so blog -> app -> signup
   journeys survive navigation on huntsmartcanada.ca. */
(() => {
  'use strict';

  const MEASUREMENT_ID = 'G-VK3HNNDEW2';
  const FIRST_KEY = 'hs_first_touch_v1';
  const LAST_KEY = 'hs_last_touch_v1';
  const MAX = 180;

  function clip(value, max = MAX) {
    return String(value == null ? '' : value).trim().slice(0, max);
  }

  function safeHost(url) {
    try { return new URL(url, window.location.href).hostname.toLowerCase(); }
    catch (_) { return ''; }
  }

  function isInternalHost(host) {
    return !host || host === window.location.hostname.toLowerCase() ||
      host === 'huntsmartcanada.ca' || host === 'www.huntsmartcanada.ca' ||
      host.endsWith('.huntsmartcanada.netlify.app') || host === 'huntsmartcanada.netlify.app';
  }

  function sourceFromContext(params) {
    const explicit = params.get('utm_source');
    if (explicit) return clip(explicit.toLowerCase(), 80);
    if (params.get('gclid')) return 'google_ads';
    if (params.get('fbclid')) return 'facebook';
    if (params.get('msclkid')) return 'microsoft_ads';
    if (params.get('ref')) return clip(params.get('ref').toLowerCase(), 80);

    const refHost = safeHost(document.referrer);
    if (!refHost || isInternalHost(refHost)) return 'direct';
    if (/google\./.test(refHost)) return 'google_organic';
    if (/bing\./.test(refHost)) return 'bing_organic';
    if (/facebook\.|fb\.com|l\.facebook/.test(refHost)) return 'facebook';
    if (/instagram\./.test(refHost)) return 'instagram';
    if (/youtube\.|youtu\.be/.test(refHost)) return 'youtube';
    if (/reddit\./.test(refHost)) return 'reddit';
    return clip(refHost.replace(/^www\./, ''), 80);
  }

  function mediumFromContext(params, source) {
    if (params.get('utm_medium')) return clip(params.get('utm_medium').toLowerCase(), 80);
    if (source.endsWith('_organic')) return 'organic';
    if (source.endsWith('_ads')) return 'paid';
    if (['facebook', 'instagram', 'youtube', 'reddit'].includes(source)) return 'social';
    if (source === 'direct') return 'none';
    return 'referral';
  }

  function pageType() {
    const p = window.location.pathname.toLowerCase();
    if (p.startsWith('/blog')) return 'blog';
    if (p.startsWith('/admin')) return 'admin';
    return 'app';
  }

  function articleSlug() {
    const p = window.location.pathname.replace(/\/+$/, '');
    if (!p.startsWith('/blog/')) return p === '/blog' ? 'blog-index' : '';
    return p.split('/').filter(Boolean).slice(1).join('/') || 'blog-index';
  }

  function buildTouch() {
    const params = new URLSearchParams(window.location.search);
    const source = sourceFromContext(params);
    return {
      source,
      medium: mediumFromContext(params, source),
      campaign: clip(params.get('utm_campaign'), 100),
      content: clip(params.get('utm_content'), 100),
      term: clip(params.get('utm_term'), 100),
      landingPath: clip(window.location.pathname, 240),
      landingTitle: clip(document.title, 160),
      referrer: clip(document.referrer, 300),
      capturedAt: new Date().toISOString()
    };
  }

  function readJson(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  }

  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  const touch = buildTouch();
  let firstTouch = readJson(FIRST_KEY);
  if (!firstTouch) {
    firstTouch = touch;
    writeJson(FIRST_KEY, firstTouch);
  }
  writeJson(LAST_KEY, touch);

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });

  if (!document.querySelector(`script[data-hs-ga4="${MEASUREMENT_ID}"]`)) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
    script.dataset.hsGa4 = MEASUREMENT_ID;
    document.head.appendChild(script);
  }

  function track(name, params = {}) {
    try {
      window.gtag('event', name, {
        page_type: pageType(),
        article_slug: articleSlug(),
        hs_source: touch.source,
        hs_medium: touch.medium,
        ...params
      });
    } catch (_) {}
  }

  track('page_view', {
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname + window.location.search
  });

  if (pageType() === 'blog') {
    track('blog_view', { article_slug: articleSlug() || 'blog-index' });
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    let target;
    try { target = new URL(link.href, window.location.href); } catch (_) { return; }
    if (!isInternalHost(target.hostname.toLowerCase())) return;

    if (pageType() === 'blog' && (target.pathname === '/' || target.pathname === '/index.html')) {
      track('blog_to_app_click', {
        article_slug: articleSlug() || 'blog-index',
        link_text: clip(link.textContent, 80)
      });
    }
  }, true);

  const demo = document.getElementById('hsMapDemo');
  if (demo) {
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      track('blog_map_started', { article_slug: articleSlug() });
    };
    ['pointerdown', 'change', 'keydown'].forEach(type => demo.addEventListener(type, start, { once: true, capture: true }));

    demo.addEventListener('click', (event) => {
      const mode = event.target.closest && event.target.closest('[data-demo-mode]');
      if (mode) track('blog_map_mode_select', { map_mode: clip(mode.dataset.demoMode, 20) });
      if (event.target.closest && event.target.closest('#demoFree')) track('blog_map_free_explore');
    });

    const species = document.getElementById('demoSpecies');
    if (species) species.addEventListener('change', () => {
      if (species.value) track('blog_map_species_select', { species: clip(species.value, 60) });
    });

    const step = document.getElementById('demoStepCount');
    if (step && typeof MutationObserver !== 'undefined') {
      let completed = false;
      const inspect = () => {
        if (!completed && /Step\s+9\s+of\s+9/i.test(step.textContent || '')) {
          completed = true;
          track('blog_map_completed', { article_slug: articleSlug() });
        }
      };
      new MutationObserver(inspect).observe(step, { childList: true, subtree: true, characterData: true });
      inspect();
    }
  }

  if (pageType() === 'app' && typeof window.showPage === 'function' && !window.showPage.__hsAnalyticsWrapped) {
    const originalShowPage = window.showPage;
    const wrapped = function (page) {
      const result = originalShowPage.apply(this, arguments);
      track('app_section_view', { app_section: clip(page, 40) });
      return result;
    };
    wrapped.__hsAnalyticsWrapped = true;
    window.showPage = wrapped;
  }

  window.HSAnalytics = {
    measurementId: MEASUREMENT_ID,
    track,
    attribution: touch,
    getFirstTouch: () => readJson(FIRST_KEY),
    getLastTouch: () => readJson(LAST_KEY)
  };
})();
