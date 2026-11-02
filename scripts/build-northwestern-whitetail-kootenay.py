"""Build partial Kootenay white-tail winter habitat with approximate taxonomy.

BC describes northwestern white-tail broadly west of the Rockies. This regional
view is not a genetically verified boundary, complete range or density. Requires
numpy, Pillow, and the shared BC winter-range builder.
"""
import datetime, hashlib, importlib.util, json
from pathlib import Path

spec=importlib.util.spec_from_file_location('winter','scripts/build-species-winter-ranges.py')
winter=importlib.util.module_from_spec(spec);spec.loader.exec_module(winter)
raw_index=winter.fetch(winter.ORDERS_URL);parser=winter.Rows();parser.feed(raw_index.decode('utf-8'))
orders={r[2].upper():r[3] for r in parser.rows if len(r)>4 and r[2].upper().startswith('U-4-')}
if len(orders)<8:raise ValueError('Kootenay order index is incomplete')
_,raw,png,matched=winter.download(('northwestern_whitetail_kootenay',('M-ODVI',('white-tailed deer',))),orders)
if not {'U-4-001','U-4-006','U-4-008'}.issubset(set(matched)):raise ValueError('Expected white-tail orders missing')
out=Path('species-map/data/winter-nw-whitetail-kootenay.png');out.write_bytes(png)
path=Path('species-map/data/sources.json');manifest=json.loads(path.read_text());manifest[out.name]={'retrieved':str(datetime.date.today()),'source_urls':[winter.CATALOGUE,winter.ORDERS_URL,'https://a100.gov.bc.ca/pub/acat/documents/r40140/Wildlife_Map_Nov15_1385585787452_5583657250.pdf'],'source_sha256':[hashlib.sha256(raw).hexdigest(),hashlib.sha256(raw_index).hexdigest()],'output_sha256':hashlib.sha256(png).hexdigest(),'note':'Kootenay white-tailed deer winter habitat; northwestern subspecies assignment is approximate and not genetically verified. Partial seasonal habitat, not complete range or density.','candidate_approved_orders':matched}
path.write_text(json.dumps(manifest,indent=2)+'\n')
print('White-tailed deer Kootenay candidate orders:',', '.join(matched))
