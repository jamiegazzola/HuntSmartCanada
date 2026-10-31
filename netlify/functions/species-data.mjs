const SOURCES = {
  grizzly2018: 'https://catalogue.data.gov.bc.ca/dataset/2bf91935-9158-4f77-9c2c-4310480e6c29/resource/6406840f-9525-4544-9c36-e725fb2e399a/download/bc_grizzly_population_estimates_2015_and_2018_by_gbpu_population_units.csv',
  grizzly2012: 'https://catalogue.data.gov.bc.ca/dataset/2bf91935-9158-4f77-9c2c-4310480e6c29/resource/4eca8c5c-ed25-46c1-835c-3d9f84b807e1/download/grizzlypopulationestimate2012.csv',
}

export default async (req) => {
  const kind = new URL(req.url).searchParams.get('kind')
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
