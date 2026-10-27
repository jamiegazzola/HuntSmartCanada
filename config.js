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
  const guideRoot = document.getElementById('hsMapDemo');
  if (!guideRoot) return;

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

  // Keep the teaching copy conceptually correct: LEH and GOS are separate hunting
  // workflows that answer different questions, not competing versions of one result.
  if (!guideRoot.dataset.workflowCopyObserver) {
    guideRoot.dataset.workflowCopyObserver = '1';

    const title = document.getElementById('demoStepTitle');
    const text = document.getElementById('demoStepText');
    const next = document.getElementById('demoNext');

    const label = mode => mode === 'leh' ? 'LEH' : 'General Open Seasons';
    const opposite = mode => mode === 'leh' ? 'gos' : 'leh';
    const setCopy = (element, value) => {
      if (element && element.textContent !== value) element.textContent = value;
    };

    const updateGuideCopy = () => {
      if (!title || !text || !next) return;
      const step = Number(guideRoot.dataset.guideStep || 1);
      const firstMode = guideRoot.dataset.guideFirstMode || '';
      const renderedMode = guideRoot.dataset.guideRenderedMode || '';

      if (step === 1) {
        setCopy(title, 'Meet the HuntSmart map');
        setCopy(text, 'This guided tour teaches LEH and General Open Seasons as two different tools. You will learn what each system answers and how to use both on the map.');
        setCopy(next, 'Start tour →');
        return;
      }

      if (step === 2) {
        setCopy(title, 'Choose a hunting system');
        setCopy(text, 'Start with either Limited Entry Hunting or General Open Seasons. We will teach what that system answers first, then show the other one as a separate workflow.');
        setCopy(next, 'Choose LEH or GOS to continue');
        return;
      }

      if (step === 5 && renderedMode) {
        if (renderedMode === 'leh') {
          setCopy(title, 'Understand your LEH result');
          setCopy(text, 'LEH answers: what limited-entry draw opportunities exist here for this species? Review the draw odds, hunt codes, classes, dates and mapped LEH zones below.');
          setCopy(next, 'Next: Explore General Open Seasons →');
        } else {
          setCopy(title, 'Understand your General Open Seasons result');
          setCopy(text, 'General Open Seasons answers: what hunting opportunities are available here without winning an LEH draw? Review the season rows and restrictions for this species and WMU below.');
          setCopy(next, 'Next: Explore LEH →');
        }
        return;
      }

      if (step === 6 && firstMode) {
        const targetMode = opposite(firstMode);
        setCopy(title, `Now explore ${label(targetMode)}`);
        setCopy(
          text,
          targetMode === 'gos'
            ? 'LEH showed you draw-only opportunities. General Open Seasons answers a different question: what hunting opportunities are available here without winning an LEH draw?'
            : 'General Open Seasons showed opportunities available without an LEH draw. LEH answers a different question: what limited-entry draw opportunities exist here for this species?'
        );
        setCopy(next, `Open ${label(targetMode)}`);
        return;
      }

      if (step === 7 && renderedMode) {
        setCopy(title, `Understand your ${label(renderedMode)} result`);
        setCopy(
          text,
          renderedMode === 'gos'
            ? 'These are the General Open Seasons rows for this species and WMU. They describe open-season opportunities and restrictions—not a competing LEH odds result.'
            : 'These are the LEH draw records for this species and WMU. They describe limited-entry opportunities that require a successful draw authorization.'
        );
        setCopy(next, 'Try a map layer →');
        return;
      }

      if (step === 9) {
        setCopy(title, 'You are ready to explore');
        setCopy(text, 'You now know what LEH and General Open Seasons each answer, how to inspect a WMU, and how to change the map view.');
        setCopy(next, 'Explore freely');
      }
    };

    let copyUpdateQueued = false;
    const queueGuideCopyUpdate = () => {
      if (copyUpdateQueued) return;
      copyUpdateQueued = true;
      queueMicrotask(() => {
        copyUpdateQueued = false;
        updateGuideCopy();
      });
    };

    new MutationObserver(queueGuideCopyUpdate).observe(guideRoot, {
      attributes:true,
      attributeFilter:['data-guide-step','data-guide-first-mode','data-guide-rendered-mode'],
      childList:true,
      subtree:true,
      characterData:true
    });
    queueGuideCopyUpdate();
  }
});
