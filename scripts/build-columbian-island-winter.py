"""Build partial Columbian black-tailed deer winter habitat for Vancouver Island.

Requires numpy, Pillow, shapely, and the public winter-range builder. BC's
approved-order index, UWR tags, and the existing BC land mask are sources.
This is seasonal habitat on one island, not the complete subspecies range.
"""
import datetime, hashlib, importlib.util, io, json, math
from pathlib import Path
import numpy as np
from PIL import Image
from shapely import contains_xy
from shapely.geometry import Point, shape

module = importlib.util.spec_from_file_location('winter', 'scripts/build-species-winter-ranges.py')
winter = importlib.util.module_from_spec(module); module.loader.exec_module(winter)
raw_index = winter.fetch(winter.ORDERS_URL)
parser = winter.Rows(); parser.feed(raw_index.decode('utf-8'))
orders = {r[2].upper():r[3] for r in parser.rows if len(r)>4 and r[2].upper().startswith('U-1-')}
if len(orders) < 10: raise ValueError('Vancouver Island order index is incomplete')
_, source, png, matched = winter.download(('columbian_blacktail_island', ('M-ODHE', ('black-tailed deer',))), orders)
land_file = Path('species-map/data/black-bear-broad-range.geojson')
land = shape(json.loads(land_file.read_text())['features'][0]['geometry'])
islands = [g for g in land.geoms if g.covers(Point(-125,49.7))]
if len(islands) != 1 or not islands[0].covers(Point(-124,48.8)): raise ValueError('Vancouver Island land mask is ambiguous')
island = islands[0]
im = np.array(Image.open(io.BytesIO(png)).convert('RGBA')); h,w=im.shape[:2]
x=-139.2+(np.arange(w)+.5)*25.4/w
merc=lambda d:math.log(math.tan(math.pi/4+math.radians(d)/2))
lat=(2*np.arctan(np.exp(merc(60.1)-(np.arange(h)+.5)/h*(merc(60.1)-merc(48.1))))-np.pi/2)*180/np.pi
yy,xx=np.where(im[:,:,3]>0)
inside=contains_xy(island,x[xx],lat[yy]); im[yy[~inside],xx[~inside],3]=0
if np.count_nonzero(im[:,:,3])<20: raise ValueError('Island winter habitat appears empty')
out=Path('species-map/data/winter-columbian-blacktail-island.png');Image.fromarray(im).save(out,optimize=True)
p=Path('species-map/data/sources.json');metadata=json.loads(p.read_text());metadata[out.name]={'retrieved':str(datetime.date.today()),'source_urls':[winter.CATALOGUE,winter.ORDERS_URL,'https://a100.gov.bc.ca/pub/eswp/esr.do?id=15272'],'source_sha256':[hashlib.sha256(source).hexdigest(),hashlib.sha256(raw_index).hexdigest(),hashlib.sha256(land_file.read_bytes()).hexdigest()],'output_sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'note':'Island-clipped approved black-tailed deer winter habitat. Partial seasonal context, not the full Columbian range or density. Land mask uses BC WMUs and Natural Earth; see black-bear-broad-range metadata.','candidate_approved_orders':matched}
p.write_text(json.dumps(metadata,indent=2)+'\n')
print('Island winter habitat pixels:',np.count_nonzero(im[:,:,3]))
