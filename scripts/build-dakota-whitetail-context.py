"""Build Peace-region white-tail harvest evidence, not subspecies locations.

Pass the BC WMU harvest CSV. BC says Peace-region white-tails may be Dakota;
the harvest records are species-level and cannot establish subspecies or local
density. Requires shapely and the repository's BC WMU boundaries.
"""
import csv, datetime, hashlib, json, sys
from collections import defaultdict
from pathlib import Path
from shapely.geometry import mapping, shape
from shapely.validation import make_valid

csv_path=Path(sys.argv[1]);wmu_path=Path('bc_wmu.geojson')
positive=defaultdict(set)
def number(value):
    try:return float(value)
    except (ValueError,TypeError):return 0
with csv_path.open(encoding='utf-8-sig',newline='') as file:
    for row in csv.DictReader(file):
        if row['SPECIES']!='DEWT' or row['REGION']!='7B' or not 2020<=int(row['HUNT YEAR'])<=2024:continue
        unit=row['WMU'].strip()
        # BC uses 780 for an unknown WMU within region 7B, not a mapped unit.
        if unit == '780':continue
        if not unit.isdigit() or len(unit)<3 or int(unit[-2:]) in (0,99):continue
        if number(row['RESIDENT KILLS'])<=0 and number(row['NON-RESIDENT KILLS'])<=0:continue
        positive[unit[:-2]+'-'+str(int(unit[-2:]))].add(int(row['HUNT YEAR']))
wmus={f['properties']['WMUNIT_NUM']:f for f in json.loads(wmu_path.read_text())['features']};features=[]
for unit,years in sorted(positive.items()):
    if unit not in wmus:raise ValueError('Unmatched WMU '+unit)
    g=shape(wmus[unit]['geometry']);g=make_valid(g) if not g.is_valid else g;g=g.simplify(.002,preserve_topology=True)
    if g.is_empty or not g.is_valid:raise ValueError('Invalid WMU '+unit)
    features.append({'type':'Feature','properties':{'wmu':unit,'harvest_years':sorted(years)},'geometry':mapping(g)})
if not features:raise ValueError('No qualifying Peace-region harvest records')
out=Path('species-map/data/dakota-whitetail-peace-context.geojson');out.write_text(json.dumps({'type':'FeatureCollection','source':'https://catalogue.data.gov.bc.ca/dataset/big-game-harvest-statistics-1976-to-2024','attribution':'Contains information licensed under the Open Government Licence – British Columbia.','features':features},separators=(',',':')))
path=Path('species-map/data/sources.json');m=json.loads(path.read_text());m[out.name]={'retrieved':str(datetime.date.today()),'source_urls':['https://catalogue.data.gov.bc.ca/dataset/big-game-harvest-statistics-1976-to-2024','https://catalogue.data.gov.bc.ca/dataset/wildlife-management-units','https://www.env.gov.bc.ca/wld/documents/whttail.pdf'],'source_sha256':[hashlib.sha256(csv_path.read_bytes()).hexdigest(),hashlib.sha256(wmu_path.read_bytes()).hexdigest()],'output_sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'note':'2020–2024 positive species-level harvest in Peace WMUs. BC says Peace white-tails may be Dakota; harvest is not subspecies-specific, precise location, or density.'};path.write_text(json.dumps(m,indent=2)+'\n')
print('Peace white-tail harvest context:',len(features),'WMUs')
