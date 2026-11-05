'use strict';
// The production build installs a pinned private species-map viewer *after*
// copying the public site. Install the display controls on that final output,
// rather than editing files which the private asset installer will overwrite.
const fs = require('node:fs');
const path = require('node:path');

const target = path.join('site', 'species-map');
const source = 'species-map';
const read = file => fs.readFileSync(path.join(source, file), 'utf8');
const write = (file, value) => fs.writeFileSync(path.join(target, file), value);
const assert = (condition, label) => { if (!condition) throw new Error('Species map display controls: ' + label); };

let html = fs.readFileSync(path.join(target, 'index.html'), 'utf8');
const authoredHtml = read('index.html');
const uiStart = authoredHtml.indexOf('  <div class="map-tools"');
const uiEnd = authoredHtml.indexOf('  <div id="layer-note"', uiStart);
assert(uiStart !== -1 && uiEnd !== -1, 'authoring UI missing');
if (!html.includes('id="layer-opacity"')) {
  assert(html.includes('  <div id="layer-note"'), 'production HTML insertion target missing');
  html = html.replace('  <div id="layer-note"', authoredHtml.slice(uiStart, uiEnd) + '  <div id="layer-note"');
}
html = html.replace(/app\.css\?v=[^"]+/, 'app.css?v=opacity-3d-20261104b');
html = html.replace(/app\.js\?v=[^"]+/, 'app.js?v=opacity-3d-20261104b');
write('index.html', html);

let css = fs.readFileSync(path.join(target, 'app.css'), 'utf8');
const authoredCss = read('app.css');
const cssStart = authoredCss.indexOf('\n.map-tools{');
assert(cssStart !== -1, 'authoring CSS missing');
if (!css.includes('.opacity-control{')) css += authoredCss.slice(cssStart);
css += '\n/* Keep display tools immediately under the species selector for single-layer elk views. */\n.era-control[hidden] ~ .map-tools{top:calc(env(safe-area-inset-top,0px) + 68px)}\n@media(max-width:520px){.era-control[hidden] ~ .map-tools{top:calc(env(safe-area-inset-top,0px) + 62px)}}\n';
write('app.css', css);

let js = fs.readFileSync(path.join(target, 'app.js'), 'utf8');
const authoredJs = read('app.js');
const jsStart = authoredJs.indexOf('  const opacityInput =');
const jsEnd = authoredJs.indexOf('\n  let map = null;', jsStart);
assert(jsStart !== -1 && jsEnd !== -1, 'authoring JS missing');
if (!js.includes('const opacityInput =')) {
  const anchor = "  const errorEl = document.getElementById('error');";
  assert(js.includes(anchor), 'production JS insertion target missing');
  let controls = authoredJs.slice(jsStart, jsEnd);
  // Vector rendering supports actual camera tilt; legacy raster 45-degree imagery
  // was discontinued by Google in 2026.
  controls = controls.replace('Math.max(map.getZoom(), 18)', 'Math.max(map.getZoom(), 12)');
  js = js.replace(anchor, anchor + '\n' + controls);
  js = js.replaceAll('new google.maps.Data({ map })', 'makeDataLayer()');
  js = js.replace('  function makeDataLayer() {\n    const data = makeDataLayer();',
    '  function makeDataLayer() {\n    const data = new google.maps.Data({ map });');
  js = js.replace('  function clearLayer() {', '  function clearLayer() {\n    dataLayers.clear();');
  const finish = '        setLoading(false);';
  assert(js.includes(finish), 'production render finalizer missing');
  js = js.replace(finish, '        applyLayerOpacity();\n' + finish);
}
const mapOption = '        mapTypeId: google.maps.MapTypeId.HYBRID,';
assert(js.includes(mapOption), 'map renderer initialization missing');
if (!js.includes('renderingType: google.maps.RenderingType.VECTOR,')) {
  js = js.replace(mapOption, mapOption + '\n        renderingType: google.maps.RenderingType.VECTOR,\n        tilt: 0,\n        tiltInteractionEnabled: true,\n        headingInteractionEnabled: true,');
}
new Function(js);
write('app.js', js);
console.log('Verified and installed species-map opacity slider and vector 3D camera controls.');
