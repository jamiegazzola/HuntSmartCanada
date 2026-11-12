'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { createHash } = require('node:crypto');

function setup({ failMainland = false, syntheticRaster = false, failOnce = '', delayedAsset = '', savedSpecies = '' } = {}) {
  const elements = new Map(), layers = [], overlays = [];
  const fetchCounts = new Map();
  let releaseDelayed;
  const delay = new Promise(resolve => { releaseDelayed = resolve; });
  let context, lastImage;
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      value: '', hidden: true, textContent: '', children: [], attributes: {},
      classList: { toggle() {}, add() {}, remove() {} },
      setAttribute(name, value) { this.attributes[name] = value; }, appendChild(child) { this.children.push(child); },
      addEventListener(name, callback) { this[name] = callback; },
    });
    return elements.get(id);
  }
  const root = path.resolve('species-map');
  const document = {
    getElementById: element, querySelector: () => element('control'),
    createElement(tag) {
      if (tag !== 'canvas') return {};
      return { getContext: () => ({
        createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
        putImageData(image) { lastImage = image; },
      }), toDataURL: () => 'data:image/png;base64,AA==' };
    },
    head: { appendChild(script) {
      if (!script.src.startsWith('data/')) return;
      if (syntheticRaster) {
        context.SPECIES_DATA = { mule_deer: Array.from({ length: 123 }, (_, i) => `${i % 5}78`).join(',') };
      } else {
        vm.runInContext(fs.readFileSync(path.join(root, script.src.split('?')[0]), 'utf8'), context);
      }
      script.onload();
    } },
  };
  class Data {
    constructor() { layers.push(this); }
    addGeoJson(collection) { this.collection = collection; }
    setStyle(style) { this.style = style; }
    setMap(map) { this.map = map; }
  }
  class GroundOverlay {
    constructor(url, bounds, options) { this.map = options.map; this.url = url; overlays.push(this); }
    setMap(map) { this.map = map; }
    setOpacity(value) { this.opacity = value; }
  }
  let mapStub;
  class MapStub {
    constructor() { this.zoom = 5; this.listeners = {}; mapStub = this; }
    fitBounds() {} addListener(name, fn) { this.listeners[name] = fn; }
    getCenter() { return null; } getZoom() { return this.zoom; }
  }
  const google = { maps: { Data, GroundOverlay, Map: MapStub, LatLngBounds: class {}, MapTypeId: { HYBRID: 'hybrid' } } };
  const storage = { 'bc-species-map-v2': savedSpecies };
  const localStorage = { getItem: (key) => storage[key] || null, setItem: (key, value) => { storage[key] = value; } };
  const fetch = async (url, options = {}) => {
    fetchCounts.set(url, (fetchCounts.get(url) || 0) + 1);
    if (url.includes(failOnce) && failOnce) { failOnce = ''; return { ok: false }; }
    if (delayedAsset && url.includes(delayedAsset)) {
      await delay;
      if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    }
    if (url.includes('alberta-boreal-caribou')) {
      return { ok: true, json: async () => ({ type:'FeatureCollection', features:[{ type:'Feature',properties:{CODE:'AB1',HERD:'Chinchaga'},geometry:{type:'Polygon',coordinates:[[[-119,57],[-118,57],[-118,58],[-119,57]]]}}] }) };
    }
    if (url.includes('rooseveltEpu')) {
      if (failMainland) return { ok: false };
      return { ok: true, json: async () => ({ type: 'FeatureCollection', densityField: '__density', features: [{ type: 'Feature', properties: { __density: 1 }, geometry: null }] }) };
    }
    if (url.includes('rooseveltHistorical1990')) {
      return { ok:true, json:async () => ({ type:'FeatureCollection', year:1990, features:[{type:'Feature',properties:{historical_class:'M'},geometry:null}] }) };
    }
    if (url.includes('caribouSummer') || url.includes('caribouWinter')) {
      return { ok:true, json:async () => ({ type:'FeatureCollection', features:[{type:'Feature',properties:{herd:'Graham',quality:'High'},geometry:null}] }) };
    }
    if (url.includes('kind=historicalSpecies')) {
      return { ok:true, json:async () => ({ type:'FeatureCollection', year:1988, features:[{type:'Feature',properties:{historical_class:'L'},geometry:null}] }) };
    }
    if (url.includes('caribouHistorical1990')) {
      return { ok:true, json:async () => ({ type:'FeatureCollection', year:1990, features:[{type:'Feature',properties:{historical_class:'M'},geometry:null}] }) };
    }
    if (url.includes('rockyElkHistorical1990')) {
      return { ok:true, json:async () => ({ type:'FeatureCollection', year:1990, features:[{type:'Feature',properties:{historical_class:'L'},geometry:null}] }) };
    }
    if (url.includes('rooseveltModern')) {
      return { ok:true, json:async () => ({ type:'FeatureCollection', features:[{type:'Feature',properties:{unit:'Pitt',survey_year:2023},geometry:null}] }) };
    }
    const body = fs.readFileSync(path.join(root, url.split('?')[0]), 'utf8');
    return { ok: true, json: async () => JSON.parse(body) };
  };
  context = vm.createContext({ document, localStorage, google, fetch, AbortController, DOMException, console, setTimeout: () => 0, clearTimeout, Uint8ClampedArray });
  context.window = context;
  context.shp = async (bytes) => {
    assert(bytes.byteLength >= 100, 'Browser parser receives local file bytes');
    return {type:'FeatureCollection',features:[{
      type:'Feature',properties:{ZONE:'Core'},geometry:{
        type:'Polygon',coordinates:[[[-117,52],[-116,52],[-116,53],[-117,52]]]
      }
    }]};
  };
  vm.runInContext(fs.readFileSync(path.join(root, 'species-catalog.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'alberta-species.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'alberta-local.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), context);
  context.initSpeciesMap();
  return { element, layers, overlays, fetchCounts, releaseDelayed, getLastImage: () => lastImage, getMap: () => mapStub };
}

async function select(env, key) { env.element('species').value = key; await env.element('species').change(); }
async function run() {
  const manifest = JSON.parse(fs.readFileSync('species-map/data/sources.json', 'utf8'));
  const summerModels = ['mule_deer','white_tailed_deer','nw_whitetail_kootenay','dakota_whitetail_peace','elk','roosevelt_elk','rocky_elk_kootenay','moose','northwestern_moose_ne','alaskan_moose_nw','shiras_moose_flathead','stone_sheep','caribou_mountain'];
  for (const key of summerModels) {
    const filename = `summer-habitat-${key}.png`;
    const bytes = fs.readFileSync(path.join('species-map/data', filename));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), manifest[filename].output_sha256, `${filename} must match its source manifest`);
    assert(manifest[filename].source_pixels > 100, `${filename} must contain mapped habitat`);
  }
  const grizzly2012 = JSON.parse(fs.readFileSync('species-map/data/grizzly-2012.geojson', 'utf8'));
  assert.equal(createHash('sha256').update(fs.readFileSync('species-map/data/grizzly-2012.geojson')).digest('hex'), manifest['grizzly-2012.geojson'].output_sha256);
  assert.equal(grizzly2012.features.length, 219);
  assert(grizzly2012.features.every(f => Number.isFinite(f.properties.density_2012)));
  for (const key of ['mule_deer', 'white_tailed_deer', 'elk', 'moose', 'mountain_goat']) {
    const filename = `winter-${key}.png`;
    const bytes = fs.readFileSync(path.join('species-map/data', filename));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), manifest[filename].output_sha256, `${filename} does not match its source record`);
    const harvestFile = `harvest-context-${key}.geojson`;
    const harvestBytes = fs.readFileSync(path.join('species-map/data', harvestFile));
    assert.equal(createHash('sha256').update(harvestBytes).digest('hex'), manifest[harvestFile].output_sha256);
    const harvest = JSON.parse(harvestBytes);
    assert(harvest.features.length > 90, `${key}: expected province-wide reported harvest context`);
    assert(harvest.features.every(f => f.properties.reported_harvest_years.every(y => y >= 2020 && y <= 2024)));
  }
  assert(!manifest['winter-elk.png'].candidate_approved_orders.includes('U-7-002'));
  assert(!manifest['winter-elk.png'].candidate_approved_orders.includes('U-1-010'));
  assert(!manifest['winter-moose.png'].candidate_approved_orders.includes('U-7-011'));
  const columbianFile = 'winter-columbian-blacktail-island.png';
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join('species-map/data', columbianFile))).digest('hex'), manifest[columbianFile].output_sha256);
  for (const filename of ['winter-sitka-blacktail.png','sitka-blacktail-haida.geojson']) assert.equal(createHash('sha256').update(fs.readFileSync(path.join('species-map/data', filename))).digest('hex'), manifest[filename].output_sha256);
  assert.equal(createHash('sha256').update(fs.readFileSync('species-map/data/winter-rocky-elk-kootenay.png')).digest('hex'), manifest['winter-rocky-elk-kootenay.png'].output_sha256);
  assert.equal(createHash('sha256').update(fs.readFileSync('species-map/data/winter-northwestern-moose-ne.png')).digest('hex'), manifest['winter-northwestern-moose-ne.png'].output_sha256);
  assert.equal(createHash('sha256').update(fs.readFileSync('species-map/data/winter-nw-whitetail-kootenay.png')).digest('hex'), manifest['winter-nw-whitetail-kootenay.png'].output_sha256);
  assert.equal(createHash('sha256').update(fs.readFileSync('species-map/data/dakota-whitetail-peace-context.geojson')).digest('hex'), manifest['dakota-whitetail-peace-context.geojson'].output_sha256);
  for (const key of ['alaskan_moose_nw','shiras_moose_flathead']) {
    const filename = `${key}-harvest-context.geojson`;
    assert.equal(createHash('sha256').update(fs.readFileSync(path.join('species-map/data',filename))).digest('hex'), manifest[filename].output_sha256);
  }
  assert.equal(createHash('sha256').update(fs.readFileSync('species-map/data/dall-tatshenshini-context.geojson')).digest('hex'), manifest['dall-tatshenshini-context.geojson'].output_sha256);
  assert.equal(createHash('sha256').update(fs.readFileSync('species-map/data/hay-river-bison-context.geojson')).digest('hex'), manifest['hay-river-bison-context.geojson'].output_sha256);
  assert.equal(createHash('sha256').update(fs.readFileSync('species-map/data/burnt-pine-context.geojson')).digest('hex'), manifest['burnt-pine-context.geojson'].output_sha256);
  for (const filename of ['stone-sheep-winter-range.geojson', 'harvest-gap-white_tailed_deer.geojson', 'dakota-whitetail-peace-context.geojson']) {
    assert.equal(createHash('sha256').update(fs.readFileSync(path.join('species-map/data', filename))).digest('hex'), manifest[filename].output_sha256);
    assert.equal(manifest[filename].coordinate_compaction.vertices_removed, 0);
  }
  const overviewFile = 'stone-sheep-winter-range-overview.geojson';
  const overview = JSON.parse(fs.readFileSync(path.join('species-map/data', overviewFile)));
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join('species-map/data', overviewFile))).digest('hex'), manifest[overviewFile].output_sha256);
  assert.equal(overview.features.length, 52);
  assert(manifest[overviewFile].vertices_after < manifest[overviewFile].vertices_before / 2);
  assert.equal(createHash('sha256').update(fs.readFileSync('species-map/data/moose-724-survey-context.geojson')).digest('hex'), manifest['moose-724-survey-context.geojson'].output_sha256);
  assert.equal(createHash('sha256').update(fs.readFileSync('species-map/data/moose-revelstoke-2025-context.geojson')).digest('hex'), manifest['moose-revelstoke-2025-context.geojson'].output_sha256);
  assert.equal(createHash('sha256').update(fs.readFileSync('species-map/data/roosevelt-island-range-context.geojson')).digest('hex'), manifest['roosevelt-island-range-context.geojson'].output_sha256);
  const herds = JSON.parse(fs.readFileSync('species-map/data/caribou-herds.geojson', 'utf8'));
  assert.equal(createHash('sha256').update(fs.readFileSync('species-map/data/caribou-herds.geojson')).digest('hex'), manifest['caribou-herds.geojson'].output_sha256);
  for (const name of ['George Mountain','Columbia South','Monashee','Burnt Pine']) assert(!herds.features.some(f => f.properties.HERD_NAME === name), `${name} must not appear as an active resident herd`);
  for (const key of ['rocky_bighorn_kootenay','california_bighorn_boundary']) {
    const filename = `winter-${key}.png`;
    assert.equal(createHash('sha256').update(fs.readFileSync(path.join('species-map/data',filename))).digest('hex'), manifest[filename].output_sha256);
  }
  const env = setup();
  await select(env, 'caribou');
  await env.element('era-historical').click();
  assert(env.layers.at(-1).collection.features.length, 'Historical caribou must render the archive');
  assert(env.element('layer-note-text').textContent.includes('1990 caribou'));
  await select(env, 'rocky_elk_kootenay');
  assert(env.layers.at(-1).collection.features.length, 'Historical Rocky Mountain elk must render the archive');
  assert(env.element('layer-note-text').textContent.includes('1990 Rocky Mountain elk'));
  await env.element('era-modern').click();
  const optionKeys = env.element('species').children.map(option => option.value);
  assert(optionKeys.includes('mule_deer') && optionKeys.includes('white_tailed_deer'));
  assert(!optionKeys.includes('columbian_blacktail_island') && !optionKeys.includes('sitka_blacktail'));
  for (const oldSelection of ['columbian_blacktail_island', 'sitka_blacktail']) {
    assert.equal(setup({ savedSpecies: oldSelection }).element('species').value, 'mule_deer', 'Previous black-tail selections must restore the combined mule layer');
  }
  const raster = ['mule_deer', 'white_tailed_deer', 'elk', 'moose', 'mountain_goat'];
  const ranges = ['wild_sheep', 'bighorn_sheep', 'thinhorn_sheep', 'dall_tatshenshini', 'caribou', 'caribou_northern', 'caribou_mountain', 'caribou_boreal', 'grizzly_bear', 'black_bear', 'wood_bison'];
  for (const key of [...raster, ...ranges]) {
    const previousLayers = env.layers.length;
    const previousOverlays = env.overlays.length;
    await select(env, key);
    if (raster.includes(key)) {
      assert(env.layers.length > previousLayers && env.layers.slice(previousLayers).some(d => d.collection.features.length), `${key} did not render modern evidence`);
      assert.equal(env.overlays.filter(o => o.map).length, 0, `${key} must not show winter habitat in Modern`);
      if (key === 'mule_deer') {
        assert(env.layers.at(-1).collection.features.some(f => f.properties.description === 'Haida Gwaii broad range context'));
        assert(env.element('layer-note-text').textContent.includes('not local density'));
        assert.equal(env.element('mule-source').hidden, false);
      }
      if (key === 'white_tailed_deer') {
        assert.equal(env.element('mule-source').hidden, true);
        assert(env.layers.filter(d => d.collection.features.some(f => f.properties.description === 'Haida Gwaii broad range context')).every(d => d.map === null));
      }
      if (key === 'moose') {
        const survey = env.layers.at(-1).collection.features[0].properties;
        assert.equal(survey.wmu, '7-24');
        assert.equal(survey.estimated_density_per_km2, 0.55);
        assert(env.layers.at(-1).collection.features.some(f => f.properties.year === 2025 && f.properties.estimate === 550));
        assert.equal(env.element('moose-survey-link').hidden, false);
        assert.equal(env.element('revelstoke-survey-link').hidden, false);
        assert(env.element('layer-note-text').textContent.includes('not the exact survey boundary'));
      } else {
        assert.equal(env.element('moose-survey-link').hidden, true);
      }
    } else {
      assert.equal(env.layers.length, previousLayers + (['wood_bison','caribou','caribou_northern'].includes(key) ? 2 : 1), `${key} did not create its layers`);
      assert(env.layers[previousLayers].collection.features.length, `${key} has no features`);
      if (key === 'caribou_northern') {
        const names = env.layers[previousLayers].collection.features.map(f => f.properties.HERD_NAME);
        for (const name of ['Graham','Chase','Narraway','Redrock-Prairie Creek']) assert(names.includes(name), `${name} must be included in Northern ecotype`);
        assert(!names.includes('Columbia North'));
      }
      if (key === 'caribou_mountain') {
        const names = env.layers[previousLayers].collection.features.map(f => f.properties.HERD_NAME);
        assert(names.includes('Columbia North'));
        assert(!names.includes('Graham') && !names.includes('Narraway'));
      }
      if (key === 'wood_bison') {
        assert(env.layers.at(-1).collection.features[0].geometry.type.includes('LineString'));
        assert(env.element('layer-note-text').textContent.includes('not a bison range'));
      }
      if (key === 'caribou' || key === 'caribou_northern') {
        assert.equal(env.layers.at(-1).collection.features[0].properties.herd, 'Burnt Pine');
        assert(env.element('layer-note-text').textContent.includes('not a current occupancy boundary'));
        const style = env.layers[previousLayers].style({ getProperty: name => name === 'HERD_NAME' ? 'Narrow Lake' : undefined });
        assert.equal(style.fillOpacity, 0, 'Very small herds must not render as an ordinary filled range');
      }
    }
  }
  const caribouUrl = 'data/caribou-herds.geojson?v=1';
  assert.equal(env.fetchCounts.get(caribouUrl), 1, 'Related caribou selections should reuse the loaded data');
  await select(env, 'caribou');
  assert.equal(env.fetchCounts.get(caribouUrl), 1, 'Returning to a species should not redownload its data');
  const mooseGapUrl = 'data/harvest-context-moose.geojson?v=1';
  await select(env, 'moose');
  assert.equal(env.fetchCounts.get(mooseGapUrl), 1, 'Returning to moose should reuse harvest evidence');
  const retry = setup({ failOnce: 'grizzly-2018.geojson' });
  await select(retry, 'grizzly_bear');
  assert(retry.element('layer-note-text').textContent.includes('could not be loaded'), 'A failed primary layer must leave a visible explanation');
  await select(retry, 'grizzly_bear');
  assert.equal(retry.fetchCounts.get('data/grizzly-2018.geojson?v=1'), 2, 'Failed downloads must be retried');
  assert(retry.layers.at(-1).collection.features.length, 'Retry should render the layer');
  assert(!retry.element('layer-note-text').textContent.includes('could not be loaded'));
  const race = setup({ delayedAsset: 'grizzly-2018.geojson' });
  const pending = select(race, 'grizzly_bear');
  await select(race, 'caribou_northern');
  race.releaseDelayed();
  await pending;
  assert.equal(race.element('species').value, 'caribou_northern');
  assert(race.layers.some(layer => layer.collection?.features.some(f => f.properties?.HERD_NAME === 'Graham')), 'Northern ecotype includes Graham despite the legacy source category');
  assert(!race.layers.some(layer => layer.map && layer.collection?.features.some(f => f.properties?.density_2018 !== undefined)), 'A stale download must not replace the selected layer');
  const partialStone = setup();
  await select(partialStone, 'stone_sheep');
  assert(partialStone.layers.some(layer => layer.collection?.features.some(f => f.properties?.SPECIES_CODE === 'M-OVDA')));
  await partialStone.element('era-winter').click();
  assert(partialStone.layers.some(layer => layer.map !== null && layer.collection?.features.length === 52), 'Winter Stone habitat must render');
  partialStone.getMap().zoom = 9;
  partialStone.getMap().listeners.idle();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(partialStone.fetchCounts.get('data/stone-sheep-winter-range.geojson?v=2'), 1);
  await partialStone.element('era-historical').click();
  const layersInHistory = partialStone.layers.length;
  partialStone.getMap().zoom = 8;
  partialStone.getMap().listeners.idle();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(partialStone.layers.length, layersInHistory);
  const overviewFail = setup({ failOnce: 'stone-sheep-winter-range-overview.geojson' });
  await select(overviewFail, 'stone_sheep');
  await overviewFail.element('era-winter').click();
  assert.equal(overviewFail.fetchCounts.get('data/stone-sheep-winter-range.geojson?v=2'), 1);
  await select(env, 'dall_tatshenshini');
  assert(env.element('layer-note-text').textContent.includes('not a Dall-specific boundary'));
  const beforeStone = env.layers.length;
  await select(env, 'stone_sheep');
  assert.equal(env.layers.length, beforeStone + 1, 'Modern Stone context must render');
  assert(env.layers.at(-1).collection.features.every(f => f.properties.SPECIES_CODE === 'M-OVDA'));
  await env.element('era-winter').click();
  const stoneWinter = env.layers.at(-1).collection.features;
  assert.equal(stoneWinter.length, 52);
  assert.equal(stoneWinter.filter(f => f.properties.order === 'u-7-028').length, 11);
  assert.equal(stoneWinter.filter(f => f.properties.order === 'u-9-004').length, 21);
  assert.equal(stoneWinter.filter(f => f.properties.order === 'u-9-005').length, 10);
  assert(stoneWinter.every(f => !f.properties.unit.startsWith('SA')), 'Disease buffers are not winter habitat');
  assert(env.element('layer-note-text').textContent.includes('incomplete'));
  await select(env, 'rocky_elk_kootenay');
  assert(env.overlays.at(-1).url.includes('winter-rocky-elk-kootenay.png'));
  assert(env.element('layer-note-text').textContent.includes('Incomplete'));
  await select(env, 'northwestern_moose_ne');
  assert(env.overlays.at(-1).url.includes('winter-northwestern-moose-ne.png'));
  assert(env.element('layer-note-text').textContent.includes('Incomplete'));
  await select(env, 'nw_whitetail_kootenay');
  assert(env.overlays.at(-1).url.includes('winter-nw-whitetail-kootenay.png'));
  assert(env.element('layer-note-text').textContent.includes('approximate'));
  await env.element('era-modern').click();
  const beforeDakota = env.layers.length;
  await select(env, 'dakota_whitetail_peace');
  assert.equal(env.layers.length, beforeDakota + 1);
  assert(env.layers.at(-1).collection.features.length > 0);
  assert(!env.layers.at(-1).collection.features.some(f => f.properties.wmu === '7-80'), 'Regional unknown is not a mapped WMU');
  assert(env.element('layer-note-text').textContent.includes('may be Dakota'));
  for (const key of ['alaskan_moose_nw','shiras_moose_flathead']) {
    const before = env.layers.length;
    await select(env, key);
    assert.equal(env.layers.length, before + 1);
    assert(env.layers.at(-1).collection.features.length > 0);
    assert(env.element('layer-note-text').textContent.includes('do not identify subspecies'));
  }
  await env.element('era-winter').click();
  for (const key of ['rocky_bighorn_kootenay','california_bighorn_boundary']) {
    await select(env, key);
    assert(env.overlays.at(-1).url.includes(`winter-${key}.png`));
    assert(env.element('layer-note-text').textContent.includes('approximate'));
  }
  await env.element('era-modern').click();
  await select(env, 'white_tailed_deer');
  let layer = env.layers.at(-1);
  assert(layer.collection.features.some(f => f.properties.wmu === '3-30'));
  await select(env, 'elk');
  assert.equal(layer.map, null, 'previous harvest layer must clear');
  assert(env.layers.at(-1).collection.features.some(f => f.properties.wmu === '2-8'));
  await select(env, 'roosevelt_elk');
  assert(env.layers.some(d => d.collection.features.some(f => f.properties.wmu === '2-8')));
  assert(env.layers.some(d => d.collection.features.some(f => f.properties.label === 'Vancouver Island broad range context')));
  assert(env.layers.some(d => d.collection.features.some(f => f.properties.unit === 'Pitt' && f.properties.survey_year === 2023)));
  assert(env.element('layer-note-text').textContent.includes('not confirmed presence everywhere'));
  const fallback = setup({ failMainland: true });
  await select(fallback, 'roosevelt_elk');
  assert(fallback.layers.some(d => d.collection.features.some(f => f.properties.wmu === '2-8')));
  assert.equal(fallback.fetchCounts.get('/species-map/api/species-data?kind=rooseveltEpu'), undefined, 'Modern mode must not load 2012 EPU data');
  await fallback.element('era-historical').click();
  assert(fallback.element('error').textContent.includes('could not load'));
  assert(fallback.element('layer-note-text').textContent.includes('1990 map'));
  assert(fallback.layers.some(d => d.collection.features.some(f => f.properties.historical_class === 'M')));
  assert(fallback.layers.some(d => d.collection.features.some(f => f.properties.label === 'Vancouver Island broad range context')));
  assert(fallback.element('layer-note-text').textContent.includes('Some historical Roosevelt elk data could not load'));
  await fallback.element('era-modern').click();
  assert.equal(fallback.element('error').textContent, '', 'A new successful selection must clear the previous error');
  const partialSurvey = setup({ failOnce: 'moose-revelstoke-2025-context.geojson' });
  await select(partialSurvey, 'moose');
  assert(partialSurvey.element('layer-note-text').textContent.includes('Some moose survey data could not load'), 'Partial failures must stay visible in the note');
  assert(partialSurvey.layers.some(d => d.collection.features.some(f => f.properties.wmu === '7-24')), 'One missing survey must not hide the other');
  await select(partialSurvey, 'elk');
  assert.equal(partialSurvey.element('error').textContent, '');
  assert(!partialSurvey.element('layer-note-text').textContent.includes('Some moose survey data could not load'));
  const combinedDeer = setup();
  await select(combinedDeer, 'mule_deer');
  await combinedDeer.element('era-historical').click();
  assert(combinedDeer.element('layer-note-text').textContent.includes('not shown as separate subspecies'));
  assert.equal(combinedDeer.layers.at(-1).collection.features.length, 2, 'Combined historical deer needs both source archives');
  const seasons = setup();
  for (const key of raster) {
    await select(seasons, key);
    await seasons.element('era-winter').click();
    assert(seasons.overlays.some(o => o.map && o.url.includes(`winter-${key}.png`)), `${key} winter missing`);
    await seasons.element('era-modern').click();
    assert(!seasons.overlays.some(o => o.map && o.url.includes(`winter-${key}.png`)), `${key} winter leaked into modern`);
  }
  await select(seasons, 'caribou');
  await seasons.element('era-summer').click();
  assert(seasons.layers.at(-1).collection.features[0].properties.herd === 'Graham');
  assert(seasons.element('layer-note-text').textContent.includes('2017'));
  await select(seasons, 'caribou_northern');
  assert(seasons.layers.at(-1).collection.features[0].properties.herd === 'Graham', 'Northern ecotype should expose South Peace summer data');
  await seasons.element('era-winter').click();
  assert(seasons.element('layer-note-text').textContent.startsWith('Winter:'));
  await select(seasons, 'black_bear');
  assert(seasons.element('layer-note-text').textContent.includes('no verified winter'));
  await seasons.element('era-summer').click();
  assert(seasons.element('layer-note-text').textContent.includes('no verified summer'));
  for (const key of summerModels) {
    await select(seasons, key);
    assert(seasons.overlays.some(o => o.map && o.url.includes(`summer-habitat-${key}.png`)), `${key} summer habitat missing`);
    assert(seasons.element('layer-note-text').textContent.includes('not observations or animal density'));
  }
  for (const mode of ['winter','summer']) {
    await seasons.element(`era-${mode}`).click();
    for (const key of optionKeys) {
      await select(seasons, key);
      assert.equal(seasons.element('layer-note').hidden, false, `${key} ${mode} must explain its data`);
      assert(seasons.element('layer-note-text').textContent.startsWith(mode === 'winter' ? 'Winter:' : 'Summer:'), `${key} ${mode} must be labelled`);
    }
  }
  const historical = setup();
  await historical.element('era-historical').click();
  await select(historical, 'grizzly_bear');
  assert(historical.element('layer-note-text').textContent.includes('2012 grizzly'));
  assert(historical.layers.at(-1).collection.features[0].properties.density_2012 !== undefined);
  for (const key of optionKeys) {
    await select(historical, key);
    assert.equal(historical.element('layer-note').hidden, false, `${key} must explain the historical view`);
    assert(historical.element('layer-note-text').textContent.startsWith('Historical:'), `${key} historical view must be clearly labelled`);
  }
  const partialHistory = setup({ failOnce:'taxon=dall' });
  await select(partialHistory, 'wild_sheep');
  await partialHistory.element('era-historical').click();
  assert(partialHistory.element('layer-note-text').textContent.includes('Some historical source layers could not load'));
  assert(partialHistory.layers.at(-1).collection.features.length, 'Other sheep archives must render when one fails');
  await select(historical, 'elk');
  assert(historical.element('layer-note-text').textContent.includes('1990 Roosevelt and Rocky Mountain'));
  assert.equal(historical.layers.at(-1).collection.features.length, 2, 'Both 1990 elk sources must be rendered');
  const alberta = setup();
  await alberta.element('province-alberta').click();
  assert.equal(alberta.element('province-alberta').attributes['aria-pressed'], 'true');
  assert.equal(alberta.element('era-control').hidden, true);
  assert.equal(alberta.element('species').value, 'caribou');
  assert.equal(alberta.layers.at(-1).collection.features[0].properties.CODE, 'AB1');
  await select(alberta, 'elk');
  assert(alberta.element('layer-note-text').textContent.includes('no verified commercially reusable'));
  await alberta.element('province-bc').click();
  assert.equal(alberta.element('era-control').hidden, false);
  assert.equal(alberta.element('species').value, 'mule_deer');
  const local = setup();
  await local.element('province-alberta').click();
  await select(local, 'grizzly_bear');
  assert.equal(local.element('alberta-personal-panel').hidden, false);
  assert(local.element('alberta-personal-description').textContent.includes('GrizzlyBearZone.zip'));
  local.element('alberta-personal-file').files = [{
    name:'GrizzlyBearZone.zip',size:400,arrayBuffer:async () => new ArrayBuffer(200)
  }];
  await local.element('alberta-personal-file').change();
  assert.equal(local.layers.at(-1).collection.features[0].properties.ZONE,'Core',
    'Locally selected government shape must render');
  assert.equal(local.element('alberta-personal-clear').hidden,false);
  assert(local.element('layer-note-text').textContent.includes('not animal density'));
  assert([...local.fetchCounts.keys()].every(url=>!url.includes('extranet.gov.ab.ca')),
    'Personal government polygons must never be fetched by HuntSmart');
  await select(local,'elk');
  assert.equal(local.element('alberta-personal-panel').hidden,true);
  await select(local,'grizzly_bear');
  assert.equal(local.layers.at(-1).collection.features[0].properties.ZONE,'Core',
    'Personal GIS may be reused only in the same open browser tab');
  await local.element('province-bc').click();
  assert.equal(local.element('alberta-personal-panel').hidden,true);
  console.log('Personal-only government ZIP import, BC isolation and no-upload policy passed.');
  console.log('BC/Alberta switch, federal range layer and permission gate passed.');
  console.log('Species selections, seasons and historical source fallbacks passed.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
