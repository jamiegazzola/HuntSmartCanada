// Runtime-injected Google Maps browser key. Keep the key in Netlify Functions env, never in Git.
// Redeploy marker: Google Maps credential rotation 2026-10-30.
export default async () => {
  const key = Netlify.env.get("GOOGLE_MAPS_API_KEY")
  if (!key) {
    return new Response("window.GOOGLE_MAPS_API_KEY='';", {
      status: 503,
      headers: { "content-type": "application/javascript; charset=utf-8", "cache-control": "no-store" },
    })
  }

  return new Response(`window.GOOGLE_MAPS_API_KEY=${JSON.stringify(key)};`, {
    headers: { "content-type": "application/javascript; charset=utf-8", "cache-control": "public, max-age=300" },
  })
}
