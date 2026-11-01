"""Build coarse moose harvest context near two reported subspecies areas.

Pass BC's WMU harvest CSV. The provincial source reports only moose species,
not subspecies or locations inside a WMU. The selected units are only coarse
geographic context based on E-Fauna BC, not subspecies boundaries or density.
Requires shapely and the repository's BC WMU geometry.
"""
import csv,datetime,hashlib,json,sys
from collections import defaultdict
from pathlib import Path
from shapely.geometry import shape,mapping
from shapely.validation import make_valid

source=Path(sys.argv[1]);wmu_path=Path('bc_wmu.geojson')
groups={'alaskan_moose_nw':{'6-25','6-27','6-28','6-29'},'shiras_moose_flathead':{'4-1'}}
positive=defaultdict(set)
def num(v):
    try:return float(v)
    except (ValueError,TypeError):return 0
with source.open(encoding='utf-8-sig',newline='') as file:
    for r in csv.DictReader(file):
        if r['SPECIES']!='MOOS' or not 2020<=int(r['HUNT YEAR'])<=2024:continue
        raw=r['WMU'].strip()
        if not raw.isdigit() or len(raw)<3:continue
        unit=raw[:-2]+'-'+str(int(raw[-2:]))
        if num(r['RESIDENT KILLS'])>0 or num(r['NON-RESIDENT KILLS'])>0:positive[unit].add(int(r['HUNT YEAR']))
wmus={f['properties']['WMUNIT_NUM']:f for f in json.loads(wmu_path.read_text())['features']}
manifest_path=Path('species-map/data/sources.json');manifest=json.loads(manifest_path.read_text())
for name,units in groups.items():
    features=[]
    for unit in sorted(units):
        if unit not in wmus:raise ValueError('Missing WMU '+unit)
        if unit not in positive:continue
        geom=shape(wmus[unit]['geometry']);geom=make_valid(geom) if not geom.is_valid else geom;geom=geom.simplify(.002,preserve_topology=True)
        if geom.is_empty or not geom.is_valid:raise ValueError('Invalid WMU '+unit)
        features.append({'type':'Feature','properties':{'wmu':unit,'harvest_years':sorted(positive[unit])},'geometry':mapping(geom)})
    if not features:raise ValueError('No mapped harvest evidence for '+name)
    out=Path('species-map/data/'+name+'-harvest-context.geojson');out.write_text(json.dumps({'type':'FeatureCollection','source':'https://catalogue.data.gov.bc.ca/dataset/big-game-harvest-statistics-1976-to-2024','attribution':'Contains information licensed under the Open Government Licence – British Columbia.','features':features},separators=(',',':')))
    manifest[out.name]={'retrieved':str(datetime.date.today()),'source_urls':['https://catalogue.data.gov.bc.ca/dataset/big-game-harvest-statistics-1976-to-2024','https://catalogue.data.gov.bc.ca/dataset/wildlife-management-units','https://linnet.geog.ubc.ca/efauna/Atlas/Atlas.aspx?sciname=Alces+alces'],'source_sha256':[hashlib.sha256(source.read_bytes()).hexdigest(),hashlib.sha256(wmu_path.read_bytes()).hexdigest()],'output_sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'note':'Positive species-level licensed harvest in selected WMUs during 2020–2024. Subspecies inferred only as coarse regional context; data do not identify subspecies, exact locations or density.'}
    print(name,len(features),'WMUs')
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
