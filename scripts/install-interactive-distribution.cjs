'use strict';
// Last production installer: replace the historical KMZ presentation with
// the user's validated, source-attributed March 2005 BC polygon collection.
// Keep the already verified grizzly, black bear, Roosevelt and modern caribou sources.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process'),{gunzipSync}=require('node:zlib'),{createHash}=require('node:crypto');
const root=path.join('site','species-map'),asset=path.join('scripts','assets','bc-historical-vectors-2005.zip');
const sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(sha(fs.readFileSync(asset)),'1670781b631a2618c9fd135a3545d84d5e9e13a389c72809d2de836e40e85f5f','Historical source bundle changed');
const extract=name=>execFileSync('unzip',['-p',asset,'data/'+name],{maxBuffer:16*1024*1024});
const manifest=JSON.parse(extract('manifest.json'));
assert.equal(manifest.source_archive_sha256,'6ca7deff332624ee9355d75d18337784fd738b26a16898e3670db1b72ad722d9');
const expected={mule_deer:187,white_tailed_deer:39,elk:37,moose:304,mountain_goat:291,wild_sheep:141,caribou:53};
const dataDir=path.join(root,'data','historical-2005');
fs.mkdirSync(dataDir,{recursive:true});
const cls={few:'L',moderate:'M',plentiful:'H'};
for(const [key,count] of Object.entries(expected)){
  const compressed=extract(key+'.geojson.gz');
  assert.equal(sha(compressed),manifest.layers[key].compressed_sha256);
  const bytes=gunzipSync(compressed);
  assert.equal(sha(bytes),manifest.layers[key].sha256);
  const data=JSON.parse(bytes);
  assert.equal(data.compilation_year,2005);assert.equal(data.features.length,count);
  const records=new Set();
  for(const feature of data.features){
    const p=feature.properties;
    assert(p.historical_class===cls[p.abundance] && Number.isFinite(p.area_km2) && p.area_km2>0);
    assert(!records.has(p.source_record));records.add(p.source_record);
    assert(['Polygon','MultiPolygon'].includes(feature.geometry.type));
    const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates;
    for(const polygon of polygons)for(const ring of polygon){
      assert(ring.length>=4);
      assert.deepEqual(ring[0],ring.at(-1));
      assert(ring.every(v=>v.length===2&&v.every(Number.isFinite)&&v[0]>-140&&v[0]<-113&&v[1]>48&&v[1]<61));
    }
    if(key==='elk')assert.equal(p.subspecies,'Rocky Mountain elk');
  }
  fs.writeFileSync(path.join(dataDir,key+'.geojson'),bytes);
}
fs.writeFileSync(path.join(dataDir,'manifest.json'),JSON.stringify(manifest));
const appFile=path.join(root,'app.js'),htmlFile=path.join(root,'index.html'),cssFile=path.join(root,'app.css');
let app=fs.readFileSync(appFile,'utf8'),html=fs.readFileSync(htmlFile,'utf8');
const replace=(s,a,b)=>{assert(s.includes(a),'Interactive distribution anchor missing: '+a.slice(0,160));return s.replace(a,b)};
const regionStart='  async function renderSelected() {';
const helper=[
"  // BC_HISTORICAL_SOURCE_POLYGONS_2005",
"  const historicVectorCounts = "+JSON.stringify(expected)+";",
"  const distributionLayers = new Map();",
"  let distributionSelection = null;",
"  const historicalColors = { L:'#3f9646', M:'#f4d03f', H:'#d73027' };",
"  const historicalLabels = {L:'Few',M:'Moderate',H:'Plentiful',R:'Rare / occasional'};",
"  const numberText = (n, digits=1) => n == null || !Number.isFinite(Number(n)) ? 'Unavailable' : Number(n).toLocaleString('en-CA',{maximumFractionDigits:digits});",
"  const distributionSource = 'https://www.env.gov.bc.ca/esd/distdata/ecosystems/frpa/Ungulate_Data_and_Maps/';",
"  const archiveSource = 'https://a100.gov.bc.ca/pub/acat/public/viewReport.do?reportId=40140';",
"  const herdSource = 'https://www2.gov.bc.ca/assets/gov/environment/plants-animals-and-ecosystems/wildlife-wildlife-habitat/caribou/bc_caribou_herds_population_estimates.pdf';",
"  const islandSource = 'https://www2.gov.bc.ca/assets/gov/farming-natural-resources-and-industry/forestry/bc-timber-sales/ems-sfm-certification/business-area/strait-of-georgia/tsg_elk_mgmt_policy_pacific_tsa_former_tfl44-june_2011.pdf';",
"  const epuSource = 'https://services6.arcgis.com/ubm4tcTYICKBpist/arcgis/rest/services/SBOT_Roosevelt_Elk_Population_Abundance_2013_to_2023/FeatureServer/4';",
"  function closeDistributionArea(){",
"    if(distributionSelection)distributionSelection.layer.revertStyle(distributionSelection.feature);",
"    distributionSelection=null;",
"    document.getElementById('hs-distribution-card').hidden=true;",
"    document.body.classList.remove('bc-distribution-selected');",
"  }",
"  function clearDistributionAreas(){",
"    closeDistributionArea();",
"    for(const meta of distributionLayers.values())meta.listener.remove();",
"    distributionLayers.clear();",
"    document.getElementById('hs-history-legend').hidden=true;",
"    document.body.classList.remove('bc-historical-vectors','bc-interactive-distribution');",
"  }",
"  function distributionDetails(kind, feature){",
"    const p=name=>feature.getProperty(name);",
"    const item=speciesByKey[select.value];",
"    const cls=p('historical_class')||p('density_class');",
"    if(kind==='historic'){",
"      return {title:p('subspecies')||item.label,meta:'BC government · March 2005 map compilation',values:[['Relative abundance',historicalLabels[cls]||'Unclassified'],['Mapped polygon area',numberText(p('area_km2'))+' km²']],note:'Historical relative abundance, not current animal density. Observation dates are unspecified. Polygon area is not a population estimate.',source:distributionSource};",
"    }",
"    if(kind==='bear'){",
"      const ranges={L:'1 per 50–500 km²',M:'1 per 8–50 km²',H:'Over 1 per 8 km²'};",
"      return {title:'Black bear',meta:'BC government · 1988',values:[['Historical abundance',historicalLabels[cls]||'Unknown'],['Historical density range',ranges[cls]||'Unavailable']],note:'Published historical class, not an exact count or current density.',source:archiveSource};",
"    }",
"    if(kind==='caribou'){",
"      const method=p('POPULATION_METHOD')||'unavailable';",
"      const methods={survey:'Survey',minimum:'Minimum known alive',ipm:'Integrated population model',expert:'Expert estimate',combined_survey:'Combined survey',combined_ipm:'Combined population model',unavailable:'Unavailable'};",
"      const density=p('DENSITY_PER_KM2');",
"      return {title:p('HERD_NAME')||'Caribou herd',meta:'Government of BC · published herd estimates',values:[['Estimated herd population',numberText(p('POPULATION_ESTIMATE'),0)],['Est. animals / 1,000 km²',density==null?'Unavailable':numberText(Number(density)*1000,2)],['Mapped herd area',numberText(p('RANGE_AREA_KM2'),0)+' km²'],['Estimate method',methods[method]||method]],note:'Estimate dates vary by herd. Density is calculated over mapped herd range; combined, minimum-count and transboundary values are approximate.',source:herdSource};",
"    }",
"    if(kind==='roosevelt-recent'){",
"      const density=p('density_per_km2');",
"      return {title:p('unit')||'Roosevelt elk population unit',meta:'BC government · '+(p('survey_year')||'2013–2023'),values:[['Population estimate',numberText(p('estimate'),0)],['Estimated elk / 1,000 km²',density==null?'Unavailable':numberText(Number(density)*1000,2)],['Population-unit land area',numberText(p('area_km2'),0)+' km²'],['Estimate method',p('estimate_source')==='model'?'Model':'Standard estimate']],note:'Population-unit average, not current animal locations or a drainage-level prediction.',source:epuSource};",
"    }",
"    const island=kind==='roosevelt-island';",
"    return {title:'Roosevelt elk',meta:island?'Vancouver Island · BC 2011 map':'Mainland / coastal BC · 1990 archive',values:[['Historical density class',historicalLabels[cls]||'Unknown']],note:island?'Approximate density zone digitized from the 2011 provincial map. Not a current density estimate.':'Historical distribution class. Not a current animal count.',source:island?islandSource:archiveSource};",
"  }",
"  function attachDistributionLayer(layer,kind){",
"    let features=0;layer.forEach(()=>{features++;});",
"    const listener=layer.addListener('click',event=>{",
"      if(province!=='bc'||harvestSuccess.isEnabled()||!distributionLayers.has(layer)||!event.feature)return;",
"      if(document.getElementById('coordinate-drop-pin')?.getAttribute('aria-pressed')==='true'){google.maps.event.trigger(map,'click',event);return;}",
"      closeDistributionArea();",
"      const details=distributionDetails(kind,event.feature);",
"      const card=document.getElementById('hs-distribution-card');",
"      document.getElementById('hs-distribution-title').textContent=details.title;",
"      document.getElementById('hs-distribution-meta').textContent=details.meta;",
"      const grid=document.getElementById('hs-distribution-stats');grid.replaceChildren();",
"      for(const [label,value] of details.values){const cell=document.createElement('div'),strong=document.createElement('strong'),span=document.createElement('span');strong.textContent=value;span.textContent=label;cell.append(strong,span);grid.append(cell);}",
"      document.getElementById('hs-distribution-explanation').textContent=details.note;",
"      document.getElementById('hs-distribution-source').href=details.source;",
"      distributionSelection={layer,feature:event.feature,details,kind};",
"      layer.overrideStyle(event.feature,{strokeColor:'#fff',strokeOpacity:0.95,strokeWeight:2.5,zIndex:10});",
"      card.hidden=false;document.body.classList.add('bc-distribution-selected');",
"    });",
"    distributionLayers.set(layer,{kind,features,listener});",
"    document.body.classList.add('bc-interactive-distribution');",
"  }",
"  document.getElementById('hs-distribution-close').addEventListener('click',closeDistributionArea);",
"  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&distributionSelection)closeDistributionArea();});",
"  window.HUNTSMART_DISTRIBUTION_STATE=()=>({species:select.value,mode:viewMode,layers:[...distributionLayers.values()].map(({kind,features})=>({kind,features})),selection:distributionSelection?.details||null});",
""
].join('\n');
app=replace(app,regionStart,helper+'\n'+regionStart);
app=replace(app,"    clearLayer();\n    bearState = null;","    clearDistributionAreas();\n    clearLayer();\n    bearState = null;");
const first="      if (province === 'bc' && item.key === 'grizzly_bear') {";
const historicBranch=[
"      if (province === 'bc' && viewMode === 'historical' && Object.hasOwn(historicVectorCounts,item.key)) {",
"        const payload=await staticRange({asset:'data/historical-2005/'+item.key+'.geojson'},renderAbort.signal);",
"        if(version!==renderVersion)return;",
"        if(payload.compilation_year!==2005||payload.features.length!==historicVectorCounts[item.key])throw Error('Historical distribution source is incomplete');",
"        activeData=makeDataLayer();activeData.addGeoJson(payload);",
"        activeData.setStyle(feature=>{const cls=feature.getProperty('historical_class');return {fillColor:historicalColors[cls],fillOpacity:0.62,strokeColor:'#fff',strokeOpacity:0.25,strokeWeight:0.45,zIndex:{L:1,M:2,H:3}[cls],clickable:true};});",
"        attachDistributionLayer(activeData,'historic');",
"        document.getElementById('layer-note').hidden=false;",
"        document.getElementById('layer-note-text').textContent='Historical: original BC ungulate distribution polygons, March 2005 compilation. Few, moderate and plentiful are published relative-abundance classes, not current population density. Original observation dates are unspecified. Blank areas do not prove absence.';",
"        document.getElementById('layer-source').hidden=false;",
"        document.getElementById('layer-source').href=distributionSource;",
"        document.getElementById('layer-source').textContent='BC ungulate mapping source';",
"        document.getElementById('layer-attribution').hidden=true;",
"        document.getElementById('hs-history-legend').hidden=false;",
"        document.body.classList.add('bc-historical-vectors');",
"      } else if (province === 'bc' && item.key === 'grizzly_bear') {"
].join('\n');
app=replace(app,first,historicBranch);
// Enable polygon selection only in the existing BC render branches, without
// changing their source, estimates, colors or per-species control policy.
function modifyBranch(start,end,callback){
  const a=app.indexOf(start),b=app.indexOf(end,a+start.length);
  assert(a>=0&&b>a,'Could not find distribution renderer '+start);
  app=app.slice(0,a)+callback(app.slice(a,b))+app.slice(b);
}
modifyBranch("      } else if (province === 'bc' && item.key === 'black_bear' && viewMode === 'historical') {","      } else if (province === 'bc' && item.type === 'bc_official_evidence') {",part=>{
  assert(part.includes('clickable:false'));
  return part.replaceAll('clickable:false','clickable:true').replace("        bearState = {species:item.key,features:payload.features.length,year:1988};","        attachDistributionLayer(activeData,'bear');\n        bearState = {species:item.key,features:payload.features.length,year:1988};");
});
modifyBranch("      } else if (item.key === 'caribou' && viewMode === 'modern') {","      } else if (!showEvidence && KMZ_HEATMAPS.has(item.key)",part=>{
  assert(part.includes('DENSITY_PER_KM2')&&part.includes('clickable:false'));
  part=part.replace(/clickable:\s*false/g,'clickable:true');
  part=part.replace("const density = Number(feature.getProperty('DENSITY_PER_KM2'));","const rawDensity=feature.getProperty('DENSITY_PER_KM2');\n          const density=rawDensity==null?NaN:Number(rawDensity);");
  return replace(part,"        document.getElementById('layer-note').hidden = false;","        attachDistributionLayer(activeData,'caribou');\n        document.getElementById('layer-note').hidden = false;");
});
// The Roosevelt branch is assembled by several ordered installers. Bound the
// changes by the actual population data statements, not another species path.
const islandStart=app.indexOf('        const [historical, island, recent] = await Promise.all([');
assert(islandStart>=0,'Roosevelt Island branch missing');
const nextBranch=app.indexOf('\n      } else if (',islandStart);
assert(nextBranch>islandStart,'Roosevelt branch end missing');
let roosevelt=app.slice(islandStart,nextBranch);
assert(roosevelt.includes('activeData.addGeoJson(mainlandHistory)')&&roosevelt.includes('islandData.addGeoJson(island)')&&roosevelt.includes('rooseveltMainlandData.addGeoJson(recent)'));
roosevelt=roosevelt.replace(/clickable:\s*false/g,'clickable:true');
roosevelt+="\n        attachDistributionLayer(activeData,'roosevelt-history');\n        attachDistributionLayer(islandData,'roosevelt-island');\n        attachDistributionLayer(rooseveltMainlandData,'roosevelt-recent');";
app=app.slice(0,islandStart)+roosevelt+app.slice(nextBranch);
// All seven original KMZ historical selections now load only their own static
// vector data. Do not download unused older rasters or old sheep API layers.
const preloadHook='      renderSelected();\n      scheduleBackgroundKmzPreload();';
const deployedPreloadHook="      renderSelected().finally(() => { if (!window.matchMedia('(max-width:768px)').matches && navigator.connection?.downlink >= 10 && !navigator.connection?.saveData) setTimeout(scheduleBackgroundKmzPreload, 5000); });";
const onDemandHook='      renderSelected(); // BC_HISTORICAL_VECTORS_ON_DEMAND';
if(app.includes(preloadHook))app=app.replace(preloadHook,onDemandHook);
else app=replace(app,deployedPreloadHook,onDemandHook);
const markup=[
'  <div id="hs-history-legend" class="hs-bear-legend" hidden><strong>BC historical · 2005 compilation</strong><span><i style="background:#3f9646"></i>Few</span><span><i style="background:#f4d03f"></i>Moderate</span><span><i style="background:#d73027"></i>Plentiful</span></div>',
'  <section id="hs-distribution-card" class="hs-wmu-card hs-distribution-card" aria-label="Wildlife distribution area statistics" hidden>',
'    <div class="hs-wmu-heading"><div><h2 id="hs-distribution-title" class="hs-wmu-title"></h2><div id="hs-distribution-meta" class="hs-wmu-meta"></div></div><button type="button" id="hs-distribution-close" class="hs-wmu-close" aria-label="Close distribution statistics">×</button></div>',
'    <div id="hs-distribution-stats" class="hs-wmu-stats"></div>',
'    <p id="hs-distribution-explanation" class="hs-grizzly-explanation"></p>',
'    <a id="hs-distribution-source" target="_blank" rel="noopener noreferrer">Government of BC source</a>',
'  </section>',
'  <div id="error" '
].join('\n');
html=replace(html,'  <div id="error" ',markup);
html=html.replace(/app\.js\?v=[^"]+/,'app.js?v=bc-historical-vectors-20261124').replace(/app\.css\?v=[^"]+/,'app.css?v=bc-historical-vectors-20261124');
fs.appendFileSync(cssFile,'\nbody.bc-interactive-distribution:not(.hunter-success-only) .layer-note:not([hidden]){display:block!important}.hs-distribution-card{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.hs-distribution-card .hs-wmu-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.hs-distribution-card .hs-wmu-stats strong{font-size:16px;overflow-wrap:anywhere}.hs-distribution-card[hidden]{display:none!important}@media(max-width:700px){.hs-distribution-card{bottom:calc(env(safe-area-inset-bottom,0px) + 84px)!important}.bc-distribution-selected #hs-history-legend,.bc-distribution-selected #hs-bear-legend{visibility:hidden}}\n');
new Function(app);
fs.writeFileSync(appFile,app);fs.writeFileSync(htmlFile,html);
console.log('Installed '+Object.values(expected).reduce((a,b)=>a+b,0)+' original historical polygons, plus selectable modern caribou, black bear and Roosevelt layers.');
