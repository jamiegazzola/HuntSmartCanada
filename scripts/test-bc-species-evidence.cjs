'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');

const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'species-map','bc-species-evidence.js'),'utf8');
const els=new Map();
const element=id=>{
  if(!els.has(id)) els.set(id,{hidden:true,textContent:'',href:'',text:'',value:''});
  return els.get(id);
};
class ImageMapType {
  constructor(options){Object.assign(this,options);}
  setOpacity(opacity){this.opacity=opacity;}
}
class Size { constructor(width,height){this.width=width;this.height=height;} }
const sandbox={
  window:{},document:{getElementById:element},
  google:{maps:{ImageMapType,Size}},URLSearchParams
};
vm.runInNewContext(source,sandbox,{filename:'bc-species-evidence.js'});
const evidence=sandbox.window.HUNTSMART_BC_EVIDENCE;
assert.deepEqual([...evidence.keys],['lynx','bobcat','cougar','wolf','wolverine']);
const overlays=[];
const map={overlayMapTypes:{
  push:layer=>overlays.push(layer),
  getLength:()=>overlays.length,
  getAt:i=>overlays[i],
  removeAt:i=>overlays.splice(i,1)
}};
const tileInfo=(i=0)=>{
  const tile=overlays[i].getTileUrl({x:44,y:88},8);
  const link=new URL(tile);
  assert.match(link.hostname,/^delivery\.maps\.gov\.bc\.ca$/);
  const layers=JSON.parse(link.searchParams.get('dynamicLayers'));
  assert.equal(layers.length,1);
  assert.equal(link.searchParams.get('bboxSR'),'3857');
  assert.equal(link.searchParams.get('transparent'),'true');
  return layers[0];
};
for(const [key,era,id,field] of [
  ['lynx','modern',22,'M_LYCA_SLI6WTSUI'],
  ['lynx','winter',22,'M_LYCA_WLI6WTSUI'],
  ['bobcat','summer',22,'M_LYRU_SLI6WTSUI'],
  ['bobcat','winter',22,'M_LYRU_WLI6WTSUI'],
  ['cougar','modern',695,'Cougar'],
  ['wolf','modern',695,'Grey Wolf'],
  ['wolverine','modern',55,'Wolverine']
]){
  evidence.render(key,era,map,0.8);
  const layer=tileInfo();
  assert.equal(layer.id,id,key+' wrong provincial layer');
  assert.ok(layer.definitionExpression.includes(field),key+' wrong query');
  assert.ok(element('layer-source').href.startsWith('https://catalogue.data.gov.bc.ca/dataset/'));
  assert.ok(!element('layer-note-text').textContent.includes('confirmed current density'));
  assert.equal(overlays.length,key==='wolverine'?2:1);
  evidence.setOpacity(0.3);
  assert.ok(overlays.every(overlay=>overlay.opacity===0.3));
}
assert.equal(tileInfo(1).id,695,'wolverine should also show non-sensitive telemetry');
evidence.render('wolf','historical',map,0.8);
assert.equal(overlays.length,0,'unsupported seasonal views should not invent spatial data');
assert.match(element('layer-note-text').textContent,/no verified/);
evidence.clear(); assert.equal(overlays.length,0);

// Exercise the actual Netlify post-build installer against synthetic, privacy-safe
// production artifacts. Preview testing must never copy private KMZ assets.
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hs-bc-evidence-'));
try {
  const target=path.join(dir,'site','species-map');
  fs.mkdirSync(target,{recursive:true});
  fs.writeFileSync(path.join(target,'bc-species-evidence.js'),source);
  fs.writeFileSync(path.join(target,'species-catalog.js'),
    "window.HUNTSMART_SPECIES = [\n  { key: 'mule_deer', label: 'Mule Deer', type: 'raster' },\n  ];\n");
  fs.writeFileSync(path.join(target,'index.html'),
    '<script src="harvest-success.js?v=official"></script>\n<script src="app.js?v=old"></script>');
  fs.writeFileSync(path.join(target,'app.css'),'.layer-note{display:none!important}\n');
  fs.writeFileSync(path.join(target,'app.js'),[
    '(() => {',
    "  const DISPLAYED_SPECIES = new Set([...KMZ_HEATMAPS, 'roosevelt_elk']);",
    '  function applyLayerOpacity() { const x = 0; }',
    '  async function renderSelected() {',
    '    const item = speciesByKey[select.value];',
    '    clearLayer();',
    '    try {',
    "      if (province === 'ab') { const x = 1; }",
    '      else { const x = 2; }',
    '    } finally { setLoading(false); }',
    '  }',
    '})();'
  ].join('\n'));
  const installer=path.join(root,'scripts','install-bc-species-evidence.cjs');
  execFileSync(process.execPath,[installer],{cwd:dir,stdio:'pipe'});
  const catalog=fs.readFileSync(path.join(target,'species-catalog.js'),'utf8');
  const app=fs.readFileSync(path.join(target,'app.js'),'utf8');
  const html=fs.readFileSync(path.join(target,'index.html'),'utf8');
  const css=fs.readFileSync(path.join(target,'app.css'),'utf8');
  for(const key of evidence.keys) {
    assert.match(catalog,new RegExp("key: '"+key+"'"),key+' missing from built selector');
  }
  assert.match(app,/HUNTSMART_BC_EVIDENCE.render/);
  assert.match(app,/HUNTSMART_BC_EVIDENCE.clear/);
  assert.match(app,/HUNTSMART_BC_EVIDENCE.setOpacity/);
  assert.match(app,/bc-official-evidence-on/);
  assert.ok(html.indexOf('bc-species-evidence.js')<html.indexOf('app.js?v='));
  assert.match(css,/bc-official-evidence-on \.layer-note\{display:block!important\}/);
  new Function(app);new Function(catalog);
} finally {
  fs.rmSync(dir,{recursive:true,force:true});
}
console.log('BC evidence: five species, official ArcGIS tiles, era selection, opacity, cleanup, source attribution, production installer PASS');
