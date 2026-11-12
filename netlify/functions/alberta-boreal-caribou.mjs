// Environment and Climate Change Canada's publicly licensed federal boreal
// caribou range polygons. This does NOT fetch Alberta provincial sensitivity
// layers (commercial map distribution needs separate permission).
const SOURCE = 'https://maps-cartes.ec.gc.ca/arcgis/rest/services/STB_DGST/DisturbanceFootprintUpdatedFor2020/MapServer/4/query';

export default async function albertaBorealCaribou(request) {
  if (request.method !== 'GET') return new Response('Method not allowed', { status:405, headers:{ allow:'GET' } });
  const url = new URL(SOURCE);
  url.searchParams.set('where', "CODE LIKE 'AB%'");
  url.searchParams.set('outFields', 'CODE,HERD');
  url.searchParams.set('outSR', '4326');
  url.searchParams.set('maxAllowableOffset', '0.003');
  url.searchParams.set('f', 'geojson');

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: { accept:'application/geo+json, application/json' },
    });
    if (!response.ok) throw new Error('Federal GIS service unavailable');
    const payload = await response.json();
    if (payload?.type !== 'FeatureCollection' || !Array.isArray(payload.features)) {
      throw new Error('Unexpected federal GIS format');
    }
    const features = payload.features.filter(feature =>
      /^AB(?:[1-9]|1[0-2])$/.test(feature.properties?.CODE || '') &&
      ['Polygon','MultiPolygon'].includes(feature.geometry?.type));
    if (!features.length || features.length > 20) throw new Error('Unexpected caribou range count');
    return new Response(JSON.stringify({ type:'FeatureCollection', features }), {
      headers: {
        'content-type': 'application/geo+json; charset=utf-8',
        'cache-control': 'public, max-age=300, s-maxage=86400',
        'netlify-cdn-cache-control': 'public, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error('Alberta federal caribou range fetch failed:', error?.message);
    return new Response('Federal caribou range temporarily unavailable', {
      status: 502, headers: { 'content-type':'text/plain; charset=utf-8', 'cache-control':'no-store' },
    });
  }
}
