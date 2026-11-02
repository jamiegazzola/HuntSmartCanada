"""Build labelled BC broad-scale summer suitability images from the BEI WMS.

The model derives from 1:250,000 ecosystem mapping, not observations or density.
Run from the repository root; requires numpy and Pillow. Only classes 1–3
(very high, high, moderate) are drawn, so uncoloured does not prove absence.
"""
import concurrent.futures
import hashlib
import io
import json
import math
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
import numpy as np
from PIL import Image

LAYER = 'pub:WHSE_TERRESTRIAL_ECOLOGY.BEI_WILDLIFE_HABITAT_MAMLS_MV'
WMS = 'https://openmaps.gov.bc.ca/geo/pub/WHSE_TERRESTRIAL_ECOLOGY.BEI_WILDLIFE_HABITAT_MAMLS_MV/ows'
CATALOGUE = 'https://catalogue.data.gov.bc.ca/dataset/broad-ecosystem-inventory-wildlife-habitat-ratings-interpretations-for-mammals'
SPECS = {
 'mule_deer':['M_ODHE','M_ODHE_CO','M_ODHE_SI'],
 'white_tailed_deer':['M_ODVI'], 'nw_whitetail_kootenay':['M_ODVI_OC'],
 'dakota_whitetail_peace':['M_ODVI_DA'], 'elk':['M_CEEL_NE','M_CEEL_RO'],
 'roosevelt_elk':['M_CEEL_RO'], 'rocky_elk_kootenay':['M_CEEL_NE'],
 'moose':['M_ALAL_AN','M_ALAL_GI','M_ALAL_SH'],
 'northwestern_moose_ne':['M_ALAL_AN'], 'alaskan_moose_nw':['M_ALAL_GI'], 'shiras_moose_flathead':['M_ALAL_SH'],
 'stone_sheep':['M_OVDA_ST'], 'caribou_mountain':['M_RATA_MO'], 'caribou_boreal':['M_RATA_BO'],
}
WIDTH, HEIGHT = 2000, 945

def style(fields):
    rules = []
    # Draw highest-quality class last if a polygon matches more than one taxon.
    for level, color in [(3, '#f4d03f'), (2, '#f48b27'), (1, '#d73027')]:
        tests = ''.join(f'<ogc:PropertyIsEqualTo><ogc:PropertyName>{field}_SLI6WTSUI</ogc:PropertyName><ogc:Literal>{level}</ogc:Literal></ogc:PropertyIsEqualTo>' for field in fields)
        expression = tests if len(fields) == 1 else f'<ogc:Or>{tests}</ogc:Or>'
        rules.append(f'<Rule><ogc:Filter>{expression}</ogc:Filter><PolygonSymbolizer><Fill><CssParameter name="fill">{color}</CssParameter></Fill></PolygonSymbolizer></Rule>')
    return f'<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc"><NamedLayer><Name>{LAYER}</Name><UserStyle><FeatureTypeStyle>{"".join(rules)}</FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>'

def build(spec):
    name, fields = spec
    params = {'SERVICE':'WMS','VERSION':'1.1.1','REQUEST':'GetMap','LAYERS':LAYER,'SRS':'EPSG:4326','BBOX':'-139.2,48.1,-113.8,60.1','WIDTH':WIDTH,'HEIGHT':HEIGHT,'FORMAT':'image/png','TRANSPARENT':'true','SLD_BODY':style(fields)}
    with urlopen(Request(WMS+'?'+urlencode(params), headers={'User-Agent':'HuntSmartCanada/1.0'}), timeout=90) as response:
        if 'image/png' not in response.headers.get('Content-Type',''): raise ValueError(f'{name}: WMS did not return PNG')
        raw=response.read()
    image=np.array(Image.open(io.BytesIO(raw)).convert('RGBA'))
    if image.shape != (HEIGHT, WIDTH, 4): raise ValueError(f'{name}: unexpected dimensions')
    if np.count_nonzero(image[:,:,3]) < 100: return None
    merc=lambda d:math.log(math.tan(math.pi/4+math.radians(d)/2))
    y=np.arange(HEIGHT)+.5
    lat=(2*np.arctan(np.exp(merc(60.1)-y/HEIGHT*(merc(60.1)-merc(48.1))))-np.pi/2)*180/np.pi
    source=np.clip(np.floor((60.1-lat)/12*HEIGHT).astype(int),0,HEIGHT-1)
    out=io.BytesIO();Image.fromarray(image[source,:,:]).save(out,format='PNG',optimize=True)
    return name,fields,raw,out.getvalue(),int(np.count_nonzero(image[:,:,3]))

def main():
    # Limit load on BC's service; fail as a group rather than publish partial files.
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        results=list(executor.map(build,SPECS.items()))
    target=Path('species-map/data'); manifest_path=target/'sources.json'; manifest=json.loads(manifest_path.read_text())
    for result in results:
        if result is None: continue
        name, fields, raw, png, pixels = result
        filename=f'summer-habitat-{name}.png'; (target/filename).write_bytes(png)
        manifest[filename]={'source_urls':[CATALOGUE,'https://a100.gov.bc.ca/pub/acat/public/viewReport.do?reportId=1434'],'source_sha256':[hashlib.sha256(raw).hexdigest()],'output_sha256':hashlib.sha256(png).hexdigest(),'fields':[f'{field}_SLI6WTSUI' for field in fields],'note':'Broad ecosystem habitat suitability model (1:250,000; 2003-era methodology). Classes 1–3 only, not observed animal distribution, confirmed occupancy or density. Coverage and input dates vary.','source_pixels':pixels}
        print(name,pixels,flush=True)
    manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')

if __name__ == '__main__': main()
