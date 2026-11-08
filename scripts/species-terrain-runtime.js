
  // Actual elevation-derived 3D mode; 2D Google species renderer remains source of truth.
  const TERRAIN_MAPBOX_TOKEN = null;
  const TERRAIN_CDN_VERSION = '6.17.0';
  const TERRAIN_DEM_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
  const TERRAIN_FALLBACK_URL = 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg';
  const TERRAIN_FALLBACK_CREDIT = 'EOxCloudless https://cloudless.eox.at by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2016 & 2017), CC BY 4.0';
  let terrain3dMap = null;
  let terrain3dPromise = null;
  let terrainSyncSerial = 0;
  let terrainLayerEntries = [];
  let terrainExaggeration = 1.5;
  const terrainHost = document.getElementById('terrain3d');
  const terrainFactor = document.getElementById('terrain-factor');
  const terrainFactorValue = document.getElementById('terrain-factor-value');
  const terrainImageryLabel = document.getElementById('terrain-imagery-label');
  const terrainHasMapbox = typeof TERRAIN_MAPBOX_TOKEN === 'string' && /^pk\.[A-Za-z0-9._-]+$/.test(TERRAIN_MAPBOX_TOKEN);
  terrainImageryLabel.textContent = terrainHasMapbox ? 'Mapbox satellite · 3D elevation' : 'Sentinel 2016 imagery · 3D elevation';
  function applyTerrainLayerOpacity() {
    if (!terrain3dMap || !terrain3dMap.isStyleLoaded()) return;
    for (const entry of terrainLayerEntries) {
      if (!terrain3dMap.getLayer(entry.id)) continue;
      if (entry.kind === 'fill') terrain3dMap.setPaintProperty(entry.id, 'fill-opacity', ['*', ['get', '_fillOpacity'], layerOpacity]);
      if (entry.kind === 'line') terrain3dMap.setPaintProperty(entry.id, 'line-opacity', ['*', ['get', '_lineOpacity'], layerOpacity]);
      if (entry.kind === 'circle') terrain3dMap.setPaintProperty(entry.id, 'circle-opacity', ['*', ['get', '_fillOpacity'], layerOpacity]);
      if (entry.kind === 'raster') terrain3dMap.setPaintProperty(entry.id, 'raster-opacity', layerOpacity);
    }
  }
  terrainFactor.addEventListener('input', () => {
    terrainExaggeration = Math.min(2.5, Math.max(1, Number(terrainFactor.value) || 1.5));
    terrainFactorValue.textContent = terrainExaggeration.toFixed(2).replace(/0$/, '').replace(/\.0$/, '') + '×';
    if (terrain3dMap && terrain3dMap.isStyleLoaded()) terrain3dMap.setTerrain({source:'hs-dem', exaggeration:terrainExaggeration});
  });
  function terrainStyle() {
    const imagery = terrainHasMapbox
      ? 'https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.jpg90?access_token=' + encodeURIComponent(TERRAIN_MAPBOX_TOKEN)
      : TERRAIN_FALLBACK_URL;
    return {
      version:8,
      sources:{
        'hs-satellite':{type:'raster',tiles:[imagery],tileSize:256,maxzoom:terrainHasMapbox?20:14,
          attribution:terrainHasMapbox?'© Mapbox © OpenStreetMap contributors':TERRAIN_FALLBACK_CREDIT},
        'hs-dem':{type:'raster-dem',tiles:[TERRAIN_DEM_URL],tileSize:256,maxzoom:14,encoding:'terrarium',
          attribution:'Elevation: Mapzen / AWS Open Data'}
      },
      layers:[{id:'hs-satellite',type:'raster',source:'hs-satellite'}],
      terrain:{source:'hs-dem',exaggeration:terrainExaggeration}
    };
  }
  async function initTerrain3D() {
    if (terrain3dMap) return terrain3dMap;
    if (terrain3dPromise) return terrain3dPromise;
    terrain3dPromise = (async () => {
      const lib = await import('https://unpkg.com/maplibre-gl@' + TERRAIN_CDN_VERSION + '/dist/maplibre-gl.mjs');
      if (typeof lib.supported === 'function' && !lib.supported()) throw new Error('This device does not support WebGL terrain.');
      const center = map.getCenter();
      const next = new lib.Map({
        container:terrainHost,style:terrainStyle(),center:[center.lng(),center.lat()],
        zoom:Math.min(18, Math.max(4, map.getZoom() || 10)),
        pitch:72,bearing:map.getHeading()||0,maxPitch:85,maxZoom:19,
        minZoom:3.5,antialias:true,attributionControl:true,
        renderWorldCopies:false
      });
      terrain3dMap = next;
      next.on('error', (event) => {
        if (terrainEnabled && event?.error?.message) console.warn('Terrain tile warning:',event.error.message);
      });
      next.on('moveend', () => {
        if (!terrainEnabled) return;
        const c = next.getCenter();
        localStorage.setItem('bc-species-map-view-v2', JSON.stringify({center:{lat:c.lat,lng:c.lng},zoom:next.getZoom()}));
      });
      next.on('click', (event) => {
        if (map && event.lngLat) google.maps.event.trigger(map,'click',{
          latLng:new google.maps.LatLng(event.lngLat.lat,event.lngLat.lng)
        });
      });
      await new Promise((resolve,reject) => {
        next.once('load',resolve);
        const fail = setTimeout(() => reject(new Error('Terrain tiles did not initialize.')),18000);
        next.once('load',() => clearTimeout(fail));
      });
      return next;
    })();
    try { return await terrain3dPromise; }
    catch (error) {
      if (terrain3dMap) { terrain3dMap.remove(); terrain3dMap=null; }
      throw error;
    } finally { terrain3dPromise=null; }
  }
  function clearTerrainLayers() {
    if (!terrain3dMap || !terrain3dMap.isStyleLoaded()) return;
    for (const entry of terrainLayerEntries.slice().reverse()) {
      if (terrain3dMap.getLayer(entry.id)) terrain3dMap.removeLayer(entry.id);
    }
    const ids = new Set(terrainLayerEntries.map(entry=>entry.source));
    for (const id of ids) if (terrain3dMap.getSource(id)) terrain3dMap.removeSource(id);
    terrainLayerEntries = [];
  }
  async function terrainFeaturesForLayer(data) {
    const result = [];
    const work = [];
    const baseStyle = data.__huntSmartBaseStyle;
    data.forEach(feature => {
      const style = (typeof baseStyle === 'function' ? baseStyle(feature) : baseStyle) || {};
      if (style.visible === false) return;
      work.push(new Promise(resolve => feature.toGeoJson(geo => {
        if (!geo || !geo.geometry) return resolve();
        const props = geo.properties || {};
        props._fill = String(style.fillColor || '#527b56');
        props._line = String(style.strokeColor || props._fill);
        props._fillOpacity = typeof style.fillOpacity === 'number' ? Math.max(0,Math.min(1,style.fillOpacity)) : 0.35;
        props._lineOpacity = typeof style.strokeOpacity === 'number' ? Math.max(0,Math.min(1,style.strokeOpacity)) : 0.7;
        props._lineWidth = typeof style.strokeWeight === 'number' ? Math.max(0,Math.min(5,style.strokeWeight)) : 0.8;
        result.push({type:'Feature',geometry:geo.geometry,properties:props});
        resolve();
      })));
    });
    await Promise.all(work);
    return {type:'FeatureCollection',features:result};
  }
  function overlayBounds(overlay) {
    const b=overlay.getBounds?.();
    if (!b) return null;
    const ne=b.getNorthEast(),sw=b.getSouthWest();
    return [[sw.lng(),ne.lat()],[ne.lng(),ne.lat()],[ne.lng(),sw.lat()],[sw.lng(),sw.lat()]];
  }
  async function syncTerrain3D(expectedVersion) {
    if (!terrainEnabled || !terrain3dMap || !terrain3dMap.isStyleLoaded()) return;
    const serial=++terrainSyncSerial;
    const featureCollections=await Promise.all([...dataLayers].map(terrainFeaturesForLayer));
    if (!terrainEnabled || expectedVersion!==renderVersion || serial!==terrainSyncSerial) return;
    clearTerrainLayers();
    featureCollections.forEach((fc,index) => {
      if (!fc.features.length) return;
      const source='hs-geo-'+index;
      terrain3dMap.addSource(source,{type:'geojson',data:fc});
      const fill=source+'-fill',line=source+'-line',circle=source+'-point';
      terrain3dMap.addLayer({id:fill,type:'fill',source,
        filter:['==',['geometry-type'],'Polygon'],
        paint:{'fill-color':['get','_fill'],'fill-opacity':['*',['get','_fillOpacity'],layerOpacity]}});
      terrainLayerEntries.push({id:fill,source,kind:'fill'});
      terrain3dMap.addLayer({id:line,type:'line',source,
        paint:{'line-color':['get','_line'],'line-width':['get','_lineWidth'],
          'line-opacity':['*',['get','_lineOpacity'],layerOpacity]}});
      terrainLayerEntries.push({id:line,source,kind:'line'});
      terrain3dMap.addLayer({id:circle,type:'circle',source,
        filter:['==',['geometry-type'],'Point'],
        paint:{'circle-radius':3,'circle-color':['get','_fill'],
          'circle-opacity':['*',['get','_fillOpacity'],layerOpacity]}});
      terrainLayerEntries.push({id:circle,source,kind:'circle'});
    });
    const overlays=[activeOverlay,winterOverlay,...seasonalOverlays].filter(Boolean);
    overlays.forEach((overlay,i) => {
      const coordinates=overlayBounds(overlay);
      const url=overlay.getUrl?.();
      if (!coordinates || !url) return;
      const source='hs-image-'+i, layer=source+'-raster';
      terrain3dMap.addSource(source,{type:'image',url,coordinates});
      terrain3dMap.addLayer({id:layer,type:'raster',source,paint:{'raster-opacity':layerOpacity}});
      terrainLayerEntries.push({id:layer,source,kind:'raster'});
    });
  }
  async function toggleTerrain3D() {
    if (!map || terrainToggle.disabled) return;
    if (terrainEnabled) {
      ++terrainSyncSerial;
      terrainEnabled=false;
      const current=terrain3dMap;
      if (current) {
        const c=current.getCenter();
        map.setCenter({lat:c.lat,lng:c.lng});
        map.setZoom(current.getZoom());
        map.setHeading(current.getBearing());
      }
      terrainHost.hidden=true;
      document.body.classList.remove('terrain-3d-on');
      terrainToggle.textContent='3D';
      terrainToggle.setAttribute('aria-pressed','false');
      return;
    }
    terrainToggle.disabled=true;
    terrainToggle.textContent='…';
    // Give the WebGL canvas a real viewport before its first style load.
    terrainHost.hidden=false;
    terrainHost.style.visibility='hidden';
    try {
      const current=await initTerrain3D();
      const c=map.getCenter();
      current.jumpTo({center:[c.lng(),c.lat()],zoom:map.getZoom(),bearing:map.getHeading()||0,pitch:72});
      terrainEnabled=true;
      terrainHost.style.visibility='';
      document.body.classList.add('terrain-3d-on');
      terrainToggle.textContent='2D';
      terrainToggle.setAttribute('aria-pressed','true');
      current.resize();
      await syncTerrain3D(renderVersion);
    } catch(error) {
      console.error('HuntSmart terrain failed:',error);
      terrainEnabled=false;
      terrainHost.hidden=true;
      terrainHost.style.visibility='';
      document.body.classList.remove('terrain-3d-on');
      terrainToggle.textContent='3D';
      terrainToggle.setAttribute('aria-pressed','false');
      showError('3D terrain unavailable. Original 2D map is unchanged.');
    } finally {terrainToggle.disabled=false;}
  }
