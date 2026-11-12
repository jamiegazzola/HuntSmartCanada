'use strict';
(function installAlberta(){
  'use strict';
  const fs = require('node:fs');
  const path = require('node:path');
  const target = path.join('site','species-map');
  const authored = fs.readFileSync(path.join('species-map','app.js'),'utf8');
  const appFile = path.join(target,'app.js');
  const htmlFile = path.join(target,'index.html');
  const cssFile = path.join(target,'app.css');
  let app = fs.readFileSync(appFile,'utf8');
  let html = fs.readFileSync(htmlFile,'utf8');
  let css = fs.readFileSync(cssFile,'utf8');
  const assert = (ok,message) => { if(!ok) throw Error('Alberta build installer: '+message); };
  const replace = (text, before, after, label) => {
    assert(text.includes(before), label+' anchor missing');
    assert(text.indexOf(before)===text.lastIndexOf(before),label+' non-unique anchor');
    return text.replace(before,after);
  };
  assert(!app.includes('const ALBERTA_BOUNDS ='), 'already installed');
  assert(fs.existsSync(path.join(target,'alberta-species.js')), 'Alberta catalogue was not copied');
  const ALBERTA_BOUNDS = "  const ALBERTA_BOUNDS = { north: 60.0, south: 49.0, east: -110.0, west: -120.0 };";
  app = replace(app,
    '  const BOUNDS = { north: 60.1, south: 48.1, east: -113.8, west: -139.2 };',
    '  const BOUNDS = { north: 60.1, south: 48.1, east: -113.8, west: -139.2 };\n'+ALBERTA_BOUNDS,
    'bounds');
  const provinceVarsStart = authored.indexOf("  const AB_SPECIES = window.HUNTSMART_ALBERTA_SPECIES");
  const provinceVarsEnd = authored.indexOf("  if (!Array.isArray(SPECIES)",provinceVarsStart);
  assert(provinceVarsStart>0 && provinceVarsEnd>provinceVarsStart,'authored registry');
  app = replace(app,
    '  const SPECIES = window.HUNTSMART_SPECIES;',
    '  const SPECIES = window.HUNTSMART_SPECIES;\n'+authored.slice(provinceVarsStart,provinceVarsEnd).trimEnd(),
    'registry');
  app = replace(app,'  const APP_BUILD = \'species-map-rebuild-v12\';',"  const APP_BUILD = 'species-map-alberta-range-v13';",'version');
  app = replace(app, '    if (mode === viewMode) return;', "    if (province === 'ab' || mode === viewMode) return;",'era');
  const listStart = app.indexOf('  for (const item of SPECIES.filter(item => DISPLAYED_SPECIES.has(item.key))) {');
  const listEnd = app.indexOf('\n  function setLoading(value) {',listStart);
  assert(listStart>0 && listEnd>listStart, 'BC catalogue section');
  const authoredStart=authored.indexOf('  const bcProvinceButton = document.getElementById(\'province-bc\');');
  const authoredEnd=authored.indexOf('\n  populateSpecies();\n',authoredStart);
  assert(authoredStart>0 && authoredEnd>authoredStart,'authored province switch');
  const switchBlock=authored.slice(authoredStart,authoredEnd+'\n  populateSpecies();'.length)
    .replace("const list = province === 'ab' ? AB_SPECIES : SPECIES;",
             "const list = province === 'ab' ? AB_SPECIES : SPECIES.filter(item => DISPLAYED_SPECIES.has(item.key));")
    .replace("    eraControl.hidden = province === 'ab';","    eraControl.hidden = province === 'ab';\n    document.body.classList.toggle('province-alberta', province === 'ab');")
    .replace('    if (renderAbort) renderAbort.abort();','    showEvidence = false;\n    if (renderAbort) renderAbort.abort();');
  assert(switchBlock.includes('DISPLAYED_SPECIES.has(item.key)'), 'private BC species filter preserved');
  app = app.slice(0,listStart)+switchBlock+'\n'+app.slice(listEnd);
  app = replace(app,"    document.getElementById('layer-license').href = 'https://www2.gov.bc.ca/gov/content/data/open-data/open-government-licence-bc';",
    "    document.getElementById('layer-source').textContent = 'BC data';\n    document.getElementById('layer-license').href = 'https://www2.gov.bc.ca/gov/content/data/open-data/open-government-licence-bc';",'source reset');
  app = replace(app,
    '    const item = speciesByKey[select.value];',
    "    const item = (province === 'ab' ? albertaByKey : speciesByKey)[select.value];",'selected species');
  // The private map hides the era control for special elk modes. Alberta
  // has no validated seasonal datasets, so its era control stays hidden.
  app = app.replaceAll('eraControl.hidden = isRoosevelt || isRockyElk;',
    "eraControl.hidden = province === 'ab' || isRoosevelt || isRockyElk;");
  app = app.replaceAll("eraControl.style.display = (isRoosevelt || isRockyElk) ? 'none' : '';",
    "eraControl.style.display = (province === 'ab' || isRoosevelt || isRockyElk) ? 'none' : '';");
  app = replace(app,
    "    evidenceToggle.hidden = !(KMZ_HEATMAPS.has(item.key) && (viewMode === 'modern' || viewMode === 'historical'));",
    "    evidenceToggle.hidden = province === 'ab' || !(KMZ_HEATMAPS.has(item.key) && (viewMode === 'modern' || viewMode === 'historical'));",'hide BC evidence');
  app = replace(app,"    localStorage.setItem('bc-species-map-v2', item.key);",
    "    localStorage.setItem(province === 'ab' ? 'alberta-species-map-v1' : 'bc-species-map-v2', item.key);",'save species');
  const branchStart=authored.indexOf("      if (province === 'ab') {\n        const note = document.getElementById('layer-note');");
  const branchEnd=authored.indexOf("\n      } else if (",branchStart);
  assert(branchStart>0 && branchEnd>branchStart,'authored Alberta render branch');
  const abBranch = authored.slice(branchStart,branchEnd+"\n      }".length);
  assert(abBranch.includes('/.netlify/functions/alberta-boreal-caribou') &&
    abBranch.includes('Open Government Licence – Canada'),'Alberta render provenance');
  // Production's pinned private viewer adds its Roosevelt / Rocky elk branches
  // ahead of the generic KMZ branch. Preserve that dispatch order for BC.
  const renderStart = app.indexOf('  async function renderSelected() {');
  const renderTry = app.indexOf('    try {\n', renderStart);
  const firstBranch = renderTry + '    try {\n'.length;
  assert(renderStart >= 0 && renderTry > renderStart &&
    app.slice(firstBranch).startsWith('      if ('), 'first render branch');
  app = app.slice(0,firstBranch) + abBranch +
    app.slice(firstBranch).replace(/^      if \(/, ' else if (');
  app = replace(app,
    "        if (viewMode !== 'modern') {\n          const label = viewMode === 'historical'",
    "        if (province === 'ab') {\n          document.getElementById('layer-note-text').textContent = 'Alberta: source unavailable. Please try again later or follow the official source link.';\n          document.getElementById('layer-note').hidden = false;\n          document.getElementById('layer-attribution').hidden = true;\n        } else if (viewMode !== 'modern') {\n          const label = viewMode === 'historical'",
    'error branch');
  app = replace(app,
    "        if (viewMode === 'modern' && !note.hidden && !text.textContent.startsWith('Modern:')) {",
    "        if (province === 'bc' && viewMode === 'modern' && !note.hidden && !text.textContent.startsWith('Modern:')) {",
    'notes');
  app = replace(app,"const savedView = JSON.parse(localStorage.getItem('bc-species-map-view-v2') || 'null');",
    "const savedView = JSON.parse(localStorage.getItem(province === 'ab' ? 'alberta-species-map-view-v1' : 'bc-species-map-view-v2') || 'null');",'view storage');
  app = replace(app,
    "center: savedView?.center || { lat: 54.4, lng: -125.7 },",
    "center: savedView?.center || (province === 'ab' ? { lat: 54.5, lng: -114.8 } : { lat: 54.4, lng: -125.7 }),",
    'map center');
  app = replace(app,
    "      if (!savedView) {\n        map.fitBounds(",
    "      if (!savedView) {\n        const initialBounds = province === 'ab' ? ALBERTA_BOUNDS : BOUNDS;\n        map.fitBounds(",
    'default fit');
  app = replace(app,
    "{ lat: BOUNDS.south, lng: BOUNDS.west },\n            { lat: BOUNDS.north, lng: BOUNDS.east },",
    "{ lat: initialBounds.south, lng: initialBounds.west },\n            { lat: initialBounds.north, lng: initialBounds.east },",
    'initial bounds');
  app = replace(app,"if (viewMode === 'winter' && select.value === 'stone_sheep' && stoneDetail !== null &&",
    "if (province === 'bc' && viewMode === 'winter' && select.value === 'stone_sheep' && stoneDetail !== null &&",
    'stone sheep BC only');
  const oldViewStore = "localStorage.setItem('bc-species-map-view-v2', JSON.stringify({";
  assert(app.includes(oldViewStore), 'view persistence anchor');
  app = app.replaceAll(oldViewStore,
    "localStorage.setItem(province === 'ab' ? 'alberta-species-map-view-v1' : 'bc-species-map-view-v2', JSON.stringify({");
  const provinceHtmlStart=fs.readFileSync(path.join('species-map','index.html'),'utf8');
  const domStart=provinceHtmlStart.indexOf('  <div class="province-control"');
  const domEnd=provinceHtmlStart.indexOf('  <div class="species-control"',domStart);
  assert(domStart>0&&domEnd>domStart,'province HTML');
  html=replace(html,'  <div class="species-control">',provinceHtmlStart.slice(domStart,domEnd)+'  <div class="species-control">','HTML province');
  html=replace(html,'  <div class="era-control"','  <div id="era-control" class="era-control"','era ID');
  html=replace(html,'<title>BC Species Map</title>','<title>HuntSmart Species Map · BC / Alberta</title>','title');
  html=replace(html,'British Columbia big game species distribution map','BC and Alberta big game species distribution map','map label');
  const script=html.match(/<script src="species-catalog\.js\?v=[^"]+"><\/script>/);
  assert(!!script,'catalog script');
  html=replace(html,script[0],script[0]+'\n  <script src="alberta-species.js?v=20261112-1"></script>','AB catalog script');
  html=html.replace(/app\.js\?v=[^"]+/, 'app.js?v=ab-live-20261112c');
  html=html.replace(/app\.css\?v=[^"]+/, 'app.css?v=ab-live-20261112c');
  css+='\n/* Province controls installed after the pinned private viewer. */\n'+[
    '.map-tools{width:min(260px,calc(100vw - 24px))}',
    'body.province-alberta .era-control[hidden]~.map-tools{top:calc(env(safe-area-inset-top,0px) + 120px)}',
    'body.province-alberta.terrain-3d-on .terrain-exaggeration{top:calc(env(safe-area-inset-top,0px) + 198px)}',
    'body.province-alberta .layer-note{display:block!important}',
    'body.province-alberta .layer-note[hidden]{display:none!important}',
    'body.province-alberta .error{top:calc(env(safe-area-inset-top,0px) + 193px)}',
    '@media(max-width:520px){.map-tools{width:min(260px,calc(100vw - 18px))}body.province-alberta .era-control[hidden]~.map-tools{top:calc(env(safe-area-inset-top,0px) + 115px)}body.province-alberta.terrain-3d-on .terrain-exaggeration{top:calc(env(safe-area-inset-top,0px) + 191px)}body.province-alberta .error{top:calc(env(safe-area-inset-top,0px) + 187px)}}',
  ].join('\n')+'\n';
  new Function(app);
  assert(html.includes('id="province-alberta"')&&html.includes('alberta-species.js'), 'province markup absent');
  assert(app.includes("const APP_BUILD = 'species-map-alberta-range-v13'")&&app.includes('toggleTerrain3D()'), 'runtime version/DEM bridge');
  fs.writeFileSync(appFile,app);
  fs.writeFileSync(htmlFile,html);
  fs.writeFileSync(cssFile,css);
  console.log('Installed BC/Alberta province switch after private viewer; existing BC heatmaps and 3D terrain preserved.');
})();
