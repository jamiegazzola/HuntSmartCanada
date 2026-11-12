'use strict';
// Final production build patch: install DEM-based 3D after the private species
// viewer and Vancouver Island elk source have been installed.
const fs=require('node:fs');
const path=require('node:path');
const target=path.join('site','species-map');
const appFile=path.join(target,'app.js');
const htmlFile=path.join(target,'index.html');
const cssFile=path.join(target,'app.css');
const assert=(ok,message)=>{if(!ok)throw Error('3D terrain installer: '+message)};
let app=fs.readFileSync(appFile,'utf8');
let html=fs.readFileSync(htmlFile,'utf8');
let css=fs.readFileSync(cssFile,'utf8');
assert(!app.includes('const TERRAIN_DEM_URL ='),'already installed');
const token=String(process.env.MAPBOX_PUBLIC_TOKEN||'').trim();
assert(!token || /^pk\.[A-Za-z0-9._-]+$/.test(token),'only publishable Mapbox pk tokens are allowed');
let runtime=fs.readFileSync(path.join('scripts','species-terrain-runtime.js'),'utf8');
assert(runtime.includes('const TERRAIN_MAPBOX_TOKEN = null;'),'terrain token anchor missing');
runtime=runtime.replace('const TERRAIN_MAPBOX_TOKEN = null;','const TERRAIN_MAPBOX_TOKEN = '+JSON.stringify(token||null)+';');
const clickStart=app.indexOf("  terrainToggle.addEventListener('click', () => {");
const clickEnd=app.indexOf('\n\n\n  let map = null;',clickStart);
assert(clickStart>=0&&clickEnd>clickStart,'existing tilt handler missing');
app=app.slice(0,clickStart)+"  terrainToggle.addEventListener('click', () => { void toggleTerrain3D(); });"+app.slice(clickEnd);
const styleMarker='      baseStyle = style;';
assert(app.includes(styleMarker),'google Data style anchor missing');
app=app.replace(styleMarker,styleMarker+'\n      data.__huntSmartBaseStyle = style;');
const opacityMarker='    applyLayerOpacity();\n  });\n  opacityInput.addEventListener';
assert(app.includes(opacityMarker),'opacity handler missing');
app=app.replace(opacityMarker,'    applyLayerOpacity();\n    applyTerrainLayerOpacity();\n  });\n  opacityInput.addEventListener');
const renderMarker='        applyLayerOpacity();\n        setLoading(false);';
assert(app.includes(renderMarker),'species render completion missing');
app=app.replace(renderMarker,'        applyLayerOpacity();\n        if (terrainEnabled) void syncTerrain3D(version).catch(error => { console.error(error); showError(\'3D species overlay unavailable; switch to 2D to view this layer.\'); });\n        setLoading(false);');
const initMarker='  window.initSpeciesMap = () => {';
assert(app.includes(initMarker),'species map init anchor missing');
app=app.replace(initMarker,runtime+'\n'+initMarker);
const domMarker='</main>';
assert(html.includes(domMarker),'map DOM anchor missing');
const newUI=[
'  <div id="terrain3d" hidden aria-label="HuntSmart three-dimensional satellite terrain"></div>',
'  <div class="terrain-exaggeration" aria-label="3D terrain display settings">',
'    <label for="terrain-factor">Terrain exaggeration <output id="terrain-factor-value" for="terrain-factor">1.5×</output></label>',
'    <input id="terrain-factor" type="range" min="1" max="2.5" step="0.25" value="1.5" aria-label="Vertical terrain exaggeration">',
'    <span id="terrain-imagery-label"></span>',
'  </div>'
].join('\n');
html=html.replace(domMarker,domMarker+'\n'+newUI);
html=html.replace(/app\.js\?v=[^"]+/,'app.js?v=dem-terrain-20261112b');
html=html.replace(/app\.css\?v=[^"]+/,'app.css?v=dem-terrain-20261112b');
html=html.replace('</head>','  <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@6.17.0/dist/maplibre-gl.css">\n</head>');
html=html.replace('title="Tilt the map where 3D imagery is available"','title="Open 3D terrain with adjustable elevation exaggeration"');
css+='\n'+[
'#terrain3d{position:fixed;inset:0;z-index:5;width:100%;height:100%;background:#101512}',
'#terrain3d[hidden]{display:none}',
'#terrain3d .maplibregl-control-container{font-family:inherit}',
'.terrain-exaggeration{display:none;position:fixed;z-index:20;top:calc(env(safe-area-inset-top,0px)  + 258px);left:12px;width:min(340px,calc(100vw - 24px));padding:9px 12px;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:rgba(15,20,17,.94);box-shadow:0 8px 24px rgba(0,0,0,.24)}',
'body.terrain-3d-on .terrain-exaggeration{display:grid;gap:6px}',
'.terrain-exaggeration label{display:flex;justify-content:space-between;font-size:11px;font-weight:650;color:#c4d0c5}',
'.terrain-exaggeration output{color:#fff}',
'.terrain-exaggeration input{width:100%;height:20px;margin:0;accent-color:#79b67e;cursor:pointer;touch-action:pan-x}',
'#terrain-imagery-label{font-size:10px;line-height:1.3;color:#acb9ad}',
'.terrain-toggle:disabled{opacity:.68;cursor:progress}',
'body.terrain-3d-on .error{top:calc(env(safe-area-inset-top,0px)  + 373px)}',
'@media(max-width:520px){.terrain-exaggeration{top:calc(env(safe-area-inset-top,0px)  + 251px);left:9px;width:min(340px,calc(100vw - 18px))}body.terrain-3d-on .error{top:calc(env(safe-area-inset-top,0px)  + 365px)}}'
].join('\n')+'\n';
new Function(app);
assert(app.includes('void syncTerrain3D(version)')&&app.includes('toggleTerrain3D()'),'runtime not wired');
assert(html.includes('terrain3d')&&html.includes('terrain-factor'),'DOM missing');
fs.writeFileSync(appFile,app);
fs.writeFileSync(htmlFile,html);
fs.writeFileSync(cssFile,css);
console.log('Installed DEM terrain and species layer bridge; Mapbox satellite imagery configured:',Boolean(token));
