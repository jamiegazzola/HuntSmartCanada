import { authorizeSpeciesMap, speciesMapUnauthorized } from '../lib/species-private.mjs'
import shp from 'shpjs'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'

const SOURCES = {
  grizzly2018: 'https://catalogue.data.gov.bc.ca/dataset/2bf91935-9158-4f77-9c2c-4310480e6c29/resource/6406840f-9525-4544-9c36-e725fb2e399a/download/bc_grizzly_population_estimates_2015_and_2018_by_gbpu_population_units.csv',
  grizzly2012: 'https://catalogue.data.gov.bc.ca/dataset/2bf91935-9158-4f77-9c2c-4310480e6c29/resource/4eca8c5c-ed25-46c1-835c-3d9f84b807e1/download/grizzlypopulationestimate2012.csv',
}

const ROOSEVELT_EPU = 'https://services6.arcgis.com/ubm4tcTYICKBpist/arcgis/rest/services/EPU_Density_Trends_and_Risk/FeatureServer/0'
const ROOSEVELT_1990 = 'https://a100.gov.bc.ca/pub/acat/documents/r40140/BAPID_6347_M_CECA_RO_POLY_1990_1391733020039_1732534014.zip'
const CARIBOU_1990 = 'https://a100.gov.bc.ca/pub/acat/documents/r40140/BAPID_6360_M_RATA_POLY_1990_1391796701810_1796329109.zip'
const ROCKY_ELK_1990 = 'https://a100.gov.bc.ca/pub/acat/documents/r40140/BAPID_6346_M_CECA_NE_POLY_1990_1391732986878_1732534014.zip'
const HISTORICAL_ARCHIVES = {
  stone: ['https://a100.gov.bc.ca/pub/acat/documents/r40140/Bapid_6384_M_OVDA_ST_POLY_1988_1391797729746_1796329109.zip', 'sheep'],
  dall: ['https://a100.gov.bc.ca/pub/acat/documents/r40140/Bapid_6385_M_OVDA_DA_POLY_1988_1391797828526_1796329109.zip', 'sheep'],
  rocky: ['https://a100.gov.bc.ca/pub/acat/documents/r40140/Bapid_6386_M_OVCA_CN_POLY_1988_1391797871812_1796329109.zip', 'sheep'],
  california: ['https://a100.gov.bc.ca/pub/acat/documents/r40140/Bapid_6387_M_OVCA_CA_POLY_1988_1391797916399_1796329109.zip', 'sheep'],
  blackbear: ['https://a100.gov.bc.ca/pub/acat/documents/r40140/BAPID_6342_M_URAM_POLY_1988_1391732862892_1732534014.zip', 'bear'],
  goat: ['https://a100.gov.bc.ca/pub/acat/documents/r40140/Bapid_6380_M_ORAM_POLY_1990_1391797364512_1796329109.zip', 'goat'],
  whitetail: ['https://a100.gov.bc.ca/pub/acat/documents/r40140/BAPID_6355_M_ODVI_POLY_1990_1391733353873_1732534014.zip', 'whitetail'],
  moose: ['https://a100.gov.bc.ca/pub/acat/documents/r40140/BAPID_6345_M_ALAM_POLY_1990_1391732955419_1732534014.zip', 'moose'],
  mule: ['https://a100.gov.bc.ca/pub/acat/documents/r40140/BAPID_6352_M_ODHE_HE_POLY_1988_1391733247116_1732534014.zip', 'mule'],
  blacktail: ['https://a100.gov.bc.ca/pub/acat/documents/r40140/BAPID_6351_M_ODHE_SI_POLY_1988_1391733203021_1732534014.zip', 'mule'],
}
const CARIBOU_SEASONAL = {
  summer: 'https://www2.gov.bc.ca/assets/gov/environment/plants-animals-and-ecosystems/wildlife-wildlife-habitat/regional-wildlife/northeast-region/caribou/high_elevation_summer_range.zip',
  winter: 'https://www2.gov.bc.ca/assets/gov/environment/plants-animals-and-ecosystems/wildlife-wildlife-habitat/regional-wildlife/northeast-region/caribou/high_elevation_winter_range.zip',
}
const SEASONAL_ARCHIVE_SHA256 = { summer:'dab23fc8f5096ba7e08db227ca7a0e303fd2d8e721862a93f9e482f195b5d3fb', winter:'740ee8800f747aea7977867486c479e9de6e7a45eaf70eb02016d875f74a34ac' }
// Verified against the exact archives above: retain source geometry where display
// simplification would turn an otherwise-valid polygon invalid.
const KEEP_SOURCE_GEOMETRY = {
  summer:new Set([262,279,1351,1392,2084,2251,2382,3075,3219,3291,3610,3615,4371,4378,4393,4397,4411,4443,4668,4859]),
  winter:new Set([711,3866,3877,3881,3890,3892,4968,5749,5814,6223,6234]),
}
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

export function filterHistoricalSpecies(collection, taxon) {
  if (collection?.type !== 'FeatureCollection' || !Array.isArray(collection.features)) throw new Error('Invalid historical archive')
  const expected = taxon === 'sheep' ? {
    L: ['1 SHEEP PER 5-250 SQ. KILOMETRES'], M:['1 SHEEP PER 1.3-5 SQ. KILOMETRES', 'ONE SHEEP PER 1.3-5 SQ. KILOMETRES'], H:['OVER 1 SHEEP PER 1.3 SQ. KILOMETRES'],
  } : taxon === 'bear' ? {
    L:['1 BLACK BEAR PER 50-500 SQ. KM'], M:['1 BLACK BEAR PER 8-50 SQ. KM'], H:['OVER 1 BLACK BEAR PER 8 SQ. KM'],
  } : taxon === 'goat' ? {
    L:['1 GOAT PER 13-260 SQ. KILOMETRES'], M:['1 GOAT PER 3-13 SQ. KILOMETRES'], H:['OVER 1 GOAT PER 3 SQ. KILOMETRES'],
  } : taxon === 'whitetail' ? {
    L:['1 DEER PER 5-518 SQ. KILOMETRES'], M:['1 DEER PER 0.5-5 SQ. KILOMETRES'], H:['OVER 1 DEER PER 0.5 SQ. KILOMETRES'],
  } : taxon === 'moose' ? {
    L:['1 MOOSE PER 10-260 SQ KM'], M:['1 MOOSE PER 1.3-10 SQ KM'], H:['OVER 1 MOOSE PER 1.3 SQ KM'],
  } : taxon === 'mule' ? {
    L:['1 DEER PER 2-200 SQ KM'], M:['1 DEER PER 0.2-2 SQ KM'], H:['OVER 1 DEER PER 0.2 SQ KM'],
  } : null
  if (!expected) throw new Error('Unknown historical taxon')
  const features = collection.features.filter(f => expected[f.properties?.HSV]?.includes(String(f.properties?.Density_Co || '').trim().toUpperCase()) && ['Polygon','MultiPolygon'].includes(f.geometry?.type)).map(f => ({ type:'Feature', geometry:f.geometry, properties:{ historical_class:f.properties.HSV } }))
  if (!features.length) throw new Error('Historical archive contains no unambiguous range polygons')
  return { type:'FeatureCollection', features, year:['goat','whitetail','moose'].includes(taxon) ? 1990 : 1988 }
}

async function fetchHistoricalSpecies(kind) {
  const [url, taxon] = HISTORICAL_ARCHIVES[kind]
  const response = await fetch(url, { headers:{ 'user-agent':'HuntSmartCanada/1.0' }, signal:AbortSignal.timeout(25000) })
  if (!response.ok) throw new Error(`Historical archive returned ${response.status}`)
  const buffer = await response.arrayBuffer()
  if (buffer.byteLength > 8_000_000) throw new Error('Historical archive unexpectedly large')
  return filterHistoricalSpecies(await shp(buffer), taxon)
}

async function fetchHistoricalCaribou() {
  const response = await fetch(CARIBOU_1990, { headers:{ 'user-agent':'HuntSmartCanada/1.0' }, signal:AbortSignal.timeout(25000) })
  if (!response.ok) throw new Error(`Historical caribou archive returned ${response.status}`)
  const buffer = await response.arrayBuffer()
  if (buffer.byteLength > 8_000_000) throw new Error('Historical archive unexpectedly large')
  return filterHistoricalCaribou(await shp(buffer))
}

// Simplification is for display only. The source remains authoritative.
function simplifySeasonalRing(ring) {
  if (ring.length <= 5) return ring.map(p => [Number(p[0].toFixed(5)), Number(p[1].toFixed(5))])
  const points = ring.slice(0, -1), keep = new Uint8Array(points.length), stack = [[0, points.length - 1]]
  keep[0] = keep[points.length - 1] = 1
  const tolerance2 = 0.0006 ** 2
  while (stack.length) {
    const [first, last] = stack.pop(), a = points[first], b = points[last]
    const dx = b[0] - a[0], dy = b[1] - a[1], length2 = dx * dx + dy * dy
    let furthest = -1, max = tolerance2
    for (let i = first + 1; i < last; i++) {
      const p = points[i], t = length2 ? Math.max(0, Math.min(1, ((p[0]-a[0])*dx + (p[1]-a[1])*dy) / length2)) : 0
      const x = p[0]-a[0]-t*dx, y = p[1]-a[1]-t*dy, distance = x*x+y*y
      if (distance > max) { max = distance; furthest = i }
    }
    if (furthest >= 0) { keep[furthest] = 1; stack.push([first, furthest], [furthest, last]) }
  }
  const reduced = points.filter((_, i) => keep[i])
  const result = (reduced.length >= 3 ? reduced : points).map(p => [Number(p[0].toFixed(5)), Number(p[1].toFixed(5))])
  result.push(result[0])
  return result
}
export function filterSeasonalCaribou(collection, season) {
  if (collection?.type !== 'FeatureCollection' || !Array.isArray(collection.features)) throw new Error('Invalid seasonal caribou archive')
  if (!KEEP_SOURCE_GEOMETRY[season]) throw new Error('Invalid season')
  const features = collection.features.flatMap((f, index) => {
    if (!['High', 'Very High'].includes(f.properties?.Quality) || !['Polygon', 'MultiPolygon'].includes(f.geometry?.type)) return []
    const coordinates = KEEP_SOURCE_GEOMETRY[season].has(index) ? f.geometry.coordinates : f.geometry.type === 'Polygon' ? f.geometry.coordinates.map(simplifySeasonalRing) : f.geometry.coordinates.map(poly => poly.map(simplifySeasonalRing))
    return [{ type:'Feature', properties:{ herd:f.properties.Herd, quality:f.properties.Quality }, geometry:{ type:f.geometry.type, coordinates } }]
  })
  if (!features.length) throw new Error('Seasonal archive contains no mapped high-value habitat')
  return { type:'FeatureCollection', features, source_year:2017 }
}

async function fetchSeasonalCaribou(season) {
  const response = await fetch(CARIBOU_SEASONAL[season], { headers:{ 'user-agent':'HuntSmartCanada/1.0' }, signal:AbortSignal.timeout(25000) })
  if (!response.ok) throw new Error(`Seasonal caribou archive returned ${response.status}`)
  const buffer = await response.arrayBuffer()
  if (buffer.byteLength > 12_000_000) throw new Error('Seasonal archive unexpectedly large')
  if (createHash('sha256').update(Buffer.from(buffer)).digest('hex') !== SEASONAL_ARCHIVE_SHA256[season]) throw new Error('Seasonal archive changed; source requires revalidation')
  return filterSeasonalCaribou(await shp(buffer), season)
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
  const numeric = value => value == null || (typeof value === 'string' && !value.trim()) ? NaN : Number(value)
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
    const standard = numeric(p.standard_estimate)
    const model = numeric(p.model_estimate)
    const estimate = standard > 0 ? standard : model > 0 ? model : null
    if (!key || !Number.isInteger(year) || year < 2013 || year > 2023 || estimate == null) continue
    const previous = latest.get(key)
    if (!previous || year > previous.year) latest.set(key, { year, estimate, source:standard > 0 ? 'standard' : 'model' })
  }
  const features = epu.features.flatMap(feature => {
    const key = normalize(feature.properties?.EPU_Unit_Name)
    const record = latest.get(key)
    const areaKm2 = numeric(feature.properties?.EPU_LAND_km2)
    if (!key || nameCounts.get(key) !== 1 || rowNames.get(key)?.size !== 1 || !record || !feature.geometry || !Number.isFinite(areaKm2) || areaKm2 <= 0) return []
    const density = record.estimate / areaKm2
    if (!Number.isFinite(density) || density <= 0) return []
    return [{
      type:'Feature',
      geometry:feature.geometry,
      properties:{
        unit:feature.properties.EPU_Unit_Name,
        survey_year:record.year,
        estimate:record.estimate,
        estimate_source:record.source,
        area_km2:areaKm2,
        density_per_km2:Number(density.toFixed(6)),
      },
    }]
  })
  if (!features.length) throw new Error('No unambiguous recent population-unit matches')
  const densities = features.map(feature => feature.properties.density_per_km2).sort((a, b) => a - b)
  const q = p => densities[Math.min(densities.length - 1, Math.floor((densities.length - 1) * p))]
  const cuts = [q(0.25), q(0.5), q(0.75)]
  for (const feature of features) {
    const density = feature.properties.density_per_km2
    feature.properties.heat_class = density > cuts[2] ? 4 : density > cuts[1] ? 3 : density > cuts[0] ? 2 : 1
  }
  return { type:'FeatureCollection', features, density_field:'density_per_km2', density_scale:'relative_quartile', density_cuts:cuts }
}

async function fetchRecentRoosevelt() {
  const params = new URLSearchParams({ where:'1=1', outFields:'EPU,Year,standard_estimate,model_estimate', returnGeometry:'false', f:'json' })
  const [epu, rows] = await Promise.all([fetchRooseveltEpu(), fetchJson(`${ROOSEVELT_ABUNDANCE}/query?${params}`, 'Roosevelt elk abundance')])
  return matchRecentRoosevelt(epu.geojson || epu, rows)
}

export const config = { path: '/species-map/api/species-data' }

function privateJson(data, request) {
  const body = JSON.stringify(data)
  const headers = { 'cache-control':'private, no-store', 'content-type':'application/json; charset=utf-8', 'vary':'Accept-Encoding' }
  if (Buffer.byteLength(body) > 1_000_000 && /(?:^|[,\s])gzip(?:[,;\s]|$)/i.test(request.headers.get('accept-encoding') || '')) {
    const compressed = gzipSync(Buffer.from(body), { level:6 })
    if (compressed.byteLength > 4_000_000) throw new Error('Compressed response exceeds safe size')
    return new Response(compressed, { headers:{ ...headers, 'content-encoding':'gzip' } })
  }
  if (Buffer.byteLength(body) > 5_500_000) throw new Error('Response too large for an uncompressed client')
  return new Response(body, { headers })
}

export default async (req) => {
  const hash = Netlify.env.get('SPECIES_MAP_PASSWORD_HASH')
  if (!hash) return new Response('The private map is not configured.', { status: 503, headers: { 'cache-control': 'no-store' } })
  if (!(await authorizeSpeciesMap(req, hash))) return speciesMapUnauthorized()
  const url = new URL(req.url)
  const kind = url.searchParams.get('kind')

  if (kind === 'historicalSpecies') {
    const taxon = url.searchParams.get('taxon')
    if (!Object.hasOwn(HISTORICAL_ARCHIVES, taxon)) return new Response('Unknown dataset', { status:404, headers:{ 'cache-control':'private, no-store' } })
    try {
      return privateJson(await fetchHistoricalSpecies(taxon), req)
    } catch (error) {
      console.error('Historical species archive fetch failed:', error)
      return new Response('Historical data unavailable', { status:502, headers:{ 'cache-control':'private, no-store' } })
    }
  }

  if (kind === 'caribouSummer' || kind === 'caribouWinter') {
    try {
      return privateJson(await fetchSeasonalCaribou(kind === 'caribouSummer' ? 'summer' : 'winter'), req)
    } catch (error) {
      console.error('Seasonal caribou archive fetch failed:', error)
      return new Response('Seasonal caribou data unavailable', { status:502, headers:{ 'cache-control':'private, no-store' } })
    }
  }

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