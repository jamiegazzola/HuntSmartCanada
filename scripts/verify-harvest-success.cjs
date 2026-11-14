'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const official=JSON.parse(fs.readFileSync(path.join(__dirname,'../species-map/data/bc-official-harvest-wmu-2020-2024.json'),'utf8'));
const history=JSON.parse(fs.readFileSync(path.join(__dirname,'../species-map/data/bc-official-harvest-history-1976-2024.json'),'utf8'));
const ages=JSON.parse(fs.readFileSync(path.join(__dirname,'../species-map/data/bc-sheep-age-ci-2022-2025.json'),'utf8'));
const names=fs.readFileSync(path.join(__dirname,'../species-map/species-catalog.js'),'utf8');
let catalogue;{const w={};vm.runInNewContext(names,{window:w});catalogue=w.HUNTSMART_SPECIES;}
const extra=['lynx','bobcat','cougar','wolf','wolverine'];
function setup({fail=false,defer=false}={}){
  const elements=new Map(),layers=[],popups=[],map={};let release;
  let species='mule_deer',province='bc',distribution=true;
  const el=id=>{
    if(!elements.has(id))elements.set(id,{hidden:true,disabled:false,textContent:'',value:'current',
      attributes:{},listeners:{},setAttribute(k,v){this.attributes[k]=v},
      addEventListener(k,fn){this.listeners[k]=fn},click(){return this.listeners.click?.()},
      change(){return this.listeners.change?.()},input(){return this.listeners.input?.()}});
    return elements.get(id);
  };
  class Data{constructor({map}){this.map=map;layers.push(this)}
    addGeoJson(fc){this.fc=fc}addListener(k,fn){this.listener=fn}
    setStyle(style){this.style=style}setMap(map){this.map=map}}
  const features=Array.from({length:225},(_,i)=>({type:'Feature',
    properties:{wmu_id:i===0?'3-27':i===1?'3-31':i===2?'7-50':'unused-'+i},
    geometry:{type:'Polygon',coordinates:[]}}));
  const w={HUNTSMART_SPECIES:catalogue};
  const sandbox={window:w,document:{getElementById:el,
    createElement(){return{style:{},children:[],appendChild(child){this.children.push(child)}}},
    head:{appendChild(script){
      const done=()=>{sandbox.BC_WMU_GEOJSON={type:'FeatureCollection',features};
        if(fail)script.onerror();else script.onload()};
      if(defer)release=done;else done();
    }}},
    fetch:async url=>({ok:true,json:async()=>
      url.includes('bc-sheep-age')?ages:
      url.includes('bc-official-harvest-history')?history:official}),
    google:{maps:{Data,InfoWindow:class{close(){}setContent(c){popups.push(c)}setPosition(){}open(){}}}},
    console};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../species-map/harvest-success.js'),'utf8'),sandbox);
  let api;
  api=w.HUNTSMART_HARVEST_SUCCESS.attach({
    getMap:()=>map,getProvince:()=>province,getSpecies:()=>species,getOpacity:()=>0.85,
    onModeChange(){distribution=!api.isEnabled();api.sync()}
  });
  api.sync();
  return{el,api,w,layers,popups,get distribution(){return distribution},
    setSpecies(v){species=v;api.sync()},setProvince(v){province=v;api.sync()},
    release(){assert(release);release()}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
  const base=setup();
  const keys=[...catalogue.map(x=>x.key),...extra];
  assert.equal(keys.length,31);
  assert.equal(Object.keys(base.w.HUNTSMART_BC_HARVEST_CODES).length,31,
    'Each BC distribution species must have an explicit government category or null');
  for(const key of keys)assert(Object.hasOwn(base.w.HUNTSMART_BC_HARVEST_CODES,key),key+' missing');
  base.el('hs-harvest-toggle').click();await flush();
  assert(base.api.isEnabled());assert.equal(base.distribution,false);
  assert(base.layers.at(-1).fc.features.length===225);
  const m=base.layers.at(-1);
  m.listener({feature:{getProperty:()=> '3-27'},latLng:{}});
  assert.equal(base.popups.at(-1).children.find(x=>x.href)?.textContent,'Data source: Government of BC');
  assert(base.popups.at(-1).children.some(x=>String(x.textContent).includes('418')));
  assert(m.style({getProperty:()=> '3-27'}).fillOpacity>.5,'real BC mule deer rate');
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
  assert(base.popups.at(-1).children.some(x=>String(x.textContent).includes('1989')),
    'Historic year must appear in WMU popup');
  assert(base.popups.at(-1).children.some(x=>String(x.textContent).includes('current WMU shapes')),
    'Historic boundary caveat must be visible');
  base.el('hs-harvest-period').value='current';base.el('hs-harvest-period').change();
  base.el('hs-harvest-toggle').click();await flush();
  assert.equal(base.distribution,true);assert.equal(m.map,null);assert.equal(oldLayer.map,null);
  // Success mode persists when a BC species changes; old geometry must be detached.
  base.el('hs-harvest-toggle').click();await flush();const prior=base.layers.at(-1);
  base.setSpecies('elk');await flush();
  assert.equal(prior.map,null);assert(base.api.isEnabled());assert(!base.distribution);
  assert(base.layers.at(-1).fc.features.length===225);
  base.el('hs-harvest-period').value='1985';base.el('hs-harvest-period').change();await flush();
  assert(base.el('hs-harvest-detail').textContent.includes('1985'),
    '1985 elk harvest data must be available');
  base.setSpecies('roosevelt_elk');await flush();
  assert.equal(base.el('hs-harvest-period').value,'1985',
    'Historical year selection persists across species');
  base.layers.at(-1).listener({feature:{getProperty:()=> '3-27'},latLng:{}});
  assert(base.popups.at(-1).children.some(x=>String(x.textContent).includes('not separate')));
  base.setSpecies('stone_sheep');await flush();
  assert.equal(base.el('hs-harvest-period').value,'1985');
  base.layers.at(-1).listener({feature:{getProperty:()=> '7-50'},latLng:{}});
  assert(!base.popups.at(-1).children.some(x=>String(x.textContent).includes('Stone Sheep mean')),
    'Modern inspected ram ages must not appear beside 1985 harvest');
  base.el('hs-harvest-period').value='average';base.el('hs-harvest-period').change();
  base.layers.at(-1).listener({feature:{getProperty:()=> '7-50'},latLng:{}});
  assert(base.popups.at(-1).children.some(x=>String(x.textContent).includes('Stone Sheep mean')),
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
  assert(base.el('hs-harvest-detail').textContent.includes('No comparable'));
  base.setProvince('ab');
  assert.equal(base.api.isEnabled(),false);
  assert.equal(base.el('hs-harvest-panel').hidden,true);
  const queued=setup({defer:true});queued.el('hs-harvest-toggle').click();await flush();
  queued.el('hs-harvest-toggle').click();queued.release();await flush();
  assert.equal(queued.layers.length,0,'cancelled boundary request must not paint');
  const broken=setup({fail:true});broken.el('hs-harvest-toggle').click();await flush();
  assert.equal(broken.distribution,true,'failed WMU geometry returns to distribution');
  console.log('Official 1976–2024 history, missing 1985 deer, 1989 deer, 1985 elk, parent subspecies, five-year view, cancellations, no-data and AB passed.');
})().catch(e=>{console.error(e);process.exitCode=1});