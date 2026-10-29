#!/usr/bin/env python3
import csv, io, json, math, os, re
from collections import defaultdict
from datetime import datetime, timezone
from html import escape
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from shapely.geometry import shape, Polygon, MultiPolygon, GeometryCollection

OUT_DIR = os.environ.get('OUT_DIR', 'build/current_v4')
os.makedirs(OUT_DIR, exist_ok=True)

MGMT = 'https://delivery.maps.gov.bc.ca/arcgis/rest/services/whse/bcgw_pub_whse_wildlife_management/MapServer'
INV = 'https://delivery.maps.gov.bc.ca/arcgis/rest/services/whse/bcgw_pub_whse_wildlife_inventory/MapServer'
HARVEST_CSV = 'https://catalogue.data.gov.bc.ca/dataset/f2303645-5952-4766-bd5c-3b9b50dda1ca/resource/ea1505f6-77ab-4838-b4a9-309ec55a3c20/download/big-game-harvest-statistics-1976-to-2024-wmu.csv'

SPECIES = ['Caribou','Elk','Moose','Mule / Black-tailed Deer','White-tailed Deer','Mountain Goat','Mountain Sheep','Bison','Grizzly Bear','Black Bear','Cougar','Wolf']
UNGULATES = set(SPECIES[:8])

session = requests.Session()
retry = Retry(total=5, connect=5, read=5, backoff_factor=1.2, status_forcelist=[429,500,502,503,504], allowed_methods=['GET'])
session.mount('https://', HTTPAdapter(max_retries=retry))
session.headers.update({'User-Agent':'HuntSmart-BC-Abundance-KMZ-Builder/4.0'})
report = {'built_utc': datetime.now(timezone.utc).isoformat(), 'sources': {}, 'counts': defaultdict(lambda: defaultdict(int)), 'warnings': []}

def get_json(url, params=None, timeout=120):
    r = session.get(url, params=params, timeout=timeout)
    r.raise_for_status()
    data = r.json()
    if isinstance(data, dict) and data.get('error'):
        raise RuntimeError(f"ArcGIS error: {data['error']}")
    return data

def query_layer(base, layer, where='1=1', out_fields='*', page_size=1000):
    url = f'{base}/{layer}/query'
    features, offset = [], 0
    while True:
        params = {'where': where, 'outFields': out_fields, 'returnGeometry': 'true', 'outSR': '4326', 'f': 'geojson', 'resultOffset': offset, 'resultRecordCount': page_size, 'orderByFields': 'OBJECTID ASC', 'geometryPrecision': 5}
        data = get_json(url, params=params)
        batch = data.get('features', [])
        features.extend(batch)
        print(f'layer {layer}: +{len(batch)} (total {len(features)})', flush=True)
        if len(batch) < page_size: break
        offset += len(batch)
        if offset > 100000: raise RuntimeError(f'pagination runaway on layer {layer}')
    return features

def norm_text(v): return re.sub(r'\s+', ' ', str(v or '')).strip()

def map_species(text):
    s = norm_text(text).lower().replace('_',' ').replace('–','-')
    if not s: return None
    if 'white' in s and 'tail' in s and 'deer' in s: return 'White-tailed Deer'
    if ('black' in s and 'tail' in s and 'deer' in s) or 'blacktail' in s or 'mule deer' in s: return 'Mule / Black-tailed Deer'
    if 'mountain goat' in s or s == 'goat': return 'Mountain Goat'
    if any(x in s for x in ['bighorn','thinhorn','stone sheep','dall sheep','mountain sheep']) or s == 'sheep': return 'Mountain Sheep'
    if 'caribou' in s: return 'Caribou'
    if re.search(r'\belk\b', s) or 'wapiti' in s: return 'Elk'
    if 'moose' in s: return 'Moose'
    if 'bison' in s: return 'Bison'
    if 'grizzly' in s: return 'Grizzly Bear'
    if 'black bear' in s: return 'Black Bear'
    if 'cougar' in s or 'mountain lion' in s: return 'Cougar'
    if re.search(r'\bwolf\b', s) or 'wolves' in s: return 'Wolf'
    return None

def species_from_props(props):
    keys = [k for k in props if any(t in k.upper() for t in ['SPECIES','COMMON_NAME','ENGLISH_NAME','TAXON'])]
    for k in keys:
        sp = map_species(props.get(k))
        if sp: return sp
    for v in props.values():
        if isinstance(v, str):
            sp = map_species(v)
            if sp: return sp
    return None

def geom_clean(feature, tol=0.0015):
    gobj = feature.get('geometry')
    if not gobj: return None
    try:
        g = shape(gobj)
        if g.is_empty: return None
        if not g.is_valid: g = g.buffer(0)
        g = g.simplify(tol, preserve_topology=True)
        return None if g.is_empty else g
    except Exception as e:
        report['warnings'].append(f'geometry failure: {e}')
        return None

def fmt(v, digits=2):
    if v is None or v == '': return '—'
    try:
        f=float(v)
        if not math.isfinite(f): return '—'
        return f'{f:,.{digits}f}'
    except Exception: return escape(norm_text(v))

def date_year(v):
    if v in (None,''): return '—'
    try:
        n=float(v)
        if n > 100000000000: return datetime.fromtimestamp(n/1000, tz=timezone.utc).strftime('%Y-%m-%d')
        if 1900 <= n <= 2100: return str(int(n))
    except Exception: pass
    return escape(norm_text(v))

def text_prop(props, *candidates):
    up={k.upper():k for k in props}
    for c in candidates:
        k=up.get(c.upper())
        if k is not None and props.get(k) not in (None,''): return props.get(k)
    return None

def xml(s): return escape(str(s), quote=True)
def coords_ring(ring): return ' '.join(f'{x:.5f},{y:.5f},0' for x,y,*_ in ring.coords)

def polygon_kml(poly):
    if poly.is_empty: return ''
    parts=['<Polygon><tessellate>1</tessellate><outerBoundaryIs><LinearRing><coordinates>', coords_ring(poly.exterior), '</coordinates></LinearRing></outerBoundaryIs>']
    for r in poly.interiors: parts += ['<innerBoundaryIs><LinearRing><coordinates>', coords_ring(r), '</coordinates></LinearRing></innerBoundaryIs>']
    parts.append('</Polygon>')
    return ''.join(parts)

def geometry_kml(g):
    if isinstance(g, Polygon): return polygon_kml(g)
    if isinstance(g, MultiPolygon): return '<MultiGeometry>' + ''.join(polygon_kml(p) for p in g.geoms) + '</MultiGeometry>'
    if isinstance(g, GeometryCollection):
        polys=[x for x in g.geoms if isinstance(x,(Polygon,MultiPolygon))]
        return '' if not polys else '<MultiGeometry>' + ''.join(geometry_kml(x) for x in polys) + '</MultiGeometry>'
    return ''

def placemark(name, style, desc, g, extended=None):
    geom=geometry_kml(g)
    if not geom: return ''
    ed=''
    if extended:
        ed='<ExtendedData>'+''.join(f'<Data name="{xml(k)}"><value>{xml(v)}</value></Data>' for k,v in extended.items() if v not in (None,''))+'</ExtendedData>'
    return f'<Placemark><name>{xml(name)}</name><styleUrl>#{style}</styleUrl><description><![CDATA[{desc}]]></description>{ed}{geom}</Placemark>'

def style(style_id, line, fill, width=1.4):
    return f'<Style id="{style_id}"><LabelStyle><scale>0</scale></LabelStyle><LineStyle><color>{line}</color><width>{width}</width></LineStyle><PolyStyle><color>{fill}</color><fill>1</fill><outline>1</outline></PolyStyle></Style>'

STYLES = ''.join([
    style('current_dist','ff00d9ff','5200d9ff',2.1), style('survey_new','ffffe070','44ffe070',2.0), style('survey_mid','ccffe070','28ffe070',1.5), style('survey_old','88999999','15999999',1.0), style('uwr','ff00a5ff','3500a5ff',1.4), style('grizzly_unit','ffcc66ff','32cc66ff',1.8), style('harvest_q1','ff4ecb71','244ecb71',0.9), style('harvest_q2','ff74c365','2a74c365',0.9), style('harvest_q3','ffdfc54a','31dfc54a',0.9), style('harvest_q4','ffff8c2e','38ff8c2e',0.9), style('harvest_q5','ff3b3bff','443b3bff',1.1)
])
layers = {sp: {'distribution':[], 'survey':[], 'uwr':[], 'harvest':[]} for sp in SPECIES}

print('Downloading current sheep distribution...', flush=True)
sheep = query_layer(MGMT, 3)
report['sources']['sheep_distribution']={'layer':3,'features':len(sheep),'url':f'{MGMT}/3'}
for f in sheep:
    p=f.get('properties',{}); g=geom_clean(f,0.0014)
    if not g: continue
    common=text_prop(p,'SPECIES_COMMON_NAME','COMMON_NAME') or 'Mountain Sheep'
    desc=f'<b>Current BC Wild Mountain Sheep Registry distribution</b><br>Species: {escape(norm_text(common))}<br>Source: Province of British Columbia, current registry layer.'
    layers['Mountain Sheep']['distribution'].append(placemark(norm_text(common), 'current_dist', desc, g, {'Data tier':'Current official distribution','Species':common}))

print('Downloading current caribou herds...', flush=True)
caribou = query_layer(INV, 10)
report['sources']['caribou_herds']={'layer':10,'features':len(caribou),'url':f'{INV}/10'}
for f in caribou:
    p=f.get('properties',{}); g=geom_clean(f,0.0014)
    if not g: continue
    name=norm_text(p.get('HERD_NAME') or 'Caribou herd')
    desc=(f'<b>Current BC caribou herd boundary</b><br>Herd: {escape(name)}<br>Status: {escape(norm_text(p.get("HERD_STATUS")))}<br>Ecotype: {escape(norm_text(p.get("ECOTYPE")))}<br>Risk status: {escape(norm_text(p.get("RISK_STATUS")))}<br>Estimated population: {escape(norm_text(p.get("ESTIMATED_CARIBOU_POPULATION")))}<br>Last survey: {escape(norm_text(p.get("YEAR_OF_LAST_SURVEY")))}')
    layers['Caribou']['distribution'].append(placemark(name,'current_dist',desc,g,{'Data tier':'Current official herd boundary','Last survey':p.get('YEAR_OF_LAST_SURVEY'),'Population estimate':p.get('ESTIMATED_CARIBOU_POPULATION')}))

print('Downloading grizzly population units...', flush=True)
grizzly = query_layer(INV, 8)
report['sources']['grizzly_population_units']={'layer':8,'features':len(grizzly),'url':f'{INV}/8'}
for f in grizzly:
    p=f.get('properties',{}); g=geom_clean(f,0.0018)
    if not g: continue
    name=norm_text(text_prop(p,'GBPU_NAME','POPULATION_UNIT_NAME','NAME') or 'Grizzly population unit')
    useful=[]
    for k,v in p.items():
        ku=k.upper()
        if v not in (None,'') and any(t in ku for t in ['NAME','STATUS','POPULATION','DENSITY','BEAR']): useful.append((k,v))
    desc='<b>BC Grizzly Bear Population Unit</b><br>'+ '<br>'.join(f'{escape(k)}: {escape(norm_text(v))}' for k,v in useful[:8])
    layers['Grizzly Bear']['distribution'].append(placemark(name,'grizzly_unit',desc,g,{'Data tier':'Current official population unit'}))

print('Downloading approved UWR polygons...', flush=True)
uwr = query_layer(MGMT, 59)
report['sources']['approved_uwr']={'layer':59,'features':len(uwr),'url':f'{MGMT}/59'}
for f in uwr:
    p=f.get('properties',{}); g=geom_clean(f,0.0018)
    if not g: continue
    spp=set()
    for key in ('SPECIES_1','SPECIES_2'):
        sp=map_species(p.get(key))
        if sp in UNGULATES: spp.add(sp)
    for sp in spp:
        n=norm_text(p.get('UWR_UNIT_NUMBER') or p.get('UWR_NUMBER') or 'Approved UWR')
        desc=(f'<b>Approved Ungulate Winter Range</b><br>Species: {escape(sp)}<br>UWR: {escape(n)}<br>Approval: {date_year(p.get("APPROVAL_DATE"))}<br>Area: {fmt(p.get("HECTARES"),1)} ha<br>Notes: {escape(norm_text(p.get("FEATURE_NOTES")))}')
        layers[sp]['uwr'].append(placemark(n,'uwr',desc,g,{'Data tier':'Current approved winter range','Approval date':date_year(p.get('APPROVAL_DATE')),'Hectares':p.get('HECTARES')}))

print('Downloading WSI Survey Summary polygons...', flush=True)
wsi = query_layer(INV, 16)
report['sources']['wsi_survey_summary']={'layer':16,'features':len(wsi),'url':f'{INV}/16'}
unknown_wsi=defaultdict(int)
for f in wsi:
    p=f.get('properties',{}); sp=species_from_props(p)
    if not sp:
        vals=' | '.join(norm_text(v) for k,v in p.items() if isinstance(v,str) and ('SPECIES' in k.upper() or 'NAME' in k.upper()))
        if vals: unknown_wsi[vals[:180]] += 1
        continue
    g=geom_clean(f,0.0013)
    if not g: continue
    year=text_prop(p,'SUMMARY_YEAR','SURVEY_YEAR','YEAR')
    try: yr=int(float(year))
    except Exception: yr=0
    style_id='survey_new' if yr>=2020 else ('survey_mid' if yr>=2010 else 'survey_old')
    method=text_prop(p,'SURVEY_METHOD','METHOD'); param=text_prop(p,'PARAMETER_NAME'); val=text_prop(p,'BEST_PARAMETER_VALUE','PARAMETER_VALUE'); denom=text_prop(p,'PARAMETER_DENOMINATOR_VALUE'); lower=text_prop(p,'CONFIDENCE_LIMIT_LOWER'); upper=text_prop(p,'CONFIDENCE_LIMIT_UPPER'); level=text_prop(p,'CONFIDENCE_LEVEL_PERCENT'); project=text_prop(p,'PROJECT_NAME','STUDY_NAME','SURVEY_NAME')
    title=f'{sp} survey {yr or "year unknown"}' + (f' — {norm_text(param)}' if param else '')
    desc=(f'<b>Measured WSI survey-summary polygon</b><br>Species: {escape(sp)}<br>Survey year: {escape(norm_text(year))}<br>Method: {escape(norm_text(method))}<br>Parameter: {escape(norm_text(param))}<br>Best value: {fmt(val,3)}<br>Denominator: {fmt(denom,3)}<br>Confidence interval: {fmt(lower,3)} – {fmt(upper,3)} ({fmt(level,0)}%)<br>Project/study: {escape(norm_text(project))}<br><i>This is measured survey evidence; interpret in the context of survey method and year.</i>')
    layers[sp]['survey'].append(placemark(title,style_id,desc,g,{'Data tier':'Measured WSI survey','Survey year':year,'Method':method,'Parameter':param,'Best value':val,'CI lower':lower,'CI upper':upper}))
if unknown_wsi: report['wsi_unmapped_examples']=dict(sorted(unknown_wsi.items(), key=lambda kv:-kv[1])[:25])

print('Downloading WMU boundaries...', flush=True)
wmu_features=query_layer(MGMT,23)
report['sources']['wmu_boundaries']={'layer':23,'features':len(wmu_features),'url':f'{MGMT}/23'}
wmu_geom={}; wmu_area={}; wmu_props={}
for f in wmu_features:
    p=f.get('properties',{}); raw=norm_text(p.get('WILDLIFE_MGMT_UNIT_ID')); key=re.sub(r'\D','',raw)
    if not key: continue
    g=geom_clean(f,0.0030)
    if not g: continue
    wmu_geom[key]=g; wmu_props[key]=p
    area=p.get('FEATURE_AREA_SQM') or p.get('GEOMETRY.AREA')
    try: wmu_area[key]=float(area)/1e6
    except Exception: wmu_area[key]=None

print('Downloading 2020-2024 harvest CSV...', flush=True)
r=session.get(HARVEST_CSV,timeout=180); r.raise_for_status(); text=r.content.decode('utf-8-sig',errors='replace')
reader=csv.DictReader(io.StringIO(text)); headers=reader.fieldnames or []; report['harvest_headers']=headers

def hnorm(h): return re.sub(r'[^a-z0-9]+',' ',h.lower()).strip()
def find_header(words_all, words_any=None):
    for h in headers:
        n=hnorm(h)
        if all(w in n for w in words_all) and (not words_any or any(w in n for w in words_any)): return h
    return None
hy=find_header(['hunt','year']) or find_header(['year']); hs=find_header(['species']); hw=find_header(['wmu']) or find_header(['management','unit']); htk=find_header(['total','kill']); htd=find_header(['total','hunter','day'])
kill_cols=[h for h in headers if 'kill' in hnorm(h) and ('resident' in hnorm(h) or 'non resident' in hnorm(h)) and '100' not in hnorm(h)]
day_cols=[h for h in headers if 'hunter day' in hnorm(h) and ('resident' in hnorm(h) or 'non resident' in hnorm(h)) and '100' not in hnorm(h)]
if not (hy and hs and hw): raise RuntimeError(f'Could not identify harvest keys from headers: {headers}')

def num(v):
    s=norm_text(v).replace(',','')
    if not s or s in {'*','-','—','na','n/a'}: return 0.0
    m=re.search(r'-?\d+(?:\.\d+)?',s); return float(m.group()) if m else 0.0
agg=defaultdict(lambda:{'kills':0.0,'days':0.0,'years':set(),'rows':0})
for row in reader:
    try: yr=int(float(norm_text(row.get(hy))))
    except Exception: continue
    if yr<2020 or yr>2024: continue
    sp=map_species(row.get(hs)); wk=re.sub(r'\D','',norm_text(row.get(hw)))
    if not sp or wk not in wmu_geom: continue
    kills=num(row.get(htk)) if htk else sum(num(row.get(c)) for c in kill_cols); days=num(row.get(htd)) if htd else sum(num(row.get(c)) for c in day_cols)
    a=agg[(sp,wk)]; a['kills']+=kills; a['days']+=days; a['years'].add(yr); a['rows']+=1
by_sp=defaultdict(list); metrics={}
for (sp,wk),a in agg.items():
    area=wmu_area.get(wk)
    if not area or area<=0: continue
    k100=a['kills']/area*100.0; eff=(a['kills']/a['days']*100.0) if a['days']>0 else 0.0; metrics[(sp,wk)]=(k100,eff,a)
    if k100>0: by_sp[sp].append(k100)
def quantile_breaks(vals):
    v=sorted(vals)
    if not v: return []
    def q(p):
        idx=(len(v)-1)*p; lo=math.floor(idx); hi=math.ceil(idx)
        return v[lo] if lo==hi else v[lo]*(hi-idx)+v[hi]*(idx-lo)
    return [q(.2),q(.4),q(.6),q(.8)]
qbreak={sp:quantile_breaks(v) for sp,v in by_sp.items()}
for (sp,wk),(k100,eff,a) in metrics.items():
    if a['kills']<=0: continue
    br=qbreak.get(sp,[]); q=1+sum(k100>b for b in br); style_id=f'harvest_q{min(5,max(1,q))}'; raw=norm_text(wmu_props[wk].get('WILDLIFE_MGMT_UNIT_ID'))
    desc=(f'<b>2020–2024 harvest intensity proxy</b><br>Species: {escape(sp)}<br>WMU: {escape(raw)}<br>Total reported kills: {a["kills"]:,.0f}<br>Total hunter-days: {a["days"]:,.0f}<br>Kills / 100 km²: {k100:.2f}<br>Kills / 100 hunter-days: {eff:.2f}<br><i>Harvest is not a population census. Access, regulations, hunter effort and reporting affect this layer.</i>')
    layers[sp]['harvest'].append(placemark(f'WMU {raw} — Q{q}',style_id,desc,wmu_geom[wk],{'Data tier':'2020-2024 harvest proxy','WMU':raw,'Kills per 100 km2':f'{k100:.3f}','Kills per 100 hunter-days':f'{eff:.3f}'}))
report['sources']['harvest']={'url':HARVEST_CSV,'years':'2020-2024','rows_aggregated':sum(a['rows'] for a in agg.values())}

source_note='Built from official BC ArcGIS feature services and BC Big Game Harvest Statistics through 2024. All geometry below is embedded locally; no NetworkLinks are used.'
for idx,sp in enumerate(SPECIES,1):
    parts=['<?xml version="1.0" encoding="UTF-8"?>','<kml xmlns="http://www.opengis.net/kml/2.2"><Document>',f'<name>{xml(sp)} — Current / Recent BC Evidence</name>',STYLES,f'<description>{xml(source_note)}</description>']
    folders=[('01 — CURRENT DISTRIBUTION / POPULATION UNITS','distribution'),('02 — MEASURED WSI SURVEY EVIDENCE','survey'),('03 — APPROVED WINTER RANGE','uwr'),('04 — 2020–2024 HARVEST INTENSITY','harvest')]
    for title,key in folders:
        feats=layers[sp][key]; report['counts'][sp][key]=len(feats); parts.append(f'<Folder><name>{xml(title)}</name><visibility>0</visibility>')
        if feats: parts.extend(feats)
        else: parts.append('<description>No embedded features available for this species in this source tier.</description>')
        parts.append('</Folder>')
    parts.append('</Document></kml>')
    safe=re.sub(r'[^A-Za-z0-9]+','_',sp).strip('_').lower(); path=os.path.join(OUT_DIR,f'{idx:02d}_{safe}.kml')
    with open(path,'w',encoding='utf-8') as fh: fh.write('\n'.join(parts))
    print(f'wrote {path} ({os.path.getsize(path):,} bytes)',flush=True)
report['counts']={sp:dict(v) for sp,v in report['counts'].items()}
with open(os.path.join(OUT_DIR,'build_report.json'),'w',encoding='utf-8') as fh: json.dump(report,fh,indent=2,default=str)
with open(os.path.join(OUT_DIR,'README.txt'),'w',encoding='utf-8') as fh: fh.write(source_note+'\n')
print(json.dumps(report['counts'],indent=2),flush=True)
