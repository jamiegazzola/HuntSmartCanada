'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join('site','species-map'),file=n=>path.join(root,n);
let app=fs.readFileSync(file('app.js'),'utf8'),html=fs.readFileSync(file('index.html'),'utf8');
const sourceFile='black-bear-historical-1988.geojson';
const sourceData=JSON.parse(fs.readFileSync(file('data/'+sourceFile),'utf8'));
assert.equal(sourceData.year,1988);
assert.equal(sourceData.features.length,284);
const replace=(s,a,b)=>{assert(s.includes(a),'Black bear patch anchor missing: '+a);return s.replace(a,b)};
const eraAnchor="  const eraHistorical = document.getElementById('era-historical');";
app=replace(app,eraAnchor,eraAnchor+'\n  let bearCache = null;\n  let bearState = null;\n  window.HUNTSMART_BEAR_HISTORY_STATE = () => bearState;');
app=replace(app,"    clearLayer();\n    window.HUNTSMART_BC_EVIDENCE.clear();","    clearLayer();\n    bearState = null;\n    document.getElementById('hs-bear-legend').hidden = true;\n    document.body.classList.remove('bc-black-bear-history');\n    window.HUNTSMART_BC_EVIDENCE.clear();");
const branch="      if (province === 'bc' && item.type === 'bc_official_evidence') {";
app=replace(app,branch,`      if (province === 'bc' && item.key === 'black_bear' && viewMode === 'historical') {
        let payload = bearCache;
        if (!payload) {
          const response = await fetch('data/black-bear-historical-1988.geojson?v=1988-source-1', {signal:renderAbort.signal});
          if (!response.ok) throw new Error('Black bear historical distribution source unavailable');
          payload = await response.json();
          if (payload.type !== 'FeatureCollection' || !payload.features?.length) throw new Error('Black bear historical distribution data invalid');
          if (version !== renderVersion) return;
          bearCache = payload;
        }
        if (version !== renderVersion) return;
        activeData = makeDataLayer();
        activeData.addGeoJson(payload);
        activeData.setStyle(feature => {
          const cls = feature.getProperty('historical_class');
          const color = {L:'#3f9646',M:'#f4d03f',H:'#d73027'}[cls];
          if (!color) return {visible:false};
          return {fillColor:color,fillOpacity:0.62,strokeColor:'#fff',strokeOpacity:0.25,strokeWeight:0.5,zIndex:{L:1,M:2,H:3}[cls],clickable:false};
        });
        const note = document.getElementById('layer-note');
        note.hidden = false;
        document.body.classList.add('bc-black-bear-history');
        document.getElementById('layer-note-text').textContent = 'Historical: BC 1988 distribution. Green low (1 bear per 50–500 km²), yellow moderate (1 per 8–50 km²), red high (more than 1 per 8 km²). Unknown and contradictory records omitted; not current population density.';
        const source = document.getElementById('layer-source');
        source.hidden = false;
        source.href = 'https://a100.gov.bc.ca/pub/acat/public/viewReport.do?reportId=40140';
        source.textContent = 'Original BC mapping archive';
        document.getElementById('layer-attribution').hidden = true;
        const legend = document.getElementById('hs-bear-legend');
        legend.querySelector('strong').textContent = 'BC 1988 · historical abundance';
        legend.hidden = false;
        bearState = {species:item.key,features:payload.features.length,year:1988};
      } else if (province === 'bc' && item.type === 'bc_official_evidence') {`);
html=replace(html,'  <div id="error" ','  <div id="hs-bear-legend" class="hs-bear-legend" hidden><strong>BC 1988 · historical abundance</strong><span><i style="background:#3f9646"></i>Low</span><span><i style="background:#f4d03f"></i>Moderate</span><span><i style="background:#d73027"></i>High</span></div>\n  <div id="error" ');
html=html.replace(/app\.js\?v=[^"]+/,'app.js?v=no-bison-20261123d').replace(/hs-map-ui\.js\?v=[^"]+/,'hs-map-ui.js?v=no-bison-20261123d').replace(/hs-map-ui\.css\?v=[^"]+/,'hs-map-ui.css?v=no-bison-20261123d');
html=html.replace(/species-catalog\.js\?v=[^"]+/,'species-catalog.js?v=no-bison-20261123d').replace(/alberta-species\.js\?v=[^"]+/,'alberta-species.js?v=no-bison-20261123d');

/* Single-source BC distribution policy. Caribou alone retains both eras.
   The existing legacy assets remain archived, not selectable or preloaded. */
app=replace(app,"const DISPLAYED_SPECIES = new Set([...KMZ_HEATMAPS, 'roosevelt_elk', 'black_bear']);","const DISPLAYED_SPECIES = new Set([...KMZ_HEATMAPS, 'roosevelt_elk', 'black_bear', 'grizzly_bear']);");
const grizzly=JSON.parse(fs.readFileSync(file('data/grizzly-2018.geojson'),'utf8'));
assert.equal(grizzly.type,'FeatureCollection');
assert.equal(grizzly.features.length,232);
assert(grizzly.source.includes('bc_grizzly_population_estimates_2015_and_2018'));
assert(grizzly.features.every(f=>Number.isFinite(f.properties?.density_2018)&&f.properties.density_2018>=0&&['Polygon','MultiPolygon'].includes(f.geometry?.type)),'Invalid government grizzly estimates');
const eraEnd=[
"    if (bcBison) {",
"      eraHistorical.hidden = true;",
"      eraModern.textContent = 'Partial range';",
"      if (viewMode !== 'modern') { viewMode = 'modern'; setEraButtons(); }",
"    }"
].join('\n');
app=replace(app,eraEnd,eraEnd+[
"",
"    // Restrict the displayed BC species to their strongest available source.",
"    if (province === 'bc' && DISPLAYED_SPECIES.has(item.key)) {",
"      const both = item.key === 'caribou';",
"      const current = item.key === 'grizzly_bear' || isRoosevelt;",
"      eraModern.hidden = !both && !current;",
"      eraHistorical.hidden = !both && current;",
"      eraModern.textContent = both ? 'Modern' : 'Distribution';",
"      eraHistorical.textContent = 'Historical';",
"      if (!both) viewMode = current ? 'modern' : 'historical';",
"      showEvidence = false;",
"      setEraButtons();",
"    }",
"    document.body.classList.toggle('bc-grizzly-distribution', province === 'bc' && item.key === 'grizzly_bear');"
].join('\n'));
app=replace(app,"const queue = [...keys.map(key => 'kmz-' + key + '-historic.png'), ...keys.filter(key => key !== 'caribou').map(key => 'kmz-' + key + '-modern.png')];","const queue = keys.filter(key => key !== 'wild_sheep').map(key => 'kmz-' + key + '-historic.png');");
app=replace(app,"  let bearState = null;","  let bearState = null;\n  let grizzlyState = null;\n  window.HUNTSMART_GRIZZLY_STATE = () => grizzlyState;");
app=replace(app,"    bearState = null;\n    document.getElementById('hs-bear-legend').hidden = true;","    bearState = null;\n    grizzlyState = null;\n    document.getElementById('hs-grizzly-legend').hidden = true;\n    document.getElementById('hs-bear-legend').hidden = true;");
const grizzlyBranch=[
"      if (province === 'bc' && item.key === 'grizzly_bear') {",
"        const payload = await staticRange(item, renderAbort.signal);",
"        if (version !== renderVersion) return;",
"        if (payload.features.length !== 232 || !payload.features.every(f => Number.isFinite(f.properties?.density_2018) && f.properties.density_2018 >= 0)) throw new Error('Government grizzly density data invalid');",
"        renderStaticRange(payload, item);",
"        document.getElementById('layer-note').hidden = false;",
"        document.getElementById('layer-source').hidden = false;",
"        document.getElementById('layer-source').href = payload.source;",
"        document.getElementById('layer-source').textContent = 'Official BC grizzly population estimates';",
"        document.getElementById('layer-note-text').textContent = '2018 BC grizzly bear population estimates per 1,000 km² by population subunit. These are management-area averages, not exact animal locations or current abundance. Blank areas do not prove absence.';",
"        document.getElementById('layer-attribution').hidden = true;",
"        document.getElementById('hs-grizzly-legend').hidden = false;",
"        grizzlyState = {species:item.key,features:payload.features.length,year:2018};",
"      } else if (province === 'bc' && item.key === 'black_bear' && viewMode === 'historical') {"
].join('\n');
app=replace(app,"      if (province === 'bc' && item.key === 'black_bear' && viewMode === 'historical') {",grizzlyBranch);
html=replace(html,'  <div id="error" ','  <div id="hs-grizzly-legend" class="hs-bear-legend" hidden><strong>BC 2018 · bears per 1,000 km²</strong><span><i style="background:#3f9646"></i>≤5</span><span><i style="background:#f4d03f"></i>5–15</span><span><i style="background:#f48b27"></i>15–30</span><span><i style="background:#d73027"></i>&gt;30</span></div>\n  <div id="error" ');
fs.appendFileSync(file('app.css'),'\nbody.bc-grizzly-distribution:not(.hunter-success-only) .layer-note:not([hidden]){display:block!important}\n');
html=html.replace(/app\.css\?v=[^"]+/,'app.css?v=bc-distribution-policy-20261124');
html=html.replace(/app\.js\?v=[^"]+/,'app.js?v=bc-distribution-policy-20261124');

new Function(app);
fs.writeFileSync(file('app.js'),app);fs.writeFileSync(file('index.html'),html);
console.log('Adopted the validated TEST map as Black Bear Historical; all other maps unchanged.');
