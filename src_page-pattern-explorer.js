/* ARKFLUENCE Creative Pattern Explorer */
(function(){
  function rowsForDimension(data,key){
    var groups={};
    (data.dailyRows||[]).forEach(function(r){
      var cv=(data.creatives||[]).filter(function(x){return x.id===r.creativeId;})[0];
      if(!cv)return;
      var value=key==='creator' ? ((data.creators||[]).filter(function(x){return x.id===cv.creatorId;})[0]||{}).name :
        key==='campaign' ? ((data.campaigns||[]).filter(function(x){return x.id===cv.campaignId;})[0]||{}).name : cv[key];
      if(!value)return;
      var g=groups[value]||(groups[value]={name:value,spend:0,impressions:0,clicks:0,purchases:0,revenue:0,creativeIds:{}});
      g.spend+=Number(r.spend)||0;g.impressions+=Number(r.impressions)||0;g.clicks+=Number(r.clicks)||0;g.purchases+=Number(r.purchases)||0;g.revenue+=Number(r.revenue)||0;g.creativeIds[r.creativeId]=true;
    });
    return Object.keys(groups).map(function(k){
      var g=groups[k];g.creatives=Object.keys(g.creativeIds).length;g.cpa=g.purchases?g.spend/g.purchases:0;g.roas=g.spend?g.revenue/g.spend:0;g.ctr=g.impressions?g.clicks/g.impressions:0;g.cvr=g.clicks?g.purchases/g.clicks:0;return g;
    }).filter(function(g){return g.spend>=100;}).sort(function(a,b){return b.roas-a.roas;});
  }
  function renderExplorer(){
    if(!isFullMode()) return pageHeader('Pattern explorer','Compare the creative signals associated with performance.')+noDataState('pattern explorer');
    var d=applyDateRange(App.data), dims=[['hook','Hooks'],['angle','Angles'],['format','Formats'],['creator','Creators'],['campaign','Campaigns']];
    var sections=dims.map(function(dim){
      var rows=rowsForDimension(d,dim[0]), best=rows[0];
      var body=rows.map(function(g,idx){
        var evidence=g.spend>=1000&&g.purchases>=30?'Strong':g.spend>=500&&g.purchases>=15?'Moderate':'Directional';
        return '<tr><td class="pattern-rank">'+(idx+1)+'</td><td><strong>'+escapeHtml(g.name)+'</strong><div class="sub">'+evidence+' evidence · '+g.creatives+' creatives</div></td><td>'+fmtCurrency(g.spend)+'</td><td>'+fmtNum(g.purchases)+'</td><td>'+fmtCurrency2(g.cpa)+'</td><td>'+fmtX(g.roas)+'</td><td>'+fmtPct(g.ctr)+'</td><td>'+fmtPct(g.cvr)+'</td></tr>';
      }).join('');
      return '<section class="explorer-section pattern-section"><div class="pattern-section-top"><div><div class="pattern-dimension-label">0'+(dims.indexOf(dim)+1)+'</div><h2>'+dim[1]+'</h2><p class="sub">'+(best?'Leading signal: '+escapeHtml(best.name)+' · '+fmtX(best.roas)+' ROAS · '+fmtCurrency2(best.cpa)+' CPA':'No qualified data')+'</p></div></div><div class="table-wrap"><table><thead><tr><th>#</th><th>Signal</th><th>Spend</th><th>Purchases</th><th>CPA</th><th>ROAS</th><th>CTR</th><th>CVR</th></tr></thead><tbody>'+body+'</tbody></table></div></section>';
    }).join('');
    return pageHeader('Pattern explorer','Map the creative signals associated with performance across the active date range.')+'<div class="pattern-kicker"><span>SIGNAL MAP</span><span>Compare dimensions · validate before scaling</span></div>'+
      '<section class="pattern-command"><div><span class="ops-eyebrow">PATTERN DISCOVERY</span><h2>See which creative dimensions keep showing up.</h2><p>Explore hooks, angles, formats, creators and campaigns as measurable signal groups. Rankings are evidence maps — not causal claims.</p><div class="pattern-flow"><span>DISCOVER</span><i>→</i><span>COMPARE</span><i>→</i><strong>VALIDATE</strong></div></div><div class="pattern-core"><span>DIMENSIONS</span><strong>05</strong><small>signal layers</small></div></section>'+renderGlobalDateRange()+'<div class="explorer-note pattern-note"><div><strong>Association, not causation.</strong><span>Rankings summarize observed performance and evidence volume; use Creative Testing to validate a signal before scaling it.</span></div><span class="pattern-note-badge">5 dimensions</span></div><div class="pattern-dimension-grid">'+sections+'</div>';
  }
  PAGES.patternExplorer={render:renderExplorer,mount:function(){}};
})();