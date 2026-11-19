(() => {
  'use strict';
  const species=document.querySelector('.species-control');
  const era=document.getElementById('era-control');
  const province=document.querySelector('.province-control');
  const tools=document.querySelector('.map-tools');
  const opacity=document.querySelector('.opacity-control');
  const success=document.getElementById('hs-harvest-toggle');
  const note=document.getElementById('layer-note');
  if(!species||!era||!province||!tools||!opacity||!success) {
    console.error('HuntSmart compact map controls were not found.');
    return;
  }
  const node=(tag,cls,text)=>{
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    if(text!=null)el.textContent=text;
    return el;
  };
  const toolbar=node('div','hs-map-toolbar');
  toolbar.setAttribute('aria-label','Species map controls');
  // Mount the toolbar before moving its existing controls into it.
  species.parentNode.insertBefore(toolbar,species);
  const header=node('div','hs-toolbar-header');
  const modes=node('div','hs-toolbar-modes');
  const provinceWrap=node('div','hs-province-wrap');
  const provinceToggle=node('button','hs-province-toggle','BC');
  provinceToggle.type='button';
  provinceToggle.setAttribute('aria-label','Switch to Alberta');
  // Single-tap province switch: no dropdown, arrow or extra overlay.
  province.hidden=true;
  provinceWrap.append(provinceToggle);
  header.append(species,provinceWrap);

  const settingsWrap=node('div','hs-settings-wrap');
  const settingsToggle=node('button','hs-settings-toggle');
  settingsToggle.type='button';
  settingsToggle.setAttribute('aria-label','Map settings');
  settingsToggle.setAttribute('aria-expanded','false');
  settingsToggle.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 17h16M8 3v8M16 13v8"/></svg>';
  const settings=node('div','hs-settings-panel');
  settings.hidden=true;
  settings.appendChild(opacity);
  // The pinned production viewer intentionally supports only Modern/Historical.
  // Do not expose legacy seasonal buttons via the settings menu.
  for(const id of ['era-winter','era-summer']){
    const button=document.getElementById(id);
    if(button)button.hidden=true;
  }
  if(note){settings.appendChild(note);}
  settingsWrap.append(settingsToggle,settings);

  // Preserve the existing mode buttons and their event listeners.
  era.appendChild(success);
  modes.append(era,settingsWrap);
  toolbar.append(header,modes);
  // Terrain stays an independent floating control, outside the compact toolbar.
  const current=()=>document.getElementById('province-alberta')?.getAttribute('aria-pressed')==='true'?'AB':'BC';
  const refreshProvince=()=>{
    const chosen=current();
    provinceToggle.textContent=chosen;
    provinceToggle.setAttribute('aria-label',chosen==='BC'?'Switch to Alberta':'Switch to British Columbia');
  };
  refreshProvince();
  provinceToggle.addEventListener('click',()=>{
    const next=current()==='BC'?'province-alberta':'province-bc';
    document.getElementById(next)?.click();
    refreshProvince();
    settings.hidden=true;settingsToggle.setAttribute('aria-expanded','false');
  });
  for(const id of ['province-bc','province-alberta']){
    document.getElementById(id)?.addEventListener('click',refreshProvince);
  }
  settingsToggle.addEventListener('click',()=>{
    const expanded=settings.hidden;
    settings.hidden=!expanded;
    settingsToggle.setAttribute('aria-expanded',String(expanded));
    closeProvince();
  });
  document.addEventListener('pointerdown',event=>{
    if(!settingsWrap.contains(event.target)){
      settings.hidden=true;settingsToggle.setAttribute('aria-expanded','false');
    }
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){
      settings.hidden=true;
      settingsToggle.setAttribute('aria-expanded','false');
      document.getElementById('hs-harvest-panel')?.classList.remove('is-open');
    }
  });
  // When species/map mode changes, keep only one information surface open.
  for(const id of ['era-modern','era-historical','era-winter','era-summer']){
    document.getElementById(id)?.addEventListener('click',()=>{
      document.getElementById('hs-harvest-panel')?.classList.remove('is-open');
      settings.hidden=true;settingsToggle.setAttribute('aria-expanded','false');
    });
  }
})();