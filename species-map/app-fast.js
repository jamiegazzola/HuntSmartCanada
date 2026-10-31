const __layerScriptLoads=new Map();
function __loadLayerScript(src){if(__layerScriptLoads.has(src))return __layerScriptLoads.get(src);const p=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=true;s.onload=resolve;s.onerror=()=>reject(new Error(`Layer asset failed to load: ${src}`));document.head.appendChild(s)});__layerScriptLoads.set(src,p);return p}
async function __ensureLayerSource(base,period){if(period==='historic'){
  if(window.SPECIES_HIST_GZ?.[base])return;
  const f={elk:'data/historic/elk.js',moose:'data/historic/moose.js',mule_deer:'data/historic/mule_deer.js',white_tailed_deer:'data/historic/white_tailed_deer.js',mountain_goat:'data/historic/mountain_goat.js',wild_sheep:'data/historic/wild_sheep.js',caribou:'data/historic/caribou.js'}[base];
  if(!f)throw new Error('Historic layer source missing');await __loadLayerScript(f);return;
 }
 if(base==='mule_deer'){
  if(window.SPECIES_FULL_MULE)return;
  await Promise.all(['data/mule-full-0.js','data/mule-full-1.js','data/mule-full-2.js','data/mule-full-3.js','data/mule-full-4.js','data/mule-full-5.js'].map(__loadLayerScript));return;
 }
 if(window.SPECIES_GZ?.[base]||window.SPECIES_DATA?.[base])return;
 const f={elk:'hires-elk.js',moose:'hires-moose.js',white_tailed_deer:'data/white_tailed_deer-hires.js',mountain_goat:'hires-b.js',wild_sheep:'hires-b.js',caribou:'hires-b.js'}[base];
 if(!f)throw new Error('Modern layer source missing');await __loadLayerScript(f);
}

// Correct the live taxonomy against the fields actually exposed by BC's current BEI layer.
Object.assign(byKey.mule_deer,{kind:'bei',prefix:'M_ODHE'});
Object.assign(byKey.california_bighorn,{kind:'sheepSub',family:'bighorn',sub:'california_bighorn'});
Object.assign(byKey.rocky_mountain_bighorn,{kind:'sheepSub',family:'bighorn',sub:'rocky_mountain_bighorn'});
Object.assign(byKey.stone_sheep,{kind:'sheepSub',family:'thinhorn',sub:'stone_sheep'});
Object.assign(byKey.dall_sheep,{kind:'sheepSub',family:'thinhorn',sub:'dall_sheep'});

const __SPECIES_CACHE_VERSION='v4';
const __MASK_CACHE=`huntsmart-species-masks-${__SPECIES_CACHE_VERSION}`;
const __IDB_NAME=`huntsmart-species-overlays-${__SPECIES_CACHE_VERSION}`;
const __BEI_MAP=BEI.replace(/\/22$/,'');
const __CARIBOU_MAP=CARIBOU.replace(/\/10$/,'');
const __SHEEP_MAP=SHEEP.replace(/\/3$/,'');
let __dbPromise=null;

function __openSpeciesDb(){if(!('indexedDB'in window))return Promise.resolve(null);if(__dbPromise)return __dbPromise;__dbPromise=new Promise(resolve=>{const req=indexedDB.open(__IDB_NAME,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('layers'))db.createObjectStore('layers')};req.onsuccess=()=>resolve(req.result);req.onerror=()=>resolve(null)});return __dbPromise}
async function __dbGet(key){const db=await __openSpeciesDb();if(!db)return null;return new Promise(resolve=>{try{const tx=db.transaction('layers','readonly'),req=tx.objectStore('layers').get(key);req.onsuccess=()=>resolve(req.result??null);req.onerror=()=>resolve(null)}catch(_){resolve(null)}})}
async function __dbPut(key,value){const db=await __openSpeciesDb();if(!db)return;return new Promise(resolve=>{try{const tx=db.transaction('layers','readwrite');tx.objectStore('layers').put(value,key);tx.oncomplete=()=>resolve();tx.onerror=tx.onabort=()=>resolve()}catch(_){resolve()}})}

async function __cachedFetch(url){if(!('caches'in window))return fetch(url,{mode:'cors'});try{const c=await caches.open(__MASK_CACHE),hit=await c.match(url);if(hit)return hit.clone();const r=await fetch(url,{mode:'cors'});if(r.ok)await c.put(url,r.clone());return r}catch(_){return fetch(url,{mode:'cors'})}}
function __exportMaskUrl(mapRoot,layerId,where,w,h){const symbol={type:'esriSFS',style:'esriSFSSolid',color:[255,255,255,255],outline:{type:'esriSLS',style:'esriSLSNull',color:[0,0,0,0],width:0}};const dynamicLayers=[{id:layerId,source:{type:'mapLayer',mapLayerId:layerId},definitionExpression:where,drawingInfo:{renderer:{type:'simple',symbol}}}];const p=new URLSearchParams({bbox:`${BOUNDS.west},${BOUNDS.south},${BOUNDS.east},${BOUNDS.north}`,bboxSR:'4326',imageSR:'4326',size:`${w},${h}`,format:'png32',transparent:'true',layers:`show:${layerId}`,dynamicLayers:JSON.stringify(dynamicLayers),f:'image'});return`${mapRoot}/export?${p}`}
async function __bitmapFromResponse(response){const blob=await response.blob();if('createImageBitmap'in window)return createImageBitmap(blob);return new Promise((resolve,reject)=>{const u=URL.createObjectURL(blob),img=new Image();img.onload=()=>{URL.revokeObjectURL(u);resolve(img)};img.onerror=()=>{URL.revokeObjectURL(u);reject(new Error('BC GIS mask image could not be decoded'))};img.src=u})}
async function __serverMask(mapRoot,layerId,where,w,h,key){const ck=`mask:${__SPECIES_CACHE_VERSION}:${key}:${w}x${h}`;if(cache.has(ck))return cache.get(ck);const url=__exportMaskUrl(mapRoot,layerId,where,w,h),r=await __cachedFetch(url);if(!r.ok)throw new Error(`BC GIS mask failed (${r.status})`);const bmp=await __bitmapFromResponse(r),c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.drawImage(bmp,0,0,w,h);const im=x.getImageData(0,0,w,h),a=im.data;for(let i=0;i<a.length;i+=4){const on=a[i+3]>0;a[i]=a[i+1]=a[i+2]=255;a[i+3]=on?255:0}x.putImageData(im,0,0);if(bmp.close)bmp.close();cache.set(ck,c);return c}

// Ask ArcGIS to rasterize the filtered polygon mask server-side instead of downloading thousands of polygons to the phone.
beiMask=async function(prefix,period,w,h){const suffix=period==='modern'?'WTSUI':'WTCAP',s=`${prefix}_SLI6${suffix}`,q=`${prefix}_WLI6${suffix}`,where=`((${s} IS NOT NULL) AND (${s} <> '6')) OR ((${q} IS NOT NULL) AND (${q} <> '6'))`;return __serverMask(__BEI_MAP,22,where,w,h,`bei:${prefix}:${period}`)};
caribouMask=async function(t,period,w,h){if(period==='historic')return beiMask(t.historicPrefix,'historic',w,h);const ecotype=String(t.ecotype).replaceAll("'","''"),where=`ECOTYPE = '${ecotype}' AND (HERD_STATUS IS NULL OR HERD_STATUS <> 'Extirpated')`;return __serverMask(__CARIBOU_MAP,10,where,w,h,`caribou:${ecotype}`)};
sheepFamilyMask=async function(family,w,h){const name=family==='bighorn'?'Bighorn Sheep':'Thinhorn Sheep',where=`SPECIES_COMMON_NAME = '${name}'`;return __serverMask(__SHEEP_MAP,3,where,w,h,`sheep-family:${family}`)};
async function __ensureSheepSubspecies(){if(window.SHEEP_SUBSPECIES)return;await __loadLayerScript('data/sheep-subspecies.js')}
function __staticSheepMask(sub,w,h){const k=`sheepsub:${sub}:${w}`;if(cache.has(k))return cache.get(k);const fc=window.SHEEP_SUBSPECIES?.[sub];if(!fc)throw new Error('Sheep subspecies range is unavailable');const m=maskCanvas(fc,w,h);cache.set(k,m);return m}
function __intersectMasks(a,b){const c=document.createElement('canvas');c.width=a.width;c.height=a.height;const x=c.getContext('2d');x.drawImage(a,0,0);x.globalCompositeOperation='destination-in';x.drawImage(b,0,0);x.globalCompositeOperation='source-over';return c}
sheepMask=async function(t,period,w,h){await __ensureSheepSubspecies();const sub=__staticSheepMask(t.sub,w,h);if(period==='historic')return sub;return __intersectMasks(await sheepFamilyMask(t.family,w,h),sub)};

baseCanvas=async function(base,period){const k=`base:${base}:${period}`;if(cache.has(k))return cache.get(k);await __ensureLayerSource(base,period);const s=sourceFor(base,period);if(!s.src)throw new Error(`${period==='historic'?'Historic':'Modern'} layer source missing`);const rle=s.gz?await gunzip(s.src):s.src,c=document.createElement('canvas');c.width=s.w;c.height=s.h;const x=c.getContext('2d'),im=x.createImageData(s.w,s.h),a=im.data;let p=0;for(const token of rle.split(',')){if(!token)continue;const level=Number(token[0]),n=parseInt(token.slice(1),36),col=PALETTE[level]||PALETTE[0];for(let j=0;j<n&&p<s.w*s.h;j++,p++){const z=p*4;a[z]=col[0];a[z+1]=col[1];a[z+2]=col[2];a[z+3]=col[3]}}if(p!==s.w*s.h)throw new Error('Distribution layer is incomplete');x.putImageData(im,0,0);cache.set(k,c);return c};

async function __rasterForPeriod(t,period){const k=`single:${t.key}:${period}`;if(cache.has(k))return cache.get(k);const pk=`png:${t.key}:${period}`,saved=await __dbGet(pk);if(typeof saved==='string'&&saved.startsWith('data:image/')){const out={[period]:saved};cache.set(k,out);return out}const d=await periodData(t,period),png=d.canvas.toDataURL('image/png'),out={[period]:png};cache.set(k,out);__dbPut(pk,png);return out}
rasterPair=async function(t){return __rasterForPeriod(t,currentPeriod)};

async function __pointForPeriod(t,period){const k=`point-single:${t.key}:${period}`;if(cache.has(k))return cache.get(k);const pk=`point:${t.key}:${period}`,saved=await __dbGet(pk);if(typeof saved==='string'&&saved.startsWith('data:image/')){const out={[period]:saved};cache.set(k,out);return out}const fc=await pointGeo(t,period),c=pointSurface(fc),vals=alphaValues(c).sort((a,b)=>a-b);if(!vals.length)throw new Error(`${t.label} observations are unavailable`);const q=p=>vals[Math.min(vals.length-1,Math.floor((vals.length-1)*p))],png=colorizeSurface(c,[q(.25),q(.5),q(.75)]),out={[period]:png};cache.set(k,out);__dbPut(pk,png);return out}
pointPair=async function(t){return __pointForPeriod(t,currentPeriod)};

const __grizzlyDataOriginal=grizzlyData;
grizzlyData=async function(){if(cache.has('grizzly:data'))return cache.get('grizzly:data');const saved=await __dbGet('grizzly:data');if(saved?.features?.length){cache.set('grizzly:data',saved);return saved}const out=await __grizzlyDataOriginal();__dbPut('grizzly:data',out);return out};

function __idle(){return new Promise(resolve=>{if('requestIdleCallback'in window)requestIdleCallback(()=>resolve(),{timeout:1200});else setTimeout(resolve,80)})}
async function __prewarmSpecies(){if(navigator.connection?.saveData)return;const tasks=[];for(const t of TAXA){if(t.kind==='grizzly'){tasks.push(()=>grizzlyData());continue}for(const period of['modern','historic'])tasks.push(()=>t.kind==='points'?__pointForPeriod(t,period):__rasterForPeriod(t,period))}for(const task of tasks){await __idle();try{await task()}catch(e){console.debug('Species prewarm skipped:',e?.message||e)}}}
window.addEventListener('load',()=>setTimeout(()=>{__prewarmSpecies()},1800),{once:true});
if('serviceWorker'in navigator)navigator.serviceWorker.register('/hs-offline-lite-sw.js').catch(()=>{});
