'use strict';

const fs = require('node:fs');

const appPath = 'site/species-map/app.js';
let app = fs.readFileSync(appPath, 'utf8');

if (app.includes('const COORDINATE_HOLD_TOUCH_V2 = true;')) {
  console.log('Species-map coordinate long-press v2 is already installed.');
  process.exit(0);
}

const initAnchor = '  window.initSpeciesMap = () => {\n';
if (!app.includes(initAnchor)) throw new Error('Species-map initialization anchor is missing');

const helper = `  function installCoordinateLongPress() {
    const mapElement = document.getElementById('map');
    if (!mapElement || !map || mapElement.dataset.coordinateHoldReady === '2') return;
    mapElement.dataset.coordinateHoldReady = '2';

    // Prevent iOS Safari's native long-press callout from taking ownership of
    // a stationary touch. This does not disable Google Maps drag/pinch gestures.
    mapElement.style.setProperty('-webkit-touch-callout', 'none');
    mapElement.style.setProperty('-webkit-user-select', 'none');
    mapElement.style.userSelect = 'none';

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
    const COORDINATE_MOVE_TOLERANCE = 14;
    const COORDINATE_HOLD_TOUCH_V2 = true;
    let pointerPress = null;
    let touchPress = null;

    const legacyCopy = (text) => {
      const field = document.createElement('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.setAttribute('aria-hidden', 'true');
      field.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;';
      document.body.appendChild(field);
      field.focus({ preventScroll: true });
      field.select();
      field.setSelectionRange(0, text.length);
      let copied = false;
      try { copied = document.execCommand('copy'); } catch {}
      field.remove();
      return copied;
    };

    const copyFromTrustedRelease = (text) => {
      // execCommand is synchronous and still works as the iOS fallback while
      // touchend/pointerup retains transient user activation.
      if (legacyCopy(text)) {
        showToast();
        return;
      }
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(showToast).catch(() => {});
      }
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

    const cancelPointer = () => {
      if (!pointerPress) return;
      clearTimeout(pointerPress.timer);
      pointerPress = null;
    };

    const cancelTouch = () => {
      if (!touchPress) return;
      clearTimeout(touchPress.timer);
      touchPress = null;
    };

    // Desktop / stylus path. Touch is deliberately handled below because
    // Safari can cancel pointer events during a long press inside Google Maps.
    mapElement.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || event.pointerType === 'touch' || isInteractiveTarget(event.target)) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      cancelPointer();
      const state = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        qualified: false,
        text: '',
        timer: null,
      };
      state.timer = setTimeout(() => {
        if (pointerPress !== state) return;
        state.text = coordinatesAt(state.startX, state.startY) || '';
        state.qualified = Boolean(state.text);
      }, COORDINATE_HOLD_MS);
      pointerPress = state;
    }, { capture: true, passive: true });

    window.addEventListener('pointermove', (event) => {
      if (!pointerPress || event.pointerId !== pointerPress.pointerId) return;
      if (Math.hypot(event.clientX - pointerPress.startX, event.clientY - pointerPress.startY) > COORDINATE_MOVE_TOLERANCE) {
        cancelPointer();
      }
    }, { capture: true, passive: true });

    window.addEventListener('pointerup', (event) => {
      if (!pointerPress || event.pointerId !== pointerPress.pointerId) return;
      const state = pointerPress;
      clearTimeout(state.timer);
      pointerPress = null;
      if (state.qualified && state.text) copyFromTrustedRelease(state.text);
    }, { capture: true, passive: true });

    window.addEventListener('pointercancel', cancelPointer, { capture: true, passive: true });

    // iPhone/iPad path. Keep a separate touch state so a browser-generated
    // pointercancel cannot erase a valid stationary long press.
    mapElement.addEventListener('touchstart', (event) => {
      if (event.touches.length !== 1 || isInteractiveTarget(event.target)) {
        cancelTouch();
        return;
      }
      const touch = event.touches[0];
      cancelTouch();
      const state = {
        identifier: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        qualified: false,
        text: '',
        timer: null,
      };
      state.timer = setTimeout(() => {
        if (touchPress !== state) return;
        state.text = coordinatesAt(state.startX, state.startY) || '';
        state.qualified = Boolean(state.text);
      }, COORDINATE_HOLD_MS);
      touchPress = state;
    }, { capture: true, passive: true });

    window.addEventListener('touchmove', (event) => {
      if (!touchPress) return;
      if (event.touches.length !== 1) {
        cancelTouch();
        return;
      }
      const touch = Array.from(event.touches).find((item) => item.identifier === touchPress.identifier);
      if (!touch || Math.hypot(touch.clientX - touchPress.startX, touch.clientY - touchPress.startY) > COORDINATE_MOVE_TOLERANCE) {
        cancelTouch();
      }
    }, { capture: true, passive: true });

    window.addEventListener('touchend', (event) => {
      if (!touchPress) return;
      const ended = Array.from(event.changedTouches || []).some((item) => item.identifier === touchPress.identifier);
      if (!ended) return;
      const state = touchPress;
      clearTimeout(state.timer);
      touchPress = null;
      if (state.qualified && state.text) copyFromTrustedRelease(state.text);
    }, { capture: true, passive: true });

    window.addEventListener('touchcancel', cancelTouch, { capture: true, passive: true });
    window.addEventListener('gesturestart', cancelTouch, { capture: true, passive: true });

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
  'const COORDINATE_HOLD_TOUCH_V2 = true;',
  "toast.textContent = 'Coordinates copied to clipboard';",
  "mapElement.addEventListener('touchstart'",
  "window.addEventListener('touchend'",
  "mapElement.style.setProperty('-webkit-touch-callout', 'none')",
  'projection.fromContainerPixelToLatLng',
  'installCoordinateLongPress();',
]) {
  if (!app.includes(marker)) throw new Error(`Coordinate-copy patch validation failed: ${marker}`);
}

new Function(app);
fs.writeFileSync(appPath, app);
console.log('Installed iOS-safe 3-second species-map coordinate copy interaction.');
