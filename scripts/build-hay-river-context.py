"""Build a Hay River reference line for historical Hay-Zama bison context.

Pass the BC FWA WFS GeoJSON response for GNIS_NAME='Hay River'. The line is a
geographic reference, not an observed bison path, herd boundary, or density.
Requires shapely and pyproj.
"""
import datetime, hashlib, json, sys
from pathlib import Path
import shapely
from pyproj import Transformer
from shapely.geometry import mapping,shape
from shapely.ops import linemerge,transform,unary_union

source=Path(sys.argv[1]);data=json.loads(source.read_text());features=data.get('features',[])
if data.get('numberMatched')!=len(features) or not features:raise ValueError('Incomplete stream response')
lines=[]
for feature in features:
    p=feature['properties']
    if p.get('GNIS_NAME')!='Hay River' or p.get('WATERSHED_GROUP_CODE')!='HAYR' or p.get('BLUE_LINE_KEY')!=359571420:raise ValueError('Unexpected river segment')
    lines.append(shapely.force_2d(shape(feature['geometry'])))
to_m=Transformer.from_crs(4326,3005,always_xy=True).transform;to_deg=Transformer.from_crs(3005,4326,always_xy=True).transform
geom=transform(to_deg,linemerge(unary_union([transform(to_m,g) for g in lines])).simplify(100,preserve_topology=True))
if geom.is_empty or not geom.is_valid or geom.geom_type not in ('LineString','MultiLineString'):raise ValueError('Invalid Hay River geometry')
if not (-121<geom.bounds[0]<-120 and -120.1<geom.bounds[2]<-119.9 and 58<geom.bounds[1]<59 and 58<geom.bounds[3]<59):raise ValueError('Unexpected Hay River location')
out=Path('species-map/data/hay-river-bison-context.geojson');out.write_text(json.dumps({'type':'FeatureCollection','source':'https://www2.gov.bc.ca/assets/gov/environment/plants-animals-and-ecosystems/wildlife-wildlife-habitat/regional-wildlife/northeast-region/bcbisonmanagementplan2000.pdf','attribution':'Contains information licensed under the Open Government Licence – British Columbia.','features':[{'type':'Feature','properties':{'name':'Hay River, BC','context':'2000 BC plan: occasional Hay-Zama bison in Hay River drainage; line is not a range or sighting'},'geometry':mapping(geom)}]},separators=(',',':')))
p=Path('species-map/data/sources.json');m=json.loads(p.read_text());m[out.name]={'retrieved':str(datetime.date.today()),'source_urls':['https://catalogue.data.gov.bc.ca/dataset/freshwater-atlas-stream-network','https://www2.gov.bc.ca/assets/gov/environment/plants-animals-and-ecosystems/wildlife-wildlife-habitat/regional-wildlife/northeast-region/bcbisonmanagementplan2000.pdf'],'source_sha256':[hashlib.sha256(source.read_bytes()).hexdigest()],'output_sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'note':'Hay River line is a reference for the drainage mentioned in the 2000 BC plan, not mapped bison locations, herd range, or density.'};p.write_text(json.dumps(m,indent=2)+'\n')
print('Hay River context bounds:',tuple(round(v,3) for v in geom.bounds))
