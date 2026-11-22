'use strict';
const {chromium} = require('playwright');
const fs = require('node:fs');
const results=[];
(async()=>{
 const browser=await chromium.launch({headless:true});
 for(const width of [390,1440]) {
  const context=await browser.newContext({viewport:{width,height:900},hasTouch:width<769,serviceWorkers:'block'});
  const page=await context.newPage();
  const measure=async(name,action,ready)=>{
   const start=Date.now();
   try {await action();await page.waitForFunction(ready,null,{timeout:45000,polling:50});const ms=Date.now()-start;results.push({width,name,ms,under3Seconds:ms<3000});}
   catch(e){results.push({width,name,error:e.message});}
  };
  const mainReady=()=> typeof fullMapInstance!=='undefined' && fullMapInstance && fullMapInstance.areTilesLoaded() && fullMapInstance.getLayer('wmu-fill') && fullMapInstance.querySourceFeatures('wmu-src',{sourceLayer:'wmus'}).length>0 && document.getElementById('fullMapLoading').style.display==='none';
  await measure('BC interactive cold navigation',()=>page.goto('https://huntsmartcanada.ca/?map=interactive',{waitUntil:'commit'}),mainReady);
  await page.evaluate(()=>showPage('home'));
  await measure('BC interactive return',()=>page.evaluate(()=>showPage('map')),mainReady);
  await measure('Alberta interactive first switch',()=>page.evaluate(()=>fullMapSetProvince('AB')),mainReady);
  await measure('GOS first open',()=>page.evaluate(()=>showPage('bcOpenSeasons')),()=>typeof osMapInstance!=='undefined' && osMapInstance && osMapInstance.areTilesLoaded() && !!osMapInstance.getLayer(OS_REGION_FILL));
  await measure('BC filter first open',()=>page.evaluate(()=>{showPage('filter');fpBcToggleMap();}),()=>document.querySelectorAll('#fpBcLeafletMap .leaflet-overlay-pane path').length>0 && !!document.querySelector('#fpBcLeafletMap .leaflet-tile-loaded'));
  await measure('Alberta filter first open',()=>page.evaluate(()=>{showPage('abFilter');abFpToggleMap();}),()=>document.querySelectorAll('#abFpLeafletMap .leaflet-overlay-pane path').length>0 && !!document.querySelector('#abFpLeafletMap .leaflet-tile-loaded'));
  await context.close();
 }
 await browser.close();fs.mkdirSync('map-qa-artifacts',{recursive:true});fs.writeFileSync('map-qa-artifacts/startup-times.json',JSON.stringify({network:'CI runner, unthrottled; cold browser cache on first navigation',results},null,2));console.log('MAP_STARTUP_TIMES',JSON.stringify(results));
 if(results.some(r=>r.error))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
