const BOUNDS={north:60.1,south:48.1,east:-113.8,west:-139.2};
const PALETTE=[[0,0,0,0],[63,150,70,190],[244,208,63,200],[244,139,39,210],[215,48,39,220]];
const BEI='https://delivery.maps.gov.bc.ca/arcgis/rest/services/whse/bcgw_pub_whse_terrestrial_ecology/MapServer/22';
const CARIBOU='https://delivery.maps.gov.bc.ca/arcgis/rest/services/whse/bcgw_pub_whse_wildlife_inventory/MapServer/10';
const GRIZZLY='https://delivery.maps.gov.bc.ca/arcgis/rest/services/whse/bcgw_pub_whse_wildlife_inventory/MapServer/8';
const WSI='https://delivery.maps.gov.bc.ca/arcgis/rest/services/whse/bcgw_pub_whse_wildlife_inventory/MapServer/1';
const WSI_UNG='https://delivery.maps.gov.bc.ca/arcgis/rest/services/whse/bcgw_pub_whse_wildlife_inventory/MapServer/12';
const SHEEP='https://delivery.maps.gov.bc.ca/arcgis/rest/services/whse/bcgw_pub_whse_wildlife_management/MapServer/3';
const TAXA=[
 {group:'Deer',key:'mule_deer',label:'Mule Deer',kind:'bei',base:'mule_deer',prefix:'M_ODHE'},
 {group:'Deer',key:'columbian_blacktail',label:'Columbian Black-tailed Deer',kind:'bei',base:'mule_deer',prefix:'M_ODHE_CO'},
 {group:'Deer',key:'sitka_blacktail',label:'Sitka Black-tailed Deer',kind:'bei',base:'mule_deer',prefix:'M_ODHE_SI'},
 {group:'Deer',key:'dakota_whitetail',label:'Dakota White-tailed Deer',kind:'bei',base:'white_tailed_deer',prefix:'M_ODVI_DA'},
 {group:'Deer',key:'northwestern_whitetail',label:'Northwestern White-tailed Deer',kind:'bei',base:'white_tailed_deer',prefix:'M_ODVI_OC'},
 {group:'Elk',key:'roosevelt_elk',label:'Roosevelt Elk',kind:'bei',base:'elk',prefix:'M_CEEL_RO'},
 {group:'Elk',key:'rocky_mountain_elk',label:'Rocky Mountain Elk',kind:'bei',base:'elk',prefix:'M_CEEL_NE'},
 {group:'Moose',key:'northwestern_moose',label:'Northwestern Moose',kind:'bei',base:'moose',prefix:'M_ALAL_AN'},
 {group:'Moose',key:'alaskan_moose',label:'Alaskan Moose',kind:'bei',base:'moose',prefix:'M_ALAL_GI'},
 {group:'Moose',key:'shiras_moose',label:"Shiras' Moose",kind:'bei',base:'moose',prefix:'M_ALAL_SH'},
 {group:'Sheep',key:'bighorn_sheep',label:'Bighorn Sheep',kind:'sheepFamily',base:'wild_sheep',family:'bighorn'},
 {group:'Sheep',key:'thinhorn_sheep',label:'Thinhorn Sheep',kind:'sheepFamily',base:'wild_sheep',family:'thinhorn'},
 {group:'Sheep',key:'stone_sheep',label:"Stone's Sheep",kind:'bei',base:'wild_sheep',prefix:'M_OVDA_ST'},
 {group:'Caribou',key:'northern_mountain_caribou',label:'Northern Mountain Caribou',kind:'caribou',base:'caribou',ecotype:'Northern',historicPrefix:'M_RATA_NO'},
 {group:'Caribou',key:'southern_mountain_caribou',label:'Southern Mountain Caribou',kind:'caribou',base:'caribou',ecotype:'Mountain',historicPrefix:'M_RATA_MO'},
 {group:'Caribou',key:'boreal_caribou',label:'Boreal Caribou',kind:'caribou',base:'caribou',ecotype:'Boreal',historicPrefix:'M_RATA_BO'},
 {group:'Other',key:'mountain_goat',label:'Mountain Goat',kind:'base',base:'mountain_goat'},
 {group:'Bears',key:'grizzly_bear',label:'Grizzly Bear',kind:'grizzly'},
 {group:'Bears',key:'black_bear',label:'Black Bear',kind:'points',pointLayer:WSI,pointSpecies:'Black Bear'},
 {group:'Bison',key:'wood_bison',label:'Wood Bison',kind:'points',pointLayer:WSI_UNG,pointSpecies:'Wood Bison'}
];
const byKey=Object.fromEntries(TAXA.map(t=>[t.key,t])),cache=new Map();
let map=null,activeRaster=null,activeData=null,opacity=.70,renderToken=0,pin=null,pinTimer=null,projectionHelper=null,holdTimer=null,activePointer=null,startX=0,startY=0,is3d=false;
let currentKey=localStorage.getItem('bc-species-key')||'mule_deer';if(!byKey[currentKey])currentKey='mule_deer';
let currentPeriod=localStorage.getItem('bc-species-period')==='historic'?'historic':'modern';
const $=id=>document.getElementById(id),speciesEl=$('species'),loading=$('loading'),toast=$('toast'),pinCard=$('pin-card'),coord=$('coord');
for(const group of [...new Set(TAXA.map(t=>t.group))]){const og=document.createElement('optgroup');og.label=group;for(const t of TAXA.filter(x=>x.group===group)){const o=document.createElement('option');o.value=t.key;o.textContent=t.label;og.appendChild(o)}speciesEl.appendChild(og)}speciesEl.value=currentKey;
$('modern').classList.toggle('active',currentPeriod==='modern');$('historic').classList.toggle('active',currentPeriod==='historic');
function coarse(){return matchMedia('(pointer: coarse)').matches}function showLoading(v){loading.classList.toggle('show',v)}function showToast(m,ms=1800){toast.textContent=m;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),ms)}
async function gunzip(b64){if(!b64)throw new Error('Layer source missing');if(!('DecompressionStream'in window))throw new Error('A newer Safari or Chrome version is required.');const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text()}
function sourceFor(base,period){if(period==='historic')return{src:window.SPECIES_HIST_GZ?.[base]||'',gz:true,w:650,h:307};if(base==='mule_deer')return{src:window.SPECIES_FULL_MULE||'',gz:true,w:2600,h:1228};const gz=window.SPECIES_GZ?.[base];if(gz)return{src:gz,gz:true,w:650,h:307};const raw=window.SPECIES_DATA?.[base];return{src:raw||'',gz:false,w:650,h:307}}
async function baseCanvas(base,period){const k=`base:${base}:${period}`;if(cache.has(k))return cache.get(k);const s=sourceFor(base,period);if(!s.src)throw new Error(`${period==='historic'?'Historic':'Modern'} layer source missing`);const rle=s.gz?await gunzip(s.src):s.src,c=document.createElement('canvas');c.width=s.w;c.height=s.h;const x=c.getContext('2d'),im=x.createImageData(s.w,s.h),a=im.data;let p=0;for(const token of rle.split(',')){if(!token)continue;const level=Number(token[0]),n=parseInt(token.slice(1),36),col=PALETTE[level]||PALETTE[0];for(let j=0;j<n&&p<s.w*s.h;j++,p++){const z=p*4;a[z]=col[0];a[z+1]=col[1];a[z+2]=col[2];a[z+3]=col[3]}}if(p!==s.w*s.h)throw new Error('Distribution layer is incomplete');x.putImageData(im,0,0);cache.set(k,c);return c}
function px(lng,lat,w,h){return[(lng-BOUNDS.west)/(BOUNDS.east-BOUNDS.west)*w,(BOUNDS.north-lat)/(BOUNDS.north-BOUNDS.south)*h]}
function drawGeometry(ctx,geom,w,h){if(!geom)return;const polys=geom.type==='Polygon'?[geom.coordinates]:geom.type==='MultiPolygon'?geom.coordinates:[];for(const poly of polys){ctx.beginPath();for(const ring of poly){for(let i=0;i<ring.length;i++){const q=px(ring[i][0],ring[i][1],w,h);i?ctx.lineTo(...q):ctx.moveTo(...q)}ctx.closePath()}ctx.fill('evenodd')}}
async function arcGeo(layer,where='1=1',outFields='*',maxOffset='0.02'){const features=[];let offset=0;for(let page=0;page<50;page++){const q=new URLSearchParams({where,outFields,returnGeometry:'true',outSR:'4326',f:'geojson',resultOffset:String(offset),resultRecordCount:'1000',orderByFields:'OBJECTID',geometryPrecision:'5',maxAllowableOffset:maxOffset});const r=await fetch(`${layer}/query?${q}`);if(!r.ok)throw new Error(`BC GIS request failed (${r.status})`);const j=await r.json();if(j.error)throw new Error(j.error.message||'BC GIS request failed');const b=j.features||[];features.push(...b);if(b.length<1000&&!j.exceededTransferLimit)break;if(!b.length)break;offset+=b.length}return{type:'FeatureCollection',features}}
function maskCanvas(fc,w,h,filter=()=>true){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#fff';for(const f of fc.features||[])if(filter(f))drawGeometry(x,f.geometry,w,h);return c}
async function beiMask(prefix,period,w,h){const suffix=period==='modern'?'WTSUI':'WTCAP',s=`${prefix}_SLI6${suffix}`,q=`${prefix}_WLI6${suffix}`,where=`((${s} IS NOT NULL) AND (${s} <> '6')) OR ((${q} IS NOT NULL) AND (${q} <> '6'))`,k=`bei:${prefix}:${period}:${w}`;if(cache.has(k))return cache.get(k);const fc=await arcGeo(BEI,where,'OBJECTID','0.012'),m=maskCanvas(fc,w,h);cache.set(k,m);return m}
async function sheepFamilyMask(family,w,h){const k=`sheep:${family}:${w}`;if(cache.has(k))return cache.get(k);const fc=await arcGeo(SHEEP,'1=1','*','0.006'),needle=family.toLowerCase(),m=maskCanvas(fc,w,h,f=>Object.values(f.properties||{}).join(' ').toLowerCase().includes(needle));cache.set(k,m);return m}
async function sheepMask(t,period,w,h){return sheepFamilyMask(t.family,w,h)}
