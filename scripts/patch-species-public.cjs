'use strict';

const fs = require('node:fs');
const path = require('node:path');

const speciesDataPath = path.join('netlify', 'functions', 'species-data.mjs');
let speciesData = fs.readFileSync(speciesDataPath, 'utf8');

const authImport = "import { authorizeSpeciesMap, speciesMapUnauthorized } from '../lib/species-private.mjs'\n";
if (!speciesData.includes(authImport)) throw new Error('Species data auth import patch target is missing');
speciesData = speciesData.replace(authImport, '');

const authBlock = `  const hash = Netlify.env.get('SPECIES_MAP_PASSWORD_HASH')
  if (!hash) return new Response('The private map is not configured.', { status: 503, headers: { 'cache-control': 'no-store' } })
  if (!(await authorizeSpeciesMap(req, hash))) return speciesMapUnauthorized()
`;
if (!speciesData.includes(authBlock)) throw new Error('Species data auth block patch target is missing');
speciesData = speciesData.replace(authBlock, '');
fs.writeFileSync(speciesDataPath, speciesData);

const verifyPath = path.join('scripts', 'verify-private-species.mjs');
let verify = fs.readFileSync(verifyPath, 'utf8');
verify = verify.replace("import { readFile } from 'node:fs/promises';\n", '');
verify = verify.replace("import { createHash } from 'node:crypto';\n", '');
verify = verify.replace("import { authorizeSpeciesMap } from '../netlify/lib/species-private.mjs';\n", '');

const authTestsStart = verify.indexOf("const password = 'test-only-private-map-secret';");
const geometryAnchor = "const geometry = { type:'Polygon', coordinates:[] };";
const geometryStart = verify.indexOf(geometryAnchor);
if (authTestsStart < 0 || geometryStart < 0 || geometryStart <= authTestsStart) throw new Error('Species verification auth-test patch targets are missing');
verify = verify.slice(0, authTestsStart)
  + "const request = kind => new Request(`https://example.test/species-map/api/species-data?kind=${kind}`);\nlet response;\n"
  + verify.slice(geometryStart);

const authenticatedHandlerCall = 'response = await handler(request(auth));';
if (!verify.includes(authenticatedHandlerCall)) throw new Error('Species verification handler-call patch target is missing');
verify = verify.replace(authenticatedHandlerCall, "response = await handler(request('rooseveltEpu'));");

const edgeTestsStart = verify.indexOf('// Load the actual edge handler with the shared authorization helpers injected.');
if (edgeTestsStart < 0) throw new Error('Species verification edge-test patch target is missing');
verify = verify.slice(0, edgeTestsStart)
  + "response = await handler(request('not-a-real-dataset'));\nassert.equal(response.status, 404);\nconsole.log('Public species data endpoint and map regressions passed.');\n";

fs.writeFileSync(verifyPath, verify);
console.log('Patched species map and data endpoint for public access.');
