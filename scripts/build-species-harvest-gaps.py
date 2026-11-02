"""Rebuild WMU-scale legacy-grid gap outlines. Requires numpy and shapely.

Usage: python scripts/build-species-harvest-gaps.py path/to/bc-harvest-wmu.csv
Run from repository root. Uses the checked-in bc_wmu.geojson and legacy raster assets.
"""
import sys,csv,json,re,hashlib,numpy as np
if len(sys.argv) != 2:
 raise SystemExit('Pass path to the official BC WMU harvest CSV')
harvest_path=sys.argv[1]
from collections import defaultdict
from shapely.geometry import shape,mapping
from shapely.validation import make_valid
from shapely.ops import unary_union
from shapely import contains_xy,prepare
rows=list(csv.DictReader(open(harvest_path,encoding='utf-8-sig')));j=json.load(open('bc_wmu.geojson'));wmu={f['properties']['WMUNIT_NUM']:shape(f['geometry']) for f in j['features']};xs=-139.2+(np.arange(260)+.5)*25.4/260;ys=60.1-(np.arange(123)+.5)*12/123;X,Y=np.meshgrid(xs,ys)
meta=json.load(open('species-map/data/sources.json'))
for code,name in [('DEMU','mule_deer'),('DEWT','white_tailed_deer'),('ELK','elk'),('MOOS','moose'),('GOAT','mountain_goat')]:
 r=re.search("='([^']+)'",open('species-map/data/'+name+'.js').read()).group(1);a=[]
 for t in r.split(','):
  if t:a.extend([int(t[0])]*int(t[1:],36))
 mask=np.asarray(a).reshape(123,260)>0;positive=defaultdict(set)
 for row in rows:
  if row['SPECIES']!=code or not 2020<=int(row['HUNT YEAR'])<=2024:continue
  try:v=float(row['RESIDENT KILLS'] or 0)+float(row['NON-RESIDENT KILLS'] or 0)
  except ValueError:continue
  if v<=0:continue
  v=row['WMU']
  if v.isdigit() and len(v)>=3:positive[v[:-2]+'-'+str(int(v[-2:]))].add(int(row['HUNT YEAR']))
 out=[];ambiguous=[];unresolved=[]
 for unit,years in sorted(positive.items()):
  g=wmu.get(unit)
  if g is None:continue
  prepare(g);inside=contains_xy(g,X,Y)
  if not inside.any() or (inside & mask).any():continue
  if name=='moose' and unit=='1-1':ambiguous.append(unit);continue
  if not g.is_valid:g=make_valid(g)
  g=g.simplify(.002,preserve_topology=True)
  if g.geom_type=='GeometryCollection':g=unary_union([p for p in g.geoms if p.geom_type in ('Polygon','MultiPolygon')])
  if g.is_empty or not g.is_valid:unresolved.append(unit);continue
  out.append({'type':'Feature','properties':{'wmu':unit,'reported_harvest_years':sorted(years)},'geometry':mapping(g)})
 p='species-map/data/harvest-gap-'+name+'.geojson';data={'type':'FeatureCollection','source':'https://catalogue.data.gov.bc.ca/dataset/big-game-harvest-statistics-1976-to-2024','attribution':'Contains information licensed under the Open Government Licence – British Columbia.','description':'WMUs with estimated reported harvest 2020–2024 and no nonzero legacy-grid cell centre. An outline flags a data gap at WMU scale, not local distribution or density.','features':out};json.dump(data,open(p,'w'),separators=(',',':'))
 meta['harvest-gap-'+name+'.geojson']={'retrieved':'2026-10-31','source_urls':['https://catalogue.data.gov.bc.ca/dataset/big-game-harvest-statistics-1976-to-2024','https://catalogue.data.gov.bc.ca/dataset/wildlife-management-units'],'source_sha256':[hashlib.sha256(open(harvest_path,'rb').read()).hexdigest(),hashlib.sha256(open('bc_wmu.geojson','rb').read()).hexdigest()],'output_sha256':hashlib.sha256(open(p,'rb').read()).hexdigest(),'note':'Only WMUs with reported or estimated harvest 2020–2024 and no nonzero raster-grid cell centre; zero does not prove absence, harvest is not density. Moose 1-1 excluded pending validation due to atypical island records.'}
 print(name,'outlines',len(out),'WMUs',','.join(f['properties']['wmu'] for f in out),'ambiguous',ambiguous,'unresolved',unresolved,flush=True)
open('species-map/data/sources.json','w').write(json.dumps(meta,indent=2)+'\n')
