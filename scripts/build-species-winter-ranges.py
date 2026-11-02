"""Build approved winter-habitat overlays from BC's WMS and order index.

Requires numpy and Pillow. Each order must also name the species in BC's
approved-order index; species tags alone contain known false positives.
Specified-area disease buffers are excluded. This is seasonal habitat, not
complete range or density. Run from repository root.
"""
import concurrent.futures, datetime, hashlib, io, json, math
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
import numpy as np
from PIL import Image

ORDERS_URL = 'https://www2.gov.bc.ca/gov/content/environment/natural-resource-stewardship/laws-policies-standards-guidance/legislation-regulation/forest-range-practices-act/regulations-supporting-frpa/government-actions-regulation/approved-ungulate-winter-ranges-uwrs'
WMS = 'https://openmaps.gov.bc.ca/geo/pub/WHSE_WILDLIFE_MANAGEMENT.WCP_UNGULATE_WINTER_RANGE_SP/ows'
LAYER = 'pub:WHSE_WILDLIFE_MANAGEMENT.WCP_UNGULATE_WINTER_RANGE_SP'
CATALOGUE = 'https://catalogue.data.gov.bc.ca/dataset/ungulate-winter-range-approved'
SPECS = {'mule_deer':('M-ODHE', ('mule deer','black-tailed deer')), 'white_tailed_deer':('M-ODVI', ('white-tailed deer',)), 'elk':('M-CEEL', ('elk',)), 'moose':('M-ALAM', ('moose',)), 'mountain_goat':('M-ORAM', ('mountain goat',))}
STYLE = f'''<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld"><NamedLayer><Name>{LAYER}</Name><UserStyle><FeatureTypeStyle><Rule><PolygonSymbolizer><Fill><CssParameter name="fill">#00aaff</CssParameter></Fill></PolygonSymbolizer></Rule></FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>'''
DEST = Path('species-map/data')

class Rows(HTMLParser):
    def __init__(self): super().__init__(); self.row=None; self.cell=None; self.rows=[]
    def handle_starttag(self, tag, attrs):
        if tag == 'tr': self.row=[]
        elif tag in ('td','th') and self.row is not None: self.cell=[]
    def handle_data(self, data):
        if self.cell is not None: self.cell.append(data)
    def handle_endtag(self, tag):
        if tag in ('td','th') and self.cell is not None: self.row.append(' '.join(''.join(self.cell).split())); self.cell=None
        elif tag == 'tr' and self.row is not None: self.rows.append(self.row); self.row=None

def fetch(url):
    with urlopen(Request(url, headers={'User-Agent':'HuntSmartCanada/1.0'}), timeout=180) as response: return response.read()

def download(item, orders):
    name, (code, names) = item
    matched = sorted(number for number, label in orders.items() if any(n in label.lower() for n in names))
    if not matched: raise ValueError(f'{name}: no approved orders')
    quoted = ','.join("'"+n.lower()+"'" for n in matched)
    where = f"UWR_NUMBER IN ({quoted}) AND (SPECIES_1 LIKE '%{code}%' OR SPECIES_2 LIKE '%{code}%') AND (FEATURE_CODE <> 'FF84630400' OR FEATURE_CODE IS NULL)"
    params = {'SERVICE':'WMS','VERSION':'1.1.1','REQUEST':'GetMap','LAYERS':LAYER,'SRS':'EPSG:4326','BBOX':'-139.2,48.1,-113.8,60.1','WIDTH':2600,'HEIGHT':1228,'FORMAT':'image/png','TRANSPARENT':'true','SLD_BODY':STYLE,'CQL_FILTER':where}
    raw = fetch(WMS+'?'+urlencode(params))
    image = np.array(Image.open(io.BytesIO(raw)).convert('RGBA'))
    if image.shape != (1228,2600,4): raise ValueError(f'{name}: incorrect dimensions')
    north,south=60.1,48.1
    merc=lambda d:math.log(math.tan(math.pi/4+math.radians(d)/2))
    rows=np.arange(image.shape[0])+.5
    lat=(2*np.arctan(np.exp(merc(north)-rows/image.shape[0]*(merc(north)-merc(south))))-np.pi/2)*180/np.pi
    source=np.clip(np.floor((north-lat)/(north-south)*image.shape[0]).astype(int),0,image.shape[0]-1)
    alpha=image[source,:,3]
    if np.count_nonzero(alpha)<20: raise ValueError(f'{name}: empty winter habitat')
    out=np.zeros_like(image);out[:,:,0]=57;out[:,:,1]=167;out[:,:,2]=208;out[:,:,3]=alpha
    encoded=io.BytesIO();Image.fromarray(out).save(encoded,format='PNG',optimize=True)
    return name,raw,encoded.getvalue(),matched

def main():
    raw_orders=fetch(ORDERS_URL); parser=Rows();parser.feed(raw_orders.decode('utf-8'))
    orders={r[2].upper():r[3] for r in parser.rows if len(r)>4 and r[2].upper().startswith('U-')}
    if len(orders)<90: raise ValueError('The approved-order index appears incomplete; no layers written')
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool: results=list(pool.map(lambda item:download(item,orders),SPECS.items()))
    manifest_path=DEST/'sources.json';manifest=json.loads(manifest_path.read_text())
    for name,raw,png,matched in results:
        filename=f'winter-{name}.png';(DEST/filename).write_bytes(png)
        manifest[filename]={'retrieved':str(datetime.date.today()),'source_urls':[CATALOGUE,ORDERS_URL], 'source_sha256':[hashlib.sha256(raw).hexdigest(),hashlib.sha256(raw_orders).hexdigest()], 'output_sha256':hashlib.sha256(png).hexdigest(), 'note':'Approved order and matching species tag; excludes specified-area disease buffers. Seasonal habitat, incomplete and not density.', 'candidate_approved_orders':matched}
        print(filename, len(matched),'approved orders',hashlib.sha256(png).hexdigest(),flush=True)
    manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')

if __name__=='__main__': main()
