PAGES.intelligence = {
  render: function () {
    if (App.mode === 'empty') return pageHeader('Creative intelligence', 'Evidence-backed patterns calculated from the selected date range.') + noDataState('creative intelligence');
    if (App.mode === 'csv') return pageHeader('Creative intelligence', 'Evidence-backed patterns calculated from the selected date range.') + csvModeState('Creative intelligence');

    var d = App.data, evidence = d.evidenceInsights || [], lead = evidence[0] || null;
    function metricLabel(i){ return i.metric === 'cpa' ? 'CPA' : i.metric === 'roas' ? 'ROAS' : i.metric === 'ctr' ? 'CTR' : String(i.metric || '').toUpperCase(); }
    function metricValue(i,v){ return i.metric === 'cpa' ? fmtCurrency2(v) : i.metric === 'ctr' ? fmtPct(v) : fmtX(v); }
    function direction(i){ return i.metric === 'cpa' ? (i.delta < 0 ? 'lower' : 'higher') : (i.delta > 0 ? 'higher' : 'lower'); }

    var cards = evidence.slice(0, 8).map(function(i, idx){
      var positive = i.metric === 'cpa' ? i.delta < 0 : i.delta > 0;
      return '<article class="insight-card evidence-card intelligence-card intel-signal-card" data-signal="' + idx + '">' +
        '<div class="intelligence-card-top"><span class="insight-cat">' + escapeHtml(i.category) + '</span><span class="intelligence-rank">0' + (idx+1) + '</span></div>' +
        '<div class="intelligence-quality ' + (positive ? 'signal-positive' : 'signal-neutral') + '">' + escapeHtml(i.quality || 'directional') + ' evidence</div>' +
        '<div class="insight-text">' + escapeHtml(String(i.winner)) + '</div>' +
        '<div class="insight-detail">' + Math.round(Math.abs(i.delta || 0)) + '% ' + direction(i) + ' ' + metricLabel(i) + ' · ' + fmtCurrency(i.spend) + ' spend · ' + fmtNum(i.purchases) + ' purchases</div>' +
        '<div class="evidence-bar"><span>Baseline</span><strong>' + metricValue(i,i.baseline) + '</strong><span>Observed</span><strong>' + metricValue(i,i.value) + '</strong></div>' +
        '</article>';
    }).join('');

    var leadHTML = lead ? '<section class="intel-map-shell">' +
      '<div class="intel-map-copy"><div class="intel-eyebrow">SIGNAL MAP · ' + escapeHtml(lead.quality || 'directional') + '</div>' +
      '<h2>From creative signal to next test.</h2><p>Select a signal below to focus the evidence chain. The map keeps the relationship explicit: attribute → performance → evidence → action.</p>' +
      '<div class="intel-map-metrics"><span><b>01</b> Signal</span><span><b>02</b> Evidence</span><span><b>03</b> Action</span></div></div>' +
      '<div class="intel-flow" aria-label="Creative intelligence flow">' +
        '<div class="intel-node node-signal" data-node="signal"><span>ATTRIBUTE</span><strong id="intelNodeSignal">' + escapeHtml(String(lead.winner)) + '</strong><small>creative signal</small></div>' +
        '<div class="intel-connector"><i></i><b>OBSERVED</b><span class="intel-pulse"></span></div>' +
        '<div class="intel-node node-evidence" data-node="evidence"><span>PERFORMANCE</span><strong id="intelNodeMetric">' + Math.round(Math.abs(lead.delta || 0)) + '% ' + direction(lead) + '</strong><small id="intelNodeMetricSub">' + metricLabel(lead) + ' vs baseline</small></div>' +
        '<div class="intel-connector"><i></i><b>TRANSLATE</b><span class="intel-pulse"></span></div>' +
        '<div class="intel-node node-action" data-node="action"><span>NEXT TEST</span><strong id="intelNodeAction">Create a fresh execution</strong><small>preserve the core signal</small></div>' +
      '</div></section>' :
      '<div class="empty">Not enough spend or impressions to establish evidence-backed patterns.</div>';

    var combos = bestCombos(d);
    var combosTable = tableHTML([
      {key:'combo',label:'Hook + angle + format',align:'left'},
      {key:'n',label:'Creatives',format:function(r){return fmtNum(r.n);}},
      {key:'spend',label:'Spend',format:function(r){return fmtCurrency(r.spend);}},
      {key:'ctr',label:'CTR',format:function(r){return fmtPct(r.ctr);}},
      {key:'cpa',label:'CPA',format:function(r){return fmtCurrency2(r.cpa);}},
      {key:'roas',label:'ROAS',format:function(r){return fmtX(r.roas);}}
    ], combos, {key:'roas',dir:'desc'}, null);

    return pageHeader('Creative intelligence','A cinematic evidence layer connecting creative attributes to performance and the next test.') +
      '<div class="intel-kicker"><span>CREATIVE SIGNALS</span><span>Selected range · evidence engine</span></div>' +
      '<section class="intelligence-command"><div><span class="ops-eyebrow">ARKFLUENCE INTELLIGENCE ENGINE</span><h2>Find the signal hiding inside the creative.</h2><p>Move from observable creative attributes to measured performance, evidence strength and the next test — without losing the chain between them.</p><div class="intelligence-flow"><span>ATTRIBUTE</span><i>→</i><span>PERFORMANCE</span><i>→</i><strong>EVIDENCE</strong><i>→</i><span>ACTION</span></div></div><div class="intelligence-core"><div class="intel-core-ring"></div><span>SIGNALS</span><strong>' + fmtNum(evidence.length) + '</strong><small>detected</small></div></section>' +
      leadHTML +
      '<section><div class="intel-section-head"><div><h2>Evidence signals</h2><p class="sub">Click a signal to focus the intelligence chain.</p></div><span class="intel-count">' + fmtNum(evidence.length) + ' signals</span></div>' +
      '<div class="insight-grid intelligence-grid">' + (cards || '<div class="empty">No evidence-backed signals yet.</div>') + '</div></section>' +
      '<section><div class="intel-section-head"><div><h2>Best performing combinations</h2><p class="sub">Hook + angle + format combinations above the minimum spend threshold.</p></div></div>' + combosTable + '</section>';
  },
  mount: function(container){
    var evidence = (App.data && App.data.evidenceInsights) || [];
    var cards = container.querySelectorAll('.intel-signal-card');
    var signalEl = container.querySelector('#intelNodeSignal');
    var metricEl = container.querySelector('#intelNodeMetric');
    var metricSub = container.querySelector('#intelNodeMetricSub');
    var actionEl = container.querySelector('#intelNodeAction');
    function focusSignal(idx){
      var i = evidence[idx]; if(!i) return;
      cards.forEach(function(c){ c.classList.remove('is-focused'); });
      var card = container.querySelector('.intel-signal-card[data-signal="' + idx + '"]');
      if(card) { card.classList.add('is-focused'); card.scrollIntoView({behavior:'smooth',block:'nearest'}); }
      if(signalEl) signalEl.textContent = String(i.winner);
      var ml = i.metric === 'cpa' ? 'CPA' : i.metric === 'roas' ? 'ROAS' : i.metric === 'ctr' ? 'CTR' : String(i.metric || '').toUpperCase();
      var dir = i.metric === 'cpa' ? (i.delta < 0 ? 'lower' : 'higher') : (i.delta > 0 ? 'higher' : 'lower');
      if(metricEl) metricEl.textContent = Math.round(Math.abs(i.delta || 0)) + '% ' + dir;
      if(metricSub) metricSub.textContent = ml + ' vs baseline · ' + fmtCurrency(i.spend) + ' spend';
      if(actionEl) actionEl.textContent = i.metric === 'cpa' && i.delta < 0 ? 'Create a lower-CPA variation' : 'Create a fresh execution';
    }
    cards.forEach(function(card){
      card.addEventListener('click',function(){ focusSignal(Number(card.dataset.signal)||0); });
    });
    if(evidence.length) focusSignal(0);
    var flow = container.querySelector('.intel-flow');
    if(flow){
      flow.addEventListener('pointermove',function(e){
        var r=flow.getBoundingClientRect();
        flow.style.setProperty('--flow-x',((e.clientX-r.left)/r.width*100).toFixed(1)+'%');
        flow.style.setProperty('--flow-y',((e.clientY-r.top)/r.height*100).toFixed(1)+'%');
      });
      flow.addEventListener('pointerleave',function(){flow.style.removeProperty('--flow-x');flow.style.removeProperty('--flow-y');});
    }
  }
};

function bestCombos(d) {
  var creativeById = {}; d.creatives.forEach(function(cv){ creativeById[cv.id] = cv; });
  var buckets = groupSum(d.dailyRows,function(r){
    var cv = creativeById[r.creativeId]; return cv ? cv.hook + ' / ' + cv.angle + ' / ' + cv.format : 'Unknown';
  });
  return Object.keys(buckets).map(function(k){
    var agg = aggregate(buckets[k]);
    var n = unique(buckets[k].map(function(r){return r.creativeId;})).length;
    return Object.assign({combo:k,n:n},agg);
  }).filter(function(r){return r.spend > 150;}).sort(function(a,b){return b.roas-a.roas;}).slice(0,8);
}
