import { authorizeSpeciesMap, speciesMapUnauthorized } from '../lib/species-private.mjs'
import shp from 'shpjs'

const SOURCES = {
  grizzly2018: 'https://catalogue.data.gov.bc.ca/dataset/2bf91935-9158-4f77-9c2c-4310480e6c29/resource/6406840f-9525-4544-9c36-e725fb2e399a/download/bc_grizzly_population_estimates_2015_and_2018_by_gbpu_population_units.csv',
  grizzly2012: 'https://catalogue.data.gov.bc.ca/dataset/2bf91935-9158-4f77-9c2c-4310480e6c29/resource/4eca8c5c-ed25-46c1-835c-3d9f84b807e1/download/grizzlypopulationestimate2012.csv',
}

const ROOSEVELT_EPU = 'https://services6.arcgis.com/ubm4tcTYICKBpist/arcgis/rest/services/EPU_Density_Trends_and_Risk/FeatureServer/0'
const ROOSEVELT_1990 = 'https://a100.gov.bc.ca/pub/acat/documents/r40140/BAPID_6347_M_CECA_RO_POLY_1990_1391733020039_1732534014.zip'
const CARIBOU_1990 = 'https://a100.gov.bc.ca/pub/acat/documents/r40140/BAPID_6360_M_RATA_POLY_1990_1391796701810_1796329109.zip'
const ROCKY_ELK_1990 = 'https://a100.gov.bc.ca/pub/acat/documents/r40140/BAPID_6346_M_CECA_NE_POLY_1990_1391732986878_1732534014.zip'
const ROOSEVELT_ABUNDANCE = 'https://services6.arcgis.com/ubm4tcTYICKBpist/arcgis/rest/services/SBOT_Roosevelt_Elk_Population_Abundance_2013_to_2023/FeatureServer/4'

// The archive includes contradictory rows (for example HSV=M with NOT PRESENT).
// Only return rows whose explicit density description agrees with its class.
export function filterHistoricalRoosevelt(collection) {
  const expected = { L: '1 ELK PER 10-250 SQ KM', M: '1 ELK PER 2.5-10 SQ KM', H: 'OVER 1 ELK PER 2.5 SQ KM' }
  if (collection?.type !== 'FeatureCollection' || !Array.isArray(collection.features)) throw new Error('Invalid historical archive')
  const features = collection.features.filter(feature => {
    const p = feature?.properties || {}
    return expected[p.HSV] && String(p.Density_Co || '').trim().toUpperCase() === expected[p.HSV] && ['Polygon', 'MultiPolygon'].includes(feature.geometry?.type)
  }).map(feature => ({ type:'Feature', geometry:feature.geometry, properties:{ historical_class:feature.properties.HSV } }))
  if (!features.length) throw new Error('Historical archive contains no unambiguous range polygons')
  return { type:'FeatureCollection', features, year:1990 }
}

export function filterHistoricalCaribou(collection) {
  const expected = { L:'1 CARIBOU PER 25-250 SQ KM', M:'1 CARIBOU PER 3.4-25 SQ KM', H:'OVER 1 CARIBOU PER 3.4 SQ KM' }
  if (collection?.type !== 'FeatureCollection' || !Array.isArray(collection.features)) throw new Error('Invalid historical archive')
  const features = collection.features.filter(feature => {
    const p = feature?.properties || {}
    return expected[p.HSV] && String(p.Density_Co || '').trim().toUpperCase() === expected[p.HSV] && ['Polygon', 'MultiPolygon'].includes(feature.geometry?.type)
  }).map(feature => ({ type:'Feature', geometry:feature.geometry, properties:{ historical_class:feature.properties.HSV } }))
  if (!features.length) throw new Error('Historical archive contains no unambiguous range polygons')
  return { type:'FeatureCollection', features, year:1990 }
}

async function fetchHistoricalCaribou() {
  const response = await fetch(CARIBOU_1990, { headers:{ 'user-agent':'HuntSmartCanada/1.0' }, signal:AbortSignal.timeout(25000) })
  if (!response.ok) throw new Error(`Historical caribou archive returned ${response.status}`)
  const buffer = await response.arrayBuffer()
  if (buffer.byteLength > 8_000_000) throw new Error('Historical archive unexpectedly large')
  return filterHistoricalCaribou(await shp(buffer))
}

async function fetchHistoricalElk(source = ROOSEVELT_1990) {
  const response = await fetch(source, { headers:{ 'user-agent':'HuntSmartCanada/1.0' }, signal:AbortSignal.timeout(25000) })
  if (!response.ok) throw new Error(`Historical Roosevelt archive returned ${response.status}`)
  const buffer = await response.arrayBuffer()
  if (buffer.byteLength > 8_000_000) throw new Error('Historical archive unexpectedly large')
  return filterHistoricalRoosevelt(await shp(buffer))
}

async function fetchJson(url, label) {
  const response = await fetch(url, { headers: { 'user-agent': 'HuntSmartCanada/1.0' }, signal: AbortSignal.timeout(25000) })
  if (!response.ok) throw new Error(`${label} returned ${response.status}`)
  const payload = await response.json()
  if (payload?.error) throw new Error(payload.error.message || label)
  return payload
}

function addDerivedDensity(feature) {
  const properties = feature?.properties || {}
  const numeric = value => value == null || (typeof value === 'string' && !value.trim()) ? NaN : Number(value)
  const population = numeric(properties.POP_Est_2012)
  const areaKm2 = numeric(properties.EPU_LAND_km2)
  const density = Number.isFinite(population) && population >= 0 && Number.isFinite(areaKm2) && areaKm2 > 0
    ? population / areaKm2
    : null
  return { ...feature, properties: { ...properties, __density: density } }
}

async function fetchRooseveltEpu() {
  const params = new URLSearchParams({
    where: '1=1',
    outFields: 'OBJECTID,EPU_Unit_Name,EPU_LAND_km2,POP_Est_2012,POP_DEN_CL,POP_DEN_CL_2012,REGION_NAME',
    returnGeometry: 'true',
    returnZ: 'false',
    returnM: 'false',
    outSR: '4326',
    f: 'geojson',
    geometryPrecision: '4',
    maxAllowableOffset: '0.002',
  })
  const collection = await fetchJson(`${ROOSEVELT_EPU}/query?${params}`, 'Roosevelt elk population units')
  const features = Array.isArray(collection.features) ? collection.features.map(addDerivedDensity) : []
  if (!features.length) throw new Error('Roosevelt elk population-unit data is empty')
  return { type: 'FeatureCollection', features, densityField: '__density' }
}

export function matchRecentRoosevelt(epu, rows) {
  if (!Array.isArray(epu?.features) || !Array.isArray(rows?.features) || rows.exceededTransferLimit) throw new Error('Invalid or incomplete population records')
  const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const nameCounts = new Map()
  for (const feature of epu.features) {
    const key = normalize(feature.properties?.EPU_Unit_Name)
    nameCounts.set(key, (nameCounts.get(key) || 0) + 1)
  }
  const latest = new Map()
  const rowNames = new Map()
  for (const row of rows.features) {
    const p = row?.attributes || {}
    const key = normalize(p.EPU), year = Number(p.Year)
    if (key) {
      const names = rowNames.get(key) || new Set()
      names.add(String(p.EPU).trim().toLowerCase())
      rowNames.set(key, names)
    }
    const positive = [p.standard_estimate, p.model_estimate].some(x => x != null && String(x).trim() !== '' && Number.isFinite(Number(x)) && Number(x) > 0)
    if (!key || !Number.isInteger(year) || year < 2013 || year > 2023 || !positive) continue
    if (!latest.has(key) || year > latest.get(key)) latest.set(key, year)
  }
  const features = epu.features.filter(feature => {
    const key = normalize(feature.properties?.EPU_Unit_Name)
    return key && nameCounts.get(key) === 1 && rowNames.get(key)?.size === 1 && latest.has(key) && feature.geometry
  }).map(feature => ({ type:'Feature', geometry:feature.geometry, properties:{ unit:feature.properties.EPU_Unit_Name, survey_year:latest.get(normalize(feature.properties.EPU_Unit_Name)) } }))
  if (!features.length) throw new Error('No unambiguous recent population-unit matches')
  return { type:'FeatureCollection', features }
}

async function fetchRecentRoosevelt() {
  const params = new URLSearchParams({ where:'1=1', outFields:'EPU,Year,standard_estimate,model_estimate', returnGeometry:'false', f:'json' })
  const [epu, rows] = await Promise.all([fetchRooseveltEpu(), fetchJson(`${ROOSEVELT_ABUNDANCE}/query?${params}`, 'Roosevelt elk abundance')])
  return matchRecentRoosevelt(epu.geojson || epu, rows)
}

export const config = { path: '/species-map/api/species-data' }

export default async (req) => {
  const hash = Netlify.env.get('SPECIES_MAP_PASSWORD_HASH')
  if (!hash) return new Response('The private map is not configured.', { status: 503, headers: { 'cache-control': 'no-store' } })
  if (!(await authorizeSpeciesMap(req, hash))) return speciesMapUnauthorized()
  const url = new URL(req.url)
  const kind = url.searchParams.get('kind')

  if (kind === 'caribouHistorical1990') {
    try {
      return Response.json(await fetchHistoricalCaribou(), { headers: { 'cache-control':'private, no-store' } })
    } catch (error) {
      console.error('Historical caribou archive fetch failed:', error)
      return new Response('Historical caribou data unavailable', { status:502, headers:{ 'cache-control':'private, no-store' } })
    }
  }

  if (kind === 'rockyElkHistorical1990') {
    try {
      return Response.json(await fetchHistoricalElk(ROCKY_ELK_1990), { headers: { 'cache-control':'private, no-store' } })
    } catch (error) {
      console.error('Historical Rocky Mountain elk archive fetch failed:', error)
      return new Response('Historical Rocky Mountain elk data unavailable', { status:502, headers:{ 'cache-control':'private, no-store' } })
    }
  }

  if (kind === 'rooseveltHistorical1990') {
    try {
      return Response.json(await fetchHistoricalElk(), { headers: { 'cache-control': 'private, no-store' } })
    } catch (error) {
      console.error('Historical Roosevelt archive fetch failed:', error)
      return new Response('Historical Roosevelt data unavailable', { status: 502, headers: { 'cache-control': 'private, no-store' } })
    }
  }

  if (kind === 'rooseveltModern') {
    try {
      return Response.json(await fetchRecentRoosevelt(), { headers: { 'cache-control': 'private, no-store' } })
    } catch (error) {
      console.error('Recent Roosevelt data fetch failed:', error)
      return new Response('Recent Roosevelt data unavailable', { status: 502, headers: { 'cache-control': 'private, no-store' } })
    }
  }

  if (kind === 'rooseveltEpu') {
    try {
      const data = await fetchRooseveltEpu()
      return Response.json(data, {
        headers: {
          'cache-control': 'private, no-store',
        },
      })
    } catch (error) {
      console.error('Roosevelt EPU fetch failed:', error)
      return new Response('Roosevelt elk population-unit source unavailable', { status: 502 })
    }
  }

  const source = SOURCES[kind]
  if (!source) return new Response('Unknown dataset', { status: 404 })
  const upstream = await fetch(source, { headers: { 'user-agent': 'HuntSmartCanada/1.0' } })
  if (!upstream.ok) return new Response('Source unavailable', { status: 502 })
  return new Response(await upstream.text(), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'cache-control': 'private, no-store',
    },
  })
}
