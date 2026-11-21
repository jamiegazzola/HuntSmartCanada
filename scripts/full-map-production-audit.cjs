'use strict';
// Read-only live production map QA. Never authenticate, save hunts, or alter user data.
const {chromium, webkit} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ROOT = (process.env.URL || 'https://huntsmartcanada.ca').replace(/\/$/, '');
if (!ROOT.startsWith('https://')) throw new Error('Production audit requires HTTPS');
fs.mkdirSync('map-qa-artifacts', {recursive:true});
const results = [];
const pause = ms => new Promise(resolve=>setTimeout(resolve,ms));
const stamp = () => Date.now();
async function step(name,fn) {
  const begun=stamp();
  try {
    const info=await fn();
    results.push({name,status:'PASS',ms:stamp()-begun,info:info??null});
    console.log('MAP_AUDIT_PASS',name,JSON.stringify(info??{}));
  } catch(error) {
    results.push({name,status:'FAIL',ms:stamp()-begun,error:String(error?.stack || error).slice(0,1000)});
    console.error('MAP_AUDIT_FAIL',name,error?.stack || error);
  }
}
async function shot(page,name) {
  try { await page.screenshot({path:'map-qa-artifacts/'+name+'.png',animations:'disabled',timeout:12000}); }
  catch(error){console.log('SCREENSHOT_UNAVAILABLE',name,error.message);}
}
async function open(page,path='/') {
  const response=await page.goto(ROOT+path+(path.includes('?')?'&':'?')+'audit='+stamp(),{waitUntil:'domcontentloaded',timeout:45000});
  assert(response?.ok(), 'HTTP '+response?.status()+' on '+path);
  return response;
}
async function wait(page,fn,timeout=30000) {
  return page.waitForFunction(fn,null,{timeout, polling:200});
}
async function visiblePage(page,key) {
  await page.evaluate(p=>window.showPage(p),key);
  await wait(page,()=> {
    const key={filter:'filterPage',abFilter:'abFilterPage',draws:'drawsPage',bcOpenSeasons:'bcOpenSeasonsPage',map:'mapPage'}[window.__hsAuditPage];
    return key? !!document.getElementById(key)?.getClientRects().length:true;
  },1000).catch(()=>{});
}
function track(page) {
  const logs={pageErrors:[],badResponses:[],mapRequests:0,provider200:0};
  page.on('pageerror',e=>logs.pageErrors.push(e.message.slice(0,250)));
  page.on('response',r=>{
    const u=r.url();
    if (/maps\.googleapis|maps\.gstatic|google\.com\/maps|mapbox\.com|\/species-map\/api\/species-data|map-tiles\//.test(u)) {
      logs.mapRequests++;
      if(r.ok())logs.provider200++;
      if(r.status()>=400)logs.badResponses.push({status:r.status(),url:u.slice(0,210)});
    }
  });
  return logs;
}
async function inspectShell(page,target,navId) {
  return page.evaluate(({target,navId})=>{
    const a=document.querySelector(target)?.getBoundingClientRect();
    const b=document.querySelector(navId)?.getBoundingClientRect();
    const header=document.querySelector('body > nav:not(.hs-mobile-tabbar)')?.getBoundingClientRect();
    return {
      target:a?{top:Math.round(a.top),bottom:Math.round(a.bottom),height:Math.round(a.height),width:Math.round(a.width)}:null,
      nav:b?{top:Math.round(b.top),bottom:Math.round(b.bottom)}:null,
      headerBottom:header?Math.round(header.bottom):null,
      width:innerWidth,height:innerHeight,
      overflow:document.documentElement.scrollWidth>innerWidth+3
    };
  },{target,navId});
}
async function mainApp(browser,engine,width,height) {
  const mobile=width<769;
  const label=engine+'-'+width;
  const context=await browser.newContext({viewport:{width,height},screen:{width,height},deviceScaleFactor:2,
    isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});
  const page=await context.newPage();
  const logs=track(page);
  await step(label+' homepage and map navigation',async()=>{
    await open(page,'/');
    await wait(page,()=>!!window.__HS_MAP_DESTINATIONS__ && !!document.getElementById('hsMobileTabbar'),35000).catch(()=>{});
    const headline=await page.evaluate(()=>{
      const rect=document.querySelector('#homePage .hero-title').getBoundingClientRect();
      return {top:Math.round(rect.top),viewport:innerHeight};
    });
    if(mobile){
      assert(await page.locator('#hsMobileTabbar [data-tab]').count()===5,'Five navigation tabs not present');
      assert(headline.top < headline.viewport*.44,'Homepage text remains too low: '+JSON.stringify(headline));
      await page.locator('#hsMobileTabbar [data-tab="map"]').click();
      await page.locator('#hsMapDestinationsBackdrop.open').waitFor({state:'visible',timeout:10000});
      assert.equal(await page.locator('#hsMapDestinationsBackdrop [data-map-destination]').count(),2,
        'Expected two map destinations');
      assert(await page.locator('.hs-map-destinations-title').isVisible(),'Map chooser title missing');
      await shot(page,label+'-map-chooser');
      await page.locator('#hsMapDestinationsBackdrop [data-map-destination="interactive"]').click();
    } else {
      assert(await page.locator('#navDistribution').isVisible(),'Desktop species map link missing');
      await page.evaluate(()=>window.showPage('map'));
    }
    await wait(page,()=>!!document.getElementById('mapPage')?.getClientRects().length,15000);
    if(mobile){
      const shell=await inspectShell(page,'#mapPage','#hsMobileTabbar');
      assert(!shell.overflow,'Horizontal document overflow: '+JSON.stringify(shell));
      assert(Math.abs(shell.target.bottom-shell.nav.top)<=9,'Map hides mobile navigation '+JSON.stringify(shell));
    }
    await shot(page,label+'-hunting-map');
    return headline;
  });
  await step(label+' BC hunting map tiles and zones',async()=>{
    await wait(page,()=>typeof fullMapInstance!=='undefined' && fullMapInstance &&
      fullMapInstance.getCanvas()?.width>200 && !!fullMapInstance.getStyle()?.layers?.length,40000);
    await wait(page,()=>typeof fullMapInstance!=='undefined' && fullMapInstance &&
      fullMapInstance.areTilesLoaded?.(),30000);
    const stat=await page.evaluate(()=>({
      province:typeof fullMapProvince!=='undefined'?fullMapProvince:null,
      tileReady:fullMapInstance.areTilesLoaded(),
      width:fullMapInstance.getCanvas().width,
      layers:fullMapInstance.getStyle()?.layers?.length||0,
      regionLayer:typeof _LYR_WMU_FILL!=='undefined' && !!fullMapInstance.getLayer(_LYR_WMU_FILL)
    }));
    assert(stat.layers>0 && stat.width>200,'BC map canvas empty');
    assert(stat.regionLayer,'BC WMU region layer missing');
    await shot(page,label+'-bc-ready');
    return stat;
  });
  await step(label+' Alberta hunting map switch',async()=>{
    await page.evaluate(()=>fullMapSetProvince('AB'));
    await wait(page,()=>typeof fullMapProvince!=='undefined' && fullMapProvince==='AB' &&
      typeof fullMapInstance!=='undefined' && fullMapInstance &&
      fullMapInstance.getCanvas()?.width>200,35000);
    await wait(page,()=>fullMapInstance.areTilesLoaded?.(),25000);
    const stat=await page.evaluate(()=>({
      province:fullMapProvince,
      ready:fullMapInstance.areTilesLoaded(),
      canvas:fullMapInstance.getCanvas().width,
      layers:fullMapInstance.getStyle()?.layers?.length||0,
      regionLayer:typeof _LYR_WMU_FILL!=='undefined' && !!fullMapInstance.getLayer(_LYR_WMU_FILL)
    }));
    assert(stat.regionLayer && stat.layers>0,'Alberta WMU overlay absent');
    await shot(page,label+'-alberta-ready');
    return stat;
  });
  await step(label+' BC GOS boundaries and navigation',async()=>{
    await page.evaluate(()=>window.showPage('bcOpenSeasons'));
    await wait(page,()=>typeof osMapInstance!=='undefined' && osMapInstance &&
      typeof OS_REGION_FILL!=='undefined' && !!osMapInstance.getLayer(OS_REGION_FILL),35000);
    await wait(page,()=>osMapInstance.areTilesLoaded?.(),25000);
    const stat=await page.evaluate(()=>({
      tilesLoaded:osMapInstance.areTilesLoaded(),
      region:osMapInstance.getLayer(OS_REGION_FILL)!=null,
      wmu:typeof OS_WMU_FILL!=='undefined' && osMapInstance.getLayer(OS_WMU_FILL)!=null,
      canvas:osMapInstance.getCanvas()?.width || 0
    }));
    assert(stat.canvas>200 && stat.region,'GOS map geometry/canvas not ready');
    if(mobile){
      const shell=await inspectShell(page,'#bcOpenSeasonsPage .os-page','#hsMobileTabbar');
      assert(Math.abs(shell.target.bottom-shell.nav.top)<=9,'GOS overlaps navigation: '+JSON.stringify(shell));
    }
    await shot(page,label+'-gos-ready');
    return stat;
  });
  await step(label+' BC draw filter mini-map',async()=>{
    await page.evaluate(()=>window.showPage('filter'));
    await page.evaluate(()=>fpBcToggleMap());
    await wait(page,()=>document.querySelectorAll('#fpBcLeafletMap .leaflet-overlay-pane path').length>0,45000);
    const n=await page.locator('#fpBcLeafletMap .leaflet-overlay-pane path').count();
    assert(n>=1,'No BC WMU polygons');
    await shot(page,label+'-bc-filter');
    return {polygonPaths:n};
  });
  await step(label+' Alberta draw filter mini-map',async()=>{
    await page.evaluate(()=>window.showPage('abFilter'));
    await page.evaluate(()=>abFpToggleMap());
    await wait(page,()=>document.querySelectorAll('#abFpLeafletMap .leaflet-overlay-pane path').length>0,55000);
    const n=await page.locator('#abFpLeafletMap .leaflet-overlay-pane path').count();
    assert(n>=1,'No AB WMU polygons');
    await shot(page,label+'-ab-filter');
    return {polygonPaths:n};
  });
  if(mobile && engine==='webkit'){
    await step(label+' LEH hunt-card map and basemap',async()=>{
      await page.evaluate(()=>window.showPage('draws'));
      await wait(page,()=>typeof filtered!=='undefined' && Array.isArray(filtered) && filtered.some(r=>r.Code&&r.MU&&r.Zone),20000);
      const ix=await page.evaluate(()=>filtered.findIndex(r=>r.Code&&r.MU&&r.Zone));
      await page.locator('#expbtn-'+ix).click();
      const id=await page.locator('#exp-'+ix+' .leh-card-map').first().getAttribute('id');
      assert(id,'Hunt card map absent');
      await page.waitForFunction(id=>
        typeof _lehCardMaps!=='undefined' && !!_lehCardMaps[id] &&
        _lehCardMaps[id].getCanvas()?.width>100 &&
        !document.querySelector('#'+id+' .hs-leh-card-loading'),
        id,{timeout:50000});
      const status=await page.locator('#'+id+'_status').innerText().catch(()=>'');
      assert(!/unavailable|failed/i.test(status),'LEH card map error: '+status);
      await shot(page,label+'-leh-card');
      return {id,status};
    });
  }
  await step(label+' JavaScript error inspection',async()=>{
    const fatal=logs.pageErrors.filter(x=>/ReferenceError|TypeError|SyntaxError/.test(x));
    assert.deepEqual(fatal,[],'JavaScript failures');
    return {mapRequests:logs.mapRequests,provider200:logs.provider200,
      sampleHttpErrors:logs.badResponses.slice(0,5),pageErrors:logs.pageErrors.slice(0,5)};
  });
  await context.close();
}
async function species(browser,engine,width,height) {
  const mobile=width<769,label=engine+'-'+width;
  const context=await browser.newContext({viewport:{width,height},screen:{width,height},deviceScaleFactor:2,
    isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});
  const page=await context.newPage(),logs=track(page);
  let accessible=false;
  await step(label+' species viewer boot and 2D controls',async()=>{
    await open(page,'/species-map/');
    await wait(page,()=>!!document.querySelector('.hs-map-toolbar') && !!document.getElementById('species'),35000);
    assert(await page.locator('#terrain-toggle').isHidden(),'3D control is visible');
    assert(await page.locator('#hsSpeciesAccount').count()===0,'Person icon still exists');
    assert(await page.locator('.hs-species-recovery').count()===1,'No loading recovery');
    if(mobile){
      assert.equal(await page.locator('#hsSpeciesTabbar [data-tab]').count(),5,'Distribution nav missing');
      const shell=await inspectShell(page,'#map','#hsSpeciesTabbar');
      assert(Math.abs(shell.target.bottom-shell.nav.top)<=8,'Distribution map overlaps bottom tabs: '+JSON.stringify(shell));
    }
    await shot(page,label+'-species-loading');
    accessible=true;
    return {uiReady:true};
  });
  await step(label+' species Google map imagery initialization',async()=>{
    await wait(page,()=>!!document.querySelector('#map .gm-style') &&
      !!window.google?.maps?.Map,40000);
    const stat=await page.evaluate(()=>({
      childCount:document.querySelector('#map .gm-style')?.children.length,
      canvas:document.querySelectorAll('#map .gm-style canvas').length,
      images:document.querySelectorAll('#map .gm-style img').length,
      error:document.getElementById('error')?.textContent,
      retryShown:!document.querySelector('.hs-species-recovery')?.hidden
    }));
    assert(stat.childCount>0,'Google map has no rendered children');
    assert(!stat.retryShown,'Species map is in recovery/error state');
    await shot(page,label+'-species-base-imagery');
    return stat;
  });
  if(accessible){
    await step(label+' species Modern layer',async()=>{
      const choose=await page.evaluate(()=>{
        const s=document.getElementById('species');
        const option=[...s.options].find(o=>o.value==='wild_sheep') || [...s.options].find(o=>o.value==='mule_deer');
        if(!option)throw new Error('Neither Wild Sheep nor Mule Deer is in catalogue');
        s.value=option.value;s.dispatchEvent(new Event('change',{bubbles:true}));
        document.getElementById('era-modern')?.click();
        return option.value;
      });
      await wait(page,()=>!document.querySelector('.species-control')?.classList.contains('loading'),45000);
      const stat=await page.evaluate(()=>({
        selected:document.getElementById('species')?.value,
        error:document.getElementById('error')?.textContent||'',
        note:document.getElementById('layer-note-text')?.textContent?.slice(0,170)||'',
        layerError:!/unavailable|could not load|temporarily unavailable|could not be loaded/i.test(document.getElementById('layer-note-text')?.textContent||'')
      }));
      assert(stat.layerError,'Modern layer unavailable: '+JSON.stringify(stat));
      await shot(page,label+'-species-modern');
      return {choose,...stat};
    });
    await step(label+' species Historical overlays',async()=>{
      await page.locator('#era-historical').click();
      await wait(page,()=>!document.querySelector('.species-control')?.classList.contains('loading'),55000);
      const stat=await page.evaluate(()=>({
        historical:document.getElementById('era-historical')?.getAttribute('aria-pressed'),
        note:document.getElementById('layer-note-text')?.textContent?.slice(0,200)||'',
        error:document.getElementById('error')?.textContent||''
      }));
      assert(stat.historical==='true','Historical did not activate');
      assert(!/unavailable|could not be loaded|failed to load/i.test(stat.note),'Historical failed: '+stat.note);
      await shot(page,label+'-species-historical');
      return stat;
    });
    await step(label+' species hunter-success overlay',async()=>{
      const success=page.locator('#hs-harvest-toggle');
      await success.waitFor({state:'attached',timeout:15000});
      await success.click({timeout:12000});
      await wait(page,()=>document.body.classList.contains('hunter-success-only') &&
        !document.querySelector('.species-control')?.classList.contains('loading'),35000);
      const stat=await page.evaluate(()=>({
        successMode:document.body.classList.contains('hunter-success-only'),
        detail:document.getElementById('hs-harvest-detail')?.textContent?.slice(0,200)||'',
        error:document.getElementById('error')?.textContent||''
      }));
      await shot(page,label+'-species-success');
      return stat;
    });
  }
  await step(label+' species requests and errors',async()=>{
    const fatal=logs.pageErrors.filter(x=>/ReferenceError|TypeError|SyntaxError/.test(x));
    assert.deepEqual(fatal,[],'Species JavaScript errors');
    return {mapRequests:logs.mapRequests,provider200:logs.provider200,
      providerErrors:logs.badResponses.slice(0,8),pageErrors:logs.pageErrors.slice(0,8)};
  });
  await context.close();
}
(async()=>{
  const chromiumBrowser=await chromium.launch({headless:true});
  const webkitBrowser=await webkit.launch({headless:true});
  try{
    await mainApp(webkitBrowser,'webkit',390,844);
    await species(webkitBrowser,'webkit',390,844);
    await mainApp(chromiumBrowser,'chromium',1366,768);
    await species(chromiumBrowser,'chromium',1366,768);
    const failures=results.filter(x=>x.status==='FAIL');
    const summary={total:results.length,passed:results.length-failures.length,failed:failures.length,
      results,at:new Date().toISOString()};
    fs.writeFileSync('map-qa-artifacts/report.json',JSON.stringify(summary,null,2));
    console.log('MAP_AUDIT_SUMMARY',JSON.stringify({total:summary.total,passed:summary.passed,failed:summary.failed,
      failures:failures.map(x=>({name:x.name,error:x.error.slice(0,240)}))}));
    if(failures.length)process.exitCode=1;
  } finally {
    await chromiumBrowser.close();await webkitBrowser.close();
  }
})().catch(error=>{console.error('MAP_AUDIT_FATAL',error.stack||error);process.exitCode=1;});