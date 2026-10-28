/* HuntSmart mobile account navigation
   Keeps authentication reachable when the compact primary tab bar owns the header. */
(function () {
  'use strict';
  if (window.__HUNTSMART_MOBILE_ACCOUNT_NAV__) return;
  window.__HUNTSMART_MOBILE_ACCOUNT_NAV__ = true;

  var mq = window.matchMedia('(max-width: 768px)');
  var accountButton = null;
  var authObserver = null;
  var installScheduled = false;

  function iconMarkup(initial) {
    if (initial) {
      return '<span class="hs-mobile-account-avatar" aria-hidden="true">' + initial + '</span>';
    }
    return '<svg class="hs-mobile-account-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>';
  }

  function syncAccountState() {
    var source = document.getElementById('authNavBtn');
    var button = document.getElementById('hsMobileAccountTab');
    if (!button) return;
    var signedIn = !!(window._authUser || (source && source.dataset.authState === 'signed-in'));
    var initial = '';
    if (signedIn) {
      var user = window._authUser;
      var raw = user && (user.displayName || user.email);
      if (raw) initial = String(raw).trim().charAt(0).toUpperCase();
      if (!initial && source) initial = (source.textContent || '').trim().charAt(0).toUpperCase();
      if (!initial) initial = 'U';
    }

    var nextMarkup = iconMarkup(initial);
    var icon = button.querySelector('.hs-mobile-account-visual');
    if (icon && icon.innerHTML !== nextMarkup) icon.innerHTML = nextMarkup;

    var nextLabel = signedIn ? 'Account' : 'Sign In';
    var label = button.querySelector('.hs-mobile-account-label');
    if (label && label.textContent !== nextLabel) label.textContent = nextLabel;

    var nextState = signedIn ? 'signed-in' : 'signed-out';
    if (button.dataset.authState !== nextState) button.dataset.authState = nextState;

    var nextAria = signedIn ? 'Open account menu' : 'Sign in';
    if (button.getAttribute('aria-label') !== nextAria) button.setAttribute('aria-label', nextAria);
  }

  function positionAuthMenu() {
    var button = document.getElementById('hsMobileAccountTab');
    var menu = document.getElementById('authMenu');
    if (!button || !menu || !mq.matches) return;
    var r = button.getBoundingClientRect();
    var gap = 7;
    var top;
    if (r.top > innerHeight / 2) {
      top = Math.max(8, r.top - menu.offsetHeight - gap);
    } else {
      top = Math.min(innerHeight - menu.offsetHeight - 8, r.bottom + gap);
    }
    menu.style.top = Math.max(8, top) + 'px';
    menu.style.right = '8px';
    menu.style.left = 'auto';
    menu.style.maxWidth = 'calc(100vw - 16px)';
  }

  function openAccount() {
    var source = document.getElementById('authNavBtn');
    var signedIn = !!(window._authUser || (source && source.dataset.authState === 'signed-in'));
    if (!signedIn) {
      import('./auth.js').then(function (module) {
        if (module && typeof module.openAuthModal === 'function') module.openAuthModal();
      });
      return;
    }
    if (typeof window.openAuthMenu === 'function') {
      window.openAuthMenu();
      requestAnimationFrame(positionAuthMenu);
      setTimeout(positionAuthMenu, 30);
    }
  }

  function installStyles() {
    if (document.getElementById('hsMobileAccountNavStyles')) return;
    var style = document.createElement('style');
    style.id = 'hsMobileAccountNavStyles';
    style.textContent = [
      '@media(max-width:768px){',
      '#hsMobileTabbar{display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;width:100%!important}',
      '#hsMobileTabbar .hs-mobile-tab{min-width:0!important;width:auto!important;padding-left:2px!important;padding-right:2px!important}',
      '#hsMobileAccountTab{appearance:none!important;-webkit-appearance:none!important}',
      '#hsMobileAccountTab .hs-mobile-account-visual{display:flex;align-items:center;justify-content:center;width:20px;height:20px;margin:0 auto 1px}',
      '#hsMobileAccountTab .hs-mobile-account-icon{width:17px;height:17px;display:block}',
      '#hsMobileAccountTab .hs-mobile-account-avatar{display:flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:999px;background:rgba(101,213,118,.18);border:1px solid rgba(101,213,118,.38);color:#9befa5;font-size:9px;font-weight:800;line-height:1}',
      '#hsMobileAccountTab .hs-mobile-account-label{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '}',
      '@media(max-width:350px){#hsMobileAccountTab .hs-mobile-account-label{font-size:8px!important}}'
    ].join('');
    document.head.appendChild(style);
  }

  function install() {
    installStyles();
    var tabbar = document.getElementById('hsMobileTabbar');
    if (!tabbar || !mq.matches) return false;
    var existing = document.getElementById('hsMobileAccountTab');
    if (!existing) {
      var button = document.createElement('button');
      button.type = 'button';
      button.id = 'hsMobileAccountTab';
      button.className = 'hs-mobile-tab';
      button.dataset.tab = 'account';
      button.innerHTML = '<span class="hs-mobile-account-visual"></span><span class="hs-mobile-account-label">Sign In</span>';
      button.addEventListener('click', openAccount);
      tabbar.appendChild(button);
      accountButton = button;
    } else {
      accountButton = existing;
    }
    syncAccountState();

    var source = document.getElementById('authNavBtn');
    if (source && !authObserver) {
      authObserver = new MutationObserver(syncAccountState);
      authObserver.observe(source, { attributes: true, attributeFilter: ['data-auth-state', 'title'], childList: true, subtree: true });
    }
    return true;
  }

  function scheduleInstall() {
    if (installScheduled) return;
    installScheduled = true;
    requestAnimationFrame(function () {
      installScheduled = false;
      install();
    });
  }

  var rootObserver = new MutationObserver(function () {
    if (!mq.matches) return;
    if (document.getElementById('hsMobileAccountTab')) return;
    scheduleInstall();
  });

  function boot() {
    install();
    rootObserver.observe(document.body, { childList: true, subtree: true });
  }

  if (mq.addEventListener) mq.addEventListener('change', scheduleInstall);
  else if (mq.addListener) mq.addListener(scheduleInstall);
  window.addEventListener('resize', function () { if (accountButton) positionAuthMenu(); }, { passive: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
