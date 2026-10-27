(() => {
  'use strict';

  const root = document.getElementById('hsMapDemo');
  if (!root) return;

  const els = {
    guided: document.getElementById('demoGuided'),
    free: document.getElementById('demoFree'),
    leh: document.getElementById('demoModeLEH'),
    gos: document.getElementById('demoModeGOS'),
    species: document.getElementById('demoSpecies'),
    mapWrap: document.getElementById('demoMapWrap'),
    inspector: document.getElementById('demoInspector'),
    tutorial: document.getElementById('demoTutorial'),
    back: document.getElementById('demoBack'),
    next: document.getElementById('demoNext'),
    stepCount: document.getElementById('demoStepCount'),
    stepTitle: document.getElementById('demoStepTitle'),
    stepText: document.getElementById('demoStepText'),
    btn3D: document.getElementById('demo3D'),
    basemapGroup: root.querySelector('.demo-basemap-group')
  };

  if (Object.values(els).some(value => !value)) return;

  const style = document.createElement('style');
  style.textContent = `
    .hs-map-demo.demo-custom-guide .hs-map-demo-stage{grid-template-columns:minmax(0,1fr) 340px!important}
    .hs-map-demo.demo-custom-guide .demo-inspector{display:block!important;border-left:1px solid #252c27;background:#111512;overflow:auto}
    .hs-map-demo.demo-custom-guide .demo-inspector-empty:not(.demo-guide-error){display:none!important}
    .hs-map-demo.demo-custom-guide .demo-tutorial{
      display:block!important;position:static!important;inset:auto!important;width:auto!important;max-width:none!important;
      margin:0!important;padding:24px 22px 22px!important;border:0!important;border-bottom:1px solid #252c27!important;
      border-radius:0!important;background:#101411!important;box-shadow:none!important;backdrop-filter:none!important
    }
    .hs-map-demo.demo-custom-guide .demo-step-body{display:block!important}
    .hs-map-demo.demo-custom-guide .demo-step-body>div:first-child{max-width:none!important}
    .hs-map-demo.demo-custom-guide .demo-step-body h3{font-size:26px;line-height:1.08;margin:0 0 8px}
    .hs-map-demo.demo-custom-guide .demo-step-body p{font-size:13px;line-height:1.65;color:#a8b0aa}
    .hs-map-demo.demo-custom-guide .demo-step-actions{margin-top:20px;justify-content:flex-start}
    .hs-map-demo.demo-custom-guide .demo-step-actions button{flex:1}
    .hs-map-demo.demo-custom-guide .demo-step-meta{align-items:flex-start;flex-wrap:wrap;row-gap:7px}
    .hs-map-demo.demo-inspector-hidden .hs-map-demo-stage{grid-template-columns:minmax(0,1fr)!important}
    .hs-map-demo.demo-inspector-hidden .demo-inspector{display:none!important}
    .hs-map-demo .demo-guide-mode-choice{position:relative;z-index:12!important;border-color:var(--demo-gold,#e7b94a)!important;box-shadow:0 0 0 2px rgba(231,185,74,.92),0 0 0 7px rgba(231,185,74,.16),0 0 34px rgba(231,185,74,.34)!important;animation:demoGoldPulse 1.65s ease-in-out infinite}
    .hs-map-demo.demo-guide-mode-step .hs-map-demo-top>*:not(.demo-mode-group){opacity:.35;filter:saturate(.55);transition:opacity .2s ease,filter .2s ease}
    .hs-map-demo .demo-guide-result{border-left-color:rgba(231,185,74,.55)!important;box-shadow:inset 2px 0 0 rgba(231,185,74,.45)}
    .hs-map-demo.demo-custom-guide .demo-inspector-head{border-top:1px solid rgba(231,185,74,.16)}
    @media(max-width:1050px){
      .hs-map-demo.demo-custom-guide .hs-map-demo-stage{grid-template-columns:1fr!important}
      .hs-map-demo.demo-custom-guide .demo-inspector{border-left:0;border-top:1px solid #252c27;max-height:none}
      .hs-map-demo.demo-custom-guide .demo-tutorial{padding:20px!important}
      .hs-map-demo.demo-inspector-hidden .hs-map-demo-map-wrap{height:620px}
    }
    @media(max-width:700px){.hs-map-demo.demo-inspector-hidden .hs-map-demo-map-wrap{height:460px}}
    @media(prefers-reduced-motion:reduce){.hs-map-demo .demo-guide-mode-choice{animation:none!important}}
  `;
  document.head.appendChild(style);

  let step = 0;
  let firstMode = '';
  let pendingCompare = false;
  let started = true;
  let mutatingRail = false;

  const modeLabel = mode => mode === 'leh' ? 'LEH' : 'General Open Seasons';
  const otherMode = () => firstMode === 'leh' ? 'gos' : 'leh';

  function clearTargets() {
    root.querySelectorAll('.demo-target').forEach(el => el.classList.remove('demo-target'));
    root.querySelectorAll('.demo-guide-mode-choice').forEach(el => el.classList.remove('demo-guide-mode-choice'));
    els.inspector.classList.remove('demo-guide-result');
    root.classList.remove('demo-guide-mode-step');
  }

  function hasResultContent() {
    return !!els.inspector.querySelector('.demo-inspector-head,.demo-result-card,.demo-zone-note');
  }

  function railHasError() {
    const empty = els.inspector.querySelector('.demo-inspector-empty');
    if (!empty) return false;
    const heading = (empty.querySelector('h3')?.textContent || '').toLowerCase();
    return heading.includes('could not load') || heading.includes('data could not load');
  }

  function mountTutorialInRail() {
    if (!started || mutatingRail) return;
    mutatingRail = true;
    try {
      const empties = Array.from(els.inspector.querySelectorAll('.demo-inspector-empty'));
      empties.forEach(empty => {
        const heading = (empty.querySelector('h3')?.textContent || '').toLowerCase();
        const isError = heading.includes('could not load') || heading.includes('data could not load');
        if (!isError) empty.remove();
        else empty.classList.add('demo-guide-error');
      });
      if (els.tutorial.parentElement !== els.inspector || els.inspector.firstElementChild !== els.tutorial) {
        els.inspector.prepend(els.tutorial);
      }
    } finally {
      mutatingRail = false;
    }
  }

  function syncInspectorVisibility() {
    if (started) {
      root.classList.remove('demo-inspector-hidden');
      mountTutorialInRail();
    } else {
      root.classList.toggle('demo-inspector-hidden', !hasResultContent() && !railHasError());
    }
    window.setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
  }

  const steps = [
    () => ({title:'Meet the HuntSmart map',text:'This is a real interactive teaching map. The tour will point to exactly what to click, then let you compare LEH and General Open Seasons on the same geography.',next:'Start tour →',wait:false,target:'none'}),
    () => ({title:'Choose a hunting system',text:'Start with either Limited Entry Hunting or General Open Seasons. You will compare the other system later using the same species and WMU.',next:'Choose LEH or GOS to continue',wait:true,target:'modes'}),
    () => ({title:'Choose a species',text:`You started with ${modeLabel(firstMode)}. Pick the species you care about and HuntSmart will light up the WMUs with matching records.`,next:'Choose a species to continue',wait:true,target:'species'}),
    () => ({title:'Pick a highlighted WMU',text:'Click any highlighted Wildlife Management Unit. HuntSmart will open the real matching draw or open-season records for that area.',next:'Click a highlighted WMU to continue',wait:true,target:'map'}),
    () => ({title:`Read the ${modeLabel(firstMode)} result`,text:firstMode==='leh'?'The records below are the actual LEH draw opportunities for your species and WMU. When mapped LEH zones exist, HuntSmart draws them in gold.':'The records below are the actual General Open Seasons rows associated with your species and WMU, including season and method context where available.',next:`Compare with ${modeLabel(otherMode())} →`,wait:false,target:'result'}),
    () => ({title:`Switch to ${modeLabel(otherMode())}`,text:`Now switch systems. HuntSmart keeps the same hunting context so you can see how ${modeLabel(otherMode())} answers a different question for the same area.`,next:`Switch to ${modeLabel(otherMode())} to continue`,wait:true,target:'other-mode'}),
    () => ({title:`Compare the ${modeLabel(otherMode())} result`,text:otherMode()==='leh'?'The records below now show limited-entry draw opportunities for the same species and geography. Compare them with the open-season context you saw first.':'The records below now show open-season rows for the same species and geography. Compare them with the limited-entry draw information you saw first.',next:'Try a map layer →',wait:false,target:'result'}),
    () => ({title:'Use the map layer that answers your question',text:'Try Satellite, Topo, or 3D. Streets is best for orientation; satellite and terrain are more useful when access, land cover, and relief matter.',next:'Change a layer to continue',wait:true,target:'layers'}),
    () => ({title:'You are ready to explore',text:'You have used both hunting systems, filtered by species, inspected a real WMU result, and changed the map view. Keep exploring freely from here.',next:'Explore freely',wait:false,target:'none',finish:true})
  ];

  function render() {
    if (!started) return;
    mountTutorialInRail();
    clearTargets();
    const spec = steps[step]();
    els.stepCount.textContent = `Step ${step + 1} of ${steps.length}`;
    els.stepTitle.textContent = spec.title;
    els.stepText.textContent = spec.text;
    els.back.disabled = step === 0;
    els.next.disabled = !!spec.wait;
    els.next.textContent = spec.next;

    if (spec.target === 'modes') {
      root.classList.add('demo-guide-mode-step');
      els.leh.classList.add('demo-guide-mode-choice');
      els.gos.classList.add('demo-guide-mode-choice');
    } else if (spec.target === 'species') {
      els.species.classList.add('demo-target');
    } else if (spec.target === 'map') {
      els.mapWrap.classList.add('demo-target');
    } else if (spec.target === 'result') {
      els.inspector.classList.add('demo-guide-result');
    } else if (spec.target === 'other-mode') {
      (otherMode() === 'leh' ? els.leh : els.gos).classList.add('demo-target');
    } else if (spec.target === 'layers') {
      els.basemapGroup.classList.add('demo-target');
    }
  }

  function goTo(nextStep) {
    step = Math.max(0, Math.min(steps.length - 1, nextStep));
    render();
  }

  function finishTour() {
    started = false;
    clearTargets();
    root.classList.remove('demo-custom-guide', 'demo-guide-mode-step');
    root.classList.add('demo-free-mode');
    els.guided.classList.remove('active');
    els.free.classList.add('active');
    syncInspectorVisibility();
  }

  function startTour() {
    started = true;
    firstMode = '';
    pendingCompare = false;
    step = 0;
    root.classList.add('demo-custom-guide', 'demo-free-mode');
    root.classList.remove('demo-inspector-hidden');
    els.guided.classList.add('active');
    els.free.classList.remove('active');
    mountTutorialInRail();
    render();
    syncInspectorVisibility();
  }

  // Put the stable map core in free mode once; this controller owns only the guide UI.
  els.free.click();
  startTour();

  els.guided.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    startTour();
  }, true);

  els.free.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    finishTour();
  }, true);

  els.next.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!started) return;
    const spec = steps[step]();
    if (spec.wait) return;
    if (spec.finish) return finishTour();
    goTo(step + 1);
  }, true);

  els.back.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (started && step > 0) goTo(step - 1);
  }, true);

  function handleModeChoice(mode) {
    if (!started) return;
    if (step === 1) {
      firstMode = mode;
      window.setTimeout(() => goTo(2), 220);
    } else if (step === 5 && mode === otherMode()) {
      pendingCompare = true;
    }
  }

  els.leh.addEventListener('click', () => handleModeChoice('leh'));
  els.gos.addEventListener('click', () => handleModeChoice('gos'));

  els.species.addEventListener('change', () => {
    if (started && step === 2 && els.species.value) window.setTimeout(() => goTo(3), 180);
  });

  root.querySelectorAll('[data-demo-basemap]').forEach(button => {
    button.addEventListener('click', () => {
      if (started && step === 7) window.setTimeout(() => goTo(8), 180);
    });
  });
  els.btn3D.addEventListener('click', () => {
    if (started && step === 7) window.setTimeout(() => goTo(8), 180);
  });

  const inspectorObserver = new MutationObserver(() => {
    if (mutatingRail) return;
    if (started) mountTutorialInRail();
    syncInspectorVisibility();
    const hasResult = hasResultContent();
    if (!started || !hasResult) return;
    if (step === 3) {
      window.setTimeout(() => goTo(4), 160);
    } else if (step === 5 && pendingCompare) {
      pendingCompare = false;
      window.setTimeout(() => goTo(6), 160);
    }
  });

  inspectorObserver.observe(els.inspector, {childList:true,subtree:true,characterData:true});
  syncInspectorVisibility();
})();
