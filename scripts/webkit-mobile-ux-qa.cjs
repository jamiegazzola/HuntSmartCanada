'use strict';
/* iOS Safari/WebKit navigation smoke test: public screens, no authentication or test data. */
const { webkit } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = String(process.env.URL || '').replace(/\/$/, '');
assert(base.startsWith('https://'), 'Preview URL required');
fs.mkdirSync('mobile-qa-artifacts', {recursive:true});
async function inspectTabs(page, name) {
  const r = await page.evaluate(() => {
    const nav=document.getElementById('hsMobileTabbar') || document.getElementById('hsSpeciesTabbar');
    const b=nav?.getBoundingClientRect();
    const tabs=nav ? Array.from(nav.querySelectorAll('[data-tab]')) : [];
    return {vw:innerWidth,vh:innerHeight,
      nav:b?{top:b.top,bottom:b.bottom,left:b.left,right:b.right,height:b.height}:null,
      tabs:tabs.map(el=>{const x=el.getBoundingClientRect();return{w:x.width,h:x.height,center:x.left+x.width/2,visible:getComputedStyle(el).visibility!=='hidden'};}),
      doc:document.documentElement.scrollWidth};
  });
  assert(r.nav && r.tabs.length===6, name+' six tabs missing '+JSON.stringify(r));
  assert(r.nav.top>0 && r.nav.bottom<=r.vh+4, name+' nav offscreen '+JSON.stringify(r));
  assert(r.nav.left>=-2 && r.nav.right<=r.vw+2, name+' nav not centered '+JSON.stringify(r));
  assert(r.tabs.every(x=>x.h>=42 && x.w>=39 && x.visible),name+' inaccessible tabs '+JSON.stringify(r));
  assert(r.doc<=r.vw+4, name+' horizontal overflow '+JSON.stringify(r));
  console.log('WEBKIT_NAV', name, JSON.stringify(r));
}
async function run(browser,w,h) {
  const context=await browser.newContext({viewport:{width:w,height:h},screen:{width:w,height:h},deviceScaleFactor:2,isMobile:true,hasTouch:true,serviceWorkers:'block'});
  // Netlify's preview-only feedback iframe intercepts clicks at the bottom of
  // the viewport; production has no such overlay. Keep app navigation genuine.
  if (base.includes('deploy-preview-')) {
    await context.addInitScript(() => {
      function removePreviewOverlay() {
        document.querySelectorAll('[data-netlify-deploy-id]').forEach(el => el.remove());
      }
      const install = () => {
        removePreviewOverlay();
        new MutationObserver(removePreviewOverlay).observe(document.documentElement, {childList:true,subtree:true});
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
      else install();
    });
  }
  const page=await context.newPage();
  await page.goto(base+'/?webkit-ux='+w,{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForFunction(()=>!!window.__HS_MAP_DESTINATIONS__ && !!document.getElementById('hsMobileAccountTab'),null,{timeout:25000});
  await inspectTabs(page,w+'-home');
  await page.screenshot({path:'mobile-qa-artifacts/'+w+'-webkit-home.png'});
  await page.locator('#hsMobileTabbar [data-tab="draws"]').click();
  await page.locator('#hsDrawsSheetBackdrop.open').waitFor({state:'visible',timeout:12000});
  await page.locator('#hsDrawsSheetBackdrop [data-draw-choice="bc"]').click();
  await page.waitForFunction(()=>document.getElementById('filterPage')?.getClientRects().length>0,null,{timeout:15000});
  await inspectTabs(page,w+'-filter');
  await page.screenshot({path:'mobile-qa-artifacts/'+w+'-webkit-filter.png'});
  await page.evaluate(()=>showPage('draws'));
  await inspectTabs(page,w+'-results');
  await page.locator('#hsMobileTabbar [data-tab="saved"]').click();
  await page.waitForFunction(()=>document.getElementById('savedPage')?.getClientRects().length>0,null,{timeout:12000});
  await inspectTabs(page,w+'-saved');
  await page.locator('#hsMobileTabbar [data-tab="seasons"]').click();
  await page.waitForFunction(()=>document.getElementById('bcOpenSeasonsPage')?.getClientRects().length>0,null,{timeout:12000});
  await inspectTabs(page,w+'-gos');
  await page.locator('#hsMobileTabbar [data-tab="map"]').click();
  await page.locator('#hsMapDestinationsBackdrop.open').waitFor({state:'visible',timeout:12000});
  await page.locator('#hsMapDestinationsBackdrop [data-map-destination="interactive"]').click();
  await page.waitForFunction(()=>document.getElementById('mapPage')?.getClientRects().length>0,null,{timeout:15000});
  await inspectTabs(page,w+'-leh');
  await page.screenshot({path:'mobile-qa-artifacts/'+w+'-webkit-hunting-map.png'});
  await page.goto(base+'/species-map/?webkit-ux='+w,{waitUntil:'domcontentloaded',timeout:35000});
  await page.locator('#hsSpeciesTabbar').waitFor({state:'visible',timeout:20000});
  await inspectTabs(page,w+'-species');
  const mapAndBar=await page.evaluate(()=>({map:document.getElementById('map').getBoundingClientRect().bottom,tab:document.getElementById('hsSpeciesTabbar').getBoundingClientRect().top}));
  assert(Math.abs(mapAndBar.map-mapAndBar.tab)<=4,'Species map/bar overlap '+JSON.stringify(mapAndBar));
  await page.screenshot({path:'mobile-qa-artifacts/'+w+'-webkit-species.png'});
  await page.locator('#hsSpeciesTabbar [data-tab="saved"]').click();
  await page.waitForFunction(()=>document.getElementById('savedPage')?.getClientRects().length>0,null,{timeout:30000});
  await inspectTabs(page,w+'-species-to-saved');
  await context.close();
}
(async()=>{
  const browser=await webkit.launch({headless:true});
  try {
    await run(browser,375,812);
    await run(browser,390,844);
    console.log('PASS: iOS WebKit navigation preserved across Home, Draws, Results, Saved, LEH, GOS, Species and cross-map routing.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
