/* HuntSmart paid-product UX polish — preview branch only */
(function () {
  'use strict';

  var ICONS = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/></svg>',
    draws: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M22 19V2"/></svg>',
    seasons: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/><path d="m8 15 2 2 5-5"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/></svg>',
    saved: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3Z"/></svg>'
  };

  function qs(id) { return document.getElementById(id); }

  function updateProductCopy() {
    var gos = qs('navBCOS');
    var mgos = qs('mNavBCOS');
    if (gos) gos.textContent = 'Open Seasons';
    if (mgos) mgos.textContent = 'Open Seasons';

    var eyebrow = document.querySelector('.hero-eyebrow');
    if (eyebrow && /2025\s+Season/i.test(eyebrow.textContent || '')) {
      eyebrow.textContent = 'British Columbia & Alberta · 2026/27 Season';
    }
  }

  function visiblePageId() {
    var ids = ['homePage','filterPage','drawsPage','savedPage','mapPage','abProfilePage','abFilterPage','abDrawsPage','drawDetailPage','bcOpenSeasonsPage'];
    for (var i = 0; i < ids.length; i++) {
      var el = qs(ids[i]);
      if (!el) continue;
      var cs = window.getComputedStyle(el);
      if (cs.display !== 'none' && cs.visibility !== 'hidden') return ids[i];
    }
    return '';
  }

  function activeTabForPage(page) {
    if (page === 'home') return 'home';
    if (page === 'map') return 'map';
    if (page === 'saved') return 'saved';
    if (page === 'bcOpenSeasons') return 'seasons';
    if (page === 'drawDetail') return window.__drawDetailReturnPage === 'map' ? 'map' : 'draws';
    if (['filter','draws','abProfile','abFilter','abDraws'].indexOf(page) >= 0) return 'draws';
    return null;
  }

  function pageNameFromVisibleId(id) {
    var map = {
      homePage:'home', filterPage:'filter', drawsPage:'draws', savedPage:'saved', mapPage:'map',
      abProfilePage:'abProfile', abFilterPage:'abFilter', abDrawsPage:'abDraws',
      drawDetailPage:'drawDetail', bcOpenSeasonsPage:'bcOpenSeasons'
    };
    return map[id] || 'home';
  }

  function syncMobileTabs(page) {
    var bar = qs('hsMobileTabbar');
    if (!bar) return;
    page = page || pageNameFromVisibleId(visiblePageId());
    var active = activeTabForPage(page);
    bar.querySelectorAll('.hs-mobile-tab').forEach(function (btn) {
      var selected = btn.dataset.tab === active;
      btn.classList.toggle('active', selected);
      if (selected) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });
  }

  function buildMobileTabs() {
    if (qs('hsMobileTabbar')) return;

    var bar = document.createElement('nav');
    bar.id = 'hsMobileTabbar';
    bar.className = 'hs-mobile-tabbar';
    bar.setAttribute('aria-label', 'Primary navigation');
    bar.innerHTML =
      '<button class="hs-mobile-tab" data-tab="home" type="button">' + ICONS.home + '<span>Home</span></button>' +
      '<button class="hs-mobile-tab" data-tab="draws" type="button">' + ICONS.draws + '<span>Draws</span></button>' +
      '<button class="hs-mobile-tab" data-tab="seasons" type="button">' + ICONS.seasons + '<span>Seasons</span></button>' +
      '<button class="hs-mobile-tab" data-tab="map" type="button">' + ICONS.map + '<span>Map</span></button>' +
      '<button class="hs-mobile-tab" data-tab="saved" type="button">' + ICONS.saved + '<span>Saved</span></button>';
    document.body.appendChild(bar);

    var backdrop = document.createElement('div');
    backdrop.id = 'hsDrawsSheetBackdrop';
    backdrop.className = 'hs-draws-sheet-backdrop';
    backdrop.innerHTML =
      '<div class="hs-draws-sheet" role="dialog" aria-modal="true" aria-label="Choose draw system">' +
        '<div class="hs-draws-sheet-handle"></div>' +
        '<div class="hs-draws-sheet-title">Draws</div>' +
        '<div class="hs-draws-sheet-sub">Choose a province.</div>' +
        '<button type="button" class="hs-draws-choice" data-draw-choice="bc"><span><strong>British Columbia</strong><span>LEH draws and historical data</span></span><span class="hs-draws-choice-arrow">→</span></button>' +
        '<button type="button" class="hs-draws-choice" data-draw-choice="ab"><span><strong>Alberta</strong><span>Draw history and priority profile</span></span><span class="hs-draws-choice-arrow">→</span></button>' +
      '</div>';
    document.body.appendChild(backdrop);

    var drawTrigger = null;
    backdrop.setAttribute('aria-hidden', 'true');
    function closeSheet() {
      backdrop.classList.remove('open');
      backdrop.setAttribute('aria-hidden', 'true');
      if (drawTrigger && drawTrigger.isConnected) drawTrigger.focus({preventScroll:true});
    }
    function openSheet() {
      drawTrigger = document.activeElement;
      backdrop.classList.add('open');
      backdrop.setAttribute('aria-hidden', 'false');
      backdrop.querySelector('[data-draw-choice]')?.focus({preventScroll:true});
    }
    document.addEventListener('keydown', function (event) {
      if (!backdrop.classList.contains('open')) return;
      if (event.key === 'Escape') {
        event.preventDefault(); closeSheet(); return;
      }
      if (event.key !== 'Tab') return;
      var buttons = Array.from(backdrop.querySelectorAll('[data-draw-choice]'));
      var first = buttons[0], last = buttons[buttons.length-1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    });

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeSheet();
      var choice = e.target.closest('[data-draw-choice]');
      if (!choice) return;
      e.preventDefault();
      e.stopPropagation();
      closeSheet();
      if (choice.dataset.drawChoice === 'bc') {
        if (typeof window.showPage === 'function') window.showPage('filter');
      } else if (typeof window.goToAlberta === 'function') {
        window.goToAlberta();
      }
    });

    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('.hs-mobile-tab');
      if (!btn) return;
      var tab = btn.dataset.tab;
      if (tab === 'draws') { openSheet(); return; }
      if (tab === 'home' && typeof window.showPage === 'function') window.showPage('home');
      if (tab === 'seasons' && typeof window.showPage === 'function') window.showPage('bcOpenSeasons');
      if (tab === 'map' && typeof window.showPage === 'function') window.showPage('map');
      if (tab === 'saved' && typeof window.showPage === 'function') window.showPage('saved');
    });

    syncMobileTabs();
  }

  function detailRowValue(labelStartsWith) {
    var rows = document.querySelectorAll('#drawDetailPage .dd-row');
    for (var i = 0; i < rows.length; i++) {
      var label = rows[i].querySelector('.dd-lbl');
      var value = rows[i].querySelector('.dd-val');
      if (!label || !value) continue;
      if ((label.textContent || '').trim().toLowerCase().indexOf(labelStartsWith.toLowerCase()) === 0) {
        return (value.textContent || '').trim();
      }
    }
    return '';
  }

  function metric(label, value) {
    if (!value || value === '—') return '';
    return '<div class="hs-dd-metric"><div class="hs-dd-metric-label">' + label + '</div><div class="hs-dd-metric-value">' + value + '</div></div>';
  }

  function enhanceDetailPage() {
    var page = qs('drawDetailPage');
    if (!page || window.getComputedStyle(page).display === 'none') return;
    var hero = page.querySelector('.dd-hero');
    if (!hero) return;

    var big = hero.querySelector('.dd-odds-big');
    var isNew = big && (big.textContent || '').trim().toUpperCase() === 'NEW';
    if (isNew) {
      var sub = hero.querySelector('.dd-odds-sub');
      var ratio = hero.querySelector('.dd-odds-ratio');
      if (sub) sub.textContent = 'New hunt';
      if (ratio) ratio.textContent = 'No historical results yet';
    }

    if (!page.querySelector('.hs-dd-metrics')) {
      var drawCode = detailRowValue('Draw Code');
      var season = detailRowValue('Season');
      var tags = detailRowValue('Tags Available') || detailRowValue('Quota');
      var drive = detailRowValue('Drive Time');
      var harvest = detailRowValue('Harvest Success');

      var strip = document.createElement('div');
      strip.className = 'hs-dd-metrics';
      strip.innerHTML =
        metric('Draw code', drawCode) +
        metric('Season', season) +
        metric('Tags / quota', tags) +
        metric(drive ? 'Drive estimate' : 'Harvest success', drive || harvest);
      if (strip.children.length) hero.insertAdjacentElement('afterend', strip);
    }

    if (isNew && !page.querySelector('.hs-dd-new-note')) {
      var note = document.createElement('div');
      note.className = 'hs-dd-new-note';
      note.innerHTML = '<strong>New for 2026/27.</strong><span>No prior draw-odds or harvest history is available for this hunt yet.</span>';
      var metrics = page.querySelector('.hs-dd-metrics');
      if (metrics) metrics.insertAdjacentElement('afterend', note);
      else hero.insertAdjacentElement('afterend', note);
    }
  }

  function watchDetailPage() {
    var page = qs('drawDetailPage');
    if (!page || page.dataset.hsUxObserved === '1') return;
    page.dataset.hsUxObserved = '1';
    new MutationObserver(function () { window.requestAnimationFrame(enhanceDetailPage); })
      .observe(page, { childList: true, subtree: false });
  }

  function hookPageNavigation() {
    if (typeof window.showPage !== 'function' || window.showPage._hsPaidUxWrapped) return;
    var previous = window.showPage;
    var wrapped = function (page) {
      var out = previous.apply(this, arguments);
      window.setTimeout(function () {
        syncMobileTabs(page);
        enhanceDetailPage();
      }, 30);
      return out;
    };
    wrapped._hsPaidUxWrapped = true;
    window.showPage = wrapped;
  }

  function init() {
    updateProductCopy();
    buildMobileTabs();
    hookPageNavigation();
    watchDetailPage();
    enhanceDetailPage();
    syncMobileTabs();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

/* HuntSmart V4 visual enhancement: retains BC draw computations and handlers. */
(function () {
  'use strict';
  if (window.__hsV4Draws) return;
  window.__hsV4Draws = true;
  const page = document.getElementById('drawsPage');
  const grid = document.getElementById('cardsGrid');
  if (!page || !grid) return;
  const q = (root,sel) => root.querySelector(sel);
  function lookupRecord(index) {
    try { return typeof filtered !== 'undefined' && filtered[index] ? filtered[index] : null; }
    catch (_) { return null; }
  }
  function enhanceCard(card) {
    if (card.classList.contains('hs-v4-ready')) return;
    const header = q(card,'.card-header > div:first-child');
    const info = q(card,'.card-info');
    if (!header || !info) return;
    const area = q(info,'.ci-val.hl');
    if (area && !q(header,'.hs-v4-hunt-area')) {
      const title=document.createElement('div');
      title.className='hs-v4-hunt-area';
      title.textContent=area.textContent.trim();
      const species=q(header,'.card-species');
      if (species) species.insertAdjacentElement('afterend',title);
      area.parentElement.classList.add('hs-v4-area-source');
    }
    const badge=q(header,'.fill-badge');
    if (badge) {
      const field=document.createElement('div');
      field.className='ci ci-harvest';
      const lbl=document.createElement('div');
      lbl.className='ci-label'; lbl.textContent='Harvest success';
      if (badge.classList.contains('fill-none')) {
        badge.textContent='N/A'; badge.setAttribute('aria-label','Harvest success data unavailable');
        badge.title='No verified harvest success data is available for this hunt.';
      }
      field.append(lbl,badge);
      info.append(field);
    }
    const oddsYear=q(card,'.odds-ratio');
    if (oddsYear && /^\d{4}$/.test(oddsYear.textContent.trim())) oddsYear.textContent=oddsYear.textContent.trim()+' DRAW ODDS';
    const expand=q(card,'.expand-toggle');
    if (expand) {
      expand.textContent=expand.textContent.replace(/[▾▴]/g,'').trim();
      expand.setAttribute('aria-expanded',String(!!q(card,'.card-expand.open')));
      const panel=q(card,'.card-expand');
      if (panel?.id) expand.setAttribute('aria-controls',panel.id);
    }
    const save=q(card,'.star-btn');
    if (save) { save.setAttribute('aria-label',save.classList.contains('starred')?'Remove saved hunt':'Save hunt'); save.setAttribute('aria-pressed',String(save.classList.contains('starred'))); }
    const code = [...card.querySelectorAll('.card-expand .ei')].find(el=>q(el,'.ei-label')?.textContent.trim().toLowerCase()==='draw code');
    const codeValue=code ? q(code,'.ei-val')?.textContent.trim() : '';
    if (codeValue) {
      const label=document.createElement('span');
      label.className='hs-v4-card-code';
      label.textContent='BC LEH · '+codeValue;
      card.append(label);
    }
    card.classList.add('hs-v4-ready');
  }
  function afterExpanded(card) {
    const panel=q(card,'.card-expand');
    if (!panel) return;
    const open=panel.classList.contains('open');
    card.classList.toggle('hs-v4-open',open);
    const toggle=q(card,'.expand-toggle');
    if (toggle) { toggle.textContent=open?'Hide details':'Show details'; toggle.setAttribute('aria-expanded',String(open)); }
    if (!open || panel.classList.contains('hs-v4-detail-ready')) return;
    const collapse = document.createElement('button');
    collapse.className='hs-v4-mobile-collapse'; collapse.type='button'; collapse.textContent='Hide details';
    collapse.addEventListener('click',()=>{ toggle?.click(); card.scrollIntoView({block:'nearest'}); });
    panel.prepend(collapse);
    const index=Number((panel.id||'').replace(/^exp-/,''));
    const r=Number.isInteger(index)?lookupRecord(index):null;
    const chartBlocks=Array.from(panel.children).filter(node=>node.tagName==='DIV' && node!==q(panel,'.expand-grid') && (node.querySelector('.chart-toggle-wrap') || node.querySelector('.chart-label')));
    chartBlocks.forEach((node,i)=>{
      node.classList.add('hs-v4-chart-card');
      const label=document.createElement('div');
      label.className='hs-v4-chart-title';
      label.textContent=(i===0?'Draw odds by year':'Harvest success by year');
      node.prepend(label);
    });
    if (r) {
      const history=Object.entries(r.yearly_draw_odds||{}).filter(([year,value])=>Number(year)<=2025 && Number.isFinite(Number(value)) && Number(value)>=0);
      if (history.length===1) {
        const placeholder=[...panel.querySelectorAll('.chart-label')].find(n=>/no data available/i.test(n.textContent));
        if (placeholder) {
          const [year,value]=history[0];
          placeholder.textContent='Recorded draw odds';
          const valueRow=document.createElement('div');
          valueRow.className='hs-v4-single-year';
          const big=document.createElement('strong');
          big.textContent=Number(value).toLocaleString('en-CA',{maximumFractionDigits:1})+'%';
          const yearLabel=document.createElement('span');
          yearLabel.textContent=year;
          const note=document.createElement('small');
          note.textContent='Only one recorded year. No historical trend can be inferred.';
          valueRow.append(big,yearLabel,note);
          placeholder.after(valueRow);
        }
      }
      const harvest=Object.entries(r.yearly_fill_rates||{}).filter(([y,v])=>Number(y)<2025 && Number.isFinite(Number(v)));
      if (harvest.length===1 && !panel.querySelector('.hs-v4-harvest-single')) {
        const item=document.createElement('div');item.className='hs-v4-chart-card hs-v4-harvest-single';
        const heading=document.createElement('div');heading.className='hs-v4-chart-title';heading.textContent='Harvest success by year';
        const row=document.createElement('div');row.className='hs-v4-single-year';
        const strong=document.createElement('strong');strong.textContent=(Number(harvest[0][1])*100).toLocaleString('en-CA',{maximumFractionDigits:1})+'%';
        const span=document.createElement('span');span.textContent=harvest[0][0];
        const small=document.createElement('small');small.textContent='One recorded year; this is not a long-term average.';
        row.append(strong,span,small);item.append(heading,row);
        const oddsBlock=chartBlocks[0];
        if (oddsBlock) oddsBlock.after(item); else panel.querySelector('.expand-grid')?.after(item);
      }
    }
    const provenance=document.createElement('p');provenance.className='hs-v4-data-note';
    provenance.textContent='Historical draw odds and harvest success are different measures. Charts use HuntSmart’s existing recorded values; missing years are not estimated. Verify current BC regulations for zone boundaries, eligibility and season restrictions.';
    panel.append(provenance);
    panel.classList.add('hs-v4-detail-ready');
  }
  function decorate(root) {
    if (!root) return;
    if (root.matches?.('.card')) enhanceCard(root);
    else root.querySelectorAll('.card:not(.hs-v4-ready)').forEach(enhanceCard);
  }
  decorate(grid);
  const observer=new MutationObserver(mutations=>{
    for(const m of mutations){
      if(m.type==='childList') for(const node of m.addedNodes) if(node.nodeType===1) decorate(node);
      if(m.type==='attributes' && m.target.classList.contains('card-expand')) afterExpanded(m.target.closest('.card'));
    }
  });
  observer.observe(grid,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  grid.addEventListener('click',event=>{
    const btn=event.target.closest('.expand-toggle,.star-btn');
    if (!btn) return;
    const card=btn.closest('.card');
    if (!card) return;
    if(btn.classList.contains('expand-toggle')) queueMicrotask(()=>afterExpanded(card));
    else queueMicrotask(()=>{btn.setAttribute('aria-pressed',String(btn.classList.contains('starred')));btn.setAttribute('aria-label',btn.classList.contains('starred')?'Remove saved hunt':'Save hunt');});
  });
  const sheet=document.getElementById('sidebarInner');
  if(sheet && !sheet.querySelector('.hs-v4-mobile-apply')) {
    const header=document.createElement('div');header.className='hs-v4-sheet-bar';
    const title=document.createElement('strong');title.textContent='Filter hunts';
    const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Close filters');
    close.addEventListener('click',()=>{if(sheet.classList.contains('open') && typeof toggleSidebar==='function') toggleSidebar();});
    header.append(title,close);sheet.prepend(header);
    const footer=document.createElement('div');footer.className='hs-v4-mobile-apply';
    const apply=document.createElement('button');apply.type='button';apply.textContent='Show draws';
    apply.addEventListener('click',()=>{if(sheet.classList.contains('open') && typeof toggleSidebar==='function') toggleSidebar();});
    footer.append(apply);sheet.append(footer);
    const count=document.getElementById('countDisplay');
    if(count){const update=()=>{apply.textContent='Show '+count.textContent.trim()+' draws';};update();new MutationObserver(update).observe(count,{childList:true,subtree:true,characterData:true});}
  }
})();
