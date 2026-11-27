'use strict';
/* PR/production responsive regression checks. Public demo data only. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = String(process.env.URL || '').replace(/\/$/, '');
assert(base.startsWith('https://'), 'URL must be an HTTPS site');
fs.mkdirSync('mobile-qa-artifacts', { recursive: true });

const dims = [
  { w: 320, h: 568 },
  { w: 375, h: 667 },
  { w: 390, h: 844 },
  { w: 430, h: 932 },
  { w: 768, h: 1024 },
];
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function openFresh(page, path) {
  let result = null, last = '';
  for (let i = 0; i < 35; i++) {
    try {
      result = await page.goto(base + path + (path.includes('?') ? '&' : '?') + 'mobile-qa=' + Date.now() + '-' + i, {
        waitUntil: 'domcontentloaded', timeout: 30000
      });
      const good = path.startsWith('/species-map')
        ? (await page.locator('.hs-map-toolbar').count() > 0 || await page.locator('.hs-preview-species-back').count() > 0)
        : await page.evaluate(() => Boolean(window.__HS_MAP_DESTINATIONS__ && document.getElementById('hsMobileTabbar')));
      if (result?.ok() && good) {
        // Netlify's deploy-preview feedback drawer is injected outside the app.
        // It floats over bottom nav controls and is absent in production.
        if (base.includes('deploy-preview-')) {
          await page.evaluate(() => document.querySelectorAll('[data-netlify-deploy-id]').forEach(el => el.remove()));
        }
        return;
      }
      last = 'HTTP ' + result?.status() + ', app not ready';
    } catch (error) { last = String(error.message); }
    await pause(6000);
  }
  throw new Error('Deployment not available (' + path + '): ' + last);
}
async function show(page, pageName, selector) {
  await page.evaluate(name => window.showPage(name), pageName);
  await page.waitForFunction(sel => {
    const el = document.querySelector(sel);
    return Boolean(el && el.getClientRects().length &&
      getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden');
  }, selector, { timeout: 30000 });
  await page.waitForTimeout(150);
}
async function inspect(page, label) {
  const report = await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const visible = el => {
      if (!el || !el.getClientRects().length) return false;
      const cs = getComputedStyle(el);
      return cs.display !== 'none' && cs.visibility !== 'hidden';
    };
    const bad = Array.from(document.querySelectorAll('main, section, .fp-card, .saved-wrap, .hero-photo-content, .hs-im-shellbar'))
      .filter(visible)
      .map(el => ({ el, r:el.getBoundingClientRect() }))
      .filter(({r}) => r.width > 0 && (r.left < -4 || r.right > w + 4))
      .slice(0, 6)
      .map(({el,r}) => ({ tag:el.tagName, className:el.className?.toString().slice(0,70), left:Math.round(r.left), right:Math.round(r.right) }));
    return { width:w, scroll:document.documentElement.scrollWidth, bad };
  });
  console.log('INSPECT', label, JSON.stringify(report));
  assert(report.scroll <= report.width + 3, label + ' horizontal document overflow: ' + JSON.stringify(report));
  assert.equal(report.bad.length, 0, label + ' visible section clipped: ' + JSON.stringify(report.bad));
}
async function image(page, label) {
  await page.screenshot({ path:'mobile-qa-artifacts/' + label + '.png', fullPage:false, animations:'disabled' });
}
async function mobile(browser, w, h) {
  const context = await browser.newContext({
    viewport:{width:w,height:h}, screen:{width:w,height:h},
    deviceScaleFactor:2, isMobile:true, hasTouch:true, serviceWorkers:'block'
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  await openFresh(page, '/');
  const billingAsset=await page.request.get(base+'/billing-config.js', {timeout:18000});
  assert(billingAsset.ok(),'Billing module HTTP '+billingAsset.status());
  assert(/(?:javascript|ecmascript)/i.test(billingAsset.headers()['content-type']||''),
    'Billing module was served as HTML: '+billingAsset.headers()['content-type']);
  await page.waitForFunction(()=>Boolean(window.HS?.billing?.state),null,{timeout:20000});
  assert.equal(await page.evaluate(()=>window.HS.billing.state.checkoutEnabled),false,
    'Existing preview-safe billing mode changed unexpectedly');
  assert(await page.locator('#navDistribution').count(), 'Desktop species link missing');
  assert(await page.locator('#mNavDistribution').count(), 'Mobile species link missing');
  assert(await page.locator('#hsMobileTabbar .hs-mobile-tab').count() === 5, 'Mobile must retain five tabs');
  assert.equal(await page.locator('#hsMobileAccountTab').count(),0,'Profile should not consume bottom nav');
  assert(await page.locator('#authNavBtn').isVisible(),'Top-right profile is missing');
  assert(await page.evaluate(() => document.documentElement.classList.contains('hs-mobile-browser')), 'Browser mode class missing');
  await inspect(page, w + ' home');
  if (w === 390) {
    const layout=await page.evaluate(()=>{
      const head=document.querySelector('body > nav:not(.hs-mobile-tabbar)').getBoundingClientRect();
      const account=document.getElementById('authNavBtn').getBoundingClientRect();
      const stats=Array.from(document.querySelectorAll('#homePage .home-stat')).map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,cx:(r.left+r.right)/2};});
      return {headTop:head.top,accountTop:account.top,accountRight:account.right,stats,width:innerWidth};
    });
    assert.equal(layout.stats.length,5,'Homepage has five statistics');
    assert(Math.abs(layout.stats[4].cx-layout.width/2)<=5,'Fifth stat not centered '+JSON.stringify(layout));
    assert(Math.abs(layout.stats[0].cx+layout.stats[1].cx-layout.width)<=6,'Two-column metrics uneven '+JSON.stringify(layout));
    assert(layout.accountRight>=layout.width-30,'Profile not top-right '+JSON.stringify(layout));
    await page.evaluate(()=>scrollTo(0,1200));
    await page.waitForTimeout(150);
    const sticky=await page.evaluate(()=>({
      head:document.querySelector('body > nav:not(.hs-mobile-tabbar)').getBoundingClientRect().top,
      account:document.getElementById('authNavBtn').getBoundingClientRect().top
    }));
    assert(Math.abs(sticky.head)<=3 && sticky.account>=0 && sticky.account<=56,
      'Top-right profile disappears during scroll '+JSON.stringify(sticky));
    console.log('HOME_CENTERED_PROFILE',JSON.stringify({layout,sticky}));
    await page.evaluate(()=>scrollTo(0,0));
  }
  await image(page, w + '-home');
  if (w === 390) {
    const heavy = await page.evaluate(() => performance.getEntriesByType('resource')
      .filter(e => e.name.startsWith(location.origin))
      .map(e => ({file:new URL(e.name).pathname, ms:Math.round(e.duration), kb:Math.round(e.transferSize/1024)}))
      .sort((a,b) => b.ms-a.ms).slice(0,8));
    console.log('HOME_RESOURCE_TIMINGS', JSON.stringify(heavy));
  }

  await show(page, 'filter', '#filterPage');
  await inspect(page, w + ' BC filter');
  await image(page, w + '-filter');

  if (w === 390) {
    const started = Date.now();
    await page.evaluate(() => fpBcToggleMap());
    await page.locator('#fpBcMapPanel').waitFor({state:'visible'});
    await page.waitForFunction(() =>
      Boolean(document.querySelector('#fpBcLeafletMap .leaflet-overlay-pane path') &&
        window.__HS_WMU_VECTOR_TILES__?.snapshot().bcFullGeometry),
      null, {timeout:45000});
    console.log('FILTER_BC', JSON.stringify({
      initialized: await page.evaluate(() => fpBcMapInitialized),
      polygonCount: await page.locator('#fpBcLeafletMap .leaflet-overlay-pane path').count(),
      geometry: await page.evaluate(() => window.__HS_WMU_VECTOR_TILES__.snapshot().bcFullGeometry),
      elapsedMs: Date.now() - started
    }));
    assert(await page.evaluate(() => fpBcMapInitialized), 'BC filter map did not initialize');
    await image(page, '390-bc-filter-map');

    await show(page, 'abFilter', '#abFilterPage');
    const abStart = Date.now();
    await page.evaluate(() => abFpToggleMap());
    await page.locator('#abFpMapPanel').waitFor({state:'visible'});
    await page.waitForFunction(() =>
      Boolean(document.querySelector('#abFpLeafletMap .leaflet-overlay-pane path') &&
        window.__HS_WMU_VECTOR_TILES__?.snapshot().abFullGeometry),
      null, {timeout:60000});
    console.log('FILTER_AB', JSON.stringify({
      initialized: await page.evaluate(() => abFpMapInitialized),
      polygonCount: await page.locator('#abFpLeafletMap .leaflet-overlay-pane path').count(),
      geometry: await page.evaluate(() => window.__HS_WMU_VECTOR_TILES__.snapshot().abFullGeometry),
      elapsedMs: Date.now() - abStart
    }));
    assert(await page.evaluate(() => abFpMapInitialized), 'Alberta filter map did not initialize');
    // Geometry paths can exist before their loading surface clears.
    await page.locator('#abFpLeafletMap [data-hs-filter-load]').waitFor({state:'hidden',timeout:20000});
    await image(page, '390-ab-filter-map');
  }

  await show(page, 'draws', '#drawsPage');
  await inspect(page, w + ' draw results');
  await image(page, w + '-draws');

  const filter = page.locator('#sidebarInner');
  await page.locator('#sidebarToggle').click();
  await filter.locator('.hs-filter-overview').waitFor({state:'visible'});
  assert.equal(await filter.locator('.hs-filter-row').count(),7,'BC filter categories missing');
  const layout = await filter.evaluate(el=>{
    const outer=el.getBoundingClientRect(), header=el.querySelector('.hs-filter-header').getBoundingClientRect();
    const content=el.querySelector('.hs-filter-content'), middle=content.getBoundingClientRect();
    const footer=el.querySelector('.hs-filter-footer').getBoundingClientRect();
    return {outer:outer.height,viewport:window.visualViewport.height,header:header.bottom,middleTop:middle.top,middleBottom:middle.bottom,footer:footer.top,scroll:content.scrollWidth,width:content.clientWidth};
  });
  assert(Math.abs(layout.outer-layout.viewport)<=4 && layout.header<=layout.middleTop+1 && layout.middleBottom<=layout.footer+1 && layout.scroll<=layout.width+1,'Filter viewport layout: '+JSON.stringify(layout));
  const before = await page.evaluate(()=>({species:[...selSpecies],count:filtered.length}));
  await filter.getByRole('button',{name:/^Species/}).click();
  const option=filter.locator('#speciesChips .chip').first();
  await option.waitFor({state:'visible'});
  await option.click();
  assert.notDeepEqual(await page.evaluate(()=>[...selSpecies]),before.species,'Species selection did not update');
  await filter.getByRole('button',{name:'Done',exact:true}).click();
  await filter.getByRole('button',{name:'Close filters'}).click();
  await filter.waitFor({state:'hidden'});
  assert.deepEqual(await page.evaluate(()=>({species:[...selSpecies],count:filtered.length})),before,'Dismissal did not restore prior filters');
  await page.locator('#sidebarToggle').click();
  await filter.getByRole('button',{name:/^Species/}).click();
  await filter.locator('#speciesChips .chip').first().click();
  await filter.getByRole('button',{name:'Done',exact:true}).click();
  await filter.getByRole('button',{name:/^Show [\d,]+ draws$/}).click();
  await filter.waitFor({state:'hidden'});
  assert.notDeepEqual(await page.evaluate(()=>[...selSpecies]),before.species,'Apply did not preserve selection');
  await page.locator('#sidebarToggle').click();
  await filter.getByRole('button',{name:'Reset',exact:true}).click();
  await image(page,w+'-filters-redesign');
  await filter.getByRole('button',{name:/^Show [\d,]+ draws$/}).click();
  await filter.waitFor({state:'hidden'});
  assert.equal(await page.evaluate(()=>selSpecies.size),0,'Reset did not restore all species');

  if (w === 390) {
    const baseCount=await page.evaluate(()=>filtered.length);
    await page.locator('#sidebarToggle').click();
    await filter.getByRole('button',{name:/^Special tags/}).click();
    await filter.getByRole('button',{name:'Youth only',exact:true}).click();
    assert(await page.evaluate(()=>filtered.length>0&&filtered.every(r=>/age restricted:\s*under 18 only/i.test(r.Notes))), 'Youth tag did not constrain actual results');
    await filter.getByRole('button',{name:'Clear',exact:true}).click();
    await filter.getByRole('button',{name:'Done',exact:true}).click();
    await filter.getByRole('button',{name:/^Season dates/}).click();
    await filter.locator('#seasonDateFrom').fill('2026-09-15');
    await filter.locator('#seasonDateTo').fill('2026-09-15');
    assert(await page.evaluate(()=>filtered.length>0&&filtered.length<DATA.length&&filtered.every(r=>bcSeasonMatches(r.Season,'2026-09-15','2026-09-15',2026))), 'Date selection did not constrain actual results');
    await filter.getByRole('button',{name:'Clear',exact:true}).click();
    await filter.getByRole('button',{name:'Done',exact:true}).click();
    await filter.getByRole('button',{name:/^Management unit/}).click();
    await filter.getByRole('searchbox').fill('3-17');
    await filter.getByRole('button',{name:'WMU 3-17',exact:true}).click();
    assert(await page.evaluate(()=>selMUsFull.has('3-17')&&filtered.every(r=>bcNormalizeMU(r.MU)==='3-17')),'WMU selection not connected to results');
    await filter.getByRole('button',{name:'Done',exact:true}).click();
    await filter.getByRole('button',{name:'Select on map',exact:true}).click();
    await filter.locator('#bcMapPanel').waitFor({state:'visible'});
    await page.waitForFunction(()=>Boolean(document.querySelector('#bcLeafletMap .leaflet-overlay-pane path')),null,{timeout:45000});
    assert(await page.evaluate(()=>selMUsFull.has('3-17')),'Opening map lost the selected WMU');
    await filter.getByRole('button',{name:'Back to filters'}).click();
    assert(await page.evaluate(()=>selMUsFull.has('3-17')),'Returning from map lost the selected WMU');
    await filter.getByRole('button',{name:/^Management unit/}).click();
    await filter.getByRole('button',{name:'Clear',exact:true}).click();
    await filter.getByRole('button',{name:'Done',exact:true}).click();
    await filter.getByRole('button',{name:/^Show [\d,]+ draws$/}).click();
    assert.equal(await page.evaluate(()=>filtered.length),baseCount,'Clear did not restore all records');
    await show(page,'abDraws','#abDrawsPage');
    await page.locator('#abSpeciesChips .chip').first().waitFor({state:'attached'});
    await page.locator('#abSidebarToggle').click();
    const abFilter=page.locator('#abSidebarInner');
    await abFilter.locator('.hs-filter-overview').waitFor({state:'visible'});
    await abFilter.getByRole('button',{name:/^Species/}).click();
    await abFilter.locator('#abSpeciesChips .chip').first().click();
    assert(await page.evaluate(()=>abSelSpecies.size>0),'Alberta species picker did not update');
    await abFilter.getByRole('button',{name:'Done',exact:true}).click();
    await abFilter.getByRole('button',{name:'Reset',exact:true}).click();
    await abFilter.getByRole('button',{name:/^Show [\d,]+ draws$/}).click();
    assert.equal(await page.evaluate(()=>abSelSpecies.size),0,'Alberta reset did not restore all species');
    await show(page,'draws','#drawsPage');
  }



  if (w === 390) {
    const cardIndex = await page.evaluate(() => filtered.findIndex(r => r && r.Code && r.MU && r.Zone));
    assert(cardIndex >= 0, 'No BC LEH hunt card available to test its map');
    const cardStarted = Date.now();
    await page.locator('#expbtn-' + cardIndex).click();
    const cardId = await page.locator('#exp-' + cardIndex + ' .leh-card-map').first().getAttribute('id')
      .catch(() => page.locator('#exp-' + cardIndex + ' [id^="lehMap_"]').first().getAttribute('id'));
    assert(cardId, 'Expanded LEH card map container missing');
    await page.waitForFunction(id => Boolean(
      typeof _lehCardMaps !== 'undefined' && _lehCardMaps[id] &&
      _lehCardMaps[id].getCanvas && _lehCardMaps[id].getCanvas().width > 0 &&
      document.getElementById(id + '_status')?.textContent !== 'Loading zone…'
    ), cardId, {timeout:45000});
    const cardStatus = await page.locator('#' + cardId + '_status').innerText();
    assert(!/unavailable|failed/i.test(cardStatus), 'LEH card failed to show zone: ' + cardStatus);
    await page.locator('#' + cardId + ' .hs-leh-card-loading').waitFor({state:'hidden',timeout:30000});
    console.log('LEH_CARD_FIRST_RENDER', JSON.stringify({elapsedMs:Date.now()-cardStarted,cardId,status:cardStatus}));
    const toolbar = await page.locator('#exp-' + cardIndex + ' .hs-leh-map-controls').evaluate(el=>{
      const parent=el.getBoundingClientRect();
      return [...el.querySelectorAll('button')].every(b=>{
        const r=b.getBoundingClientRect();
        return r.left>=parent.left-1 && r.right<=parent.right+1 && r.height>=44 && getComputedStyle(b).whiteSpace==='nowrap';
      });
    });
    assert(toolbar,'Mobile zone map controls wrap or overflow');
    await image(page, '390-leh-card');

    await page.evaluate(id => {
      const map = _lehCardMaps[id];
      window.__hsQaCardBefore = map;
      window.__hsQaCardCamera = {center:map.getCenter().toArray(),zoom:map.getZoom()};
      window.__hsQaCardLayers = ['card-wmu-line','card-zone-line','card-ctx-line'].filter(layer=>map.getLayer(layer));
    }, cardId);
    await page.locator('#' + cardId + '_btn_topo').click();
    await page.waitForFunction(id => {
      const map = _lehCardMaps[id];
      if (!map || map !== window.__hsQaCardBefore || map._lehCurrentTile !== 'topo' || map._hsStyleSwitching) return false;
      // Mapbox getStyle() throws while a newly replaced style is still loading.
      if (!map.isStyleLoaded?.()) return false;
      try { return /outdoors/i.test(map.getStyle()?.name || ''); }
      catch (_) { return false; }
    }, cardId, {timeout:30000});
    await page.locator('#' + cardId + ' .hs-leh-card-loading').waitFor({state:'hidden',timeout:30000});
    const preserved=await page.evaluate(id=>{
      const map=_lehCardMaps[id], previous=window.__hsQaCardCamera, center=map.getCenter().toArray();
      return Math.abs(map.getZoom()-previous.zoom)<0.01 &&
        center.every((v,i)=>Math.abs(v-previous.center[i])<0.001) &&
        window.__hsQaCardLayers.every(layer=>!!map.getLayer(layer));
    },cardId);
    assert(preserved,'Basemap switch lost camera or hunt boundaries');
    console.log('LEH_CARD_TOPO', JSON.stringify(await page.evaluate(id => ({
      mode:_lehCardMaps[id]._lehCurrentTile,
      style:_lehCardMaps[id].getStyle()?.name,
      replacement: _lehCardMaps[id] !== window.__hsQaCardBefore
    }),cardId)));
    await image(page, '390-leh-card-topo');
    await page.evaluate(id => window.bcCardMapToggleFullscreen(id),cardId);
    await page.locator('.leh-card-fullscreen-overlay').waitFor({state:'visible',timeout:8000});
    const fullscreen = await page.evaluate(() => {
      const nav=document.getElementById('hsMobileTabbar').getBoundingClientRect();
      const header=document.querySelector('body > nav:not(.hs-mobile-tabbar)').getBoundingClientRect();
      const overlay=document.querySelector('.leh-card-fullscreen-overlay').getBoundingClientRect();
      return {navTop:nav.top,overlayBottom:overlay.bottom,overlayTop:overlay.top,headerBottom:header.bottom};
    });
    assert(Math.abs(fullscreen.overlayBottom-fullscreen.navTop)<=4 &&
      Math.abs(fullscreen.overlayTop-fullscreen.headerBottom)<=4,
      'Expanded hunt card hides navigation: '+JSON.stringify(fullscreen));
    const expandedMap=await page.locator('#'+cardId).boundingBox();
    assert(expandedMap&&expandedMap.height>150,'Expanded map has no usable height');
    await page.locator('.leh-card-fullscreen-overlay button').filter({hasText:'Collapse'}).click();
    await page.locator('.leh-card-fullscreen-overlay').waitFor({state:'detached',timeout:6000});
    assert(await page.evaluate(id=>_lehCardMaps[id]===window.__hsQaCardBefore,cardId),'Collapse recreated card map');
    await page.evaluate(id => window.bcCardMapToggleFullscreen(id),cardId);
    await page.locator('.leh-card-fullscreen-overlay').waitFor({state:'visible',timeout:8000});
    await image(page,'390-leh-card-expanded');
    await page.locator('#hsMobileTabbar [data-tab="home"]').click();
    await page.locator('.leh-card-fullscreen-overlay').waitFor({state:'detached',timeout:6000});
    assert(await page.locator('#homePage').isVisible(),'Navigating away from fullscreen map failed');
    await page.evaluate(()=>window.showPage('draws'));
  }

  await show(page, 'saved', '#savedPage');
  await inspect(page, w + ' saved');
  await image(page, w + '-saved');
  if (w === 390) {
    const navRect = await page.locator('#hsMobileTabbar').boundingBox();
    assert(navRect && navRect.height >= 55,'Bottom tabs missing on Saved');
    await page.locator('#hsMobileTabbar [data-tab="seasons"]').click();
    await page.waitForFunction(() => !!document.getElementById('bcOpenSeasonsPage')?.getClientRects().length,
      null, {timeout:15000});
    assert(await page.locator('#hsMobileTabbar').isVisible(),'Bottom tabs missing on GOS');
    await page.locator('#hsMobileTabbar [data-tab="home"]').click();
    await page.waitForFunction(() => !!document.getElementById('homePage')?.getClientRects().length,
      null, {timeout:15000});
    assert(await page.locator('#hsMobileTabbar').isVisible(),'Bottom tabs missing on Home');
  }

  const fullMapStarted = Date.now();
  await page.locator('#hsMobileTabbar [data-tab="map"]').click();
  assert.equal(await page.locator('#hsMapDestinationsBackdrop').count(),0,
    'Obsolete full-screen map chooser still mounted');
  await page.waitForFunction(() => {
    const e=document.getElementById('mapPage');
    return Boolean(e && e.getClientRects().length && getComputedStyle(e).display !== 'none'
      && document.body.classList.contains('hs-mobile-map-active'));
  }, null, { timeout:30000 });
  await page.locator('#mapPage > .hs-map-crosslink').waitFor({state:'visible',timeout:12000});
  assert.equal(await page.locator('#mapPage > .hs-map-crosslink').getAttribute('href'),'/species-map/',
    'Hunting map cross-link is missing or incorrect');
  await page.waitForTimeout(350);
  const map = await page.evaluate(() => {
    const e=document.getElementById('mapPage').getBoundingClientRect();
    const header=document.querySelector('body > nav:not(.hs-mobile-tabbar)').getBoundingClientRect();
    const tab=document.getElementById('hsMobileTabbar').getBoundingClientRect();
    return { top:e.top, bottom:e.bottom, h:e.height, headerBottom:header.bottom,
      tabTop:tab.top, visual:visualViewport?.height || innerHeight,
      browser:document.documentElement.classList.contains('hs-mobile-browser') };
  });
  console.log('MAP', w, JSON.stringify(map));
  assert(map.browser, w + ' browser mode not active');
  assert(Math.abs(map.top - map.headerBottom) <= 4, w + ' map sits under header: ' + JSON.stringify(map));
  assert(map.bottom <= map.tabTop + 4 && map.bottom >= map.tabTop - 8,
    w + ' map clipped by bottom navigation: ' + JSON.stringify(map));
  assert(map.h >= 180, w + ' map too short');
  await image(page, w + '-map-leh');
  if (w === 390) {
    const mapReady = await page.waitForFunction(() =>
      typeof fullMapInstance !== 'undefined' && Boolean(fullMapInstance?.loaded?.()),
      null, {timeout:20000}).then(() => true).catch(() => false);
    console.log('FULL_MAP_FIRST_COMPLETE', JSON.stringify({ready:mapReady,elapsedMs:Date.now()-fullMapStarted}));
  }

  const gosStart = Date.now();
  await show(page, 'bcOpenSeasons', '#bcOpenSeasonsPage');
  const gos = await page.evaluate(() => {
    const e=document.querySelector('#bcOpenSeasonsPage .os-page').getBoundingClientRect();
    const tab=document.getElementById('hsMobileTabbar').getBoundingClientRect();
    return { bottom:e.bottom, tabTop:tab.top, height:e.height };
  });
  console.log('GOS', w, JSON.stringify(gos));
  assert(Math.abs(gos.bottom - gos.tabTop) <= 8, w + ' GOS overlaps nav: ' + JSON.stringify(gos));
  await image(page, w + '-map-gos');
  if (w === 390) {
    // Mapbox's loaded()/isStyleLoaded() flags can remain false even after the
    // GOS vector overlay and all visible viewport tiles are rendered. Test the
    // actual usable map, not the SDK's stricter internal idle state.
    const gosReady = await page.waitForFunction(() =>
      typeof osMapInstance !== 'undefined' && osMapInstance &&
      typeof OS_REGION_FILL !== 'undefined' &&
      Boolean(osMapInstance.getLayer(OS_REGION_FILL)) &&
      osMapInstance.areTilesLoaded(),
      null, {timeout:20000}).then(() => true).catch(() => false);
    console.log('GOS_MAP_OVERLAYS_READY', JSON.stringify({ready:gosReady,elapsedMs:Date.now()-gosStart}));
    assert(gosReady, 'GOS map did not render its map boundaries and tiles within 20 seconds');
    const status = await page.evaluate(() => {
      const map = typeof osMapInstance === 'undefined' ? null : osMapInstance;
      return {
        created: !!map,
        canvasWidth: map?.getCanvas?.()?.width || 0,
        styleLoaded: !!map?.isStyleLoaded?.(),
        tilesLoaded: !!map?.areTilesLoaded?.(),
        regionLayer: typeof OS_REGION_FILL !== 'undefined' && !!map?.getLayer?.(OS_REGION_FILL),
        wmuLayer: typeof OS_WMU_FILL !== 'undefined' && !!map?.getLayer?.(OS_WMU_FILL)
      };
    });
    console.log('GOS_MAP_DIAGNOSTICS', JSON.stringify(status));
    await image(page, '390-gos-after-wait');
  }
  const fatalErrors = errors.filter(e => /SyntaxError|ReferenceError|TypeError/i.test(e));
  assert(fatalErrors.length === 0, w + ' mobile JavaScript errors: ' + fatalErrors.join(' | '));
  await context.close();
}

async function species(browser, w, h) {
  const context=await browser.newContext({viewport:{width:w,height:h},isMobile:w<700,hasTouch:w<700,serviceWorkers:'block'});
  const page=await context.newPage();
  await openFresh(page,'/species-map/');
  const fullViewer = await page.locator('.hs-map-toolbar').count() > 0;
  const backSelector = fullViewer ? '.hs-map-back' : '.hs-preview-species-back';
  if (w < 700) {
    await page.locator('#hsSpeciesTabbar').waitFor({state:'visible',timeout:15000});
    assert.equal(await page.locator('#hsSpeciesTabbar [data-tab]').count(),5,'Species map must retain five tabs');
    assert.equal(await page.locator('#hsSpeciesAccount').count(),0,'Redundant person icon in species viewer');
     assert(await page.locator('#terrain-toggle').isHidden(),'Species 3D control must be hidden');
     assert.equal(await page.locator('.hs-species-recovery').count(),1,'Species loading recovery is missing');
    assert.equal(await page.locator('#hsSpeciesTabbar [aria-current="page"]').count(),1,'Species map active tab missing');
    await page.locator('#hsHuntingMapLink').waitFor({state:'visible',timeout:12000});
    assert.equal(await page.locator('#hsHuntingMapLink').getAttribute('href'),'/?map=interactive',
      'Species map route back to hunting is missing');
    const nav = await page.evaluate(() => {
      const r=document.getElementById('hsSpeciesTabbar').getBoundingClientRect();
      const map=document.getElementById('map').getBoundingClientRect();
      const nodes=Array.from(document.querySelectorAll('#hsSpeciesTabbar [data-tab]'));
      return {top:r.top,bottom:r.bottom,innerH:innerHeight,
        mapBottom:map.bottom,mapHeight:map.height,mapPosition:getComputedStyle(document.getElementById('map')).position,
        tabSizes:nodes.map(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height}))};
    });
    assert(nav.top >= 0 && nav.bottom <= nav.innerH + 3,'Distribution tabs offscreen: '+JSON.stringify(nav));
    assert(Math.abs(nav.mapBottom-nav.top) <= 4,'Distribution map overlaps tabs: '+JSON.stringify(nav));
    assert(nav.mapHeight>=250,'Species map collapsed behind tabbar: '+JSON.stringify(nav));
    assert(nav.tabSizes.every(b=>b.w >= 39 && b.h >= 42),'Distribution tabs too small: '+JSON.stringify(nav));
    console.log('SPECIES_NAV',w,JSON.stringify(nav));
  } else {
    await page.locator(backSelector).waitFor({state:'visible',timeout:15000});
  }
  const r=await page.evaluate(() => {
    const a=document.querySelector('.hs-map-toolbar, .species-control').getBoundingClientRect();
    const b=document.querySelector('.hs-map-back, .hs-preview-species-back').getBoundingClientRect();
    const c=document.querySelector('.species-control').getBoundingClientRect();
    return {vw:document.documentElement.clientWidth, left:a.left,right:a.right,backW:b.width,speciesW:c.width};
  });
  console.log('SPECIES',w,JSON.stringify(r));
  assert(r.left>=0 && r.right<=r.vw+3 && r.speciesW>=90, 'Species controls overflow: '+JSON.stringify(r));
  await image(page,w+'-distribution');
  if (fullViewer) {
    await page.locator('.hs-settings-toggle').click();
    assert(await page.locator('.hs-settings-panel').isVisible(), 'Distribution settings failed to open');
    await image(page,w+'-distribution-settings');
  } else {
    assert(await page.locator('#terrain-toggle').isHidden(), 'Species 3D control visible');
    assert(await page.locator('#era-control').count() === 1, 'Preview distribution period controls absent');
  }
  if (fullViewer) assert.equal(await page.locator(backSelector).getAttribute('href'),'/?map=interactive');
  if (w === 390) {
    assert.equal(await page.locator('#hsSpeciesTabbar [data-tab="draws"]').getAttribute('href'),'/?hsTab=draws');
    await page.locator('#hsSpeciesTabbar [data-tab="draws"]').click();
    await page.locator('#hsDrawsSheetBackdrop.open').waitFor({state:'visible',timeout:30000});
    assert(await page.locator('#hsMobileTabbar').isVisible(),'Main navigation missing after returning from species map');
    await image(page,w+'-distribution-return-draws');
  }
  await context.close();
}
async function desktop(browser) {
  const page=await browser.newPage({viewport:{width:1366,height:768},serviceWorkers:'block'});
  await openFresh(page, '/');
  assert(await page.locator('#navDistribution').isVisible(), 'Desktop distribution entry hidden');
  assert(!(await page.evaluate(() => document.documentElement.classList.contains('hs-mobile-browser'))), 'Desktop affected by browser-only mode');
  await inspect(page,'desktop');
  await image(page,'desktop-home');
  // Full-width navigation audit: verify every primary desktop surface.
  for (const [route,id,slug] of [
    ['filter','#filterPage','bc-filter'],
    ['draws','#drawsPage','bc-results'],
    ['saved','#savedPage','saved'],
    ['abFilter','#abFilterPage','ab-filter'],
    ['abDraws','#abDrawsPage','ab-results'],
    ['bcOpenSeasons','#bcOpenSeasonsPage','open-seasons'],
    ['map','#mapPage','interactive-map']
  ]) {
    await show(page,route,id);
    await inspect(page,'desktop '+slug);
    await image(page,'desktop-'+slug);
    assert(await page.locator('#navDistribution').isVisible(),'Species map top navigation disappeared on '+slug);
  }
  await page.close();
}
async function standalone(browser) {
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.addInitScript(() => {Object.defineProperty(navigator,'standalone',{get:()=>true,configurable:true});});
  const page=await context.newPage();
  await openFresh(page,'/');
  assert(await page.evaluate(()=>document.documentElement.classList.contains('hs-standalone')), 'Standalone PWA detection missing');
  assert(!(await page.evaluate(()=>document.documentElement.classList.contains('hs-mobile-browser'))), 'Standalone inherits browser-only fixes');
  await image(page,'standalone-home');
  await context.close();
}
(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    for (const d of dims) await mobile(browser,d.w,d.h);
    await species(browser,320,568);
    await species(browser,390,844);
    await species(browser,1366,768);
    await desktop(browser);
    await standalone(browser);
    console.log('PASS: browser vs PWA isolation, map selector, species route, responsive viewports and desktop smoke.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
