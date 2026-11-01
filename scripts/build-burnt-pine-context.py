"""Build the Burnt Pine former herd boundary as limited caribou context.

Pass BC's GeoJSON response for HERD_NAME='Burnt Pine'. The resident herd is
extirpated, but a 2024 report observed neighbouring Kennedy Siding animals
within part of the old range. The boundary is not a current occupancy polygon
or density estimate. Requires shapely and pyproj.
"""
import datetime,hashlib,json,sys
from pathlib import Path
from pyproj import Transformer
from shapely.geometry import mapping,shape
from shapely.ops import transform

source=Path(sys.argv[1]);data=json.loads(source.read_text());features=data.get('features',[])
if data.get('type')!='FeatureCollection' or len(features)!=1:raise ValueError('Expected one Burnt Pine boundary')
p=features[0]['properties']
if p.get('HERD_NAME')!='Burnt Pine' or p.get('HERD_STATUS')!='Extirpated':raise ValueError('Unexpected herd or status')
to_m=Transformer.from_crs(4326,3005,always_xy=True).transform;to_deg=Transformer.from_crs(3005,4326,always_xy=True).transform
geom=transform(to_deg,transform(to_m,shape(features[0]['geometry'])).simplify(20,preserve_topology=True))
if geom.is_empty or not geom.is_valid or geom.geom_type not in ('Polygon','MultiPolygon'):raise ValueError('Invalid herd boundary')
out=Path('species-map/data/burnt-pine-context.geojson');out.write_text(json.dumps({'type':'FeatureCollection','source':'https://catalogue.data.gov.bc.ca/dataset/caribou-herd-locations-for-bc','attribution':'Contains information licensed under the Open Government Licence – British Columbia.','features':[{'type':'Feature','properties':{'herd':'Burnt Pine','status':'Resident herd extirpated; adjacent herd observed in part of range in 2024'},'geometry':mapping(geom)}]},separators=(',',':')))
path=Path('species-map/data/sources.json');manifest=json.loads(path.read_text());manifest[out.name]={'retrieved':str(datetime.date.today()),'source_urls':['https://catalogue.data.gov.bc.ca/dataset/caribou-herd-locations-for-bc','https://www2.gov.bc.ca/assets/gov/environment/plants-animals-and-ecosystems/wildlife-wildlife-habitat/caribou/bc_caribou_herds_population_estimates.pdf','https://mlibwildlife.ca/wp-content/uploads/2025/06/Kennedy-Siding-Feeding-2024-25.pdf'],'source_sha256':[hashlib.sha256(source.read_bytes()).hexdigest()],'output_sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'note':'Former Burnt Pine management boundary only. Resident herd extirpated; Kennedy Siding animals observed in part of former range in 2024. Not a current occupancy polygon or density.'};path.write_text(json.dumps(manifest,indent=2)+'\n')
print('Burnt Pine context bounds:',tuple(round(v,3) for v in geom.bounds))
