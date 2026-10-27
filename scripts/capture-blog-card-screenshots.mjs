import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const TARGET = process.env.HUNTSMART_LIVE_URL || 'https://huntsmartcanada.ca/';
const OUT = path.resolve('images/blog-cards');
fs.mkdirSync(OUT,{recursive:true});
const sleep = ms => new Promise(r=>setTimeout(r,ms));

const browser = await chromium.launch({headless:true,args:['--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader-webgl','--ignore-gpu-blocklist']});
const ctx = await browser.newContext({viewport:{width:1600,height:900},screen:{width:1600,height:900},deviceScaleFactor:1,isMobile:false,hasTouch:false});
const page = await ctx.newPage();
page.on('pageerror',e=>console.log('[pageerror]',e.message));
await page.goto(TARGET,{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForFunction(()=>typeof window.showPage==='function',null,{timeout:30000}).catch(()=>{});
await page.keyboard.press('Escape').catch(()=>{});
await sleep(1800);

async function clean(){
  await page.evaluate(()=>{
    document.querySelectorAll('[role="dialog"],.modal,.auth-modal,.hsPromoCaption').forEach(el=>{ if(el.offsetParent) el.style.display='none'; });
    document.documentElement.style.scrollBehavior='auto';
    window.scrollTo(0,0);
  }).catch(()=>{});
}
async function shot(name){ await clean(); await sleep(800); await page.screenshot({path:path.join(OUT,name),type:'jpeg',quality:88,fullPage:false}); }

// 1 — real BC map, dark mode, wide overview.
await page.evaluate(()=>{ if(typeof showPage==='function') showPage('map'); window.scrollTo(0,0); }).catch(()=>{});
await page.waitForSelector('#fullMapLeaflet',{state:'visible',timeout:20000}).catch(()=>{});
await page.waitForFunction(()=>{try{return fullMapInstance&&fullMapInstance.loaded()}catch(_){return false}},null,{timeout:30000}).catch(()=>{});
await page.evaluate(()=>{ try{ if(typeof fullMapSetTile==='function') fullMapSetTile('dark'); }catch(_){} }).catch(()=>{});
await sleep(2200);
await page.evaluate(()=>{ try{ if(fullMapInstance) fullMapInstance.jumpTo({center:[-124.3,54.3],zoom:4.8,pitch:0,bearing:0}); }catch(_){} }).catch(()=>{});
await sleep(1800);
await shot('map-overview.jpg');

// 2 — actual HuntSmart filter workflow / species + draw controls.
await page.evaluate(()=>{ if(typeof showPage==='function') showPage('filter'); window.scrollTo(0,0); }).catch(()=>{});
await sleep(1800);
const elk=page.locator('#fpSpeciesChips button,#fpSpeciesChips .fp-chip,#fpSpeciesChips [role="button"]').filter({hasText:/elk/i}).first();
if(await elk.count()) await elk.click().catch(()=>{});
await sleep(1200);
await shot('app-workflow.jpg');

// 3 — BC LEH state with a selected WMU if the live page supports it.
await page.evaluate(()=>{
  try{
    if(typeof showPage==='function') showPage('filter');
    if(window.fullMapInstance) window.fullMapInstance.jumpTo({center:[-125.4,54.2],zoom:5.0,pitch:0,bearing:0});
  }catch(_){}
  window.scrollTo(0,0);
}).catch(()=>{});
await sleep(1200);
const wmu = page.locator('[data-wmu],.wmu-chip,.fp-wmu-chip').first();
if(await wmu.count()) await wmu.click().catch(()=>{});
await sleep(900);
await shot('bc-leh.jpg');

// 4 — real odds/harvest filter controls from HuntSmart.
await page.evaluate(()=>{ if(typeof showPage==='function') showPage('filter'); window.scrollTo(0,0); }).catch(()=>{});
await sleep(1000);
for(const sel of ['#fpOddsSlider','#fpHarvestSlider']){
  const loc=page.locator(sel).first();
  if(await loc.count()) await loc.evaluate(el=>{ el.value=el.max?String(Math.round(Number(el.max)*0.45)):'3'; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); }).catch(()=>{});
}
await sleep(1200);
await shot('historical-odds.jpg');

await browser.close();
console.log('Saved real HuntSmart blog-card screenshots to',OUT);
