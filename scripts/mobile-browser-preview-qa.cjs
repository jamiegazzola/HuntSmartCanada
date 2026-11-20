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
  assert(await page.locator('#navDistribution').count(), 'Desktop species link missing');
  assert(await page.locator('#mNavDistribution').count(), 'Mobile species link missing');
  assert(await page.locator('#hsMobileTabbar .hs-mobile-tab').count() === 6, 'Mobile must retain six tabs');
  assert(await page.evaluate(() => document.documentElement.classList.contains('hs-mobile-browser')), 'Browser mode class missing');
  await inspect(page, w + ' home');
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
    await image(page, '390-ab-filter-map');
  }

  await show(page, 'draws', '#drawsPage');
  await inspect(page, w + ' draw results');
  await image(page, w + '-draws');

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
    console.log('LEH_CARD_FIRST_RENDER', JSON.stringify({elapsedMs:Date.now()-cardStarted,cardId,status:cardStatus}));
    await image(page, '390-leh-card');

    await page.evaluate(id => { window.__hsQaCardBefore = _lehCardMaps[id]; }, cardId);
    await page.locator('#' + cardId + '_btn_topo').click();
    await page.waitForFunction(id => Boolean(
      _lehCardMaps[id] && _lehCardMaps[id] !== window.__hsQaCardBefore &&
      _lehCardMaps[id]._lehCurrentTile === 'topo' &&
      /outdoors/i.test(_lehCardMaps[id].getStyle()?.name || '')
    ), cardId, {timeout:30000});
    console.log('LEH_CARD_TOPO', JSON.stringify(await page.evaluate(id => ({
      mode:_lehCardMaps[id]._lehCurrentTile,
      style:_lehCardMaps[id].getStyle()?.name,
      replacement: _lehCardMaps[id] !== window.__hsQaCardBefore
    }),cardId)));
    await image(page, '390-leh-card-topo');
  }

  await show(page, 'saved', '#savedPage');
  await inspect(page, w + ' saved');
  await image(page, w + '-saved');

  await page.locator('#hsMobileTabbar [data-tab="map"]').click();
  await page.locator('#hsMapDestinationsBackdrop.open').waitFor({state:'visible',timeout:6000});
  assert(await page.locator('#hsMapDestinationsBackdrop [data-map-destination]').count() === 2, 'Map destination choices missing');
  await image(page, w + '-maps-choice');
  const fullMapStarted = Date.now();
  await page.locator('#hsMapDestinationsBackdrop [data-map-destination="interactive"]').click();
  await page.waitForFunction(() => {
    const e=document.getElementById('mapPage');
    return Boolean(e && e.getClientRects().length && getComputedStyle(e).display !== 'none'
      && document.body.classList.contains('hs-mobile-map-active'));
  }, null, { timeout:30000 });
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
    const gosReady = await page.waitForFunction(() =>
      typeof osMapInstance !== 'undefined' && Boolean(osMapInstance?.loaded?.()),
      null, {timeout:20000}).then(() => true).catch(() => false);
    console.log('GOS_MAP_FIRST_COMPLETE', JSON.stringify({ready:gosReady,elapsedMs:Date.now()-gosStart}));
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
  await page.locator(backSelector).waitFor({state:'visible',timeout:15000});
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
    assert(await page.locator('#terrain-toggle').count() === 1, 'Preview distribution display controls absent');
    assert(await page.locator('#era-control').count() === 1, 'Preview distribution period controls absent');
  }
  assert.equal(await page.locator(backSelector).getAttribute('href'),'/?map=interactive');
  await context.close();
}
async function desktop(browser) {
  const page=await browser.newPage({viewport:{width:1366,height:768},serviceWorkers:'block'});
  await openFresh(page, '/');
  assert(await page.locator('#navDistribution').isVisible(), 'Desktop distribution entry hidden');
  assert(!(await page.evaluate(() => document.documentElement.classList.contains('hs-mobile-browser'))), 'Desktop affected by browser-only mode');
  await inspect(page,'desktop');
  await image(page,'desktop-home');
  await show(page,'map','#mapPage');
  await image(page,'desktop-map');
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
