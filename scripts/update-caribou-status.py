"""Remove three ranges whose resident herds BC identified as extinct by 2023.

Run after building the BC caribou-herds.geojson source layer. The BC spatial
service still labels these as active. This corrects that mismatch; an excluded
range is not evidence that individual animals can never occur there.
"""
import datetime,hashlib,json
from pathlib import Path

out=Path('species-map/data/caribou-herds.geojson');original=out.read_bytes();data=json.loads(original)
excluded={'George Mountain','Columbia South','Monashee'}
present={f['properties']['HERD_NAME'] for f in data['features']}
if not excluded.issubset(present):raise ValueError('Expected herd names missing; rebuild the base layer before applying status correction')
data['features']=[f for f in data['features'] if f['properties']['HERD_NAME'] not in excluded]
out.write_text(json.dumps(data,separators=(',',':')))
manifest_path=Path('species-map/data/sources.json');manifest=json.loads(manifest_path.read_text());meta=manifest[out.name]
meta['status_checked']=str(datetime.date.today());meta['source_urls'].append('https://www2.gov.bc.ca/assets/gov/environment/plants-animals-and-ecosystems/wildlife-wildlife-habitat/caribou/bc_caribou_herds_population_estimates.pdf')
meta['source_sha256'].append(hashlib.sha256(original).hexdigest());meta['output_sha256']=hashlib.sha256(out.read_bytes()).hexdigest()
meta['note']='Excludes George Mountain, Columbia South and Monashee resident herds reported extirpated by BC in 2023, in addition to source-layer extirpated statuses. Does not prove animals are absent from these areas.'
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
print('Removed three locally extinct resident herd ranges; retained',len(data['features']))
