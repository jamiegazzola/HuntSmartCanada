(() => {
  'use strict';

  const style = document.createElement('style');
  style.textContent = `
    .hs-map-demo:not(.demo-free-mode) .hs-map-demo-stage:has(.demo-inspector-empty){grid-template-columns:minmax(0,1fr)}
    .hs-map-demo:not(.demo-free-mode) .demo-inspector:has(.demo-inspector-empty){display:none}
    .demo-step-body{display:grid!important;grid-template-columns:1fr!important;gap:16px!important;align-items:start!important}
    .demo-step-actions{justify-content:flex-end!important;width:100%}
    .demo-step-actions .primary{border-color:var(--demo-gold)!important;background:rgba(231,185,74,.10)!important;color:var(--demo-gold-soft)!important}
    .demo-step-actions .primary:not(:disabled){background:var(--demo-gold)!important;color:#221803!important}
    .demo-step-actions .primary:disabled{border-color:rgba(231,185,74,.35)!important;background:rgba(231,185,74,.06)!important;color:#b5a775!important}
    .hs-map-demo:has(.demo-mode-group .demo-target) .hs-map-demo-top>*:not(.demo-mode-group){opacity:.36;filter:saturate(.55)}
    .hs-map-demo .demo-mode-group button.demo-target{opacity:1!important;filter:none!important}
  `;
  document.head.appendChild(style);

  fetch('/blog-map-demo-core.js?v=20261026c', { cache:'no-store' })
    .then(response => {
      if (!response.ok) throw new Error('Map guide core failed to load');
      return response.text();
    })
    .then(source => {
      function replaceRequired(pattern, replacement, label) {
        const next = source.replace(pattern, replacement);
        if (next === source) throw new Error(`Map guide patch failed: ${label}`);
        source = next;
      }

      replaceRequired(
        "    guided: true,\n    step: 0,",
        "    guided: true,\n    initialMode: '',\n    step: 0,",
        'guided state'
      );

      replaceRequired(
        /  const tutorials = \[[\s\S]*?\n  \];/,
`  const tutorials = [
    { title:'Meet the HuntSmart map', text:'This is a real interactive teaching map using HuntSmart data. Start the tour and you will compare Limited Entry Hunting with General Open Seasons on the same BC geography.', next:'Start tour →', target:null },
    { title:'Choose a hunting system', text:'Start with either Limited Entry Hunting or General Open Seasons. Pick the system you want to explore first — the tour will compare the other one later.', next:'Choose LEH or GOS to continue', target:'mode', wait:true },
    { title:'Choose Moose', text:'Select Moose from the species menu. HuntSmart will highlight WMUs with matching records for the hunting system you chose.', next:'Choose Moose to continue', target:'species', wait:true },
    { title:'Pick a highlighted WMU', text:'Click any highlighted Wildlife Management Unit. HuntSmart will open the matching records for that location.', next:'Click a WMU to continue', target:'map', wait:true },
    { title:'Read the result in context', text:'The result panel connects the selected WMU to the actual HuntSmart records behind that hunting system.', next:'Compare the other system →', target:null },
    { title:'Compare the other hunting system', text:'Switch to the other hunting system while keeping the same geography in view. This makes the difference between LEH and GOS obvious.', next:'Switch modes to continue', target:null, wait:true },
    { title:'Compare what changed', text:'The geography stayed the same, but the hunting information changed. That is the key distinction between the two systems.', next:'Try a map layer →', target:null },
    { title:'Use the map layer that answers your question', text:'Try Satellite, Topo, or 3D. Streets is best for orientation; satellite and terrain help when land cover, relief, or access context matters.', next:'Change a layer to continue', target:'layers', wait:true },
    { title:'You are ready to explore', text:'The guided tour is complete. Keep clicking WMUs, change species, move between LEH and GOS, or switch to Explore Freely.', next:'Explore freely', target:null, finish:true }
  ];`,
        'tutorial steps'
      );

      replaceRequired(
        "    state.mode = mode;\n",
        "    state.mode = mode;\n    if (state.guided && state.step===1) state.initialMode=mode;\n",
        'mode selection'
      );

      replaceRequired(
        "    if (state.guided && ((state.step===1 && mode==='leh') || (state.step===5 && mode==='gos'))) advanceAfterAction();",
        "    const compareMode = state.initialMode==='gos' ? 'leh' : 'gos';\n    if (state.guided && (state.step===1 || (state.step===5 && mode===compareMode))) advanceAfterAction();",
        'mode progression'
      );

      replaceRequired(
`    if (target==='mode-leh') els.modeLEH.classList.add('demo-target');
    if (target==='mode-gos') els.modeGOS.classList.add('demo-target');`,
`    if (target==='mode') { els.modeLEH.classList.add('demo-target'); els.modeGOS.classList.add('demo-target'); }
    if (target==='mode-leh') els.modeLEH.classList.add('demo-target');
    if (target==='mode-gos') els.modeGOS.classList.add('demo-target');`,
        'mode targeting'
      );

      replaceRequired(
        /  function renderTutorial\(\) \{[\s\S]*?\n  \}\n\n  function advanceAfterAction/,
`  function renderTutorial() {
    const base=tutorials[state.step] || tutorials[0];
    const step=Object.assign({},base);
    const initial=state.initialMode || state.mode || 'leh';
    const other=initial==='gos' ? 'leh' : 'gos';
    const label=mode=>mode==='gos' ? 'General Open Seasons' : 'Limited Entry Hunting';

    if (state.step===4) {
      step.title=\`Read the \${label(state.mode)} result\`;
      step.text=state.mode==='gos'
        ? 'The panel now shows General Open Seasons rows tied to the WMU you selected. Notice the season, class, method, and management-unit context.'
        : 'The panel now shows Limited Entry Hunting draw records tied to the WMU you selected. Notice the hunt code, odds, and any mapped LEH zone context.';
      step.next=\`Compare \${label(other)} →\`;
    }
    if (state.step===5) {
      step.title=\`Now compare \${label(other)}\`;
      step.text=\`Switch to \${label(other)}. HuntSmart will keep the same WMU in view and replace the current records with the other hunting system.\`;
      step.target=other==='gos' ? 'mode-gos' : 'mode-leh';
      step.next=\`Switch to \${other==='gos' ? 'GOS' : 'LEH'} to continue\`;
    }
    if (state.step===6) {
      step.title='Compare what changed';
      step.text=state.mode==='gos'
        ? 'You are now looking at General Open Seasons information for the same geography. Compare it with the LEH draw records you just saw.'
        : 'You are now looking at Limited Entry Hunting draw records for the same geography. Compare them with the GOS season rows you just saw.';
    }

    els.stepCount.textContent=\`Step \${state.step+1} of \${tutorials.length}\`;
    els.stepTitle.textContent=step.title;
    els.stepText.textContent=step.text;
    els.back.disabled=state.step===0;
    els.next.disabled=!!step.wait;
    els.next.textContent=step.next || 'Next →';
    applyTutorialTarget(step.target);
  }

  function advanceAfterAction`,
        'dynamic tutorial rendering'
      );

      replaceRequired(
        "    if (state.guided) renderTutorial();",
        "    if (state.guided) { if (state.step===0) state.initialMode=''; renderTutorial(); }",
        'guided reset'
      );

      const script = document.createElement('script');
      script.textContent = source;
      document.head.appendChild(script);
      script.remove();
    })
    .catch(error => {
      console.error('[Map guide loader]', error);
      const loading = document.getElementById('demoMapLoading');
      if (loading) loading.innerHTML = '<span>Map guide could not load. Refresh and try again.</span>';
    });
})();