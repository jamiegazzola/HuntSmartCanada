'use strict';
const fs = require('node:fs');

const appPath = 'site/species-map/app.js';
let app = fs.readFileSync(appPath, 'utf8');
if (app.includes('const HUNTSMART_FOREST_SERVICE_ROADS = true;')) {
  console.log('FSR and 3D zoom controls already installed.');
  process.exit(0);
}
const forceZoom = /map\.setZoom\(Math\.max\(map\.getZoom\(\),\s*(?:12|18)\)\);/;
const restoreZoom = 'map.setZoom(preTiltView.zoom);';
if (!forceZoom.test(app) || !app.includes(restoreZoom)) {
  throw new Error('Expected 3D viewer zoom anchors not found');
}
app = app.replace(forceZoom, '// Preserve current zoom when enabling 3D.');
app = app.replace(restoreZoom, '// Preserve user-selected zoom when returning to 2D.');

const helperAnchor = '  window.initSpeciesMap = () => {\n';
if (!app.includes(helperAnchor)) throw new Error('Species viewer init anchor missing');

const helper = String.raw`
  const HUNTSMART_FOREST_SERVICE_ROADS = true;
  function installForestServiceRoads() {
    const tools = document.querySelector('.map-tools');
    if (!tools || !map) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'fsr-toggle';
    button.textContent = '🚚';
    button.title = 'Show BC resource and forest roads in gold';
    button.setAttribute('aria-label', 'Show BC resource and forest roads');
    button.setAttribute('aria-pressed', 'false');
    button.style.cssText = 'flex:0 0 52px;min-height:65px;padding:0;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:rgba(15,20,17,.94);color:white;box-shadow:0 8px 24px rgba(0,0,0,.24);font-size:25px;cursor:pointer;touch-action:manipulation';

    const fsrLayer = new google.maps.ImageMapType({
      name: 'BC Forest Service Roads',
      alt: 'BC Forest Service Roads, gold',
      tileSize: new google.maps.Size(256,256),
      minZoom: 9,
      maxZoom: 20,
      opacity: 0.95,
      getTileUrl: (coord, zoom) => {
        if (zoom < 9 || zoom > 20 || coord.x < 0 || coord.x >= 2 ** zoom ||
            coord.y < 0 || coord.y >= 2 ** zoom) return '';
        const origin = 20037508.342789244;
        const span = origin * 2 / 2 ** zoom;
        const west = -origin + coord.x * span;
        const east = west + span;
        const north = origin - coord.y * span;
        const south = north - span;
        // BC's published ArcGIS layers have native minimum scales of 1:125,000
        // (tenure roads) and 1:100,000 (DRA). Without overriding the scale in
        // a dynamic layer, tiles are blank at useful regional scouting zooms.
        // At close zooms use the comprehensive DRA, not only tenure roads.
        const useDra = zoom >= 11;
        const layerId = useDra ? 68 : 21;
        const dynamicLayers = [{
          id: layerId,
          source: { type: 'mapLayer', mapLayerId: layerId },
          minScale: 0,
          maxScale: 0,
          ...(useDra ? { definitionExpression:
            "ROAD_CLASS IN ('resource','unclassified','recreation','skid','trail')" } : {}),
          drawingInfo: {renderer: {type: 'simple', symbol: {
            type: 'esriSLS', style: 'esriSLSSolid', color: [238,183,52,255], width: useDra ? 1.5 : 2
          }}}
        }];
        const params = new URLSearchParams({
          bbox: [west,south,east,north].join(','),
          bboxSR:'3857', imageSR:'3857', size:'256,256',
          format:'png32', transparent:'true', f:'image',
          dynamicLayers:JSON.stringify(dynamicLayers)
        });
        return 'https://delivery.maps.gov.bc.ca/arcgis/rest/services/whse/' + (useDra ? 'bcgw_pub_whse_basemapping' : 'bcgw_pub_whse_forest_tenure') + '/MapServer/export?' + params;
      }
    });
    button.addEventListener('click', () => {
      const on = button.getAttribute('aria-pressed') === 'true';
      if (on) {
        const position = map.overlayMapTypes.getArray().indexOf(fsrLayer);
        if (position >= 0) map.overlayMapTypes.removeAt(position);
      } else {
        map.overlayMapTypes.push(fsrLayer);
      }
      button.setAttribute('aria-pressed', String(!on));
      button.setAttribute('aria-label', (on ? 'Show' : 'Hide') + ' BC resource and forest roads');
      button.title = (on ? 'Show' : 'Hide') + ' Forest Service Roads';
      button.style.background = on ? 'rgba(15,20,17,.94)' : 'rgba(122,93,29,.96)';
      button.style.borderColor = on ? 'rgba(255,255,255,.16)' : '#e8b94c';
    });
    tools.appendChild(button);
  }

`;
app = app.replace(helperAnchor, helper + helperAnchor);
const startAnchor = '      if (!savedView) {\n';
if (!app.includes(startAnchor)) throw new Error('Map creation anchor missing');
app = app.replace(startAnchor, '      installForestServiceRoads();\n' + startAnchor);
new Function(app);
fs.writeFileSync(appPath, app);
console.log('Installed gold Forest Service Road overlay and non-forcing 3D zoom.');
