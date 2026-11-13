// Government of BC evidence for big-game carnivores missing from the original map.
// These layers are NOT population density or probability-of-success products.
(() => {
  'use strict';

  const HABITAT_BASE = 'https://delivery.maps.gov.bc.ca/arcgis/rest/services/whse/bcgw_pub_whse_terrestrial_ecology/MapServer';
  const WSI_BASE = 'https://delivery.maps.gov.bc.ca/arcgis/rest/services/mpcm/bcgwpub/MapServer';
  const WHA_BASE = 'https://delivery.maps.gov.bc.ca/arcgis/rest/services/whse/bcgw_pub_whse_wildlife_management/MapServer';
  const HABITAT_SOURCE = 'https://catalogue.data.gov.bc.ca/dataset/broad-ecosystem-inventory-wildlife-habitat-ratings-interpretations-for-mammals';
  const WSI_SOURCE = 'https://catalogue.data.gov.bc.ca/dataset/wildlife-species-inventory-telemetry-observations-non-sensitive';
  const WHA_SOURCE = 'https://catalogue.data.gov.bc.ca/dataset/wildlife-habitat-areas-approved';

  const RECORDS = Object.freeze({
    lynx: { name: 'Canada Lynx', kind: 'habitat', field: 'M_LYCA', source: HABITAT_SOURCE },
    bobcat: { name: 'Bobcat', kind: 'habitat', field: 'M_LYRU', source: HABITAT_SOURCE },
    cougar: { name: 'Cougar', kind: 'telemetry', species: 'Cougar', source: WSI_SOURCE },
    wolf: { name: 'Wolf', kind: 'telemetry', species: 'Grey Wolf', source: WSI_SOURCE },
    wolverine: { name: 'Wolverine', kind: 'wolverine', species: 'Wolverine', source: WHA_SOURCE },
  });

  const palettes = [
    [215, 48, 39, 205], [244, 139, 39, 205],
    [244, 208, 63, 205]
  ];
  let active = [];
  let currentMap = null;

  function polygonSymbol(color) {
    return {
      type: 'esriSFS', style: 'esriSFSSolid', color,
      outline: { type: 'esriSLS', style: 'esriSLSNull', color: [0, 0, 0, 0], width: 0 }
    };
  }

  function tileLayer(base, layerId, where, renderer, opacity) {
    const layer = {
      id: layerId,
      source: { type: 'mapLayer', mapLayerId: layerId },
      definitionExpression: where,
      drawingInfo: { renderer }
    };
    const dynamicLayers = JSON.stringify([layer]);
    const half = 20037508.342789244;
    return new google.maps.ImageMapType({
      tileSize: new google.maps.Size(256, 256),
      opacity,
      name: 'Government of BC species evidence',
      getTileUrl(coord, zoom) {
        const n = Math.pow(2, zoom);
        if (coord.y < 0 || coord.y >= n || coord.x < 0 || coord.x >= n) return '';
        const span = 2 * half / n;
        const west = -half + coord.x * span;
        const north = half - coord.y * span;
        const params = new URLSearchParams({
          f: 'image',
          bbox: [west, north - span, west + span, north].join(','),
          bboxSR: '3857',
          imageSR: '3857',
          size: '256,256',
          format: 'png32',
          transparent: 'true',
          dpi: '96',
          dynamicLayers
        });
        return base + '/export?' + params.toString();
      }
    });
  }

  function addOverlay(map, overlay) {
    map.overlayMapTypes.push(overlay);
    active.push(overlay);
  }

  function clear() {
    if (currentMap) {
      const overlays = currentMap.overlayMapTypes;
      for (const layer of active) {
        for (let i = overlays.getLength() - 1; i >= 0; i--) {
          if (overlays.getAt(i) === layer) overlays.removeAt(i);
        }
      }
    }
    active = [];
    currentMap = null;
  }

  function setOpacity(opacity) {
    for (const layer of active) layer.setOpacity(opacity);
  }

  function renderHabitat(item, season, map, opacity) {
    const field = item.field + (season === 'winter' ? '_WLI6WTSUI' : '_SLI6WTSUI');
    const where = field + " IN ('1','2','3')";
    const renderer = {
      type: 'uniqueValue', field1: field, fieldDelimiter: ',',
      uniqueValueInfos: palettes.map((color, index) => ({
        value: String(index + 1),
        label: ['Very high', 'High', 'Moderate'][index],
        symbol: polygonSymbol(color)
      }))
    };
    addOverlay(map, tileLayer(HABITAT_BASE, 22, where, renderer, opacity));
  }

  function renderTelemetry(item, map, opacity) {
    const where = "SPECIES_ENGLISH_NAME = '" + item.species + "'";
    const renderer = {
      type: 'simple',
      symbol: {
        type: 'esriSMS', style: 'esriSMSCircle',
        color: [244, 208, 63, 215], size: 5,
        outline: { color: [20, 40, 28, 235], width: 0.8 }
      }
    };
    addOverlay(map, tileLayer(WSI_BASE, 695, where, renderer, opacity));
  }

  function renderWolverineHabitat(map, opacity) {
    const renderer = {
      type: 'simple',
      symbol: polygonSymbol([103, 191, 136, 140])
    };
    addOverlay(map, tileLayer(WHA_BASE, 55, "COMMON_SPECIES_NAME = 'Wolverine'", renderer, opacity));
  }

  function render(key, mode, map, opacity) {
    clear();
    const item = RECORDS[key];
    if (!item || !map) return;
    currentMap = map;
    const note = document.getElementById('layer-note');
    const text = document.getElementById('layer-note-text');
    const source = document.getElementById('layer-source');
    const attribution = document.getElementById('layer-attribution');
    const licence = document.getElementById('layer-license');
    note.hidden = false;
    source.hidden = false;
    source.href = item.source;
    source.textContent = 'BC Government source';
    attribution.hidden = false;
    licence.href = 'https://www2.gov.bc.ca/gov/content/data/open-data/open-government-licence-bc';
    licence.textContent = 'Open Government Licence – BC';

    if (item.kind === 'habitat') {
      if (mode === 'historical') {
        text.textContent = 'Historical: no independently verified historical ' + item.name + ' layer available.';
        return;
      }
      renderHabitat(item, mode === 'winter' ? 'winter' : 'summer', map, opacity);
      text.textContent = (mode === 'winter' ? 'Winter' : mode === 'summer' ? 'Summer' : 'Modern reference') +
        ': BC Broad Ecosystem Inventory modelled ' + item.name +
        ' habitat suitability (legacy model, approximately 2003-era inputs). Red = very high; orange = high; yellow = moderate. Zoom in to reveal detail. Partial regional coverage, NOT population density, current occupancy or harvest success. Blank areas do not establish absence.';
    } else if (mode !== 'modern') {
      text.textContent = mode[0].toUpperCase() + mode.slice(1) +
        ': no verified season-specific or historical ' + item.name + ' layer available. Choose Modern to inspect the available official evidence.';
    } else if (item.kind === 'wolverine') {
      renderWolverineHabitat(map, opacity);
      renderTelemetry(item, map, opacity);
      text.textContent = 'Wolverine: green shows approved provincial wildlife habitat areas (partial coverage, NOT its complete range); gold points show non-sensitive government telemetry observations (zoom to roughly 1:1,000,000 or closer). Telemetry is study-biased and dated, NOT density or current population distribution.';
    } else {
      renderTelemetry(item, map, opacity);
      text.textContent = item.name +
        ': gold points are Government of BC non-sensitive telemetry observations, visible at approximately 1:1,000,000 map scale or closer. They represent sampled animals and studies, NOT comprehensive distribution, habitat suitability, present-day occupancy, population density or hunter success. A blank area is NOT absence.';
    }
  }

  window.HUNTSMART_BC_EVIDENCE = Object.freeze({ render, clear, setOpacity, keys: Object.keys(RECORDS) });
})();