"""Build partial regional bighorn winter habitat with approximate taxonomy.

BC's sheep records describe Rocky Mountain bighorns in the East Kootenay and
California bighorns primarily in interior watersheds including Kettle-Granby.
Orders are species-level, so subspecies assignments remain approximate.
Requires numpy, Pillow and the shared approved winter-range builder.
"""
import datetime, hashlib, importlib.util, json
from pathlib import Path
spec=importlib.util.spec_from_file_location('winter','scripts/build-species-winter-ranges.py')
winter=importlib.util.module_from_spec(spec);spec.loader.exec_module(winter)
index=winter.fetch(winter.ORDERS_URL);parser=winter.Rows();parser.feed(index.decode('utf-8'))
all_orders={r[2].upper():r[3] for r in parser.rows if len(r)>4 and r[2].upper().startswith('U-')}
groups={'rocky_bighorn_kootenay':['U-4-006','U-4-008'],'california_bighorn_boundary':['U-8-010']}
results=[]
for name,ids in groups.items():
    if any(x not in all_orders or 'bighorn' not in all_orders[x].lower() for x in ids):raise ValueError(name+': order missing')
    orders={x:all_orders[x] for x in ids};_,raw,png,matched=winter.download((name,('M-OVCA',('bighorn',))),orders)
    results.append((name,raw,png,matched))
path=Path('species-map/data/sources.json');manifest=json.loads(path.read_text())
for name,raw,png,matched in results:
    out=Path('species-map/data/winter-'+name+'.png');out.write_bytes(png)
    manifest[out.name]={'retrieved':str(datetime.date.today()),'source_urls':[winter.CATALOGUE,winter.ORDERS_URL,'https://nrs.objectstore.gov.bc.ca/lteczn/662032e3f460520022ad3579/Appendix%202-Q_Ungulate%20Status%20in%20the%20Record%20Ridge%20Study%20Area%20%28Keefer%20Ecological%20Dece%202017%29.pdf'],'source_sha256':[hashlib.sha256(raw).hexdigest(),hashlib.sha256(index).hexdigest()],'output_sha256':hashlib.sha256(png).hexdigest(),'note':'Regional bighorn winter habitat, with approximate subspecies assignment from regional accounts. Incomplete seasonal habitat, not a verified subspecies boundary or density.','candidate_approved_orders':matched}
    print(name,', '.join(matched))
path.write_text(json.dumps(manifest,indent=2)+'\n')
