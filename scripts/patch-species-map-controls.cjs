'use strict';

const CONTROLS_CSS = `
.map-tools{position:fixed;z-index:20;top:calc(env(safe-area-inset-top,0px) + 12px);right:12px;width:220px;padding:8px;border:1px solid rgba(255,255,255,.16);border-radius:13px;background:rgba(15,20,17,.94);box-shadow:0 8px 24px rgba(0,0,0,.24);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.dimension-toggle{display:grid;grid-template-columns:1fr 1fr;gap:3px;margin-bottom:8px;padding:3px;border-radius:9px;background:rgba(255,255,255,.06)}
.dimension-toggle button{min-height:34px;border:0;border-radius:7px;background:transparent;color:#c4d0c5;font:700 12px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer}
.dimension-toggle button[aria-pressed=true]{background:#527b56;color:#fff}
.dimension-toggle button:focus-visible,.opacity-slider:focus-visible{outline:2px solid #fff;outline-offset:2px}
.opacity-head{display:flex;justify-content:space-between;gap:10px;margin:0 2px 5px;font-size:11px;font-weight:700;color:#d7ded9}.opacity-head output{font-variant-numeric:tabular-nums;color:#fff}
.opacity-slider{display:block;width:100%;height:24px;margin:0;accent-color:#6f9b72;cursor:pointer}
.species-legend{position:fixed;z-index:19;right:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 34px);width:min(260px,calc(100vw - 24px));padding:10px 11px;border:1px solid rgba(255,255,255,.14);border-radius:12px;background:rgba(15,20,17,.92);box-shadow:0 8px 24px rgba(0,0,0,.22);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);pointer-events:none}
.legend-title{font-size:13px;font-weight:800;color:#fff;line-height:1.2}.legend-mode{margin:2px 0 7px;font-size:10px;font-weight:650;color:#aeb9b0}
.legend-row{display:grid;grid-template-columns:12px 68px 1fr;gap:7px;align-items:center;min-width:0;margin:4px 0;font-size:10px;line-height:1.25;color:#eef3ef}.legend-swatch{width:11px;height:11px;border:1px solid rgba(255,255,255,.28);border-radius:3px}.legend-name{font-weight:750}.legend-detail{color:#d2d9d3;min-width:0}
@media(max-width:720px){.map-tools{top:calc(env(safe-area-inset-top,0px) + 116px);left:9px;right:9px;width:auto;display:grid;grid-template-columns:116px 1fr;gap:8px;align-items:center;padding:6px 8px}.dimension-toggle{margin:0}.opacity-head{margin-bottom:2px}.species-legend{right:9px;bottom:calc(env(safe-area-inset-bottom,0px) + 30px);width:min(242px,calc(100vw - 18px))}.error{top:calc(env(safe-area-inset-top,0px) + 171px)!important}}
`;

function replaceOnce(app, before, after, label) {
  if (!app.includes(before)) throw new Error(`Species-map controls patch target missing: ${label}`);
  return app.replace(before, after);
}

function patchSpeciesMapControls(input) {
  let app = input;

  // Ignore the old saved era once so Historical becomes the new default.
  app = replaceOnce(
    app,
    "  const storedMode = localStorage.getItem('bc-species-map-era');",
    "  const storedMode = localStorage.getItem('bc-species-map-era-v3');",
    'era storage key',
  );
  app = replaceOnce(
    app,
    "  let viewMode = ['modern', 'historical'].includes(storedMode) ? storedMode : 'modern';",
    "  let viewMode = ['modern', 'historical'].includes(storedMode) ? storedMode : 'historical';",
    'Historical default',
  );
  app = replaceOnce(
    app,
    "    localStorage.setItem('bc-species-map-era', mode);",
    "    localStorage.setItem('bc-species-map-era-v3', mode);",
    'era persistence',
  );

  // Roosevelt is a single unified layer. Selecting it must not force other
  // species back to Modern when the user returns to them.
  const rooseveltEraMutation = `    if (isRoosevelt && viewMode !== 'modern') {
      viewMode = 'modern';
      setEraButtons();
    }`;
  if (app.includes(rooseveltEraMutation)) app = app.replace(rooseveltEraMutation, '');

  const controlsCode = `  let stoneDetail = null;
  const opacityStored = Number(localStorage.getItem('bc-species-map-opacity-v1'));
  let layerOpacity = Number.isFinite(opacityStored) && opacityStored >= 0 && opacityStored <= 1 ? opacityStored : 0.75;
  let dimensionMode = '2d';

  const HISTORICAL_LEGENDS = {
    elk: { label:'Historical density', rows:[['#3f9646','Low','1 elk / 10–250 km²'],['#f4d03f','Moderate','1 elk / 2.5–10 km²'],['#d73027','High','>1 elk / 2.5 km²']] },
    moose: { label:'Historical density', rows:[['#3f9646','Low','1 moose / 10–260 km²'],['#f4d03f','Moderate','1 moose / 1.3–10 km²'],['#d73027','High','>1 moose / 1.3 km²']] },
    mule_deer: { label:'Historical density', rows:[['#3f9646','Low','1 deer / 2–200 km²'],['#f4d03f','Moderate','1 deer / 0.2–2 km²'],['#d73027','High','>1 deer / 0.2 km²']] },
    white_tailed_deer: { label:'Historical density', rows:[['#3f9646','Low','1 deer / 5–518 km²'],['#f4d03f','Moderate','1 deer / 0.5–5 km²'],['#d73027','High','>1 deer / 0.5 km²']] },
    mountain_goat: { label:'Historical density', rows:[['#3f9646','Low','1 goat / 13–260 km²'],['#f4d03f','Moderate','1 goat / 3–13 km²'],['#d73027','High','>1 goat / 3 km²']] },
    wild_sheep: { label:'Historical density', rows:[['#3f9646','Low','1 sheep / 5–250 km²'],['#f4d03f','Moderate','1 sheep / 1.3–5 km²'],['#d73027','High','>1 sheep / 1.3 km²']] },
    caribou: { label:'Historical density', rows:[['#3f9646','Low','1 caribou / 25–250 km²'],['#f4d03f','Moderate','1 caribou / 3.4–25 km²'],['#d73027','High','>1 caribou / 3.4 km²']] },
    roosevelt_elk: { label:'Roosevelt density', rows:[['#7fb77a','Rare / occasional','<1 elk / 250 km²'],['#3f9646','Low','1 elk / 10–250 km²'],['#f4d03f','Moderate','1 elk / 2.5–10 km²'],['#d73027','High','>1 elk / 2.5 km²']] },
  };
  const MODERN_RELATIVE_LEGEND = { label:'Modern relative concentration', rows:[['#3f9646','Lower','Relative concentration'],['#f4d03f','Moderate','Relative concentration'],['#f48b27','High','Relative concentration'],['#d73027','Very high','Relative concentration']] };

  function legendFor(item) {
    if (item.key === 'roosevelt_elk') return HISTORICAL_LEGENDS.roosevelt_elk;
    return viewMode === 'historical' ? (HISTORICAL_LEGENDS[item.key] || MODERN_RELATIVE_LEGEND) : MODERN_RELATIVE_LEGEND;
  }

  function updateLegend(item) {
    const legend = document.getElementById('species-legend');
    if (!legend || !item) return;
    const data = legendFor(item);
    const rows = data.rows.map(([color, name, detail]) => '<div class="legend-row"><span class="legend-swatch" style="background:' + color + '"></span><span class="legend-name">' + name + '</span><span class="legend-detail">' + detail + '</span></div>').join('');
    legend.innerHTML = '<div class="legend-title">' + item.label + '</div><div class="legend-mode">' + data.label + '</div>' + rows;
  }

  function opacityBaseForFeature(feature, mainland = false) {
    const densityClass = feature?.getProperty?.('density_class') || feature?.getProperty?.('historical_class');
    if (mainland) return ({ R:0.12, L:0.48, M:0.58, H:0.62 })[densityClass] || 0.62;
    return ({ R:0.18, L:0.42, M:0.52, H:0.58 })[densityClass] || 0.62;
  }

  function applyDataOpacity(data, mainland = false) {
    if (!data?.forEach || !data?.overrideStyle) return;
    const factor = layerOpacity / 0.75;
    data.forEach(feature => {
      const base = opacityBaseForFeature(feature, mainland);
      data.overrideStyle(feature, {
        fillOpacity: Math.max(0, Math.min(1, base * factor)),
        strokeOpacity: Math.max(0, Math.min(1, (base + 0.22) * factor)),
      });
    });
  }

  function applyLayerOpacity() {
    activeOverlay?.setOpacity?.(layerOpacity);
    winterOverlay?.setOpacity?.(layerOpacity);
    seasonalOverlays.forEach(overlay => overlay?.setOpacity?.(layerOpacity));
    applyDataOpacity(activeData, false);
    applyDataOpacity(islandData, false);
    applyDataOpacity(rooseveltRangeData, false);
    applyDataOpacity(rooseveltMainlandData, true);
  }

  function applyDimensionMode() {
    const twoD = document.getElementById('map-2d');
    const threeD = document.getElementById('map-3d');
    if (twoD) twoD.setAttribute('aria-pressed', dimensionMode === '2d' ? 'true' : 'false');
    if (threeD) threeD.setAttribute('aria-pressed', dimensionMode === '3d' ? 'true' : 'false');
    if (!map) return;
    map.setHeading?.(0);
    map.setTilt?.(dimensionMode === '3d' ? 45 : 0);
  }

  function installSpeciesMapControls() {
    if (document.getElementById('species-legend')) return;
    const style = document.createElement('style');
    style.textContent = ${JSON.stringify(CONTROLS_CSS)};
    document.head.appendChild(style);

    const tools = document.createElement('div');
    tools.className = 'map-tools';
    tools.innerHTML = '<div class="dimension-toggle" role="group" aria-label="Map dimension"><button id="map-2d" type="button" aria-pressed="true">2D</button><button id="map-3d" type="button" aria-pressed="false" title="3D tilt becomes stronger as you zoom in">3D</button></div><div class="opacity-control"><div class="opacity-head"><label for="layer-opacity">Opacity</label><output id="opacity-value">75%</output></div><input id="layer-opacity" class="opacity-slider" type="range" min="0" max="100" step="5" value="75" aria-label="Species layer opacity"></div>';
    document.body.appendChild(tools);

    const legend = document.createElement('div');
    legend.id = 'species-legend';
    legend.className = 'species-legend';
    legend.setAttribute('aria-live', 'polite');
    document.body.appendChild(legend);

    const opacity = document.getElementById('layer-opacity');
    const output = document.getElementById('opacity-value');
    opacity.value = String(Math.round(layerOpacity * 100));
    output.value = opacity.value + '%';
    output.textContent = output.value;
    opacity.addEventListener('input', () => {
      const value = Math.max(0, Math.min(100, Number(opacity.value) || 0));
      layerOpacity = value / 100;
      localStorage.setItem('bc-species-map-opacity-v1', String(layerOpacity));
      output.value = value + '%';
      output.textContent = output.value;
      applyLayerOpacity();
    });
    document.getElementById('map-2d').addEventListener('click', () => { dimensionMode = '2d'; applyDimensionMode(); });
    document.getElementById('map-3d').addEventListener('click', () => { dimensionMode = '3d'; applyDimensionMode(); });
  }

`;

  app = replaceOnce(app, '  let stoneDetail = null;\n', controlsCode, 'control state and legend data');
  app = replaceOnce(
    app,
    `    const item = speciesByKey[select.value];
    if (!item || !map) return;`,
    `    const item = speciesByKey[select.value];
    if (!item || !map) return;
    updateLegend(item);`,
    'selected-species legend refresh',
  );
  app = replaceOnce(app, '        setLoading(false);', '        applyLayerOpacity();\n        setLoading(false);', 'opacity after render');
  app = replaceOnce(
    app,
    "  select.addEventListener('change', () => { showEvidence = false; return renderSelected(); });\n\n  window.initSpeciesMap = () => {",
    "  select.addEventListener('change', () => { showEvidence = false; return renderSelected(); });\n\n  installSpeciesMapControls();\n\n  window.initSpeciesMap = () => {",
    'control installation',
  );
  app = replaceOnce(
    app,
    '        mapTypeId: google.maps.MapTypeId.HYBRID,',
    "        mapTypeId: google.maps.MapTypeId.HYBRID,\n        renderingType: google.maps.RenderingType ? google.maps.RenderingType.VECTOR : undefined,\n        tilt: 0,\n        tiltInteractionEnabled: true,\n        headingInteractionEnabled: true,",
    'vector map rendering',
  );
  app = replaceOnce(app, '      if (!savedView) {', '      applyDimensionMode();\n\n      if (!savedView) {', '2D default application');
  app = replaceOnce(
    app,
    "      map.addListener('idle', () => {",
    "      map.addListener('zoom_changed', () => { if (dimensionMode === '3d') requestAnimationFrame(() => map.setTilt?.(45)); });\n\n      map.addListener('idle', () => {",
    '3D zoom maintenance',
  );

  const kmzOpacityBefore = 'activeOverlay = new google.maps.GroundOverlay(kmzUrl, BOUNDS, { map, opacity: 1, clickable: false });';
  if (app.includes(kmzOpacityBefore)) {
    app = app.replace(kmzOpacityBefore, 'activeOverlay = new google.maps.GroundOverlay(kmzUrl, BOUNDS, { map, opacity: layerOpacity, clickable: false });');
  }

  const buildPattern = /const APP_BUILD = 'species-map-[^']+';/;
  if (!buildPattern.test(app)) throw new Error('Species-map build marker missing during controls patch');
  app = app.replace(buildPattern, "const APP_BUILD = 'species-map-controls-v1';");
  return app;
}

module.exports = { patchSpeciesMapControls };
