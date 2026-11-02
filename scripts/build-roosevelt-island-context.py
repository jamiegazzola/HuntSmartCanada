"""Build a broad Vancouver Island reference, not a local occupancy boundary."""
import hashlib, json
from pathlib import Path
from pyproj import Transformer
from shapely.geometry import Point, mapping, shape
from shapely.ops import transform

root = Path('species-map/data')
land_file = root / 'black-bear-broad-range.geojson'
land = shape(json.loads(land_file.read_text())['features'][0]['geometry'])
matches = [g for g in land.geoms if g.covers(Point(-125, 49.7))]
if len(matches) != 1 or not matches[0].covers(Point(-124, 48.8)):
    raise ValueError('Vancouver Island mask ambiguous')
forward = Transformer.from_crs(4326, 3005, always_xy=True).transform
reverse = Transformer.from_crs(3005, 4326, always_xy=True).transform
original = transform(forward, matches[0]); simplified = original.simplify(100, preserve_topology=True)
if not simplified.is_valid or original.hausdorff_distance(simplified) > 101:
    raise ValueError('Invalid or overly generalized coastline')
if abs(original.area - simplified.area) / original.area > 0.001:
    raise ValueError('Island area changed excessively')
geom = transform(reverse, simplified)
out = root / 'roosevelt-island-range-context.geojson'
report = 'https://www2.gov.bc.ca/assets/gov/environment/plants-animals-and-ecosystems/wildlife/wildlife-habitat/roosevelt_elk_management_plan.pdf'
payload = {'type':'FeatureCollection','source':report,'features':[{'type':'Feature', 'properties':{'label':'Vancouver Island broad range context', 'certainty':'Broad geographic context; not uniform occurrence or density'},'geometry':mapping(geom)}]}
out.write_text(json.dumps(payload,separators=(',',':')))
manifest_path = root / 'sources.json'; manifest = json.loads(manifest_path.read_text())
manifest[out.name] = {'source_urls':[report,'https://catalogue.data.gov.bc.ca/dataset/wildlife-management-units','https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-land/'],'source_sha256':[hashlib.sha256(land_file.read_bytes()).hexdigest()], 'output_sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'note':'Approximate Vancouver Island geographic context for broad species range; not a population, continuous occupancy or a local habitat map. Coast generalized by 100 m; smaller nearby islands excluded.'}
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
print('Built Vancouver Island context; boundary shift',round(original.hausdorff_distance(simplified),2),'m')
