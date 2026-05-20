import json
from pyproj import Transformer

transformer = Transformer.from_crs("EPSG:3005", "EPSG:4326", always_xy=True)

def convert_coords(coords):
    if isinstance(coords[0], list):
        return [convert_coords(c) for c in coords]
    lon, lat = transformer.transform(coords[0], coords[1])
    return [lon, lat]

with open('bc_wmu.geojson') as f:
    data = json.load(f)

new_features = []
for feature in data['features']:
    wmu_id = feature['properties'].get('WILDLIFE_MGMT_UNIT_ID', '')
    new_geom = {
        'type': feature['geometry']['type'],
        'coordinates': convert_coords(feature['geometry']['coordinates'])
    }
    new_features.append({
        'type': 'Feature',
        'properties': {
            'WMUNIT_NUM': wmu_id,
            'wmu_id': wmu_id,
            'REGION_RESPONSIBLE_NAME': feature['properties'].get('REGION_RESPONSIBLE_NAME', ''),
            'GAME_MANAGEMENT_ZONE_NAME': feature['properties'].get('GAME_MANAGEMENT_ZONE_NAME', ''),
            'REGION_RESPONSIBLE_ID': feature['properties'].get('REGION_RESPONSIBLE_ID', ''),
        },
        'geometry': new_geom
    })

with open('bc_wmu.geojson', 'w') as f:
    json.dump({'type': 'FeatureCollection', 'features': new_features}, f)

print(f"Done! Converted {len(new_features)} WMUs")
print(f"Sample: {new_features[0]['properties']}")
print(f"Sample coord: {new_features[0]['geometry']['coordinates'][0][0]}")
