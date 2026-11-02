// Compare the published 1988 black-tail shapefile archives without copying
// their contents into the repository. Pass Columbian and Sitka ZIP paths.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import shp from 'shpjs';

if (process.argv.length !== 4) throw new Error('Pass Columbian and Sitka ZIP paths');
const summaries = [];
for (const path of process.argv.slice(2)) {
  const buffer = await readFile(path);
  const data = await shp(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
  if (data.type !== 'FeatureCollection') throw new Error('Unexpected shapefile contents');
  const mapped = data.features.filter(f => ['L','M','H'].includes(f.properties?.HSV));
  if (!mapped.length) throw new Error('No positive classified polygons');
  const hash = createHash('sha256').update(JSON.stringify(mapped.map(f => [f.properties.Poly_ID, f.properties.HSV, f.geometry]))).digest('hex');
  summaries.push({ path, positive_features:mapped.length, geometry_and_class_sha256:hash });
}
console.log(JSON.stringify({ archives:summaries, same_classified_geometry:summaries[0].geometry_and_class_sha256 === summaries[1].geometry_and_class_sha256 }, null, 2));
