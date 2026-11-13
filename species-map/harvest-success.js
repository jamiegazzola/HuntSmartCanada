(() => {
  'use strict';
  // Figures were manually compiled from secondary published WMU tables.
  // The official BC dataset linked below is the underlying reference, but
  // the map entries have not yet been directly reconciled to its workbook.
  // Columns: WMU : estimated hunters : estimated kills : reported 2024 success % : reported 2020-24 average %.
  // Only verified units are coloured. Do not infer success or population density for missing units.
  const rows = "2-3:199:61:31:24;3-12:876:197:22:19;3-13:538:53:10:13;3-14:77:8:10:12;3-15:61:15:25:18;3-16:133:39:29:22;3-17:629:167:27:28;3-18:1034:304:29:25;3-19:1573:334:21:21;3-20:1206:339:28:22;3-26:1276:349:27:21;3-27:1027:418:41:30;3-28:713:200:28:23;3-29:1081:382:35:31;3-30:1908:487:26:24;3-31:937:239:26:27;3-32:676:236:35:30;3-33:122:8:7:18;3-34:67:14:21:8;3-35:80:7:9:15;3-36:426:116:27:21;3-37:403:124:31:27;3-38:367:87:24:23;3-39:204:36:18:17;3-40:153:37:24:23;3-41:66:15:23:20;4-1:119:21:18:12;4-2:404:92:23:17;4-3:636:64:10:11;4-4:213:31:15:15;5-1:1437:254:18:17;5-2:3025:909:30:28;5-3:1090:496:46:43;5-4:209:75:36:36;5-5:60:8:13:31;5-6:68:23:34:11;5-8:16:0:0:33;5-10:7:0:0:0;5-11:17:0:0:25;5-12:181:55:30:27;5-13:801:230:29:28;5-14:995:465:47:47;5-15:236:46:19:7;8-1:568:212:37:29;8-2:215:87:40:30;8-3:134:47:35:28;8-4:497:83:17:16;8-5:1140:265:23:22;8-6:632:91:14:21;8-7:556:203:37:27;8-8:1194:364:30:23;8-9:457:85:19:19;8-10:820:200:24:15;8-11:768:160:21:21;8-12:1050:162:15:10;8-13:66:0:0:8;8-14:643:103:16:12;8-15:383:30:8:11;8-21:286:85:30:26;8-22:271:85:31:21;8-23:583:100:17:13;8-24:222:15:7:15;8-25:308:58:19:12;8-26:194:43:22:19";
  const BC_GOVERNMENT_HARVEST_DATA = 'https://catalogue.data.gov.bc.ca/dataset/big-game-harvest-statistics-1976-to-2024';
  const stats = new Map(rows.split(';').map(row => {
    const [id, hunters, kills, current, average] = row.split(':');
    return [id, { id, hunters:Number(hunters), kills:Number(kills), current:Number(current), average:Number(average) }];
  }));
  const btn = document.getElementById('hs-harvest-toggle');
  const control = document.getElementById('hs-harvest-panel');
  const period = document.getElementById('hs-harvest-period');
  const detail = document.getElementById('hs-harvest-detail');
  const legend = document.getElementById('hs-harvest-legend');
  if (!btn || !control || !period || !detail || !legend) throw new Error('Harvest map controls missing');

  const classes = [
    { max:9, color:'#468f58' }, { max:19, color:'#a3b950' },
    { max:29, color:'#dfcb58' }, { max:39, color:'#e28d42' },
    { max:100, color:'#c45145' }
  ];
  const metrics = { current:'2024', average:'2020–24 avg' };
  let enabled = false;
  let layer = null;
  let info = null;
  let renderSerial = 0;
  let pendingBoundary = null;
  let boundaryCache = null;
  let context = null;
  function active() { return context && context.getProvince() === 'bc' && context.getSpecies() === 'mule_deer'; }
  function colour(value) { return classes.find(item => value <= item.max)?.color || '#c45145'; }
  function pct(rec) { return period.value === 'average' ? rec.average : rec.current; }
  function setDetail(text) { detail.textContent = text; }
  function updateButton() {
    btn.textContent = enabled ? 'Show Distribution' : 'Show Hunter Success';
    btn.setAttribute('aria-pressed', String(enabled));
    btn.setAttribute('aria-label', enabled
      ? 'Return to mule deer distribution map' : 'Show mule deer hunter success by WMU');
  }
  function removeLayer() {
    renderSerial++;
    if (layer) { layer.setMap(null); layer = null; }
    if (info) info.close();
    info = null;
  }
  function refreshStyle() {
    if (!layer) return;
    const opacity = Math.max(0, Math.min(1, context.getOpacity()));
    layer.setStyle(feature => {
      const id = String(feature.getProperty('wmu_id') || feature.getProperty('WMUNIT_NUM') || '');
      const rec = stats.get(id);
      return {
        fillColor:rec ? colour(pct(rec)) : '#8c9494',
        fillOpacity:(rec ? 0.76 : 0.10) * opacity,
        strokeColor:rec ? '#e5e7da' : '#a9aeae',
        strokeOpacity:(rec ? 0.85 : 0.38) * opacity,
        strokeWeight:rec ? 1.05 : 0.65,
        zIndex:25,
        clickable:true
      };
    });
  }
  function displayPopup(event) {
    const id = String(event.feature.getProperty('wmu_id') || event.feature.getProperty('WMUNIT_NUM') || '');
    const rec = stats.get(id);
    if (!info) info = new google.maps.InfoWindow();
    const box = document.createElement('div');
    box.style.cssText = 'color:#18231b;font:13px/1.5 system-ui,sans-serif;max-width:235px';
    const title = document.createElement('strong');
    title.style.fontSize = '15px';
    title.textContent = 'BC WMU ' + id + ' · Mule deer';
    box.appendChild(title);
    for (const text of (rec ? [
      metrics[period.value] + ' estimated hunter success: ' + pct(rec) + '%',
      '2024: ' + rec.hunters.toLocaleString() + ' estimated hunters · ' + rec.kills.toLocaleString() + ' deer harvested',
      'Overall harvest (not GOS-only or trophy buck success)'
    ] : ['No verified harvest-success figure for this WMU.'])) {
      const p = document.createElement('div'); p.textContent = text; p.style.marginTop = '5px'; box.appendChild(p);
    }
    const a = document.createElement('a');
    a.href = BC_GOVERNMENT_HARVEST_DATA;
    a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.textContent = 'Data source: Government of BC';
    a.style.cssText = 'display:inline-block;margin-top:6px;color:#17653e';
    box.appendChild(a);
    if (rec) {
      const note = document.createElement('div');
      note.textContent = 'Map values are manually compiled and not yet independently reconciled with the provincial dataset.';
      note.style.cssText = 'font:10px/1.35 system-ui,sans-serif;color:#667469;margin-top:5px';
      box.appendChild(note);
    }
    info.setContent(box);
    info.setPosition(event.latLng);
    info.open({map:context.getMap()});
  }
  function fetchBoundaries() {
    if (boundaryCache) return Promise.resolve(boundaryCache);
    if (pendingBoundary) return pendingBoundary;
    pendingBoundary = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/bc-wmu-geojson.js?v=harvest-wmu-20261113';
      script.async = true;
      script.onload = () => {
        if (typeof BC_WMU_GEOJSON === 'undefined' || !Array.isArray(BC_WMU_GEOJSON.features) || BC_WMU_GEOJSON.features.length !== 225) {
          reject(new Error('WMU boundaries are missing or incomplete.'));
        } else {
          boundaryCache = BC_WMU_GEOJSON;
          resolve(boundaryCache);
        }
      };
      script.onerror = () => reject(new Error('The existing BC WMU boundaries could not be loaded.'));
      document.head.appendChild(script);
    }).finally(() => { pendingBoundary = null; });
    return pendingBoundary;
  }
  async function draw() {
    if (!enabled || !active() || !context.getMap() || layer) return;
    const generation = ++renderSerial;
    // Allow users to switch back while WMU boundaries are still loading.
    setDetail('Loading actual WMU boundaries…');
    try {
      const collection = await fetchBoundaries();
      if (generation !== renderSerial || !enabled || !active()) return;
      layer = new google.maps.Data({map:context.getMap()});
      layer.addGeoJson(collection);
      layer.addListener('click', displayPopup);
      refreshStyle();
      setDetail('64 of 225 BC WMUs have verified estimates. Grey = unavailable. Tap a unit for hunters and harvest.');
    } catch (e) {
      if (generation === renderSerial) {
        enabled = false;
        updateButton();
        legend.hidden = true;
        period.hidden = true;
        setDetail(e?.message || 'Harvest layer unavailable.');
        // Restore distribution if WMU boundary loading fails.
        context.onModeChange();
      }
    } finally {
      if (generation === renderSerial) btn.disabled = false;
    }
  }
  function sync() {
    const visible = !!active();
    control.hidden = !visible;
    if (!visible) {
      removeLayer();
      enabled = false;
      btn.disabled = false;
      updateButton();
      period.hidden = true;
      legend.hidden = true;
      setDetail('');
      return;
    }
    if (enabled && !layer) void draw();
  }
  btn.addEventListener('click', () => {
    if (!active() || btn.disabled) return;
    enabled = !enabled;
    updateButton();
    period.hidden = !enabled;
    legend.hidden = !enabled;
    if (!enabled) {
      removeLayer();
      setDetail('');
    }
    // Re-render one exclusive mode instead of stacking species and WMU layers.
    return context.onModeChange();
  });
  period.addEventListener('change', () => {
    refreshStyle();
    if (info) info.close();
  });
  document.getElementById('layer-opacity')?.addEventListener('input', refreshStyle);
  window.HUNTSMART_HARVEST_DATA_COVERAGE = stats.size;
  window.HUNTSMART_HARVEST_SUCCESS = {
    attach(args) {
      context = args;
      updateButton();
      return {sync, isEnabled: () => enabled && active()};
    }
  };
})();