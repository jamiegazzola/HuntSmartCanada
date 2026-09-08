(function () {
  'use strict';

  const SOURCE_URL = './maps.js?mapbox-preview=v3.30.0';
  const OLD_VERSION = 'v3.3.0';
  const NEW_VERSION = 'v3.30.0';
  const OLD_SATELLITE = 'mapbox://styles/mapbox/satellite-streets-v12';
  const NEW_SATELLITE = 'mapbox://styles/mapbox/standard-satellite';

  function loadSourceSynchronously(url) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.setRequestHeader('Cache-Control', 'no-cache');
    xhr.send(null);
    if (xhr.status < 200 || xhr.status >= 300) {
      throw new Error('Could not load maps.js: HTTP ' + xhr.status);
    }
    return xhr.responseText;
  }

  try {
    let source = loadSourceSynchronously(SOURCE_URL);

    // Upgrade all fallback CDN references in maps.js to the current stable GL JS runtime.
    source = source.replaceAll(OLD_VERSION, NEW_VERSION);

    // Upgrade every HuntSmart satellite entry point (full map + LEH card maps).
    source = source.replaceAll(OLD_SATELLITE, NEW_SATELLITE);

    // Keep the original topo and dark modes untouched for this first A/B test.
    source = source.replace(
      '// Mapbox style URLs — highest quality available',
      '// Mapbox style URLs — preview: Standard Satellite on Mapbox GL JS v3.30.0'
    );

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.text = source + '\n//# sourceURL=maps-modern-preview.generated.js';
    document.head.appendChild(script);

    console.info('[HuntSmart preview] Mapbox GL JS ' + NEW_VERSION + ' + Standard Satellite enabled.');
  } catch (err) {
    console.error('[HuntSmart preview] Failed to transform maps.js', err);
    const fallback = document.createElement('script');
    fallback.src = './maps.js';
    fallback.defer = false;
    document.head.appendChild(fallback);
  }
})();
