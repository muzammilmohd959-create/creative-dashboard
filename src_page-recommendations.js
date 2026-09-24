/* ARKFLUENCE Recommendations — insight to action */
(function(){
  function authClient(){ return window.AuthClient || null; }
  function esc(v){ return escapeHtml(v == null ? '' : v); }

  function loadTestFeedback(){
    var c=authClient();
    if(!c) return Promise.resolve([]);
    return c.auth.getUser().then(function(u){
      if(!u.data || !u.data.user) return [];
      return c.from('client_memberships').select('client_id').eq('user_id',u.data.user.id).limit(1).maybeSingle();
    }).then(function(m){
      if(!m || m.error || !m.data) return [];
      var cid=m.data.client_id;
      return Promise.all([
        c.from('creative_tests').select('id,creative_brief_id,creative_id,platform,status,updated_at').eq('client_id',cid).in('status',['Winner','Needs Refresh','Learning']).order('updated_at',{ascending:false}),
        c.from('creative_briefs').select('id,title,creator_id,campaign_id').eq('client_id',cid),
        c.from('creatives').select('id,hook,angle,format').eq('client_id',cid),
        c.from('daily_metrics').select('creative_id,spend,purchases,revenue').eq('client_id',cid)
      ]).then(function(rs){
        for(var i=0;i<rs.length;i++) if(rs[i].error) throw rs[i].error;
        var metrics={};
        (rs[3].data||[]).forEach(function(row){
          var x=metrics[row.creative_id]||(metrics[row.creative_id]={spend:0,purchases:0,revenue:0});
          x.spend+=Number(row.spend)||0; x.purchases+=Number(row.purchases)||0; x.revenue+=Number(row.revenue)||0;
        });
        Object.keys(metrics).forEach(function(id){var x=metrics[id];x.cpa=x.purchases?x.spend/x.purchases:0;x.roas=x.spend?x.revenue/x.spend:0;});
        return (rs[0].data||[]).map(function(t){
          var b=(rs[1].data||[]).filter(function(x){return x.id===t.creative_brief_id;})[0];
          var cv=(rs[2].data||[]).filter(function(x){return x.id===t.creative_id;})[0];
          return {test:t,brief:b,creative:cv,metric:metrics[t.creative_id]||null};
        });
      });
    });
  }

  function patternHTML(items){
    var winners=items.filter(function(x){return x.test.status==='Winner' && x.creative && x.metric;});
    if(!winners.length) return '';
    var groups={};
    winners.forEach(function(x){
      var cv=x.creative, m=x.metric, key=[cv.hook,cv.angle,cv.format].join(' | ');
      var g=groups[key]||(groups[key]={hook:cv.hook,angle:cv.angle,format:cv.format,tests:0,spend:0,purchases:0,revenue:0,creators:{}});
      g.tests++; g.spend+=m.spend; g.purchases+=m.purchases; g.revenue+=m.revenue;
      if(x.brief && x.brief.creator_id) g.creators[x.brief.creator_id]=true;
    });
    var rows=Object.keys(groups).map(function(k){var g=groups[k];g.cpa=g.purchases?g.spend/g.purchases:0;g.roas=g.spend?g.revenue/g.spend:0;return g;}).sort(function(a,b){return b.roas-a.roas;});
    return '<section class="validated-patterns"><div class="ops-section-head"><div><h2>Validated creative patterns</h2><p class="sub">Patterns derived only from tests marked Winner.</p></div></div><div class="pattern-grid">'+rows.map(function(g,idx){
      var strength=g.tests>=3?'Strong':g.tests===2?'Moderate':'Emerging';
      return '<article class="pattern-card"><div class="rec-top"><span class="insight-cat">PATTERN · '+strength+'</span><span class="rec-index">P-'+String(idx+1).padStart(2,'0')+'</span></div><h2>'+esc(g.hook)+' / '+esc(g.angle)+' / '+esc(g.format)+'</h2><div class="pattern-stats"><span>'+g.tests+' winner'+(g.tests===1?'':'s')+'</span><span>'+fmtCurrency(g.spend)+' spend</span><span>'+fmtNum(g.purchases)+' purchases</span><span>'+fmtCurrency2(g.cpa)+' CPA</span><span>'+fmtX(g.roas)+' ROAS</span></div><p class="rec-action"><strong>Pattern:</strong> Preserve this hook + angle + format combination while testing a fresh execution.</p><button class="primary pattern-create" data-pattern="'+esc(g.hook+' / '+g.angle+' / '+g.format)+'" data-proof="'+esc(fmtCurrency(g.spend)+' spend · '+fmtNum(g.purchases)+' purchases · '+fmtCurrency2(g.cpa)+' CPA · '+fmtX(g.roas)+' ROAS')+'">Create next variation →</button></article>';
    }).join('')+'</div></section>';
  }

  function feedbackHTML(items){
    if(!items.length) return '';
    var cards=items.map(function(x){
      var t=x.test,m=x.metric,cv=x.creative,b=x.brief;
      var action=t.status==='Winner' ? 'Scale the winning pattern with a fresh execution.' : t.status==='Needs Refresh' ? 'Create a new variation and change the weak creative signal.' : 'Collect more evidence before making a decision.';
      var proof=m ? fmtCurrency(m.spend)+' spend · '+fmtNum(m.purchases)+' purchases · '+fmtCurrency2(m.cpa)+' CPA · '+fmtX(m.roas)+' ROAS' : 'No linked performance metrics';
      var button=(t.status==='Winner'||t.status==='Needs Refresh') ? '<button class="primary feedback-create" data-status="'+esc(t.status)+'" data-title="'+esc(b?b.title:(cv?cv.id:'Creative test'))+'" data-pattern="'+esc(cv?(cv.hook+' / '+cv.angle+' / '+cv.format):'winning creative pattern')+'" data-proof="'+esc(proof)+'">Create follow-up brief →</button>' : '';
      return '<article class="rec-card feedback-card"><div class="rec-top"><span class="insight-cat">TEST · '+esc(t.status)+'</span><span class="rec-index">'+esc(t.id)+'</span></div><h2>'+esc(b?b.title:(cv?cv.id:'Creative test'))+'</h2><p class="rec-proof">'+esc(cv?(cv.hook+' · '+cv.angle+' · '+cv.format):'No creative linked')+'</p><div class="rec-evidence"><span>Performance</span><strong>'+esc(proof)+'</strong></div><p class="rec-action"><strong>Next action:</strong> '+esc(action)+'</p>'+button+'</article>';
    }).join('');
    return '<section class="test-feedback-section"><div class="ops-section-head"><div><h2>Test feedback</h2><p class="sub">Completed test decisions feeding the next creative cycle.</p></div></div><div class="recommendation-grid">'+cards+'</div></section>';
  }

  PAGES.recommendations = {
    render: function () {
      if (App.mode === 'empty') return pageHeader('Recommendations','Turn evidence-backed performance patterns into the next creative test.') + noDataState('recommendations');
      if (App.mode === 'csv') return pageHeader('Recommendations','Turn evidence-backed performance patterns into the next creative test.') + csvModeState('recommendations');
      var d=App.data, evidence=d.evidenceInsights||[];
      var cards=evidence.map(function(i,idx){
        var metric=i.metric==='cpa'?'CPA':(i.metric==='ctr'?'CTR':(i.metric==='roas'?'ROAS':String(i.metric||'').toUpperCase()));
        var direction=i.metric==='cpa'?(i.delta<0?'lower':'higher'):(i.delta>0?'higher':'lower');
        var proof=Math.round(Math.abs(i.delta||0))+'% '+direction+' '+metric+' · '+fmtCurrency(i.spend)+' spend · '+fmtNum(i.purchases)+' purchases';
        return '<article class="rec-card"><div class="rec-top"><span class="insight-cat">'+escapeHtml(i.category)+' · '+escapeHtml(i.quality||'directional')+'</span><span class="rec-index">REC-'+String(idx+1).padStart(2,'0')+'</span></div><h2>'+escapeHtml(String(i.winner))+'</h2><p class="rec-proof">'+escapeHtml(proof)+'</p><div class="rec-evidence"><span>Baseline</span><strong>'+escapeHtml(i.metric==='cpa'?fmtCurrency2(i.baseline):i.metric==='ctr'?fmtPct(i.baseline):fmtX(i.baseline))+'</strong><span>Observed</span><strong>'+escapeHtml(i.metric==='cpa'?fmtCurrency2(i.value):i.metric==='ctr'?fmtPct(i.value):fmtX(i.value))+'</strong></div><p class="rec-action"><strong>Suggested test:</strong> Test more '+escapeHtml(String(i.winner))+' creative executions because this pattern is outperforming the comparison baseline.</p><button class="primary rec-create" data-winner="'+escapeHtml(String(i.winner))+'" data-proof="'+escapeHtml(proof)+'">Create creative brief →</button></article>';
      }).join('');
      return pageHeader('Recommendations','Evidence-backed actions for the next creative testing cycle.')+
        '<div class="rec-intro"><strong>'+fmtNum(evidence.length)+' evidence-backed opportunities</strong><span>Minimum spend and performance thresholds are applied by the intelligence engine.</span></div>'+
        '<section><div class="recommendation-grid">'+(cards||'<div class="empty">No evidence-backed recommendations yet.</div>')+'</div></section>'+
        '<div id="testFeedbackMount"></div><div id="patternMount"></div>';
    },
    mount: function(container){
      container.querySelectorAll('.rec-create').forEach(function(btn){
        btn.addEventListener('click',function(){
          setPage('creativeOps',{prefill:{title:'Test '+btn.dataset.winner,objective:'Validate a repeatable performance pattern',hypothesis:btn.dataset.winner+' has shown '+btn.dataset.proof+'. Test a new execution against the current baseline.',brief:'Create a new creator-led execution around the winning pattern. Preserve the core signal while introducing a fresh variation, clear CTA and measurable test setup.',platform:'Instagram'}});
        });
      });
      loadTestFeedback().then(function(items){
        var mount=document.getElementById('testFeedbackMount');
        if(!mount)return;
        mount.innerHTML=feedbackHTML(items);
        var pm=document.getElementById('patternMount');
        if(pm) pm.innerHTML=patternHTML(items);
        container.querySelectorAll('.pattern-create').forEach(function(btn){
          btn.addEventListener('click',function(){
            setPage('creativeOps',{prefill:{title:'New variation · '+btn.dataset.pattern,objective:'Scale a validated creative pattern',hypothesis:'Validated winner pattern: '+btn.dataset.pattern+'. Evidence: '+btn.dataset.proof+'. Test a fresh execution while preserving the core pattern.',brief:'Preserve the validated hook, angle and format. Create a new creator-led variation with a different opening, visual treatment or CTA so the pattern can be tested without duplicating the original.',platform:'Instagram'}});
          });
        });
        mount.querySelectorAll('.feedback-create').forEach(function(btn){
          btn.addEventListener('click',function(){
            var status=btn.dataset.status;
            setPage('creativeOps',{prefill:{title:(status==='Winner'?'Scale ':'Refresh ')+btn.dataset.title,objective:status==='Winner'?'Scale a validated creative pattern':'Improve a weak creative pattern',hypothesis:'Previous test '+status.toLowerCase()+': '+btn.dataset.pattern+'. Performance evidence: '+btn.dataset.proof+'.',brief:(status==='Winner'?'Create a fresh variation that preserves the winning signal while testing a new hook, creator or execution.':'Create a new variation that changes the weak signal while retaining the useful parts of the original concept.'),platform:'Instagram'}});
          });
        });
      }).catch(function(){});
    }
  };
})();