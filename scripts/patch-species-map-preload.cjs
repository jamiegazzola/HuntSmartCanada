'use strict';
const fs = require('node:fs');
const path = require('node:path');
const installerPath = path.join('scripts', 'install-private-heatmaps.cjs');
let source = fs.readFileSync(installerPath, 'utf8');
if (source.includes('function patchKmzBackgroundPreload(input) {')) {
  console.log('Species-map background preload patch already installed.');
  process.exit(0);
}
const functionAnchor = '\nfunction patchProductionApp(input) {';
if (!source.includes(functionAnchor)) throw new Error('Species-map production patch anchor is missing');

const patchFunction = [
  '',
  'function patchKmzBackgroundPreload(input) {',
  '  let app = input;',
  '',
  "  const cacheAnchor = '  const kmzOverlayCache = new Map();\\n  let kmzManifestPromise = null;\\n';",
  "  const cacheReplacement = '  const kmzOverlayCache = new Map();\\n  const kmzGroundOverlayCache = new Map();\\n  let kmzManifestPromise = null;\\n  let backgroundKmzPreloadStarted = false;\\n';",
  "  if (!app.includes(cacheAnchor)) throw new Error('KMZ URL cache anchor is missing');",
  '  app = app.replace(cacheAnchor, cacheReplacement);',
  '',
  "  const helperAnchor = '  async function rasterUrl(item) {';",
  '  const helper = [',
  "    '  async function getKmzGroundOverlay(assetName, signal) {',",
  "    '    if (kmzGroundOverlayCache.has(assetName)) return kmzGroundOverlayCache.get(assetName);',",
  "    '    const promise = (async () => {',",
  "    '      const url = await kmzOverlayUrl(assetName, signal);',",
  "    \"      if (signal?.aborted) throw new DOMException('The request was aborted.', 'AbortError');\",",
  "    '      return new google.maps.GroundOverlay(url, BOUNDS, { opacity:1, clickable:false });',",
  "    '    })();',",
  "    '    kmzGroundOverlayCache.set(assetName, promise);',",
  "    '    promise.catch(() => kmzGroundOverlayCache.delete(assetName));',",
  "    '    return promise;',",
  "    '  }',",
  "    '',",
  "    '  function scheduleBackgroundKmzPreload() {',",
  "    '    if (backgroundKmzPreloadStarted) return;',",
  "    '    backgroundKmzPreloadStarted = true;',",
  "    '    const keys = [...KMZ_HEATMAPS];',",
  "    \"    const queue = [...keys.map(key => 'kmz-' + key + '-historic.png'), ...keys.map(key => 'kmz-' + key + '-modern.png')];\",",
  "    '    const preloadController = new AbortController();',",
  "    '    let index = 0;',",
  "    '',",
  "    '    const schedule = () => {',",
  "    '      if (index >= queue.length) {',",
  "    '        Promise.allSettled([',",
  "    '          historicRoosevelt(preloadController.signal),',",
  "    '          recentRoosevelt(preloadController.signal),',",
  "    '        ]);',",
  "    '        return;',",
  "    '      }',",
  "    '      const run = async () => {',",
  "    '        const assetName = queue[index++];',",
  "    '        try {',",
  "    '          await getKmzGroundOverlay(assetName, preloadController.signal);',",
  "    '        } catch (error) {',",
  "    \"          if (error?.name !== 'AbortError') console.warn('Species background preload failed:', assetName, error);\",",
  "    '        }',",
  "    '        schedule();',",
  "    '      };',",
  "    \"      if ('requestIdleCallback' in window) {\",",
  "    '        window.requestIdleCallback(() => { void run(); }, { timeout:800 });',",
  "    '      } else {',",
  "    '        setTimeout(() => { void run(); }, 40);',",
  "    '      }',",
  "    '    };',",
  "    '',",
  "    '    schedule();',",
  "    '  }',",
  "    '',",
  "  ].join('\\n');",
  "  if (!app.includes(helperAnchor)) throw new Error('Species raster helper anchor is missing');",
  '  app = app.replace(helperAnchor, helper + helperAnchor);',
  '',
  '  const overlayBefore = [',
  '    "        const kmzAsset = `kmz-${item.key}-${historical ? \'historic\' : \'modern\'}.png`;",',
  "    '        const kmzUrl = await kmzOverlayUrl(kmzAsset, renderAbort.signal);',",
  "    '        if (version !== renderVersion) return;',",
  "    '        activeOverlay = new google.maps.GroundOverlay(kmzUrl, BOUNDS, { map, opacity: 1, clickable: false });',",
  "  ].join('\\n');",
  '  const overlayAfter = [',
  '    "        const kmzAsset = \'kmz-\' + item.key + \'-\' + (historical ? \'historic\' : \'modern\') + \'.png\';",',
  "    '        const overlay = await getKmzGroundOverlay(kmzAsset, renderAbort.signal);',",
  "    '        if (version !== renderVersion) return;',",
  "    '        overlay.setMap(map);',",
  "    '        activeOverlay = overlay;',",
  "  ].join('\\n');",
  "  if (!app.includes(overlayBefore)) throw new Error('KMZ GroundOverlay render anchor is missing');",
  '  app = app.replace(overlayBefore, overlayAfter);',
  '',
  "  const initAnchor = '      renderSelected();\\n    } catch (error) {';",
  "  const initReplacement = '      renderSelected();\\n      scheduleBackgroundKmzPreload();\\n    } catch (error) {';",
  "  if (!app.includes(initAnchor)) throw new Error('Species-map init render anchor is missing');",
  '  app = app.replace(initAnchor, initReplacement);',
  '',
  "  if (!app.includes('kmzGroundOverlayCache')) throw new Error('GroundOverlay cache patch failed');",
  "  if (!app.includes('scheduleBackgroundKmzPreload();')) throw new Error('Background preload hook patch failed');",
  '  return app;',
  '}',
].join('\n');

source = source.replace(functionAnchor, patchFunction + functionAnchor);
const callAnchor = '  app = patchKmzGeoref(app);\n  // Parse the exact production output';
const callReplacement = '  app = patchKmzGeoref(app);\n  app = patchKmzBackgroundPreload(app);\n  // Parse the exact production output';
if (!source.includes(callAnchor)) throw new Error('KMZ georef call anchor is missing');
source = source.replace(callAnchor, callReplacement);
fs.writeFileSync(installerPath, source);
console.log('Installed species-map background preload and persistent GroundOverlay caching patch.');
