"""Build approximate WMU context for BC's 2025 Lake Revelstoke moose survey."""
import datetime, hashlib, json
from pathlib import Path
from pyproj import Transformer
from shapely.geometry import mapping, shape
from shapely.ops import transform, unary_union
from shapely.validation import make_valid

source = Path('bc_wmu.geojson')
features = json.loads(source.read_text())['features']
selected = [f for f in features if f['properties'].get('WMUNIT_NUM') in ('4-38','4-39')]
if len(selected) != 2: raise ValueError('Expected both Revelstoke WMUs')
geometries = [shape(f['geometry']) for f in selected]
geom = unary_union([g if g.is_valid else make_valid(g) for g in geometries])
forward = Transformer.from_crs(4326,3005,always_xy=True).transform
reverse = Transformer.from_crs(3005,4326,always_xy=True).transform
geom = transform(reverse,transform(forward,geom).simplify(100,preserve_topology=True))
if geom.is_empty or not geom.is_valid: raise ValueError('Invalid boundary')
report = 'https://a100.gov.bc.ca/pub/siwe/details.do?projectId=2531'
out = Path('species-map/data/moose-revelstoke-2025-context.geojson')
out.write_text(json.dumps({'type':'FeatureCollection','source':report,'attribution':'Contains information licensed under the Open Government Licence – British Columbia.','features':[{'type':'Feature','properties':{'wmu':'4-38 and 4-39','year':2025,'estimate':550,'method':'2023 estimate scaled using trend in eight consistently sampled survey units','boundary':'WMU reference only; not exact study area'},'geometry':mapping(geom)}]},separators=(',',':')))
manifest_path = Path('species-map/data/sources.json'); manifest = json.loads(manifest_path.read_text())
manifest[out.name] = {'retrieved':str(datetime.date.today()),'source_urls':['https://catalogue.data.gov.bc.ca/dataset/wildlife-management-units',report], 'source_sha256':[hashlib.sha256(source.read_bytes()).hexdigest()], 'output_sha256':hashlib.sha256(out.read_bytes()).hexdigest(), 'note':'Approximate management-unit context only, not exact survey boundary or uniform density. BC 2025 estimate 550 scales the 2023 estimate using trends from eight consistently sampled survey units.'}
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
print('Built Revelstoke moose 2025 WMU reference')
