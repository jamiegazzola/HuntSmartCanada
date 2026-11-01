import { authorizeSpeciesMap, speciesMapUnauthorized } from '../lib/species-private.mjs';

export default async (request, context) => {
  const hash = Netlify.env.get('SPECIES_MAP_PASSWORD_HASH');
  if (!hash) return new Response('The private map is not configured.', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  if (!(await authorizeSpeciesMap(request, hash))) return speciesMapUnauthorized();
  const response = await context.next();
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

export const config = { path: ['/species-map', '/species-map/*', '/.netlify/functions/species-data'], onError: 'fail' };
