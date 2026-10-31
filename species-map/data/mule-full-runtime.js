(()=>{
  const WIDTH=2600,HEIGHT=1228,PALETTE=[[0,0,0,0],[63,150,70,155],[244,208,63,170],[244,139,39,183],[215,48,39,198]];
  let fullUrl=null,building=null;
  const pending=new Set();
  const isMule=()=>document.getElementById('species')?.value==='mule_deer';
  async function gunzip(b64){
    if(!('DecompressionStream' in window))throw new Error('A newer Safari/iOS version is required');
    const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return await new Response(stream).text();
  }
  function render(rle){
    const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=HEIGHT;
    const ctx=canvas.getContext('2d',{alpha:true}),img=ctx.createImageData(WIDTH,HEIGHT),a=img.data;
    let i=0;
    for(const token of rle.split(',')){
      if(!token)continue;
      const k=Number(token[0]),n=parseInt(token.slice(1),36),p=PALETTE[k];
      for(let j=0;j<n&&i<WIDTH*HEIGHT;j++,i++){
        const z=i*4;a[z]=p[0];a[z+1]=p[1];a[z+2]=p[2];a[z+3]=p[3];
      }
    }
    if(i!==WIDTH*HEIGHT)throw new Error(`Mule deer raster length mismatch: ${i}`);
    ctx.putImageData(img,0,0);
    return canvas.toDataURL('image/png');
  }
  async function ensureFull(){
    if(fullUrl)return fullUrl;
    if(building)return building;
    building=(async()=>{
      const packed=window.SPECIES_FULL_MULE;
      if(!packed)throw new Error('Full-resolution mule deer layer missing');
      fullUrl=render(await gunzip(packed));
      for(const layer of pending){try{if(layer._map&&isMule())layer.setUrl(fullUrl)}catch(_){}}
      pending.clear();
      if(isMule()){
        const imgs=document.querySelectorAll('#map img.leaflet-image-layer');
        if(imgs.length)imgs[imgs.length-1].src=fullUrl;
      }
      return fullUrl;
    })().catch(err=>{console.error(err);building=null;throw err});
    return building;
  }
  function install(){
    if(!window.L||typeof window.L.imageOverlay!=='function'){setTimeout(install,0);return}
    const original=window.L.imageOverlay;
    if(original.__fullMulePatched)return;
    function patched(url,bounds,options){
      if(!isMule())return original.call(this,url,bounds,options);
      if(fullUrl)return original.call(this,fullUrl,bounds,options);
      const layer=original.call(this,url,bounds,options);pending.add(layer);ensureFull().catch(()=>{});return layer;
    }
    patched.__fullMulePatched=true;
    window.L.imageOverlay=patched;
    const select=document.getElementById('species');
    if(select){select.addEventListener('change',()=>{if(isMule())ensureFull().catch(()=>{})});if(isMule())ensureFull().catch(()=>{})}
  }
  install();
})();
