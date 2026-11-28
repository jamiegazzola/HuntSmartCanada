(() => {
  'use strict';
  // BC Government WMU 2020-24 figures, not third-party estimates. Parent-species
  // records cannot be interpreted as subspecies-specific, GOS or trophy odds.
  const elkPolicy = window.HUNTSMART_ELK_POLICY;
  if (!elkPolicy?.isElk || !elkPolicy?.excludesFromSuccess) throw Error('Elk species policy unavailable');
  const BC_GOVERNMENT_HARVEST_DATA='https://catalogue.data.gov.bc.ca/dataset/big-game-harvest-statistics-1976-to-2024';
  const OFFICIAL_SOURCE='/species-map/data/verified/bc-official-harvest-wmu-2020-2024.json?v=validated-20261119';
  // Read only the selected government's species category instead of downloading
  // the entire ~916 KB provincial archive whenever Success is opened.
  const HISTORY_SOURCE=code=>'/species-map/data/verified/harvest-history-'+code.toLowerCase()+'.json?v=validated-20261119';
  const SOURCE_SHA='e433ed8fc5a9af0db38b190ee068cb48495d9a4a201613c86db13d63a3ade45e';

  // Explicit WILD compulsory inspections are evidence of kills, not a hunter-success denominator.
  const INSPECTION_SOURCE='/species-map/data/bc-recorded-harvests.json?v=roosevelt-audit-20261119b';
  const INSPECTION_SHA='7b2c0eda9da6ac11baeda2989852d4746703ca85893fd320f2e07b9ddbc20514';
  const INSPECTION_YEARS=new Set(['2022/23','2023/24','2024/25']);
  const INSPECTION_SUBTYPES=Object.freeze({
    elk:['Rocky Mountain'],rocky_elk_kootenay:['Rocky Mountain'],roosevelt_elk:['Roosevelt'],
    bighorn_sheep:['California Bighorn','Rocky Mtn Bighorn'],
    rocky_bighorn_kootenay:['Rocky Mtn Bighorn'],
    california_bighorn_boundary:['California Bighorn'],
    thinhorn_sheep:['Dall Sheep','Stone Sheep'],
    dall_tatshenshini:['Dall Sheep'],stone_sheep:['Stone Sheep']
  });
  const UNRESOLVED_SUBTYPES=new Set([
    'northwestern_moose_ne','alaskan_moose_nw','shiras_moose_flathead',
    'caribou_northern','caribou_mountain','caribou_boreal',
    'nw_whitetail_kootenay','dakota_whitetail_peace','grizzly_bear'
  ]);
  let inspectionCounts=null,inspectionUnits=null,pendingInspections=null;
  async function loadInspections(){
    if(inspectionCounts)return;
    if(!pendingInspections)pendingInspections=fetch(INSPECTION_SOURCE)
      .then(r=>{if(!r.ok)throw Error('Inspection records unavailable');return r.json();})
      .then(data=>{
        if(data?.meta?.publisher!=='Government of British Columbia'||
          data?.meta?.sha256!==INSPECTION_SHA||!Array.isArray(data.rows))
          throw Error('Inspection source failed integrity checks');
        const counts=new Map(),units=new Set();
        const add=(k,n)=>counts.set(k,(counts.get(k)||0)+n);
        for(const row of data.rows){
          if(!Array.isArray(row)||row.length!==6)throw Error('Malformed inspection row');
          const [species,subtype,wmu,year,mode,n]=row;
          if(!INSPECTION_YEARS.has(year))continue;
          if(typeof species!=='string'||typeof subtype!=='string'||
            !/^[1-8]-[1-9][0-9]?$/.test(wmu)||!['gos','leh'].includes(mode)||
            !Number.isInteger(n)||n<=0)throw Error('Invalid inspection count');
          // Store by licence year: never place modern kills on a historical year.
          add(species+'|*|'+wmu+'|'+year,n);
          add(species+'|'+subtype+'|'+wmu+'|'+year,n);
          units.add(wmu);
        }
        inspectionCounts=counts;inspectionUnits=units;
      }).finally(()=>{pendingInspections=null;});
    return pendingInspections;
  }
  function inspectedSeasons(){
    // Survey reports calendar hunt years; CI reports licence years (e.g. 2024/25).
    // Match on licence-year start, but never treat the two measures as identical.
    const selected=new Set(selectedYears());
    return [...INSPECTION_YEARS].filter(year=>selected.has(Number(year.slice(0,4)))).sort();
  }
  function inspectedPeriodLabel(){
    const years=inspectedSeasons();
    if(!years.length)return '';
    return years.length===1?years[0]:years[0]+'–'+years[years.length-1];
  }
  function recordedKills(id){
    if(key()==='wood_bison')return 0;
    if(!inspectionCounts||!code()||excludedForSpecies(id)||UNRESOLVED_SUBTYPES.has(key()))return 0;
    const subtypes=INSPECTION_SUBTYPES[key()];
    let total=0;
    for(const year of inspectedSeasons()){
      if(!subtypes)total+=inspectionCounts.get(code()+'|*|'+id+'|'+year)||0;
      else for(const name of subtypes)total+=inspectionCounts.get(code()+'|'+name+'|'+id+'|'+year)||0;
    }
    return total;
  }
  function hasEstimatedHarvest(){
    const ids=new Set([...Object.keys(modeArchive()),...Object.keys(rows()||{})]);
    for(const id of ids)if(!excludedForSpecies(id)&&unitStats(id)?.kills>0)return true;
    return false;
  }
  function documentedWithoutRate(){
    if(!inspectionUnits)return 0;
    let total=0;
    for(const id of inspectionUnits)
      if(recordedKills(id)>0&&!unitStats(id)?.reliable)total++;
    return total;
  }
  const SHEEP_AGES='/species-map/data/bc-sheep-age-ci-2022-2025.json?v=20261113f';
  const LEH_SOURCE='/species-map/data/bc-leh-single-wmu-1984-2023.json?v=bison-20261123a';
  const LEH_CATALOGUE='https://catalogue.data.gov.bc.ca/dataset/limited-entry-hunting-survey-estimates-1984-to-2023';
  // One combined-resident Success view. Separate hunt-type records remain
  // available for source auditing, not added to the combined survey rates.
  const huntMode=()=>key()==='wood_bison'?'leh':'combined';
  let lehData=null,pendingLeh=null;
  async function loadLeh(){
    if(lehData)return;
    if(!pendingLeh)pendingLeh=fetch(LEH_SOURCE)
      .then(r=>{if(!r.ok)throw Error('Official LEH survey summary unavailable');return r.json();})
      .then(data=>{
        if(data?.meta?.publisher!=='Government of British Columbia'||
          data?.meta?.first_year!==1984||![2023,2024].includes(data?.meta?.last_year)||
          !data?.species?.GOAT||!data?.species?.ELK)
          throw Error('LEH survey summary failed integrity checks');
        lehData=data;
      }).finally(()=>{pendingLeh=null;});
    return pendingLeh;
  }
  const modeArchive=()=>huntMode()==='leh'?lehData?.species?.[code()]||{}:
    huntMode()==='combined'?history?.species?.[code()]||{}:{};
  const yearlyEstimate=(id,year)=>huntMode()==='leh'?
    lehData?.species?.[code()]?.[id]?.[String(year)]:
    huntMode()==='combined'?(year===2024?rows()?.[id]?.y:
      history?.species?.[code()]?.[id]?.[String(year)]):null;

  const CODE_BY_KEY=Object.freeze({
    mule_deer:'DEMU',white_tailed_deer:'DEWT',
    nw_whitetail_kootenay:'DEWT',dakota_whitetail_peace:'DEWT',
    elk:'ELK',roosevelt_elk:'ELK',rocky_elk_kootenay:'ELK',
    moose:'MOOS',northwestern_moose_ne:'MOOS',alaskan_moose_nw:'MOOS',
    shiras_moose_flathead:'MOOS',mountain_goat:'GOAT',
    wild_sheep:'SHEE',bighorn_sheep:'SHEE',
    rocky_bighorn_kootenay:'SHEE',california_bighorn_boundary:'SHEE',
    thinhorn_sheep:'SHEE',dall_tatshenshini:'SHEE',stone_sheep:'SHEE',
    caribou:'CARI',caribou_northern:'CARI',caribou_mountain:'CARI',
    caribou_boreal:'CARI',grizzly_bear:'BEAG',black_bear:'BEAB',
    wood_bison:null,lynx:'LYNX',bobcat:'BOBC',cougar:'COUG',
    wolf:'WOLF',wolverine:null
  });
  const NAMES={DEMU:'mule deer (incl. blacktail)',DEWT:'white-tailed deer',ELK:'elk',
    MOOS:'moose',GOAT:'mountain goat',SHEE:'mountain sheep (all subspecies)',
    CARI:'caribou (all ecotypes)',BEAG:'grizzly bear',BEAB:'black bear',BISO:'bison',
    BOBC:'bobcat',LYNX:'lynx',COUG:'cougar',WOLF:'wolf'};
  const EXACT=new Set(['mule_deer','white_tailed_deer','elk','moose',
    'mountain_goat','wild_sheep','caribou','grizzly_bear','black_bear','wood_bison',
    'lynx','bobcat','cougar','wolf']);
  const classes=[{max:9,color:'#468f58'},{max:19,color:'#a3b950'},
    {max:29,color:'#dfcb58'},{max:39,color:'#e28d42'},
    {max:Infinity,color:'#c45145'}];
  // The general 40%+ bin hides real variation among coastal elk WMUs.
  // Fixed 20-point bins keep the high-success elk map comparable across years.
  const elkSuccessClasses=[{max:19,color:'#468f58'},{max:39,color:'#a3b950'},
    {max:59,color:'#dfcb58'},{max:79,color:'#e28d42'},
    {max:Infinity,color:'#c45145'}];
  const INSPECTION_EVIDENCE_COLOR='#879bb2';
  const densityClasses=[{max:1,color:'#468f58'},{max:3,color:'#a3b950'},
    {max:10,color:'#dfcb58'},{max:30,color:'#e28d42'},
    {max:Infinity,color:'#c45145'}];
  let mapMetric='success';
  // Approximate spherical area of mapped WMU polygons, not accessible hunting land.
  // Use original long/lat polygon edges where available, and do not count holes.
  const EARTH_RADIUS_KM=6371.0088;
  const radians=Math.PI/180;
  function ringKm2(ring){
    if(!Array.isArray(ring)||ring.length<4)return 0;
    let sum=0;
    for(let i=0;i<ring.length-1;i++){
      const a=ring[i],b=ring[i+1];
      if(!Array.isArray(a)||!Array.isArray(b))return 0;
      sum+=(b[0]-a[0])*radians*(Math.sin(a[1]*radians)+Math.sin(b[1]*radians));
    }
    return Math.abs(sum)*EARTH_RADIUS_KM*EARTH_RADIUS_KM/2;
  }
  function areaKm2(geometry){
    if(!geometry)return null;
    const polygons=geometry.type==='Polygon'?[geometry.coordinates]:
      geometry.type==='MultiPolygon'?geometry.coordinates:[];
    const area=polygons.reduce((total,rings)=>{
      if(!Array.isArray(rings)||!rings.length)return total;
      const exterior=ringKm2(rings[0]);
      const holes=rings.slice(1).reduce((n,ring)=>n+ringKm2(ring),0);
      return total+Math.max(0,exterior-holes);
    },0);
    return Number.isFinite(area)&&area>0?area:null;
  }
  let areaByWmu=new Map();
  function densityFor(id,record=unitStats(id)){
    const area=areaByWmu.get(id);
    // Pooled hunters are hunter-years. Convert to mean per reported year.
    if(!record?.reliable||!Number.isFinite(area)||area<=0||
      !Number.isFinite(record.years)||record.years<=0)return null;
    return record.hunters/record.years/area*100;
  }
  function updateMetricControls(){
    document.querySelectorAll?.('[data-hs-metric]')?.forEach(button=>
      button.setAttribute('aria-pressed',String(button.dataset.hsMetric===mapMetric)));
    const legendNode=document.getElementById('hs-metric-legend');
    if(legendNode){
      const isElk=elkPolicy.isElk(key())||key()==='wood_bison';
      const labels=mapMetric==='success'?
        (isElk?['0–19%','20–39%','40–59%','60–79%','80%+']:
          ['0–9%','10–19%','20–29%','30–39%','40%+']):
        ['0–1','1–3','3–10','10–30','30+'];
      const scale=mapMetric==='success'?(isElk?elkSuccessClasses:classes):densityClasses;
      legendNode.replaceChildren();
      labels.forEach((name,i)=>{
        const span=document.createElement('span');
        const swatch=document.createElement('i');
        swatch.style.backgroundColor=scale[i].color;
        span.append(swatch,document.createTextNode(name));
        legendNode.append(span);
      });
      if(mapMetric==='success'&&documentedWithoutRate()>0){
        const item=document.createElement('span');
        item.className='hs-inspected-legend';
        const swatch=document.createElement('i');
        swatch.style.backgroundColor=INSPECTION_EVIDENCE_COLOR;
        swatch.style.border='1px solid rgba(255,255,255,.6)';
        item.append(swatch,document.createTextNode(
          'Inspected harvest · no comparable success rate ('+inspectedPeriodLabel()+')'));
        legendNode.append(item);
      }
      if(key()==='wood_bison'){
        const note=document.createElement('span');
        note.className='hs-elk-data-note';
        note.textContent=mapMetric==='success'?'Bison · LEH survey only; GOS not available':'Bison · annual LEH hunter participation / 100 km²';
        legendNode.append(note);
      }
      if(elkPolicy.isElk(key())){
        const note=document.createElement('span');
        note.className='hs-elk-data-note';
        note.textContent=elkPolicy.isRoosevelt(key())?
          'Coastal WMUs · all elk, not Roosevelt-only':
          'Interior WMUs · all elk, not Rocky-only';
        legendNode.append(note);
      }
      legendNode.setAttribute('aria-label',mapMetric==='success'?'Success rate legend':'Annual estimated hunters per 100 square kilometres legend');
      legendNode.hidden=!enabled||!active();
    }
  }
  const btn=document.getElementById('hs-harvest-toggle');
  const control=document.getElementById('hs-harvest-panel');
  const period=document.getElementById('hs-harvest-period');
  const detail=document.getElementById('hs-harvest-detail');
  const legend=document.getElementById('hs-harvest-legend');
  if(!btn||!control||!period||!detail||!legend) throw Error('Hunter success controls missing');
  const wmuLookup=document.getElementById('hs-wmu-lookup');
  const wmuQuery=document.getElementById('hs-wmu-query');
  const wmuLookupStatus=document.getElementById('hs-wmu-lookup-status');
  let lookupIds=new Set();
  let context=null,enabled=false,layer=null,info=null,renderSerial=0,yearsLoading=false;
  let openedFromLookup=false;
  let boundaries=null,pendingBoundaries=null,official=null,pendingOfficial=null;
  let sheepAge=null,pendingAge=null,selectedSpecies=null;
  let history=null;
  const historyByCode=new Map(),pendingHistoryByCode=new Map();
  let sampleCache=new Map(),cachedYears=null,cachedYearsKey=null;
  const resetStats=()=>{sampleCache.clear();cachedYears=null;cachedYearsKey=null;};
  let selectedWmu=null,pendingUnitRestore=null;
  function restoreUnitAfterModeSwitch(){
    if(!pendingUnitRestore)return;
    const id=pendingUnitRestore;
    pendingUnitRestore=null;
    if(excludedForSpecies(id))return;
    selectedWmu=id;
    renderWmuCard(id);
    chartYear=null;
    drawTrend();
    refreshStyle();
  }

  let chartRange='all',chartYear=null;
  function chartRows(id){
    if(excludedForSpecies(id))return [];
    const archive=modeArchive()[id]||{};
    const available=availableYears(),last=available.at(-1)||2024;
    const start=chartRange==='all'?-Infinity:last-(chartRange==='5'?4:9);
    // Only reported observations, missing years stay gaps.
    return available.filter(year=>year>=start).map(year=>{
      const values=yearlyEstimate(id,year);
      const ok=Array.isArray(values)&&Number.isFinite(values[0])&&values[0]>0&&Number.isFinite(values[1])&&values[1]>=0&&values[1]<=values[0];
      return {year,hunters:ok?values[0]:null,harvest:ok?values[1]:null,rate:ok?100*values[1]/values[0]:null};
    });
  }
  function drawTrend(){
    const root=document.getElementById('hs-trend-chart'),readout=document.getElementById('hs-trend-readout');
    if(!root||!readout||!selectedWmu)return;
    document.querySelectorAll('[data-trend-range]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.trendRange===chartRange)));
    const data=chartRows(selectedWmu),valid=data.filter(v=>v.rate!==null);
    if(!valid.length){root.textContent='No comparable yearly figures for this unit.';readout.textContent='';return;}
    const selected=valid.find(v=>v.year===chartYear)||valid.at(-1);
    chartYear=selected.year;
    const W=300,H=160,L=30,R=37,T=12,B=25;
    const x=y=>L+(y-data[0].year)/Math.max(1,data.at(-1).year-data[0].year)*(W-L-R);
    const rmax=Math.max(20,Math.ceil(Math.max(...valid.map(v=>v.rate))/10)*10);
    const hmax=Math.max(10,Math.ceil(Math.max(...valid.map(v=>v.hunters))/10)*10);
    const yr=v=>T+(H-T-B)*(1-v/rmax),yh=v=>T+(H-T-B)*(1-v/hmax);
    const ns='http://www.w3.org/2000/svg';
    const el=(tag,props={},text)=>{const n=document.createElementNS(ns,tag);Object.entries(props).forEach(([k,v])=>n.setAttribute(k,String(v)));if(text!==undefined)n.textContent=text;return n;};
    const svg=el('svg',{viewBox:'0 0 '+W+' '+H,role:'img','aria-label':'Annual resident hunter success and participation for WMU '+selectedWmu});
    for(let i=0;i<=4;i++){
      const y=T+(H-T-B)*i/4;
      svg.append(el('line',{x1:L,x2:W-R,y1:y,y2:y,class:'hs-trend-grid'}));
      svg.append(el('text',{x:L-5,y:y+3,'text-anchor':'end',class:'hs-trend-axis'},Math.round(rmax*(1-i/4))+'%'));
      svg.append(el('text',{x:W-R+5,y:y+3,class:'hs-trend-axis'},String(Math.round(hmax*(1-i/4)))));
    }
    const labels=[data[0].year,Math.round((data[0].year+data.at(-1).year)/2),data.at(-1).year];
    [...new Set(labels)].forEach(y=>svg.append(el('text',{x:x(y),y:H-5,'text-anchor':'middle',class:'hs-trend-axis'},String(y))));
    for(const [field,mapper,cls] of [['hunters',yh,'hs-trend-hunters-line'],['rate',yr,'hs-trend-success-line']]){
      let d='',lastSeen=false;
      for(const v of data){
        if(v[field]===null){lastSeen=false;continue;}
        d+=(lastSeen?' L':' M')+x(v.year).toFixed(1)+' '+mapper(v[field]).toFixed(1);
        lastSeen=true;
      }
      svg.append(el('path',{d,fill:'none',class:cls}));
    }
    const inspect=year=>{chartYear=year;drawTrend();};
    valid.forEach(v=>{
      const dot=el('circle',{cx:x(v.year),cy:yr(v.rate),r:v.year===selected.year?4:3,tabindex:0,role:'button',class:'hs-trend-point','aria-label':v.year+': '+v.rate.toFixed(1)+'% success, '+v.hunters+' estimated hunters'});
      dot.addEventListener('click',()=>inspect(v.year));
      dot.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();inspect(v.year);}});
      svg.append(dot);
    });
    svg.append(el('line',{x1:x(selected.year),x2:x(selected.year),y1:T,y2:H-B,class:'hs-trend-cursor'}));
    root.replaceChildren(svg);
    const chooser=document.createElement('select');
    chooser.setAttribute('aria-label','Inspect season');
    valid.forEach(v=>{const option=document.createElement('option');option.value=String(v.year);option.textContent=String(v.year);option.selected=v.year===selected.year;chooser.append(option);});
    chooser.addEventListener('change',()=>inspect(Number(chooser.value)));
    const text=document.createElement('span');
    text.textContent=selected.rate.toFixed(1)+'% · '+Math.round(selected.hunters).toLocaleString()+' est. hunters · '+Math.round(selected.harvest).toLocaleString()+' est. harvested';
    readout.replaceChildren(chooser,text);
  }

  const storage=()=>{try{return window.localStorage}catch(_){return null}};
  const storedPeriod=storage()?.getItem('hs-success-period')||'ten';
  period.value=['current','average','ten','all','custom'].includes(storedPeriod)?storedPeriod:'ten';
  let customStart=Number(storage()?.getItem('hs-success-start'))||2015;
  let customEnd=Number(storage()?.getItem('hs-success-end'))||2024;

  const key=()=>context?.getSpecies()||'';
  const code=()=>CODE_BY_KEY[key()]||null;
  const isSheep=()=>code()==='SHEE';
  // Shared with the private distribution viewer; 'elk' is its Rocky key.
  const excludedForSpecies=id=>elkPolicy.excludesFromSuccess(key(),id);
  const active=()=>!!context&&context.getProvince()==='bc'&&key()!=='grizzly_bear';
  // The drop-down may say Rocky Mountain or Roosevelt; the source's success
  // denominator is the combined provincial ELK category, never subspecies.
  const label=()=>key()==='wood_bison'?'Bison · LEH only':elkPolicy.isRoosevelt(key())?'Roosevelt elk · coastal elk survey':
    elkPolicy.isRocky(key())?'Rocky Mountain elk · interior elk survey':
    (window.HUNTSMART_SPECIES||[]).find(item=>item.key===key())?.label||key().replace(/_/g,' ');
  const rows=()=>official?.species?.[code()]||null;
  const historicalYear=()=>/^\d{4}$/.test(period.value)&&Number(period.value)<2024;
  let yearsMemoCode=null,yearsMemoHistory=null,yearsMemoOfficial=null,yearsMemo=[];
  function availableYears() {
    const archive=modeArchive();
    const cacheToken=huntMode()==='leh'?lehData:huntMode()==='combined'?history:null;
    const scopeKey=code()+'|'+key()+'|'+huntMode();
    if(yearsMemoCode===scopeKey&&yearsMemoHistory===cacheToken&&yearsMemoOfficial===official)return yearsMemo;
    const found=new Set();
    // The selector must reflect the selected species' eligible geography,
    // rather than all years reported for elk elsewhere in BC.
    for(const [id,unit] of Object.entries(archive)){
      if(excludedForSpecies(id))continue;
      for(const [year,v] of Object.entries(unit)){
        if(/^\d{4}$/.test(year)&&Array.isArray(v)&&Number.isFinite(v[0])&&v[0]>0&&Number.isFinite(v[1])&&v[1]>=0)
          found.add(Number(year));
      }
    }
    if(huntMode()==='combined'&&Object.entries(rows()||{}).some(([id,r])=>!excludedForSpecies(id)&&Array.isArray(r.y)&&r.y[0]>0&&r.y[1]>=0))found.add(2024);
    yearsMemo=[...found].sort((a,b)=>a-b);
    yearsMemoCode=scopeKey;yearsMemoHistory=cacheToken;yearsMemoOfficial=official;
    return yearsMemo;
  }
  function selectedYears(){
    if(historicalYear())return [Number(period.value)];
    const cacheKey=code()+'|'+key()+'|'+huntMode()+'|'+period.value+'|'+customStart+'|'+customEnd+'|'+(huntMode()==='leh'?(lehData?'ready':'pending'):(history?.species?.[code()]?'ready':'pending'));
    if(cachedYearsKey===cacheKey)return cachedYears;
    cachedYearsKey=cacheKey;
    const available=availableYears();
    if(!available.length)return cachedYears=[];
    const latest=available[available.length-1];
    if(period.value==='current')cachedYears=[latest];
    else if(period.value==='average')cachedYears=available.filter(y=>y>=latest-4);
    else if(period.value==='ten')cachedYears=available.filter(y=>y>=latest-9);
    else if(period.value==='all')cachedYears=available;
    else if(period.value==='custom')cachedYears=available.filter(y=>y>=customStart&&y<=customEnd);
    else cachedYears=[latest];
    return cachedYears;
  }
  function selectedYearLabel(){
    const yrs=selectedYears();
    if(!yrs.length)return 'No available years';
    return yrs.length===1?String(yrs[0]):yrs[0]+'–'+yrs[yrs.length-1]+' pooled';
  }
  function selectedRow(id){
    if(excludedForSpecies(id))return null;
    const yrs=selectedYears();
    if(!yrs.length)return null;
    if(yrs.length===1){
      const y=yrs[0],v=yearlyEstimate(id,y);
      const validated=huntMode()==='combined'?history?.metrics?.[id]?.[String(y)]:null;
      return Array.isArray(v)?{y:v,coverage:1,validated}:null;
    }
    // The published 2020–24 provincial pooled estimate is retained verbatim.
    if(huntMode()==='combined'&&period.value==='average'&&yrs.length===5&&yrs[0]===2020&&yrs[4]===2024){
      const officialPooled=rows()?.[id]?.p5;
      return Array.isArray(officialPooled)?{p5:officialPooled,coverage:officialPooled[2]}:null;
    }
    let hunters=0,kills=0,coverage=0;
    for(const y of yrs){
      const v=yearlyEstimate(id,y);
      if(!Array.isArray(v)||!Number.isFinite(v[0])||v[0]<=0||
         !Number.isFinite(v[1])||v[1]<0)continue;
      hunters+=v[0];kills+=v[1];coverage++;
    }
    return coverage?{p5:[hunters,kills,coverage],coverage}:null;
  }
  function sample(rec) {
    const pooled=selectedYears().length>1,v=pooled?rec?.p5:rec?.y;
    if(!Array.isArray(v)||!Number.isFinite(v[0])||!Number.isFinite(v[1])||
       v[0]<=0||v[1]<0)return null;
    const hunters=v[0],kills=v[1],years=pooled?v[2]:1;
    const requested=selectedYears().length;
    // Annual combined results use the Python-reconciled rate and quality contract.
    // LEH and pooled statistics preserve their distinct source-specific calculations.
    const checked=(!pooled&&huntMode()==='combined')?rec?.validated:null;
    return {hunters,kills,years,rate:checked&&Number.isFinite(checked[0])?checked[0]:Math.round(1000*kills/hunters)/10,
      reliable:hunters>=(pooled?50:10)&&kills<=hunters&&
        (!checked||checked[1]==='ratio_comparable')&&
        Number.isFinite(years)&&years>=(pooled?Math.min(3,requested):1),
      coverage:years+'/'+requested};
  }
  function unitStats(id) {
    if(!sampleCache.has(id))sampleCache.set(id,sample(selectedRow(id)));
    return sampleCache.get(id);
  }
  function reliableCount() {
    const ids=new Set([...Object.keys(modeArchive()),...(huntMode()==='combined'?Object.keys(rows()||{}):[])]);
    let count=0;
    for(const id of ids)if(!excludedForSpecies(id)&&unitStats(id)?.reliable)count++;
    return count;
  }
  function syncYearControls(){
    const years=availableYears(),chip=document.getElementById('hs-year-trigger');
    if(chip){
      const label=selectedYearLabel().replace(' pooled','');
      const status=document.getElementById('hs-year-status');
      chip.textContent=yearsLoading?'Loading years…':label==='No available years'?'Years unavailable':label;
      chip.disabled=yearsLoading||!years.length;
      chip.hidden=!enabled||!active();
      if(status)status.textContent=chip.hidden?'':yearsLoading?'Loading reporting years…':
        years.length?'Reporting years: '+label:'Reporting years unavailable.';
    }
    const start=document.getElementById('hs-year-from'),end=document.getElementById('hs-year-to');
    if(start&&end){
      const options=years.map(y=>'<option value="'+y+'">'+y+'</option>').join('');
      if(start.dataset?.years!==years.join(',')){
        start.innerHTML=options;end.innerHTML=options;
        if(start.dataset)start.dataset.years=years.join(',');
      }
      const min=years[0]||1976,max=years.at(-1)||2024;
      customStart=Math.max(min,Math.min(max,customStart));
      customEnd=Math.max(customStart,Math.min(max,customEnd));
      start.value=String(customStart);end.value=String(customEnd);
    }
    const customControls=document.getElementById('hs-year-custom-controls');
    if(customControls)customControls.hidden=period.value!=='custom';
    for(const preset of ['current','average','ten','all','custom']){
      const button=document.querySelector?.('[data-hs-period="'+preset+'"]');
      if(button)button.setAttribute('aria-pressed',String(period.value===preset));
    }
  }
  const setDetail=text=>{detail.textContent=text;};
  function updateButton(){
    btn.textContent=key()==='wood_bison'?'Success unavailable':'Success';
    btn.title=key()==='wood_bison'?'Historical bison hunt areas cross WMUs; verified WMU success is unavailable.':'';
    btn.setAttribute('aria-pressed',String(enabled));
    btn.setAttribute('aria-label',enabled?'Show species distribution':'Show hunter success by WMU');
  }
  function removeLayer(){
    ++renderSerial;
    yearsLoading=false;
    selectedWmu=null;
    openedFromLookup=false;
    if(wmuLookup){
      wmuLookup.hidden=true;
      wmuQuery.value='';
      wmuLookupStatus.textContent='';
    }
    const card=document.getElementById('hs-wmu-card');
    if(card)card.hidden=true;
    const floatingLegend=document.getElementById('hs-metric-legend');
    if(floatingLegend)floatingLegend.hidden=true;
    if(layer){layer.setMap(null);layer=null;}
    if(info)info.close();
    info=null;
  }
  function refreshStyle(){
    if(!layer)return;
    const opacity=Math.max(0,Math.min(1,context.getOpacity()));
    layer.setStyle(feature=>{
      const id=String(feature.getProperty('wmu_id')||feature.getProperty('WMUNIT_NUM')||'');
      const excluded=excludedForSpecies(id);
      const record=excluded?null:unitStats(id);
      const value=mapMetric==='success'?record?.rate:densityFor(id,record);
      const documented=mapMetric==='success'&&recordedKills(id)>0;
      const ok=!!record?.reliable&&Number.isFinite(value);
      const classScale=mapMetric==='success'?
        ((elkPolicy.isElk(key())||key()==='wood_bison')?elkSuccessClasses:classes):densityClasses;
      const colour=classScale.find(x=>value<=x.max)?.color||'#c45145';
      return {fillColor:ok?colour:documented?INSPECTION_EVIDENCE_COLOR:'#8c9494',
        fillOpacity:(excluded?0:ok?0.76:documented?0.38:record?0.17:0.07)*opacity,
        strokeColor:id===selectedWmu?'#fff':ok?'#e5e7da':documented?'#c3d4e3':'#a9aeae',
        strokeOpacity:(excluded?0:ok?0.85:documented?0.9:0.28)*opacity,
        strokeWeight:id===selectedWmu?2.6:ok?1.05:documented?1.4:0.65,zIndex:id===selectedWmu?27:25,clickable:!excluded};
    });
  }
  function ageSummary(id){
    if(!isSheep()||!['current','average'].includes(period.value)||!sheepAge?.units)return null;
    const subtype={
      stone_sheep:['Stone Sheep'],dall_tatshenshini:['Dall Sheep'],
      thinhorn_sheep:['Stone Sheep','Dall Sheep'],
      rocky_bighorn_kootenay:['Rocky Mtn Bighorn'],
      california_bighorn_boundary:['California Bighorn']
    }[key()];
    const found=Object.entries(sheepAge.units).filter(([name,v])=>
      name.startsWith(id+'|')&&!name.endsWith('|Unknown')&&
      Array.isArray(v)&&v[0]>=sheepAge.minimum_display_sample&&
      (!subtype||subtype.includes(name.slice(id.length+1))));
    if(!found.length)return null;
    return 'Inspected ram age ('+sheepAge.period+'): '+
      found.map(([name,v])=>name.slice(id.length+1)+' mean '+v[1]+
      ' years (n='+v[0]+')').join('; ')+'. Incomplete sample, not herd age.';
  }
  function openWmu(id, fromLookup=false){
    if(!id||excludedForSpecies(id))return;
    selectedWmu=id;
    openedFromLookup=fromLookup;
    if(wmuQuery){
      wmuQuery.value=id;
      wmuLookupStatus.textContent='';
    }
    refreshStyle();
    renderWmuCard(id);
    chartYear=null;
    drawTrend();
    if(fromLookup)document.getElementById('hs-wmu-title')?.focus();
  }
  function displayPopup(event){
    openWmu(String(event.feature.getProperty('wmu_id')||event.feature.getProperty('WMUNIT_NUM')||''));
  }
  function populateWmuLookup(collection){
    if(!wmuLookup)return;
    const ids=collection.features
      .map(feature=>String(feature.properties.wmu_id||feature.properties.WMUNIT_NUM))
      .filter(id=>!excludedForSpecies(id))
      .sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
    lookupIds=new Set(ids);
    document.getElementById('hs-wmu-options').replaceChildren(...ids.map(id=>{
      const option=document.createElement('option');
      option.value=id;
      return option;
    }));
    wmuLookup.hidden=false;
  }
  function renderWmuCard(id){
    const s=unitStats(id);
    const card=document.getElementById('hs-wmu-card');
    if(!card)return;
    const write=(id,value)=>{const node=document.getElementById(id);if(node)node.textContent=value;};
    write('hs-wmu-title','WMU '+id);
    write('hs-wmu-meta',label()+' · '+selectedYearLabel());
    write('hs-wmu-rate',s?.reliable?s.rate.toFixed(1)+'%':'—');
    write('hs-wmu-harvest',s?Math.round(s.kills).toLocaleString():'—');
    write('hs-wmu-hunters',s?Math.round(s.hunters).toLocaleString():'—');
    const density=densityFor(id,s);
    write('hs-wmu-density',density===null?'—':density.toFixed(density<10?1:0));
    const densityDescription=document.getElementById('hs-wmu-meta');
    if(densityDescription)densityDescription.textContent=label()+' · '+selectedYearLabel()+
      (mapMetric==='density'?' · Hunter density':' · Hunter success');
    const inspected=recordedKills(id);
    const recordedNode=document.getElementById('hs-wmu-recorded');
    const inspectionSource=document.getElementById('hs-wmu-inspection-source');
    if(inspectionSource)inspectionSource.hidden=inspected===0;
    if(recordedNode){
      recordedNode.hidden=inspected===0;
      const type=elkPolicy.isRoosevelt(key())?'Roosevelt elk ':elkPolicy.isRocky(key())?'Rocky Mountain elk ':'';
      recordedNode.textContent=inspected>0?
        inspected.toLocaleString()+' inspected '+type+'hunter kills · '+inspectedPeriodLabel()+
        '. Licence-year records; not the same measure as estimated harvest.':'';
    }
    const caveats=[];
    if(inspected>0)caveats.push('Compulsory inspections may not represent all harvested animals. Licence-year inspection counts and calendar-year resident estimates cannot be compared directly. Elk subspecies in WILD inspections can be assigned from reported kill location, not genetic testing.');
    if(huntMode()==='gos')caveats.push('No verified GOS-only WMU hunter or harvest estimates have been loaded. The combined provincial figures must not be represented as GOS success.');
    const source=document.getElementById('hs-wmu-source');
    if(source){source.href=huntMode()==='leh'?LEH_CATALOGUE:BC_GOVERNMENT_HARVEST_DATA;
      source.textContent=huntMode()==='leh'?'BC LEH Survey Estimates':'Government of BC harvest statistics';}
    const note=document.getElementById('hs-trend-note');
    if(note)note.textContent=huntMode()==='leh'?
      'BC LEH survey estimates only. GOS and combined rates are unavailable. Only single-WMU hunts are mapped; sums across hunt codes represent hunter participations, not unique hunters.':
      'Combined resident estimates (LEH and GOS); original survey response counts are not supplied. Annual ratios may be volatile in low-volume units; not subspecies-specific.';
    const huntersLabel=document.getElementById('hs-wmu-hunters-label');
    if(huntersLabel)huntersLabel.textContent=huntMode()==='leh'?'LEH hunter participations':'Hunters';
    if(!s?.reliable)caveats.push(s?'Low estimated hunter volume or non-comparable harvest/hunter ratio. This is a presentation rule, not a statistical confidence interval.':'No comparable resident estimate for this period.');
    if(!s?.reliable&&s?.kills>0)caveats.push('Estimated harvest is reported here even though this sample cannot support a comparable success rate. This does not mean zero harvest.');
    if(s?.coverage&&selectedYears().length>1)caveats.push('Reported years: '+s.coverage+'.');
    if(elkPolicy.isElk(key()))caveats.push('BC provincial ELK harvest statistics combine Roosevelt and Rocky Mountain elk; the success rate is not subspecies-specific.');
    else if(!EXACT.has(key()))caveats.push('BC category: '+(NAMES[code()]||'unavailable')+'; not subspecies-specific.');
    if(elkPolicy.isRocky(key()))caveats.push('Regions 1 and 2 are excluded from the Rocky Mountain elk view. Interior all-elk figures are not confirmed Rocky Mountain elk success.');
    if(elkPolicy.isRoosevelt(key()))caveats.push('Only coastal Regions 1 and 2 are displayed. These are geographically screened all-elk records, not a Roosevelt-specific success rate or proof of presence in every WMU.');
    caveats.push(huntMode()==='leh'?
      'LEH estimates are by hunt code, aggregated only where each record refers to one WMU and has complete survey estimates. Hunter participation may count a person more than once across hunt codes.':
      'Combined resident harvest; not GOS-only, LEH draw, legal-ram or trophy odds.');
    caveats.push('Hunter density uses mean annual estimated hunters divided by approximate mapped WMU area; this is a relative pressure proxy, not actual hunter locations or accessible hunting area.');
    if(selectedYears().some(y=>y<2024))caveats.push('Historical years use current WMU shapes. Boundaries, regulations and reporting methods may differ.');
    const age=ageSummary(id);
    if(age)caveats.push(age);
    write('hs-wmu-caveats',caveats.join(' '));
    card.hidden=false;
  }
  async function loadOfficial(){
    if(official)return;
    if(!pendingOfficial)pendingOfficial=fetch(OFFICIAL_SOURCE)
      .then(r=>{if(!r.ok)throw Error('Official BC harvest data unavailable');return r.json();})
      .then(data=>{
        if(data?.meta?.publisher!=='Government of British Columbia'||
           data?.meta?.source_sha256!==SOURCE_SHA||
           !data?.species?.DEMU?.['3-27']?.y||
           !data?.species?.SHEE?.['3-17']?.y)
          throw Error('Official BC harvest snapshot invalid');
        official=data;
      }).finally(()=>{pendingOfficial=null;});
    return pendingOfficial;
  }
  async function loadHistory(selectedCode=code()){
    if(!selectedCode)return;
    if(historyByCode.has(selectedCode)){
      history=historyByCode.get(selectedCode);
      return;
    }
    if(!pendingHistoryByCode.has(selectedCode)){
      const pending=fetch(HISTORY_SOURCE(selectedCode))
        .then(r=>{if(!r.ok)throw Error('Historical BC harvest data unavailable');return r.json();})
        .then(data=>{
          if(data?.meta?.publisher!=='Government of British Columbia'||
             data?.meta?.source_sha256!==SOURCE_SHA||
             data?.meta?.first_year!==1976||
             data?.meta?.last_year!==2024||
             data?.code!==selectedCode||
             !data?.species?.[selectedCode])
            throw Error('Historical BC harvest data invalid');
          historyByCode.set(selectedCode,data);
        }).finally(()=>pendingHistoryByCode.delete(selectedCode));
      pendingHistoryByCode.set(selectedCode,pending);
    }
    await pendingHistoryByCode.get(selectedCode);
    if(code()===selectedCode)history=historyByCode.get(selectedCode);
  }
  async function loadAge(){
    if(sheepAge)return;
    if(!pendingAge)pendingAge=fetch(SHEEP_AGES)
      .then(r=>r.ok?r.json():null)
      .then(a=>{sheepAge=a?.minimum_display_sample===5?a:null;})
      .catch(()=>{sheepAge=null;})
      .finally(()=>{pendingAge=null;});
    return pendingAge;
  }
  function fetchBoundaries(){
    if(boundaries)return Promise.resolve(boundaries);
    if(pendingBoundaries)return pendingBoundaries;
    // The existing vector WMU index has all 225 polygons simplified for map
    // display; using the full original JS adds unnecessary network and CPU cost.
    pendingBoundaries=fetch('/map-tiles/bc-success-boundaries.json', {cache:'no-cache'})
      .then(r=>{if(!r.ok)throw Error('BC WMU map index unavailable');return r.json();})
      .then(manifest=>{
        if(manifest?.version!=='2026-10-28-vector-v2')throw Error('BC WMU map version mismatch');
        const collection=manifest?.bc?.index;
        if(collection?.type!=='FeatureCollection'||
           !Array.isArray(collection.features)||collection.features.length!==225||
           !collection.features.every(f=>f.geometry &&
             typeof (f.properties?.wmu_id||f.properties?.WMUNIT_NUM)==='string'))
          throw Error('BC WMU index is missing or incomplete');
        boundaries=collection;
        areaByWmu=new Map(collection.features.map(feature=>{
          const id=String(feature.properties?.wmu_id||feature.properties?.WMUNIT_NUM||'');
          return [id,areaKm2(feature.geometry)];
        }));
        return boundaries;
      }).finally(()=>{pendingBoundaries=null;});
    return pendingBoundaries;
  }
  function summary(){
    const type=code(),n=reliableCount(),date=selectedYearLabel();
    const caution=selectedYears().some(y=>y<2024)?
      ' Historical data shown on current WMU boundaries; regulations and reporting methods may have changed.':'';
    if(!type)return 'No comparable BC Government WMU hunter-success category for '+label()+'.';
    const closure=type==='BEAG'?' Grizzly bear hunting is closed in BC; these are historical records.':'';
    if(huntMode()==='gos')return 'GOS-only WMU success is not available in the published datasets. The Hunter Sample Survey includes GOS and LEH; subtracting separate LEH survey counts would not be statistically valid. Switch to LEH or Combined.';
    const elkWarning=elkPolicy.isElk(key())?
      ' Provincial ELK records combine Roosevelt and Rocky Mountain elk; not subspecies-specific success.'+
        (elkPolicy.isRocky(key())?' Regions 1 and 2 excluded for Rocky Mountain elk.':
          ' Coastal Regions 1 and 2 only; other BC regions excluded. WMUs are not a verified Roosevelt range.'):'';
    const lowSampleInspections=documentedWithoutRate();
    const inspectionNote=lowSampleInspections?
      ' '+lowSampleInspections+' additional WMUs have inspected harvest records ('+inspectedPeriodLabel()+') but no comparable hunter-success rate. Blue-grey in Success mode; no inference of zero harvest elsewhere.':'';
    if(!n)return 'No sufficiently reported '+date+' WMU hunter-success data for '+label()+'.'+inspectionNote+caution;
    return n+' WMUs with comparable '+date+
      (huntMode()==='leh'?' LEH harvest estimates.':' resident harvest estimates.')+' Grey = missing/low estimated hunter volume. Tap a WMU for details.'+
      (EXACT.has(key())||elkPolicy.isElk(key())?'':' Provincial category: '+NAMES[type]+' (not subspecies-specific).')+
      closure+elkWarning+inspectionNote+caution+(huntMode()==='leh'?' LEH survey only; GOS and combined estimates unavailable. Single-WMU hunt areas only.':'');
  }
  async function draw(){
    if(!enabled||!active()||!context.getMap()||layer)return;
    const generation=++renderSerial;
    yearsLoading=!!code()&&huntMode()!=='gos';
    syncYearControls();
    setDetail('Loading official BC WMU harvest data…');
    try{
      const targetCode=code();
      if(!targetCode){
        syncYearControls();setDetail(summary());return;
      }
      // Independent requests run simultaneously; none delays another.
      // The optional ram-age detail must never hold up the coloured WMU map.
      if(huntMode()==='gos'){
        syncYearControls();
        setDetail(summary());
        restoreUnitAfterModeSwitch();
        return;
      }
      await Promise.all(huntMode()==='leh'?
        [loadLeh(),fetchBoundaries()]:
        [loadOfficial(),loadHistory(targetCode),fetchBoundaries(),loadInspections().catch(e=>console.warn('Optional inspection evidence unavailable',e))]);
      if(generation!==renderSerial||!enabled||!active()||code()!==targetCode)return;
      resetStats();
      yearsLoading=false;
      syncYearControls();
      updateMetricControls();
      if(isSheep())void loadAge();
      if(generation!==renderSerial||!enabled||!active())return;
      if(!reliableCount()&&!documentedWithoutRate()&&!hasEstimatedHarvest()){
        legend.hidden=true;setDetail(summary());
        restoreUnitAfterModeSwitch();
        return;
      }
      const collection=boundaries;
      if(generation!==renderSerial||!enabled||!active())return;
      layer=new google.maps.Data({map:context.getMap()});
      layer.addGeoJson(collection);
      layer.addListener('click',displayPopup);
      populateWmuLookup(collection);
      refreshStyle();
      legend.hidden=false;updateMetricControls();setDetail(summary());
      restoreUnitAfterModeSwitch();
    }catch(e){
      if(generation===renderSerial){
        yearsLoading=false;
        enabled=false;updateButton();legend.hidden=true;period.hidden=true;
        syncYearControls();
        setDetail(e?.message||'Hunter success unavailable.');
        context.onModeChange();
      }
    }finally{if(generation===renderSerial)btn.disabled=false;}
  }
  function sync(){
    const visible=active();
    control.hidden=!visible;
    btn.hidden=!visible;
    btn.disabled=!visible||key()==='wood_bison';
    if(visible&&key()==='wood_bison'){
      selectedSpecies=key();enabled=false;removeLayer();resetStats();updateButton();period.hidden=true;legend.hidden=true;
      setDetail('Bison LEH hunt areas cross WMUs; no verified WMU hunter-success estimates.');syncYearControls();return;
    }
    if(!visible){
      selectedSpecies=null;enabled=false;removeLayer();
      updateButton();period.hidden=true;legend.hidden=true;setDetail('');syncYearControls();return;
    }
    if(selectedSpecies!==key()){
      removeLayer();selectedSpecies=key();
      history=historyByCode.get(code())||null;
      resetStats();
    }
    updateButton();
    if(enabled&&!layer)void draw();
    else{
      syncYearControls();
      if(enabled)updateMetricControls();
    }
  }
  function exitSuccess(silent=false){
    if(!enabled)return;
    enabled=false;removeLayer();period.hidden=true;legend.hidden=true;
    setDetail('');updateButton();syncYearControls();
    if(!silent)context.onModeChange();
  }
  btn.addEventListener('click',()=>{
    if(!active()||btn.disabled||key()==='wood_bison')return;
    // The active mode tab should remain a mode tab; reporting years have their
    // own visible control and should not open when Success is clicked again.
    if(enabled)return;
    enabled=true;updateButton();
    period.hidden=false;legend.hidden=false;
    return context.onModeChange();
  });
  function changePeriod(){
    selectedWmu=null;removeLayer();resetStats();
    storage()?.setItem('hs-success-period',period.value);
    if(enabled)void draw();
    else syncYearControls();
  }
  period.addEventListener('change',changePeriod);
  document.querySelectorAll?.('[data-hs-metric]')?.forEach(button=>button.addEventListener('click',()=>{
    if(button.dataset.hsMetric===mapMetric)return;
    mapMetric=button.dataset.hsMetric==='density'?'density':'success';
    updateMetricControls();
    refreshStyle();
    if(selectedWmu)renderWmuCard(selectedWmu);
  }));
  document.querySelectorAll('[data-trend-range]').forEach(button=>button.addEventListener('click',()=>{
    chartRange=button.dataset.trendRange;chartYear=null;drawTrend();
  }));
  document.getElementById('hs-year-trigger')?.addEventListener('click',()=>{
    control.classList.toggle('is-open');
  });
  document.getElementById('hs-year-close')?.addEventListener('click',()=>control.classList.remove('is-open'));
  wmuLookup?.addEventListener('submit',event=>{
    event.preventDefault();
    const id=wmuQuery.value.trim().replace(/^WMU\s*/i,'').replace(/\s*[-–]\s*/,'-').replace(/-0+(?=\d)/,'-');
    if(!lookupIds.has(id)){
      wmuLookupStatus.textContent='No matching WMU for this map.';
      return;
    }
    openWmu(id,true);
  });
  wmuQuery?.addEventListener('input',()=>{wmuLookupStatus.textContent='';});
  document.getElementById('hs-wmu-close')?.addEventListener('click',()=>{
    selectedWmu=null;const card=document.getElementById('hs-wmu-card');
    if(card)card.hidden=true;
    if(wmuLookup){
      wmuQuery.value='';
      wmuLookupStatus.textContent='';
      if(openedFromLookup)wmuQuery.focus();
    }
    openedFromLookup=false;
    refreshStyle();
  });
  document.querySelectorAll?.('[data-hs-period]').forEach(button=>button.addEventListener('click',()=>{
    period.value=button.dataset.hsPeriod;
    changePeriod();
  }));
  function changeCustom(){
    const from=document.getElementById('hs-year-from'),to=document.getElementById('hs-year-to');
    if(!from||!to)return;
    customStart=Number(from.value);customEnd=Math.max(customStart,Number(to.value));
    storage()?.setItem('hs-success-start',String(customStart));
    storage()?.setItem('hs-success-end',String(customEnd));
    period.value='custom';changePeriod();
  }
  document.getElementById('hs-year-from')?.addEventListener('change',changeCustom);
  document.getElementById('hs-year-to')?.addEventListener('change',changeCustom);
  document.getElementById('layer-opacity')?.addEventListener('input',refreshStyle);
  window.HUNTSMART_BC_HARVEST_CODES=CODE_BY_KEY;
  window.HUNTSMART_HARVEST_DATA_COVERAGE='Official BC WMU 1976–2024 (species history loads on demand)';
  window.HUNTSMART_SHEEP_OFFICIAL_DATA={harvest:OFFICIAL_SOURCE,ages:SHEEP_AGES};
  window.HUNTSMART_HARVEST_SUCCESS={
    attach(args){context=args;updateButton();
      const instance={
        sync,exitSuccess,fetchBoundaries,isEnabled:()=>enabled&&active(),
        // Production QA checks painted geometry rather than only rendered buttons.
        getRenderState(){
          let features=0;
          if(layer?.forEach)layer.forEach(()=>{features++;});
          return {enabled:enabled&&active(),features,ready:features===225,
            message:detail.textContent,year:period.value,species:key()};
        }
      };
      window.HUNTSMART_HARVEST_RENDER_STATE=()=>instance.getRenderState();
      return instance;
    }
  };
})();