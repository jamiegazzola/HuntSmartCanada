'use strict';

const fs = require('node:fs');

const appPath = 'site/species-map/app.js';
let app = fs.readFileSync(appPath, 'utf8');

if (app.includes('const COORDINATE_HOLD_MS = 3000;')) {
  console.log('Species-map coordinate long-press is already installed.');
  process.exit(0);
}

const initAnchor = '  window.initSpeciesMap = () => {\n';
if (!app.includes(initAnchor)) throw new Error('Species-map initialization anchor is missing');

const helper = `  function installCoordinateLongPress() {
    const mapElement = document.getElementById('map');
    if (!mapElement || !map || mapElement.dataset.coordinateHoldReady === '1') return;
    mapElement.dataset.coordinateHoldReady = '1';

    const projectionOverlay = new google.maps.OverlayView();
    projectionOverlay.onAdd = () => {};
    projectionOverlay.draw = () => {};
    projectionOverlay.onRemove = () => {};
    projectionOverlay.setMap(map);

    const toast = document.createElement('div');
    toast.textContent = 'Coordinates copied to clipboard';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.style.cssText = 'position:fixed;left:50%;bottom:calc(22px + env(safe-area-inset-bottom));z-index:10000;transform:translate(-50%,12px);opacity:0;transition:opacity .18s ease,transform .18s ease;pointer-events:none;white-space:nowrap;background:rgba(18,22,19,.94);color:#fff;padding:10px 14px;border-radius:999px;font:600 14px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.28);';
    document.body.appendChild(toast);

    let toastTimer = null;
    const showToast = () => {
      clearTimeout(toastTimer);
      toast.style.opacity = '1';
      toast.style.transform = 'translate(-50%,0)';
      toastTimer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%,12px)';
      }, 1600);
    };

    const COORDINATE_HOLD_MS = 3000;
    const COORDINATE_MOVE_TOLERANCE = 12;
    let press = null;

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

    const copyCoordinates = async (text) => {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch {}
      }
      return legacyCopy(text);
    };

    const coordinatesAt = (clientX, clientY) => {
      const projection = projectionOverlay.getProjection();
      if (!projection) return null;
      const rect = mapElement.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
      const latLng = projection.fromContainerPixelToLatLng(new google.maps.Point(x, y));
      if (!latLng) return null;
      return \`\${latLng.lat().toFixed(6)}, \${latLng.lng().toFixed(6)}\`;
    };

    const isInteractiveTarget = (target) => target instanceof Element && Boolean(target.closest(
      'button,select,a,input,textarea,[role="button"],.species-control,.era-control,.layer-note,.gm-style-cc,.gm-control-active'
    ));

    const cancelPress = () => {
      if (!press) return;
      clearTimeout(press.timer);
      press = null;
    };

    const markCopied = (state) => {
      if (state.copied) return;
      state.copied = true;
      state.pendingText = '';
      showToast();
    };

    mapElement.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || isInteractiveTarget(event.target)) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      cancelPress();
      const state = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        qualified: false,
        copied: false,
        pendingText: '',
        timer: null,
      };
      state.timer = setTimeout(() => {
        if (press !== state) return;
        state.qualified = true;
        const text = coordinatesAt(state.startX, state.startY);
        if (!text) return;
        state.pendingText = text;
        copyCoordinates(text).then((copied) => {
          if (copied) markCopied(state);
        });
      }, COORDINATE_HOLD_MS);
      press = state;
    }, { capture: true, passive: true });

    window.addEventListener('pointermove', (event) => {
      if (!press || event.pointerId !== press.pointerId) return;
      const distance = Math.hypot(event.clientX - press.startX, event.clientY - press.startY);
      if (distance > COORDINATE_MOVE_TOLERANCE) cancelPress();
    }, { capture: true, passive: true });

    window.addEventListener('pointerup', (event) => {
      if (!press || event.pointerId !== press.pointerId) return;
      const state = press;
      clearTimeout(state.timer);
      press = null;
      if (!state.qualified || state.copied || !state.pendingText) return;

      // Safari can reject an async clipboard write after a long timer because
      // transient user activation has expired. Pointer-up is a fresh trusted
      // gesture, so retry the legacy copy synchronously before the async API.
      if (legacyCopy(state.pendingText)) {
        markCopied(state);
        return;
      }
      copyCoordinates(state.pendingText).then((copied) => {
        if (copied) markCopied(state);
      });
    }, { capture: true, passive: true });

    window.addEventListener('pointercancel', cancelPress, { capture: true, passive: true });

    mapElement.addEventListener('contextmenu', (event) => {
      if (!isInteractiveTarget(event.target)) event.preventDefault();
    }, { capture: true });
  }

`;

app = app.replace(initAnchor, helper + initAnchor);

const callAnchor = '      if (!savedView) {\n';
if (!app.includes(callAnchor)) throw new Error('Species-map post-initialization anchor is missing');
app = app.replace(callAnchor, '      installCoordinateLongPress();\n\n' + callAnchor);

for (const marker of [
  'const COORDINATE_HOLD_MS = 3000;',
  "toast.textContent = 'Coordinates copied to clipboard';",
  'projection.fromContainerPixelToLatLng',
  'installCoordinateLongPress();',
]) {
  if (!app.includes(marker)) throw new Error(`Coordinate-copy patch validation failed: ${marker}`);
}

new Function(app);
fs.writeFileSync(appPath, app);
console.log('Installed 3-second species-map coordinate copy interaction.');
