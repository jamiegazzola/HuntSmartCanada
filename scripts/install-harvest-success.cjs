'use strict';
// Run after all species-map installers: production uses the private-submodule viewer.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const dir = path.join('site','species-map');
const htmlFile = path.join(dir,'index.html');
const appFile = path.join(dir,'app.js');
const cssFile = path.join(dir,'app.css');
let html = fs.readFileSync(htmlFile,'utf8');
let app = fs.readFileSync(appFile,'utf8');
let css = fs.readFileSync(cssFile,'utf8');
const jsFile = path.join(dir,'harvest-success.js');
assert(fs.existsSync(jsFile),'harvest success module must be copied from source');
const newCode = fs.readFileSync(jsFile,'utf8');
new Function(newCode);
assert(newCode.includes('window.HUNTSMART_HARVEST_DATA_COVERAGE'),'dataset test');
assert(newCode.includes('BC_GOVERNMENT_HARVEST_DATA') &&
  newCode.includes('https://catalogue.data.gov.bc.ca/dataset/big-game-harvest-statistics-1976-to-2024') && !newCode.includes('hunting-access.com'),
  'Hunter success data source must link to the BC government dataset');
const dataParts = newCode.match(/^  const rows = (.+);$/m);
assert(dataParts && JSON.parse(dataParts[1]).split(';').length === 64,'expected 64 verified WMU data records');
const sheep = JSON.parse(fs.readFileSync(path.join(dir,'data','bc-sheep-harvest-2024.json'),'utf8'));
const ages = JSON.parse(fs.readFileSync(path.join(dir,'data','bc-sheep-age-ci-2022-2025.json'),'utf8'));
assert(sheep.code==='SHEE' && sheep.year===2024 &&
  Object.keys(sheep.units).length>=40 &&
  sheep.units['3-17'].y[0]===66 && sheep.units['3-31'].y[1]===4,
  'official BC sheep harvest snapshot malformed');
assert(ages.minimum_display_sample===5 &&
  ages.units['7-50|Stone Sheep'][0]===94, 'official sheep CI age snapshot malformed');
assert(newCode.includes('loadSheep()') && newCode.includes('ageSummary(id)') &&
  newCode.includes('wild_sheep'), 'sheep map source wiring missing');
const rootWMU = fs.readFileSync('bc-wmu-geojson.js','utf8');
assert(rootWMU.startsWith('const BC_WMU_GEOJSON = '),'original HuntSmart WMU geometry source');
assert(rootWMU.includes('"wmu_id":"3-31"'),'WMU IDs must align with source geometry');
const insertUnique = (text,before,after,label) => {
  assert(text.includes(before),'missing anchor: ' + label);
  assert(text.indexOf(before) === text.lastIndexOf(before),'duplicate anchor: ' + label);
  return text.replace(before,after);
};
html = insertUnique(html, '  <div id="error" ', `
  <section id="hs-harvest-panel" class="hs-harvest-panel" hidden aria-label="BC mule deer or mountain sheep hunter success by wildlife management unit">
    <div class="hs-harvest-head">
      <button id="hs-harvest-toggle" type="button" aria-pressed="false" aria-label="Show mule deer hunter success by WMU">Show Hunter Success</button>
      <select id="hs-harvest-period" aria-label="Hunter success reporting period" hidden>
        <option value="current">2024</option>
        <option value="average">5-year avg</option>
      </select>
    </div>
    <div id="hs-harvest-legend" hidden>
      <span class="hs-legend-swatch" style="background:#468f58"></span><span>0–9%</span>
      <span class="hs-legend-swatch" style="background:#a3b950"></span><span>10–19%</span>
      <span class="hs-legend-swatch" style="background:#dfcb58"></span><span>20–29%</span>
      <span class="hs-legend-swatch" style="background:#e28d42"></span><span>30–39%</span>
      <span class="hs-legend-swatch" style="background:#c45145"></span><span>40%+</span>
    </div>
    <div id="hs-harvest-detail" role="status" aria-live="polite"></div>
    <div class="hs-harvest-disclaimer">Mule deer: manually compiled estimates, pending direct reconciliation. Sheep: BC Government all-subspecies records with estimated resident effort; low samples muted. <a href="https://catalogue.data.gov.bc.ca/dataset/big-game-harvest-statistics-1976-to-2024" target="_blank" rel="noopener">BC Government dataset</a>.</div>
  </section>
  <div id="error" `, 'panel before errors');
const appTag = html.match(/<script src="app\.js\?v=[^"]+"><\/script>/);
assert(appTag,'species map app script tag missing');
html = insertUnique(html,appTag[0],'<script src="harvest-success.js?v=official-bc-sheep-20261113f"></script>\n  ' + appTag[0], 'load harvest module before viewer');
app = insertUnique(app,'  let map = null;', `  let map = null;
  const harvestSuccess = window.HUNTSMART_HARVEST_SUCCESS.attach({
    getMap: () => map,
    getProvince: () => province,
    getSpecies: () => select.value,
    getOpacity: () => layerOpacity,
    onModeChange: () => renderSelected()
  });`, 'attach to map');
app = insertUnique(app,'    clearLayer();\n    clearError();',"    clearLayer();\n    // Hunter success and species distribution must never render together.\n    if (harvestSuccess.isEnabled() && terrainEnabled) void toggleTerrain3D();\n    terrainToggle.disabled = harvestSuccess.isEnabled();\n    harvestSuccess.sync();\n    clearError();\n    document.body.classList.toggle('hunter-success-only', harvestSuccess.isEnabled());\n    if (harvestSuccess.isEnabled()) {\n      personalAlberta.hide();\n      setLoading(false);\n      return;\n    }",'exclusive hunter-success mode');
app = insertUnique(app,'      const current=await initTerrain3D();',
  "      const current=await initTerrain3D();\n      if (harvestSuccess.isEnabled()) { terrainHost.hidden=true; terrainHost.style.visibility=''; return; }",
  'cancel pending 3D initialization');
app = insertUnique(app,'} finally {terrainToggle.disabled=false;}',
  '} finally {terrainToggle.disabled=harvestSuccess.isEnabled();}',
  'keep 3D disabled in hunter-success view');
const appRef = html.match(/app\.js\?v=[^"]+/);
assert(appRef, 'map script asset reference');
html=html.replace(appRef[0], 'app.js?v=official-bc-sheep-20261113f');
html=html.replace(/app\.css\?v=[^"]+/, 'app.css?v=official-bc-sheep-20261113f');
assert(app.includes('if (harvestSuccess.isEnabled()) {') &&
  app.includes('onModeChange: () => renderSelected()') &&
  app.includes('terrainToggle.disabled = harvestSuccess.isEnabled()'), 'exclusive mode bridge missing');
new Function(app);
css += `
/* HuntSmart BC mule deer / WMU hunter success overlay. */
.hs-harvest-panel{position:fixed;z-index:20;top:calc(env(safe-area-inset-top,0px) + 192px);left:12px;width:min(354px,calc(100vw - 24px));border:1px solid rgba(255,255,255,.17);border-radius:12px;background:rgba(15,20,17,.95);box-shadow:0 8px 25px rgba(0,0,0,.27);padding:8px 10px;color:#e8efe9;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.hs-harvest-panel[hidden],#hs-harvest-period[hidden],#hs-harvest-legend[hidden]{display:none!important}
.hs-harvest-head{display:flex;align-items:center;gap:8px}
#hs-harvest-toggle{flex:1;min-height:36px;border:1px solid rgba(255,255,255,.19);border-radius:8px;background:rgba(255,255,255,.07);color:#e5f0e6;font:750 12px/1.15 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer}
#hs-harvest-toggle[aria-pressed=true]{background:#527b56;color:#fff;border-color:#7eb383}
#hs-harvest-toggle[disabled]{opacity:.67;cursor:wait}
body.hunter-success-only .terrain-toggle:disabled{opacity:.45;cursor:not-allowed}
#hs-harvest-period{width:106px;min-height:36px;padding:0 5px;border:1px solid rgba(255,255,255,.2);border-radius:8px;background:#1b2d22;color:#fff;font:650 11px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
#hs-harvest-toggle:focus-visible,#hs-harvest-period:focus-visible{outline:2px solid white;outline-offset:2px}
#hs-harvest-legend{display:flex;align-items:center;flex-wrap:wrap;gap:4px 6px;padding-top:9px;font-size:10px;color:#cbd9cf}
.hs-legend-swatch{width:15px;height:10px;display:inline-block;border-radius:2px;margin-left:2px}
#hs-harvest-detail{margin-top:5px;font-size:10px;line-height:1.3;color:#bbd6be}
#hs-harvest-detail:empty{display:none}
.hs-harvest-disclaimer{margin-top:5px;font-size:9px;line-height:1.3;color:#aebdb0}
.hs-harvest-disclaimer a{color:#afd9ae}
@media(max-width:520px){.hs-harvest-panel{top:calc(env(safe-area-inset-top,0px) + 185px);left:9px;width:min(354px,calc(100vw - 18px));padding:7px 9px}#hs-harvest-toggle{min-height:39px}#hs-harvest-legend{font-size:9px;gap:3px 4px}}
`;
fs.writeFileSync(htmlFile,html);
fs.writeFileSync(appFile,app);
fs.writeFileSync(cssFile,css);
console.log('Installed mule deer and official BC sheep hunter-success maps, with inspected ram age notes.');
