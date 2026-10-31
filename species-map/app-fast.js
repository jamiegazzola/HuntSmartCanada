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
baseCanvas=async function(base,period){const k=`base:${base}:${period}`;if(cache.has(k))return cache.get(k);await __ensureLayerSource(base,period);const s=sourceFor(base,period);if(!s.src)throw new Error(`${period==='historic'?'Historic':'Modern'} layer source missing`);const rle=s.gz?await gunzip(s.src):s.src,c=document.createElement('canvas');c.width=s.w;c.height=s.h;const x=c.getContext('2d'),im=x.createImageData(s.w,s.h),a=im.data;let p=0;for(const token of rle.split(',')){if(!token)continue;const level=Number(token[0]),n=parseInt(token.slice(1),36),col=PALETTE[level]||PALETTE[0];for(let j=0;j<n&&p<s.w*s.h;j++,p++){const z=p*4;a[z]=col[0];a[z+1]=col[1];a[z+2]=col[2];a[z+3]=col[3]}}if(p!==s.w*s.h)throw new Error('Distribution layer is incomplete');x.putImageData(im,0,0);cache.set(k,c);return c};
rasterPair=async function(t){const k=`single:${t.key}:${currentPeriod}`;if(cache.has(k))return cache.get(k);const d=await periodData(t,currentPeriod),out={[currentPeriod]:d.canvas.toDataURL('image/png')};cache.set(k,out);return out};
pointPair=async function(t){const k=`point-single:${t.key}:${currentPeriod}`;if(cache.has(k))return cache.get(k);const fc=await pointGeo(t,currentPeriod),c=pointSurface(fc),vals=alphaValues(c).sort((a,b)=>a-b);if(!vals.length)throw new Error(`${t.label} observations are unavailable`);const q=p=>vals[Math.min(vals.length-1,Math.floor((vals.length-1)*p))],out={[currentPeriod]:colorizeSurface(c,[q(.25),q(.5),q(.75)])};cache.set(k,out);return out};
