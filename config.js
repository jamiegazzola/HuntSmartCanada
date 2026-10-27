// Mapbox token — keep this file out of git (.gitignore)
const MAPBOX_TOKEN = 'pk.eyJ1IjoiamFtaWVnYXp6b2xhIiwiYSI6ImNtcGdpbzM3dzA2ejAyd3E1NHZjZXlyMGIifQ.NKi0eSr7pXtLTO6nnrvF3A';

// On the interactive map guide only, capture the Mapbox instance as it is created
// so LEH zone hover behavior can be layered on without changing the stable map core.
(() => {
  if (!document.getElementById('hsMapDemo')) return;
  if (typeof window.mapboxgl !== 'undefined') return;

  const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[character]));

  const formatZoneLabel = (label, id) => {
    const raw = String(label || id || '').trim();
    if (!raw) return 'LEH zone';
    if (/^leh\s+zone\b/i.test(raw)) return raw.replace(/^leh\s+zone\b/i, 'Zone');
    if (/^zone\b/i.test(raw)) return raw.replace(/^zone\b/i, 'Zone');
    if (/^[a-z0-9-]{1,5}$/i.test(raw)) return `Zone ${raw}`;
    return raw;
  };

  function installZoneHoverHooks(map, mapbox) {
    if (!map || map.__hsZoneHoverHooks) return;
    Object.defineProperty(map, '__hsZoneHoverHooks', { value:true, configurable:true });

    let hoveredZoneId = null;
    let hoverPopup = null;
    let eventsBound = false;

    const clearHover = () => {
      if (hoveredZoneId !== null && map.getSource('demo-leh')) {
        try { map.setFeatureState({ source:'demo-leh', id:hoveredZoneId }, { zoneHover:false }); } catch (_) {}
      }
      hoveredZoneId = null;
      if (hoverPopup) hoverPopup.remove();
      hoverPopup = null;
      if (map.getCanvas()) map.getCanvas().style.cursor = '';
    };

    const onMove = event => {
      const feature = event.features && event.features[0];
      if (!feature || !map.getSource('demo-leh')) return;

      if (hoveredZoneId !== null && hoveredZoneId !== feature.id) {
        try { map.setFeatureState({ source:'demo-leh', id:hoveredZoneId }, { zoneHover:false }); } catch (_) {}
      }
      hoveredZoneId = feature.id;
      try { map.setFeatureState({ source:'demo-leh', id:hoveredZoneId }, { zoneHover:true }); } catch (_) {}

      const properties = feature.properties || {};
      const zoneLabel = formatZoneLabel(properties.label, properties.id);
      const speciesSelect = document.getElementById('demoSpecies');
      const speciesLabel = String(
        speciesSelect?.selectedOptions?.[0]?.textContent || properties.zt || 'LEH'
      ).trim();

      if (!hoverPopup) {
        hoverPopup = new mapbox.Popup({
          closeButton:false,
          closeOnClick:false,
          offset:12,
          className:'hs-zone-hover-popup'
        });
      }

      hoverPopup
        .setLngLat(event.lngLat)
        .setHTML(
          `<div style="min-width:120px"><strong style="display:block;font-size:13px">${escapeHtml(zoneLabel)}</strong>` +
          `<span style="display:block;margin-top:3px;font-size:11px;color:#aab4ae">${escapeHtml(speciesLabel)} · LEH</span></div>`
        )
        .addTo(map);

      if (map.getCanvas()) map.getCanvas().style.cursor = 'pointer';
    };

    const bindEvents = () => {
      if (eventsBound || !map.getLayer('demo-leh-fill')) return;
      map.on('mousemove', 'demo-leh-fill', onMove);
      map.on('mouseleave', 'demo-leh-fill', clearHover);
      eventsBound = true;
    };

    const unbindEvents = () => {
      if (!eventsBound) return;
      try { map.off('mousemove', 'demo-leh-fill', onMove); } catch (_) {}
      try { map.off('mouseleave', 'demo-leh-fill', clearHover); } catch (_) {}
      eventsBound = false;
    };

    const applyZonePaint = () => {
      if (map.getLayer('demo-leh-fill')) {
        map.setPaintProperty('demo-leh-fill', 'fill-color', [
          'case', ['boolean', ['feature-state', 'zoneHover'], false], '#ffd45c', '#f0b429'
        ]);
        map.setPaintProperty('demo-leh-fill', 'fill-opacity', [
          'case', ['boolean', ['feature-state', 'zoneHover'], false], 0.34, 0.08
        ]);
      }
      if (map.getLayer('demo-leh-line')) {
        map.setPaintProperty('demo-leh-line', 'line-color', [
          'case', ['boolean', ['feature-state', 'zoneHover'], false], '#fff2b0', '#f0b429'
        ]);
        map.setPaintProperty('demo-leh-line', 'line-width', [
          'case', ['boolean', ['feature-state', 'zoneHover'], false], 5, 3
        ]);
        map.setPaintProperty('demo-leh-line', 'line-opacity', 1);
      }
    };

    const originalAddLayer = map.addLayer.bind(map);
    map.addLayer = function(layer, beforeId) {
      const result = originalAddLayer(layer, beforeId);
      if (layer && (layer.id === 'demo-leh-fill' || layer.id === 'demo-leh-line')) {
        applyZonePaint();
        bindEvents();
      }
      return result;
    };

    const originalRemoveSource = map.removeSource.bind(map);
    map.removeSource = function(id) {
      if (id === 'demo-leh') {
        clearHover();
        unbindEvents();
      }
      return originalRemoveSource(id);
    };
  }

  let assignedMapbox;
  Object.defineProperty(window, 'mapboxgl', {
    configurable:true,
    enumerable:true,
    get() { return assignedMapbox; },
    set(value) {
      assignedMapbox = value;
      if (value && value.Map && !value.Map.__hsGuideCaptureWrapped) {
        const OriginalMap = value.Map;
        class HuntSmartGuideMap extends OriginalMap {
          constructor(...args) {
            super(...args);
            window.__HUNTSMART_MAP_GUIDE__ = this;
            installZoneHoverHooks(this, value);
          }
        }
        Object.defineProperty(HuntSmartGuideMap, '__hsGuideCaptureWrapped', { value:true });
        value.Map = HuntSmartGuideMap;
      }
      Object.defineProperty(window, 'mapboxgl', {
        configurable:true,
        enumerable:true,
        writable:true,
        value:assignedMapbox
      });
    }
  });
})();

// Load the guided-tour controller only on the interactive map guide, after the stable map core is ready.
window.addEventListener('load', () => {
  if (!document.getElementById('hsMapDemo')) return;

  if (!document.getElementById('hs-map-guide-controller')) {
    const script = document.createElement('script');
    script.id = 'hs-map-guide-controller';
    script.src = './blog-map-guide-controller.js?v=20261026a';
    document.body.appendChild(script);
  }

  const inspector = document.getElementById('demoInspector');
  if (inspector && !inspector.dataset.zoneHoverCopyObserver) {
    inspector.dataset.zoneHoverCopyObserver = '1';
    const updateZoneNote = () => {
      const note = inspector.querySelector('.demo-zone-note');
      if (!note) return;
      const current = note.textContent || '';
      if (current.includes('Click a gold zone on the map to inspect it.')) {
        note.textContent = current.replace(
          'Click a gold zone on the map to inspect it.',
          'Hover a gold zone to identify its zone and species; click it for details.'
        );
      }
    };
    new MutationObserver(updateZoneNote).observe(inspector, { childList:true, subtree:true, characterData:true });
    updateZoneNote();
  }
});
