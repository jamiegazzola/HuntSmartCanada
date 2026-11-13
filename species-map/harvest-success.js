(() => {
  'use strict';
  // BC Government WMU 2020-24 figures, not third-party estimates. Parent-species
  // records cannot be interpreted as subspecies-specific, GOS or trophy odds.
  const BC_GOVERNMENT_HARVEST_DATA='https://catalogue.data.gov.bc.ca/dataset/big-game-harvest-statistics-1976-to-2024';
  const OFFICIAL_SOURCE='/species-map/data/bc-official-harvest-wmu-2020-2024.json?v=gov-bc-20261113';
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

  const key=()=>context?.getSpecies()||'';
  const code=()=>CODE_BY_KEY[key()]||null;
  const isSheep=()=>code()==='SHEE';
  const active=()=>!!context&&context.getProvince()==='bc';
  const label=()=>(window.HUNTSMART_SPECIES||[]).find(item=>item.key===key())?.label||
    key().replace(/_/g,' ');
  const rows=()=>official?.species?.[code()]||null;
  function sample(rec) {
    const pooled=period.value==='average',v=pooled?rec?.p5:rec?.y;
    if(!Array.isArray(v)||!Number.isFinite(v[0])||!Number.isFinite(v[1])||
       v[0]<=0||v[1]<0) return null;
    const hunters=v[0],kills=v[1],years=pooled?v[2]:1;
    return {hunters,kills,years,rate:Math.round(1000*kills/hunters)/10,
      reliable:hunters>=(pooled?50:10)&&kills<=hunters&&
        Number.isFinite(years)&&years>=(pooled?3:1)};
  }
  const reliableCount=()=>Object.values(rows()||{}).filter(r=>sample(r)?.reliable).length;
  const setDetail=text=>{detail.textContent=text;};
  function updateButton(){
    btn.textContent=enabled?'Show Distribution':'Show Hunter Success';
    btn.setAttribute('aria-pressed',String(enabled));
    btn.setAttribute('aria-label',enabled?'Show species distribution':'Show hunter success by WMU');
  }
  function removeLayer(){
    ++renderSerial;
    if(layer){layer.setMap(null);layer=null;}
    if(info)info.close();
    info=null;
  }
  function refreshStyle(){
    if(!layer)return;
    const opacity=Math.max(0,Math.min(1,context.getOpacity()));
    layer.setStyle(feature=>{
      const id=String(feature.getProperty('wmu_id')||feature.getProperty('WMUNIT_NUM')||'');
      const record=sample(rows()?.[id]),ok=!!record?.reliable;
      const colour=classes.find(x=>record?.rate<=x.max)?.color||'#c45145';
      return {fillColor:ok?colour:'#8c9494',
        fillOpacity:(ok?0.76:record?0.17:0.07)*opacity,
        strokeColor:ok?'#e5e7da':'#a9aeae',
        strokeOpacity:(ok?0.85:0.28)*opacity,
        strokeWeight:ok?1.05:0.65,zIndex:25,clickable:true};
    });
  }
  function ageSummary(id){
    if(!isSheep()||!sheepAge?.units)return null;
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
    const rec=rows()?.[id],s=sample(rec);
    if(!info)info=new google.maps.InfoWindow();
    const box=document.createElement('div');
    box.style.cssText='color:#18231b;font:13px/1.5 system-ui,sans-serif;max-width:255px';
    const header=document.createElement('strong');
    header.style.fontSize='15px';
    header.textContent='BC WMU '+id+' · '+label();
    box.appendChild(header);
    const add=message=>{const line=document.createElement('div');line.textContent=message;
      line.style.marginTop='5px';box.appendChild(line);};
    const date=period.value==='average'?'2020–24 pooled':'2024';
    if(s)add(s.reliable?
      date+' estimated resident harvest per 100 hunters: '+s.rate+
        ' ('+s.kills.toLocaleString()+' animals / '+s.hunters.toLocaleString()+' hunters)':
      date+': '+s.kills+' animals / '+s.hunters+
        ' estimated hunters. Small/incomplete/non-comparable sample; no success colour.');
    else add('No comparable hunter-success estimate for '+date+'.');
    if(rec?.y)add('2024: '+(rec.y[0]==null?'hunters unavailable':rec.y[0].toLocaleString()+
      ' estimated resident hunters')+' · '+(rec.y[1]==null?'harvest unavailable':
      rec.y[1].toLocaleString()+' resident animals harvested'));
    if(!EXACT.has(key()))add('BC reports '+(NAMES[code()]||'no category')+
      ', not separate '+label()+' hunter success; this is NOT subspecies-specific.');
    add('All resident harvest, not GOS-only, LEH draw, legal-male or trophy success.');
    const age=ageSummary(id);
    if(age)add(age);
    const source=document.createElement('a');
    source.href=BC_GOVERNMENT_HARVEST_DATA;
    source.target='_blank';source.rel='noopener noreferrer';
    source.textContent='Data source: Government of BC';
    source.style.cssText='display:inline-block;margin-top:6px;color:#17653e';
    box.appendChild(source);
    if(age){
      const a=document.createElement('a');
      a.href='https://catalogue.data.gov.bc.ca/dataset/compulsory-inspection-data-1900-to-2023-24';
      a.target='_blank';a.rel='noopener noreferrer';
      a.textContent='Ram-age inspection data';
      a.style.cssText='display:block;margin-top:4px;color:#17653e';
      box.appendChild(a);
    }
    info.setContent(box);info.setPosition(event.latLng);info.open({map:context.getMap()});
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
    const type=code(),n=reliableCount();
    if(!type)return 'No comparable BC Government WMU hunter-success category for '+label()+'.';
    if(type==='BEAG')return 'Grizzly hunting has been closed in BC since 2017. No 2020–24 legal hunter-success figures.';
    if(!n)return 'No sufficiently reported '+(period.value==='average'?'2020–24':'2024')+
      ' WMU hunter-success data for '+label()+'.';
    return n+' WMUs with comparable '+(period.value==='average'?'2020–24 pooled':'2024')+
      ' resident harvest estimates. Grey = missing/small sample. Tap a WMU for details.'+
      (EXACT.has(key())?'':' Provincial category: '+NAMES[type]+' (not subspecies-specific).');
  }
  async function draw(){
    if(!enabled||!active()||!context.getMap()||layer)return;
    const generation=++renderSerial;
    setDetail('Loading official BC WMU harvest data…');
    try{
      await loadOfficial();
      if(generation!==renderSerial||!enabled||!active())return;
      if(isSheep())await loadAge();
      if(generation!==renderSerial||!enabled||!active())return;
      if(!rows()||!reliableCount()){
        legend.hidden=true;setDetail(summary());return;
      }
      const collection=await fetchBoundaries();
      if(generation!==renderSerial||!enabled||!active())return;
      layer=new google.maps.Data({map:context.getMap()});
      layer.addGeoJson(collection);
      layer.addListener('click',displayPopup);
      refreshStyle();
      legend.hidden=false;setDetail(summary());
    }catch(e){
      if(generation===renderSerial){
        enabled=false;updateButton();legend.hidden=true;period.hidden=true;
        setDetail(e?.message||'Hunter success unavailable.');
        context.onModeChange();
      }
    }finally{if(generation===renderSerial)btn.disabled=false;}
  }
  function sync(){
    const visible=active();
    control.hidden=!visible;
    if(!visible){
      selectedSpecies=null;enabled=false;removeLayer();btn.disabled=false;
      updateButton();period.hidden=true;legend.hidden=true;setDetail('');return;
    }
    if(selectedSpecies!==key()){
      removeLayer();selectedSpecies=key();
      period.value=isSheep()?'average':'current';
    }
    if(enabled&&!layer)void draw();
  }
  btn.addEventListener('click',()=>{
    if(!active()||btn.disabled)return;
    enabled=!enabled;updateButton();
    period.hidden=!enabled;legend.hidden=!enabled;
    if(!enabled){removeLayer();setDetail('');}
    return context.onModeChange();
  });
  period.addEventListener('change',()=>{
    if(info)info.close();
    if(!enabled)return;
    if(!reliableCount()){removeLayer();legend.hidden=true;void draw();}
    else if(!layer)void draw();
    else{refreshStyle();legend.hidden=false;setDetail(summary());}
  });
  document.getElementById('layer-opacity')?.addEventListener('input',refreshStyle);
  window.HUNTSMART_BC_HARVEST_CODES=CODE_BY_KEY;
  window.HUNTSMART_HARVEST_DATA_COVERAGE='Official BC WMU 2020–2024';
  window.HUNTSMART_SHEEP_OFFICIAL_DATA={harvest:OFFICIAL_SOURCE,ages:SHEEP_AGES};
  window.HUNTSMART_HARVEST_SUCCESS={
    attach(args){context=args;updateButton();
      return{sync,isEnabled:()=>enabled&&active()};}
  };
})();