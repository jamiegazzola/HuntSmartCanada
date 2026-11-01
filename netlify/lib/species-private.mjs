// Password hashes are supplied at runtime, never stored in the repository.
export async function authorizeSpeciesMap(request, expectedHash) {
  if (!/^[a-f0-9]{64}$/.test(expectedHash || '')) return false;
  const header = request.headers.get('authorization') || '';
  if (!/^Basic\s+/i.test(header)) return false;
  let credentials;
  try { credentials = atob(header.replace(/^Basic\s+/i, '')); } catch { return false; }
  const separator = credentials.indexOf(':');
  if (separator < 0 || credentials.slice(0, separator) !== 'jamie') return false;
  const password = credentials.slice(separator + 1);
  if (!password || password.length > 256) return false;
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password)));
  const actual = Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('');
  let difference = 0;
  for (let i = 0; i < 64; i += 1) difference |= actual.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  return difference === 0;
}

export function speciesMapUnauthorized() {
  return new Response('This species map is private.', { status: 401, headers: {
    'WWW-Authenticate': 'Basic realm="HuntSmart Species Map", charset="UTF-8"',
    'Cache-Control': 'private, no-store', 'X-Species-Private': 'v1', 'X-Robots-Tag': 'noindex, nofollow, noarchive',
  } });
}
