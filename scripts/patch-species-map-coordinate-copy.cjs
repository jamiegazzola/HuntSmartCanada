'use strict';

const fs = require('node:fs');

const appPath = 'site/species-map/app.js';
let app = fs.readFileSync(appPath, 'utf8');

if (app.includes('const DROP_PIN_COORDINATE_COPY = true;')) {
  console.log('Species-map drop-pin coordinate copy is already installed.');
  process.exit(0);
}

const initAnchor = '  window.initSpeciesMap = () => {\n';
if (!app.includes(initAnchor)) throw new Error('Species-map initialization anchor is missing');

const helper = `  function installDropPinCoordinateCopy() {
    if (!map || document.getElementById('coordinate-drop-pin')) return;
    const DROP_PIN_COORDINATE_COPY = true;
    let armed = false;
    let toastTimer = null;

    // Replace the built-in map-type control in the lower-left with one clean
    // HuntSmart drop-pin action.
    map.setOptions({ mapTypeControl: false });

    const style = document.createElement('style');
    style.textContent = \`
      #coordinate-drop-pin{position:fixed;left:12px;bottom:calc(22px + env(safe-area-inset-bottom));z-index:10001;width:50px;height:50px;border:1px solid rgba(255,255,255,.16);border-radius:15px;background:rgba(15,20,17,.94);color:#fff;display:grid;place-items:center;padding:0;box-shadow:0 8px 24px rgba(0,0,0,.30);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);cursor:pointer}
      #coordinate-drop-pin[aria-pressed=\"true\"]{background:#527b56;border-color:rgba(255,255,255,.28)}
      #coordinate-drop-pin svg{width:25px;height:25px;display:block;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
      #coordinate-copy-toast{position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom));z-index:10002;transform:translate(-50%,10px);opacity:0;transition:opacity .16s ease,transform .16s ease;pointer-events:none;white-space:nowrap;background:rgba(15,20,17,.96);color:#fff;padding:10px 14px;border-radius:999px;font:600 14px/1.2 -apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.28)}
      #coordinate-copy-toast.show{opacity:1;transform:translate(-50%,0)}
      .layer-note:not([hidden]){bottom:calc(84px + env(safe-area-inset-bottom,0px))}
    \`;
    document.head.appendChild(style);

    const button = document.createElement('button');
    button.id = 'coordinate-drop-pin';
    button.type = 'button';
    button.setAttribute('aria-label', 'Copy coordinates from map');
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"></path><circle cx="12" cy="10" r="2.5"></circle></svg>';
    document.body.appendChild(button);

    const toast = document.createElement('div');
    toast.id = 'coordinate-copy-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = 'Coordinates copied';
    document.body.appendChild(toast);

    const setArmed = (value) => {
      armed = value;
      button.setAttribute('aria-pressed', value ? 'true' : 'false');
    };

    const showToast = () => {
      clearTimeout(toastTimer);
      toast.classList.add('show');
      toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
    };

    const legacyCopy = (text) => {
      const field = document.createElement('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none;';
      document.body.appendChild(field);
      field.focus({ preventScroll: true });
      field.select();
      field.setSelectionRange(0, text.length);
      let copied = false;
      try { copied = document.execCommand('copy'); } catch {}
      field.remove();
      return copied;
    };

    const copyCoordinates = (text) => {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(showToast).catch(() => {
          if (legacyCopy(text)) showToast();
        });
        return;
      }
      if (legacyCopy(text)) showToast();
    };

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      setArmed(!armed);
    });

    map.addListener('click', (event) => {
      if (!armed || !event.latLng) return;
      setArmed(false);
      const text = \`\${event.latLng.lat().toFixed(6)}, \${event.latLng.lng().toFixed(6)}\`;
      copyCoordinates(text);
    });
  }

`;

app = app.replace(initAnchor, helper + initAnchor);

const callAnchor = '      if (!savedView) {\n';
if (!app.includes(callAnchor)) throw new Error('Species-map post-initialization anchor is missing');
app = app.replace(callAnchor, '      installDropPinCoordinateCopy();\n\n' + callAnchor);

for (const marker of [
  'const DROP_PIN_COORDINATE_COPY = true;',
  "button.id = 'coordinate-drop-pin';",
  "toast.textContent = 'Coordinates copied';",
  "map.setOptions({ mapTypeControl: false });",
  "map.addListener('click'",
  'setTimeout(() => toast.classList.remove(\'show\'), 3000)',
  'installDropPinCoordinateCopy();',
]) {
  if (!app.includes(marker)) throw new Error(`Drop-pin coordinate patch validation failed: ${marker}`);
}

if (app.includes('COORDINATE_HOLD_MS') || app.includes('installCoordinateLongPress')) {
  throw new Error('Legacy long-press coordinate interaction is still present');
}

new Function(app);
fs.writeFileSync(appPath, app);
console.log('Installed drop-pin coordinate copy interaction.');
