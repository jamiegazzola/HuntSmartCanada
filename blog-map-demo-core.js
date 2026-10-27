(() => {
  'use strict';

  const root = document.getElementById('hsMapDemo');
  const mapEl = document.getElementById('hsEmbeddedMap');
  if (!root || !mapEl || typeof mapboxgl === 'undefined' || typeof BC_WMU_GEOJSON === 'undefined') return;

  const styles = {
    streets: 'mapbox://styles/mapbox/dark-v11',
    satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
    topo: 'mapbox://styles/mapbox/outdoors-v12'
  };

  const regionColors = {
    '1':'#4a8f5a','2':'#6aab76','3':'#9bc46a','4':'#c49a35',
    '5':'#c06828','6':'#7a8fd4','7':'#a064c8','8':'#5ab8c4','9':'#c45a8a'
  };

  const state = {
    mode: '',
    species: '',
    selectedWMU: '',
    selectedFeatureId: null,
    basemap: 'streets',
    terrain: false,
    guided: true,
    step: 0,
    draws: null,
    drawIndex: null,
    drawWMUs: null,
    zones: null,
    zonesLoading: null,
    gos: null,
    gosLoading: null,
    gosIndex: null,
    gosWMUs: null,
    mapReady: false,
    hoveredId: null,
    listenersBound: false,
    zoneClickBound: false
  };

  const els = {
    loading: document.getElementById('demoMapLoading'),
    status: document.getElementById('demoMapStatus'),
    inspector: document.getElementById('demoInspector'),
    species: document.getElementById('demoSpecies'),
    modeLEH: document.getElementById('demoModeLEH'),
    modeGOS: document.getElementById('demoModeGOS'),
    guided: document.getElementById('demoGuided'),
    free: document.getElementById('demoFree'),
    back: document.getElementById('demoBack'),
    next: document.getElementById('demoNext'),
    stepCount: document.getElementById('demoStepCount'),
    stepTitle: document.getElementById('demoStepTitle'),
    stepText: document.getElementById('demoStepText'),
    mapWrap: document.getElementById('demoMapWrap'),
    btn3D: document.getElementById('demo3D')
  };

  const tutorials = [
    { title:'Meet the HuntSmart map', text:'This is a real interactive teaching map using HuntSmart data. Start the tour and you will compare LEH with General Open Seasons on the same BC geography.', next:'Start tour →', target:null },
    { title:'Start with Limited Entry Hunting', text:'Choose LEH. HuntSmart will use draw records to highlight WMUs that have opportunities for the species you select.', next:'Choose LEH to continue', target:'mode-leh', wait:true },
    { title:'Choose Moose', text:'Select Moose from the species menu. WMUs with matching LEH draw records will light up.', next:'Choose Moose to continue', target:'species', wait:true },
    { title:'Pick a highlighted WMU', text:'Click any highlighted Wildlife Management Unit. The panel will show matching draw records immediately and then add mapped LEH zones where available.', next:'Click a WMU to continue', target:'map', wait:true },
    { title:'Read the LEH result in context', text:'The selected WMU is only the broad geography. The cards show the actual draw records; gold outlines show mapped LEH zones when HuntSmart has zone geometry for that species and unit.', next:'Compare with GOS →', target:null },
    { title:'Switch to General Open Seasons', text:'Now choose General Open Seasons. The same selected WMU stays in view, but the panel changes from LEH draw records to GOS season rows.', next:'Switch to GOS to continue', target:'mode-gos', wait:true },
    { title:'Read the open-season rows', text:'GOS can include class, method, dates and special conditions. The WMU highlight is a discovery aid — always verify the current synopsis and any subzone or closure details.', next:'Try a map layer →', target:null },
    { title:'Use the map layer that answers your question', text:'Try Satellite, Topo, or 3D. Streets is best for orientation; satellite and terrain are more useful when land cover, relief, or access context matters.', next:'Change a layer to continue', target:'layers', wait:true },
    { title:'You are ready to explore', text:'The guided tour is complete. Keep clicking WMUs, change species, move between LEH and GOS, or switch to Explore Freely and use the embedded demo without prompts.', next:'Explore freely', target:null, finish:true }
  ];

  mapboxgl.accessToken = (typeof MAPBOX_TOKEN !== 'undefined') ? MAPBOX_TOKEN : '';
  if (!mapboxgl.accessToken) {
    els.loading.innerHTML = '<span>Map configuration is unavailable.</span>';
    return;
  }

  const wmuData = {
    type: 'FeatureCollection',
    features: BC_WMU_GEOJSON.features.map((feature, index) => ({
      type: 'Feature',
      id: index,
      properties: Object.assign({}, feature.properties, { __demo_id: index }),
      geometry: feature.geometry
    }))
  };

  const featureByWMU = new Map();
  wmuData.features.forEach(feature => {
    const id = normMU(feature.properties && feature.properties.wmu_id);
    if (id) featureByWMU.set(id, feature);
  });

  const map = new mapboxgl.Map({
    container: 'hsEmbeddedMap',
    style: styles.streets,
    center: [-126.3, 54.4],
    zoom: 4.15,
    minZoom: 3.4,
    maxZoom: 17,
    projection: 'mercator',
    attributionControl: true
  });

  function normMU(value) {
    const stripped = String(value || '').replace(/[\*\+]+$/, '').trim();
    return stripped.replace(/^(\d+)-0*(\d+)$/, '$1-$2');
  }

  function normSpecies(value) {
    return String(value || '').trim().toUpperCase().replace(/\s+/g, ' ');
  }

  function zoneSpecies(chosen) {
    const s = normSpecies(chosen);
    if (s.includes('SHEEP') || s.includes('BIGHORN') || s.includes('THINHORN')) return 'MOUNTAIN SHEEP';
    if (s.includes('ELK')) return 'ELK';
    return s;
  }

  function geometryBBox(geometry) {
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    (function walk(value) {
      if (!Array.isArray(value)) return;
      if (typeof value[0] === 'number' && typeof value[1] === 'number') {
        minX=Math.min(minX,value[0]); minY=Math.min(minY,value[1]);
        maxX=Math.max(maxX,value[0]); maxY=Math.max(maxY,value[1]);
        return;
      }
      value.forEach(walk);
    })(geometry && geometry.coordinates);
    return Number.isFinite(minX) ? [minX,minY,maxX,maxY] : null;
  }

  function fitFeature(feature) {
    const box = geometryBBox(feature && feature.geometry);
    if (!box) return;
    map.fitBounds([[box[0],box[1]],[box[2],box[3]]], { padding:75, duration:450, maxZoom:9.7 });
  }

  function getWMUFeature(id) {
    return featureByWMU.get(normMU(id)) || null;
  }

  function ensureIndexBucket(index, species, mu) {
    if (!index.has(species)) index.set(species, new Map());
    const byMU = index.get(species);
    if (!byMU.has(mu)) byMU.set(mu, []);
    return byMU.get(mu);
  }

  function buildDrawIndex(rows) {
    const index = new Map();
    const wmUs = new Map();
    rows.forEach(row => {
      const species = normSpecies(row && row.Species);
      const mu = normMU(row && row.MU);
      if (!species || !mu) return;
      ensureIndexBucket(index, species, mu).push(row);
      if (!wmUs.has(species)) wmUs.set(species, new Set());
      wmUs.get(species).add(mu);
    });
    state.drawIndex = index;
    state.drawWMUs = wmUs;
  }

  function expandWMUs(text) {
    const out = new Set();
    let source = String(text || '');
    source = source.replace(/(\d+)-(\d+)\s+to\s+(?:(\d+)-)?(\d+)/gi, (match, r1, n1, r2, n2) => {
      const region = Number(r2 || r1);
      const start = Number(n1), end = Number(n2);
      if (region === Number(r1) && Number.isFinite(start) && Number.isFinite(end) && end >= start && end - start < 100) {
        for (let n=start; n<=end; n++) out.add(`${region}-${n}`);
      }
      return ' ';
    });
    const singles = source.match(/\b\d+-\d+\b/g) || [];
    singles.forEach(value => out.add(normMU(value)));
    return out;
  }

  function buildGOSIndex(rows) {
    const index = new Map();
    const wmUs = new Map();
    rows.forEach(row => {
      const species = normSpecies(row && row.species);
      if (!species) return;
      const units = expandWMUs(row && row.management_units);
      if (!wmUs.has(species)) wmUs.set(species, new Set());
      units.forEach(mu => {
        if (!mu) return;
        ensureIndexBucket(index, species, mu).push(row);
        wmUs.get(species).add(mu);
      });
    });
    state.gosIndex = index;
    state.gosWMUs = wmUs;
  }

  function indexedRows(index, species, wmu) {
    const byMU = index && index.get(normSpecies(species));
    return (byMU && byMU.get(normMU(wmu))) || [];
  }

  function drawRows(wmu, species) {
    return indexedRows(state.drawIndex, species, wmu);
  }

  function gosRows(wmu, species) {
    return indexedRows(state.gosIndex, species, wmu);
  }

  function matchingWMUs() {
    if (!state.mode || !state.species) return null;
    const species = normSpecies(state.species);
    return state.mode === 'leh'
      ? ((state.drawWMUs && state.drawWMUs.get(species)) || new Set())
      : ((state.gosWMUs && state.gosWMUs.get(species)) || new Set());
  }

  async function ensureDraws() {
    if (state.draws && state.drawIndex) return state.draws;
    const response = await fetch('./draws.json', { cache:'force-cache' });
    if (!response.ok) throw new Error('Draw data failed to load');
    state.draws = await response.json();
    buildDrawIndex(state.draws);
    return state.draws;
  }

  async function ensureZones() {
    if (state.zones) return state.zones;
    if (state.zonesLoading) return state.zonesLoading;
    state.zonesLoading = (async () => {
      const response = await fetch('./leh_zones.json', { cache:'force-cache' });
      if (!response.ok) throw new Error('LEH zones failed to load');
      state.zones = await response.json();
      return state.zones;
    })();
    return state.zonesLoading;
  }

  function injectScript(src, id) {
    return new Promise((resolve, reject) => {
      const existing = document.getElementById(id);
      if (existing) {
        if (existing.dataset.loaded === '1' || typeof BC_OS_DATA_RAW !== 'undefined') resolve();
        else {
          existing.addEventListener('load', resolve, { once:true });
          existing.addEventListener('error', reject, { once:true });
        }
        return;
      }
      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.onload = () => { script.dataset.loaded='1'; resolve(); };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  async function ensureGOS() {
    if (state.gos && state.gosIndex) return state.gos;
    if (state.gosLoading) return state.gosLoading;
    state.gosLoading = (async () => {
      if (typeof BC_OS_DATA_RAW === 'undefined') await injectScript('./bc-open-seasons.js', 'hs-demo-gos-data');
      if (typeof BC_OS_DATA_RAW === 'undefined') throw new Error('GOS data failed to load');
      state.gos = BC_OS_DATA_RAW;
      buildGOSIndex(state.gos);
      return state.gos;
    })();
    return state.gosLoading;
  }

  function regionColorExpr() {
    const parts = [];
    Object.entries(regionColors).forEach(([key,value]) => parts.push(key,value));
    return ['match',['slice',['get','wmu_id'],0,['index-of','-',['get','wmu_id']]],...parts,'#505650'];
  }

  function installWMULayers() {
    if (map.getSource('demo-wmu')) return;
    map.addSource('demo-wmu', { type:'geojson', data:wmuData });
    map.addLayer({
      id:'demo-wmu-fill', type:'fill', source:'demo-wmu',
      paint:{
        'fill-color':['case',
          ['boolean',['feature-state','selected'],false], '#4ade80',
          ['boolean',['feature-state','matches'],false], regionColorExpr(),
          '#29302b'
        ],
        'fill-opacity':['case',
          ['boolean',['feature-state','selected'],false], 0.72,
          ['boolean',['feature-state','hovered'],false], 0.55,
          ['boolean',['feature-state','matches'],false], 0.42,
          0.08
        ]
      }
    });
    map.addLayer({
      id:'demo-wmu-line', type:'line', source:'demo-wmu',
      paint:{
        'line-color':['case',
          ['boolean',['feature-state','selected'],false], '#ffffff',
          ['boolean',['feature-state','matches'],false], 'rgba(255,255,255,.32)',
          '#202620'
        ],
        'line-width':['case',['boolean',['feature-state','selected'],false],2.7,0.8],
        'line-opacity':0.9
      }
    });

    if (state.listenersBound) return;
    state.listenersBound = true;

    map.on('mousemove','demo-wmu-fill', event => {
      if (!event.features || !event.features.length) return;
      const feature = event.features[0];
      if (state.hoveredId !== null && state.hoveredId !== feature.id && map.getSource('demo-wmu')) {
        map.setFeatureState({source:'demo-wmu',id:state.hoveredId},{hovered:false});
      }
      state.hoveredId = feature.id;
      map.setFeatureState({source:'demo-wmu',id:feature.id},{hovered:true});
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave','demo-wmu-fill', () => {
      if (state.hoveredId !== null && map.getSource('demo-wmu')) {
        map.setFeatureState({source:'demo-wmu',id:state.hoveredId},{hovered:false});
      }
      state.hoveredId = null;
      map.getCanvas().style.cursor = '';
    });

    map.on('click','demo-wmu-fill', event => {
      if (!event.features || !event.features.length || !state.mode || !state.species) return;
      const feature = event.features[0];
      const id = normMU(feature.properties && feature.properties.wmu_id);
      const matches = matchingWMUs();
      if (!id || !matches || !matches.has(id)) return;
      selectWMU(id, feature.id, feature);
      if (state.guided && state.step === 3) advanceAfterAction();
    });
  }

  async function refreshWMUStates() {
    if (!state.mapReady || !map.getSource('demo-wmu')) return;
    if (state.mode === 'leh') await ensureDraws();
    if (state.mode === 'gos') await ensureGOS();

    const matches = matchingWMUs();
    for (const feature of wmuData.features) {
      const id = normMU(feature.properties && feature.properties.wmu_id);
      map.setFeatureState({source:'demo-wmu',id:feature.id},{
        matches:!!(matches && matches.has(id)),
        selected:id === state.selectedWMU,
        hovered:false
      });
    }
    updateStatus();
  }

  function clearLEHZones() {
    ['demo-leh-line','demo-leh-fill'].forEach(id => { if (map.getLayer(id)) map.removeLayer(id); });
    if (map.getSource('demo-leh')) map.removeSource('demo-leh');
  }

  function zoneIdsForMU(index, mu) {
    if (!index) return [];
    const direct = index[mu] || index[normMU(mu)] || index[String(mu)] || [];
    return Array.isArray(direct) ? direct : [];
  }

  async function showLEHZones() {
    clearLEHZones();
    if (state.mode !== 'leh' || !state.selectedWMU || !state.species) return 0;

    try {
      const selectedWMU = state.selectedWMU;
      const selectedSpecies = state.species;
      const data = await ensureZones();
      if (state.mode !== 'leh' || state.selectedWMU !== selectedWMU || state.species !== selectedSpecies) return 0;

      const zones = data.zones || data;
      const muIndex = data.mu_index || {};
      const ids = zoneIdsForMU(muIndex, selectedWMU);
      const wanted = zoneSpecies(selectedSpecies);
      const features = ids
        .filter(id => zones[id] && normSpecies(zones[id].zt) === wanted)
        .map(id => {
          const zone = zones[id];
          return {
            type:'Feature', id:String(id),
            properties:{ id:String(id), label:String(zone.lb || `LEH zone ${id}`), mu:String(zone.mu || selectedWMU), zt:String(zone.zt || '') },
            geometry:zone.g
          };
        });

      if (!features.length) return 0;
      map.addSource('demo-leh',{type:'geojson',data:{type:'FeatureCollection',features}});
      map.addLayer({id:'demo-leh-fill',type:'fill',source:'demo-leh',paint:{'fill-color':'#f0b429','fill-opacity':0.08}});
      map.addLayer({id:'demo-leh-line',type:'line',source:'demo-leh',paint:{'line-color':'#f0b429','line-width':3,'line-opacity':1}});

      if (!state.zoneClickBound) {
        state.zoneClickBound = true;
        map.on('click','demo-leh-fill', event => {
          const feature = event.features && event.features[0];
          if (!feature) return;
          new mapboxgl.Popup({closeButton:false,offset:8})
            .setLngLat(event.lngLat)
            .setHTML(`<strong>${escapeHtml(feature.properties.label || 'LEH zone')}</strong><br><span style="font-size:11px;color:#9aa49e">${escapeHtml(feature.properties.zt || '')}</span>`)
            .addTo(map);
        });
      }
      return features.length;
    } catch (error) {
      console.warn('[Map guide] LEH zones:',error);
      return 0;
    }
  }

  function setTerrain(on) {
    state.terrain = !!on;
    els.btn3D.classList.toggle('active',state.terrain);
    if (!state.mapReady) return;
    if (state.terrain) {
      if (!map.getSource('demo-dem')) map.addSource('demo-dem',{type:'raster-dem',url:'mapbox://mapbox.mapbox-terrain-dem-v1',tileSize:512,maxzoom:14});
      map.setTerrain({source:'demo-dem',exaggeration:1.45});
      map.easeTo({pitch:55,bearing:-10,duration:500});
    } else {
      map.setTerrain(null);
      map.easeTo({pitch:0,bearing:0,duration:400});
    }
  }

  function reinstallAfterStyle() {
    installWMULayers();
    state.mapReady = true;
    refreshWMUStates().then(() => {
      if (state.mode === 'leh' && state.selectedWMU) showLEHZones();
      if (state.terrain) setTerrain(true);
    });
  }

  function setBasemap(type) {
    if (!styles[type] || type === state.basemap) return;
    state.basemap = type;
    document.querySelectorAll('[data-demo-basemap]').forEach(button => button.classList.toggle('active',button.dataset.demoBasemap===type));
    clearLEHZones();
    state.mapReady = false;
    map.setStyle(styles[type]);
    map.once('style.load',reinstallAfterStyle);
    if (state.guided && state.step === 7) advanceAfterAction();
  }

  async function setMode(mode) {
    if (!['leh','gos'].includes(mode)) return;
    state.mode = mode;
    els.modeLEH.classList.toggle('active',mode==='leh');
    els.modeGOS.classList.toggle('active',mode==='gos');
    clearLEHZones();
    setBusy(true,mode==='leh'?'Loading LEH draw data…':'Loading General Open Seasons…');

    try {
      if (mode === 'leh') {
        await ensureDraws();
        ensureZones().catch(() => {});
      } else {
        await ensureGOS();
      }
      await refreshWMUStates();
      if (state.selectedWMU) selectWMU(state.selectedWMU,state.selectedFeatureId,getWMUFeature(state.selectedWMU),false);
    } catch (error) {
      showDataError(error);
    } finally {
      setBusy(false);
    }

    updateStatus();
    if (state.guided && ((state.step===1 && mode==='leh') || (state.step===5 && mode==='gos'))) advanceAfterAction();
  }

  async function setSpecies(species) {
    if (state.selectedFeatureId !== null && state.mapReady && map.getSource('demo-wmu')) {
      map.setFeatureState({source:'demo-wmu',id:state.selectedFeatureId},{selected:false});
    }
    state.species = String(species || '');
    state.selectedWMU = '';
    state.selectedFeatureId = null;
    clearLEHZones();
    renderEmptyInspector();
    setBusy(true,'Filtering map…');

    try { await refreshWMUStates(); }
    catch (error) { showDataError(error); }
    finally { setBusy(false); }

    updateStatus();
    if (state.guided && state.step===2 && normSpecies(species)==='MOOSE') advanceAfterAction();
  }

  function selectWMU(id, featureId, feature, fit=true) {
    const previousId = state.selectedFeatureId;
    state.selectedWMU = normMU(id);
    state.selectedFeatureId = featureId != null ? featureId : (feature && feature.id);

    if (state.mapReady && map.getSource('demo-wmu')) {
      if (previousId !== null && previousId !== state.selectedFeatureId) {
        map.setFeatureState({source:'demo-wmu',id:previousId},{selected:false});
      }
      if (state.selectedFeatureId !== null) {
        map.setFeatureState({source:'demo-wmu',id:state.selectedFeatureId},{selected:true});
      }
    }

    if (fit && feature) fitFeature(feature);

    if (state.mode === 'leh') {
      const rows = drawRows(state.selectedWMU,state.species);
      const selectionKey = `${state.mode}|${state.species}|${state.selectedWMU}`;
      renderLEHInspector(rows,null,true);
      showLEHZones().then(zoneCount => {
        if (`${state.mode}|${state.species}|${state.selectedWMU}` === selectionKey) {
          renderLEHInspector(rows,zoneCount,false);
        }
      });
    } else {
      clearLEHZones();
      renderGOSInspector(gosRows(state.selectedWMU,state.species));
    }

    updateStatus();
  }

  function oddsValue(row) {
    const number = parseFloat(row && row['%']);
    if (!Number.isFinite(number)) return '—';
    if (number > 0 && number < 0.1) return `${number.toFixed(2)}%`;
    return `${number < 10 ? number.toFixed(1) : Math.round(number)}%`;
  }

  function renderLEHInspector(rows, zoneCount, zoneLoading=false) {
    const unique = rows.slice().sort((a,b)=>(parseFloat(b['%'])||0)-(parseFloat(a['%'])||0)).slice(0,5);
    const zoneNote = zoneLoading
      ? 'Draw results are ready. Loading mapped LEH zone overlay in the background…'
      : zoneCount
        ? `${zoneCount} mapped LEH zone${zoneCount===1?'':'s'} shown in gold. Click a gold zone on the map to inspect it.`
        : 'No separate LEH zone geometry is mapped for this species/WMU combination. The draw cards are still real HuntSmart records.';

    els.inspector.innerHTML = `
      <div class="demo-inspector-head">
        <div class="eyebrow">Limited Entry Hunting</div>
        <div class="demo-inspector-title"><h3>WMU ${escapeHtml(state.selectedWMU)}</h3><span class="demo-inspector-badge">${unique.length}${rows.length>unique.length?'+':''} draw${rows.length===1?'':'s'}</span></div>
        <p>${escapeHtml(state.species)} opportunities from HuntSmart's draw dataset.</p>
      </div>
      <div class="demo-result-list">
        ${unique.length ? unique.map(row=>`
          <div class="demo-result-card">
            <div class="demo-result-card-top"><strong>${escapeHtml(row.Species || state.species)}</strong><span class="result-value">${escapeHtml(oddsValue(row))}</span></div>
            <div class="demo-result-meta">Hunt code ${escapeHtml(row.Code || '—')}${row.Zone ? ` · Zone ${escapeHtml(row.Zone)}` : ''}</div>
            <div class="demo-result-sub">${escapeHtml(row.Class || 'LEH opportunity')}${row.Season && row.Season !== '1' ? ` · ${escapeHtml(row.Season)}` : ''}</div>
          </div>`).join('') : '<div class="demo-result-card"><strong>No matching draw rows found.</strong></div>'}
      </div>
      <div class="demo-zone-note">${escapeHtml(zoneNote)}</div>`;
  }

  function renderGOSInspector(rows) {
    const seen = new Set();
    const unique = rows.filter(row => {
      const key=[row.class,row.weapon_type,row.season_text,row.management_units].join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0,6);

    els.inspector.innerHTML = `
      <div class="demo-inspector-head">
        <div class="eyebrow">General Open Seasons</div>
        <div class="demo-inspector-title"><h3>WMU ${escapeHtml(state.selectedWMU)}</h3><span class="demo-inspector-badge">${rows.length} season row${rows.length===1?'':'s'}</span></div>
        <p>${escapeHtml(state.species)} rows associated with this WMU in HuntSmart's GOS dataset.</p>
      </div>
      <div class="demo-result-list">
        ${unique.length ? unique.map(row=>`
          <div class="demo-result-card">
            <div class="demo-result-card-top"><strong>${escapeHtml(row.class || row.species || state.species)}</strong><span class="result-value" style="font-size:13px">${escapeHtml(row.weapon_type || 'Open season')}</span></div>
            <div class="demo-result-meta">${escapeHtml(row.region_name || `Region ${row.region || ''}`)} · ${escapeHtml(row.management_units || '')}</div>
            <div class="demo-result-sub">${escapeHtml(row.season_text || 'See current synopsis')}</div>
          </div>`).join('') : '<div class="demo-result-card"><strong>No matching GOS rows found.</strong></div>'}
      </div>
      <div class="demo-zone-note">WMU shading is a discovery aid. GOS rows may include subzones, method restrictions, class restrictions, closures, or special notes that require the official synopsis.</div>`;
  }

  function renderEmptyInspector() {
    const text = !state.mode
      ? 'Choose LEH or General Open Seasons, then pick a species. Matching WMUs will light up on the map.'
      : !state.species
        ? `Choose a species to see ${state.mode==='leh'?'LEH draw':'GOS'} coverage across BC.`
        : 'Click a highlighted WMU to inspect the matching HuntSmart records.';
    els.inspector.innerHTML = `<div class="demo-inspector-empty"><div class="demo-inspector-icon">⌖</div><h3>${state.mode ? (state.mode==='leh'?'LEH map ready':'GOS map ready') : 'Select a map mode'}</h3><p>${text}</p></div>`;
  }

  function setBusy(busy, text) {
    if (busy) {
      els.loading.style.display='flex';
      const label=els.loading.querySelector('span:last-child');
      if (label && text) label.textContent=text;
    } else {
      els.loading.style.display='none';
    }
  }

  function showDataError(error) {
    console.error('[Map guide]',error);
    els.inspector.innerHTML='<div class="demo-inspector-empty"><div class="demo-inspector-icon">!</div><h3>Data could not load</h3><p>Refresh the guide and try again. The rest of the article remains available.</p></div>';
  }

  function updateStatus() {
    const mode = state.mode==='leh'?'LEH':state.mode==='gos'?'GOS':'Choose mode';
    const species = state.species || 'Choose species';
    const wmu = state.selectedWMU ? ` · WMU ${state.selectedWMU}` : '';
    els.status.textContent = `${mode} · ${species}${wmu}`;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  }

  function clearTutorialTargets() {
    root.querySelectorAll('.demo-target').forEach(element=>element.classList.remove('demo-target'));
  }

  function applyTutorialTarget(target) {
    clearTutorialTargets();
    if (!state.guided) return;
    if (target==='mode-leh') els.modeLEH.classList.add('demo-target');
    if (target==='mode-gos') els.modeGOS.classList.add('demo-target');
    if (target==='species') els.species.classList.add('demo-target');
    if (target==='map') els.mapWrap.classList.add('demo-target');
    if (target==='layers') document.querySelector('.demo-basemap-group').classList.add('demo-target');
  }

  function renderTutorial() {
    const step=tutorials[state.step] || tutorials[0];
    els.stepCount.textContent=`Step ${state.step+1} of ${tutorials.length}`;
    els.stepTitle.textContent=step.title;
    els.stepText.textContent=step.text;
    els.back.disabled=state.step===0;
    els.next.disabled=!!step.wait;
    els.next.textContent=step.next || 'Next →';
    applyTutorialTarget(step.target);
  }

  function advanceAfterAction() {
    window.setTimeout(() => {
      if (!state.guided) return;
      state.step=Math.min(tutorials.length-1,state.step+1);
      renderTutorial();
    },180);
  }

  function nextStep() {
    const step=tutorials[state.step];
    if (step && step.finish) {
      setLearningMode(false);
      return;
    }
    if (step && step.wait) return;
    state.step=Math.min(tutorials.length-1,state.step+1);
    renderTutorial();
  }

  function backStep() {
    state.step=Math.max(0,state.step-1);
    renderTutorial();
  }

  function setLearningMode(guided) {
    state.guided=!!guided;
    root.classList.toggle('demo-free-mode',!state.guided);
    els.guided.classList.toggle('active',state.guided);
    els.free.classList.toggle('active',!state.guided);
    clearTutorialTargets();
    if (state.guided) renderTutorial();
  }

  els.modeLEH.addEventListener('click',()=>setMode('leh'));
  els.modeGOS.addEventListener('click',()=>setMode('gos'));
  els.species.addEventListener('change',event=>setSpecies(event.target.value));
  document.querySelectorAll('[data-demo-basemap]').forEach(button=>button.addEventListener('click',()=>setBasemap(button.dataset.demoBasemap)));
  els.btn3D.addEventListener('click',()=>{
    setTerrain(!state.terrain);
    if (state.guided && state.step===7) advanceAfterAction();
  });
  els.guided.addEventListener('click',()=>setLearningMode(true));
  els.free.addEventListener('click',()=>setLearningMode(false));
  els.back.addEventListener('click',backStep);
  els.next.addEventListener('click',nextStep);
  document.getElementById('demoZoomIn').addEventListener('click',()=>map.zoomIn());
  document.getElementById('demoZoomOut').addEventListener('click',()=>map.zoomOut());

  map.on('load',() => {
    state.mapReady=true;
    installWMULayers();
    map.fitBounds([[-139.3,48.1],[-113.8,60.2]],{padding:28,duration:0});
    setBusy(false);
    renderEmptyInspector();
    updateStatus();
    renderTutorial();

    // Warm the two most expensive LEH resources in the background so the first real interaction is immediate.
    ensureDraws().catch(()=>{});
    window.setTimeout(()=>ensureZones().catch(()=>{}),250);
  });

  map.on('error',event=>console.warn('[Map guide map]',event && event.error ? event.error : event));
})();