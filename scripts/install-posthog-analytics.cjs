'use strict';
// Installs privacy-conscious PostHog on every generated public HTML page.
// Run after all other HTML generators so research pages are included.
const fs = require('node:fs');
const path = require('node:path');
const projectToken = process.env.HUNTSMART_POSTHOG_PROJECT_TOKEN;
const apiHost = process.env.HUNTSMART_POSTHOG_HOST;
if (!projectToken || !apiHost) {
  if (process.env.CONTEXT === 'production') throw Error('Production PostHog env configuration is missing');
  console.log('[posthog] No build-time configuration; skipping for local/preview');
  process.exit(0);
}
if (!/^phc_[A-Za-z0-9]+$/.test(projectToken)) throw Error('Invalid PostHog public project token');
if (!/^https:\/\/[A-Za-z0-9.-]+\.posthog\.com$/.test(apiHost)) throw Error('Invalid PostHog ingestion host');
const site = path.resolve('site');
if (!fs.existsSync(site)) throw Error('Built site/ directory is missing');
const source = "(function () {\n  'use strict';\n\n  // Only production-origin visits count; skip preview deploys and localhost.\n  const host = window.location.hostname.toLowerCase();\n  if (host !== 'huntsmartcanada.ca' && host !== 'www.huntsmartcanada.ca') return;\n  if (window.posthog && window.posthog.__SV) return;\n\n  // PostHog's browser snippet queues captures until its SDK has loaded.\n  !function (t, e) {\n    var o, n, p, r;\n    e.__SV || (window.posthog = e, e._i = [], e.init = function (i, s, a) {\n      function g(t, e) {\n        var o = e.split('.');\n        if (o.length === 2) { t = t[o[0]]; e = o[1]; }\n        t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); };\n      }\n      p = t.createElement('script');\n      p.type = 'text/javascript';\n      p.async = true;\n      p.crossOrigin = 'anonymous';\n      p.src = s.api_host.replace('.i.posthog.com', '-assets.i.posthog.com') + '/static/array.js';\n      r = t.getElementsByTagName('script')[0];\n      r.parentNode.insertBefore(p, r);\n      var u = e;\n      if (a !== undefined) { u = e[a] = []; } else { a = 'posthog'; }\n      u.people = u.people || [];\n      u.toString = function (t) {\n        var e = 'posthog';\n        if (a !== 'posthog') e += '.' + a;\n        if (!t) e += ' (stub)';\n        return e;\n      };\n      u.people.toString = function () { return u.toString(1) + '.people (stub)'; };\n      o = 'capture identify alias people.set people.set_once'.split(' ');\n      for (n = 0; n < o.length; n++) g(u, o[n]);\n      e._i.push([i, s, a]);\n    }, e.__SV = 1);\n  }(document, window.posthog || []);\n\n  window.posthog.init(__POSTHOG_TOKEN__, {\n    api_host: __POSTHOG_HOST__,\n    autocapture: false,\n    capture_pageview: true,\n    capture_pageleave: true,\n    disable_session_recording: true,\n    advanced_disable_flags: true,\n    person_profiles: 'identified_only',\n    before_send: function (event) {\n      if (event && event.properties) {\n        // Avoid exporting tokens, search terms or other URL query parameters.\n        ['$current_url', '$initial_current_url', '$referrer', '$initial_referrer'].forEach(function (key) {\n          var value = event.properties[key];\n          if (typeof value !== 'string') return;\n          try {\n            var url = new URL(value, window.location.origin);\n            if (url.protocol === 'http:' || url.protocol === 'https:') {\n              event.properties[key] = url.origin + url.pathname;\n            }\n          } catch (_) {}\n        });\n      }\n      return event;\n    }\n  });\n\n  // Existing GA4 events may have queued before this deferred loader ran.\n  var pending = window.__hsPosthogPending || [];\n  window.__hsPosthogPending = [];\n  pending.forEach(function (item) {\n    if (Array.isArray(item) && item.length === 2) window.posthog.capture(item[0], item[1]);\n  });\n})();";
const output = source.replace('__POSTHOG_TOKEN__', JSON.stringify(projectToken))
  .replace('__POSTHOG_HOST__', JSON.stringify(apiHost));
fs.writeFileSync(path.join(site, 'hs-posthog.js'), output, 'utf8');
const marker = '<script defer src="/hs-posthog.js?v=20261119"></script>';
let instrumented = 0;
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) { walk(filename); continue; }
    if (!entry.isFile() || !filename.endsWith('.html')) continue;
    const relative = path.relative(site, filename).split(path.sep).join('/');
    if (relative === 'admin.html' || relative.startsWith('admin/') || relative.startsWith('species-map/')) continue;
    const html = fs.readFileSync(filename, 'utf8');
    if (!/<\/body\s*>/i.test(html)) continue;
    if (!html.includes(marker)) fs.writeFileSync(filename, html.replace(/<\/body\s*>/i, marker + '\n</body>'), 'utf8');
    instrumented++;
  }
}
walk(site);
if (!instrumented) throw Error('PostHog installation found no public HTML pages');
console.log('[posthog] Instrumented ' + instrumented + ' public HTML pages (production origin only)');