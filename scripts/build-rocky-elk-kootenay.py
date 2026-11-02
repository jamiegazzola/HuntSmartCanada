"""Build partial Rocky Mountain elk winter habitat in the Kootenay region.

The result is not full subspecies range or animal density. Requires numpy and
Pillow, and uses the shared BC approved winter-range builder.
"""
import datetime, hashlib, importlib.util, json
from pathlib import Path

spec=importlib.util.spec_from_file_location('winter','scripts/build-species-winter-ranges.py')
winter=importlib.util.module_from_spec(spec);spec.loader.exec_module(winter)
raw_index=winter.fetch(winter.ORDERS_URL);parser=winter.Rows();parser.feed(raw_index.decode('utf-8'))
orders={r[2].upper():r[3] for r in parser.rows if len(r)>4 and r[2].upper().startswith('U-4-')}
if len(orders)<8: raise ValueError('Kootenay approved-order index is incomplete')
_,raw,png,matched=winter.download(('rocky_elk_kootenay',('M-CEEL',('elk',))),orders)
if not {'U-4-001','U-4-006','U-4-008'}.issubset(set(matched)): raise ValueError('Expected elk orders are missing')
output=Path('species-map/data/winter-rocky-elk-kootenay.png');output.write_bytes(png)
manifest_file=Path('species-map/data/sources.json');manifest=json.loads(manifest_file.read_text())
manifest[output.name]={'retrieved':str(datetime.date.today()),'source_urls':[winter.CATALOGUE,winter.ORDERS_URL,'https://a100.gov.bc.ca/pub/acat/documents/r1538/whr_4154_mceen_1096655795849_b21dacd4faed4d9b98b5dc6d62b0d762.pdf'],'source_sha256':[hashlib.sha256(raw).hexdigest(),hashlib.sha256(raw_index).hexdigest()],'output_sha256':hashlib.sha256(png).hexdigest(),'note':'Kootenay approved elk winter areas only. Rocky Mountain elk occur more broadly. Partial seasonal habitat, not density.','candidate_approved_orders':matched}
manifest_file.write_text(json.dumps(manifest,indent=2)+'\n')
print('Rocky Mountain elk Kootenay candidate orders:',', '.join(matched))
