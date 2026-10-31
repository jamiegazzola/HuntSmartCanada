const SOURCES = {
  grizzly2018: 'https://catalogue.data.gov.bc.ca/dataset/2bf91935-9158-4f77-9c2c-4310480e6c29/resource/6406840f-9525-4544-9c36-e725fb2e399a/download/bc_grizzly_population_estimates_2015_and_2018_by_gbpu_population_units.csv',
  grizzly2012: 'https://catalogue.data.gov.bc.ca/dataset/2bf91935-9158-4f77-9c2c-4310480e6c29/resource/4eca8c5c-ed25-46c1-835c-3d9f84b807e1/download/grizzlypopulationestimate2012.csv',
}

const ROOSEVELT_ITEM = '2774803ccefc42579458b269ad190bf8'
const ROOSEVELT_ITEM_BASE = `https://governmentofbc.maps.arcgis.com/sharing/rest/content/items/${ROOSEVELT_ITEM}`

async function fetchJson(url, label) {
  const response = await fetch(url, { headers: { 'user-agent': 'HuntSmartCanada/1.0' } })
  if (!response.ok) throw new Error(`${label} returned ${response.status}`)
  const payload = await response.json()
  if (payload?.error) throw new Error(payload.error.message || label)
  return payload
}

function densityField(features) {
  const keys = [...new Set((features || []).flatMap(feature => Object.keys(feature.properties || {})))]
  return keys.find(key => /^Indiv_per_sqkm_2023$/i.test(key)) ||
    keys.find(key => /2023/i.test(key) && /(indiv|density)/i.test(key)) ||
    keys.find(key => /(indiv.*sqkm|density)/i.test(key))
}

async function fetchRooseveltEpu() {
  const meta = await fetchJson(`${ROOSEVELT_ITEM_BASE}?f=json`, 'Roosevelt elk dataset')
  let service = meta.url
  if (!service) {
    const itemData = await fetchJson(`${ROOSEVELT_ITEM_BASE}/data?f=json`, 'Roosevelt elk item data')
    service = itemData?.operationalLayers?.find(layer => layer.url)?.url || itemData?.tables?.find(table => table.url)?.url
  }
  if (!service) throw new Error('Roosevelt elk service URL is unavailable')

  service = service.replace(/\/$/, '')
  let layerUrl = service
  if (!/\/(?:FeatureServer|MapServer)\/\d+$/i.test(service)) {
    const info = await fetchJson(`${service}?f=json`, 'Roosevelt elk service')
    const layerId = info.layers?.[0]?.id
    if (layerId == null) throw new Error('Roosevelt elk layer is unavailable')
    layerUrl = `${service}/${layerId}`
  }

  const params = new URLSearchParams({
    where: '1=1',
    outFields: '*',
    returnGeometry: 'true',
    returnZ: 'false',
    returnM: 'false',
    outSR: '4326',
    f: 'geojson',
    geometryPrecision: '4',
    maxAllowableOffset: '0.002',
  })
  const collection = await fetchJson(`${layerUrl}/query?${params}`, 'Roosevelt elk population units')
  const features = Array.isArray(collection.features) ? collection.features : []
  const field = densityField(features)
  if (!features.length || !field) throw new Error('Roosevelt elk density data is incomplete')
  return { type: 'FeatureCollection', features, densityField: field }
}

export default async (req) => {
  const url = new URL(req.url)
  const kind = url.searchParams.get('kind')

  if (kind === 'rooseveltEpu') {
    try {
      const data = await fetchRooseveltEpu()
      return Response.json(data, {
        headers: {
          'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
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
      'cache-control': 'public, max-age=86400',
    },
  })
}
