import { authorizeSpeciesMap, speciesMapUnauthorized } from '../lib/species-private.mjs'

const SOURCES = {
  grizzly2018: 'https://catalogue.data.gov.bc.ca/dataset/2bf91935-9158-4f77-9c2c-4310480e6c29/resource/6406840f-9525-4544-9c36-e725fb2e399a/download/bc_grizzly_population_estimates_2015_and_2018_by_gbpu_population_units.csv',
  grizzly2012: 'https://catalogue.data.gov.bc.ca/dataset/2bf91935-9158-4f77-9c2c-4310480e6c29/resource/4eca8c5c-ed25-46c1-835c-3d9f84b807e1/download/grizzlypopulationestimate2012.csv',
}

const ROOSEVELT_EPU = 'https://services6.arcgis.com/ubm4tcTYICKBpist/arcgis/rest/services/EPU_Density_Trends_and_Risk/FeatureServer/0'

async function fetchJson(url, label) {
  const response = await fetch(url, { headers: { 'user-agent': 'HuntSmartCanada/1.0' } })
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

export const config = { path: '/species-map/api/species-data' }

export default async (req) => {
  const hash = Netlify.env.get('SPECIES_MAP_PASSWORD_HASH')
  if (!hash) return new Response('The private map is not configured.', { status: 503, headers: { 'cache-control': 'no-store' } })
  if (!(await authorizeSpeciesMap(req, hash))) return speciesMapUnauthorized()
  const url = new URL(req.url)
  const kind = url.searchParams.get('kind')

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
