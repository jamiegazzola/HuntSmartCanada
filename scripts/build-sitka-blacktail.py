"""Build partial Sitka black-tailed deer evidence from public BC sources.

Haida Gwaii is a broad range context, not density. The U-5-005 layer is
conservatively clipped to 52°N to avoid the approximate Rivers Inlet transition.
Requires numpy, Pillow, shapely and the winter-range builder.
"""
import datetime, hashlib, importlib.util, io, json, math
from pathlib import Path
import numpy as np
from PIL import Image
from shapely.geometry import MultiPolygon, mapping, shape

spec=importlib.util.spec_from_file_location('winter','scripts/build-species-winter-ranges.py')
winter=importlib.util.module_from_spec(spec);spec.loader.exec_module(winter)
raw_index=winter.fetch(winter.ORDERS_URL);parser=winter.Rows();parser.feed(raw_index.decode('utf-8'))
orders={r[2].upper():r[3] for r in parser.rows if len(r)>4 and r[2].upper()=='U-5-005'}
if len(orders)!=1 or 'black-tailed deer' not in orders['U-5-005'].lower(): raise ValueError('Order is missing or does not list black-tailed deer')
_,raw,png,matched=winter.download(('sitka_blacktail',('M-ODHE',('black-tailed deer',))),orders)
im=np.array(Image.open(io.BytesIO(png)).convert('RGBA'));h=im.shape[0]
merc=lambda d:math.log(math.tan(math.pi/4+math.radians(d)/2))
latitude=(2*np.arctan(np.exp(merc(60.1)-(np.arange(h)+.5)/h*(merc(60.1)-merc(48.1))))-np.pi/2)*180/np.pi
im[latitude<52,:,3]=0
if np.count_nonzero(im[:,:,3])<20: raise ValueError('Northern winter habitat appears empty')
output=Path('species-map/data/winter-sitka-blacktail.png');Image.fromarray(im).save(output,optimize=True)
land_path=Path('species-map/data/black-bear-broad-range.geojson');land=shape(json.loads(land_path.read_text())['features'][0]['geometry'])
parts=[g for g in land.geoms if -134<g.centroid.x<-131 and 51.7<g.centroid.y<54.5]
if len(parts)<2 or not any(g.area>.5 for g in parts): raise ValueError('Haida Gwaii land mask is incomplete')
range_path=Path('species-map/data/sitka-blacktail-haida.geojson')
range_path.write_text(json.dumps({'type':'FeatureCollection','source':'https://a100.gov.bc.ca/pub/eswp/esr.do?id=15272','attribution':'Contains information licensed under the Open Government Licence – British Columbia.','features':[{'type':'Feature','properties':{'description':'Haida Gwaii broad range context'},'geometry':mapping(MultiPolygon(parts))}]},separators=(',',':')))
manifest_path=Path('species-map/data/sources.json');manifest=json.loads(manifest_path.read_text());common=[winter.CATALOGUE,winter.ORDERS_URL,'https://a100.gov.bc.ca/pub/eswp/esr.do?id=15272']
manifest[output.name]={'retrieved':str(datetime.date.today()),'source_urls':common,'source_sha256':[hashlib.sha256(raw).hexdigest(),hashlib.sha256(raw_index).hexdigest()],'output_sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'note':'One black-tailed deer winter order, conservatively clipped north of 52°N. Incomplete seasonal habitat, not density.','candidate_approved_orders':matched}
manifest[range_path.name]={'retrieved':str(datetime.date.today()),'source_urls':[common[-1],'https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-land/'],'source_sha256':[hashlib.sha256(land_path.read_bytes()).hexdigest()],'output_sha256':hashlib.sha256(range_path.read_bytes()).hexdigest(),'note':'Broad Haida Gwaii range context from the BC account; land mask derived from BC WMUs and Natural Earth. Not fine-scale occurrence or density.'}
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
print('Northern winter habitat pixels:',np.count_nonzero(im[:,:,3]),'Haida island polygons:',len(parts))
