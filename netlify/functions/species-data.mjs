const SOURCES = {
  grizzly2018: 'https://catalogue.data.gov.bc.ca/dataset/2bf91935-9158-4f77-9c2c-4310480e6c29/resource/6406840f-9525-4544-9c36-e725fb2e399a/download/bc_grizzly_population_estimates_2015_and_2018_by_gbpu_population_units.csv',
  grizzly2012: 'https://catalogue.data.gov.bc.ca/dataset/2bf91935-9158-4f77-9c2c-4310480e6c29/resource/4eca8c5c-ed25-46c1-835c-3d9f84b807e1/download/grizzlypopulationestimate2012.csv',
}

const ROOSEVELT_WSI = 'https://delivery.maps.gov.bc.ca/arcgis/rest/services/whse/bcgw_pub_whse_wildlife_inventory/MapServer/12'

async function fetchRooseveltObservations(period) {
  const cutoff = 2000
  const yearClause = period === 'historic' ? `OBSERVATION_YEAR < ${cutoff}` : `OBSERVATION_YEAR >= ${cutoff}`
  const where = `SPECIES_ENGLISH_NAME = 'Roosevelt Elk' AND ${yearClause}`
  const features = []
  let offset = 0

  for (let page = 0; page < 25; page += 1) {
    const params = new URLSearchParams({
      where,
      outFields: 'OBJECTID,OBSERVATION_YEAR,OBSERVED_NUMBER',
      returnGeometry: 'true',
      outSR: '4326',
      f: 'geojson',
      resultOffset: String(offset),
      resultRecordCount: '1000',
      orderByFields: 'OBJECTID',
      geometryPrecision: '5',
    })
    const upstream = await fetch(`${ROOSEVELT_WSI}/query?${params}`, {
      headers: { 'user-agent': 'HuntSmartCanada/1.0' },
    })
    if (!upstream.ok) throw new Error(`BC Wildlife Species Inventory returned ${upstream.status}`)
    const payload = await upstream.json()
    if (payload.error) throw new Error(payload.error.message || 'BC Wildlife Species Inventory query failed')
    const batch = Array.isArray(payload.features) ? payload.features : []
    features.push(...batch)
    if (!payload.exceededTransferLimit && batch.length < 1000) break
    if (!batch.length) break
    offset += batch.length
  }

  return { type: 'FeatureCollection', features }
}

export default async (req) => {
  const url = new URL(req.url)
  const kind = url.searchParams.get('kind')

  if (kind === 'rooseveltObservations') {
    try {
      const period = url.searchParams.get('period') === 'historic' ? 'historic' : 'modern'
      const data = await fetchRooseveltObservations(period)
      return Response.json(data, {
        headers: {
          'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        },
      })
    } catch (error) {
      console.error('Roosevelt observation fetch failed:', error)
      return new Response('Roosevelt observation source unavailable', { status: 502 })
    }
  }

  const source = SOURCES[kind]
  if (!source) return new Response('Unknown dataset', { status: 404 })
  const upstream = await fetch(source, { headers: { 'user-agent': 'HuntSmartCanada/1.0' } })
  if (!upstream.ok) return new Response('Source unavailable', { status: 502 })
  return new Response(await upstream.text(), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'cache-control': 'public, max-age=86400',
    },
  })
}
