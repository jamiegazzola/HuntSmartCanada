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
    if (url.includes('rooseveltEpu')) {
      if (failMainland) return { ok: false };
      return { ok: true, json: async () => ({ type: 'FeatureCollection', densityField: '__density', features: [{ type: 'Feature', properties: { __density: 1 }, geometry: null }] }) };
    }
    const body = fs.readFileSync(path.join(root, url.split('?')[0]), 'utf8');
    return { ok: true, json: async () => JSON.parse(body) };
  };
  context = vm.createContext({ document, localStorage, google, fetch, AbortController, DOMException, console, setTimeout: () => 0, clearTimeout, Uint8ClampedArray });
  context.window = context;
  vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), context);
  context.initSpeciesMap();
  return { element, layers, overlays, fetchCounts, releaseDelayed, getLastImage: () => lastImage, getMap: () => mapStub };
}

async function select(env, key) { env.element('species').value = key; await env.element('species').change(); }
async function run() {
  const manifest = JSON.parse(fs.readFileSync('species-map/data/sources.json', 'utf8'));
  for (const key of ['mule_deer', 'white_tailed_deer', 'elk', 'moose', 'mountain_goat']) {
    const filename = `winter-${key}.png`;
    const bytes = fs.readFileSync(path.join('species-map/data', filename));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), manifest[filename].output_sha256, `${filename} does not match its source record`);
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
  const herds = JSON.parse(fs.readFileSync('species-map/data/caribou-herds.geojson', 'utf8'));
  assert.equal(createHash('sha256').update(fs.readFileSync('species-map/data/caribou-herds.geojson')).digest('hex'), manifest['caribou-herds.geojson'].output_sha256);
  for (const name of ['George Mountain','Columbia South','Monashee','Burnt Pine']) assert(!herds.features.some(f => f.properties.HERD_NAME === name), `${name} must not appear as an active resident herd`);
  for (const key of ['rocky_bighorn_kootenay','california_bighorn_boundary']) {
    const filename = `winter-${key}.png`;
    assert.equal(createHash('sha256').update(fs.readFileSync(path.join('species-map/data',filename))).digest('hex'), manifest[filename].output_sha256);
  }
  const env = setup();
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
      assert(env.overlays.length > previousOverlays && env.overlays.at(-1).map, `${key} did not render`);
      if (key === 'mule_deer') {
        assert(env.layers.at(-1).collection.features.some(f => f.properties.description === 'Haida Gwaii broad range context'));
        assert(env.overlays.some(o => o.map && o.url.includes('winter-mule_deer.png')));
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
      assert.equal(env.layers.length, previousLayers + (['wood_bison','caribou','caribou_mountain'].includes(key) ? 2 : 1), `${key} did not create its layers`);
      assert(env.layers[previousLayers].collection.features.length, `${key} has no features`);
      if (key === 'wood_bison') {
        assert(env.layers.at(-1).collection.features[0].geometry.type.includes('LineString'));
        assert(env.element('layer-note-text').textContent.includes('not a bison range'));
      }
      if (key === 'caribou' || key === 'caribou_mountain') {
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
  const mooseGapUrl = 'data/harvest-gap-moose.geojson?v=1';
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
  assert(race.layers.at(-1).collection.features.every(f => f.properties.ECOTYPE === 'Northern'), 'A stale download must not replace the selected layer');
  const partialStone = setup({ delayedAsset: 'stone-sheep-winter-range-overview.geojson' });
  const stonePending = select(partialStone, 'stone_sheep');
  await new Promise(resolve => setImmediate(resolve));
  assert(partialStone.layers.some(layer => layer.collection?.features.some(f => f.properties?.SPECIES_CODE === 'M-OVDA')), 'Thinhorn context should appear while winter data loads');
  partialStone.releaseDelayed();
  await stonePending;
  assert(partialStone.layers.some(layer => layer.collection?.features.length === 52 && layer.style.zIndex === 2), 'Stone winter habitat should appear above context');
  assert.equal(partialStone.fetchCounts.get('data/stone-sheep-winter-range-overview.geojson?v=1'), 1);
  partialStone.getMap().zoom = 9;
  partialStone.getMap().listeners.idle();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(partialStone.fetchCounts.get('data/stone-sheep-winter-range.geojson?v=2'), 1, 'Close zoom must load the full-detail habitat');
  partialStone.getMap().zoom = 8;
  partialStone.getMap().listeners.idle();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(partialStone.fetchCounts.get('data/stone-sheep-winter-range-overview.geojson?v=1'), 1, 'Returning to overview should reuse it');
  await partialStone.element('era-historical').click();
  const layersInHistory = partialStone.layers.length;
  partialStone.getMap().zoom = 9;
  partialStone.getMap().listeners.idle();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(partialStone.layers.length, layersInHistory, 'Zooming in historical mode must not reload the modern Stone layer');
  const overviewFail = setup({ failOnce: 'stone-sheep-winter-range-overview.geojson' });
  await select(overviewFail, 'stone_sheep');
  assert.equal(overviewFail.fetchCounts.get('data/stone-sheep-winter-range.geojson?v=2'), 1, 'Full detail must be the fallback if the overview fails');
  assert(overviewFail.layers.some(layer => layer.collection?.features.length === 52 && layer.style.zIndex === 2));
  await select(env, 'dall_tatshenshini');
  assert(env.element('layer-note-text').textContent.includes('not a Dall-specific boundary'));
  const beforeStone = env.layers.length;
  await select(env, 'stone_sheep');
  assert.equal(env.layers.length, beforeStone + 2, 'Stone’s sheep context and winter habitat must render');
  assert(env.layers.at(-2).collection.features.every(f => f.properties.SPECIES_CODE === 'M-OVDA'));
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
  for (const key of ['rocky_bighorn_kootenay','california_bighorn_boundary']) {
    await select(env, key);
    assert(env.overlays.at(-1).url.includes(`winter-${key}.png`));
    assert(env.element('layer-note-text').textContent.includes('approximate'));
  }
  await select(env, 'white_tailed_deer');
  let layer = env.layers.at(-1);
  assert(layer.collection.features.some(f => f.properties.wmu === '3-30'));
  await select(env, 'elk');
  assert.equal(layer.map, null, 'previous harvest layer must clear');
  assert(env.layers.at(-1).collection.features.some(f => f.properties.wmu === '2-8'));
  await select(env, 'roosevelt_elk');
  assert(env.layers.some(d => d.collection.features.length === 49));
  assert(env.layers.some(d => d.collection.features.some(f => f.properties.wmu === '2-8')));
  const fallback = setup({ failMainland: true });
  await select(fallback, 'roosevelt_elk');
  assert(fallback.layers.some(d => d.collection.features.length === 49));
  assert(fallback.layers.some(d => d.collection.features.some(f => f.properties.wmu === '2-8')));
  assert.equal(fallback.fetchCounts.get('/species-map/api/species-data?kind=rooseveltEpu'), undefined, 'Modern mode must not load 2012 EPU data');
  await fallback.element('era-historical').click();
  assert(fallback.element('error').textContent.includes('unavailable'));
  assert(fallback.element('layer-note-text').textContent.includes('could not be loaded'), 'A failed historical layer must not retain a stale modern description');
  await fallback.element('era-modern').click();
  assert.equal(fallback.element('error').textContent, '', 'A new successful selection must clear the previous error');
  const partialSurvey = setup({ failOnce: 'moose-revelstoke-2025-context.geojson' });
  await select(partialSurvey, 'moose');
  assert(partialSurvey.element('layer-note-text').textContent.includes('Some moose survey data could not load'), 'Partial failures must stay visible in the note');
  assert(partialSurvey.layers.some(d => d.collection.features.some(f => f.properties.wmu === '7-24')), 'One missing survey must not hide the other');
  await select(partialSurvey, 'elk');
  assert.equal(partialSurvey.element('error').textContent, '');
  assert(!partialSurvey.element('layer-note-text').textContent.includes('Some moose survey data could not load'));
  const projection = setup({ syntheticRaster: true });
  await select(projection, 'mule_deer');
  assert(!projection.overlays.some(o => o.map && o.url.startsWith('data:image/')), 'Modern mode must not show the legacy raster as current');
  await projection.element('era-historical').click();
  assert.equal(projection.element('era-historical').attributes['aria-pressed'], 'true');
  assert(projection.overlays.some(o => o.map && o.url.startsWith('data:image/')), 'Historical mode must show the legacy raster');
  assert(projection.element('layer-note-text').textContent.includes('not fully verified'));
  const y = 57, width = 260, n = 60.1, s = 48.1;
  const mercator = d => Math.log(Math.tan(Math.PI / 4 + d * Math.PI / 360));
  const m = mercator(n) - (y + .5) / 123 * (mercator(n) - mercator(s));
  const latitude = (2 * Math.atan(Math.exp(m)) - Math.PI / 2) * 180 / Math.PI;
  const sourceRow = Math.floor((n - latitude) / (n - s) * 123);
  const palette = [[0,0,0,0],[63,150,70,190],[244,208,63,200],[244,139,39,210],[215,48,39,220]];
  assert.notEqual(sourceRow, y);
  assert.deepEqual(Array.from(projection.getLastImage().data.slice(y * width * 4, y * width * 4 + 4)), palette[sourceRow % 5]);
  await select(projection, 'black_bear');
  assert(projection.element('layer-note-text').textContent.includes('no verified historical layer'));
  await projection.element('era-modern').click();
  assert.equal(projection.element('era-modern').attributes['aria-pressed'], 'true');
  assert(projection.layers.at(-1).collection.features.length);
  const historical = setup();
  await historical.element('era-historical').click();
  for (const key of optionKeys) {
    await select(historical, key);
    assert.equal(historical.element('layer-note').hidden, false, `${key} must explain the historical view`);
    assert(historical.element('layer-note-text').textContent.startsWith('Historical:'), `${key} historical view must be clearly labelled`);
  }
  console.log('Species selections, harvest gaps, elk fallback and raster reprojection passed.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
