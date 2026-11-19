"""Build anonymous WMU aggregates from the official WILD CI workbook."""
import collections, hashlib, json, sys
from pathlib import Path
import openpyxl
source=Path(sys.argv[1]); sheet=openpyxl.load_workbook(source,read_only=True)['WILD CI System']
it=iter(sheet.values); headers=next(it); counts=collections.Counter(); totals=collections.Counter(); missing=0
for values in it:
 r=dict(zip(headers,values))
 if r['WILD Kill Code']!='Hunter Kill' or r['LEH Flag'] not in (1,2): continue
 mode='leh' if r['LEH Flag']==1 else 'gos'; totals[mode]+=1
 try:
  w=int(r['WMU']); unit=f'{w//100}-{w%100}'; assert 1<=w//100<=8 and w%100>0
 except (ValueError,TypeError,AssertionError): missing+=1; continue
 counts[(r['Species'],r['Elk Sub-Species'] or r['Sheep Sub-Species'] or '',unit,r['Licence Year'],mode)]+=1
out={'meta':{'publisher':'Government of British Columbia','source':'https://catalogue.data.gov.bc.ca/dataset/compulsory-inspection-data-1900-to-2023-24','sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'totals':dict(totals),'unmapped':missing,'note':'WILD CI hunter kills only. All residencies. Licence years; incomplete coverage. Absence is not zero harvest. Old CI records lack an explicit hunt-type flag and are excluded.'},'rows':[list(k)+[v] for k,v in sorted(counts.items())]}
Path('species-map/data/bc-recorded-harvests.json').write_text(json.dumps(out,separators=(',',':')))
assert totals=={'gos':5518,'leh':3766}; assert sum(x[-1] for x in out['rows'])+missing==9284
print(out['meta'])
