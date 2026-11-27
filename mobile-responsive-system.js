/* HuntSmart Canada — responsive product system runtime.
   Keeps mobile behaviour adaptive without forking desktop application logic. */
(function () {
  'use strict';
  if (window.__HUNTSMART_MOBILE_SYSTEM__) return;

  var VERSION = '2026-11-26-mobile-draws-v3';
  var mobileMq = window.matchMedia('(max-width: 980px)');
  var compactMq = window.matchMedia('(max-width: 420px)');
  var coarseMq = window.matchMedia('(pointer: coarse)');
  var raf = 0;
  var uiObserver = null;

  window.__HUNTSMART_MOBILE_SYSTEM__ = {
    version: VERSION,
    isMobile: function () { return mobileMq.matches; }
  };

  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    var s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && el.getClientRects().length > 0;
  }

  function normalizeViewportMeta() {
    var meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    var next = 'width=device-width, initial-scale=1, viewport-fit=cover';
    if (meta.getAttribute('content') !== next) meta.setAttribute('content', next);
  }

  function setViewportVars() {
    var vv = window.visualViewport;
    var unzoomed = vv && Math.abs(vv.scale - 1) < 0.01;
    var h = unzoomed ? vv.height : window.innerHeight;
    var w = unzoomed ? vv.width : window.innerWidth;
    document.documentElement.style.setProperty('--hs-visual-vh', h + 'px');
    document.documentElement.style.setProperty('--hs-visual-vw', w + 'px');
  }

  function syncModeClasses() {
    if (!document.body) return;
    document.body.classList.toggle('hs-mobile', mobileMq.matches);
    document.body.classList.toggle('hs-compact-mobile', compactMq.matches);
    document.body.classList.toggle('hs-touch', coarseMq.matches);
    document.documentElement.dataset.hsViewport = mobileMq.matches ? (compactMq.matches ? 'compact' : 'mobile') : 'desktop';
    document.body.dataset.hsMobileSystem = VERSION;
    setViewportVars();
  }

  function closeMobileNav() {
    var menu = document.getElementById('navMobileMenu');
    var hamburger = document.getElementById('navHamburger');
    if (menu) menu.classList.remove('open');
    if (hamburger) {
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  }

  function syncMobileNavA11y() {
    var menu = document.getElementById('navMobileMenu');
    var hamburger = document.getElementById('navHamburger');
    if (!menu || !hamburger) return;
    hamburger.setAttribute('aria-controls', 'navMobileMenu');
    hamburger.setAttribute('aria-haspopup', 'true');
    hamburger.setAttribute('aria-expanded', menu.classList.contains('open') ? 'true' : 'false');
  }

  function countActiveFilters(inner) {
    if (!inner) return 0;
    var count = 0;
    inner.querySelectorAll('.chip.active, .fp-chip.active, .map-chip.active').forEach(function (el) {
      var text = (el.textContent || '').trim().toLowerCase();
      if (!/^(all|all draws|any|all species)$/.test(text)) count += 1;
    });
    inner.querySelectorAll('input[type="range"]').forEach(function (el) {
      var min = el.min === '' ? '0' : String(el.min);
      if (String(el.value) !== min) count += 1;
    });
    inner.querySelectorAll('input[type="date"]').forEach(function (el) {
      if (el.value) count += 1;
    });
    inner.querySelectorAll('select').forEach(function (el) {
      if (el.value) count += 1;
    });
    return count;
  }

  function wireFilterSheet(pageId, innerId, toggleId, toggleFunctionName) {
    var page = document.getElementById(pageId);
    var inner = document.getElementById(innerId);
    var toggle = document.getElementById(toggleId);
    if (!page || !inner || !toggle || page.dataset.hsMobileSheetWired === '1') return;
    page.dataset.hsMobileSheetWired = '1';
    var ab = pageId === 'abDrawsPage';
    var count = document.getElementById(ab ? 'abCountDisplay' : 'countDisplay');
    var activePanel = null, snapshot = null, mounted = false, committing = false;
    var original = [], panels = [], trigger = null;
    var originalToggle = window[toggleFunctionName];
    var make = function(tag, cls, value) {
      var el = document.createElement(tag);
      if (cls) el.className = cls;
      if (value) el.textContent = value;
      if (tag === 'button') el.type = 'button';
      return el;
    };
    var header = make('header','hs-filter-header');
    var back = make('button','hs-filter-back','Close');
    var heading = make('h2','hs-filter-title','Filters');
    var reset = make('button','hs-filter-reset','Reset');
    var body = make('div','hs-filter-content');
    var overview = make('div','hs-filter-overview');
    var footer = make('footer','hs-filter-footer');
    var apply = make('button','hs-filter-apply','Show results');
    heading.id = innerId + '-heading';
    header.append(back, heading, reset);
    footer.append(apply);
    toggle.setAttribute('role','button');
    toggle.setAttribute('tabindex','0');
    toggle.setAttribute('aria-controls',innerId);
    toggle.setAttribute('aria-expanded','false');

    function activeTexts(root) {
      return Array.from(root.querySelectorAll('.chip.active,.mu-item.active')).map(function(el) {
        return el.textContent.trim().replace(/\s+/g,' ');
      });
    }
    function values() {
      if (ab) return {species:[...abSelSpecies], classes:[...abSelClass], units:[...abSelWMU],
        odds:abMinOdds, harvest:abMinHarvest, profile:abProfileFilter};
      return {species:[...selSpecies], classes:[...selClass], regions:[...selMUs], units:[...selMUsFull],
        areas:[...selAreas], odds:selMinOdds, harvest:selMinHarvest,
        special:[...selSpecialTags], dates:[selSeasonDateFrom,selSeasonDateTo]};
    }
    function restore(s) {
      if (!s || JSON.stringify(values()) === JSON.stringify(s)) return;
      if (ab) {
        abSelSpecies = new Set(s.species); abSelClass = new Set(s.classes);
        abSelWMU = new Set(s.units); abMinOdds = s.odds; abMinHarvest = s.harvest; abProfileFilter = s.profile;
        var abSlider = document.getElementById('abOddsSlider');
        if (abSlider) abSlider.value = s.odds;
        abApplyFilters();
        if (typeof abUpdateMapStyles === 'function') abUpdateMapStyles();
        if (typeof abUpdateMapChips === 'function') abUpdateMapChips();
        syncProfile();
      } else {
        selSpecies = new Set(s.species); selClass = new Set(s.classes); selMUs = new Set(s.regions);
        selMUsFull = new Set(s.units); selAreas = new Set(s.areas); selMinOdds = s.odds; selMinHarvest = s.harvest;
        var slider = document.getElementById('oddsSlider');
        if (slider) slider.value = Math.max(0,ODDS_STEPS.indexOf(s.odds));
        buildSpeciesChips(); buildClassChips(); buildMUList();
        if (typeof bcUpdateMapChips === 'function') bcUpdateMapChips();
        if (typeof bcUpdateMapStyles === 'function') bcUpdateMapStyles();
        selSpecialTags = new Set(s.special); selSeasonDateFrom=s.dates[0]; selSeasonDateTo=s.dates[1];
        buildSpecialTagChips(); syncSeasonDates();
        if (slider) onSlider(slider.value); else applyFilters();
      }
    }
    function syncProfile() {
      if (!ab) return;
      var p = panels.find(function(x){return x.key === 'profile';});
      var block = p?.block || Array.from(inner.querySelectorAll('.filter-block')).find(function(el){return /Profile Filter/i.test(el.querySelector('.filter-heading')?.textContent || '');});
      if (block) Array.from(block.querySelectorAll('.chip')).forEach(function(el,i){
        el.classList.toggle('active',['all','has_profile','above_threshold','below_threshold'][i] === abProfileFilter);
      });
    }
    function closeMap() {
      var map = document.getElementById(ab ? 'abLeafletMap' : 'bcLeafletMap');
      if (map?.dataset.hsFullscreen === '1') map._hsCollapseMap?.();
      var panel = document.getElementById(ab ? 'abMapPanel' : 'bcMapPanel');
      var btn = document.getElementById(ab ? 'abMapToggleBtn' : 'bcMapToggleBtn');
      if (panel && btn && panel.style.display !== 'none') btn.click();
    }
    function summary(p,s) {
      var selected = function(items, empty){return items.length === 0 ? empty : items.length === 1 ? String(items[0]) : items.length + ' selected';};
      switch(p.key) {
        case 'species': return selected(s.species,'All species');
        case 'class': return selected(s.classes,'Any');
        case 'location':
          return ab ? selected(s.units,'All WMUs') : selected(s.units.concat(s.regions.map(function(n){return MU_NAMES[n] || n;})),'All regions');
        case 'odds': var v = ab ? AB_ODDS_STEPS[s.odds] : s.odds; return v ? v + '%+' : 'Any';
        case 'profile': return ({all:'All draws',has_profile:'Has my points',above_threshold:'Above threshold',below_threshold:'Below threshold'})[s.profile] || 'All draws';
        case 'special': return selected(s.special.map(function(key){return BC_SPECIAL_TAGS.find(function(t){return t.key===key;})?.label || key;}),'Any');
        case 'dates': return s.dates.filter(Boolean).join(' – ') || 'Any dates';
        default: return selected(activeTexts(p.block),'Any');
      }
    }
    function setText(el,value) { if (el.textContent !== value) el.textContent = value; }
    function sync() {
      var open = mobileMq.matches && inner.classList.contains('open') && page.style.display !== 'none';
      toggle.setAttribute('aria-expanded',String(open));
      if (open && !mounted) mount();
      if (!open && mounted) finish(false,false);
      if (!mounted) {
        var lbl=toggle.querySelector('span:first-child');
        if(lbl && page.style.display!=='none') {
          var current=values(), n=current.species.length+current.classes.length+current.units.length+(current.regions?.length||0)+(current.areas?.length||0)+(current.odds?1:0)+(current.harvest?1:0)+(current.special?.length||0)+(current.dates?.some(Boolean)?1:0)+(current.profile&&current.profile!=='all'?1:0);
          setText(lbl,n?'Filters · '+n:'Filters');
        }
        return;
      }
      syncProfile();
      var s = values();
      panels.forEach(function(p){
        setText(p.value,summary(p,s));
        if(p===activePanel && p.updateUnits && !p.block.classList.contains('hs-filter-map-mode'))p.updateUnits();
        p.block.querySelectorAll('.chip,.mu-item').forEach(function(el){
          if (el.tagName !== 'BUTTON') {el.setAttribute('role','button');el.tabIndex=0;}
          el.setAttribute('aria-pressed',String(el.classList.contains('active')));
        });
      });
      setText(apply, activePanel ? 'Done' : 'Show ' + (count?.textContent.trim() || '0') + ' draws');
      var active = s.species.length + s.classes.length + s.units.length + (s.regions?.length || 0) +
        (s.areas?.length || 0) + (s.odds ? 1:0) + (s.harvest ? 1:0) + (s.special?.length || 0) +
        (s.dates?.filter(Boolean).length ? 1:0) + (s.profile && s.profile !== 'all' ? 1:0);
      var label = toggle.querySelector('span:first-child');
      if (label) setText(label,active ? 'Filters · ' + active : 'Filters');
    }
    function buildUnitPicker(p) {
      var unitBox=make('div','hs-filter-unit-picker');
      var search=make('input','hs-filter-unit-search');
      search.type='search';search.placeholder=ab?'Search WMUs':'Search regions or WMUs';
      search.setAttribute('aria-label',search.placeholder);
      var results=make('div','hs-filter-unit-results');
      unitBox.append(search,results);
      p.block.append(unitBox);
      p.unitBox=unitBox;
      var signature='';
      p.updateUnits=function() {
        var query=search.value.trim().toLowerCase();
        var source=ab?AB_DATA.map(function(r){return String(r.wmu);}):DATA.filter(function(r){
          return !selSpecies.size||selSpecies.has(r.Species);
        }).map(function(r){return bcNormalizeMU(r.MU);});
        var selected=ab?abSelWMU:selMUsFull;
        var ids=[...new Set(source.concat([...selected]))].filter(function(id){return id && (ab?/^\d+[A-Za-z]?$/.test(id):/^\d+-\d+$/.test(id));});
        ids.sort(function(a,b){return a.localeCompare(b,undefined,{numeric:true});});
        var regions=Array.from(p.block.querySelectorAll('.mu-item'));
        var visible=ids.filter(function(id){
          if(ab) return !query||id.toLowerCase().includes(query);
          var region=MU_NAMES[Number(id.split('-')[0])]||'';
          var padded=id.replace(/-(\d)$/,'-0$1');
          return query ? id.includes(query)||padded.includes(query)||region.toLowerCase().includes(query) : selected.has(id);
        });
        regions.forEach(function(el){
          var next=Boolean(query&&!el.textContent.toLowerCase().includes(query));
          if(el.hidden!==next)el.hidden=next;
        });
        var next=JSON.stringify([query,visible,[...selected]]);
        if(signature===next)return;
        signature=next;
        results.replaceChildren();
        if(!ab&&!query&&!visible.length){
          results.append(make('p','hs-filter-empty','Search for a specific WMU or select a region above.'));
          return;
        }
        if(!visible.length){
          if(ab||!regions.some(function(el){return !el.hidden;}))results.append(make('p','hs-filter-empty','No matching management units.'));
          return;
        }
        var group='';
        visible.forEach(function(id){
          if(!ab){
            var name=MU_NAMES[Number(id.split('-')[0])]||'Other regions';
            if(name!==group){group=name;results.append(make('h3','hs-filter-unit-group',group));}
          }
          var button=make('button','chip'+(selected.has(id)?' active':''),'WMU '+id);
          button.setAttribute('aria-pressed',String(selected.has(id)));
          button.addEventListener('click',function(){
            if(ab)abToggleWMU(id);
            else {bcToggleWMUFull(id);bcUpdateMapChips();}
            p.updateUnits();sync();
          });
          results.append(button);
        });
      };
      search.addEventListener('input',p.updateUnits);
    }
    function showPanel(p, map) {
      if (activePanel && activePanel !== p) closeMap();
      activePanel = p;
      overview.hidden = Boolean(p);
      panels.forEach(function(item){item.block.hidden = item !== p;item.block.classList.toggle('hs-filter-map-mode',item===p&&Boolean(map));});
      back.textContent = p ? 'Back' : 'Close';
      back.setAttribute('aria-label',p ? 'Back to filters' : 'Close filters');
      heading.textContent = p ? (map?'Select on map':p.label) : 'Filters';
      reset.textContent = p ? 'Clear' : 'Reset';
      body.scrollTop = 0;
      if (map) {
        var panel = document.getElementById(ab ? 'abMapPanel' : 'bcMapPanel');
        var btn = document.getElementById(ab ? 'abMapToggleBtn' : 'bcMapToggleBtn');
        if (btn && panel && panel.style.display === 'none') btn.click();
        requestAnimationFrame(function(){panel?.scrollIntoView({block:'start'});});
      }
      sync();
      back.focus({preventScroll:true});
    }
    function clearPanel(p) {
      var slider = document.getElementById(ab ? 'abOddsSlider' : 'oddsSlider');
      if (p.key === 'odds' && slider) {slider.value=slider.min || '0';slider.dispatchEvent(new Event('input',{bubbles:true}));return;}
      if (p.key === 'profile' && ab) {abProfileFilter='all';abApplyFilters();syncProfile();return;}
      var clear = p.block.querySelector('.filter-clear');
      if (clear && (p.key !== 'dates' || typeof setSeasonDateFilter === 'function')) clear.click();
      if (p.key === 'dates' && typeof setSeasonDateFilter !== 'function') p.block.querySelectorAll('input').forEach(function(el){el.value='';});
    }
    function resetFilters() {
      closeMap();
      if (ab) {abSelClass.clear();abResetAll();syncProfile();}
      else {
        selAreas.clear();
        resetAll();
      }
      sync();
    }
    function mount() {
      mounted = true;
      snapshot = values();
      trigger = document.activeElement;
      original = Array.from(inner.children);
      panels = [];
      original.filter(function(el){return el.classList.contains('filter-block');}).forEach(function(block){
        var label = block.querySelector('.filter-heading')?.firstChild?.textContent.trim() || 'Options';
        var key = /^Species/i.test(label)?'species':/^Animal Class/i.test(label)?'class':/^Management Unit/i.test(label)?'location':/^Minimum Odds/i.test(label)?'odds':/^Profile Filter/i.test(label)?'profile':/^Special Tags/i.test(label)?'special':/^Season Dates/i.test(label)?'dates':label;
        label = ({species:'Species',class:'Animal class',location:'Management unit',odds:'Minimum draw odds',profile:'Profile filter',special:'Special tags',dates:'Season dates'})[key] || label;
        var row = make('button','hs-filter-row');
        var title = make('span','hs-filter-row-label',label);
        var value = make('span','hs-filter-row-value');
        var arrow = make('span','hs-filter-chevron','›'); arrow.setAttribute('aria-hidden','true');
        row.append(title,value,arrow);
        var p = {key:key,label:label,block:block,row:row,value:value};
        panels.push(p);
        row.addEventListener('click',function(){showPanel(p,false);});
        overview.append(row);
        if (key === 'location') {
          var mapRow = make('button','hs-filter-row hs-filter-map-row','Select on map');
          mapRow.addEventListener('click',function(){showPanel(p,true);});
          overview.append(mapRow);
        }
        body.append(block);
        if(key==='location')buildUnitPicker(p);
        if (key === 'special' && !block.querySelector('.chip')) {
          var empty = make('p','hs-filter-empty','No special tag options available.');
          empty.dataset.hsFilterTemporary='1';block.append(empty);
        }
        if (key === 'dates' && typeof setSeasonDateFilter !== 'function') {
          block.querySelectorAll('input').forEach(function(el){el.disabled=true;el.dataset.hsFilterTemporaryDisabled='1';});
          var notice = make('p','hs-filter-empty','Season date filtering is currently unavailable.');
          notice.dataset.hsFilterTemporary='1';block.append(notice);
        }
      });
      body.prepend(overview);
      inner.replaceChildren(header,body,footer);
      inner.classList.add('hs-filter-layout');
      inner.setAttribute('role','dialog');
      inner.setAttribute('aria-modal','true');
      inner.setAttribute('aria-labelledby',heading.id);
      document.body.classList.add('hs-mobile-filter-open');
      showPanel(null,false);
    }
    function finish(accept,focus) {
      if (!mounted || committing) return;
      committing = true;
      closeMap();
      if (!accept) restore(snapshot);
      mounted = false; snapshot = null; activePanel = null;
      original.forEach(function(el){
        el.hidden=false;
        el.classList.remove('hs-filter-map-mode');
        el.querySelectorAll('.hs-filter-unit-picker').forEach(function(x){x.remove();});
        el.querySelectorAll('.mu-item[hidden]').forEach(function(x){x.hidden=false;});
        el.querySelectorAll('[data-hs-filter-temporary]').forEach(function(x){x.remove();});
        el.querySelectorAll('[data-hs-filter-temporary-disabled]').forEach(function(x){x.disabled=false;delete x.dataset.hsFilterTemporaryDisabled;});
      });
      overview.replaceChildren(); body.replaceChildren();
      inner.replaceChildren(...original);
      inner.classList.remove('open','hs-filter-layout');
      inner.removeAttribute('role');inner.removeAttribute('aria-modal');inner.removeAttribute('aria-labelledby');
      document.body.classList.remove('hs-mobile-filter-open');
      toggle.setAttribute('aria-expanded','false');
      if (focus && mobileMq.matches && page.style.display !== 'none') (trigger?.isConnected && trigger !== document.body ? trigger : toggle).focus({preventScroll:true});
      committing = false;
    }
    function open() {
      if (!mobileMq.matches) return;
      if (inner.classList.contains('open')) {finish(false,true);return;}
      inner.classList.add('open'); mount();sync();
    }
    window[toggleFunctionName] = function(){
      if (mobileMq.matches) open();
      else if (typeof originalToggle === 'function') originalToggle.apply(this,arguments);
    };
    back.addEventListener('click',function(){if(activePanel){closeMap();showPanel(null,false);}else finish(false,true);});
    reset.addEventListener('click',function(){if(activePanel)clearPanel(activePanel);else resetFilters();sync();});
    apply.addEventListener('click',function(){if(activePanel){closeMap();showPanel(null,false);}else finish(true,true);});
    toggle.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
    inner.addEventListener('keydown',function(e){
      if (!mounted) return;
      if (e.key === 'Escape') {
        e.preventDefault();e.stopPropagation();
        if (activePanel) {closeMap();showPanel(null,false);} else finish(false,true);
      }
      if ((e.key==='Enter'||e.key===' ') && e.target.matches('[role="button"]:not(button)')) {e.preventDefault();e.target.click();}
      if (e.key==='Tab' && !document.querySelector('.hs-filter-map-fullscreen')) {
        var focusable=Array.from(inner.querySelectorAll('button,input,select,[tabindex="0"]')).filter(function(el){return !el.disabled && el.getClientRects().length;});
        var first=focusable[0],last=focusable[focusable.length-1];
        if (e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
        if (!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
      }
    });
    inner.addEventListener('change',sync,true);
    inner.addEventListener('click',function(){setTimeout(sync,0);},true);
    new MutationObserver(sync).observe(inner,{attributes:true,attributeFilter:['class','style'],childList:true,subtree:true});
    if(count) new MutationObserver(sync).observe(count,{childList:true,subtree:true,characterData:true});
    new MutationObserver(sync).observe(page,{attributes:true,attributeFilter:['style']});
    mobileMq.addEventListener?.('change',sync);
    sync();
  }

  function syncOverlayLock() {
    if (!document.body || !mobileMq.matches) {
      if (document.body) document.body.classList.remove('hs-mobile-modal-open');
      return;
    }
    var auth = document.querySelector('.auth-modal-overlay');
    var paywall = document.getElementById('hs-paywall');
    var loading = document.getElementById('hs-loading');
    var scrim = Array.from(document.querySelectorAll('.hs-scrim')).some(isVisible);
    var modalOpen = isVisible(auth) || (paywall && paywall.classList.contains('hs-visible')) || isVisible(loading) || scrim;
    document.body.classList.toggle('hs-mobile-modal-open', !!modalOpen);
  }

  function tuneMapPanels() {
    var results = document.getElementById('fullMapResultsDrawer');
    var gosPanel = document.querySelector('#bcOpenSeasonsPage .os-panel');
    if (results) {
      results.setAttribute('role', 'region');
      results.setAttribute('aria-label', 'Selected hunt results');
    }
    if (gosPanel) {
      gosPanel.setAttribute('role', 'region');
      gosPanel.setAttribute('aria-label', 'General open season results');
    }
  }

  function resizeMaps() {
    if (!mobileMq.matches) return;
    window.dispatchEvent(new Event('resize'));
    ['fullMapInstance', 'osMapInstance', 'bcMapInstance', 'abMapInstance'].forEach(function (name) {
      try {
        var map = window[name];
        if (map && typeof map.resize === 'function') map.resize();
        else if (map && typeof map.invalidateSize === 'function') map.invalidateSize(false);
      } catch (_) {}
    });
  }

  function scheduleResizeMaps() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function () {
      setViewportVars();
      resizeMaps();
    });
  }

  function keepFocusedFieldVisible(event) {
    if (!mobileMq.matches) return;
    var target = event.target;
    if (!target || !/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
    setTimeout(function () {
      var vv = window.visualViewport;
      if (!vv || vv.height < window.innerHeight - 100) {
        try { target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' }); } catch (_) {}
      }
    }, 220);
  }

  function wireGlobalInteractions() {
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      closeMobileNav();
      var openSheet = document.querySelector('#drawsPage .sidebar-inner.open, #abDrawsPage .sidebar-inner.open');
      if (openSheet) {
        if (openSheet.id === 'sidebarInner' && typeof window.toggleSidebar === 'function') window.toggleSidebar();
        if (openSheet.id === 'abSidebarInner' && typeof window.toggleAbSidebar === 'function') window.toggleAbSidebar();
      }
    });

    document.addEventListener('focusin', keepFocusedFieldVisible, true);
    document.addEventListener('click', function (event) {
      if (!mobileMq.matches) return;
      if (event.target.closest('.nav-mobile-menu .nav-link')) closeMobileNav();
      setTimeout(function () {
        syncMobileNavA11y();
        syncOverlayLock();
      }, 0);
    }, true);
  }

  function observeUiState() {
    if (uiObserver) {
      uiObserver.disconnect();
      uiObserver = null;
    }
    if (!mobileMq.matches) return;

    uiObserver = new MutationObserver(function () {
      syncMobileNavA11y();
      syncOverlayLock();
      tuneMapPanels();
    });
    uiObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  }

  function boot() {
    normalizeViewportMeta();
    syncModeClasses();
    syncMobileNavA11y();
    wireFilterSheet('drawsPage', 'sidebarInner', 'sidebarToggle', 'toggleSidebar');
    wireFilterSheet('abDrawsPage', 'abSidebarInner', 'abSidebarToggle', 'toggleAbSidebar');
    tuneMapPanels();
    syncOverlayLock();
    wireGlobalInteractions();
    observeUiState();
    if (document.body) document.body.classList.add('hs-mobile-system-ready');
  }

  [mobileMq, compactMq, coarseMq].forEach(function (mq) {
    if (mq.addEventListener) mq.addEventListener('change', function () {
      syncModeClasses();
      syncOverlayLock();
      observeUiState();
      scheduleResizeMaps();
    });
    else if (mq.addListener) mq.addListener(function () {
      syncModeClasses();
      syncOverlayLock();
      observeUiState();
      scheduleResizeMaps();
    });
  });

  window.addEventListener('orientationchange', function () { setTimeout(scheduleResizeMaps, 80); });
  window.addEventListener('resize', setViewportVars, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setViewportVars, { passive: true });
    window.visualViewport.addEventListener('scroll', setViewportVars, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
