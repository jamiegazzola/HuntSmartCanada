'use strict';

const fs = require('node:fs');
const path = require('node:path');

// Runs after patch-roosevelt-unified-vector.cjs. Replace its temporary
// run-length rectangle renderer with true connected-region polygonization.
// This keeps the March 2005 class grid authoritative while removing the
// visible pixel-block / "Minecraft" appearance.
const installerPath = path.join('scripts', 'install-private-heatmaps.cjs');
let source = fs.readFileSync(installerPath, 'utf8');

const startMarker = '          // Convert the exact source raster into merged vector rectangles.';
const endMarker = '        const [island, recent] = await Promise.all([';
const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);
if (start < 0 || end < 0) throw new Error('Roosevelt rectangle-vectorization block not found');

const replacement = `          // Polygonize connected cells of each density class instead of emitting
          // raster rectangles. The source grid still controls class membership;
          // simplification only removes pixel stair-stepping from the boundary.
          const grid = new Array(height);
          for (let y = 0; y < height; y += 1) {
            grid[y] = new Array(width);
            for (let x = 0; x < width; x += 1) grid[y][x] = classify(x, y);
          }

          const key = (x, y) => x + ',' + y;
          const parseKey = value => value.split(',').map(Number);
          const simplifyRing = (ring, tolerance = 1.35) => {
            if (ring.length <= 6) return ring;
            const points = ring.slice(0, -1);
            const keep = new Uint8Array(points.length);
            keep[0] = keep[points.length - 1] = 1;
            const stack = [[0, points.length - 1]];
            const tolerance2 = tolerance * tolerance;
            while (stack.length) {
              const [first, last] = stack.pop();
              const a = points[first], b = points[last];
              const dx = b[0] - a[0], dy = b[1] - a[1];
              const len2 = dx * dx + dy * dy;
              let furthest = -1, maxDistance = tolerance2;
              for (let i = first + 1; i < last; i += 1) {
                const p = points[i];
                const t = len2 ? Math.max(0, Math.min(1, ((p[0]-a[0])*dx + (p[1]-a[1])*dy) / len2)) : 0;
                const px = a[0] + t * dx, py = a[1] + t * dy;
                const ddx = p[0] - px, ddy = p[1] - py;
                const distance = ddx * ddx + ddy * ddy;
                if (distance > maxDistance) { maxDistance = distance; furthest = i; }
              }
              if (furthest >= 0) {
                keep[furthest] = 1;
                stack.push([first, furthest], [furthest, last]);
              }
            }
            const simplified = points.filter((_, i) => keep[i]);
            if (simplified.length < 3) return ring;
            simplified.push(simplified[0]);
            return simplified;
          };

          const polygons = [];
          for (const densityClass of ['L', 'M', 'H']) {
            const visited = new Uint8Array(width * height);
            for (let sy = 0; sy < height; sy += 1) {
              for (let sx = 0; sx < width; sx += 1) {
                const seedIndex = sy * width + sx;
                if (visited[seedIndex] || grid[sy][sx] !== densityClass) continue;

                // 4-neighbour flood fill keeps corner-touching patches separate.
                const cells = [];
                const queue = [[sx, sy]];
                visited[seedIndex] = 1;
                for (let qi = 0; qi < queue.length; qi += 1) {
                  const [x, y] = queue[qi];
                  cells.push([x, y]);
                  for (const [nx, ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]) {
                    if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                    const ni = ny * width + nx;
                    if (!visited[ni] && grid[ny][nx] === densityClass) {
                      visited[ni] = 1;
                      queue.push([nx, ny]);
                    }
                  }
                }

                // Discard isolated anti-alias specks, not meaningful mapped patches.
                if (cells.length < 3) continue;
                const cellSet = new Set(cells.map(([x,y]) => key(x,y)));
                const adjacency = new Map();
                const addEdge = (a, b) => {
                  const k = key(a[0], a[1]);
                  const list = adjacency.get(k) || [];
                  list.push(b);
                  adjacency.set(k, list);
                };
                for (const [x, y] of cells) {
                  if (!cellSet.has(key(x, y-1))) addEdge([x,y], [x+1,y]);
                  if (!cellSet.has(key(x+1, y))) addEdge([x+1,y], [x+1,y+1]);
                  if (!cellSet.has(key(x, y+1))) addEdge([x+1,y+1], [x,y+1]);
                  if (!cellSet.has(key(x-1, y))) addEdge([x,y+1], [x,y]);
                }

                const takeEdge = startPoint => {
                  const k = key(startPoint[0], startPoint[1]);
                  const list = adjacency.get(k);
                  if (!list?.length) return null;
                  const next = list.pop();
                  if (!list.length) adjacency.delete(k);
                  return next;
                };

                const rings = [];
                while (adjacency.size) {
                  const firstKey = adjacency.keys().next().value;
                  const first = parseKey(firstKey);
                  const ring = [first];
                  let current = first;
                  let guard = 0;
                  do {
                    const next = takeEdge(current);
                    if (!next) break;
                    ring.push(next);
                    current = next;
                    guard += 1;
                  } while ((current[0] !== first[0] || current[1] !== first[1]) && guard < width * height * 8);
                  if (ring.length >= 4 && current[0] === first[0] && current[1] === first[1]) rings.push(simplifyRing(ring));
                }

                if (!rings.length) continue;
                // Largest boundary is the component shell. Any additional rings are
                // retained as holes so bays / blank areas are not accidentally filled.
                const area = ring => Math.abs(ring.reduce((sum, p, i) => {
                  const q = ring[(i + 1) % ring.length];
                  return sum + p[0] * q[1] - q[0] * p[1];
                }, 0) / 2);
                rings.sort((a, b) => area(b) - area(a));
                polygons.push({ densityClass, rings });
              }
            }
          }

          const lon = x => BOUNDS.west + (x / width) * (BOUNDS.east - BOUNDS.west);
          const lat = y => BOUNDS.north - (y / height) * (BOUNDS.north - BOUNDS.south);
          return {
            type:'FeatureCollection',
            source_year:2005,
            density_scale:'absolute_elk_per_km2',
            features:polygons.map(poly => ({
              type:'Feature',
              properties:{ density_class:poly.densityClass, source_year:2005, source:'BC March 2005 elk map' },
              geometry:{
                type:'Polygon',
                coordinates:poly.rings.map(ring => ring.map(([x,y]) => [lon(x), lat(y)])),
              },
            })),
          };
        }

`;

source = source.slice(0, start) + replacement + source.slice(end);
if (source.includes('merged vector rectangles')) throw new Error('Roosevelt rectangle renderer survived polygonization patch');
if (!source.includes("for (const densityClass of ['L', 'M', 'H'])")) throw new Error('Roosevelt polygonizer was not installed');

// Parse the exact production viewer after all Roosevelt patches are applied.
const appStart = source.indexOf('function patchProductionApp(input)');
if (appStart < 0) throw new Error('Production app patch function missing');
fs.writeFileSync(installerPath, source);
console.log('Replaced Roosevelt raster rectangles with dissolved/simplified class polygons.');
