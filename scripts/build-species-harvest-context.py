"""Build recent BC harvest-evidence WMU outlines, independently of legacy grids.

Run from the repository root with the official WMU CSV as the sole argument.
An outline means a reported or estimated harvest somewhere in a unit during
2020–2024; it is not an occupancy polygon or an estimate of local density.
"""
import csv
import hashlib
import json
import sys
from collections import defaultdict

from shapely.geometry import mapping, shape
from shapely.ops import unary_union
from shapely.validation import make_valid

if len(sys.argv) != 2:
    raise SystemExit('Pass the official BC WMU harvest CSV')
source = sys.argv[1]
with open(source, encoding='utf-8-sig', newline='') as file:
    rows = list(csv.DictReader(file))
with open('bc_wmu.geojson') as file:
    units = {f['properties']['WMUNIT_NUM']: shape(f['geometry']) for f in json.load(file)['features']}

for code, name in [('DEMU', 'mule_deer'), ('DEWT', 'white_tailed_deer'), ('ELK', 'elk'), ('MOOS', 'moose'), ('GOAT', 'mountain_goat')]:
    positive = defaultdict(set)
    for row in rows:
        if row['SPECIES'] != code or not 2020 <= int(row['HUNT YEAR']) <= 2024:
            continue
        try:
            kills = float(row['RESIDENT KILLS'] or 0) + float(row['NON-RESIDENT KILLS'] or 0)
        except ValueError:
            continue
        raw = row['WMU']
        if kills > 0 and raw.isdigit() and len(raw) >= 3:
            positive[raw[:-2] + '-' + str(int(raw[-2:]))].add(int(row['HUNT YEAR']))
    features = []
    missing = []
    for unit, years in sorted(positive.items()):
        # Atypical Vancouver Island moose record needs source verification.
        if name == 'moose' and unit == '1-1':
            continue
        geometry = units.get(unit)
        if geometry is None:
            missing.append(unit)
            continue
        if not geometry.is_valid:
            geometry = make_valid(geometry)
        geometry = geometry.simplify(.002, preserve_topology=True)
        if geometry.geom_type == 'GeometryCollection':
            geometry = unary_union([g for g in geometry.geoms if g.geom_type in ('Polygon', 'MultiPolygon')])
        if geometry.is_empty or not geometry.is_valid:
            raise ValueError(f'Invalid geometry: {unit}')
        features.append({'type': 'Feature', 'properties': {'wmu': unit, 'reported_harvest_years': sorted(years)}, 'geometry': mapping(geometry)})
    result = {'type': 'FeatureCollection', 'source': 'https://catalogue.data.gov.bc.ca/dataset/big-game-harvest-statistics-1976-to-2024', 'attribution': 'Contains information licensed under the Open Government Licence – British Columbia.', 'description': 'Units with reported or estimated licensed harvest in 2020–2024. Outlines do not establish exact locations, current occupancy or animal density.', 'features': features}
    path = f'species-map/data/harvest-context-{name}.geojson'
    with open(path, 'w') as file:
        json.dump(result, file, separators=(',', ':'))
    print(name, len(features), 'unmatched source units:', ', '.join(missing), 'sha256:', hashlib.sha256(open(path, 'rb').read()).hexdigest(), flush=True)
