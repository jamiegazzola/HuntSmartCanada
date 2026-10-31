let __layerAbort=null;

// The displayed rasters are only 650px wide for most species, so five-decimal GIS geometry
// was far more detailed than the screen could render. Keep point observations precise, but
// simplify polygon responses to roughly screen resolution on touch devices.
arcGeo=async function(layer,where='1=1',outFields='*',maxOffset='0.02'){
  const features=[];let offset=0;
  const isPointQuery=maxOffset==='0';
  const requested=Number(maxOffset);
  const effectiveOffset=isPointQuery?'0':String(Math.max(Number.isFinite(requested)?requested:0.02,coarse()?0.025:0.015));
  const precision=isPointQuery?'5':coarse()?'3':'4';
  for(let page=0;page<50;page++){
    const q=new URLSearchParams({where,outFields,returnGeometry:'true',returnZ:'false',returnM:'false',outSR:'4326',f:'geojson',resultOffset:String(offset),resultRecordCount:'1000',orderByFields:'OBJECTID',geometryPrecision:precision,maxAllowableOffset:effectiveOffset});
    const r=await fetch(`${layer}/query?${q}`,{signal:__layerAbort?.signal});
    if(!r.ok)throw new Error(`BC GIS request failed (${r.status})`);
    const j=await r.json();if(j.error)throw new Error(j.error.message||'BC GIS request failed');
    const b=j.features||[];features.push(...b);
    if(b.length<1000&&!j.exceededTransferLimit)break;if(!b.length)break;offset+=b.length;
  }
  return{type:'FeatureCollection',features};
};

const ROOSEVELT_ITEM='2774803ccefc42579458b269ad190bf8';
async function __json(url,label){
  const r=await fetch(url,{mode:'cors',signal:__layerAbort?.signal});
  if(!r.ok)throw new Error(`${label} (${r.status})`);
  const j=await r.json();if(j?.error)throw new Error(j.error.message||label);return j;
}
function __densityField(features){
  const keys=[...new Set((features||[]).flatMap(f=>Object.keys(f.properties||{})))];
  return keys.find(k=>/^Indiv_per_sqkm_2023$/i.test(k))||
    keys.find(k=>/2023/i.test(k)&&/(indiv|density)/i.test(k))||
    keys.find(k=>/(indiv.*sqkm|density)/i.test(k));
}
async function rooseveltData(){
  const k='roosevelt:epu:current';if(cache.has(k))return cache.get(k);
  const itemBase=`https://governmentofbc.maps.arcgis.com/sharing/rest/content/items/${ROOSEVELT_ITEM}`;
  const meta=await __json(`${itemBase}?f=json`,'Roosevelt elk dataset unavailable');
  let service=meta.url;
  if(!service){
    const itemData=await __json(`${itemBase}/data?f=json`,'Roosevelt elk dataset unavailable');
    service=itemData?.operationalLayers?.find(x=>x.url)?.url||itemData?.tables?.find(x=>x.url)?.url;
  }
  if(!service)throw new Error('Roosevelt elk service is unavailable');
  service=service.replace(/\/$/,'');
  let layerUrl=service;
  if(!/\/(?:FeatureServer|MapServer)\/\d+$/i.test(service)){
    const info=await __json(`${service}?f=json`,'Roosevelt elk service unavailable');
    const layerId=info.layers?.[0]?.id;
    if(layerId==null)throw new Error('Roosevelt elk layer is unavailable');
    layerUrl=`${service}/${layerId}`;
  }
  const q=new URLSearchParams({where:'1=1',outFields:'*',returnGeometry:'true',outSR:'4326',f:'geojson'});
  const fc=await __json(`${layerUrl}/query?${q}`,'Roosevelt elk population units unavailable');
  const features=fc.features||[];const densityField=__densityField(features);
  if(!features.length||!densityField)throw new Error('Roosevelt elk density data is incomplete');
  const out={type:'FeatureCollection',features,densityField};cache.set(k,out);return out;
}
function __rooseveltStyle(d){return f=>{
  const v=Number(f.getProperty(d.densityField));
  if(!Number.isFinite(v)||v<=0)return{visible:false};
  const level=v<=0.05?1:v<=0.10?2:v<=0.25?3:4,c=PALETTE[level];
  return{fillColor:`rgb(${c[0]},${c[1]},${c[2]})`,fillOpacity:opacity*.82,strokeColor:'rgba(255,255,255,.35)',strokeOpacity:.35,strokeWeight:.6};
}}
function showRoosevelt(d){const data=new google.maps.Data({map});data.addGeoJson({type:'FeatureCollection',features:d.features});data.setStyle(__rooseveltStyle(d));activeData=data}
async function __rooseveltHabitatFallback(){
  const k='roosevelt:habitat-fallback';if(cache.has(k))return cache.get(k);
  const w=650,h=307,m=await beiMask('M_CEEL_RO','modern',w,h),c=document.createElement('canvas');c.width=w;c.height=h;
  const x=c.getContext('2d');x.drawImage(m,0,0);const im=x.getImageData(0,0,w,h),a=im.data,col=PALETTE[2];
  for(let i=0;i<a.length;i+=4){if(a[i+3]){a[i]=col[0];a[i+1]=col[1];a[i+2]=col[2];a[i+3]=col[3]}}
  x.putImageData(im,0,0);const url=c.toDataURL('image/png');cache.set(k,url);return url;
}

async function showGrizzly(period){const g=await grizzlyData(),data=new google.maps.Data({map});data.addGeoJson({type:'FeatureCollection',features:g.features});data.setStyle(f=>{const v=Number(f.getProperty(period==='modern'?'__modern':'__historic'));if(!Number.isFinite(v))return{visible:false};const level=v<=g.cuts[0]?1:v<=g.cuts[1]?2:v<=g.cuts[2]?3:4,c=PALETTE[level];return{fillColor:`rgb(${c[0]},${c[1]},${c[2]})`,fillOpacity:opacity*.78,strokeWeight:0}});activeData=data}
function clearActive(){if(activeRaster){activeRaster.setMap(null);activeRaster=null}if(activeData){activeData.setMap(null);activeData=null}}
function updateOpacity(){if(activeRaster)activeRaster.setOpacity(opacity);if(activeData&&currentKey==='grizzly_bear'){const g=cache.get('grizzly:data');activeData.setStyle(f=>{const v=Number(f.getProperty(currentPeriod==='modern'?'__modern':'__historic'));if(!Number.isFinite(v))return{visible:false};const level=v<=g.cuts[0]?1:v<=g.cuts[1]?2:v<=g.cuts[2]?3:4,c=PALETTE[level];return{fillColor:`rgb(${c[0]},${c[1]},${c[2]})`,fillOpacity:opacity*.78,strokeWeight:0}})}else if(activeData&&currentKey==='roosevelt_elk'&&currentPeriod==='modern'){const d=cache.get('roosevelt:epu:current');if(d)activeData.setStyle(__rooseveltStyle(d))}}
async function render(){
  const token=++renderToken,t=byKey[currentKey];
  if(__layerAbort)__layerAbort.abort();__layerAbort=new AbortController();
  showLoading(true);clearActive();
  try{
    if(currentKey==='roosevelt_elk'&&currentPeriod==='modern'){
      try{const d=await rooseveltData();if(token!==renderToken)return;showRoosevelt(d)}
      catch(e){if(e?.name==='AbortError')throw e;console.warn('Roosevelt EPU data unavailable, using habitat fallback:',e);const url=await __rooseveltHabitatFallback();if(token!==renderToken)return;activeRaster=new google.maps.GroundOverlay(url,BOUNDS,{map,opacity,clickable:false});showToast('Using BC Roosevelt habitat fallback',1800)}
    }else if(t.kind==='grizzly')await showGrizzly(currentPeriod);
    else{const pair=t.kind==='points'?await pointPair(t):await rasterPair(t);if(token!==renderToken)return;activeRaster=new google.maps.GroundOverlay(pair[currentPeriod],BOUNDS,{map,opacity,clickable:false})}
  }catch(e){if(e?.name!=='AbortError'){console.error(e);showToast(e.message||'Layer unavailable',2600)}}finally{if(token===renderToken)showLoading(false)}
}
function setPeriod(p){currentPeriod=p;localStorage.setItem('bc-species-period',p);$('modern').classList.toggle('active',p==='modern');$('historic').classList.toggle('active',p==='historic');render()}
speciesEl.addEventListener('change',e=>{currentKey=e.target.value;localStorage.setItem('bc-species-key',currentKey);render()});$('modern').addEventListener('click',()=>setPeriod('modern'));$('historic').addEventListener('click',()=>setPeriod('historic'));$('opacity').addEventListener('input',e=>{opacity=Number(e.target.value)/100;updateOpacity()});
function coordText(p){return`${p.lat().toFixed(6)}, ${p.lng().toFixed(6)}`}async function copyText(v){try{await navigator.clipboard.writeText(v);return true}catch(_){const t=document.createElement('textarea');t.value=v;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();const ok=document.execCommand('copy');t.remove();return ok}}
function syncPin(){if(!pin)return;coord.textContent=coordText(pin.getPosition());pinCard.classList.add('show')}function clearPin(){clearTimeout(pinTimer);if(pin){pin.setMap(null);pin=null}pinCard.classList.remove('show')}function armPin(){clearTimeout(pinTimer);pinTimer=setTimeout(clearPin,60000)}async function copyPin(){if(!pin)return;showToast(await copyText(coordText(pin.getPosition()))?'Coordinates copied':'Copy failed')}
function placePin(pos){if(!pin){pin=new google.maps.Marker({map,position:pos,draggable:true,title:'Drag to adjust'});pin.addListener('dragstart',()=>clearTimeout(pinTimer));pin.addListener('drag',syncPin);pin.addListener('dragend',()=>{syncPin();armPin()});pin.addListener('click',()=>{copyPin();armPin()})}else pin.setPosition(pos);syncPin();armPin();if(navigator.vibrate)navigator.vibrate(20)}
$('copy').addEventListener('click',()=>{copyPin();armPin()});coord.addEventListener('click',()=>{copyPin();armPin()});function clearHold(){if(holdTimer){clearTimeout(holdTimer);holdTimer=null}}function pointToLatLng(x,y){if(!projectionHelper?.getProjection())return null;const r=$('map').getBoundingClientRect();return projectionHelper.getProjection().fromContainerPixelToLatLng(new google.maps.Point(x-r.left,y-r.top))}
function installLongPress(){const el=$('map');el.addEventListener('contextmenu',e=>e.preventDefault(),true);el.addEventListener('pointerdown',e=>{if(!coarse()||e.target.closest?.('button,select,input,.gm-control-active,.gm-style-mtc'))return;activePointer=e.pointerId;startX=e.clientX;startY=e.clientY;clearHold();holdTimer=setTimeout(()=>{holdTimer=null;const ll=pointToLatLng(startX,startY);if(ll)placePin(ll)},650)},true);el.addEventListener('pointermove',e=>{if(e.pointerId===activePointer&&Math.hypot(e.clientX-startX,e.clientY-startY)>10)clearHold()},true);for(const type of['pointerup','pointercancel'])el.addEventListener(type,e=>{if(e.pointerId===activePointer){clearHold();activePointer=null}},true)}
$('tilt').addEventListener('click',()=>{is3d=!is3d;$('tilt').textContent=is3d?'2D':'3D';$('tilt').classList.toggle('active',is3d);map?.setTilt(is3d?45:0);map?.setHeading(is3d?20:0)});
window.initSpeciesMap=()=>{try{const stored=JSON.parse(localStorage.getItem('bc-species-view')||'null');map=new google.maps.Map($('map'),{center:stored?.center||{lat:54.4,lng:-125.7},zoom:stored?.zoom||5,mapTypeId:google.maps.MapTypeId.HYBRID,mapTypeControl:false,streetViewControl:false,fullscreenControl:false,zoomControl:!coarse(),gestureHandling:'greedy',clickableIcons:false,backgroundColor:'#111714',restriction:{latLngBounds:{north:62.5,south:45.5,east:-109.5,west:-143.5},strictBounds:false}});projectionHelper=new google.maps.OverlayView();projectionHelper.onAdd=()=>{};projectionHelper.draw=()=>{};projectionHelper.onRemove=()=>{};projectionHelper.setMap(map);if(!stored)map.fitBounds(new google.maps.LatLngBounds({lat:BOUNDS.south,lng:BOUNDS.west},{lat:BOUNDS.north,lng:BOUNDS.east}),coarse()?18:{left:20,top:70,right:20,bottom:55});map.addListener('click',e=>{if(!coarse())placePin(e.latLng)});map.addListener('idle',()=>{const c=map.getCenter();if(c)localStorage.setItem('bc-species-view',JSON.stringify({center:{lat:c.lat(),lng:c.lng()},zoom:map.getZoom()}))});installLongPress();render()}catch(e){$('error-text').textContent=e.message||'Google Maps failed to initialize.';$('error').classList.add('show')}};
window.gm_authFailure=()=>{$('error-text').textContent='Google Maps authorization failed.';$('error').classList.add('show')};const cfg=document.createElement('script');cfg.src='/.netlify/functions/google-maps-config?rev=species-v4';cfg.onload=()=>{const key=window.GOOGLE_MAPS_API_KEY;if(!key){$('error-text').textContent='Google Maps configuration is unavailable.';$('error').classList.add('show');return}const s=document.createElement('script');s.async=true;s.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=initSpeciesMap&v=weekly&loading=async&auth_referrer_policy=origin`;s.onerror=()=>{$('error-text').textContent='Google Maps failed to load.';$('error').classList.add('show')};document.head.appendChild(s)};cfg.onerror=()=>{$('error-text').textContent='Google Maps configuration failed.';$('error').classList.add('show')};document.head.appendChild(cfg);
