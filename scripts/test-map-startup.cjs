'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const zlib = require('node:zlib');
async function main() {
  const source = fs.readFileSync('maps.js','utf8');
  const entry = source.slice(source.indexOf('function fullMapInit()'), source.indexOf('// ── Build base Mapbox map'));
  const loader = {style:{display:'flex'}};
  let resized = 0;
  const ctx = {fullMapInitialized:{BC:true}, fullMapProvince:'BC',fullMapInstance:{resize(){resized++;},loaded(){return true;}},document:{getElementById(){return loader;}}};
  vm.createContext(ctx);vm.runInContext(entry,ctx);ctx.fullMapInit();
  assert.equal(resized,1);assert.equal(loader.style.display,'flex'); // Re-entry does not hide an in-progress load.
  // A failed WebGL constructor must remain retryable rather than marked initialized.
  const init = source.slice(source.indexOf('function _fullMapInitBC()'), source.indexOf('// ── AB init'));
  ctx.fullMapInitialized.BC=false;ctx._fullMapBuild=()=>{throw Error('WebGL unavailable');};
  vm.runInContext(init,ctx);assert.throws(()=>ctx._fullMapInitBC());assert.equal(ctx.fullMapInitialized.BC,false);
  // In-flight Alberta requests share one download and can retry after failure.
  const data = fs.readFileSync('data.js','utf8');
  const ab = data.slice(data.indexOf('let abDataPromise'),data.indexOf('async function loadABHarvest'));
  let fetches=0, release;
  const dataCtx={AB_DATA:[],AB_DATA_URL:'/data',_abAllCardsCache:null,fetch:()=>{fetches++;return new Promise(r=>{release=r;});}};
  vm.createContext(dataCtx);vm.runInContext(ab,dataCtx);
  const a=dataCtx.loadABData(),b=dataCtx.loadABData();assert.equal(a,b);assert.equal(fetches,1);
  release({ok:true,json:async()=>[{wmu:'100',huntCode:'1',pctDrawn:10}]});await a;assert.equal(dataCtx.AB_DATA.length,1);
  const manifest=JSON.parse(fs.readFileSync('site/map-tiles/20261128-v5/manifest.json'));
  assert.equal(manifest.bc.featureCount,225);assert.equal(manifest.ab.featureCount,198);
  assert.ok(zlib.gzipSync(JSON.stringify(manifest)).length<350000);
  const redirects=fs.readFileSync('site/_redirects','utf8');
  assert.match(redirects,/^\/map-tiles\/\*\s+\/map-asset-not-found\.txt\s+404\s*\n\/\*\s+\/index\.html\s+200$/m);
  assert.ok(fs.statSync('site/map-asset-not-found.txt').size>0);
  // Validate every deployed data URL resolves to identical records, not a subset.
  const deployed=fs.readFileSync('site/data.js','utf8');
  for(const url of deployed.matchAll(/\/app-data\/([^']+\.json)/g)) {
    const original=url[1].replace(/\.[a-f0-9]{16}\.json$/,'.json');
    assert.deepEqual(JSON.parse(fs.readFileSync('site/app-data/'+url[1])),JSON.parse(fs.readFileSync(original)));
  }
  console.log('PASS: return navigation, WebGL retry, Alberta request deduplication, manifest budget and exact data preservation');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
