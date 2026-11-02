'use strict';
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const handlers = {};
const deleted = [];
const self = { location: { origin:'https://huntsmartcanada.ca' }, addEventListener:(type, fn) => { handlers[type] = fn; }, clients:{claim:async()=>{}}, skipWaiting(){} };
const caches = { keys:async()=>['huntsmart-offline-lite-v80','huntsmart-offline-lite-v81','other-cache'], delete:async key=>deleted.push(key), open:async()=>({match:async()=>({})}) };
vm.runInNewContext(fs.readFileSync('hs-offline-lite-sw.js','utf8'), { self, caches, URL });
for (const pathname of ['/species-map','/species-map/','/species-map/data/kmz-elk-modern.png','/species-map/api/species-data?kind=x','/.netlify/functions/species-data?kind=x']) {
  let intercepted = false;
  handlers.fetch({request:{method:'GET',url:`https://huntsmartcanada.ca${pathname}`,mode:'navigate',destination:'image'},respondWith(){intercepted=true;}});
  assert.equal(intercepted,false,`${pathname} must go to server auth`);
}
let intercepted = false;
handlers.fetch({request:{method:'GET',url:'https://huntsmartcanada.ca/images/logo.png',destination:'image'},respondWith(){intercepted=true;}});
assert(intercepted,'Normal app images should still use the service worker');
let active;
handlers.activate({waitUntil(promise){active=promise;}});
active.then(()=>{assert.deepEqual(deleted,['huntsmart-offline-lite-v80']);console.log('Private paths bypass cache and old app cache is removed.');}).catch(error=>{console.error(error);process.exitCode=1;});
