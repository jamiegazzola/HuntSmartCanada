// HuntSmart BC hunt-card LEH fullscreen 3D button fix
// Load this AFTER maps.js in index.html:
// <script defer src="./card-map-3d-fullscreen-fix.js"></script>

(function () {
  if (window.__hsCard3DFullscreenFixLoaded) return;
  window.__hsCard3DFullscreenFixLoaded = true;

  const card3DState = Object.create(null);

  function _cardMap(containerId) {
    try {
      // _lehCardMaps is declared in maps.js as a top-level const.
      return (typeof _lehCardMaps !== 'undefined') ? _lehCardMaps[containerId] : null;
    } catch (e) {
      return null;
    }
  }

  function _fullscreenRecord(containerId) {
    try {
      // _bcCardMapFullscreen is declared in maps.js as a top-level const.
      return (typeof _bcCardMapFullscreen !== 'undefined') ? _bcCardMapFullscreen[containerId] : null;
    } catch (e) {
      return null;
    }
  }

  function _current3D(containerId) {
    if (Object.prototype.hasOwnProperty.call(card3DState, containerId)) {
      return card3DState[containerId] !== false;
    }
    const map = _cardMap(containerId);
    return !(map && map._lehTerrain3D === false);
  }

  function _sync3DButtons(containerId, on) {
    document.querySelectorAll(`[id="${containerId}_btn_3d"]`).forEach(btn => {
      btn.classList.toggle('active', !!on);
      btn.textContent = on ? '3D ✓' : '3D';
      btn.title = on ? 'Turn off 3D terrain' : 'Turn on 3D terrain';
    });
  }

  function _applyCardTerrain(containerId, on, options) {
    const animate = !options || options.animate !== false;
    const enabled = !!on;
    card3DState[containerId] = enabled;
    _sync3DButtons(containerId, enabled);

    const map = _cardMap(containerId);
    if (!map) return;
    map._lehTerrain3D = enabled;

    const apply = () => {
      const liveMap = _cardMap(containerId);
      if (!liveMap || liveMap !== map) return;

      try {
        if (enabled) {
          if (!map.getSource('card-dem')) {
            map.addSource('card-dem', {
              type: 'raster-dem',
              url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
              tileSize: 512,
              maxzoom: 14
            });
          }
          map.setTerrain({ source: 'card-dem', exaggeration: 1.5 });

          if (!map.getLayer('card-sky')) {
            map.addLayer({
              id: 'card-sky',
              type: 'sky',
              paint: {
                'sky-type': 'atmosphere',
                'sky-atmosphere-sun': [0.0, 90.0],
                'sky-atmosphere-sun-intensity': 15
              }
            });
          }

          if (animate && typeof map.easeTo === 'function') {
            map.easeTo({ pitch: 58, bearing: map.getBearing() || -12, duration: 850 });
          }
        } else {
          try { map.setTerrain(null); } catch (e) {}
          if (map.getLayer('card-sky')) {
            try { map.removeLayer('card-sky'); } catch (e) {}
          }
          if (animate && typeof map.easeTo === 'function') {
            map.easeTo({ pitch: 0, duration: 500 });
          }
        }
      } catch (err) {
        console.warn('[bcCardMap3D]', err && err.message ? err.message : err);
      }

      _sync3DButtons(containerId, enabled);
    };

    try {
      if (typeof map.loaded === 'function' && map.loaded()) apply();
      else if (typeof map.once === 'function') map.once('load', apply);
      else setTimeout(apply, 80);
    } catch (e) {
      setTimeout(apply, 80);
    }
  }

  function _retryApplyTerrain(containerId, on, attempts, animate) {
    if (attempts <= 0) return;
    const map = _cardMap(containerId);
    if (map && typeof map.getStyle === 'function') {
      _applyCardTerrain(containerId, on, { animate });
      return;
    }
    setTimeout(() => _retryApplyTerrain(containerId, on, attempts - 1, animate), 100);
  }

  window.bcCardMapToggle3D = function bcCardMapToggle3D(containerId) {
    _applyCardTerrain(containerId, !_current3D(containerId), { animate: true });
  };

  function _addFullscreen3DButton(containerId) {
    const rec = _fullscreenRecord(containerId);
    const overlay = rec && rec.overlay;
    if (!overlay) return;

    const bar = overlay.firstElementChild;
    if (!bar || document.getElementById(`${containerId}_btn_3d`)) {
      _sync3DButtons(containerId, _current3D(containerId));
      return;
    }

    const btn = document.createElement('button');
    btn.id = `${containerId}_btn_3d`;
    btn.className = 'leh-map-btn';
    btn.style.cssText = 'font-size:11px;padding:4px 12px;';
    btn.onclick = (event) => {
      event.stopPropagation();
      window.bcCardMapToggle3D(containerId);
    };

    const closeBtn = Array.from(bar.querySelectorAll('button'))
      .find(button => /Collapse/i.test(button.textContent || ''));

    if (closeBtn) bar.insertBefore(btn, closeBtn);
    else bar.appendChild(btn);

    _sync3DButtons(containerId, _current3D(containerId));
  }

  const originalInit = window.bcCardMapInit;
  if (typeof originalInit === 'function') {
    window.bcCardMapInit = function patchedBcCardMapInit(containerId, mu, zone, speciesType) {
      const oldMap = _cardMap(containerId);
      const keep3D = Object.prototype.hasOwnProperty.call(card3DState, containerId)
        ? card3DState[containerId] !== false
        : !(oldMap && oldMap._lehTerrain3D === false);

      card3DState[containerId] = keep3D;
      const result = originalInit.apply(this, arguments);
      _retryApplyTerrain(containerId, keep3D, 30, false);
      return result;
    };
  }

  const originalSetLayer = window.bcCardMapSetLayer;
  if (typeof originalSetLayer === 'function') {
    window.bcCardMapSetLayer = function patchedBcCardMapSetLayer(containerId, type) {
      const container = document.getElementById(containerId);
      if (container) container.dataset.tile = type;

      const map = _cardMap(containerId);
      if (map) map._lehCurrentTile = type;

      ['satellite', 'topo'].forEach(t => {
        document.querySelectorAll(`[id="${containerId}_btn_${t}"]`).forEach(btn => {
          btn.classList.toggle('active', t === type);
        });
      });

      const result = originalSetLayer.apply(this, arguments);
      _retryApplyTerrain(containerId, _current3D(containerId), 30, false);
      return result;
    };
  }

  const originalFullscreen = window.bcCardMapToggleFullscreen;
  if (typeof originalFullscreen === 'function') {
    window.bcCardMapToggleFullscreen = function patchedBcCardMapToggleFullscreen(containerId) {
      const result = originalFullscreen.apply(this, arguments);
      setTimeout(() => {
        const rec = _fullscreenRecord(containerId);
        if (!rec) return;
        _addFullscreen3DButton(containerId);
        if (_current3D(containerId)) {
          _applyCardTerrain(containerId, true, { animate: true });
        } else {
          _sync3DButtons(containerId, false);
        }
      }, 90);
      return result;
    };
  }
})();
