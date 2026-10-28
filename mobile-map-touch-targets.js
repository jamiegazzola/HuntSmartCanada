/* Final mobile touch-target guard. Loaded after all map enhancement layers. */
(function () {
  'use strict';
  if (window.__HUNTSMART_MOBILE_TOUCH_TARGET_GUARD__) return;
  window.__HUNTSMART_MOBILE_TOUCH_TARGET_GUARD__ = true;

  var style = document.createElement('style');
  style.id = 'hsMobileTouchTargetGuard';
  style.textContent = [
    '@media (max-width:768px){',
    'body #mapPage #hsRail .hs-rb,body #bcOpenSeasonsPage #gosRail .hs-rb{',
    'box-sizing:border-box!important;',
    'width:44px!important;min-width:44px!important;max-width:44px!important;',
    'height:44px!important;min-height:44px!important;max-height:44px!important;',
    'flex:0 0 44px!important;padding:0!important;margin:0!important;',
    '}',
    'body #mapPage #hsRail,body #bcOpenSeasonsPage #gosRail{width:44px!important;min-width:44px!important;max-width:44px!important;}',
    '}'
  ].join('');
  document.head.appendChild(style);
})();