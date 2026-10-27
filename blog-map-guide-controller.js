(() => {
  'use strict';

  const root = document.getElementById('hsMapDemo');
  if (!root) return;

  const stage = root.querySelector('.hs-map-demo-stage');
  const mapWrap = document.getElementById('demoMapWrap');
  const inspector = document.getElementById('demoInspector');
  const tutorial = document.getElementById('demoTutorial');
  const guided = document.getElementById('demoGuided');
  const free = document.getElementById('demoFree');
  const leh = document.getElementById('demoModeLEH');
  const gos = document.getElementById('demoModeGOS');
  const species = document.getElementById('demoSpecies');
  const back = document.getElementById('demoBack');
  const next = document.getElementById('demoNext');
  const stepCount = document.getElementById('demoStepCount');
  const stepTitle = document.getElementById('demoStepTitle');
  const stepText = document.getElementById('demoStepText');
  const btn3D = document.getElementById('demo3D');
  const basemapGroup = root.querySelector('.demo-basemap-group');

  if (![stage,mapWrap,inspector,tutorial,guided,free,leh,gos,species,back,next,stepCount,stepTitle,stepText,btn3D,basemapGroup].every(Boolean)) return;

  const rail = document.createElement('aside');
  rail.id = 'demoGuideRail';
  rail.className = 'demo-guide-rail';
  rail.setAttribute('aria-label','Guided tour and map results');

  const tutorialSlot = document.createElement('div');
  tutorialSlot.className = 'demo-guide-slot';
  const resultsSlot = document.createElement('div');
  resultsSlot.className = 'demo-results-slot';

  stage.appendChild(rail);
  rail.appendChild(tutorialSlot);
  rail.appendChild(resultsSlot);
  tutorialSlot.appendChild(tutorial);
  resultsSlot.appendChild(inspector);

  const style = document.createElement('style');
  style.textContent = `
    .hs-map-demo.demo-custom-guide .hs-map-demo-stage{grid-template-columns:minmax(0,1fr) 340px!important}
    .hs-map-demo.demo-custom-guide .demo-guide-rail{display:flex!important;flex-direction:column!important;min-width:0!important;border-left:1px solid #252c27!important;background:#111512!important;max-height:650px!important;overflow:auto!important}
    .hs-map-demo.demo-custom-guide .demo-guide-slot{display:block!important;flex:0 0 auto!important;min-width:0!important;width:100%!important}
    .hs-map-demo.demo-custom-guide .demo-results-slot{display:none!important}
    .hs-map-demo.demo-custom-guide .demo-results-slot.has-results{display:block!important;flex:1 1 auto!important;min-height:0!important;border-top:1px solid #252c27!important}

    .hs-map-demo.demo-custom-guide .demo-tutorial{
      display:block!important;position:static!important;inset:auto!important;top:auto!important;left:auto!important;right:auto!important;bottom:auto!important;
      width:100%!important;max-width:none!important;min-width:0!important;height:auto!important;margin:0!important;padding:22px!important;
      border:0!important;border-radius:0!important;background:#101411!important;box-shadow:none!important;backdrop-filter:none!important;overflow:visible!important;
    }
    .hs-map-demo.demo-custom-guide .demo-step-meta{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:10px!important;flex-wrap:wrap!important;width:100%!important;margin:0 0 18px!important}
    .hs-map-demo.demo-custom-guide .demo-step-meta:before{display:block!important;flex:0 0 100%!important;margin:0 0 2px!important;color:#ffdd83!important;font-size:10px!important;line-height:1.2!important}
    .hs-map-demo.demo-custom-guide .demo-safe-pill{display:inline-flex!important;max-width:100%!important;white-space:normal!important;line-height:1.25!important}
    .hs-map-demo.demo-custom-guide .demo-step-body{display:block!important;width:100%!important;min-width:0!important}
    .hs-map-demo.demo-custom-guide .demo-step-body>div:first-child{display:block!important;width:100%!important;min-width:0!important;max-width:none!important}
    .hs-map-demo.demo-custom-guide .demo-step-body h3{display:block!important;width:100%!important;max-width:none!important;margin:0 0 10px!important;font-size:26px!important;line-height:1.12!important;white-space:normal!important;word-break:normal!important;overflow-wrap:normal!important;color:#fff3ca!important}
    .hs-map-demo.demo-custom-guide .demo-step-body p{display:block!important;width:100%!important;max-width:none!important;margin:0!important;font-size:13px!important;line-height:1.6!important;white-space:normal!important;word-break:normal!important;overflow-wrap:break-word!important;color:#b7b3a5!important}
    .hs-map-demo.demo-custom-guide .demo-step-actions{display:flex!important;width:100%!important;gap:8px!important;margin:22px 0 0!important;justify-content:stretch!important}
    .hs-map-demo.demo-custom-guide .demo-step-actions button{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:1 1 0!important;min-width:0!important;white-space:normal!important}

    .hs-map-demo.demo-custom-guide .demo-inspector{display:block!important;border:0!important;background:#111512!important;max-height:none!important;overflow:visible!important}
    .hs-map-demo.demo-custom-guide .demo-inspector-empty{display:none!important}
    .hs-map-demo .demo-guide-mode-choice{position:relative;z-index:12!important;border-color:var(--demo-gold,#e7b94a)!important;box-shadow:0 0 0 2px rgba(231,185,74,.92),0 0 0 7px rgba(231,185,74,.16),0 0 34px rgba(231,185,74,.34)!important;animation:demoGoldPulse 1.65s ease-in-out infinite}
    .hs-map-demo.demo-guide-mode-step .hs-map-demo-top>*:not(.demo-mode-group){opacity:.35;filter:saturate(.55)}
    .hs-map-demo.demo-custom-guide .demo-guide-result{box-shadow:inset 3px 0 0 rgba(231,185,74,.45)}
    .hs-map-demo.demo-free-clean .hs-map-demo-stage{grid-template-columns:minmax(0,1fr)!important}
    .hs-map-demo.demo-free-clean .demo-guide-rail{display:none!important}

    /* Step 4 uses a dedicated, non-animated hint instead of the generic .demo-target overlay. */
    .hs-map-demo.demo-custom-guide .hs-map-demo-map-wrap.demo-map-step-active{
      position:relative!important;
      z-index:1!important;
      animation:none!important;
      box-shadow:none!important;
      border-color:inherit!important;
    }
    .hs-map-demo.demo-custom-guide .hs-map-demo-map-wrap.demo-map-step-active::before{content:none!important}
    .hs-map-demo.demo-custom-guide .hs-map-demo-map-wrap.demo-map-step-active::after{
      content:"Click a highlighted WMU"!important;
      position:absolute!important;
      inset:auto!important;
      left:50%!important;
      top:24px!important;
      right:auto!important;
      bottom:auto!important;
      transform:translateX(-50%)!important;
      width:max-content!important;
      max-width:calc(100% - 40px)!important;
      height:auto!important;
      padding:9px 12px!important;
      border:1px solid rgba(231,185,74,.68)!important;
      border-radius:999px!important;
      background:rgba(9,11,9,.92)!important;
      color:#ffe7a3!important;
      font-size:12px!important;
      font-weight:900!important;
      line-height:1.2!important;
      box-shadow:0 8px 22px rgba(0,0,0,.28)!important;
      animation:none!important;
      pointer-events:none!important;
      white-space:nowrap!important;
      z-index:20!important;
    }

    @media(max-width:1050px){
      .hs-map-demo.demo-custom-guide .hs-map-demo-stage{grid-template-columns:1fr!important}
      .hs-map-demo.demo-custom-guide .demo-guide-rail{border-left:0!important;border-top:1px solid #252c27!important;max-height:none!important}
    }
    @media(max-width:700px){
      .hs-map-demo.demo-custom-guide .demo-tutorial{padding:18px!important}
      .hs-map-demo.demo-custom-guide .demo-step-actions{flex-direction:column!important}
      .hs-map-demo.demo-custom-guide .hs-map-demo-map-wrap.demo-map-step-active::after{white-space:normal!important;text-align:center!important}
    }
    @media(prefers-reduced-motion:reduce){.hs-map-demo .demo-guide-mode-choice{animation:none!important}}
  `;
  document.head.appendChild(style);

  let started = true;
  let step = 0;
  let firstMode = '';
  let pendingCompare = false;

  const label = mode => mode === 'leh' ? 'LEH' : 'General Open Seasons';
  const otherMode = () => firstMode === 'leh' ? 'gos' : 'leh';

  const steps = [
    () => ({title:'Meet the HuntSmart map',text:'This guided tour will point to exactly what to click while you compare LEH and General Open Seasons on the same BC geography.',next:'Start tour →',wait:false,target:'none'}),
    () => ({title:'Choose a hunting system',text:'Start with either Limited Entry Hunting or General Open Seasons. You will compare the other system later.',next:'Choose LEH or GOS to continue',wait:true,target:'modes'}),
    () => ({title:'Choose a species',text:`You started with ${label(firstMode)}. Pick a species and HuntSmart will light up the WMUs with matching records.`,next:'Choose a species to continue',wait:true,target:'species'}),
    () => ({title:'Pick a highlighted WMU',text:'Click any highlighted Wildlife Management Unit to open the real matching records for that area.',next:'Click a highlighted WMU to continue',wait:true,target:'map'}),
    () => ({title:`Read the ${label(firstMode)} result`,text:firstMode==='leh'?'The results below are the actual LEH draw records for this species and WMU.':'The results below are the actual General Open Seasons rows for this species and WMU.',next:`Compare with ${label(otherMode())} →`,wait:false,target:'result'}),
    () => ({title:`Switch to ${label(otherMode())}`,text:`Switch systems while keeping the same hunting context so you can compare how ${label(otherMode())} answers a different question.`,next:`Switch to ${label(otherMode())} to continue`,wait:true,target:'other-mode'}),
    () => ({title:`Compare the ${label(otherMode())} result`,text:'The results below now show the other system for the same species and geography.',next:'Try a map layer →',wait:false,target:'result'}),
    () => ({title:'Try another map layer',text:'Use Satellite, Topo, or 3D when land cover, relief, or access context matters.',next:'Change a layer to continue',wait:true,target:'layers'}),
    () => ({title:'You are ready to explore',text:'You have used both hunting systems, filtered by species, inspected a WMU, and changed the map view.',next:'Explore freely',wait:false,target:'none',finish:true})
  ];

  function clearTargets(){
    root.querySelectorAll('.demo-target').forEach(el=>el.classList.remove('demo-target'));
    root.querySelectorAll('.demo-guide-mode-choice').forEach(el=>el.classList.remove('demo-guide-mode-choice'));
    mapWrap.classList.remove('demo-map-step-active');
    root.classList.remove('demo-guide-mode-step');
    inspector.classList.remove('demo-guide-result');
  }

  function hasResults(){
    return !!inspector.querySelector('.demo-inspector-head,.demo-result-card,.demo-zone-note');
  }

  function syncResults(){
    const visible = hasResults();
    resultsSlot.classList.toggle('has-results', visible);
    const empties = inspector.querySelectorAll('.demo-inspector-empty');
    empties.forEach(el => { el.style.display = 'none'; el.setAttribute('aria-hidden','true'); });
    return visible;
  }

  function render(){
    if (!started) return;
    clearTargets();
    syncResults();
    const spec = steps[step]();
    stepCount.textContent = `Step ${step+1} of ${steps.length}`;
    stepTitle.textContent = spec.title;
    stepText.textContent = spec.text;
    back.disabled = step === 0;
    next.disabled = !!spec.wait;
    next.textContent = spec.next;

    if(spec.target==='modes'){
      root.classList.add('demo-guide-mode-step');
      leh.classList.add('demo-guide-mode-choice');
      gos.classList.add('demo-guide-mode-choice');
    } else if(spec.target==='species') species.classList.add('demo-target');
    else if(spec.target==='map') mapWrap.classList.add('demo-map-step-active');
    else if(spec.target==='result') inspector.classList.add('demo-guide-result');
    else if(spec.target==='other-mode') (otherMode()==='leh'?leh:gos).classList.add('demo-target');
    else if(spec.target==='layers') basemapGroup.classList.add('demo-target');
  }

  function go(n){step=Math.max(0,Math.min(steps.length-1,n));render();}

  function startTour(){
    started=true; step=0; firstMode=''; pendingCompare=false;
    root.classList.add('demo-custom-guide');
    root.classList.remove('demo-free-clean');
    guided.classList.add('active'); free.classList.remove('active');
    render();
    setTimeout(()=>window.dispatchEvent(new Event('resize')),0);
  }

  function finishTour(){
    started=false; clearTargets();
    root.classList.remove('demo-custom-guide');
    if(!hasResults()) root.classList.add('demo-free-clean');
    guided.classList.remove('active'); free.classList.add('active');
    setTimeout(()=>window.dispatchEvent(new Event('resize')),0);
  }

  // Put the legacy guide into free mode once, then let this controller own the guided experience.
  free.click();
  startTour();

  guided.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();startTour();},true);
  free.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();finishTour();},true);

  next.addEventListener('click',e=>{
    e.preventDefault();e.stopImmediatePropagation();
    if(!started) return;
    const spec=steps[step]();
    if(spec.wait) return;
    if(spec.finish) return finishTour();
    go(step+1);
  },true);

  back.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();if(started&&step>0)go(step-1);},true);

  function chooseMode(mode){
    if(!started) return;
    if(step===1){firstMode=mode;setTimeout(()=>go(2),180);}
    else if(step===5&&mode===otherMode()) pendingCompare=true;
  }
  leh.addEventListener('click',()=>chooseMode('leh'));
  gos.addEventListener('click',()=>chooseMode('gos'));

  species.addEventListener('change',()=>{if(started&&step===2&&species.value)setTimeout(()=>go(3),160);});

  root.querySelectorAll('[data-demo-basemap]').forEach(btn=>btn.addEventListener('click',()=>{if(started&&step===7)setTimeout(()=>go(8),160);}));
  btn3D.addEventListener('click',()=>{if(started&&step===7)setTimeout(()=>go(8),160);});

  new MutationObserver(()=>{
    const visible = syncResults();
    if(!started || !visible) return;
    if(step===3) setTimeout(()=>go(4),140);
    else if(step===5&&pendingCompare){pendingCompare=false;setTimeout(()=>go(6),140);}
  }).observe(inspector,{childList:true,subtree:true,characterData:true});
})();