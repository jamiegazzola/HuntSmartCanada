/* HuntSmart mobile profile: the existing header auth button is the one source of truth.
   Leave Firebase's original click handlers and menu anchor intact. */
(function () {
  'use strict';
  if (window.__HUNTSMART_MOBILE_ACCOUNT_NAV__) return;
  window.__HUNTSMART_MOBILE_ACCOUNT_NAV__ = true;
  function sync() {
    const button = document.getElementById('authNavBtn');
    if (!button) return;
    document.getElementById('hsMobileAccountTab')?.remove();
    const signedIn = button.dataset.authState === 'signed-in' || !!window._authUser;
    button.setAttribute('aria-label', signedIn ? 'Open account menu' : 'Sign in to HuntSmart');
  }
  function init() {
    const button = document.getElementById('authNavBtn');
    if (!button) return;
    sync();
    new MutationObserver(sync).observe(button, {
      attributes: true, attributeFilter: ['data-auth-state'],
      childList: true, subtree: true
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
