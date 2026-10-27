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
    .hs-map-demo.demo-custom-guide .demo-guide-rail{display:flex;flex-direction:column;min-width:0;border-left:1px solid #252c27;background:#111512;max-height:650px;overflow:auto}
    .hs-map-demo.demo-custom-guide .demo-guide-slot{flex:0 0 auto}
    .hs-map-demo.demo-custom-guide .demo-results-slot{flex:1 1 auto;min-height:0}
    .hs-map-demo.demo-custom-guide .demo-tutorial{display:block!important;position:static!important;inset:auto!important;width:auto!important;max-width:none!important;margin:0!important;padding:24px 22px 22px!important;border:0!important;border-bottom:1px solid #252c27!important;border-radius:0!important;background:#101411!important;box-shadow:none!important;backdrop-filter:none!important}
    .hs-map-demo.demo-custom-guide .demo-inspector{display:block!important;border:0!important;background:#111512!important;max-height:none!important;overflow:visible!important}
    .hs-map-demo.demo-custom-guide .demo-inspector-empty:not(.demo-guide-error){display:none!important}
    .hs-map-demo.demo-custom-guide .demo-step-body{display:block!important}
    .hs-map-demo.demo-custom-guide .demo-step-body>div:first-child{max-width:none!important}
    .hs-map-demo.demo-custom-guide .demo-step-body h3{font-size:26px;line-height:1.08;margin:0 0 8px}
    .hs-map-demo.demo-custom-guide .demo-step-body p{font-size:13px;line-height:1.65;color:#a8b0aa}
    .hs-map-demo.demo-custom-guide .demo-step-actions{margin-top:20px;justify-content:flex-start}
    .hs-map-demo.demo-custom-guide .demo-step-actions button{flex:1}
    .hs-map-demo.demo-custom-guide .demo-step-meta{align-items:flex-start;flex-wrap:wrap;row-gap:7px}
    .hs-map-demo .demo-guide-mode-choice{position:relative;z-index:12!important;border-color:var(--demo-gold,#e7b94a)!important;box-shadow:0 0 0 2px rgba(231,185,74,.92),0 0 0 7px rgba(231,185,74,.16),0 0 34px rgba(231,185,74,.34)!important;animation:demoGoldPulse 1.65s ease-in-out infinite}
    .hs-map-demo.demo-guide-mode-step .hs-map-demo-top>*:not(.demo-mode-group){opacity:.35;filter:saturate(.55)}
    .hs-map-demo.demo-custom-guide .demo-guide-result{box-shadow:inset 3px 0 0 rgba(231,185,74,.45)}
    .hs-map-demo.demo-free-clean .hs-map-demo-stage{grid-template-columns:minmax(0,1fr)!important}
    .hs-map-demo.demo-free-clean .demo-guide-rail{display:none!important}
    @media(max-width:1050px){
      .hs-map-demo.demo-custom-guide .hs-map-demo-stage{grid-template-columns:1fr!important}
      .hs-map-demo.demo-custom-guide .demo-guide-rail{border-left:0;border-top:1px solid #252c27;max-height:none}
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
    root.classList.remove('demo-guide-mode-step');
    inspector.classList.remove('demo-guide-result');
  }

  function hasResults(){
    return !!inspector.querySelector('.demo-inspector-head,.demo-result-card,.demo-zone-note');
  }

  function hidePlaceholder(){
    const empty = inspector.querySelector('.demo-inspector-empty');
    if (!empty) return;
    const text = (empty.textContent||'').toLowerCase();
    empty.classList.toggle('demo-guide-error', text.includes('could not load'));
  }

  function render(){
    if (!started) return;
    clearTargets();
    hidePlaceholder();
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
    else if(spec.target==='map') mapWrap.classList.add('demo-target');
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

  // Put the legacy guide into free mode first, then let this controller own the guided experience.
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
    hidePlaceholder();
    if(!started) return;
    if(step===3&&hasResults()) setTimeout(()=>go(4),140);
    else if(step===5&&pendingCompare&&hasResults()){pendingCompare=false;setTimeout(()=>go(6),140);}
  }).observe(inspector,{childList:true,subtree:true,characterData:true});
})();