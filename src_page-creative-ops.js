/* ARKFLUENCE Creative Operations — Phase 3 */
(function () {
  var STATUS = ['Draft','Assigned','In Production','Submitted','Approved','Testing','Live','Completed'];
  var TEST_STATUS = ['Planned','Testing','Learning','Winner','Needs Refresh','Archived'];
  var CLIENT_ID = '00000000-0000-4000-8000-000000000001';
  var state = { briefs: [], tests: [], creators: [], campaigns: [], creatives: [], ads: [], loading: false };

  function client() { return window.AuthClient || null; }
  function esc(v) { return escapeHtml(v == null ? '' : v); }
  function uid(prefix) { return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,7); }

  function statusKind(s) {
    if (s === 'Live' || s === 'Completed' || s === 'Approved') return 'good';
    if (s === 'Testing' || s === 'In Production' || s === 'Submitted') return 'warn';
    return '';
  }

  function briefCard(b) {
    var creator = state.creators.filter(function(c){return c.id===b.creator_id;})[0];
    var campaign = state.campaigns.filter(function(c){return c.id===b.campaign_id;})[0];
    return '<article class="ops-card">' +
      '<div class="ops-card-top"><span class="ops-id">'+esc(b.id)+'</span>'+badge(b.status,statusKind(b.status))+'</div>' +
      '<h3>'+esc(b.title)+'</h3>' +
      '<p class="ops-meta">'+esc(creator ? creator.name : 'Unassigned')+' · '+esc(campaign ? campaign.name : 'No campaign')+'</p>' +
      (b.hypothesis ? '<p class="ops-hypothesis">“'+esc(b.hypothesis)+'”</p>' : '') +
      '<div class="ops-card-foot"><span>'+esc(b.platform || 'Instagram')+'</span><span>'+ (b.due_date ? esc(b.due_date) : 'No due date') +'</span></div>' +
      '<div class="ops-actions">' +
        (b.status !== 'Completed' ? '<button class="btn-small ops-advance" data-id="'+esc(b.id)+'">Advance →</button>' : '') +
        '<button class="btn-small ops-test" data-id="'+esc(b.id)+'">'+(b.status === 'Testing' ? 'Open test' : 'Create test')+'</button>' +
        '<button class="btn-small danger ops-delete" data-id="'+esc(b.id)+'">Delete</button>' +
      '</div></article>';
  }

  function renderBoard() {
    var columns = STATUS.map(function(s){
      var items = state.briefs.filter(function(b){return b.status===s;});
      return '<div class="ops-column"><div class="ops-column-head"><span>'+s+'</span><strong>'+items.length+'</strong></div>' +
        '<div class="ops-column-body">'+(items.length ? items.map(briefCard).join('') : '<div class="ops-empty">No briefs</div>')+'</div></div>';
    }).join('');
    return '<div class="ops-board">'+columns+'</div>';
  }

  function renderTests() {
    var cards = state.tests.map(function(t){
      var b = state.briefs.filter(function(x){return x.id===t.creative_brief_id;})[0];
      return '<div class="test-card"><div><span class="ops-id">'+esc(t.id)+'</span> '+badge(t.status, statusKind(t.status))+'</div>' +
        '<strong>'+(b ? esc(b.title) : esc(t.creative_id || 'Creative test'))+'</strong>' +
        '<span class="ops-meta">'+esc(t.platform || 'Instagram')+' · '+esc(t.launch_date || 'No launch date')+'</span>' +
        '<div class="ops-actions">'+
        '<button class="btn-small test-cycle" data-id="'+esc(t.id)+'">Advance test →</button>'+
        '<button class="btn-small danger test-delete" data-id="'+esc(t.id)+'">Delete</button></div></div>';
    }).join('');
    return '<section class="ops-tests"><div class="ops-section-head ops-section-head-premium"><div><span class="ops-eyebrow">DECISION ENGINE</span><h2>Creative testing</h2><p class="sub">Track each brief from planned test to learning, winner or refresh.</p></div><span class="ops-count">'+fmtNum(state.tests.length)+' tests</span></div>' +
      (cards || '<div class="empty">No creative tests yet. Create a test from a brief when it reaches Testing.</div>') + '</section>';
  }

  function formHTML() {
    var p = App.params && App.params.prefill ? App.params.prefill : {};
    function prefill(name){ return escapeHtml(p[name] || ''); }

    var creatorOpts = '<option value="">Select creator</option>'+state.creators.map(function(c){return '<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>';}).join('');
    var campaignOpts = '<option value="">Select campaign</option>'+state.campaigns.map(function(c){return '<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>';}).join('');
    var creativeOpts = '<option value="">Select creative (optional)</option>'+state.creatives.map(function(c){return '<option value="'+esc(c.id)+'">'+esc(c.id)+' · '+esc(c.hook)+' · '+esc(c.format)+'</option>';}).join('');
    var adOpts = '<option value="">Select ad (optional)</option>'+state.ads.map(function(a){return '<option value="'+esc(a.id)+'">'+esc(a.id)+' · '+esc(a.placement)+'</option>';}).join('');
    return '<section class="ops-form-card"><div class="ops-section-head"><div><h2>New creative brief</h2><p class="sub">Turn a performance insight into an executable creator assignment.</p></div></div>' +
      '<form id="opsBriefForm" class="ops-form">' +
      '<label>Brief title<input name="title" required value="' + prefill('title') + '" placeholder="e.g. Social proof testimonial v2"></label>' +
      '<label>Creator<select name="creator_id">'+creatorOpts+'</select></label>' +
      '<label>Campaign<select name="campaign_id">'+campaignOpts+'</select></label>' +
      '<label>Creative<select name="creative_id">'+creativeOpts+'</select></label>' +
      '<label>Ad<select name="ad_id">'+adOpts+'</select></label>' +
      '<label>Platform<select name="platform"><option>Instagram</option><option>TikTok</option><option>YouTube</option></select></label>' +
      '<label>Objective<input name="objective" value="' + prefill('objective') + '" placeholder="Acquire new customers"></label>' +
      '<label>Due date<input name="due_date" type="date"></label>' +
      '<label class="full">Hypothesis<textarea name="hypothesis" rows="2" placeholder="Why should this creative outperform?">' + prefill('hypothesis') + '</textarea></label>' +
      '<label class="full">Creative direction / deliverables<textarea name="brief" rows="4" placeholder="Hook, talking points, shots, CTA, deliverables…">' + prefill('brief') + '</textarea></label>' +
      '<div class="full ops-form-actions"><button class="primary" type="submit">Create brief</button><span id="opsFormMessage" class="ops-form-message"></span></div>' +
      '</form></section>';
  }

  function load() {
    var c = client();
    if (!c) return Promise.reject(new Error('Authentication client is not available.'));
    state.loading = true;
    return Promise.all([
      c.from('clients').select('id,name').eq('id', CLIENT_ID).maybeSingle(),
      c.from('creators').select('id,name').eq('client_id', CLIENT_ID).order('name'),
      c.from('campaigns').select('id,name').eq('client_id', CLIENT_ID).order('name'),
      c.from('creatives').select('id,hook,format').eq('client_id', CLIENT_ID).order('id'),
      c.from('ads').select('id,placement').eq('client_id', CLIENT_ID).order('id'),
      c.from('creative_briefs').select('*').eq('client_id', CLIENT_ID).order('created_at',{ascending:false}),
      c.from('creative_tests').select('*').eq('client_id', CLIENT_ID).order('created_at',{ascending:false})
    ]).then(function(rs){
      rs.forEach(function(r){if(r.error) throw r.error;});
      state.creators = rs[1].data || [];
      state.campaigns = rs[2].data || [];
      state.creatives = rs[3].data || [];
      state.ads = rs[4].data || [];
      state.briefs = rs[5].data || [];
      state.tests = rs[6].data || [];
      state.loading = false;
    });
  }

  function render() {
    var c = document.getElementById('pageContent');
    if (!c) return;
    c.innerHTML = pageHeader('Creative operations', 'From recommendation → brief → creator production → testing.') + '<div class="ops-kicker"><span>PRODUCTION OS</span><span>Signal → brief → creator → test → decision</span></div>' +
      '<section class="ops-command-hero"><div><span class="ops-eyebrow">CREATIVE PRODUCTION SYSTEM</span><h2>Move the winning signal into production.</h2><p>Every brief is an execution layer between intelligence and paid testing. Keep the hypothesis visible, assign the creator, and advance the work until the result becomes evidence.</p><div class="ops-flow-line"><span>SIGNAL</span><i>→</i><span>BRIEF</span><i>→</i><span>CREATOR</span><i>→</i><strong>TEST</strong></div></div><div class="ops-command-core"><div class="ops-core-ring r1"></div><div class="ops-core-ring r2"></div><div><span>ACTIVE</span><strong>'+state.briefs.filter(function(b){return b.status !== 'Completed';}).length+'</strong><small>open briefs</small></div></div></section>' +
      '<div class="ops-summary">' +
        kpiCard('Total briefs', fmtNum(state.briefs.length)) +
        kpiCard('In production', fmtNum(state.briefs.filter(function(b){return b.status==='In Production';}).length)) +
        kpiCard('Testing', fmtNum(state.briefs.filter(function(b){return b.status==='Testing';}).length)) +
        kpiCard('Live', fmtNum(state.briefs.filter(function(b){return b.status==='Live';}).length)) +
      '</div>' + formHTML() +
      '<section><div class="ops-section-head ops-section-head-premium"><div><span class="ops-eyebrow">WORKFLOW</span><h2>Production pipeline</h2><p class="sub">Move a brief forward as the creator workflow progresses.</p></div><span class="ops-count">'+fmtNum(state.briefs.length)+' briefs</span></div>'+renderBoard()+'</section>' +
      renderTests();
    wire();
  }

  function message(text, kind) {
    var el=document.getElementById('opsFormMessage'); if(!el) return;
    el.textContent=text; el.className='ops-form-message '+(kind||'');
  }

  function createBrief(form) {
    var c=client(); if(!c) return Promise.reject(new Error('Not authenticated.'));
    var fd=new FormData(form);
    var row={
      id:uid('BRIEF'),
      client_id:CLIENT_ID,
      title:String(fd.get('title')||'').trim(),
      creator_id:fd.get('creator_id')||null,
      campaign_id:fd.get('campaign_id')||null,
      platform:fd.get('platform')||'Instagram',
      objective:String(fd.get('objective')||'').trim()||null,
      hypothesis:String(fd.get('hypothesis')||'').trim()||null,
      brief:String(fd.get('brief')||'').trim()||null,
      due_date:fd.get('due_date')||null,
      status:'Draft',
      test_status:'Planned',
      creative_id:fd.get('creative_id')||null,
      ad_id:fd.get('ad_id')||null
    };
    if(!row.title) return Promise.reject(new Error('Add a brief title.'));
    return c.auth.getUser().then(function(u){
      if(u.data && u.data.user) row.created_by=u.data.user.id;
      return c.from('creative_briefs').insert(row).select().single();
    }).then(function(r){if(r.error)throw r.error; state.briefs.unshift(r.data);});
  }

  function advanceBrief(id) {
    var b=state.briefs.filter(function(x){return x.id===id;})[0]; if(!b) return Promise.resolve();
    var idx=STATUS.indexOf(b.status), next=STATUS[Math.min(idx+1,STATUS.length-1)];
    if(next===b.status) return Promise.resolve();
    return client().from('creative_briefs').update({status:next,updated_at:new Date().toISOString()}).eq('id',id).eq('client_id',CLIENT_ID).select().single()
      .then(function(r){if(r.error)throw r.error;b.status=r.data.status;if(b.status==='Testing') return ensureTest(b);});
  }

  function ensureTest(b) {
    var existing=state.tests.filter(function(t){return t.creative_brief_id===b.id;})[0];
    if(existing) return Promise.resolve();
    var row={id:uid('TEST'),client_id:CLIENT_ID,creative_brief_id:b.id,creator_id:b.creator_id,creative_id:b.creative_id||null,campaign_id:b.campaign_id,ad_id:b.ad_id||null,platform:b.platform||'Instagram',launch_date:b.due_date||null,status:'Planned'};
    return client().from('creative_tests').insert(row).select().single().then(function(r){if(r.error)throw r.error;state.tests.unshift(r.data);});
  }

  function advanceTest(id) {
    var t=state.tests.filter(function(x){return x.id===id;})[0]; if(!t) return Promise.resolve();
    var idx=TEST_STATUS.indexOf(t.status), next=TEST_STATUS[Math.min(idx+1,TEST_STATUS.length-1)];
    if(next===t.status) return Promise.resolve();
    return client().from('creative_tests').update({status:next,updated_at:new Date().toISOString()}).eq('id',id).eq('client_id',CLIENT_ID).select().single()
      .then(function(r){if(r.error)throw r.error;t.status=r.data.status;});
  }

  function deleteBrief(id) {
    var c=client();
    return c.from('creative_briefs').delete().eq('id',id).eq('client_id',CLIENT_ID).then(function(r){if(r.error)throw r.error;state.briefs=state.briefs.filter(function(b){return b.id!==id;});state.tests=state.tests.filter(function(t){return t.creative_brief_id!==id;});});
  }

  function deleteTest(id) {
    return client().from('creative_tests').delete().eq('id',id).eq('client_id',CLIENT_ID).then(function(r){if(r.error)throw r.error;state.tests=state.tests.filter(function(t){return t.id!==id;});});
  }

  function wire() {
    var form=document.getElementById('opsBriefForm');
    if(form) form.addEventListener('submit',function(e){
      e.preventDefault(); var btn=form.querySelector('button[type=submit]'); btn.disabled=true; message('Saving…','');
      createBrief(form).then(function(){form.reset();message('Brief created.','success');render();}).catch(function(err){message(err.message||String(err),'error');}).finally(function(){btn.disabled=false;});
    });
    document.querySelectorAll('.ops-advance').forEach(function(btn){btn.addEventListener('click',function(){btn.disabled=true;advanceBrief(btn.dataset.id).then(render).catch(function(e){alert(e.message||e);});});});
    document.querySelectorAll('.ops-test').forEach(function(btn){btn.addEventListener('click',function(){var b=state.briefs.filter(function(x){return x.id===btn.dataset.id;})[0];if(!b)return;ensureTest(b).then(render).catch(function(e){alert(e.message||e);});});});
    document.querySelectorAll('.ops-delete').forEach(function(btn){btn.addEventListener('click',function(){if(confirm('Delete this creative brief?'))deleteBrief(btn.dataset.id).then(render).catch(function(e){alert(e.message||e);});});});
    document.querySelectorAll('.test-cycle').forEach(function(btn){btn.addEventListener('click',function(){btn.disabled=true;advanceTest(btn.dataset.id).then(render).catch(function(e){alert(e.message||e);});});});
    document.querySelectorAll('.test-delete').forEach(function(btn){btn.addEventListener('click',function(){if(confirm('Delete this creative test?'))deleteTest(btn.dataset.id).then(render).catch(function(e){alert(e.message||e);});});});
  }

  PAGES.creativeOps = {
    render: function(){
      if(!window.AuthClient) return pageHeader('Creative operations','Sign in to manage creative production.')+'<div class="empty">Authentication is required.</div>';
      return pageHeader('Creative operations','Loading your production workspace…')+'<div class="empty">Loading…</div>';
    },
    mount: function(){ load().then(render).catch(function(e){var c=document.getElementById('pageContent');if(c)c.innerHTML=pageHeader('Creative operations','Your production workspace.')+'<div class="empty big"><p><strong>Could not load Creative Operations.</strong></p><p>'+esc(e.message||e)+'</p></div>';}); }
  };

  function loadTestingCenter() {
    var c = client();
    if (!c) return Promise.reject(new Error('Authentication client is not available.'));
    return c.auth.getUser().then(function(u){
      if (!u.data || !u.data.user) throw new Error('Please sign in again.');
      return c.from('client_memberships').select('client_id,role').eq('user_id',u.data.user.id).limit(1).maybeSingle();
    }).then(function(m){
      if (m.error) throw m.error;
      if (!m.data) throw new Error('No workspace membership found for this account.');
      var cid = m.data.client_id;
      return Promise.all([
        c.from('creative_tests').select('*').eq('client_id',cid).order('created_at',{ascending:false}),
        c.from('creative_briefs').select('id,title,creator_id,campaign_id,platform,creative_id,ad_id').eq('client_id',cid),
        c.from('creatives').select('id,creator_id,campaign_id,hook,angle,format').eq('client_id',cid),
        c.from('ads').select('id,creative_id,placement').eq('client_id',cid),
        c.from('daily_metrics').select('creative_id,spend,clicks,purchases,revenue').eq('client_id',cid)
      ]).then(function(rs){
        rs.forEach(function(x){if(x.error) throw x.error;});
        var metrics={};
        (rs[4].data||[]).forEach(function(row){
          var x=metrics[row.creative_id]||(metrics[row.creative_id]={spend:0,clicks:0,purchases:0,revenue:0});
          x.spend+=Number(row.spend)||0; x.clicks+=Number(row.clicks)||0; x.purchases+=Number(row.purchases)||0; x.revenue+=Number(row.revenue)||0;
        });
        Object.keys(metrics).forEach(function(id){
          var x=metrics[id]; x.cpa=x.purchases?x.spend/x.purchases:0; x.roas=x.spend?x.revenue/x.spend:0;
        });
        return {tests:rs[0].data||[],briefs:rs[1].data||[],creatives:rs[2].data||[],ads:rs[3].data||[],metrics:metrics};
      });
    });
  }

  function renderTestingCenter(data) {
    var tests=data.tests;
    var byStatus={}; TEST_STATUS.forEach(function(s){byStatus[s]=tests.filter(function(t){return t.status===s;}).length;});
    var all=Object.keys(data.metrics).map(function(k){return data.metrics[k];});
    var base={spend:0,purchases:0,revenue:0};
    all.forEach(function(x){base.spend+=x.spend;base.purchases+=x.purchases;base.revenue+=x.revenue;});
    base.cpa=base.purchases?base.spend/base.purchases:0;
    base.roas=base.spend?base.revenue/base.spend:0;

    function signal(m){
      if(!m || m.spend<1000 || m.purchases<30) return {label:'Directional',kind:'',text:'More spend/data needed'};
      if(base.cpa && m.cpa <= base.cpa*0.9 && m.roas >= base.roas*1.05) return {label:'Winner candidate',kind:'good',text:'CPA and ROAS are both better than the blended baseline'};
      if(base.cpa && m.cpa >= base.cpa*1.1 && m.roas <= base.roas*0.95) return {label:'Needs refresh',kind:'warn',text:'CPA and ROAS are both weaker than the blended baseline'};
      return {label:'Learning',kind:'warn',text:'Performance is mixed versus the blended baseline'};
    }

    var cards=tests.map(function(t){
      var b=data.briefs.filter(function(x){return x.id===t.creative_brief_id;})[0];
      var cv=data.creatives.filter(function(x){return x.id===t.creative_id;})[0];
      var metric=data.metrics[t.creative_id]||null;
      var sig=signal(metric);
      var confidence = !metric || metric.spend<1000 || metric.purchases<30 ? 28 : Math.min(100, Math.round((Math.min(metric.spend/5000,1)*45)+(Math.min(metric.purchases/100,1)*55)));
      var decisionStage = sig.label === 'Winner candidate' ? 'SCALE SIGNAL' : sig.label === 'Needs refresh' ? 'REFRESH SIGNAL' : sig.label === 'Learning' ? 'LEARNING' : 'COLLECT DATA';
      var performance=metric ?
        '<div class="test-metrics"><span>'+fmtCurrency(metric.spend)+' spend</span><span>'+fmtNum(metric.purchases)+' purchases</span><span>'+fmtCurrency2(metric.cpa)+' CPA</span><span>'+fmtX(metric.roas)+' ROAS</span></div>'+
        '<div class="test-signal '+(sig.kind||'')+'"><strong>'+esc(sig.label)+'</strong><span>'+esc(sig.text)+'</span></div>' :
        '<div class="test-no-data">No linked performance data yet</div>';
      var link=!cv ? '<div class="test-link-row"><select class="test-link-select" data-id="'+esc(t.id)+'"><option value="">Link a creative…</option>'+data.creatives.map(function(x){return '<option value="'+esc(x.id)+'">'+esc(x.id)+' · '+esc(x.hook)+' · '+esc(x.format)+'</option>';}).join('')+'</select><button class="btn-small test-link" data-id="'+esc(t.id)+'">Link</button></div>' : '';
      var decision=(metric && metric.spend>=1000 && metric.purchases>=30 && sig.label!=='Learning' && sig.label!=='Directional') ?
        '<div class="ops-actions"><button class="btn-small test-decision" data-id="'+esc(t.id)+'" data-status="'+(sig.label==='Winner candidate'?'Winner':'Needs Refresh')+'">Mark '+(sig.label==='Winner candidate'?'Winner':'Needs Refresh')+'</button></div>' : '';
      return '<article class="test-center-card">'+
        '<div class="test-center-top"><span class="ops-id">'+esc(t.id)+'</span>'+badge(t.status,statusKind(t.status))+'</div>'+
        '<h3>'+esc(b ? b.title : (cv ? cv.id : 'Creative test'))+'</h3>'+
        '<p class="ops-meta">'+esc(cv ? (cv.hook+' · '+cv.angle+' · '+cv.format) : 'No creative linked')+'</p>'+
        link+performance+
        '<div class="test-center-foot"><span>'+esc(t.platform||'Instagram')+'</span><span>'+esc(t.launch_date||'No launch date')+'</span></div>'+
        decision+
        '<div class="ops-actions"><button class="btn-small test-center-advance" data-id="'+esc(t.id)+'">Advance →</button></div>'+
      '</article>';
    }).join('');

    var summary=TEST_STATUS.map(function(s){return kpiCard(s,fmtNum(byStatus[s]));}).join('');
    return pageHeader('Creative testing','Track hypotheses from planned test → learning → winner or refresh.')+
      '<div class="test-command-hero"><div><span class="ops-eyebrow">DECISION ENGINE</span><h2>Which creative earns the next move?</h2><p>Compare each linked test against the blended creative baseline and turn evidence into a clear testing decision.</p><div class="test-decision-flow"><span>SPEND</span><i>→</i><span>OUTCOME</span><i>→</i><strong>DECISION</strong></div></div><div class="test-command-orb"><span>TESTS</span><strong>'+fmtNum(tests.length)+'</strong><small>in evaluation</small><div class="test-orb-ring"></div></div></div>'+
      '<div class="ops-summary test-summary">'+summary+'</div>'+
      '<section><div class="ops-section-head"><div><span class="ops-eyebrow">EVIDENCE QUEUE</span><h2>Testing center</h2><p class="sub">Performance is linked to the creative when a test has a creative_id.</p></div></div>'+
      (cards || '<div class="empty big"><p><strong>No creative tests yet.</strong></p><p>Create a brief in Creative operations, then create a test from that brief.</p></div>')+
      '</section>';
  }

  PAGES.creativeTesting = {
    render: function(){ return pageHeader('Creative testing','Loading your test workspace…')+'<div class="empty">Loading…</div>'; },
    mount: function(){
      loadTestingCenter().then(function(data){
        var c=document.getElementById('pageContent');
        if(c){c.innerHTML=renderTestingCenter(data);
          c.querySelectorAll('.test-link').forEach(function(btn){
            btn.addEventListener('click',function(){
              var sel=c.querySelector('.test-link-select[data-id="'+btn.dataset.id+'"]');
              if(!sel || !sel.value) return;
              btn.disabled=true;
              client().from('creative_tests').update({creative_id:sel.value,updated_at:new Date().toISOString()}).eq('id',btn.dataset.id).then(function(r){
                if(r.error) throw r.error;
                return loadTestingCenter();
              }).then(function(d2){c.innerHTML=renderTestingCenter(d2);}).catch(function(e){btn.disabled=false;alert(e.message||e);});
            });
          });
          c.querySelectorAll('.test-decision').forEach(function(btn){
            btn.addEventListener('click',function(){
              var status=btn.dataset.status, id=btn.dataset.id;
              btn.disabled=true;
              client().from('creative_tests').update({status:status,updated_at:new Date().toISOString()}).eq('id',id).then(function(r){
                if(r.error) throw r.error;
                return loadTestingCenter();
              }).then(function(d){c.innerHTML=renderTestingCenter(d);}).catch(function(e){btn.disabled=false;alert(e.message||e);});
            });
          });
          c.querySelectorAll('.test-center-advance').forEach(function(btn){
          btn.addEventListener('click',function(){
            var t=data.tests.filter(function(x){return x.id===btn.dataset.id;})[0]; if(!t)return;
            var idx=TEST_STATUS.indexOf(t.status), next=TEST_STATUS[Math.min(idx+1,TEST_STATUS.length-1)];
            if(next===t.status)return;
            btn.disabled=true;
            client().from('creative_tests').update({status:next,updated_at:new Date().toISOString()}).eq('id',t.id).then(function(r){
              if(r.error) throw r.error; btn.textContent='Updated'; btn.disabled=true; loadTestingCenter().then(function(d){c.innerHTML=renderTestingCenter(d);});
            }).catch(function(e){btn.disabled=false;alert(e.message||e);});
          });
        });}
      }).catch(function(e){
        var c=document.getElementById('pageContent');
        if(c)c.innerHTML=pageHeader('Creative testing','Your test workspace.')+'<div class="empty big"><p><strong>Could not load Creative Testing.</strong></p><p>'+esc(e.message||e)+'</p></div>';
      });
    }
  };
})();