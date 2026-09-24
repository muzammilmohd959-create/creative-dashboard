/* ARKFLUENCE Creative Scorecard */
(function(){
  function metricFor(data,id){
    var rows=(data.dailyRows||[]).filter(function(r){return r.creativeId===id;});
    var m=aggregate(rows), cv=(data.creatives||[]).filter(function(x){return x.id===id;})[0]||{};
    var creator=(data.creators||[]).filter(function(x){return x.id===cv.creatorId;})[0]||{};
    return {id:id,creative:cv,creator:creator,spend:m.spend,purchases:m.purchases,revenue:m.revenue,impressions:m.impressions,clicks:m.clicks,cpa:m.cpa,roas:m.roas,ctr:m.ctr,cvr:m.cvr};
  }
  function signal(a,b,key,higher,label,format){
    if(!a||!b||a[key]==null||b[key]==null)return '';
    var av=Number(a[key]),bv=Number(b[key]); if(!isFinite(av)||!isFinite(bv)||bv===0)return '';
    var pct=((av-bv)/bv)*100, stronger=higher?av>bv:av<bv;
    return '<div class="score-signal '+(stronger?'positive':'neutral')+'"><strong>'+escapeHtml(label)+'</strong><span>'+format(av)+' vs '+format(bv)+' · '+(pct>=0?'+':'')+pct.toFixed(1)+'%</span></div>';
  }
  function differenceInsights(a,b){
    var out=[];
    var attrs=[['hook','Hook'],['angle','Angle'],['format','Format'],['cta','CTA'],['lengthBucket','Length']];
    attrs.forEach(function(x){
      var av=a.creative[x[0]]||'—', bv=b.creative[x[0]]||'—';
      if(av!==bv) out.push({label:x[1],a:av,b:bv});
    });
    var perf=[];
    function add(key,label,higher){
      var av=Number(a[key]),bv=Number(b[key]); if(!isFinite(av)||!isFinite(bv)||!bv)return;
      var pct=((av-bv)/bv)*100;
      if(Math.abs(pct)>=5) perf.push({label:label,a:av,b:bv,pct:pct,higher:higher});
    }
    add('roas','ROAS',true); add('cpa','CPA',false); add('ctr','CTR',true); add('cvr','CVR',true); add('purchases','Purchases',true);
    return {attrs:out,perf:perf};
  }
  function comparisonInsights(a,b){
    var x=differenceInsights(a,b), html='<section class="score-compare"><h2>Observable creative differences</h2>';
    if(!x.attrs.length) html+='<p class="sub">The selected creatives share the tracked creative attributes.</p>';
    else x.attrs.forEach(function(v){html+='<div class="score-signal neutral"><strong>'+escapeHtml(v.label)+'</strong><span>'+escapeHtml(v.a)+' vs '+escapeHtml(v.b)+'</span></div>';});
    html+='</section><section class="score-compare"><h2>Performance signals</h2>';
    if(!x.perf.length) html+='<p class="sub">No material difference of 5%+ was detected in the selected metrics.</p>';
    else x.perf.forEach(function(v){var dir=v.pct>0?'higher':'lower';html+='<div class="score-signal '+(v.higher?(v.pct>0?'positive':'neutral'):(v.pct<0?'positive':'neutral'))+'"><strong>'+escapeHtml(v.label)+'</strong><span>Creative A is '+Math.abs(v.pct).toFixed(1)+'% '+dir+' than B</span></div>';});
    html+='</section>';
    return html;
  }
  function renderScorecard(){
    if(!isFullMode())return pageHeader('Creative scorecard','Compare creatives using the active date range.')+noDataState('creative scorecard');
    var d=applyDateRange(App.data), all=(d.creatives||[]).map(function(c){return metricFor(d,c.id);}).sort(function(a,b){return b.spend-a.spend;});
    var selected=(App.params.scorecardIds||[]).filter(function(id){return all.some(function(x){return x.id===id;});});
    if(!selected.length)selected=all.slice(0,2).map(function(x){return x.id;});
    var cards=selected.map(function(id){return all.filter(function(x){return x.id===id;})[0];}).filter(Boolean);
    var opts=all.map(function(x){return '<option value="'+escapeHtml(x.id)+'" '+(selected.indexOf(x.id)>=0?'selected':'')+'>'+escapeHtml(x.id)+' · '+escapeHtml(x.creator.name||'Unknown')+'</option>';}).join('');
    var head='<div class="score-select"><div><label>Compare creatives</label><select id="scorecardCreatives" multiple size="4">'+opts+'</select><div class="sub">Select 2–4 creatives, then compare.</div></div><button class="primary" id="scorecardRun">Compare</button></div>';
    if(cards.length<2)return pageHeader('Creative scorecard','Compare creatives using the active date range.')+renderGlobalDateRange()+head+'<div class="empty">Select at least two creatives.</div>';
    var cols=cards.map(function(x){return '<div class="scorecard-card"><div class="score-title"><strong>'+escapeHtml(x.id)+'</strong><span>'+escapeHtml(x.creator.name||'Unknown creator')+'</span></div><div class="score-kpis"><div><small>Spend</small><b>'+fmtCurrency(x.spend)+'</b></div><div><small>Purchases</small><b>'+fmtNum(x.purchases)+'</b></div><div><small>CPA</small><b>'+fmtCurrency2(x.cpa)+'</b></div><div><small>ROAS</small><b>'+fmtX(x.roas)+'</b></div></div><div class="score-meta"><span>Hook: '+escapeHtml(x.creative.hook||'—')+'</span><span>Angle: '+escapeHtml(x.creative.angle||'—')+'</span><span>Format: '+escapeHtml(x.creative.format||'—')+'</span><span>CTA: '+escapeHtml(x.creative.cta||'—')+'</span></div></div>';}).join('');
    var a=cards[0], b=cards[1];
    var compare='<section class="score-compare"><h2>Performance differences</h2>'+signal(a,b,'roas',true,'ROAS',fmtX)+signal(a,b,'cpa',false,'CPA',fmtCurrency2)+signal(a,b,'ctr',true,'CTR',fmtPct)+signal(a,b,'cvr',true,'CVR',fmtPct)+signal(a,b,'purchases',true,'Purchases',fmtNum)+'</section>'+comparisonInsights(a,b);
    return pageHeader('Creative scorecard','Compare creative performance and isolate the observable differences between executions.')+renderGlobalDateRange()+
      '<section class="scorecard-command"><div><span class="ops-eyebrow">CREATIVE DIFFERENTIAL</span><h2>Put two executions under the same lens.</h2><p>Separate the creative fingerprint from the performance signal. The scorecard makes the comparison explicit without turning correlation into causation.</p><div class="scorecard-flow"><span>SELECT</span><i>→</i><span>COMPARE</span><i>→</i><strong>ISOLATE</strong></div></div><div class="scorecard-core"><span>CREATIVES</span><strong>'+cards.length+'</strong><small>under lens</small></div></section>'+head+'<div class="scorecard-grid">'+cols+'</div>'+compare+'<div class="explorer-note"><strong>Interpretation guardrail.</strong> This scorecard describes observed differences in the selected date range. It does not establish that one creative attribute caused the performance difference.</div>';
  }
  function mountScorecard(container){
    var s=container.querySelector('#scorecardCreatives'); if(!s)return;
    container.querySelector('#scorecardRun').onclick=function(){App.params.scorecardIds=Array.prototype.slice.call(s.selectedOptions).map(function(o){return o.value;}).slice(0,4);mountPage();};
  }
  PAGES.creativeScorecard={render:renderScorecard,mount:mountScorecard};
})();