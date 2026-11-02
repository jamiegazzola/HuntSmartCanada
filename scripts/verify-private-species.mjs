import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { authorizeSpeciesMap } from '../netlify/lib/species-private.mjs';
import handler, { config as functionConfig, filterHistoricalRoosevelt, matchRecentRoosevelt } from '../netlify/functions/species-data.mjs';

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
for (const kind of ['rooseveltHistorical1990','rooseveltModern']) {
  const unauthenticated = new Request(`https://example.test/species-map/api/species-data?kind=${kind}`);
  const denied = await handler(unauthenticated);
  assert.equal(denied.status, 401, `${kind} must require authentication`);
  assert.match(denied.headers.get('cache-control'), /no-store/);
}
const geometry = { type:'Polygon', coordinates:[] };
const historical = filterHistoricalRoosevelt({ type:'FeatureCollection', features:[
  { type:'Feature', geometry, properties:{ HSV:'M', Density_Co:'1 ELK PER 2.5-10 SQ KM' } },
  { type:'Feature', geometry, properties:{ HSV:'M', Density_Co:'NOT PRESENT' } },
  { type:'Feature', geometry, properties:{ HSV:'?', Density_Co:'STATUS UNKNOWN' } },
] });
assert.equal(historical.features.length, 1, 'Contradictory and unknown historical classes must be omitted');
const recent = matchRecentRoosevelt({ features:[
  { type:'Feature', geometry, properties:{ EPU_Unit_Name:'Pitt' } },
  { type:'Feature', geometry, properties:{ EPU_Unit_Name:'Not matched' } },
] }, { features:[
  { attributes:{ EPU:'Pitt', Year:'2019', standard_estimate:50 } },
  { attributes:{ EPU:'Pitt', Year:'2023', model_estimate:60 } },
  { attributes:{ EPU:'Pitt', Year:'2024', model_estimate:70 } },
  { attributes:{ EPU:'Not matched', Year:'2023', standard_estimate:0 } },
] });
assert.equal(recent.features.length, 1);
assert.equal(recent.features[0].properties.survey_year, 2023);
assert.throws(() => matchRecentRoosevelt({ features:[] }, { features:[], exceededTransferLimit:true }));
assert.throws(() => matchRecentRoosevelt({ features:[{ geometry, properties:{ EPU_Unit_Name:'Pitt' } }] }, { features:[
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
