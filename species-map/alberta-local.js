// Alberta's restricted provincial sensitivity shapefiles are strictly BYO-file.
// The original ZIP is selected locally and never sent to HuntSmart or a server.
// No browser persistent storage, network fetch or export of derived polygons.
(() => {
  'use strict';
  const memory = new Map();
  const maxBytes = 50 * 1024 * 1024;
  const maxVertices = 500000;
  function validate(parsed) {
    const chunks = Array.isArray(parsed) ? parsed : [parsed];
    const features = chunks.flatMap(chunk => Array.isArray(chunk?.features) ? chunk.features : []);
    if (!features.length || features.length > 5000) throw new Error('ZIP contains an unsupported number of features');
    let points = 0;
    let insideAlberta = false;
    function scan(n) {
      if (!Array.isArray(n)) throw new Error('Invalid polygon geometry');
      if (typeof n[0] === 'number') {
        if (!Number.isFinite(n[0]) || !Number.isFinite(n[1]) || n[0] < -123 ||
            n[0] > -108 || n[1] < 48 || n[1] > 61) throw new Error('Coordinates outside Alberta region');
        if (n[0] >= -120.1 && n[0] <= -109.9 && n[1] >= 48.9 && n[1] <= 60.1) insideAlberta = true;
        if (++points > maxVertices) throw new Error('GIS geometry exceeds browser display limit');
        return;
      }
      for (const part of n) scan(part);
    }
    for (const feature of features) {
      if (!feature || !['Polygon', 'MultiPolygon'].includes(feature.geometry?.type)) {
        throw new Error('Only polygon shapefile layers are supported');
      }
      scan(feature.geometry.coordinates);
    }
    if (!insideAlberta || points < 3) throw new Error('Alberta range geometry not found');
    return {type:'FeatureCollection',features};
  }
  window.HUNTSMART_ALBERTA_LOCAL = {
    attach({getProvince, getSelected, repaint}) {
      const panel = document.getElementById('alberta-personal-panel');
      const source = document.getElementById('alberta-personal-source');
      const description = document.getElementById('alberta-personal-description');
      const status = document.getElementById('alberta-personal-status');
      const input = document.getElementById('alberta-personal-file');
      const clear = document.getElementById('alberta-personal-clear');
      let generation = 0;
      function selected() {
        const item = getProvince() === 'ab' ? getSelected() : null;
        return item?.type === 'personal_government_file' ? item : null;
      }
      function show(item) {
        const eligible = getProvince() === 'ab' && item?.type === 'personal_government_file';
        panel.hidden = !eligible;
        if (!eligible) return;
        source.href = item.sourceUrl;
        description.textContent = item.displayName + '. Download the original ' +
          item.governmentFile + ' ZIP from Alberta, then open it here.';
        const loaded = memory.get(item.key);
        clear.hidden = !loaded;
        status.textContent = loaded
          ? 'Loaded ' + loaded.features.length + ' government polygon feature(s), in memory only.'
          : 'Personal use only: the ZIP stays on your device and is not uploaded or saved.';
      }
      input.addEventListener('change', async () => {
        const item = selected();
        const file = input.files?.[0];
        if (!item || !file) return;
        const serial = ++generation;
        const normalName = file.name.replace(/\s*\(\d+\)(?=\.zip$)/i,'').toLowerCase();
        if (normalName !== item.governmentFile.toLowerCase()) {
          status.textContent = 'Choose the original Alberta file: ' + item.governmentFile;
          input.value = '';
          return;
        }
        if (file.size < 100 || file.size > maxBytes) {
          status.textContent = 'This ZIP is empty or exceeds the 50 MB browser safety limit.';
          input.value = '';
          return;
        }
        status.textContent = 'Reading the selected ZIP locally. No upload takes place…';
        try {
          if (typeof window.shp !== 'function') throw new Error('Browser shapefile parser unavailable');
          const parsed = await window.shp(await file.arrayBuffer());
          const collection = validate(parsed);
          memory.set(item.key,collection);
          if (serial === generation && selected()?.key === item.key) await repaint();
        } catch (error) {
          if (serial === generation && selected()?.key === item.key) {
            status.textContent = 'Could not display the ZIP: ' + (error?.message || 'invalid shapefile') +
              '. Download the unchanged ZIP from Alberta.';
          }
        } finally {
          input.value = '';
        }
      });
      clear.addEventListener('click', () => {
        const item = selected();
        if (!item) return;
        memory.delete(item.key);
        input.value = '';
        void repaint();
      });
      return {
        hide() { panel.hidden = true; },
        draw(item, makeLayer) {
          show(item);
          const collection = memory.get(item.key);
          if (!collection) return null;
          const fill = item.key === 'grizzly_bear' ? '#c39b5d' :
            item.key === 'goat_sheep_areas' ? '#85a9d6' : '#6ebca0';
          const layer = makeLayer();
          layer.addGeoJson(collection);
          layer.setStyle({fillColor:fill,fillOpacity:0.42,strokeColor:fill,
            strokeOpacity:0.85,strokeWeight:1.5,clickable:false});
          return layer;
        },
      };
    },
  };
})();
