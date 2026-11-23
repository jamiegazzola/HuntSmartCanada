import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import shp from 'shpjs';
// Exact government archive validated by the source audit; no runtime agency requests.
const url='https://a100.gov.bc.ca/pub/acat/documents/r40140/BAPID_6342_M_URAM_POLY_1988_1391732862892_1732534014.zip';
const sha='0d83fd477c29e65b49429fc79b3a80548d186c783f31c514f3425b1ed1d8c121';
const bytes=execFileSync('curl',['--fail','--location','--silent','--show-error','--retry','2','--max-time','60',url],{maxBuffer:16*1024*1024});
assert.equal(createHash('sha256').update(bytes).digest('hex'),sha,'Black bear source changed; review before publication');
const archive=await shp(bytes);
assert.equal(archive.type,'FeatureCollection');
assert.equal(archive.features.length,6040);
const expected={L:'1 BLACK BEAR PER 50-500 SQ. KM',M:'1 BLACK BEAR PER 8-50 SQ. KM',H:'OVER 1 BLACK BEAR PER 8 SQ. KM'};
const counts={L:0,M:0,H:0};
const features=[];
for(const f of archive.features){
  const cls=f.properties?.HSV;
  if(!Object.hasOwn(expected,cls)||f.properties.Density_Co!==expected[cls])continue;
  assert(['Polygon','MultiPolygon'].includes(f.geometry?.type),'Invalid source geometry');
  const polygons=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
  for(const rings of polygons)for(const ring of rings){
    assert(ring.length>=4,'Invalid source ring');
    for(const pt of ring)assert(Number.isFinite(pt[0])&&Number.isFinite(pt[1])&&pt[0]>=-140&&pt[0]<=-113&&pt[1]>=47&&pt[1]<=61,'Invalid geographic coordinate');
  }
  counts[cls]++;
  features.push({type:'Feature',properties:{historical_class:cls},geometry:f.geometry});
}
assert.deepEqual(counts,{L:101,M:151,H:32});
const output={type:'FeatureCollection',source:url,source_sha256:sha,year:1988,classification:expected,features};
const dest=path.join('site','species-map','data','black-bear-historical-1988.geojson');
fs.mkdirSync(path.dirname(dest),{recursive:true});
fs.writeFileSync(dest,JSON.stringify(output));
console.log('Verified 1988 black bear static data:',JSON.stringify(counts),fs.statSync(dest).size,'bytes');
