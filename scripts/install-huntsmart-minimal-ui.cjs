'use strict';
// Runs after every private-map installer. Only the generated species viewer is changed.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.join('site','species-map');
const file=name=>path.join(root,name);
const htmlFile=file('index.html'),appFile=file('app.js');
assert(fs.existsSync(file('hs-map-ui.js'))&&fs.existsSync(file('hs-map-ui.css')),
  'Compact HuntSmart UI assets must be copied into the generated site');
let html=fs.readFileSync(htmlFile,'utf8');
let app=fs.readFileSync(appFile,'utf8');
assert(html.includes('id="hs-harvest-panel"')&&html.includes('id="hs-harvest-toggle"')&&
  html.includes('id="province-bc"')&&html.includes('id="era-historical"'),
  'The existing province, history and hunter-success controls must be installed first');
assert(app.includes('harvestSuccess.isEnabled()')&&app.includes('function changeEra(mode)'),
  'Existing exclusive mode logic must be present');
assert(!html.includes('id="hs-wmu-card"'),'compact UI already installed');
// Preset state must correspond to real <select> option values; otherwise browsers
// silently reset its value and the map loses the selected reporting period.
const currentOption='<option value="current">2024</option>';
assert(html.includes(currentOption),'existing hunter-success select option missing');
html=html.replace(currentOption,
  '<option value="ten">10-year pooled</option>\n'+
  '        <option value="all">All available years</option>\n'+
  '        <option value="custom">Custom range</option>\n        '+currentOption);
const periodPanel=html.indexOf('  <section id="hs-harvest-panel"');
const periodEnd=html.indexOf('  </section>',periodPanel);
assert(periodPanel>=0&&periodEnd>periodPanel,'year panel boundary missing');
const yearMarkup=[
'    <div class="hs-metric-head">Map metric</div>',
'    <div class="hs-metric-switch" role="group" aria-label="Map shading metric">',
'      <button type="button" data-hs-metric="success" aria-pressed="true">Hunter success</button>',
'      <button type="button" data-hs-metric="density" aria-pressed="false">Hunter density</button>',
'    </div>',
'    <div class="hs-year-header">',
'      <span>Reporting years</span>',
'      <button id="hs-year-close" class="hs-year-close" type="button" aria-label="Close year selector">×</button>',
'    </div>',
'    <div class="hs-year-presets" role="group" aria-label="Reporting range">',
'      <button type="button" data-hs-period="current">1 year</button>',
'      <button type="button" data-hs-period="average">5 yrs</button>',
'      <button type="button" data-hs-period="ten" aria-pressed="true">10 yrs</button>',
'      <button type="button" data-hs-period="all">All</button>',
'      <button type="button" data-hs-period="custom">Custom</button>',
'    </div>',
'    <div id="hs-year-custom-controls" class="hs-custom-controls" hidden>',
'    <div class="hs-year-custom-label">Custom year range</div>',
'    <div class="hs-year-custom">',
'      <label class="sr-only" for="hs-year-from">Start year</label>',
'      <select id="hs-year-from" aria-label="Start year"><option value="2015">2015</option></select>',
'      <span aria-hidden="true">–</span>',
'      <label class="sr-only" for="hs-year-to">End year</label>',
'      <select id="hs-year-to" aria-label="End year"><option value="2024">2024</option></select>',
'    </div>',
'    </div>'
].join('\n')+'\n';
html=html.slice(0,periodEnd)+yearMarkup+html.slice(periodEnd);
const extra=[
'  <button id="hs-year-trigger" class="hs-year-trigger" type="button" hidden aria-controls="hs-harvest-panel" aria-label="Choose hunter success reporting years">Years</button>',
'  <span id="hs-year-status" class="sr-only" role="status"></span>',
'  <form id="hs-wmu-lookup" hidden>',
'    <input id="hs-wmu-query" aria-label="Wildlife management unit number" placeholder="WMU, e.g. 5-5" list="hs-wmu-options" autocomplete="off" required>',
'    <datalist id="hs-wmu-options"></datalist>',
'    <button type="submit">Find WMU</button>',
'    <div id="hs-wmu-lookup-status" role="status"></div>',
'  </form>',
'  <div id="hs-metric-legend" class="hs-metric-legend" hidden aria-label="Map metric legend"></div>',
'  <section id="hs-wmu-card" class="hs-wmu-card" aria-label="Selected wildlife management unit" hidden>',
'    <div class="hs-wmu-heading">',
'      <div><h2 id="hs-wmu-title" class="hs-wmu-title" tabindex="-1">WMU</h2><div id="hs-wmu-meta" class="hs-wmu-meta"></div></div>',
'      <button type="button" id="hs-wmu-close" class="hs-wmu-close" aria-label="Close management unit details">×</button>',
'    </div>',
'    <div class="hs-wmu-stats">',
'      <div><strong id="hs-wmu-rate">—</strong><span>Success</span></div>',
'      <div><strong id="hs-wmu-harvest">—</strong><span>Est. harvest</span></div>',
'      <div><strong id="hs-wmu-hunters">—</strong><span id="hs-wmu-hunters-label">Hunters</span></div>',
'      <div><strong id="hs-wmu-density">—</strong><span>Est. annual hunters / 100 km²</span></div>',
'    </div>',
'    <div id="hs-wmu-recorded" class="hs-wmu-recorded" hidden></div>',
'    <section class="hs-trend" aria-label="Historical hunter success and participation">',
'      <div class="hs-trend-header"><strong>Historical trends</strong><div class="hs-trend-ranges" role="group" aria-label="Chart date range"><button type="button" data-trend-range="5">5Y</button><button type="button" data-trend-range="10">10Y</button><button type="button" data-trend-range="all" aria-pressed="true">All</button></div></div>',
'      <div class="hs-trend-key"><span class="hs-trend-success-key">Success (%)</span><span class="hs-trend-hunters-key">Est. hunters</span></div>',
'      <div id="hs-trend-chart" class="hs-trend-chart"></div>',
'      <div id="hs-trend-readout" class="hs-trend-readout" aria-live="polite"></div>',
'      <div id="hs-trend-note" class="hs-trend-note">Official BC resident harvest estimates combine hunt types where reported. Not a separate GOS or LEH success rate.</div>',
'    </section>',
'    <details><summary>Source &amp; methodology</summary>',
'      <p id="hs-wmu-caveats" class="hs-wmu-caveats"></p>',
'      <a id="hs-wmu-source" href="https://catalogue.data.gov.bc.ca/dataset/big-game-harvest-statistics-1976-to-2024" target="_blank" rel="noopener noreferrer">Government of BC harvest statistics</a>',
'      <a id="hs-wmu-inspection-source" href="https://catalogue.data.gov.bc.ca/dataset/compulsory-inspection-data-1900-to-2023-24" target="_blank" rel="noopener noreferrer" hidden>Compulsory inspection source</a>',
'    </details>',
'  </section>',
''].join('\n');
const errorAnchor='  <div id="error" ';
assert(html.includes(errorAnchor),'error mount anchor missing');
html=html.replace(errorAnchor,extra+errorAnchor);
const originalDefault="let viewMode = ['modern', 'historical'].includes(storedMode) ? storedMode : 'modern';";
assert(app.includes(originalDefault),'historic default anchor changed');
app=app.replace(originalDefault,
  "const historicalDefaultInitialized=localStorage.getItem('hs-historical-default-v1')==='1';\n"+
  "  let viewMode = historicalDefaultInitialized && ['modern', 'historical'].includes(storedMode) ? storedMode : 'historical';\n"+
  "  if(!historicalDefaultInitialized){localStorage.setItem('bc-species-map-era','historical');localStorage.setItem('hs-historical-default-v1','1');}");
const priorEra="    if (province === 'ab' || mode === viewMode) return;";
assert(app.includes(priorEra),'expected Alberta era handler not found');
app=app.replace(priorEra,
  "    if (province === 'ab') return;\n"+
  "    const wasSuccess=harvestSuccess.isEnabled();\n"+
  "    if(wasSuccess)harvestSuccess.exitSuccess(true);\n"+
  "    if(mode === viewMode){ if(wasSuccess)return renderSelected(); return; }");
new Function(app);
const appTag=html.match(/<script src="app\.js\?v=[^"]+"><\/script>/);
assert(appTag,'app script missing');
html=html.replace(appTag[0],appTag[0]+'\n  <script src="hs-map-ui.js?v=map-ux-20261128"></script>');
html=html.replace('</head>','  <link rel="stylesheet" href="hs-map-ui.css?v=map-ux-20261128">\n</head>');
html=html.replace(/app\.js\?v=[^"]+/,'app.js?v=bear-bison-20261123b');
html=html.replace(/harvest-success\.js\?v=[^"]+/,'harvest-success.js?v=map-ux-20261128');
html=html.replace(/species-catalog\.js\?v=[^"]+/,'species-catalog.js?v=bear-bison-20261123b');
assert(html.includes('hs-map-ui.js?v=')&&html.includes('hs-map-ui.css?v='),'UI assets not linked');
assert(!html.includes('data-hs-huntmode'),'Single Success view may not add hunt type controls');
fs.writeFileSync(htmlFile,html);
fs.writeFileSync(appFile,app);
console.log('Installed two-row HuntSmart toolbar, historical default, WMU card and smart reporting-year picker.');
