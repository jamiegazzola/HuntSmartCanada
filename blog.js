(function(){
  'use strict';

  function qs(id){ return document.getElementById(id); }

  /* ----------------------------------------------------------------------
     Interactive HuntSmart walkthrough
     ---------------------------------------------------------------------- */
  var guideRoot = qs('hsGuide');
  if (guideRoot) {
    var guideState = { step:0, province:'BC', species:'Moose', selectedHunt:1, saved:false };
    var guideSteps = [
      { title:'Choose your province', tip:'Start with the draw system that applies to you.' },
      { title:'Pick a species', tip:'Remove everything that is not relevant to the hunt you are planning.' },
      { title:'Narrow the opportunities', tip:'Use geography, season and odds to turn a large database into a useful shortlist.' },
      { title:'Read a hunt card', tip:'See the core decision data together instead of hunting through multiple tables.' },
      { title:'Inspect the history', tip:'Use multiple years to understand whether the latest odds are typical or unusual.' },
      { title:'Compare and save', tip:'Shortlist finalists before deciding where to apply.' },
      { title:'Open HuntSmart', tip:'Take the same workflow into the real app with current HuntSmart data.' }
    ];
    var demoHunts = [
      { name:'Moose · Demo Hunt A', odds:8.4, season:'Early October', permits:42, trend:[6.1,7.0,7.4,8.8,8.4] },
      { name:'Moose · Demo Hunt B', odds:12.7, season:'Mid–late October', permits:61, trend:[9.3,10.6,11.8,13.1,12.7] },
      { name:'Moose · Demo Hunt C', odds:4.9, season:'Late September', permits:25, trend:[5.8,5.4,4.6,5.1,4.9] }
    ];

    var guideStepsEl = qs('guideSteps');
    var guideScreen = qs('guideScreen');
    var guideProgress = qs('guideProgress');
    var guideTip = qs('guideTip');
    var guideBack = qs('guideBack');
    var guideNext = qs('guideNext');

    function escapeHtml(value){
      return String(value).replace(/[&<>'"]/g,function(ch){
        return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch];
      });
    }

    function renderMiniTrend(values){
      var width=560,height=150,pad=18;
      var min=Math.min.apply(null,values), max=Math.max.apply(null,values);
      if (max===min) { max=min+1; }
      var pts=values.map(function(v,i){
        var x=pad+i*((width-pad*2)/(values.length-1));
        var y=pad+(max-v)/(max-min)*(height-pad*2);
        return x.toFixed(1)+','+y.toFixed(1);
      }).join(' ');
      return '<svg viewBox="0 0 '+width+' '+height+'" style="width:100%;height:auto;margin-top:14px" role="img" aria-label="Demonstration historical odds trend">'+
        '<line x1="'+pad+'" y1="'+(height-pad)+'" x2="'+(width-pad)+'" y2="'+(height-pad)+'" stroke="#2d352f" />'+
        '<polyline points="'+pts+'" fill="none" stroke="#59d77f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />'+
        values.map(function(v,i){
          var x=pad+i*((width-pad*2)/(values.length-1));
          var y=pad+(max-v)/(max-min)*(height-pad*2);
          return '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="5" fill="#4ade80" />';
        }).join('')+
      '</svg>';
    }

    function renderGuideSteps(){
      guideStepsEl.innerHTML = guideSteps.map(function(step,i){
        var complete=i<guideState.step;
        return '<button type="button" class="guide-step-btn '+(i===guideState.step?'active':'')+'" data-guide-step="'+i+'">'+
          '<b>'+(complete?'✓':(i+1))+'</b><span>'+escapeHtml(step.title)+'</span></button>';
      }).join('');
      guideStepsEl.querySelectorAll('[data-guide-step]').forEach(function(btn){
        btn.addEventListener('click',function(){
          guideState.step=Number(btn.getAttribute('data-guide-step'))||0;
          renderGuide();
        });
      });
    }

    function renderGuideScreen(){
      var s=guideState.step;
      if (s===0) {
        guideScreen.innerHTML='<h3>Where do you hunt?</h3><p class="muted">HuntSmart separates the BC and Alberta draw systems so you start with the right rules and data.</p><div class="choice-grid">'+
          '<button type="button" class="choice-btn '+(guideState.province==='BC'?'active':'')+'" data-prov="BC"><strong>British Columbia</strong><small>LEH draws, historical odds, WMUs and maps</small></button>'+
          '<button type="button" class="choice-btn '+(guideState.province==='AB'?'active':'')+'" data-prov="AB"><strong>Alberta</strong><small>Draw history, priority and personal odds tools</small></button></div>';
        guideScreen.querySelectorAll('[data-prov]').forEach(function(btn){ btn.addEventListener('click',function(){ guideState.province=btn.dataset.prov; renderGuideScreen(); }); });
      } else if (s===1) {
        var species=['Moose','Elk','Mule Deer','Bighorn Sheep'];
        guideScreen.innerHTML='<h3>Choose the species</h3><p class="muted">This immediately removes opportunities that are not part of your decision.</p><div class="choice-grid">'+species.map(function(sp){ return '<button type="button" class="choice-btn '+(guideState.species===sp?'active':'')+'" data-species="'+escapeHtml(sp)+'"><strong>'+escapeHtml(sp)+'</strong><small>Show relevant draw opportunities</small></button>'; }).join('')+'</div>';
        guideScreen.querySelectorAll('[data-species]').forEach(function(btn){ btn.addEventListener('click',function(){ guideState.species=btn.dataset.species; renderGuideScreen(); }); });
      } else if (s===2) {
        guideScreen.innerHTML='<h3>Narrow the database</h3><p class="muted">Example filters — the real HuntSmart app uses the live draw database.</p><div class="choice-grid">'+
          '<div class="choice-btn active"><strong>Region / WMU</strong><small>Only areas you can realistically hunt</small></div>'+
          '<div class="choice-btn active"><strong>Minimum odds</strong><small>Remove extremely unlikely opportunities</small></div>'+
          '<div class="choice-btn"><strong>Season dates</strong><small>Match the hunt to your available time</small></div>'+
          '<div class="choice-btn"><strong>Harvest context</strong><small>Look beyond the draw probability</small></div></div>';
      } else if (s===3) {
        guideScreen.innerHTML='<h3>Read a hunt card</h3><p class="muted">These are demonstration values so you can see the workflow without changing your account.</p><div class="mock-hunts">'+demoHunts.map(function(h,i){ return '<button type="button" class="mock-hunt '+(guideState.selectedHunt===i?'active':'')+'" data-hunt="'+i+'"><div class="mock-hunt-top"><div><strong>'+escapeHtml(h.name)+'</strong><div class="muted">'+escapeHtml(h.season)+' · '+h.permits+' authorizations</div></div><div class="odds">'+h.odds.toFixed(1)+'%</div></div></button>'; }).join('')+'</div>';
        guideScreen.querySelectorAll('[data-hunt]').forEach(function(btn){ btn.addEventListener('click',function(){ guideState.selectedHunt=Number(btn.dataset.hunt)||0; renderGuideScreen(); }); });
      } else if (s===4) {
        var selected=demoHunts[guideState.selectedHunt];
        guideScreen.innerHTML='<h3>'+escapeHtml(selected.name)+'</h3><p class="muted">Five-year demonstration trend. In the real app, supported BC series can go back much further.</p>'+renderMiniTrend(selected.trend)+'<div style="display:flex;justify-content:space-between;gap:8px;color:#77827b;font-size:11px"><span>Year 1</span><span>Year 2</span><span>Year 3</span><span>Year 4</span><span>Latest</span></div><div class="callout" style="margin-bottom:0"><p>The point is not to chase the highest historical number. It is to understand whether the latest result fits the longer pattern.</p></div>';
      } else if (s===5) {
        guideScreen.innerHTML='<h3>Compare the finalists</h3><p class="muted">Once a hunt survives your filters, compare it against the other realistic options.</p><div class="mock-hunts">'+demoHunts.map(function(h,i){ return '<div class="mock-hunt '+(guideState.selectedHunt===i?'active':'')+'"><div class="mock-hunt-top"><div><strong>'+escapeHtml(h.name)+'</strong><div class="muted">'+escapeHtml(h.season)+'</div></div><div class="odds">'+h.odds.toFixed(1)+'%</div></div></div>'; }).join('')+'</div><button type="button" id="demoSaveBtn" class="choice-btn active" style="margin-top:12px;width:auto"><strong>'+(guideState.saved?'✓ Saved to demo shortlist':'Save selected hunt')+'</strong></button>';
        qs('demoSaveBtn').addEventListener('click',function(){ guideState.saved=!guideState.saved; renderGuideScreen(); });
      } else {
        guideScreen.innerHTML='<h3>You now know the core HuntSmart workflow.</h3><p class="muted">Choose the jurisdiction, narrow the hunt database, understand a card, inspect history, then compare a shortlist. The real app does this with the current HuntSmart dataset.</p><div class="callout"><p><strong>Next step:</strong> open HuntSmart and repeat the same process with the species and areas you actually hunt.</p></div><button type="button" id="openRealApp" class="choice-btn active" style="width:100%;text-align:center"><strong>Open HuntSmart →</strong></button>';
        qs('openRealApp').addEventListener('click',function(){ window.location.href='./index.html'; });
      }
    }

    function renderGuide(){
      renderGuideSteps();
      renderGuideScreen();
      guideProgress.textContent='Step '+(guideState.step+1)+' of '+guideSteps.length;
      guideTip.textContent=guideSteps[guideState.step].tip;
      guideBack.disabled=guideState.step===0;
      guideBack.style.opacity=guideState.step===0?'.45':'1';
      guideNext.textContent=guideState.step===guideSteps.length-1?'Restart':'Next';
    }

    guideBack.addEventListener('click',function(){ if(guideState.step>0){ guideState.step--; renderGuide(); } });
    guideNext.addEventListener('click',function(){
      if(guideState.step===guideSteps.length-1){ guideState.step=0; guideState.saved=false; }
      else { guideState.step++; }
      renderGuide();
    });
    renderGuide();
  }

  /* ----------------------------------------------------------------------
     Historical BC LEH odds explorer — real HuntSmart draws.json
     ---------------------------------------------------------------------- */
  var explorer = qs('oddsExplorer');
  if (explorer) {
    var slider=qs('oddsYearSlider'), chart=qs('oddsChart'), valueEl=qs('oddsValue'), yearEl=qs('oddsYear'), titleEl=qs('oddsTitle'), subtitleEl=qs('oddsSubtitle'), insightEl=qs('oddsInsight');
    var series=[];

    function setExplorerError(message){
      titleEl.textContent='Historical explorer unavailable';
      subtitleEl.textContent='You can still read the guide below.';
      valueEl.textContent='—'; yearEl.textContent='—'; insightEl.textContent=message;
      slider.disabled=true; chart.innerHTML='';
    }

    function renderChart(selectedIndex){
      if(!series.length) return;
      var W=720,H=220,l=46,r=16,t=18,b=34;
      var vals=series.map(function(d){return d.value;});
      var max=Math.max.apply(null,vals), min=Math.min.apply(null,vals);
      var range=Math.max(.1,max-min);
      var yMin=Math.max(0,min-range*.14), yMax=max+range*.14;
      var x=function(i){return l+(i*(W-l-r)/(series.length-1||1));};
      var y=function(v){return t+((yMax-v)/(yMax-yMin||1))*(H-t-b);};
      var selected=series[selectedIndex];
      var grid='';
      for(var g=0;g<4;g++){
        var gv=yMin+(yMax-yMin)*(g/3);
        var gy=y(gv);
        grid+='<line x1="'+l+'" y1="'+gy.toFixed(1)+'" x2="'+(W-r)+'" y2="'+gy.toFixed(1)+'" stroke="#283029" stroke-width="1" />';
        grid+='<text x="'+(l-8)+'" y="'+(gy+4).toFixed(1)+'" fill="#718078" font-size="10" text-anchor="end">'+gv.toFixed(1)+'%</text>';
      }
      var points=series.map(function(d,i){return x(i).toFixed(1)+','+y(d.value).toFixed(1);}).join(' ');
      var labels='';
      [0,Math.floor((series.length-1)/2),series.length-1].filter(function(v,i,a){return a.indexOf(v)===i;}).forEach(function(i){ labels+='<text x="'+x(i).toFixed(1)+'" y="'+(H-10)+'" fill="#718078" font-size="10" text-anchor="middle">'+series[i].year+'</text>'; });
      chart.innerHTML=grid+'<polyline points="'+points+'" fill="none" stroke="#59d77f" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />'+labels+'<circle cx="'+x(selectedIndex).toFixed(1)+'" cy="'+y(selected.value).toFixed(1)+'" r="7" fill="#4ade80" stroke="#0d0f0e" stroke-width="3" />';
    }

    function updateExplorer(){
      if(!series.length) return;
      var index=Math.max(0,Math.min(series.length-1,Number(slider.value)||0));
      var d=series[index];
      valueEl.textContent=d.value.toFixed(1)+'%';
      yearEl.textContent=String(d.year)+' draw';
      renderChart(index);
      var vals=series.map(function(x){return x.value;});
      var min=Math.min.apply(null,vals), max=Math.max.apply(null,vals), avg=vals.reduce(function(a,b){return a+b;},0)/vals.length;
      if(d.value===max) insightEl.textContent=d.year+' is the highest draw percentage in this recorded series at '+d.value.toFixed(1)+'%.';
      else if(d.value===min) insightEl.textContent=d.year+' is the lowest draw percentage in this recorded series at '+d.value.toFixed(1)+'%.';
      else if(d.value>avg*1.25) insightEl.textContent=d.year+' was notably more favourable than this series’ long-run average of '+avg.toFixed(1)+'%.';
      else if(d.value<avg*.75) insightEl.textContent=d.year+' was notably more difficult than this series’ long-run average of '+avg.toFixed(1)+'%.';
      else insightEl.textContent=d.year+' sits relatively close to this series’ long-run average of '+avg.toFixed(1)+'%.';
    }

    fetch('./draws.json',{cache:'no-store'}).then(function(res){
      if(!res.ok) throw new Error('Draw data request failed');
      return res.json();
    }).then(function(rows){
      if(!Array.isArray(rows)) throw new Error('Unexpected draw data format');
      var target=rows.find(function(r){return r && r.Species==='Bison' && String(r.Code)==='1' && String(r.MU||'').indexOf('7-42')===0 && r.yearly_draw_odds;});
      if(!target) target=rows.find(function(r){return r && r.yearly_draw_odds && Object.keys(r.yearly_draw_odds).length>2;});
      if(!target) throw new Error('No historical series found');
      series=Object.keys(target.yearly_draw_odds).map(function(year){return {year:Number(year),value:Number(target.yearly_draw_odds[year])};}).filter(function(d){return Number.isFinite(d.year)&&Number.isFinite(d.value);}).sort(function(a,b){return a.year-b.year;});
      if(series.length<2) throw new Error('Historical series is incomplete');
      titleEl.textContent=(target.Species||'BC LEH')+' · MU '+(target.MU||'—')+' · Hunt Code '+(target.Code||'—');
      subtitleEl.textContent='Historical draw percentage from HuntSmart data';
      slider.min='0'; slider.max=String(series.length-1); slider.value=String(series.length-1); slider.disabled=false;
      slider.addEventListener('input',updateExplorer);
      updateExplorer();
    }).catch(function(err){
      console.warn('[HuntSmart resources] Historical odds explorer:',err);
      setExplorerError('The live historical series could not be loaded. Open HuntSmart to view the current draw data.');
    });
  }
})();
