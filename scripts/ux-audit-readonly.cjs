'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const root=(process.env.URL||'https://huntsmartcanada.ca').replace(/\/$/,'');
const pages=[
 ['Home','home','#homePage'],
 ['BC filter','filter','#filterPage'],
 ['BC results','draws','#drawsPage'],
 ['Alberta filter','abFilter','#abFilterPage'],
 ['Alberta results','abDraws','#abDrawsPage'],
 ['Saved','saved','#savedPage'],
 ['Hunting map','map','#mapPage'],
 ['GOS','bcOpenSeasons','#bcOpenSeasonsPage']
];
const out=[];
async function inspect(page,label) {
 const a=await page.evaluate(()=>{
  const shown=e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e);
    return r.width>0&&r.height>0&&c.visibility!=='hidden'&&c.display!=='none'&&r.bottom>0&&r.top<innerHeight;};
  const nodes=[...document.querySelectorAll('a,button,input,select,textarea,[role="button"]')].filter(shown);
  const weak=nodes.map(el=>{const r=el.getBoundingClientRect();return {
    element:el.tagName.toLowerCase(),label:(el.getAttribute('aria-label')||el.innerText||el.title||el.getAttribute('placeholder')||'').trim().slice(0,75),
    width:Math.round(r.width),height:Math.round(r.height),x:Math.round(r.x),y:Math.round(r.y)
  }}).filter(x=>x.width<40||x.height<40);
  const textNodes=[...document.querySelectorAll('button,span,small,p,label,a,h1,h2,h3,h4')].filter(shown).map(el=>{
    const c=getComputedStyle(el),r=el.getBoundingClientRect();
    return {tag:el.tagName.toLowerCase(),text:(el.innerText||'').trim().slice(0,65),
      px:Math.round(parseFloat(c.fontSize)*10)/10,color:c.color,background:c.backgroundColor,
      x:Math.round(r.x),y:Math.round(r.y)};
  }).filter(t=>t.text&&t.px<12.5);
  const all=[...document.querySelectorAll('*')];
  const outliers=all.filter(el=>{
    const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
    return r.width>0&&r.height>0&&r.top<innerHeight&&r.bottom>0&&
      r.right>innerWidth+4&&cs.position!=='absolute'&&cs.position!=='fixed';
  });
  return {
    viewport:{width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth},
    controlCount:nodes.length,smallControls:weak.length,smallExamples:weak.slice(0,15),
    smallTextCount:textNodes.length,smallTextExamples:textNodes.slice(0,16),
    horizontalOverflows:outliers.slice(0,8).map(e=>({tag:e.tagName,id:e.id,cls:String(e.className).slice(0,60),right:Math.round(e.getBoundingClientRect().right)}))
  };
 });
 let violations=[];
 try {
   await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
   violations=await page.evaluate(async()=>{
     if(!window.axe)return[];
     const result=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']},
       rules:{'color-contrast':{enabled:true}}});
     return result.violations.map(v=>({id:v.id,impact:v.impact,description:v.help,count:v.nodes.length,
       examples:v.nodes.slice(0,5).map(n=>({target:n.target,summary:n.failureSummary?.slice(0,230)}))}));
   });
 } catch(e){violations=[{id:'audit-execution-error',impact:'unknown',description:String(e).slice(0,300),count:0}];}
 const record={page:label,...a,violations};
 out.push(record);
 console.log('UX_AUDIT',JSON.stringify(record));
}
(async()=>{
 fs.mkdirSync('ux-audit-artifacts',{recursive:true});
 const browser=await chromium.launch({headless:true});
 try {
  for(const width of [390,1366]){
   const context=await browser.newContext({viewport:{width,height:width===390?844:768},isMobile:width===390,hasTouch:width===390,
     serviceWorkers:'block',reducedMotion:'reduce'});
   const page=await context.newPage();
   await page.goto(root+'/?ux-audit='+width,{waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForFunction(()=>typeof window.showPage==='function',{timeout:35000});
   for(const [label,key,selector] of pages){
    try{
     await page.evaluate(k=>window.showPage(k),key);
     await page.waitForFunction(sel=>document.querySelector(sel)?.getClientRects().length>0,selector,{timeout:15000});
     await page.waitForTimeout(300);
     await inspect(page,label+' / '+width);
    }catch(e){out.push({page:label+' / '+width,error:String(e).slice(0,250)});
      console.log('UX_AUDIT_FAILURE',label,width,String(e).slice(0,250));
    }
   }
   await context.close();
  }
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();
  await page.goto(root+'/species-map/?ux-audit=species',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('.hs-map-toolbar',{timeout:40000});
  await inspect(page,'Species map / 390');
  await context.close();
  fs.writeFileSync('ux-audit-artifacts/report.json',JSON.stringify(out,null,2));
  const aggregate={screens:out.length,screenErrors:out.filter(x=>x.error).length,
    violationsByType:{},smallControls:out.reduce((s,x)=>s+(x.smallControls||0),0)};
  for(const item of out)for(const v of(item.violations||[])){
    if(!aggregate.violationsByType[v.id])aggregate.violationsByType[v.id]={screens:0,elements:0};
    aggregate.violationsByType[v.id].screens++;
    aggregate.violationsByType[v.id].elements+=v.count;
  }
  console.log('UX_AUDIT_SUMMARY',JSON.stringify(aggregate));
  assert(aggregate.screens>=16,'Incomplete audit');
 }finally{await browser.close()}
})().catch(e=>{console.error('UX_AUDIT_ERROR',e.stack||e);process.exitCode=1;});