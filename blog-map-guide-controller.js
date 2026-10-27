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
    .hs-map-demo.demo-custom-guide.demo-free-mode .demo-tutorial{display:block!important}
    .hs-map-demo.demo-inspector-hidden .hs-map-demo-stage{grid-template-columns:minmax(0,1fr)!important}
    .hs-map-demo.demo-inspector-hidden .demo-inspector{display:none!important}
    .hs-map-demo .demo-guide-mode-choice{position:relative;z-index:12!important;border-color:var(--demo-gold,#e7b94a)!important;box-shadow:0 0 0 2px rgba(231,185,74,.92),0 0 0 7px rgba(231,185,74,.16),0 0 34px rgba(231,185,74,.34)!important;animation:demoGoldPulse 1.65s ease-in-out infinite}
    .hs-map-demo.demo-guide-mode-step .hs-map-demo-top>*:not(.demo-mode-group){opacity:.35;filter:saturate(.55);transition:opacity .2s ease,filter .2s ease}
    .hs-map-demo .demo-guide-result{border-left-color:rgba(231,185,74,.55)!important;box-shadow:inset 2px 0 0 rgba(231,185,74,.45),0 0 28px rgba(231,185,74,.08)}
    .hs-map-demo.demo-custom-guide .demo-step-body{display:block}
    .hs-map-demo.demo-custom-guide .demo-step-actions{margin-top:18px;justify-content:flex-end}
    .hs-map-demo.demo-custom-guide .demo-step-body>div:first-child{max-width:100%}
    @media(max-width:1050px){.hs-map-demo.demo-inspector-hidden .hs-map-demo-map-wrap{height:620px}}
    @media(max-width:700px){.hs-map-demo.demo-inspector-hidden .hs-map-demo-map-wrap{height:460px}}
    @media(prefers-reduced-motion:reduce){.hs-map-demo .demo-guide-mode-choice{animation:none!important}}
  `;
  document.head.appendChild(style);

  let step = 0;
  let firstMode = '';
  let pendingCompare = false;
  let started = true;

  const modeLabel = mode => mode === 'leh' ? 'LEH' : 'General Open Seasons';
  const otherMode = () => firstMode === 'leh' ? 'gos' : 'leh';

  function clearTargets() {
    root.querySelectorAll('.demo-target').forEach(el => el.classList.remove('demo-target'));
    root.querySelectorAll('.demo-guide-mode-choice').forEach(el => el.classList.remove('demo-guide-mode-choice'));
    els.inspector.classList.remove('demo-guide-result');
    root.classList.remove('demo-guide-mode-step');
  }

  function syncInspectorVisibility() {
    const empty = !!els.inspector.querySelector('.demo-inspector-empty');
    const heading = (els.inspector.querySelector('h3')?.textContent || '').toLowerCase();
    const isError = heading.includes('could not load');
    root.classList.toggle('demo-inspector-hidden', empty && !isError);
    window.setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
  }

  const steps = [
    () => ({
      title: 'Meet the HuntSmart map',
      text: 'This is a real interactive teaching map. The tour will point to exactly what to click, then let you compare LEH and General Open Seasons on the same geography.',
      next: 'Start tour →',
      wait: false,
      target: 'none'
    }),
    () => ({
      title: 'Choose a hunting system',
      text: 'Start with either Limited Entry Hunting or General Open Seasons. You will compare the other system later using the same species and WMU.',
      next: 'Choose LEH or GOS to continue',
      wait: true,
      target: 'modes'
    }),
    () => ({
      title: 'Choose a species',
      text: `You started with ${modeLabel(firstMode)}. Pick the species you care about and HuntSmart will light up the WMUs with matching records.`,
      next: 'Choose a species to continue',
      wait: true,
      target: 'species'
    }),
    () => ({
      title: 'Pick a highlighted WMU',
      text: 'Click any highlighted Wildlife Management Unit. HuntSmart will open the real matching draw or open-season records for that area.',
      next: 'Click a highlighted WMU to continue',
      wait: true,
      target: 'map'
    }),
    () => ({
      title: `Read the ${modeLabel(firstMode)} result`,
      text: firstMode === 'leh'
        ? 'The panel now shows the actual LEH draw records for your species and WMU. When mapped LEH zones exist, HuntSmart draws them in gold.'
        : 'The panel now shows the actual General Open Seasons rows associated with your species and WMU, including season and method context where available.',
      next: `Compare with ${modeLabel(otherMode())} →`,
      wait: false,
      target: 'result'
    }),
    () => ({
      title: `Switch to ${modeLabel(otherMode())}`,
      text: `Now switch systems. HuntSmart keeps the same hunting context so you can see how ${modeLabel(otherMode())} answers a different question for the same area.`,
      next: `Switch to ${modeLabel(otherMode())} to continue`,
      wait: true,
      target: 'other-mode'
    }),
    () => ({
      title: `Compare the ${modeLabel(otherMode())} result`,
      text: otherMode() === 'leh'
        ? 'You are now looking at limited-entry draw opportunities for the same species and geography. Compare the draw-specific information with the open-season context you saw first.'
        : 'You are now looking at open-season rows for the same species and geography. Compare them with the limited-entry draw information you saw first.',
      next: 'Try a map layer →',
      wait: false,
      target: 'result'
    }),
    () => ({
      title: 'Use the map layer that answers your question',
      text: 'Try Satellite, Topo, or 3D. Streets is best for orientation; satellite and terrain are more useful when access, land cover, and relief matter.',
      next: 'Change a layer to continue',
      wait: true,
      target: 'layers'
    }),
    () => ({
      title: 'You are ready to explore',
      text: 'You have used both hunting systems, filtered by species, inspected a real WMU result, and changed the map view. Keep exploring freely from here.',
      next: 'Explore freely',
      wait: false,
      target: 'none',
      finish: true
    })
  ];

  function render() {
    if (!started) return;
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
    els.guided.classList.add('active');
    els.free.classList.remove('active');
    syncInspectorVisibility();
    render();
  }

  // Put the stable map core in free mode once, then let this lightweight controller own only the guide UI.
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
    if (spec.finish) {
      finishTour();
      return;
    }
    goTo(step + 1);
  }, true);

  els.back.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!started || step === 0) return;
    goTo(step - 1);
  }, true);

  function handleModeChoice(mode) {
    if (!started) return;
    if (step === 1) {
      firstMode = mode;
      window.setTimeout(() => goTo(2), 220);
      return;
    }
    if (step === 5 && mode === otherMode()) {
      pendingCompare = true;
    }
  }

  els.leh.addEventListener('click', () => handleModeChoice('leh'));
  els.gos.addEventListener('click', () => handleModeChoice('gos'));

  els.species.addEventListener('change', () => {
    if (started && step === 2 && els.species.value) {
      window.setTimeout(() => goTo(3), 180);
    }
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
    syncInspectorVisibility();
    const hasResult = !els.inspector.querySelector('.demo-inspector-empty') && !!els.inspector.textContent.trim();
    if (!started || !hasResult) return;
    if (step === 3) {
      window.setTimeout(() => goTo(4), 160);
    } else if (step === 5 && pendingCompare) {
      pendingCompare = false;
      window.setTimeout(() => goTo(6), 160);
    }
  });
  inspectorObserver.observe(els.inspector, { childList: true, subtree: true, characterData: true });
  syncInspectorVisibility();
})();
