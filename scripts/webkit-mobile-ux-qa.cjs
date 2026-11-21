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
  assert(r.nav && r.tabs.length===5, name+' five tabs missing '+JSON.stringify(r));
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
  const mimeErrors=[];
  page.on('pageerror',error=>{
    if (/not a valid JavaScript MIME type|expected a JavaScript module/i.test(error.message)) {
      mimeErrors.push(error.message);
    }
  });
  const billingResponse=page.waitForResponse(response=>
    new URL(response.url()).pathname==='/billing-config.js', {timeout:25000});
  await page.goto(base+'/?webkit-ux='+w,{waitUntil:'domcontentloaded',timeout:35000});
  const billingAsset=await billingResponse;
  assert(billingAsset.ok(),'Billing module unavailable: HTTP '+billingAsset.status());
  assert(/(?:javascript|ecmascript)/i.test(billingAsset.headers()['content-type']||''),
    'Billing import returned non-JavaScript content: '+billingAsset.headers()['content-type']);
  await page.waitForFunction(()=>Boolean(window.HS?.billing?.state),null,{timeout:25000});
  assert.equal(await page.evaluate(()=>window.HS.billing.state.checkoutEnabled),false,
    'This fix must preserve existing preview-safe, non-transactional billing');
  assert.deepEqual(mimeErrors,[],'JavaScript module MIME failure: '+mimeErrors.join(' | '));
  await page.waitForFunction(()=>!!window.__HS_MAP_DESTINATIONS__ && !!document.getElementById('hsMobileTabbar') && !!document.getElementById('authNavBtn'),null,{timeout:25000});
  await inspectTabs(page,w+'-home');
  assert(await page.locator('#authNavBtn').isVisible(),'Top-right account missing');
  assert.equal(await page.locator('#hsMobileAccountTab').count(),0,'Duplicate bottom account tab exists');
  await page.evaluate(()=>window.scrollTo(0,1200));
  await page.waitForTimeout(200);
  const top=await page.evaluate(()=>document.querySelector('body > nav:not(.hs-mobile-tabbar)').getBoundingClientRect().top);
  assert(Math.abs(top)<=3,'Top header not pinned on scroll: '+top);
  await page.evaluate(()=>window.scrollTo(0,0));
  // The Netlify deploy-preview feedback iframe is not part of production.
  // Suppress it for real app interaction checks rather than force-clicking through it.
  if (base.includes('deploy-preview-')) {
    await page.addStyleTag({content:'[data-netlify-deploy-id]{display:none!important;pointer-events:none!important}'});
    await page.evaluate(()=>document.querySelectorAll('[data-netlify-deploy-id]').forEach(x=>x.remove()));
  }
  const headerPaint = await page.evaluate(() => {
    const header=document.querySelector('body > nav:not(.hs-mobile-tabbar)');
    const brand=header?.querySelector('.nav-brand-top');
    const profile=document.getElementById('authNavBtn');
    const r=brand?.getBoundingClientRect();
    return {
      navOpacity:getComputedStyle(header).opacity,
      navFilter:getComputedStyle(header).filter,
      brandColor:getComputedStyle(brand).color,
      brandOpacity:getComputedStyle(brand).opacity,
      profileColor:getComputedStyle(profile).color,
      profileOpacity:getComputedStyle(profile).opacity,
      profileBackground:getComputedStyle(profile).backgroundColor,
      atop:r ? document.elementFromPoint(r.left+Math.min(30,r.width/2),r.top+Math.min(8,r.height/2))?.outerHTML.slice(0,170) : ''
    };
  });
  console.log('WEBKIT_HEADER_PAINT',w,JSON.stringify(headerPaint));
  // Hit testing catches secondary sticky navigations covering the main profile
  // even when the header and account look correctly positioned in screenshots.
  const headerHit=await page.evaluate(()=>{
    const button=document.getElementById('authNavBtn');
    const r=button.getBoundingClientRect();
    const top=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
    return {hit:!!(top && (top===button || button.contains(top))),
      blocking:top?.outerHTML?.slice(0,220) || null};
  });
  assert(headerHit.hit,'Account button blocked by another navigation layer: '+JSON.stringify(headerHit));
  await page.screenshot({path:'mobile-qa-artifacts/'+w+'-webkit-home.png'});
  // Public authentication UX: modal opens, can switch between sign-in/up,
  // and closes without sending credentials or changing real user data.
  await page.locator('#authNavBtn').click();
  await page.locator('#authModal').waitFor({state:'visible',timeout:12000});
  assert(await page.locator('#authEmail').isVisible(),'Sign-in email field missing');
  await page.locator('#tabSignUp').click();
  assert(await page.locator('#authConfirm').isVisible(),'Account creation confirmation missing');
  await page.locator('#authModal .auth-close').click();
  await page.locator('#authModal').waitFor({state:'detached',timeout:10000});
  console.log('WEBKIT_AUTH',w,'Sign In/Create Account modal accessible and dismissible');
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
  assert.equal(await page.locator('#hsSpeciesAccount').count(),0,'Person icon remains in species map');
  assert(await page.locator('#terrain-toggle').isHidden(),'Species 3D control still visible');
  assert.equal(await page.locator('.hs-species-recovery').count(),1,'Species recovery UI missing');
  const mapAndBar=await page.evaluate(()=>({map:document.getElementById('map').getBoundingClientRect().bottom,mapHeight:document.getElementById('map').getBoundingClientRect().height,tab:document.getElementById('hsSpeciesTabbar').getBoundingClientRect().top}));
  assert(Math.abs(mapAndBar.map-mapAndBar.tab)<=4,'Species map/bar overlap '+JSON.stringify(mapAndBar));
  assert(mapAndBar.mapHeight>=250,'Species map has zero usable height '+JSON.stringify(mapAndBar));
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
