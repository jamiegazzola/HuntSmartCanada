from pathlib import Path

ROOT = Path(__file__).resolve().parent
MAPS = ROOT / "site" / "maps.js"

if not MAPS.exists():
    raise SystemExit("LEH zone filter build: site/maps.js is missing")

text = MAPS.read_text(encoding="utf-8")


def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"LEH zone filter build: expected exactly one {label}, found {count}")
    text = text.replace(old, new, 1)


replace_once(
    "let _activeLEH         = null;\n",
    """let _activeLEH         = null;\nlet _fullMapSelectedLEHZone = null; // { id, mu, zoneLetter, species, label }\n\nfunction _fullMapClearLEHZoneFilter(refreshResults = true) {\n  if (_activeLEH != null) _setLEHFeatureState(_activeLEH, { active: false });\n  _activeLEH = null;\n  _fullMapSelectedLEHZone = null;\n  _setLEHHoverFilter(null);\n  fullMapUpdateChips();\n  if (refreshResults && fullMapSelRegions.size) fullMapShowResults();\n}\n\nfunction _fullMapSelectLEHZoneFeature(feature) {\n  if (!feature || !feature.properties) return;\n  const p = feature.properties;\n  const id = feature.id ?? p.id;\n  const mu = _lehCleanMU(p.mu || '');\n  const zoneLetter = String(p.zoneLetter || _lehZoneLetterFromId(id) || '').replace(/[^A-Za-z]/g, '').toUpperCase();\n  const species = _lehNormalizeSpecies(p.zt || _fullMapLEHSpecies || fullMapSelectedSpecies || '');\n  const label = p.label || _lehFormatZoneLabel('', mu, zoneLetter);\n  if (!mu || !species) return;\n\n  _fullMapSelectedLEHZone = { id, mu, zoneLetter, species, label };\n  _setLEHActiveFromFeature(feature);\n  fullMapUpdateChips();\n  if (fullMapSelRegions.size) fullMapShowResults();\n}\n\nfunction _fullMapDrawMatchesLEHZone(row) {\n  const selected = _fullMapSelectedLEHZone;\n  if (!selected || fullMapProvince !== 'BC') return true;\n  if (!row || !bcMUMatchesPolygon(row.MU, selected.mu)) return false;\n  if (_lehZoneTypeForSpecies(row.Species) !== selected.species) return false;\n  if (!selected.zoneLetter) return true;\n  const rowZone = String(row.Zone || '').replace(/[^A-Za-z]/g, '').toUpperCase();\n  return rowZone === selected.zoneLetter;\n}\n""",
    "LEH selected-zone state anchor",
)

replace_once(
    """function fullMapSetProvince(prov) {\n  if (fullMapProvince === prov) return;\n  fullMapProvince = prov;\n  fullMapSelRegions.clear();\n  fullMapSelectedSpecies = '';\n  fullMapSelectedWMU = '';\n""",
    """function fullMapSetProvince(prov) {\n  if (fullMapProvince === prov) return;\n  fullMapProvince = prov;\n  fullMapSelRegions.clear();\n  fullMapSelectedSpecies = '';\n  fullMapSelectedWMU = '';\n  _fullMapSelectedLEHZone = null;\n""",
    "province reset",
)

replace_once(
    """function fullMapSetSpecies(species) {\n  fullMapSelectedSpecies = String(species || '').trim();\n  fullMapRefreshStyles();\n""",
    """function fullMapSetSpecies(species) {\n  fullMapSelectedSpecies = String(species || '').trim();\n  if (_fullMapSelectedLEHZone && _lehZoneTypeForSpecies(fullMapSelectedSpecies) !== _fullMapSelectedLEHZone.species) {\n    _fullMapSelectedLEHZone = null;\n    _activeLEH = null;\n    _setLEHHoverFilter(null);\n  }\n  fullMapRefreshStyles();\n""",
    "species reset",
)

replace_once(
    """function fullMapSetLEHSpecies(species) {\n  _fullMapLEHSpecies = _lehNormalizeSpecies(species);\n  _updateLEHBtn();\n""",
    """function fullMapSetLEHSpecies(species) {\n  const nextSpecies = _lehNormalizeSpecies(species);\n  if (_fullMapSelectedLEHZone && _fullMapSelectedLEHZone.species !== _lehZoneTypeForSpecies(nextSpecies)) {\n    _fullMapSelectedLEHZone = null;\n    _activeLEH = null;\n    _setLEHHoverFilter(null);\n  }\n  _fullMapLEHSpecies = nextSpecies;\n  _updateLEHBtn();\n""",
    "LEH species reset",
)

replace_once(
    """  fullMapSelectedWMU = fullMapSelRegions.size === 1 ? [...fullMapSelRegions][0] : '';\n  if (!fullMapSelRegions.size) _removeLEHLayers();\n""",
    """  fullMapSelectedWMU = fullMapSelRegions.size === 1 ? [...fullMapSelRegions][0] : '';\n  if (_fullMapSelectedLEHZone && !fullMapSelRegions.has(_fullMapSelectedLEHZone.mu)) {\n    _fullMapSelectedLEHZone = null;\n    _activeLEH = null;\n  }\n  if (!fullMapSelRegions.size) _removeLEHLayers();\n""",
    "WMU toggle zone reset",
)

replace_once(
    """      fullMapInstance.on('click', _LYR_LEH_FILL, e => {\n        const wmuHit = _getTopWMUFeatureAtPoint(e);\n        if (wmuHit) {\n          const id = fullMapProvince === 'BC' ? (wmuHit.properties.wmu_id || '') : String(wmuHit.properties.WMUNIT_NUM || '');\n          if (id) {\n            if (e.originalEvent) e.originalEvent._hsWMUToggledFromLEH = true;\n            _fullMapToggleRegion(id, wmuHit.id);\n            return;\n          }\n        }\n        const f = (e.features && e.features[0]) || _getTopLEHFeatureAtPoint(e);\n        if (f) { _setLEHActiveFromFeature(f); _showLEHMapTooltip(e, f); }\n      });\n""",
    """      fullMapInstance.on('click', _LYR_LEH_FILL, e => {\n        const f = (e.features && e.features[0]) || _getTopLEHFeatureAtPoint(e);\n        if (!f) return;\n        // LEH polygons are more specific than the WMU beneath them. Selecting a\n        // zone must filter cards to that zone rather than toggling the parent WMU.\n        if (e.originalEvent) e.originalEvent._hsWMUToggledFromLEH = true;\n        _fullMapSelectLEHZoneFeature(f);\n        _showLEHMapTooltip(e, f);\n      });\n""",
    "LEH click handler",
)

replace_once(
    """    _setLEHHoverFilter(_activeLEH);\n\n    if (!fullMapInstance._lehTooltipBound) {\n""",
    """    if (_fullMapSelectedLEHZone) {\n      const selectedFeature = features.find(f => String(f.id ?? f.properties?.id) === String(_fullMapSelectedLEHZone.id));\n      if (selectedFeature) _setLEHActiveFromFeature(selectedFeature);\n      else _setLEHHoverFilter(null);\n    } else {\n      _setLEHHoverFilter(null);\n    }\n\n    if (!fullMapInstance._lehTooltipBound) {\n""",
    "LEH active-state restore",
)

replace_once(
    """  if (!regions.length && !fullMapSelectedSpecies) {\n    row.innerHTML = '';\n    row.style.display = 'none';\n    return;\n  }\n""",
    """  if (!regions.length && !fullMapSelectedSpecies && !_fullMapSelectedLEHZone) {\n    row.innerHTML = '';\n    row.style.display = 'none';\n    return;\n  }\n""",
    "chip empty state",
)

replace_once(
    """  regions.forEach(id => {\n    pieces.push(`<button type=\"button\" class=\"fullmap-selected-chip wmu-chip\" onclick=\"event.stopPropagation();fullMapRemoveRegion(${fullMapJsArg(id)})\">WMU ${fullMapEscapeHtml(id)} <span aria-hidden=\"true\">×</span></button>`);\n  });\n""",
    """  regions.forEach(id => {\n    pieces.push(`<button type=\"button\" class=\"fullmap-selected-chip wmu-chip\" onclick=\"event.stopPropagation();fullMapRemoveRegion(${fullMapJsArg(id)})\">WMU ${fullMapEscapeHtml(id)} <span aria-hidden=\"true\">×</span></button>`);\n  });\n  if (_fullMapSelectedLEHZone) {\n    pieces.push(`<button type=\"button\" class=\"fullmap-selected-chip zone-chip\" onclick=\"event.stopPropagation();_fullMapClearLEHZoneFilter(true)\">${fullMapEscapeHtml(_fullMapSelectedLEHZone.label)} <span aria-hidden=\"true\">×</span></button>`);\n  }\n""",
    "zone chip",
)

replace_once(
    """function fullMapRemoveRegion(id) {\n  fullMapSelRegions.delete(id);\n  fullMapSelectedWMU = fullMapSelRegions.size === 1 ? [...fullMapSelRegions][0] : '';\n""",
    """function fullMapRemoveRegion(id) {\n  fullMapSelRegions.delete(id);\n  fullMapSelectedWMU = fullMapSelRegions.size === 1 ? [...fullMapSelRegions][0] : '';\n  if (_fullMapSelectedLEHZone && !fullMapSelRegions.has(_fullMapSelectedLEHZone.mu)) {\n    _fullMapSelectedLEHZone = null;\n    _activeLEH = null;\n  }\n""",
    "remove-region zone reset",
)

replace_once(
    """  fullMapSelectedWMU = '';\n  fullMapSelectedSpecies = '';\n""",
    """  fullMapSelectedWMU = '';\n  fullMapSelectedSpecies = '';\n  _fullMapSelectedLEHZone = null;\n""",
    "clear-all zone reset",
)

replace_once(
    """    cards = DATA.filter(r => regions.some(id => bcMUMatchesPolygon(r.MU, id)) && _fullMapDrawMatchesSpeciesName(r.Species)).map(r => {\n""",
    """    cards = DATA.filter(r => regions.some(id => bcMUMatchesPolygon(r.MU, id)) && _fullMapDrawMatchesSpeciesName(r.Species) && _fullMapDrawMatchesLEHZone(r)).map(r => {\n""",
    "BC results zone filter",
)

replace_once(
    """  if (title) title.textContent = `${fullMapSelectedSpecies ? fullMapSelectedSpecies + ' · ' : ''}${regions.length===1?'WMU '+regions[0]:regions.length+' WMUs'}`;\n""",
    """  if (title) {\n    const zoneLabel = _fullMapSelectedLEHZone ? ` · ${_fullMapSelectedLEHZone.label}` : '';\n    title.textContent = `${fullMapSelectedSpecies ? fullMapSelectedSpecies + ' · ' : ''}${regions.length===1?'WMU '+regions[0]:regions.length+' WMUs'}${zoneLabel}`;\n  }\n""",
    "results title zone label",
)

MAPS.write_text(text, encoding="utf-8")
print("LEH zone filtering applied: map-zone clicks now constrain BC draw results by WMU, species, and zone.")
