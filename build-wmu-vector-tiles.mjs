import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import GeoJSONVT from 'geojson-vt';
import vtpbf from 'vt-pbf';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const SITE = path.join(ROOT, 'site');
const INDEX = path.join(SITE, 'index.html');
const RUNTIME = path.join(ROOT, 'map-vector-runtime.js');
const TILE_VERSION = '20261028-v3';
const RUNTIME_VERSION = '2026-10-28-vector-v2';
const MIN_ZOOM = 3;
const MAX_ZOOM = 9;
const EXTENT = 4096;
const SOURCE_LAYER = 'wmus';

function loadJsGeoJSON(filename) {
  const text = fs.readFileSync(path.join(ROOT, filename), 'utf8');
  const eq = text.indexOf('=');
  const start = text.indexOf('{', eq);
  const end = text.lastIndexOf('}');
  if (eq < 0 || start < 0 || end <= start) throw new Error(`${filename}: GeoJSON assignment not found`);
  return JSON.parse(text.slice(start, end + 1));
}

function pointSegDist2(p, a, b) {
  const [px, py] = p, [ax, ay] = a, [bx, by] = b;
  const dx = bx - ax, dy = by - ay;
  if (dx === 0 && dy === 0) return (px - ax) ** 2 + (py - ay) ** 2;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  const qx = ax + t * dx, qy = ay + t * dy;
  return (px - qx) ** 2 + (py - qy) ** 2;
}

function rdp(points, tolerance) {
  if (points.length <= 2) return points.slice();
  const tol2 = tolerance * tolerance;
  const keep = new Array(points.length).fill(false);
  keep[0] = keep[points.length - 1] = true;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [start, end] = stack.pop();
    const a = points[start], b = points[end];
    let bestI = -1, bestD = -1;
    for (let i = start + 1; i < end; i++) {
      const d = pointSegDist2(points[i], a, b);
      if (d > bestD) { bestD = d; bestI = i; }
    }
    if (bestI >= 0 && bestD > tol2) {
      keep[bestI] = true;
      stack.push([start, bestI], [bestI, end]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

function samePoint(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1];
}

function simplifyRing(ring, tolerance) {
  if (!Array.isArray(ring) || ring.length < 5 || tolerance <= 0) return ring;
  const closed = samePoint(ring[0], ring[ring.length - 1]);
  const pts = closed ? ring.slice(0, -1) : ring.slice();
  if (pts.length < 4) return ring;
  const anchor = pts[0];
  let farI = 1, farD = -1;
  for (let i = 1; i < pts.length; i++) {
    const d = (pts[i][0] - anchor[0]) ** 2 + (pts[i][1] - anchor[1]) ** 2;
    if (d > farD) { farD = d; farI = i; }
  }
  const seq = pts.slice(farI).concat(pts.slice(0, farI + 1));
  const simplified = rdp(seq, tolerance);
  if (simplified.length < 3) return ring;
  if (!samePoint(simplified[0], simplified[simplified.length - 1])) simplified.push(simplified[0]);
  return simplified;
}

function simplifyGeometry(geometry, tolerance) {
  if (!geometry) return geometry;
  if (geometry.type === 'Polygon') {
    return { type:'Polygon', coordinates:(geometry.coordinates || []).map(r => simplifyRing(r, tolerance)) };
  }
  if (geometry.type === 'MultiPolygon') {
    return { type:'MultiPolygon', coordinates:(geometry.coordinates || []).map(poly => poly.map(r => simplifyRing(r, tolerance))) };
  }
  return geometry;
}

function prepareCollection(collection, province) {
  const features = (collection.features || []).map((feature, index) => {
    const props = { ...(feature.properties || {}) };
    if (province === 'BC') {
      const wmu = String(props.wmu_id || props.WMUNIT_NUM || '');
      props.wmu_id = wmu;
      props.WMUNIT_NUM = String(props.WMUNIT_NUM || wmu);
    } else {
      props.WMUNIT_NUM = String(props.WMUNIT_NUM || '');
    }
    return { type:'Feature', id:index, properties:props, geometry:feature.geometry };
  }).filter(f => f.geometry);
  return { type:'FeatureCollection', features };
}

function makeIndex(collection, province) {
  const tolerance = province === 'BC' ? 0.0025 : 0.0020;
  return {
    type:'FeatureCollection',
    __hsVectorProvince:province,
    __hsVectorIndex:true,
    features:collection.features.map(feature => ({
      type:'Feature',
      id:feature.id,
      properties:feature.properties,
      geometry:simplifyGeometry(feature.geometry, tolerance)
    }))
  };
}

function buildTiles(collection, province, outputRoot) {
  const tileIndex = new GeoJSONVT(collection, {
    maxZoom: MAX_ZOOM,
    indexMaxZoom: MAX_ZOOM,
    indexMaxPoints: 0,
    tolerance: 3,
    extent: EXTENT,
    buffer: 64,
    generateId: false
  });
  let tileCount = 0;
  let tileBytes = 0;
  const seen = new Set();
  for (const coord of tileIndex.tileCoords || []) {
    const { z, x, y } = coord;
    if (z < MIN_ZOOM || z > MAX_ZOOM) continue;
    const key = `${z}/${x}/${y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const tile = tileIndex.getTile(z, x, y);
    if (!tile || !tile.features?.length) continue;
    const payload = vtpbf.fromGeojsonVt({ [SOURCE_LAYER]: tile }, { version:2, extent:EXTENT });
    const dir = path.join(outputRoot, province.toLowerCase(), String(z), String(x));
    fs.mkdirSync(dir, { recursive:true });
    fs.writeFileSync(path.join(dir, `${y}.pbf`), payload);
    tileCount++;
    tileBytes += payload.length;
  }
  return { tileCount, tileBytes };
}

function injectRuntime() {
  if (!fs.existsSync(INDEX) || !fs.existsSync(RUNTIME)) throw new Error('vector tiles build: site/index.html or map-vector-runtime.js missing');
  let text = fs.readFileSync(INDEX, 'utf8');
  const meta = `<meta name="huntsmart-wmu-vector-tiles" content="${RUNTIME_VERSION}">`;
  if (!text.includes('name="huntsmart-wmu-vector-tiles"')) text = text.replace('</head>', `${meta}\n</head>`);
  const tag = `<script defer src="./map-vector-runtime.js?v=${TILE_VERSION}"></script>`;
  if (!text.includes('map-vector-runtime.js')) {
    const re = /(<script\b[^>]*\bsrc=["'][^"']*map-performance-runtime\.js(?:\?[^"']*)?["'][^>]*>\s*<\/script>)/i;
    if (!re.test(text)) throw new Error('vector tiles build: map-performance runtime injection anchor missing');
    text = text.replace(re, `$1\n${tag}`);
  }
  fs.writeFileSync(INDEX, text);
  fs.copyFileSync(RUNTIME, path.join(SITE, 'map-vector-runtime.js'));
}

function main() {
  if (!fs.existsSync(SITE)) throw new Error('vector tiles build: site directory missing');
  const bc = prepareCollection(loadJsGeoJSON('bc-wmu-geojson.js'), 'BC');
  const abFeatures = [1,2,3].flatMap(part => loadJsGeoJSON(`ab-wmu-geojson-${part}.js`).features || []);
  const ab = prepareCollection({ type:'FeatureCollection', features:abFeatures }, 'AB');
  const outputRoot = path.join(SITE, 'map-tiles', TILE_VERSION);
  fs.rmSync(outputRoot, { recursive:true, force:true });
  fs.mkdirSync(outputRoot, { recursive:true });

  const bcStats = buildTiles(bc, 'BC', outputRoot);
  const abStats = buildTiles(ab, 'AB', outputRoot);
  const manifest = {
    version:RUNTIME_VERSION,
    tileVersion:TILE_VERSION,
    sourceLayer:SOURCE_LAYER,
    minzoom:MIN_ZOOM,
    maxzoom:MAX_ZOOM,
    bc:{ featureCount:bc.features.length, index:makeIndex(bc, 'BC'), ...bcStats },
    ab:{ featureCount:ab.features.length, index:makeIndex(ab, 'AB'), ...abStats }
  };
  fs.writeFileSync(path.join(outputRoot, 'manifest.json'), JSON.stringify(manifest));
  injectRuntime();
  console.log('WMU vector tile build complete:', JSON.stringify({
    version:RUNTIME_VERSION,
    tileVersion:TILE_VERSION,
    bc:{ featureCount:manifest.bc.featureCount, tileCount:manifest.bc.tileCount, tileBytes:manifest.bc.tileBytes },
    ab:{ featureCount:manifest.ab.featureCount, tileCount:manifest.ab.tileCount, tileBytes:manifest.ab.tileBytes }
  }));
}

main();
