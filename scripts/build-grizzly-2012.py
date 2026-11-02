"""Join BC 2012 grizzly estimates to matching existing management geometry.

Run from the repo root: python scripts/build-grizzly-2012.py /path/to/2012.csv
The 2018 geometry is an approximation of 2012 boundaries, not an exact map of
2012 survey footprints. Ambiguous matches and missing densities are excluded.
"""
import collections
import csv
import hashlib
import json
import math
import re
import sys

if len(sys.argv) != 2:
    raise SystemExit('Pass the original BC 2012 grizzly estimate CSV')

def name(value):
    return re.sub(r'[^a-z0-9]', '', value.lower())

def unit(value):
    if not re.fullmatch(r'\d+-\d+', value.strip()):
        return None
    return '-'.join(str(int(part)) for part in value.split('-'))

source = sys.argv[1]
with open(source, encoding='utf-8-sig', newline='') as file:
    rows = list(csv.DictReader(file))
indices = collections.defaultdict(list)
for row in rows:
    if unit(row['MU']):
        indices[(name(row['GBPU']), unit(row['MU']))].append(row)
with open('species-map/data/grizzly-2018.geojson') as file:
    geometries = json.load(file)
features = []
for feature in geometries['features']:
    props = feature['properties']
    matching = indices.get((name(props['name']), unit(props['wmu'])), [])
    if len(matching) != 1:
        continue
    row = matching[0]
    try:
        density = float(row['Density'])
    except ValueError:
        continue
    if not math.isfinite(density) or density < 0:
        continue
    features.append({'type':'Feature', 'geometry':feature['geometry'], 'properties':{'name':props['name'], 'wmu':props['wmu'], 'density_2012':density, 'method':row['Estimation_Method']}})
if not features:
    raise SystemExit('No validated grizzly records; output not written')
output = {'type':'FeatureCollection', 'source':'https://catalogue.data.gov.bc.ca/dataset/grizzly-bear-population-estimates', 'features':features}
target = 'species-map/data/grizzly-2012.geojson'
with open(target, 'w') as file:
    json.dump(output, file, separators=(',', ':'))
def sha(path):
    return hashlib.sha256(open(path, 'rb').read()).hexdigest()
manifest_path = 'species-map/data/sources.json'
with open(manifest_path) as file:
    manifest = json.load(file)
manifest['grizzly-2012.geojson'] = {'source_urls':['https://catalogue.data.gov.bc.ca/dataset/grizzly-bear-population-estimates'], 'source_sha256':[sha(source), sha('species-map/data/grizzly-2018.geojson')], 'output_sha256':sha(target), 'note':'BC 2012 density estimates joined by population unit and wildlife management unit to 2018 boundaries. 2018 geometry is an approximation for 2012. Ambiguous or missing joins omitted; not precise animal locations.'}
with open(manifest_path, 'w') as file:
    json.dump(manifest, file, indent=2)
    file.write('\n')
print(f'{len(features)} matched 2018 subunit geometries; {len(geometries["features"]) - len(features)} omitted')
