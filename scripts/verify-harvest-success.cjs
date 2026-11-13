'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
function setup({fail=false,defer=false}={}){
  const elements=new Map(),layers=[],popups=[],map={};
  let species='mule_deer',province='bc',distribution=true,release;
  const el=id=>{
    if(!elements.has(id))elements.set(id,{hidden:true,disabled:false,textContent:'',value:'current',
      attributes:{},listeners:{},setAttribute(k,v){this.attributes[k]=v},
      addEventListener(k,fn){this.listeners[k]=fn},click(){return this.listeners.click?.()},
      change(){return this.listeners.change?.()},input(){return this.listeners.input?.()}});
    return elements.get(id);
  };
  class Data{constructor({map}){this.map=map;layers.push(this)}addGeoJson(fc){this.fc=fc}
    addListener(k,fn){this.listener=fn}setStyle(style){this.style=style}setMap(map){this.map=map}}
  const features=Array.from({length:225},(_,i)=>({type:'Feature',
    properties:{wmu_id:i===0?'3-31':'other-'+i},geometry:{type:'Polygon',coordinates:[]}}));
  const sandbox={window:{},document:{getElementById:el,
    createElement(){return {style:{},children:[],appendChild(child){this.children.push(child)}}},head:{appendChild(script){
      const send=()=>{sandbox.BC_WMU_GEOJSON={type:'FeatureCollection',features};
        if(fail)script.onerror();else script.onload()};
      if(defer)release=send;else send();
    }}},google:{maps:{Data,InfoWindow:class{close(){}setContent(c){popups.push(c)}setPosition(){}open(){}}}},console};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../species-map/harvest-success.js'),'utf8'),sandbox);
  let api;
  api=sandbox.window.HUNTSMART_HARVEST_SUCCESS.attach({
    getMap:()=>map,getProvince:()=>province,getSpecies:()=>species,getOpacity:()=>0.85,
    onModeChange(){distribution=!api.isEnabled();api.sync()}
  });
  api.sync();
  return {el,api,layers,popups,map,get distribution(){return distribution},
    setSpecies(v){species=v;api.sync()},setProvince(v){province=v;api.sync()},
    release(){assert(release);release()}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
async function main(){
  const t=setup();
  assert.equal(t.el('hs-harvest-toggle').textContent,'Show Hunter Success');
  t.el('hs-harvest-toggle').click();await flush();
  assert.equal(t.api.isEnabled(),true);
  assert.equal(t.distribution,false);
  assert.equal(t.el('hs-harvest-toggle').textContent,'Show Distribution');
  assert.equal(t.el('hs-harvest-legend').hidden,false);
  assert.equal(t.layers.at(-1).fc.features.length,225);
  assert(t.layers.at(-1).style({getProperty:()=> '3-31'}).fillOpacity>.5,'WMU fills readable');
  t.layers.at(-1).listener({feature:{getProperty:()=> '3-31'},latLng:{}});
  assert.equal(t.popups.length,1,'WMU popup should open on tap');
  const popupChildren=t.popups[0].children;
  const governmentLinks=popupChildren.filter(child=>child.href);
  assert.equal(governmentLinks.length,1,'Exactly one data source link per popup');
  assert.equal(governmentLinks[0].href,'https://catalogue.data.gov.bc.ca/dataset/big-game-harvest-statistics-1976-to-2024');
  assert.equal(governmentLinks[0].textContent,'Data source: Government of BC');
  assert(popupChildren.some(child=>String(child.textContent).includes('not yet independently reconciled')),
    'Provenance disclaimer must be visible');
  t.el('hs-harvest-period').value='average';t.el('hs-harvest-period').change();
  const overlay=t.layers.at(-1);
  t.el('hs-harvest-toggle').click();await flush();
  assert.equal(t.api.isEnabled(),false);assert.equal(t.distribution,true);
  assert.equal(overlay.map,null);
  t.el('hs-harvest-toggle').click();await flush();
  t.setSpecies('moose');
  assert.equal(t.api.isEnabled(),false);
  assert.equal(t.el('hs-harvest-panel').hidden,true);
  assert.equal(t.layers.at(-1).map,null);
  const ab=setup();ab.el('hs-harvest-toggle').click();await flush();
  ab.setProvince('ab');
  assert.equal(ab.api.isEnabled(),false);assert.equal(ab.el('hs-harvest-panel').hidden,true);
  const waiting=setup({defer:true});waiting.el('hs-harvest-toggle').click();
  assert.equal(waiting.distribution,false);
  waiting.el('hs-harvest-toggle').click();
  assert.equal(waiting.distribution,true);
  waiting.release();await flush();
  assert.equal(waiting.layers.length,0,'cancelled load must not add WMU layer');
  const broken=setup({fail:true});broken.el('hs-harvest-toggle').click();await flush();
  assert.equal(broken.distribution,true,'failure must restore species distribution');
  assert.equal(broken.api.isEnabled(),false);
  assert.equal(broken.el('hs-harvest-toggle').textContent,'Show Hunter Success');
  console.log('Hunter success mode switching, readable WMUs, async cancellation, species/AB isolation and failure recovery passed.');
}
main().catch(e=>{console.error(e);process.exitCode=1});