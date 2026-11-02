#!/usr/bin/env python3
"""Build a small-scale Stone's sheep layer; preserve the detailed source layer."""
import hashlib
import json
from pathlib import Path

from pyproj import Transformer
from shapely.geometry import mapping, shape
from shapely.ops import transform

root = Path('species-map/data')
source = root / 'stone-sheep-winter-range.geojson'
target = root / 'stone-sheep-winter-range-overview.geojson'
manifest_path = root / 'sources.json'
source_bytes = source.read_bytes()
collection = json.loads(source_bytes)
forward = Transformer.from_crs(4326, 3005, always_xy=True).transform
reverse = Transformer.from_crs(3005, 4326, always_xy=True).transform

def structure(geom):
    if geom.geom_type == 'Polygon':
        return (1, len(geom.interiors))
    parts = [structure(g) for g in geom.geoms]
    return (sum(p[0] for p in parts), sum(p[1] for p in parts))

def count(geom):
    if geom.geom_type == 'Polygon':
        return len(geom.exterior.coords) + sum(len(r.coords) for r in geom.interiors)
    return sum(count(g) for g in geom.geoms)

def rounded(value):
    if isinstance(value, (list, tuple)):
        return [rounded(v) for v in value]
    return round(value, 6) if isinstance(value, float) else value

before_count = after_count = fallback_count = 0
max_displacement = max_area_change = 0.0
for feature in collection['features']:
    geom = transform(forward, shape(feature['geometry']))
    simplified = geom.simplify(100, preserve_topology=True)
    area_change = abs(simplified.area - geom.area) / geom.area if geom.area else 0
    if (not simplified.is_valid or simplified.geom_type != geom.geom_type or
            structure(simplified) != structure(geom) or area_change > 0.01 or
            geom.hausdorff_distance(simplified) > 100):
        simplified = geom
        fallback_count += 1
        area_change = 0
    geometry = mapping(transform(reverse, simplified))
    rounded_geometry = {'type': geometry['type'], 'coordinates': rounded(geometry['coordinates'])}
    if not shape(rounded_geometry).is_valid:
        if not simplified.equals(geom):
            fallback_count += 1
        simplified = geom
        area_change = 0
        rounded_geometry = feature['geometry']
    distance = geom.hausdorff_distance(simplified)
    if distance > 100.001:
        raise ValueError(f'Unexpected displacement: {distance} m')
    before_count += count(geom)
    after_count += count(simplified)
    max_displacement = max(max_displacement, distance)
    max_area_change = max(max_area_change, area_change)
    feature['geometry'] = rounded_geometry

output = json.dumps(collection, separators=(',', ':'), ensure_ascii=True).encode()
target.write_bytes(output)
manifest = json.loads(manifest_path.read_text())
manifest[target.name] = {
    'source_asset': source.name,
    'source_sha256': [hashlib.sha256(source_bytes).hexdigest()],
    'output_sha256': hashlib.sha256(output).hexdigest(),
    'feature_count': len(collection['features']),
    'vertices_before': before_count,
    'vertices_after': after_count,
    'max_simplification_metres': 100,
    'measured_max_displacement_metres_before_coordinate_rounding': round(max_displacement, 3),
    'maximum_relative_area_change': max_area_change,
    'full_geometry_fallback_count': fallback_count,
    'note': 'Overview only, at map zoom 8 and below. Full original geometry is loaded at zoom 9 and above. All features, polygon components and holes are retained; features with over 1% area change use the full geometry.'
}
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
print(f'{len(collection["features"])} features; {before_count} -> {after_count} vertices; {len(source_bytes)} -> {len(output)} bytes; {fallback_count} features kept full detail; max displacement {max_displacement:.2f} m')
