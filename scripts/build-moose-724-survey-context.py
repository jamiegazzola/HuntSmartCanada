"""Build an approximate WMU reference for the BC 2023–24 moose survey.

The WMU polygon is geographic context, not the exact 4,865 km² survey area.
The estimate applies to its study area as a whole, not every location.
Requires shapely/pyproj and the repository's BC WMU layer.
"""
import datetime,hashlib,json
from pathlib import Path
from pyproj import Transformer
from shapely.geometry import mapping,shape
from shapely.ops import transform
from shapely.validation import make_valid

source=Path('bc_wmu.geojson');data=json.loads(source.read_text())
features=[f for f in data['features'] if f['properties'].get('WMUNIT_NUM')=='7-24']
if len(features)!=1:raise ValueError('Expected one BC WMU 7-24')
g=shape(features[0]['geometry']);g=make_valid(g) if not g.is_valid else g
to_m=Transformer.from_crs(4326,3005,always_xy=True).transform;to_deg=Transformer.from_crs(3005,4326,always_xy=True).transform
g=transform(to_deg,transform(to_m,g).simplify(100,preserve_topology=True))
if g.is_empty or not g.is_valid:raise ValueError('Invalid WMU geometry')
out=Path('species-map/data/moose-724-survey-context.geojson');report='https://scwa.bc.ca/wp-content/uploads/2024/06/Anderson-et-al.-2024-Moose-SRB-report-for-WMU-724-2023-24.pdf'
out.write_text(json.dumps({'type':'FeatureCollection','source':report,'attribution':'Contains information licensed under the Open Government Licence – British Columbia.','features':[{'type':'Feature','properties':{'wmu':'7-24','survey_year':'2023–24','estimated_density_per_km2':0.55,'density_standard_error':0.07,'estimate':2660,'estimate_standard_error':333,'survey_area_km2':4865},'geometry':mapping(g)}]},separators=(',',':')))
manifest_file=Path('species-map/data/sources.json');manifest=json.loads(manifest_file.read_text());manifest[out.name]={'retrieved':str(datetime.date.today()),'source_urls':['https://catalogue.data.gov.bc.ca/dataset/wildlife-management-units',report],'source_sha256':[hashlib.sha256(source.read_bytes()).hexdigest()],'output_sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'note':'WMU boundary is approximate context for the 2023–24 survey area, not its exact footprint. BC survey estimate 0.55 moose/km² ± 0.07 SE applies to the 4,865 km² survey area, not every point.'};manifest_file.write_text(json.dumps(manifest,indent=2)+'\n')
print('WMU 7-24 survey context built')
