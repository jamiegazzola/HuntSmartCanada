/* HuntSmart Canada — preview-only authentication bypass.
   Production authentication remains unchanged. */
(function () {
  'use strict';

  window.__HS_PREVIEW_NO_AUTH = true;
  window._pendingShowResults = null;

  function removeAuthModal() {
    document.getElementById('authModal')?.remove();
  }

  function syncPreviewControl() {
    const button = document.getElementById('authNavBtn');
    if (!button) return;
    button.disabled = true;
    button.dataset.authState = 'preview';
    button.textContent = 'Preview Mode';
    button.title = 'Sign-in is disabled on this preview. Saved items remain on this browser.';
    button.setAttribute('aria-label', button.title);
    button.style.cursor = 'default';
    button.style.opacity = '0.88';
  }

  function restoreUser(previousUser) {
    if (!previousUser) window._authUser = null;
  }

  function runWithoutAuthGate(fn, thisArg, args) {
    const previousUser = window._authUser;
    if (!previousUser) {
      window._authUser = {
        uid: 'huntsmart-preview-local',
        email: 'preview-local@huntsmart.invalid',
        displayName: 'Preview Mode'
      };
    }

    try {
      const result = fn.apply(thisArg, args);
      if (result && typeof result.finally === 'function') {
        return result.finally(function () { restoreUser(previousUser); });
      }
      restoreUser(previousUser);
      return result;
    } catch (error) {
      restoreUser(previousUser);
      throw error;
    }
  }

  function patchGate(name) {
    const current = window[name];
    if (typeof current !== 'function' || current.__hsPreviewBypass) return false;

    function previewBypass() {
      window._pendingShowResults = null;
      removeAuthModal();
      return runWithoutAuthGate(current, this, arguments);
    }

    previewBypass.__hsPreviewBypass = true;
    previewBypass.__hsOriginal = current;
    window[name] = previewBypass;
    return true;
  }

  function install() {
    patchGate('applyFiltersAndGoToDraws');
    patchGate('abFpGoToDraws');

    // Preview-only: prevent authentication prompts from interrupting testing.
    if (!window.openAuthModal || !window.openAuthModal.__hsPreviewNoop) {
      const noop = function () {
        window._pendingShowResults = null;
        removeAuthModal();
      };
      noop.__hsPreviewNoop = true;
      window.openAuthModal = noop;
    }

    syncPreviewControl();
    removeAuthModal();
  }

  const observer = new MutationObserver(function () {
    syncPreviewControl();
    removeAuthModal();
  });

  function start() {
    install();
    observer.observe(document.documentElement, { childList: true, subtree: true });

    let attempts = 0;
    const timer = window.setInterval(function () {
      install();
      attempts += 1;
      if (attempts >= 40) window.clearInterval(timer);
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
