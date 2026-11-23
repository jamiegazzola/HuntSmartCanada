'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const official=JSON.parse(fs.readFileSync(path.join(__dirname,'../species-map/data/bc-official-harvest-wmu-2020-2024.json'),'utf8'));
const history=JSON.parse(fs.readFileSync(path.join(__dirname,'../species-map/data/bc-official-harvest-history-1976-2024.json'),'utf8'));
const ages=JSON.parse(fs.readFileSync(path.join(__dirname,'../species-map/data/bc-sheep-age-ci-2022-2025.json'),'utf8'));
const names=fs.readFileSync(path.join(__dirname,'../species-map/species-catalog.js'),'utf8');
let catalogue;{const w={};vm.runInNewContext(names,{window:w});catalogue=w.HUNTSMART_SPECIES;}
const extra=['lynx','bobcat','cougar','wolf','wolverine'];
// Protect the mobile Success boundary contract against future vector tile version bumps.
const successSource=fs.readFileSync(path.join(__dirname,'../species-map/harvest-success.js'),'utf8');
const vectorBuilder=fs.readFileSync(path.join(__dirname,'../build-wmu-vector-tiles.mjs'),'utf8');
assert(successSource.includes("fetch('/map-tiles/bc-success-boundaries.json'"),'Success map must fetch the stable boundary index');
assert(vectorBuilder.includes("'bc-success-boundaries.json'"),'Vector build must publish the stable Success boundary index');
assert(!successSource.includes("20261028-v3/manifest.json"),'Success map may not pin a retired tile version');
function setup({fail=false,defer=false}={}){
  const elements=new Map(),layers=[],popups=[],map={};let release;
  let species='mule_deer',province='bc',distribution=true;
  const el=id=>{
    if(!elements.has(id))elements.set(id,{hidden:true,disabled:false,textContent:'',value:'current',
      style:{},dataset:{},append(){},appendChild(){},replaceChildren(){},classList:{toggle(){}},attributes:{},listeners:{},setAttribute(k,v){this.attributes[k]=v},
      addEventListener(k,fn){this.listeners[k]=fn},click(){return this.listeners.click?.()},
      change(){return this.listeners.change?.()},input(){return this.listeners.input?.()}});
    return elements.get(id);
  };
  class Data{constructor({map}){this.map=map;layers.push(this)}
    addGeoJson(fc){this.fc=fc}addListener(k,fn){this.listener=fn}
    setStyle(style){this.style=style}setMap(map){this.map=map}}
  const features=Array.from({length:225},(_,i)=>({type:'Feature',
    properties:{wmu_id:i===0?'3-27':i===1?'3-31':i===2?'7-50':
      i===3?'1-10':i===4?'2-12':i===5?'4-24':i===6?'7-42':'unused-'+i},
    geometry:{type:'Polygon',coordinates:[]}}));
  const w={HUNTSMART_SPECIES:catalogue};
  const metricButtons=['success','density'].map(name=>{const button=el('metric-'+name);button.dataset.hsMetric=name;return button;});
  const sandbox={window:w,document:{createElementNS:()=>el('svg-'+elements.size),createTextNode:t=>t,getElementById:el,querySelectorAll:s=>s==='[data-hs-metric]'?metricButtons:[],querySelector:()=>null,
    createElement(){return el('generated-'+elements.size)},
    head:{appendChild(script){
      const done=()=>{sandbox.BC_WMU_GEOJSON={type:'FeatureCollection',features};
        if(fail)script.onerror();else script.onload()};
      if(defer)release=done;else done();
    }}},
    fetch:url=>{
      if(url.includes('/map-tiles/bc-success-boundaries.json')){
        return new Promise(resolve=>{
          const done=()=>resolve({ok:!fail,json:async()=>({version:'2026-10-28-vector-v2',bc:{index:{type:'FeatureCollection',features}}})});
          if(defer)release=done;else done();
        });
      }
      return Promise.resolve({ok:true,json:async()=>
        url.includes('bc-recorded-harvests')?JSON.parse(fs.readFileSync(path.join(__dirname,'../species-map/data/bc-recorded-harvests.json'))):
        url.includes('bc-sheep-age')?ages:
        url.includes('bc-leh-single-wmu')?{meta:{publisher:'Government of British Columbia',first_year:1984,last_year:2024},species:{GOAT:{},ELK:{},BISO:{'7-42':{'2022':[20,8],'2023':[20,10],'2024':[20,12]}}}}:
        url.includes('harvest-history-')?(()=>{
          const selectedCode=url.match(/harvest-history-([a-z]+)\.json/)?.[1]?.toUpperCase();
          return {meta:history.meta,code:selectedCode,species:{[selectedCode]:history.species[selectedCode]}};
        })():official});
    },
    google:{maps:{Data,InfoWindow:class{close(){}setContent(c){popups.push(c)}setPosition(){}open(){}}}},
    console};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../species-map/elk-species.js'),'utf8'),sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../species-map/harvest-success.js'),'utf8'),sandbox);
  let api;
  api=w.HUNTSMART_HARVEST_SUCCESS.attach({
    getMap:()=>map,getProvince:()=>province,getSpecies:()=>species,getOpacity:()=>0.85,
    onModeChange(){distribution=!api.isEnabled();api.sync()}
  });
  api.sync();
  return{elements,el,api,w,layers,popups,get distribution(){return distribution},
    setSpecies(v){species=v;api.sync()},setProvince(v){province=v;api.sync()},
    release(){assert(release);release()}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
  const base=setup();
  assert(![...base.elements.values()].some(e=>e.attributes['aria-label']==='Harvest data view'),
    'Success must not add a survey/inspection chooser');
  assert(![...base.elements.values()].some(e=>e.attributes['aria-label']==='Recorded harvest hunt type'),
    'Recorded-harvest-only selector must not appear');
  const patched=fs.readFileSync(path.join(__dirname,'patch-rocky-elk-only.cjs'),'utf8');
  assert(patched.includes("eraControl.hidden = false;") && patched.includes("eraModern.hidden = isRockyElk;") &&
         patched.includes("eraHistorical.hidden = isRoosevelt;"),
    'Private distribution patch must preserve visible Success controls for both elk species');
  const keys=[...catalogue.map(x=>x.key),...extra];
  assert.equal(keys.length,31);
  assert.equal(Object.keys(base.w.HUNTSMART_BC_HARVEST_CODES).length,31,
    'Each BC distribution species must have an explicit government category or null');
  for(const key of keys)assert(Object.hasOwn(base.w.HUNTSMART_BC_HARVEST_CODES,key),key+' missing');
  assert.equal(base.el('hs-harvest-period').value,'ten','Default reporting range is 10 years');
  base.el('hs-harvest-toggle').click();await flush();
  assert(base.api.isEnabled());assert.equal(base.distribution,false);
  assert(base.layers.at(-1).fc.features.length===225);
  assert(base.el('hs-harvest-detail').textContent.includes('WMUs with comparable'),
    'Official combined survey view must draw directly without a data-view switch');
  // Single-year data and compact WMU card must be tied to real unit geometry.
  base.el('hs-harvest-period').value='current';base.el('hs-harvest-period').change();await flush();
  const m=base.layers.at(-1);
  m.listener({feature:{getProperty:()=> '3-27'},latLng:{}});
  assert.equal(base.el('hs-wmu-title').textContent,'WMU 3-27');
  assert(base.el('hs-wmu-harvest').textContent.includes('418'),'Actual 2024 harvest in selected WMU');
  assert.equal(base.el('hs-wmu-card').hidden,false,'Card opens for clicked WMU');
  assert(m.style({getProperty:()=> '3-27'}).fillOpacity>.5,'real BC mule deer rate');
  assert.equal(m.style({getProperty:()=> '3-27'}).strokeWeight,2.6,'Only clicked WMU highlighted');
  base.el('hs-harvest-period').value='average';base.el('hs-harvest-period').change();
  base.el('hs-harvest-period').value='1985';base.el('hs-harvest-period').change();
  await flush();
  assert.equal(base.el('hs-harvest-detail').textContent.includes('No sufficiently reported 1985'),true,
    '1985 mule deer category must remain unavailable rather than fabricated');
  base.el('hs-harvest-period').value='1989';base.el('hs-harvest-period').change();
  await flush();
  const oldLayer=base.layers.at(-1);
  assert(oldLayer!==m && oldLayer?.fc?.features?.length===225,'1989 mule deer WMU geometry visible');
  oldLayer.listener({feature:{getProperty:()=> '3-27'},latLng:{}});
  assert(base.el('hs-wmu-meta').textContent.includes('1989'),'Historical year labelled in WMU card');
  assert(base.el('hs-wmu-caveats').textContent.includes('current WMU shapes'),
    'Historic boundary caveat must remain available');
  base.el('hs-harvest-period').value='current';base.el('hs-harvest-period').change();
  base.api.exitSuccess();await flush();
  assert.equal(base.distribution,true);assert.equal(m.map,null);assert.equal(oldLayer.map,null);
  // Success mode persists when a BC species changes; old geometry must be detached.
  base.el('hs-harvest-toggle').click();await flush();const prior=base.layers.at(-1);
  base.setSpecies('elk');await flush();
  assert.equal(prior.map,null);assert(base.api.isEnabled());assert(!base.distribution);
  assert(base.layers.at(-1).fc.features.length===225);
  const policy=base.w.HUNTSMART_ELK_POLICY;
  assert(policy.isRocky('elk')&&policy.isRocky('rocky_elk_kootenay'));
  assert(policy.isRoosevelt('roosevelt_elk')&&!policy.isRocky('roosevelt_elk'));
  assert(policy.coastalWmu('1-10')&&policy.coastalWmu('2-12'));
  assert(!policy.coastalWmu('4-24')&&!policy.coastalWmu('6-9'));
  for(const id of ['1-10','2-12']) {
    assert(policy.excludesFromSuccess('elk',id));
    const style=base.layers.at(-1).style({getProperty:()=>id});
    assert.equal(style.fillOpacity,0,'Rocky elk must not shade WMU '+id);
    assert.equal(style.clickable,false,'Rocky elk must not allow selection in WMU '+id);
  }
  const elkLayer=base.layers.at(-1);
  assert(elkLayer.style({getProperty:()=> '4-24'}).fillOpacity>0,
    'Kootenay elk success layer should still render where official records are comparable');
  elkLayer.listener({feature:{getProperty:()=> '1-10'},latLng:{}});
  assert.equal(base.el('hs-wmu-card').hidden,true,'Excluded Rocky elk unit cannot open details');
  elkLayer.listener({feature:{getProperty:()=> '4-24'},latLng:{}});
  assert(base.el('hs-wmu-meta').textContent.includes('Rocky Mountain elk · interior elk survey'),
    'Rocky view must identify all-elk survey, not assert subspecies-specific success');
  assert(base.el('hs-wmu-caveats').textContent.includes('not subspecies-specific'));
  assert(base.el('hs-harvest-detail').textContent.includes('Regions 1 and 2 excluded'));
  base.el('hs-harvest-period').value='1985';base.el('hs-harvest-period').change();await flush();
  assert(base.el('hs-harvest-detail').textContent.includes('1985'),
    '1985 elk harvest data must be available');
  base.setSpecies('roosevelt_elk');await flush();
  const coastLayer=base.layers.at(-1);
  assert.equal(coastLayer.style({getProperty:()=> '1-10'}).clickable,true,
    'Vancouver Island all-elk data must remain selectable');
  assert.equal(coastLayer.style({getProperty:()=> '2-12'}).clickable,true,
    'South Coast all-elk data must remain selectable');
  for(const id of ['4-24','6-9','3-27']){
    assert(policy.excludesFromSuccess('roosevelt_elk',id),'Noncoastal WMU must be excluded: '+id);
    assert.equal(coastLayer.style({getProperty:()=>id}).fillOpacity,0,
      'Roosevelt must not shade a noncoastal WMU: '+id);
    assert.equal(coastLayer.style({getProperty:()=>id}).clickable,false,
      'Roosevelt must not allow selection outside coastal scope: '+id);
  }
  assert(base.el('hs-harvest-detail').textContent.includes('Coastal Regions 1 and 2 only'),
    'Roosevelt map must disclose its geographic scope');
  assert.equal(base.el('hs-harvest-period').value,'1985',
    'Historical year selection persists across species');
  coastLayer.listener({feature:{getProperty:()=> '4-24'},latLng:{}});
  assert.equal(base.el('hs-wmu-card').hidden,true,'Excluded regions cannot open Roosevelt details');
  coastLayer.listener({feature:{getProperty:()=> '1-10'},latLng:{}});
  assert(base.el('hs-wmu-caveats').textContent.includes('not subspecies-specific'));
  assert(base.el('hs-wmu-caveats').textContent.includes('Only coastal Regions 1 and 2'));
  assert.equal(base.el('hs-wmu-recorded').hidden,true,
    '1985 Roosevelt success must not display modern 2022/23–2024/25 inspection kills');
  assert.equal(base.el('hs-wmu-inspection-source').hidden,true);
  base.el('hs-harvest-period').value='current';base.el('hs-harvest-period').change();await flush();
  base.layers.at(-1).listener({feature:{getProperty:()=> '1-10'},latLng:{}});
  assert(base.el('hs-wmu-recorded').textContent.startsWith('35 inspected Roosevelt elk hunter kills · 2024/25'),
    '2024 estimate must pair only with 2024/25 licence-year inspections');
  assert.equal(base.el('hs-wmu-inspection-source').hidden,false);
  base.el('hs-harvest-period').value='ten';base.el('hs-harvest-period').change();await flush();
  const scaleCoast=base.layers.at(-1);
  assert.equal(scaleCoast.style({getProperty:()=> '1-6'}).fillColor,'#dfcb58',
    '43.7% pooled coastal elk rate must be distinct from 80%+ elk units');
  assert.equal(scaleCoast.style({getProperty:()=> '1-10'}).fillColor,'#e28d42',
    '77.8% pooled coastal elk rate must shade in 60–79% bin');
  assert.equal(scaleCoast.style({getProperty:()=> '1-11'}).fillColor,'#c45145',
    '87.6% pooled coastal elk rate must shade in 80%+ bin');
  base.el('hs-harvest-period').value='average';base.el('hs-harvest-period').change();await flush();
  const sparseCoast=base.layers.at(-1);
  assert.equal(sparseCoast.style({getProperty:()=> '1-5'}).fillColor,'#879bb2',
    'Roosevelt 1-5 documented kills must remain visible with an insufficient success sample');
  sparseCoast.listener({feature:{getProperty:()=> '1-5'},latLng:{}});
  assert.equal(base.el('hs-wmu-rate').textContent,'—','No success probability from small sample');
  assert(base.el('hs-wmu-recorded').textContent.startsWith('27 inspected Roosevelt elk hunter kills'),
    'Roosevelt 1-5 documented harvest still visible');
  assert.equal(sparseCoast.style({getProperty:()=> '1-5'}).clickable,true);
  assert(sparseCoast.style({getProperty:()=> '1-5'}).fillOpacity>0.25,
    'Documented elk harvest must be visible against forest imagery');
  assert(sparseCoast.style({getProperty:()=> '1-5'}).strokeWeight>=1.4,
    'Inspections have their own outline rather than low-success green');
  base.el('metric-density').click();
  assert.equal(sparseCoast.style({getProperty:()=> '1-5'}).fillColor,'#8c9494',
    'Recorded harvest cannot be shaded as hunter density without a density estimate');
  base.el('metric-success').click();
  assert.equal(sparseCoast.style({getProperty:()=> '1-5'}).fillColor,'#879bb2',
    'Inspection evidence shading returns only in success view');
  // Return to historical selection before checking cross-species persistence.
  base.el('hs-harvest-period').value='1985';base.el('hs-harvest-period').change();await flush();
  base.setSpecies('stone_sheep');await flush();
  assert.equal(base.el('hs-harvest-period').value,'1985');
  base.layers.at(-1).listener({feature:{getProperty:()=> '7-50'},latLng:{}});
  assert(!base.el('hs-wmu-caveats').textContent.includes('Stone Sheep mean'),
    'Modern inspected ram ages must not appear beside 1985 harvest');
  base.el('hs-harvest-period').value='average';base.el('hs-harvest-period').change();
  base.layers.at(-1).listener({feature:{getProperty:()=> '7-50'},latLng:{}});
  assert(base.el('hs-wmu-caveats').textContent.includes('Stone Sheep mean'),
    'Current sheep average can include labelled 2022–25 age samples');
  // Grizzly hunting is now closed, but historical 1985 records are valid.
  const grizzly=setup();
  grizzly.setSpecies('grizzly_bear');
  grizzly.el('hs-harvest-toggle').click();await flush();
  assert(grizzly.el('hs-harvest-detail').textContent.includes('closed'));
  grizzly.el('hs-harvest-period').value='1985';
  grizzly.el('hs-harvest-period').change();await flush();
  assert(grizzly.layers.at(-1)?.fc?.features.length===225,'Historical grizzly harvest must render');
  assert(grizzly.el('hs-harvest-detail').textContent.includes('1985'));
  base.setSpecies('wolverine');await flush();
  assert.equal(base.el('hs-harvest-panel').hidden,false);
  assert(base.el('hs-harvest-detail').textContent.includes('No comparable'));
  base.setSpecies('wood_bison');await flush();
  assert.equal(base.api.isEnabled(),false,'Ambiguous bison hunt areas must not produce WMU rates');
  assert.equal(base.el('hs-harvest-toggle').disabled,true);
  assert.equal(base.el('hs-harvest-toggle').textContent,'Success unavailable');
  assert(base.el('hs-harvest-detail').textContent.includes('cross WMUs'));
  base.el('hs-harvest-toggle').click();await flush();
  assert.equal(base.api.isEnabled(),false);
  base.setSpecies('black_bear');await flush();
  assert.equal(base.el('hs-harvest-toggle').disabled,false);
  base.el('hs-harvest-toggle').click();await flush();
  assert.equal(base.el('hs-harvest-toggle').textContent,'Success');
  assert(base.el('hs-harvest-detail').textContent.includes('resident harvest estimates'));
  base.setProvince('ab');
  assert.equal(base.api.isEnabled(),false);
  assert.equal(base.el('hs-harvest-panel').hidden,true);
  const queued=setup({defer:true});queued.el('hs-harvest-toggle').click();await flush();
  queued.api.exitSuccess();queued.release();await flush();
  assert.equal(queued.layers.length,0,'cancelled boundary request must not paint');
  const broken=setup({fail:true});broken.el('hs-harvest-toggle').click();await flush();
  assert.equal(broken.distribution,true,'failed WMU geometry returns to distribution');
  console.log('Official 1976–2024 history, missing 1985 deer, 1989 deer, 1985 elk, parent subspecies, five-year view, cancellations, no-data and AB passed.');
})().catch(e=>{console.error(e);process.exitCode=1});