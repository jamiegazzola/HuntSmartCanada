import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { authorizeSpeciesMap } from '../netlify/lib/species-private.mjs';
import handler, { config as functionConfig, filterHistoricalRoosevelt, matchRecentRoosevelt, filterSeasonalCaribou, filterHistoricalSpecies } from '../netlify/functions/species-data.mjs';

const password = 'test-only-private-map-secret';
const hash = createHash('sha256').update(password).digest('hex');
const auth = 'Basic ' + btoa(`jamie:${password}`);
const request = header => new Request('https://example.test/species-map/api/species-data?kind=rooseveltEpu', { headers: header ? { authorization: header } : {} });
assert.equal(await authorizeSpeciesMap(request(auth), hash), true);
for (const header of [null, 'Basic !!!', 'Bearer value', 'Basic ' + btoa('other:' + password), 'Basic ' + btoa('jamie:wrong')]) {
  assert.equal(await authorizeSpeciesMap(request(header), hash), false);
}
assert.equal(await authorizeSpeciesMap(request(auth), ''), false);
assert.equal(functionConfig.path, '/species-map/api/species-data');
globalThis.Netlify = { env: { get: () => hash } };
let response = await handler(request(null));
assert.equal(response.status, 401);
assert.match(response.headers.get('www-authenticate'), /^Basic/);
assert.match(response.headers.get('cache-control'), /no-store/);
for (const kind of ['rooseveltHistorical1990','rooseveltModern','caribouSummer','caribouWinter','caribouHistorical1990','rockyElkHistorical1990','historicalSpecies&taxon=stone']) {
  const unauthenticated = new Request(`https://example.test/species-map/api/species-data?kind=${kind}`);
  const denied = await handler(unauthenticated);
  assert.equal(denied.status, 401, `${kind} must require authentication`);
  assert.match(denied.headers.get('cache-control'), /no-store/);
}
const geometry = { type:'Polygon', coordinates:[] };
assert.equal(filterHistoricalSpecies({type:'FeatureCollection',features:[
  {type:'Feature',geometry,properties:{HSV:'M',Density_Co:'ONE SHEEP PER 1.3-5 SQ. KILOMETRES'}},
  {type:'Feature',geometry,properties:{HSV:'M',Density_Co:'NOT PRESENT'}},
]}, 'sheep').features.length, 1);
const seasonal = filterSeasonalCaribou({ type:'FeatureCollection', features:[
  {type:'Feature', geometry:{type:'Polygon',coordinates:[[[0,0],[1,0],[1,1],[0,0]]]}, properties:{Herd:'Graham',Quality:'High'}},
  {type:'Feature', geometry, properties:{Herd:'Narraway',Quality:'Migration Route'}},
] }, 'summer');
assert.equal(seasonal.features.length, 1);
assert.equal(seasonal.features[0].properties.herd, 'Graham');
assert.equal(seasonal.source_year, 2017);
const historical = filterHistoricalRoosevelt({ type:'FeatureCollection', features:[
  { type:'Feature', geometry, properties:{ HSV:'M', Density_Co:'1 ELK PER 2.5-10 SQ KM' } },
  { type:'Feature', geometry, properties:{ HSV:'M', Density_Co:'NOT PRESENT' } },
  { type:'Feature', geometry, properties:{ HSV:'?', Density_Co:'STATUS UNKNOWN' } },
] });
assert.equal(historical.features.length, 1, 'Contradictory and unknown historical classes must be omitted');
const recent = matchRecentRoosevelt({ features:[
  { type:'Feature', geometry, properties:{ EPU_Unit_Name:'Pitt', EPU_LAND_km2:100 } },
  { type:'Feature', geometry, properties:{ EPU_Unit_Name:'Coast', EPU_LAND_km2:100 } },
  { type:'Feature', geometry, properties:{ EPU_Unit_Name:'Valley', EPU_LAND_km2:100 } },
  { type:'Feature', geometry, properties:{ EPU_Unit_Name:'Range', EPU_LAND_km2:100 } },
  { type:'Feature', geometry, properties:{ EPU_Unit_Name:'Not matched', EPU_LAND_km2:100 } },
] }, { features:[
  { attributes:{ EPU:'Pitt', Year:'2019', standard_estimate:5 } },
  { attributes:{ EPU:'Pitt', Year:'2023', model_estimate:10 } },
  { attributes:{ EPU:'Pitt', Year:'2024', model_estimate:70 } },
  { attributes:{ EPU:'Coast', Year:'2023', standard_estimate:20 } },
  { attributes:{ EPU:'Valley', Year:'2023', standard_estimate:30 } },
  { attributes:{ EPU:'Range', Year:'2023', standard_estimate:40 } },
  { attributes:{ EPU:'Not matched', Year:'2023', standard_estimate:0 } },
] });
assert.equal(recent.features.length, 4);
assert.equal(recent.density_scale, 'relative_quartile');
assert.deepEqual(recent.density_cuts, [0.1, 0.2, 0.3]);
const pitt = recent.features.find(feature => feature.properties.unit === 'Pitt');
assert.equal(pitt.properties.survey_year, 2023);
assert.equal(pitt.properties.estimate, 10);
assert.equal(pitt.properties.estimate_source, 'model');
assert.equal(pitt.properties.density_per_km2, 0.1);
assert.deepEqual(recent.features.map(feature => feature.properties.heat_class), [1, 2, 3, 4]);
assert.throws(() => matchRecentRoosevelt({ features:[] }, { features:[], exceededTransferLimit:true }));
assert.throws(() => matchRecentRoosevelt({ features:[{ geometry, properties:{ EPU_Unit_Name:'Pitt', EPU_LAND_km2:100 } }] }, { features:[
  { attributes:{ EPU:'Pitt', Year:'2023', standard_estimate:10 } },
  { attributes:{ EPU:'P-i-t-t', Year:'2023', standard_estimate:10 } },
] }), 'Ambiguous normalized names must not be joined');
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => ({ ok: true, json: async () => ({ type: 'FeatureCollection', features: [
  { type: 'Feature', properties: { POP_Est_2012: 50, EPU_LAND_km2: 100 }, geometry: null },
  { type: 'Feature', properties: { POP_Est_2012: null, EPU_LAND_km2: 100 }, geometry: null },
  { type: 'Feature', properties: { POP_Est_2012: '', EPU_LAND_km2: 100 }, geometry: null },
  { type: 'Feature', properties: { POP_Est_2012: 0, EPU_LAND_km2: 100 }, geometry: null },
] }) });
response = await handler(request(auth));
assert.equal(response.status, 200);
assert.match(response.headers.get('cache-control'), /no-store/);
const densities = (await response.json()).features.map(feature => feature.properties.__density);
assert.deepEqual(densities, [.5, null, null, 0]);
globalThis.fetch = originalFetch;

// Load the actual edge handler with the shared authorization helpers injected.
let source = await readFile('netlify/edge-functions/species-auth.js', 'utf8');
source = source.replace("import { authorizeSpeciesMap, speciesMapUnauthorized } from '../lib/species-private.mjs';", "const { authorizeSpeciesMap, speciesMapUnauthorized } = globalThis.__speciesAuth;");
globalThis.__speciesAuth = await import('../netlify/lib/species-private.mjs');
const edge = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
assert.deepEqual(edge.config.path, ['/species-map', '/species-map/*', '/.netlify/functions/species-data']);
assert.equal(edge.config.onError, 'fail');
let calls = 0;
const context = { next: async () => { calls += 1; return new Response('ok', { headers: { 'cache-control': 'public, max-age=3600' } }); } };
response = await edge.default(request(null), context);
assert.equal(response.status, 401);
assert.equal(calls, 0);
response = await edge.default(request(auth), context);
assert.equal(response.status, 200);
assert.equal(calls, 1);
assert.match(response.headers.get('cache-control'), /no-store/);
globalThis.Netlify.env.get = () => undefined;
response = await edge.default(request(auth), context);
assert.equal(response.status, 503);
console.log('Private map authentication, fail-closed behavior and no-store headers passed.');
