"""Intersect BC thinhorn range with Tatshenshini-Alsek Park for context.

Pass a GeoJSON response for Tatshenshini-Alsek Park from BC's public WFS.
The resulting polygon is not a dedicated Dall's sheep range or density map.
Requires shapely and the repository's BC sheep registry distribution layer.
"""
import datetime,hashlib,json,sys
from pathlib import Path
from shapely.geometry import mapping,shape

park_path=Path(sys.argv[1]);park_source=json.loads(park_path.read_text())
features=park_source.get('features',[])
if len(features)!=1 or features[0]['properties'].get('PROTECTED_LANDS_NAME')!='TATSHENSHINI-ALSEK PARK':raise ValueError('Expected exactly Tatshenshini-Alsek Park')
park=shape(features[0]['geometry']);sheep_path=Path('species-map/data/sheep-ranges.geojson');sheep=json.loads(sheep_path.read_text())
matches=[f for f in sheep['features'] if f['properties'].get('SPECIES_CODE')=='M-OVDA']
if len(matches)!=1:raise ValueError('Expected one BC thinhorn registry feature')
geometry=shape(matches[0]['geometry']).intersection(park)
if geometry.is_empty or not geometry.is_valid or geometry.geom_type not in ('Polygon','MultiPolygon'):raise ValueError('Invalid intersection')
out=Path('species-map/data/dall-tatshenshini-context.geojson')
out.write_text(json.dumps({'type':'FeatureCollection','source':'https://bcparks.ca/tatshenshini-alsek-park/','attribution':'Contains information licensed under the Open Government Licence – British Columbia.','features':[{'type':'Feature','properties':{'description':'BC thinhorn range within Tatshenshini-Alsek Park'},'geometry':mapping(geometry)}]},separators=(',',':')))
path=Path('species-map/data/sources.json');manifest=json.loads(path.read_text());manifest[out.name]={'retrieved':str(datetime.date.today()),'source_urls':['https://bcparks.ca/tatshenshini-alsek-park/','https://catalogue.data.gov.bc.ca/dataset/bc-wild-mountain-sheep-registry-distribution','https://catalogue.data.gov.bc.ca/dataset/bc-parks-ecological-reserves-and-protected-areas'],'source_sha256':[hashlib.sha256(park_path.read_bytes()).hexdigest(),hashlib.sha256(sheep_path.read_bytes()).hexdigest()],'output_sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'note':'BC thinhorn registry range intersected with Tatshenshini-Alsek Park. BC Parks reports Dall’s sheep in two park ranges. The intersection is broad context, not a Dall-specific boundary, complete range, or density.'};path.write_text(json.dumps(manifest,indent=2)+'\n')
print('Dall context bounds:',tuple(round(v,3) for v in geometry.bounds))
