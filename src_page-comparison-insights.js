/* ARKFLUENCE Creative Comparison Insights */
(function(){
  function esc(v){return escapeHtml(v==null?'':v);}
  function getMetric(data,id){
    var m=aggregate((data.dailyRows||[]).filter(function(r){return r.creativeId===id;}));
    var cv=(data.creatives||[]).filter(function(x){return x.id===id;})[0]||{};
    var creator=(data.creators||[]).filter(function(x){return x.id===cv.creatorId;})[0]||{};
    return {id:id,cv:cv,creator:creator,m:m};
  }
  function insightFor(a,b){
    var attrs=[['hook','Hook'],['angle','Angle'],['format','Format'],['cta','CTA'],['lengthBucket','Length']];
    var diffs=[];
    attrs.forEach(function(x){var av=a.cv[x[0]]||'—',bv=b.cv[x[0]]||'—';if(av!==bv)diffs.push({label:x[1],a:av,b:bv});});
    var metrics=[['roas','ROAS',true,fmtX],['cpa','CPA',false,fmtCurrency2],['ctr','CTR',true,fmtPct],['cvr','CVR',true,fmtPct],['purchases','Purchases',true,fmtNum]];
    var perf=[];
    metrics.forEach(function(x){var av=a.m[x[0]],bv=b.m[x[0]];if(bv===0||!isFinite(av)||!isFinite(bv))return;var pct=(av-bv)/bv*100;if(Math.abs(pct)>=5)perf.push({label:x[1],pct:pct,format:x[3],a:av,b:bv,higher:x[2]});});
    return {diffs:diffs,perf:perf};
  }
  function render(){
    if(!isFullMode())return pageHeader('Comparison insights','Explain observable differences between selected creatives.')+noDataState('comparison insights');
    var d=applyDateRange(App.data), ids=App.params.comparisonIds||[];
    if(ids.length<2)ids=(d.creatives||[]).slice(0,2).map(function(x){return x.id;});
    var all=(d.creatives||[]).map(function(x){return getMetric(d,x.id);});
    var cards=ids.map(function(id){return all.filter(function(x){return x.id===id;})[0];}).filter(Boolean).slice(0,2);
    var opts=all.map(function(x){return '<option value="'+esc(x.id)+'" '+(ids.indexOf(x.id)>=0?'selected':'')+'>'+esc(x.id)+' · '+esc(x.creator.name||'Unknown')+'</option>';}).join('');
    var selector='<div class="score-select"><div><label>Compare A and B</label><select id="comparisonSelect" multiple size="5">'+opts+'</select><div class="sub">Select exactly 2 creatives.</div></div><button class="primary" id="comparisonRun">Analyze</button></div>';
    if(cards.length<2)return pageHeader('Comparison insights','Explain observable differences between selected creatives.')+renderGlobalDateRange()+selector;
    var a=cards[0],b=cards[1],i=insightFor(a,b);
    var attrHtml=i.diffs.length?i.diffs.map(function(x){return '<div class="score-signal neutral"><strong>'+esc(x.label)+'</strong><span>A: '+esc(x.a)+' · B: '+esc(x.b)+'</span></div>';}).join(''):'<p class="sub">No tracked creative-attribute differences detected.</p>';
    var perfHtml=i.perf.length?i.perf.map(function(x){var favorable=x.higher?(x.pct>0):(x.pct<0);return '<div class="score-signal '+(favorable?'positive':'neutral')+'"><strong>'+esc(x.label)+'</strong><span>A is '+Math.abs(x.pct).toFixed(1)+'% '+(x.pct>0?'higher':'lower')+' than B</span></div>';}).join(''):'<p class="sub">No performance metric differed by 5% or more.</p>';
    var summary=i.diffs.length?i.diffs.map(function(x){return x.label.toLowerCase()+' ('+x.a+' vs '+x.b+')';}).join(', '):'the same tracked creative attributes';
    return pageHeader('Comparison insights','Translate creative differences into an evidence-aware comparison.')+renderGlobalDateRange()+selector+
      '<div class="scorecard-grid"><div class="scorecard-card"><div class="score-title"><strong>'+esc(a.id)+'</strong><span>'+esc(a.creator.name||'Unknown')+'</span></div><div class="score-kpis"><div><small>Spend</small><b>'+fmtCurrency(a.m.spend)+'</b></div><div><small>Purchases</small><b>'+fmtNum(a.m.purchases)+'</b></div><div><small>CPA</small><b>'+fmtCurrency2(a.m.cpa)+'</b></div><div><small>ROAS</small><b>'+fmtX(a.m.roas)+'</b></div></div></div><div class="scorecard-card"><div class="score-title"><strong>'+esc(b.id)+'</strong><span>'+esc(b.creator.name||'Unknown')+'</span></div><div class="score-kpis"><div><small>Spend</small><b>'+fmtCurrency(b.m.spend)+'</b></div><div><small>Purchases</small><b>'+fmtNum(b.m.purchases)+'</b></div><div><small>CPA</small><b>'+fmtCurrency2(b.m.cpa)+'</b></div><div><small>ROAS</small><b>'+fmtX(b.m.roas)+'</b></div></div></div></div>'+
      '<section class="score-compare"><h2>Creative attribute differences</h2>'+attrHtml+'</section>'+
      '<section class="score-compare"><h2>Performance signals</h2>'+perfHtml+'</section>'+
      '<div class="explorer-note"><strong>Observed comparison:</strong> A and B differ in '+esc(summary)+'. These relationships describe observed performance and do not prove that a specific attribute caused the outcome.</div>';
  }
  function mount(container){var s=container.querySelector('#comparisonSelect');if(!s)return;container.querySelector('#comparisonRun').onclick=function(){App.params.comparisonIds=Array.prototype.slice.call(s.selectedOptions).map(function(o){return o.value;}).slice(0,2);mountPage();};}
  PAGES.comparisonInsights={render:render,mount:mount};
})();