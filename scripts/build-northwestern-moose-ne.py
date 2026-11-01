"""Build partial Northwestern moose winter habitat in mapped northeast units.

Clip BC order U-9-001 to full WMUs named in the provincial Northeast moose
habitat report, which identifies A. a. andersoni in the project area. This is
partial seasonal habitat, not a boundary for the whole subspecies or density.
Requires numpy, Pillow, shapely and the shared winter-range builder.
"""
import datetime, hashlib, importlib.util, io, json, math
from pathlib import Path
import numpy as np
from PIL import Image
from shapely import contains_xy
from shapely.geometry import shape
from shapely.ops import unary_union

spec=importlib.util.spec_from_file_location('winter','scripts/build-species-winter-ranges.py')
winter=importlib.util.module_from_spec(spec);spec.loader.exec_module(winter)
raw_index=winter.fetch(winter.ORDERS_URL);parser=winter.Rows();parser.feed(raw_index.decode('utf-8'))
orders={r[2].upper():r[3] for r in parser.rows if len(r)>4 and r[2].upper()=='U-9-001'}
if len(orders)!=1 or 'moose' not in orders['U-9-001'].lower():raise ValueError('Expected moose order missing')
_,raw,png,matched=winter.download(('northwestern_moose',('M-ALAM',('moose',))),orders)
wmu_path=Path('bc_wmu.geojson');wmu=json.loads(wmu_path.read_text())
units={'7-19','7-20','7-21','7-22','7-28','7-31','7-32','7-33','7-34','7-35','7-36','7-41','7-42','7-43','7-44','7-45','7-46','7-47','7-48','7-57','7-58'}
features=[f for f in wmu['features'] if f['properties']['WMUNIT_NUM'] in units]
if len(features)!=len(units):raise ValueError('WMU selection is incomplete')
region=unary_union([shape(f['geometry']) for f in features]);im=np.array(Image.open(io.BytesIO(png)).convert('RGBA'));h,w=im.shape[:2]
x=-139.2+(np.arange(w)+.5)*25.4/w;merc=lambda d:math.log(math.tan(math.pi/4+math.radians(d)/2))
lat=(2*np.arctan(np.exp(merc(60.1)-(np.arange(h)+.5)/h*(merc(60.1)-merc(48.1))))-np.pi/2)*180/np.pi
yy,xx=np.where(im[:,:,3]>0);inside=contains_xy(region,x[xx],lat[yy]);im[yy[~inside],xx[~inside],3]=0
if np.count_nonzero(im[:,:,3])<20:raise ValueError('Northeast moose habitat appears empty')
out=Path('species-map/data/winter-northwestern-moose-ne.png');Image.fromarray(im).save(out,optimize=True)
path=Path('species-map/data/sources.json');metadata=json.loads(path.read_text());metadata[out.name]={'retrieved':str(datetime.date.today()),'source_urls':[winter.CATALOGUE,winter.ORDERS_URL,'https://www2.gov.bc.ca/assets/gov/environment/natural-resource-stewardship/cumulative-effects/northeast-region/ne_rsea_moose_methods_report_ne_3dec2020.pdf','https://catalogue.data.gov.bc.ca/dataset/wildlife-management-units'],'source_sha256':[hashlib.sha256(raw).hexdigest(),hashlib.sha256(raw_index).hexdigest(),hashlib.sha256(wmu_path.read_bytes()).hexdigest()],'output_sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'note':'U-9-001 moose habitat clipped to full Northeast project WMUs listed in the 2020 report. Excludes the partial project coverage in 7-56. Partial seasonal habitat, not complete subspecies range or density.','candidate_approved_orders':matched}
path.write_text(json.dumps(metadata,indent=2)+'\n')
print('Northeast moose winter habitat pixels:',np.count_nonzero(im[:,:,3]))
