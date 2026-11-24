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
"  // Government legend thresholds: source specifies one animal per N square kilometres.",
"  const historicalThresholds={\"mule_deer\":[200,2,0.2],\"white_tailed_deer\":[518,5,0.5],\"elk\":[250,10,2.5],\"moose\":[260,10,1.3],\"mountain_goat\":[260,13,3],\"wild_sheep\":[250,5,1.3],\"caribou\":[250,25,3.4],\"black_bear\":[500,50,8],\"roosevelt_elk\":[250,10,2.5]};",
"  const densityAnimals={\"mule_deer\":\"deer\",\"white_tailed_deer\":\"deer\",\"elk\":\"elk\",\"moose\":\"moose\",\"mountain_goat\":\"goats\",\"wild_sheep\":\"sheep\",\"caribou\":\"caribou\",\"black_bear\":\"bears\",\"roosevelt_elk\":\"elk\"};",
"  const historicalPDFs={\"mule_deer\":\"mule_deer.pdf\",\"elk\":\"elk.pdf\",\"moose\":\"moose.pdf\",\"mountain_goat\":\"Mountain_goat.pdf\",\"wild_sheep\":\"mountain_sheep.pdf\",\"caribou\":\"caribou.pdf\"};",
"  function historicalDensity(key,cls){",
"    const bounds=historicalThresholds[key];if(!bounds||!['L','M','H'].includes(cls))return null;",
"    const [few,moderate,high]=bounds.map(n=>100/n);",
"    const fmt=n=>Number(n.toPrecision(3)).toLocaleString('en-CA',{maximumFractionDigits:3});",
"    return ['Historical '+densityAnimals[key]+' / 100 km²',cls==='L'?fmt(few)+'–'+fmt(moderate):cls==='M'?fmt(moderate)+'–'+fmt(high):'>'+fmt(high)];",
"  }",
"  const densityValues=(key,cls)=>{const value=historicalDensity(key,cls);return value?[value]:[];};",
"  function ringContains(ring,x,y){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}",
"  function geometryContains(g,x,y){const polygons=g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[];return polygons.some(r=>r.length&&ringContains(r[0],x,y)&&!r.slice(1).some(h=>ringContains(h,x,y)));}",
"  async function selectedWmu(latLng){",
"    if(!latLng)return null;const x=latLng.lng(),y=latLng.lat();",
"    if(!Number.isFinite(x)||!Number.isFinite(y))return null;",
"    const collection=await harvestSuccess.fetchBoundaries();",
"    const matches=collection.features.filter(f=>geometryContains(f.geometry,x,y)).map(f=>String(f.properties.wmu_id||f.properties.WMUNIT_NUM));",
"    const unique=[...new Set(matches)];return unique.length===1?unique[0]:null;",
"  }",
"  function updateSelectedWmu(event,selection,metaId,base){",
"    selectedWmu(event.latLng).then(id=>{if(selection()&&id)document.getElementById(metaId).textContent=base+' · WMU '+id+' (approx.)';}).catch(()=>{});",
"  }",
"  function distributionDetails(kind, feature){",
"    const p=name=>feature.getProperty(name);",
"    const item=speciesByKey[select.value];",
"    const cls=p('historical_class')||p('density_class');",
"    if(kind==='historic'){",
"      const pdf=historicalPDFs[item.key];",
"      return {title:p('subspecies')||item.label,meta:'BC government · 2005 compilation',values:[['Relative abundance',historicalLabels[cls]||'Unclassified'],...densityValues(item.key,cls)],note:'Historical density class; rounded range, not a current count.',source:pdf?distributionSource+'plots_and_pdfs/'+pdf:archiveSource};",
"    }",
"    if(kind==='bear'){",

"      return {title:'Black bear',meta:'BC government · 1988',values:[['Relative abundance',historicalLabels[cls]||'Unknown'],...densityValues('black_bear',cls)],note:'Historical density class; not a current count.',source:archiveSource};",
"    }",
"    if(kind==='caribou'){",
"      const method=p('POPULATION_METHOD')||'unavailable';",
"      const methods={survey:'Survey',minimum:'Minimum known alive',ipm:'Integrated population model',expert:'Expert estimate',combined_survey:'Combined survey',combined_ipm:'Combined population model',unavailable:'Unavailable'};",
"      const density=p('DENSITY_PER_KM2');",
"      const minimum=method==='minimum',population=p('POPULATION_ESTIMATE'),year=p('POPULATION_YEAR');",
"      const estimateLabel=minimum?'Minimum known alive':'Estimated herd population';",
"      const prefix=minimum?'≥':'';",
"      return {title:(p('HERD_NAME')||'Unnamed')+' · Caribou',meta:'BC government · '+(year||'2023 status report'),values:[[estimateLabel,population==null?'Unavailable':prefix+numberText(population,0)],[minimum?'Minimum / 100 km²':'Est. caribou / 100 km²',density==null?'Unavailable':prefix+numberText(Number(density)*100,2)],['Estimate method',methods[method]||method],['Relative density',p('DENSITY_LABEL')||'Unavailable']],note:'Average across mapped herd range; combined or cross-border values are approximate.',source:herdSource};",
"    }",
"    if(kind==='roosevelt-recent'){",
"      const density=p('density_per_km2');",
"      return {title:(p('unit')||'Population unit')+' · Roosevelt elk',meta:'BC government · '+(p('survey_year')||'2013–2023'),values:[['Population estimate',numberText(p('estimate'),0)],['Estimated elk / 100 km²',density==null?'Unavailable':numberText(Number(density)*100,2)],['Estimate method',p('estimate_source')==='model'?'Model':'Standard estimate'],['Density class',cls==='R'?'Very low':historicalLabels[cls]||'Unknown']],note:'Population-unit average; not an exact local density.',source:epuSource};",
"    }",
"    const island=kind==='roosevelt-island';",
"    return {title:'Roosevelt elk',meta:island?'Vancouver Island · BC 2011 map':'Mainland / coastal BC · 1990 archive',values:[['Relative abundance',historicalLabels[cls]||'Unknown'],...densityValues('roosevelt_elk',cls)],note:island?'Digitized 2011 historical density class; approximate boundaries.':'Historical density class; not a current count.',source:island?islandSource:archiveSource};",
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
"      const selection=distributionSelection;",
"      updateSelectedWmu(event,()=>distributionSelection===selection,'hs-distribution-meta',details.meta);",
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
app=replace(app,"    document.getElementById('hs-grizzly-meta').textContent = 'WMU ' + wmu + ' · Government of BC · 2018';","    const grizzlyMeta='Subunit WMU '+wmu+' · BC government · 2018';\n    document.getElementById('hs-grizzly-meta').textContent=grizzlyMeta;\n    const chosenGrizzly=grizzlySelection;\n    updateSelectedWmu(event,()=>grizzlySelection===chosenGrizzly,'hs-grizzly-meta',grizzlyMeta);");
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
html=html.replace(/app\.js\?v=[^"]+/,'app.js?v=bc-distribution-density-20261124').replace(/app\.css\?v=[^"]+/,'app.css?v=bc-distribution-density-20261124');
fs.appendFileSync(cssFile,'\nbody.bc-interactive-distribution:not(.hunter-success-only) .layer-note:not([hidden]){display:block!important}.hs-distribution-card{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.hs-distribution-card .hs-wmu-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.hs-distribution-card .hs-wmu-stats strong{font-size:16px;overflow-wrap:anywhere}.hs-distribution-card[hidden]{display:none!important}@media(max-width:700px){.hs-distribution-card{bottom:calc(env(safe-area-inset-bottom,0px) + 84px)!important}.bc-distribution-selected #hs-history-legend,.bc-distribution-selected #hs-bear-legend{visibility:hidden}}\n');
html=html.replace(/harvest-success\.js\?v=[^"]+/,'harvest-success.js?v=bc-distribution-density-20261124');
new Function(app);
// Independently validate density conversions and point-in-polygon including holes.
const functions=new Function(helper.slice(helper.indexOf('  const historicalThresholds='),helper.indexOf('  async function selectedWmu('))+'\nreturn {historicalDensity,geometryContains};')();
assert.deepEqual(functions.historicalDensity('mule_deer','H'),['Historical deer / 100 km²','>500']);
assert.deepEqual(functions.historicalDensity('moose','M'),['Historical moose / 100 km²','10–76.9']);
assert.equal(functions.historicalDensity('roosevelt_elk','R'),null);
const polygon={type:'Polygon',coordinates:[[[0,0],[4,0],[4,4],[0,4],[0,0]],[[1,1],[2,1],[2,2],[1,2],[1,1]]]};
assert(functions.geometryContains(polygon,3,3));assert(!functions.geometryContains(polygon,1.5,1.5));assert(!functions.geometryContains(polygon,5,5));
fs.writeFileSync(appFile,app);fs.writeFileSync(htmlFile,html);
console.log('Installed '+Object.values(expected).reduce((a,b)=>a+b,0)+' original historical polygons, plus selectable modern caribou, black bear and Roosevelt layers.');
