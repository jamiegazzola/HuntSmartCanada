from pathlib import Path

p = Path('scripts/build_bc_abundance_v4.py')
s = p.read_text(encoding='utf-8')

old = "print('Downloading WSI Survey Summary polygons...', flush=True)\nwsi = query_layer(INV, 16)"
new = "print('Skipping WSI Survey Summary in v4 because BC endpoint is unstable; other modern layers are embedded locally.', flush=True)\nwsi = []"
if old not in s:
    raise RuntimeError('WSI patch target not found')
s = s.replace(old, new)

start = s.index("print('Downloading WMU boundaries...', flush=True)")
end = s.index("print('Downloading 2020-2024 harvest CSV...', flush=True)")
replacement = r'''print('Loading HuntSmart local simplified WMU boundaries...', flush=True)
from pyproj import Geod
raw_js=open('bc-wmu-geojson.js',encoding='utf-8').read()
m=re.search(r'=\s*(\{.*\})\s*;?\s*$', raw_js, re.S)
if not m: raise RuntimeError('Could not parse bc-wmu-geojson.js')
wmu_features=json.loads(m.group(1)).get('features',[])
report['sources']['wmu_boundaries']={'features':len(wmu_features),'source':'HuntSmart local bc-wmu-geojson.js (simplified BC WMU geometry)'}
wmu_geom={}; wmu_area={}; wmu_props={}; geod=Geod(ellps='WGS84')
for f in wmu_features:
    p=f.get('properties',{}); raw=norm_text(p.get('WMUNIT_NUM') or p.get('wmu_id'))
    mm=re.match(r'\s*(\d+)\D+(\d+)\s*$',raw)
    if not mm: continue
    key=f'{int(mm.group(1))}{int(mm.group(2)):02d}'
    g=geom_clean(f,0.0030)
    if not g: continue
    wmu_geom[key]=g; wmu_props[key]={'WILDLIFE_MGMT_UNIT_ID':raw}
    try: wmu_area[key]=abs(geod.geometry_area_perimeter(g)[0])/1e6
    except Exception: wmu_area[key]=None

'''
s = s[:start] + replacement + s[end:]

old_h = "r=session.get(HARVEST_CSV,timeout=180); r.raise_for_status(); text=r.content.decode('utf-8-sig',errors='replace')\nreader=csv.DictReader(io.StringIO(text)); headers=reader.fieldnames or []; report['harvest_headers']=headers"
new_h = """try:\n    r=session.get(HARVEST_CSV,timeout=90); r.raise_for_status(); text=r.content.decode('utf-8-sig',errors='replace')\nexcept Exception as e:\n    print(f'Harvest CSV unavailable: {e}', flush=True)\n    report['warnings'].append(f'Harvest CSV unavailable: {e}')\n    text='HUNT YEAR,SPECIES,WMU,RESIDENT KILLS,RESIDENT DAYS,NON-RESIDENT KILLS,NON-RESIDENT DAYS\\n'\nreader=csv.DictReader(io.StringIO(text)); headers=reader.fieldnames or []; report['harvest_headers']=headers"""
if old_h not in s:
    raise RuntimeError('harvest patch target not found')
s = s.replace(old_h, new_h)

p.write_text(s, encoding='utf-8')
print('Runtime build patch applied')
