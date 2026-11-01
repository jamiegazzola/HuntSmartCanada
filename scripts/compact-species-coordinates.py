#!/usr/bin/env python3
"""Compact selected open-data layers without removing or simplifying vertices.

Run after rebuilding the source GeoJSON. Six decimal places in latitude/longitude
limit coordinate rounding to about 0.08 metres anywhere in BC.
"""
import hashlib
import json
from pathlib import Path

from shapely.geometry import shape
from shapely.validation import explain_validity

root = Path('species-map/data')
# The black-bear boundary contains extremely small polygon components: even
# eight decimal places can invalidate it, so retain its original coordinates.
names = ['stone-sheep-winter-range.geojson', 'harvest-gap-white_tailed_deer.geojson',
         'dakota-whitetail-peace-context.geojson']
manifest_path = root / 'sources.json'
manifest = json.loads(manifest_path.read_text())

def digest(data):
    return hashlib.sha256(data).hexdigest()

def round_coordinates(value):
    if isinstance(value, list):
        return [round_coordinates(item) for item in value]
    if isinstance(value, float):
        return round(value, 6)
    return value

for name in names:
    path = root / name
    original = path.read_bytes()
    collection = json.loads(original)
    for feature in collection['features']:
        geometry = feature.get('geometry')
        if not geometry or 'coordinates' not in geometry:
            raise ValueError(f'{name}: unexpected geometry')
        before = shape(geometry)
        rounded = dict(geometry, coordinates=round_coordinates(geometry['coordinates']))
        after = shape(rounded)
        if before.geom_type != after.geom_type or (before.is_valid and not after.is_valid):
            raise ValueError(f'{name}: rounding invalidated geometry: {explain_validity(after)}')
        # The recursive conversion only rounds numbers; the exact nested coordinate
        # structure and vertex count stay unchanged, including small islands.
        feature['geometry'] = rounded
    output = json.dumps(collection, separators=(',', ':'), ensure_ascii=True).encode()
    record = manifest[name]
    if output != original:
        record['coordinate_compaction'] = {'input_sha256': digest(original), 'decimal_places': 6,
                                            'vertices_removed': 0, 'input_bytes': len(original),
                                            'output_bytes': len(output)}
    record['output_sha256'] = digest(output)
    path.write_bytes(output)
    print(f'{name}: {len(original)} -> {len(output)} bytes; features {len(collection["features"])}')

manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
