"""Build Stone's sheep winter habitat from four BC WFS GeoJSON responses.

Pass U-7-006, U-7-028, U-9-004 and U-9-005 GeoJSON in that order. Requires shapely/pyproj.
U-7-028 also contains disease buffers: only its numbered core units are habitat.
"""
import hashlib, json, pathlib, sys
from pyproj import Transformer
from shapely.geometry import shape, mapping
from shapely.ops import transform

inputs = [pathlib.Path(p) for p in sys.argv[1:]]
if len(inputs) != 4:
    raise SystemExit('Pass the U-7-006, U-7-028, U-9-004 and U-9-005 GeoJSON paths')
to_metres = Transformer.from_crs(4326, 3005, always_xy=True).transform
to_degrees = Transformer.from_crs(3005, 4326, always_xy=True).transform
features = []
counts = {}
for file, order in zip(inputs, ['u-7-006', 'u-7-028', 'u-9-004', 'u-9-005']):
    source = json.loads(file.read_bytes())
    if source.get('numberMatched') != len(source.get('features', [])):
        raise ValueError(f'{order}: incomplete WFS response')
    for feature in source['features']:
        p = feature['properties']
        if p.get('UWR_NUMBER') != order:
            raise ValueError('Unexpected order')
        unit = str(p.get('UWR_UNIT_NUMBER', ''))
        if order == 'u-7-028' and not unit.isdigit():
            continue
        if p.get('FEATURE_CODE') == 'FF84630400':
            continue
        if 'M-OVDA-ST' not in (str(p.get('SPECIES_1', '')) + str(p.get('SPECIES_2', ''))):
            raise ValueError('Unexpected species')
        geometry = transform(to_degrees, transform(to_metres, shape(feature['geometry'])).simplify(5, preserve_topology=True))
        if geometry.is_empty or not geometry.is_valid:
            raise ValueError(f'{order} unit {unit}: invalid geometry')
        features.append({'type':'Feature', 'properties':{'order':order, 'unit':unit}, 'geometry':mapping(geometry)})
        counts[order] = counts.get(order, 0) + 1
if counts != {'u-7-006':10, 'u-7-028':11, 'u-9-004':21, 'u-9-005':10}:
    raise ValueError(f'Unexpected order counts: {counts}')
out = pathlib.Path('species-map/data/stone-sheep-winter-range.geojson')
source_url = 'https://catalogue.data.gov.bc.ca/dataset/ungulate-winter-range-approved'
out.write_text(json.dumps({'type':'FeatureCollection', 'source':source_url, 'attribution':'Contains information licensed under the Open Government Licence – British Columbia.', 'features':features}, separators=(',', ':')))
manifest_file = pathlib.Path('species-map/data/sources.json')
manifest = json.loads(manifest_file.read_text())
manifest[out.name] = {'retrieved':'2026-10-31', 'source_urls':[source_url, 'https://www.env.gov.bc.ca/wld/documents/uwr/u-7-028_Summary.pdf'], 'source_sha256':[hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs], 'output_sha256':hashlib.sha256(out.read_bytes()).hexdigest(), 'note':'52 winter units: 10 in U-7-006, 11 in U-7-028, 21 in U-9-004 and 10 in U-9-005. Excludes U-7-028 disease-risk buffer areas. Seasonal habitat is incomplete and is not density.'}
manifest.pop('winter-stone_sheep.png', None)
manifest_file.write_text(json.dumps(manifest, indent=2) + '\n')
print(f'Stone’s sheep: {counts}, {out.stat().st_size} bytes')
