'use strict';
// Compile published BC LEH Survey Estimates (1984–2023) into a small, explicit,
// WMU-only table. Never infer GOS statistics by subtracting incompatible surveys.
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const URL='https://catalogue.data.gov.bc.ca/dataset/0d34d609-bed6-4ac1-8fdc-0dcd8cc939e9/resource/67f9b4c7-b6d3-4473-9145-a711956f65c1/download/leh-survey-estimates-1984-to-2023.csv';
function parseCSV(source){
  // Source contains some quoted CSV fields; don't split on commas naively.
  const lines=[];let cell='',row=[],quoted=false;
  for(let i=0;i<source.length;i++){
    const char=source[i];
    if(char==='"'){
      if(quoted&&source[i+1]==='"'){cell+='"';i++;}
      else quoted=!quoted;
    }else if(char===','&&!quoted){row.push(cell);cell='';}
    else if((char==='\n'||char==='\r')&&!quoted){
      if(char==='\r'&&source[i+1]==='\n')i++;
      row.push(cell);cell='';
      if(row.some(x=>x.trim()))lines.push(row);
      row=[];
    }else cell+=char;
  }
  if(quoted)throw Error('Unbalanced LEH CSV quoted field');
  if(cell||row.length){row.push(cell);lines.push(row);}
  return lines;
}
function compile(source){
  const table=parseCSV(source);
  const header=table.shift().map(s=>s.replace(/^\uFEFF/,'').trim());
  const idx={};
  for(const name of ['Year','Species','Region','WMU','Hunt Code','Estimated Hunters','Estimated Kills']) {
    idx[name]=header.indexOf(name);
    assert(idx[name]>=0,'LEH column missing: '+name);
  }
  const groups=new Map();let rejectedAmbiguous=0,invalid=0;
  for(const row of table){
    const year=Number(row[idx.Year]),species=row[idx.Species]?.trim();
    const region=row[idx.Region]?.trim(),raw=row[idx.WMU]?.trim();
    if(!Number.isInteger(year)||year<1984||year>2023||!species)continue;
    // Single-WMU IDs only: 424 => 4-24, 105 => 1-5.
    // Multi-WMU LEH hunt areas may not be geographically attributed to one WMU.
    const hit=/^([1-8])(\d{2})$/.exec(raw||'');
    if(!hit||region!==hit[1]||Number(hit[2])<1){rejectedAmbiguous++;continue;}
    const id=hit[1]+'-'+Number(hit[2]);
    const key=species+'|'+id+'|'+year;
    if(!groups.has(key))groups.set(key,{species,id,year,hunters:0,kills:0,valid:true,codes:new Set()});
    const group=groups.get(key),code=row[idx['Hunt Code']]?.trim();
    if(!code||group.codes.has(code)){group.valid=false;invalid++;continue;}
    group.codes.add(code);
    const hunters=Number(row[idx['Estimated Hunters']]);
    const kills=Number(row[idx['Estimated Kills']]);
    if(!row[idx['Estimated Hunters']]?.trim()||!row[idx['Estimated Kills']]?.trim()||
      !Number.isFinite(hunters)||!Number.isFinite(kills)||hunters<=0||kills<0){
      group.valid=false;invalid++;continue;
    }
    group.hunters+=hunters;group.kills+=kills;
  }
  const species={},counts={};
  for(const record of groups.values()){
    if(!record.valid||record.hunters<record.kills||record.hunters<=0)continue;
    ((species[record.species]??={})[record.id]??={})[record.year]=[
      Math.round(record.hunters*1000)/1000,Math.round(record.kills*1000)/1000
    ];
    counts[record.species]=(counts[record.species]||0)+1;
  }
  const total=Object.values(counts).reduce((a,b)=>a+b,0);
  assert(total>1000&&species.GOAT&&species.ELK&&species.MOOS,
    'LEH data unexpectedly empty; refusing to publish invalid records');
  return {meta:{publisher:'Government of British Columbia',
    dataset:'Limited Entry Hunting Survey Estimates 1984 to 2023',
    source:URL,first_year:1984,last_year:2023,
    unit:'LEH hunt-code estimated hunter participation, not unique individual hunters',
    mapping:'Only single-WMU LEH hunt areas are included; multi-WMU and incomplete survey estimates omitted',
    limitation:'Summing different hunt codes may double-count participating individuals. Do not subtract these figures from combined harvest to calculate GOS.',
    accepted_records:total,rejected_ambiguous:rejectedAmbiguous,rejected_incomplete:invalid},
    species};
}
if(process.argv.includes('--self-test')){
  const demo='Year,Species,Region,WMU,Hunt Code,Estimated Hunters,Estimated Kills\n2023,GOAT,4,424,1,10,2\n2023,GOAT,4,424,2,15,4\n2023,GOAT,4,"424,425",3,20,3\n2023,ELK,4,424,4,5,\n2023,ELK,4,425,5,8,2\n';
  const rows=parseCSV(demo);
  assert.equal(rows[3][3],'424,425');
  console.log('LEH CSV parser self-test passed');
  process.exit(0);
}
const csv=execFileSync('curl',['--fail','--location','--silent','--show-error','--retry','2','--max-time','45',URL],{
  encoding:'utf8',maxBuffer:20*1024*1024
});
const result=compile(csv);
const dest=path.join('site','species-map','data','bc-leh-single-wmu-1984-2023.json');
fs.mkdirSync(path.dirname(dest),{recursive:true});
fs.writeFileSync(dest,JSON.stringify(result));
console.log('Official LEH WMU snapshot built:',result.meta.accepted_records,'records; ambiguous excluded:',result.meta.rejected_ambiguous);
