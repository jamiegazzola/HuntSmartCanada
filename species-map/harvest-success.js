(() => {
  'use strict';
  // BC Government WMU 2020-24 figures, not third-party estimates. Parent-species
  // records cannot be interpreted as subspecies-specific, GOS or trophy odds.
  const BC_GOVERNMENT_HARVEST_DATA='https://catalogue.data.gov.bc.ca/dataset/big-game-harvest-statistics-1976-to-2024';
  const OFFICIAL_SOURCE='/species-map/data/bc-official-harvest-wmu-2020-2024.json?v=gov-bc-20261113';
  // Read only the selected government's species category instead of downloading
  // the entire ~916 KB provincial archive whenever Success is opened.
  const HISTORY_SOURCE=code=>'/species-map/data/harvest-history-'+code.toLowerCase()+'.json?v=sharded-20261118';
  const SOURCE_SHA='e433ed8fc5a9af0db38b190ee068cb48495d9a4a201613c86db13d63a3ade45e';
  const SHEEP_AGES='/species-map/data/bc-sheep-age-ci-2022-2025.json?v=20261113f';
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
    CARI:'caribou (all ecotypes)',BEAG:'grizzly bear',BEAB:'black bear',
    BOBC:'bobcat',LYNX:'lynx',COUG:'cougar',WOLF:'wolf'};
  const EXACT=new Set(['mule_deer','white_tailed_deer','elk','moose',
    'mountain_goat','wild_sheep','caribou','grizzly_bear','black_bear',
    'lynx','bobcat','cougar','wolf']);
  const classes=[{max:9,color:'#468f58'},{max:19,color:'#a3b950'},
    {max:29,color:'#dfcb58'},{max:39,color:'#e28d42'},
    {max:100,color:'#c45145'}];
  const btn=document.getElementById('hs-harvest-toggle');
  const control=document.getElementById('hs-harvest-panel');
  const period=document.getElementById('hs-harvest-period');
  const detail=document.getElementById('hs-harvest-detail');
  const legend=document.getElementById('hs-harvest-legend');
  if(!btn||!control||!period||!detail||!legend) throw Error('Hunter success controls missing');
  let context=null,enabled=false,layer=null,info=null,renderSerial=0;
  let boundaries=null,pendingBoundaries=null,official=null,pendingOfficial=null;
  let sheepAge=null,pendingAge=null,selectedSpecies=null;
  let history=null;
  const historyByCode=new Map(),pendingHistoryByCode=new Map();
  let sampleCache=new Map(),cachedYears=null,cachedYearsKey=null;
  const resetStats=()=>{sampleCache.clear();cachedYears=null;cachedYearsKey=null;};
  let selectedWmu=null;
  const storage=()=>{try{return window.localStorage}catch(_){return null}};
  const storedPeriod=storage()?.getItem('hs-success-period')||'ten';
  period.value=['current','average','ten','all','custom'].includes(storedPeriod)?storedPeriod:'ten';
  let customStart=Number(storage()?.getItem('hs-success-start'))||2015;
  let customEnd=Number(storage()?.getItem('hs-success-end'))||2024;

  const key=()=>context?.getSpecies()||'';
  const code=()=>CODE_BY_KEY[key()]||null;
  const isSheep=()=>code()==='SHEE';
  const active=()=>!!context&&context.getProvince()==='bc';
  const label=()=>(window.HUNTSMART_SPECIES||[]).find(item=>item.key===key())?.label||
    key().replace(/_/g,' ');
  const rows=()=>official?.species?.[code()]||null;
  const historicalYear=()=>/^\d{4}$/.test(period.value)&&Number(period.value)<2024;
  let yearsMemoCode=null,yearsMemoHistory=null,yearsMemoOfficial=null,yearsMemo=[];
  function availableYears() {
    if(yearsMemoCode===code()&&yearsMemoHistory===history&&yearsMemoOfficial===official)return yearsMemo;
    const found=new Set();
    for(const unit of Object.values(history?.species?.[code()]||{})){
      for(const [year,v] of Object.entries(unit)){
        if(/^\d{4}$/.test(year)&&Array.isArray(v)&&Number.isFinite(v[0])&&v[0]>0&&Number.isFinite(v[1])&&v[1]>=0)
          found.add(Number(year));
      }
    }
    if(Object.values(rows()||{}).some(r=>Array.isArray(r.y)&&r.y[0]>0&&r.y[1]>=0))found.add(2024);
    yearsMemo=[...found].sort((a,b)=>a-b);
    yearsMemoCode=code();yearsMemoHistory=history;yearsMemoOfficial=official;
    return yearsMemo;
  }
  function selectedYears(){
    if(historicalYear())return [Number(period.value)];
    const cacheKey=code()+'|'+period.value+'|'+customStart+'|'+customEnd+'|'+(history?.species?.[code()]?'ready':'pending');
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
    const yrs=selectedYears();
    if(!yrs.length)return null;
    if(yrs.length===1){
      const y=yrs[0],v=y===2024?rows()?.[id]?.y:history?.species?.[code()]?.[id]?.[String(y)];
      return Array.isArray(v)?{y:v,coverage:1}:null;
    }
    // The published 2020–24 provincial pooled estimate is retained verbatim.
    if(period.value==='average'&&yrs.length===5&&yrs[0]===2020&&yrs[4]===2024){
      const officialPooled=rows()?.[id]?.p5;
      return Array.isArray(officialPooled)?{p5:officialPooled,coverage:officialPooled[2]}:null;
    }
    let hunters=0,kills=0,coverage=0;
    for(const y of yrs){
      const v=y===2024?rows()?.[id]?.y:history?.species?.[code()]?.[id]?.[String(y)];
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
    return {hunters,kills,years,rate:Math.round(1000*kills/hunters)/10,
      reliable:hunters>=(pooled?50:10)&&kills<=hunters&&
        Number.isFinite(years)&&years>=(pooled?Math.min(3,requested):1),
      coverage:years+'/'+requested};
  }
  function unitStats(id) {
    if(!sampleCache.has(id))sampleCache.set(id,sample(selectedRow(id)));
    return sampleCache.get(id);
  }
  function reliableCount() {
    const ids=new Set([...Object.keys(history?.species?.[code()]||{}),...Object.keys(rows()||{})]);
    let count=0;
    for(const id of ids)if(unitStats(id)?.reliable)count++;
    return count;
  }
  function syncYearControls(){
    const years=availableYears(),chip=document.getElementById('hs-year-trigger');
    if(chip){
      const label=selectedYearLabel().replace(' pooled','');
      chip.textContent=label==='No available years'?'Years unavailable':label+' ▾';
      chip.hidden=!enabled||!active();
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
    for(const preset of ['current','average','ten','all','custom']){
      const button=document.querySelector?.('[data-hs-period="'+preset+'"]');
      if(button)button.setAttribute('aria-pressed',String(period.value===preset));
    }
  }
  const setDetail=text=>{detail.textContent=text;};
  function updateButton(){
    btn.textContent='Success';
    btn.setAttribute('aria-pressed',String(enabled));
    btn.setAttribute('aria-label',enabled?'Show species distribution':'Show hunter success by WMU');
  }
  function removeLayer(){
    ++renderSerial;
    selectedWmu=null;
    const card=document.getElementById('hs-wmu-card');
    if(card)card.hidden=true;
    if(layer){layer.setMap(null);layer=null;}
    if(info)info.close();
    info=null;
  }
  function refreshStyle(){
    if(!layer)return;
    const opacity=Math.max(0,Math.min(1,context.getOpacity()));
    layer.setStyle(feature=>{
      const id=String(feature.getProperty('wmu_id')||feature.getProperty('WMUNIT_NUM')||'');
      const record=unitStats(id),ok=!!record?.reliable;
      const colour=classes.find(x=>record?.rate<=x.max)?.color||'#c45145';
      return {fillColor:ok?colour:'#8c9494',
        fillOpacity:(ok?0.76:record?0.17:0.07)*opacity,
        strokeColor:id===selectedWmu?'#fff':ok?'#e5e7da':'#a9aeae',
        strokeOpacity:(ok?0.85:0.28)*opacity,
        strokeWeight:id===selectedWmu?2.6:ok?1.05:0.65,zIndex:id===selectedWmu?27:25,clickable:true};
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
  function displayPopup(event){
    const id=String(event.feature.getProperty('wmu_id')||event.feature.getProperty('WMUNIT_NUM')||'');
    selectedWmu=id;
    refreshStyle();
    const rec=selectedRow(id),s=unitStats(id);
    const card=document.getElementById('hs-wmu-card');
    if(!card)return;
    const write=(id,value)=>{const node=document.getElementById(id);if(node)node.textContent=value;};
    write('hs-wmu-title','WMU '+id);
    write('hs-wmu-meta',label()+' · '+selectedYearLabel());
    write('hs-wmu-rate',s?.reliable?s.rate.toFixed(1)+'%':'—');
    write('hs-wmu-harvest',s?s.kills.toLocaleString():'—');
    write('hs-wmu-hunters',s?s.hunters.toLocaleString():'—');
    const caveats=[];
    if(!s?.reliable)caveats.push(s?'Small or non-comparable sample; not mapped as a reliable rate.':'No comparable resident estimate for this period.');
    if(s?.coverage&&selectedYears().length>1)caveats.push('Reported years: '+s.coverage+'.');
    if(!EXACT.has(key()))caveats.push('BC category: '+(NAMES[code()]||'unavailable')+'; not subspecies-specific.');
    caveats.push('All resident harvest; not GOS-only, LEH draw, legal-ram or trophy odds.');
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
    pendingBoundaries=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='/bc-wmu-geojson.js?v=harvest-wmu-20261113';
      script.async=true;
      script.onload=()=>{
        if(typeof BC_WMU_GEOJSON==='undefined'||!Array.isArray(BC_WMU_GEOJSON.features)||
           BC_WMU_GEOJSON.features.length!==225)
          reject(Error('BC WMU boundaries are missing or incomplete.'));
        else{boundaries=BC_WMU_GEOJSON;resolve(boundaries);}
      };
      script.onerror=()=>reject(Error('BC WMU boundaries could not load.'));
      document.head.appendChild(script);
    }).finally(()=>{pendingBoundaries=null;});
    return pendingBoundaries;
  }
  function summary(){
    const type=code(),n=reliableCount(),date=selectedYearLabel();
    const caution=selectedYears().some(y=>y<2024)?
      ' Historical data shown on current WMU boundaries; regulations and reporting methods may have changed.':'';
    if(!type)return 'No comparable BC Government WMU hunter-success category for '+label()+'.';
    const closure=type==='BEAG'?' Grizzly bear hunting is closed in BC; these are historical records.':'';
    if(!n)return 'No sufficiently reported '+date+' WMU hunter-success data for '+label()+'.'+caution;
    return n+' WMUs with comparable '+date+
      ' resident harvest estimates. Grey = missing/small sample. Tap a WMU for details.'+
      (EXACT.has(key())?'':' Provincial category: '+NAMES[type]+' (not subspecies-specific).')+
      closure+caution;
  }
  async function draw(){
    if(!enabled||!active()||!context.getMap()||layer)return;
    const generation=++renderSerial;
    setDetail('Loading official BC WMU harvest data…');
    try{
      const targetCode=code();
      if(!targetCode){
        syncYearControls();setDetail(summary());return;
      }
      // Independent requests run simultaneously; none delays another.
      // The optional ram-age detail must never hold up the coloured WMU map.
      await Promise.all([loadOfficial(),loadHistory(targetCode),fetchBoundaries()]);
      if(generation!==renderSerial||!enabled||!active()||code()!==targetCode)return;
      resetStats();
      syncYearControls();
      if(isSheep())void loadAge();
      if(generation!==renderSerial||!enabled||!active())return;
      if(!reliableCount()){
        legend.hidden=true;setDetail(summary());return;
      }
      const collection=boundaries;
      if(generation!==renderSerial||!enabled||!active())return;
      layer=new google.maps.Data({map:context.getMap()});
      layer.addGeoJson(collection);
      layer.addListener('click',displayPopup);
      refreshStyle();
      legend.hidden=false;setDetail(summary());
    }catch(e){
      if(generation===renderSerial){
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
    btn.disabled=!visible;
    if(!visible){
      selectedSpecies=null;enabled=false;removeLayer();
      updateButton();period.hidden=true;legend.hidden=true;setDetail('');syncYearControls();return;
    }
    if(selectedSpecies!==key()){
      removeLayer();selectedSpecies=key();
      history=historyByCode.get(code())||null;
      resetStats();
    }
    updateButton();syncYearControls();
    if(enabled&&!layer)void draw();
  }
  function exitSuccess(silent=false){
    if(!enabled)return;
    enabled=false;removeLayer();period.hidden=true;legend.hidden=true;
    setDetail('');updateButton();syncYearControls();
    if(!silent)context.onModeChange();
  }
  btn.addEventListener('click',()=>{
    if(!active()||btn.disabled)return;
    if(enabled){
      const panel=document.getElementById('hs-harvest-panel');
      if(panel)panel.classList.toggle('is-open');
      return;
    }
    enabled=true;updateButton();syncYearControls();
    period.hidden=false;legend.hidden=false;
    return context.onModeChange();
  });
  function changePeriod(){
    selectedWmu=null;removeLayer();resetStats();
    storage()?.setItem('hs-success-period',period.value);
    syncYearControls();
    if(enabled)void draw();
  }
  period.addEventListener('change',changePeriod);
  document.getElementById('hs-year-trigger')?.addEventListener('click',()=>{
    control.classList.toggle('is-open');
  });
  document.getElementById('hs-year-close')?.addEventListener('click',()=>control.classList.remove('is-open'));
  document.getElementById('hs-wmu-close')?.addEventListener('click',()=>{
    selectedWmu=null;const card=document.getElementById('hs-wmu-card');
    if(card)card.hidden=true;refreshStyle();
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
        sync,exitSuccess,isEnabled:()=>enabled&&active(),
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