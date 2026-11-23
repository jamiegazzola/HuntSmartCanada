import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import shp from 'shpjs';
const run=promisify(execFile);
const root=path.join('site','species-map','data');
const sourceRoot='https://a100.gov.bc.ca/pub/acat/documents/r40140/';
const archive={
  mule:['BAPID_6352_M_ODHE_HE_POLY_1988_1391733247116_1732534014.zip','deer',1988],
  blacktail:['BAPID_6351_M_ODHE_SI_POLY_1988_1391733203021_1732534014.zip','deer',1988],
  whitetail:['BAPID_6355_M_ODVI_POLY_1990_1391733353873_1732534014.zip','whitetail',1990],
  elk:['BAPID_6346_M_CECA_NE_POLY_1990_1391732986878_1732534014.zip','elk',1990],
  roosevelt:['BAPID_6347_M_CECA_RO_POLY_1990_1391733020039_1732534014.zip','elk',1990],
  moose:['BAPID_6345_M_ALAM_POLY_1990_1391732955419_1732534014.zip','moose',1990],
  goat:['Bapid_6380_M_ORAM_POLY_1990_1391797364512_1796329109.zip','goat',1990],
  stone:['Bapid_6384_M_OVDA_ST_POLY_1988_1391797729746_1796329109.zip','sheep',1988],
  dall:['Bapid_6385_M_OVDA_DA_POLY_1988_1391797828526_1796329109.zip','sheep',1988],
  rocky:['Bapid_6386_M_OVCA_CN_POLY_1988_1391797871812_1796329109.zip','sheep',1988],
  california:['Bapid_6387_M_OVCA_CA_POLY_1988_1391797916399_1796329109.zip','sheep',1988],
  caribou:['BAPID_6360_M_RATA_POLY_1990_1391796701810_1796329109.zip','caribou',1990],
};
const expected={
 deer:['1 DEER PER 2-200 SQ KM','1 DEER PER 0.2-2 SQ KM','OVER 1 DEER PER 0.2 SQ KM'],
 whitetail:['1 DEER PER 5-518 SQ KILOMETRES','1 DEER PER 0.5-5 SQ KILOMETRES','OVER 1 DEER PER 0.5 SQ KILOMETRES'],
 elk:['1 ELK PER 10-250 SQ KM','1 ELK PER 2.5-10 SQ KM','OVER 1 ELK PER 2.5 SQ KM'],
 moose:['1 MOOSE PER 10-260 SQ KM','1 MOOSE PER 1.3-10 SQ KM','OVER 1 MOOSE PER 1.3 SQ KM'],
 goat:['1 GOAT PER 13-260 SQ KILOMETRES','1 GOAT PER 3-13 SQ KILOMETRES','OVER 1 GOAT PER 3 SQ KILOMETRES'],
 sheep:['1 SHEEP PER 5-250 SQ KILOMETRES','1 SHEEP PER 1.3-5 SQ KILOMETRES','OVER 1 SHEEP PER 1.3 SQ KILOMETRES'],
 caribou:['1 CARIBOU PER 25-250 SQ KM','1 CARIBOU PER 3.4-25 SQ KM','OVER 1 CARIBOU PER 3.4 SQ KM'],
};
const groups={mule_deer:['mule','blacktail'],white_tailed_deer:['whitetail'],elk:['elk'],roosevelt_elk:['roosevelt'],moose:['moose'],mountain_goat:['goat'],wild_sheep:['stone','dall','rocky','california'],caribou:['caribou']};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const norm=s=>String(s||'').trim().toUpperCase().replace(/\bONE\b/g,'1').replace(/\bSQ\.?\s*(KILOMETRES|KILOMETERS|KM)\.?/g,'SQ KM').replace(/\s+/g,' ');
const classes=['L','M','H'];
function validGeometry(g){
 if(!['Polygon','MultiPolygon'].includes(g?.type))return false;
 const polys=g.type==='Polygon'?[g.coordinates]:g.coordinates;
 return polys.length>0&&polys.every(p=>p.length>0&&p.every(r=>r.length>=4&&r.every(pt=>Number.isFinite(pt[0])&&Number.isFinite(pt[1])&&pt[0]>=-140&&pt[0]<=-113&&pt[1]>=47&&pt[1]<=61)));
}
// Preserve original topology; round only if each ring retains at least 3 unique vertices.
function compact(g){
 const ring=r=>{
   const rounded=r.map(pt=>pt.slice(0,2).map(v=>Math.round(v*100000)/100000));
   return new Set(rounded.map(p=>p.join(','))).size>=3?rounded:r;
 };
 return {type:g.type,coordinates:g.type==='Polygon'?g.coordinates.map(ring):g.coordinates.map(p=>p.map(ring))};
}
async function load(key){
 const [file,type,year]=archive[key],url=sourceRoot+file;
 const {stdout:bytes}=await run('curl',['--fail','--location','--silent','--show-error','--retry','2','--max-time','75',url],{encoding:'buffer',maxBuffer:32*1024*1024});
 const fc=await shp(bytes);
 assert.equal(fc.type,'FeatureCollection',key+' invalid archive');
 const counts={L:0,M:0,H:0}, rejected={}, features=[];
 for(const f of fc.features){
   const cls=String(f.properties?.HSV||'').trim().toUpperCase(),desc=norm(f.properties?.Density_Co);
   const index=classes.indexOf(cls);
   if(index<0||desc!==norm(expected[type][index])){
     const k=JSON.stringify([cls,desc]);rejected[k]=(rejected[k]||0)+1;continue;
   }
   assert(validGeometry(f.geometry),key+' invalid classified geometry');
   counts[cls]++;
   features.push({type:'Feature',properties:{historical_class:cls,taxon:key},geometry:compact(f.geometry)});
 }
 console.log('TEST_SOURCE',key,year,sha(bytes),JSON.stringify(counts),'excluded:',JSON.stringify(rejected));
 assert(features.length>0,key+' has no confirmed abundance polygons');
 return {features,source:{url,year,sha256:sha(bytes),counts,source_features:fc.features.length,excluded:rejected,classification:Object.fromEntries(classes.map((c,i)=>[c,expected[type][i]]))}};
}
fs.mkdirSync(root,{recursive:true});
const loaded={};
const queue=Object.keys(archive);
for(let i=0;i<queue.length;i+=4)await Promise.all(queue.slice(i,i+4).map(async key=>{loaded[key]=await load(key)}));
const manifest={};
for(const [species,keys] of Object.entries(groups)){
 const seen=new Set(),features=[];
 for(const k of keys)for(const f of loaded[k].features){
   const hash=sha(JSON.stringify([f.properties.historical_class,f.geometry]));
   if(seen.has(hash))continue;
   seen.add(hash);features.push(f);
 }
 const counts=Object.fromEntries(classes.map(c=>[c,features.filter(f=>f.properties.historical_class===c).length]));
 assert(Object.values(counts).every(v=>v>0),species+' missing an abundance class');
 const sources=keys.map(k=>loaded[k].source),year=sources[0].year;
 const payload={type:'FeatureCollection',year,sources,counts,features};
 const file='test-distribution-'+species+'.geojson';
 fs.writeFileSync(path.join(root,file),JSON.stringify(payload));
 manifest[species]={file,year,counts,bytes:fs.statSync(path.join(root,file)).size};
 console.log('TEST_GROUP',species,JSON.stringify(manifest[species]));
}
const bear=JSON.parse(fs.readFileSync(path.join(root,'black-bear-historical-1988.geojson'),'utf8'));
assert.equal(bear.features.length,284);
manifest.black_bear={file:'black-bear-historical-1988.geojson',year:1988,counts:{L:101,M:151,H:32},bytes:fs.statSync(path.join(root,'black-bear-historical-1988.geojson')).size};
fs.writeFileSync(path.join(root,'test-distribution-manifest.json'),JSON.stringify(manifest));
assert.equal(Object.keys(manifest).length,9);
