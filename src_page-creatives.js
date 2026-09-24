PAGES.creatives = {
  render: function () {
    if (App.mode === 'empty') return pageHeader('Creatives', 'The core analytical layer \u2014 every ad creative, with hook, angle and format performance.') + noDataState('creative-level performance');
    if (App.mode === 'csv') return pageHeader('Creatives', 'The core analytical layer \u2014 every ad creative, with hook, angle and format performance.') + csvModeState('Creative-level detail');
    if (App.params.creativeId) return renderCreativeDetail(App.params.creativeId);

    var d = App.data;
    var viewToggle = '<div class="seg">' +
      '<button class="seg-btn' + (App.creativesView === 'table' ? ' active' : '') + '" data-view="table">Table</button>' +
      '<button class="seg-btn' + (App.creativesView === 'library' ? ' active' : '') + '" data-view="library">Library</button>' +
      '</div>';

    var filters = renderCreativeFilters(d);
    var allRows = getFilteredCreatives(d);

    var quickStats = renderCreativeQuickStats(d);

    var body;
    if (App.creativesView === 'library') {
      body = renderCreativeGrid(allRows);
    } else {
      var sorted = sortRows(allRows, App.creativesSort, fullCreativeColumns());
      body = tableHTML(fullCreativeColumns(), sorted, App.creativesSort, 'id', 'No creatives match these filters.');
    }

    var libraryHero = '<section class="creative-library-hero">' +
      '<div><span class="detail-eyebrow">CREATIVE LIBRARY</span><h2>Every execution has a fingerprint.</h2><p>Explore the hook, angle, format and paid outcome behind every piece of creator content. Switch to Library for a visual workspace or Table for dense analysis.</p></div>' +
      '<div class="creative-library-orbit"><div class="cl-orbit o1"></div><div class="cl-orbit o2"></div><div class="cl-core"><span>CREATIVE</span><strong>DNA</strong></div><i></i><b></b><em></em></div>' +
      '</section>';
    return pageHeader('Creatives', 'The core analytical layer \u2014 every ad creative, with hook, angle and format performance.', viewToggle) +
      '<div class="data-kicker"><span>CREATIVE LIBRARY</span><span>Click any creative to open its workspace</span></div>' +
      libraryHero + quickStats + filters + body;
  },
  mount: function (container) {
    if (!isFullMode()) return;
    if (App.params.creativeId) { mountCreativeDetail(container, App.params.creativeId); return; }

    container.querySelectorAll('.seg-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { App.creativesView = btn.getAttribute('data-view'); mountPage(); });
    });
    wireCreativeFilters(container);
    container.querySelectorAll('.stat-chip[data-sort]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        App.creativesSort = { key: chip.getAttribute('data-sort'), dir: chip.getAttribute('data-dir') };
        App.creativesView = 'table';
        mountPage();
      });
    });
    if (App.creativesView === 'library') {
      wireLibraryClicks(container);
    } else {
      wireTable(container, App.creativesSort, function () { mountPage(); }, function (id) { setPage('creatives', { creativeId: id }); });
    }
  }
};

function getFilteredCreatives(d) {
  var f = App.creativesFilter;
  var rows = d.creatives.map(function (cv) {
    var creator = d.creators.filter(function (c) { return c.id === cv.creatorId; })[0];
    var campaign = d.campaigns.filter(function (c) { return c.id === cv.campaignId; })[0];
    return Object.assign({
      id: cv.id, creatorId: cv.creatorId, campaignId: cv.campaignId,
      creatorName: creator ? creator.name : cv.creatorId, campaignName: campaign ? campaign.name : cv.campaignId,
      hook: cv.hook, angle: cv.angle, format: cv.format, videoLength: cv.videoLength, cta: cv.cta, launchDate: cv.launchDate
    }, d.creativeMetrics[cv.id] || aggregate([]));
  });
  if (f.creator) rows = rows.filter(function (r) { return r.creatorId === f.creator; });
  if (f.campaign) rows = rows.filter(function (r) { return r.campaignId === f.campaign; });
  if (f.hook) rows = rows.filter(function (r) { return r.hook === f.hook; });
  if (f.angle) rows = rows.filter(function (r) { return r.angle === f.angle; });
  if (f.format) rows = rows.filter(function (r) { return r.format === f.format; });
  if (f.perf === 'top') rows = rows.filter(function (r) { return r.roas >= 4; });
  if (f.perf === 'under') rows = rows.filter(function (r) { return r.roas < 2.5; });
  return rows;
}

function renderCreativeFilters(d) {
  var f = App.creativesFilter;
  function opt(val, label, current) { return '<option value="' + escapeHtml(val) + '"' + (current === val ? ' selected' : '') + '>' + escapeHtml(label) + '</option>'; }
  var creatorOpts = '<option value="">All creators</option>' + d.creators.map(function (c) { return opt(c.id, c.name, f.creator); }).join('');
  var campaignOpts = '<option value="">All campaigns</option>' + d.campaigns.map(function (c) { return opt(c.id, c.name, f.campaign); }).join('');
  var hookOpts = '<option value="">All hooks</option>' + HOOKS.map(function (h) { return opt(h, h, f.hook); }).join('');
  var angleOpts = '<option value="">All angles</option>' + ANGLES.map(function (a) { return opt(a, a, f.angle); }).join('');
  var formatOpts = '<option value="">All formats</option>' + FORMATS.map(function (fm) { return opt(fm, fm, f.format); }).join('');
  var perfOpts = '<option value="">All performance</option>' + opt('top', 'Top performers (ROAS \u2265 4x)', f.perf) + opt('under', 'Underperformers (ROAS < 2.5x)', f.perf);

  return '<div class="filter-row">' +
    '<select id="filtCreator">' + creatorOpts + '</select>' +
    '<select id="filtCampaign">' + campaignOpts + '</select>' +
    '<select id="filtHook">' + hookOpts + '</select>' +
    '<select id="filtAngle">' + angleOpts + '</select>' +
    '<select id="filtFormat">' + formatOpts + '</select>' +
    '<select id="filtPerf">' + perfOpts + '</select>' +
    '<button id="filtReset">Reset</button>' +
    '</div>';
}

function wireCreativeFilters(container) {
  var map = { filtCreator: 'creator', filtCampaign: 'campaign', filtHook: 'hook', filtAngle: 'angle', filtFormat: 'format', filtPerf: 'perf' };
  Object.keys(map).forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('change', function () { App.creativesFilter[map[id]] = el.value; mountPage(); });
  });
  var reset = document.getElementById('filtReset');
  if (reset) reset.addEventListener('click', function () {
    App.creativesFilter = { creator: '', campaign: '', hook: '', angle: '', format: '', perf: '' };
    mountPage();
  });
}

function renderCreativeQuickStats(d) {
  var rows = d.creatives.map(function (cv) { return Object.assign({ id: cv.id }, d.creativeMetrics[cv.id] || aggregate([])); }).filter(function (r) { return r.spend > 30; });
  if (!rows.length) return '';
  var byRoas = rows.slice().sort(function (a, b) { return b.roas - a.roas; });
  var byCpa = rows.slice().sort(function (a, b) { return a.cpa - b.cpa; });
  var byCtr = rows.slice().sort(function (a, b) { return b.ctr - a.ctr; });
  var worst = rows.slice().sort(function (a, b) { return a.roas - b.roas; });
  var chips = [
    { label: 'Top creative', val: byRoas[0].id, sub: fmtX(byRoas[0].roas) + ' ROAS', sort: 'roas', dir: 'desc' },
    { label: 'Lowest CPA', val: byCpa[0].id, sub: fmtCurrency2(byCpa[0].cpa), sort: 'cpa', dir: 'asc' },
    { label: 'Highest ROAS', val: byRoas[0].id, sub: fmtX(byRoas[0].roas), sort: 'roas', dir: 'desc' },
    { label: 'Highest CTR', val: byCtr[0].id, sub: fmtPct(byCtr[0].ctr), sort: 'ctr', dir: 'desc' },
    { label: 'Worst performer', val: worst[0].id, sub: fmtX(worst[0].roas) + ' ROAS', sort: 'roas', dir: 'asc' }
  ];
  return '<div class="chip-row">' + chips.map(function (c) {
    return '<div class="stat-chip" data-sort="' + c.sort + '" data-dir="' + c.dir + '"><div class="chip-label">' + c.label + '</div><div class="chip-val">' + escapeHtml(c.val) + '</div><div class="chip-sub">' + c.sub + '</div></div>';
  }).join('') + '</div>';
}

function fullCreativeColumns() {
  return [
    { key: 'id', label: 'Creative', align: 'left' },
    { key: 'creatorName', label: 'Creator', align: 'left' },
    { key: 'campaignName', label: 'Campaign', align: 'left' },
    { key: 'hook', label: 'Hook', align: 'left' },
    { key: 'angle', label: 'Angle', align: 'left' },
    { key: 'format', label: 'Format', align: 'left' },
    { key: 'spend', label: 'Spend', format: function (r) { return fmtCurrency(r.spend); } },
    { key: 'impressions', label: 'Impr.', format: function (r) { return fmtNum(r.impressions); } },
    { key: 'clicks', label: 'Clicks', format: function (r) { return fmtNum(r.clicks); } },
    { key: 'ctr', label: 'CTR', format: function (r) { return fmtPct(r.ctr); } },
    { key: 'cpc', label: 'CPC', format: function (r) { return fmtCurrency2(r.cpc); } },
    { key: 'purchases', label: 'Purchases', format: function (r) { return fmtNum(r.purchases); } },
    { key: 'cvr', label: 'Conv. rate', format: function (r) { return fmtPct1(r.cvr); } },
    { key: 'cpa', label: 'CPA', format: function (r) { return fmtCurrency2(r.cpa); } },
    { key: 'revenue', label: 'Revenue', format: function (r) { return fmtCurrency(r.revenue); } },
    { key: 'roas', label: 'ROAS', format: function (r) { return fmtX(r.roas); } }
  ];
}

function renderCreativeGrid(rows) {
  if (!rows.length) return '<div class="empty">No creatives match these filters.</div>';
  var d = App.data;
  return '<div class="creative-grid">' + rows.map(function (r) {
    var creator = d.creators.filter(function (c) { return c.id === r.creatorId; })[0];
    var m = r.roas !== undefined ? r : Object.assign({}, d.creativeMetrics[r.id] || aggregate([]));
    return '<div class="creative-card clickable-row" data-row-id="' + escapeHtml(r.id) + '">' +
      thumb({ format: r.format }, creator) +
      '<div class="cc-id">' + escapeHtml(r.id) + '</div>' +
      '<div class="cc-creator">' + escapeHtml(r.creatorName || (creator ? creator.name : '')) + '</div>' +
      '<div class="cc-hook">' + escapeHtml(r.hook) + ' \u00b7 ' + escapeHtml(r.angle) + '</div>' +
      '<div class="cc-metrics"><span>' + fmtCurrency(m.spend) + ' spend</span><span>' + fmtCurrency2(m.cpa) + ' CPA</span><span>' + fmtX(m.roas) + ' ROAS</span></div>' +
      '<div class="cc-workspace-cta"><span>CREATIVE WORKSPACE</span><b>Open workspace →</b></div>' +
      '</div>';
  }).join('') + '</div>';
}

function wireLibraryClicks(container) {
  container.querySelectorAll('.clickable-row').forEach(function (card) {
    card.addEventListener('click', function () { setPage('creatives', { creativeId: card.getAttribute('data-row-id') }); });
  });
}

function renderCreativeDetail(creativeId) {
  var d = App.data;
  var cv = d.creatives.filter(function (c) { return c.id === creativeId; })[0];
  if (!cv) return '<div class="empty">Creative not found.</div>';
  var creator = d.creators.filter(function (c) { return c.id === cv.creatorId; })[0];
  var campaign = d.campaigns.filter(function (c) { return c.id === cv.campaignId; })[0];
  var m = d.creativeMetrics[creativeId] || aggregate([]);
  var baseline = d.overall || aggregate([]);
  var roasDelta = baseline.roas ? ((m.roas - baseline.roas) / baseline.roas) * 100 : 0;
  var cpaDelta = baseline.cpa ? ((m.cpa - baseline.cpa) / baseline.cpa) * 100 : 0;

  var backBtn = '<button class="link-btn" onclick="setPage(\'creatives\',{})">← All creatives</button>';
  var badges = [badge(cv.hook), badge(cv.angle), badge(cv.format), cv.videoLength ? badge(cv.videoLength + 's') : '', badge(cv.cta)].join(' ');
  var links = '<a href="javascript:void(0)" class="link-inline" data-creator="' + cv.creatorId + '">' + escapeHtml(creator ? creator.name : '') + '</a> · ' +
    '<a href="javascript:void(0)" class="link-inline" data-campaign="' + cv.campaignId + '">' + escapeHtml(campaign ? campaign.name : '') + '</a>';

  var kpis = [
    kpiCard('Spend', fmtCurrency(m.spend)), kpiCard('Impressions', fmtNum(m.impressions)), kpiCard('Clicks', fmtNum(m.clicks)),
    kpiCard('CTR', fmtPct(m.ctr)), kpiCard('CPC', fmtCurrency2(m.cpc)), kpiCard('Purchases', fmtNum(m.purchases)),
    kpiCard('Conv. rate', fmtPct1(m.cvr)), kpiCard('CPA', fmtCurrency2(m.cpa)), kpiCard('Revenue', fmtCurrency(m.revenue)), kpiCard('ROAS', fmtX(m.roas))
  ].join('');

  var adsRows = d.ads.filter(function (a) { return a.creativeId === creativeId; }).map(function (a) {
    return Object.assign({ id: a.id, placement: a.placement }, d.adMetrics[a.id] || aggregate([]));
  });
  var adsTable = tableHTML([
    { key: 'id', label: 'Ad', align: 'left' }, { key: 'placement', label: 'Placement', align: 'left' },
    { key: 'spend', label: 'Spend', format: function (r) { return fmtCurrency(r.spend); } },
    { key: 'ctr', label: 'CTR', format: function (r) { return fmtPct(r.ctr); } },
    { key: 'cpa', label: 'CPA', format: function (r) { return fmtCurrency2(r.cpa); } },
    { key: 'roas', label: 'ROAS', format: function (r) { return fmtX(r.roas); } }
  ], adsRows, { key: 'spend', dir: 'desc' }, null);

  var signalClass = roasDelta >= 5 ? 'positive' : roasDelta <= -5 ? 'negative' : 'neutral';
  var signalLabel = roasDelta >= 5 ? 'Above baseline' : roasDelta <= -5 ? 'Below baseline' : 'Near baseline';

  return '<div class="detail-kicker"><span>CREATIVE WORKSPACE</span><span>Hook → angle → execution → outcome</span></div>' +
    pageHeader(creativeId, 'Creative detail', backBtn) +
    '<div class="creative-workspace-hero">' +
      '<div class="creative-workspace-main">' +
        '<div class="creative-visual-stage"><div class="creative-visual-ring r1"></div><div class="creative-visual-ring r2"></div><div class="creative-visual-core">' + thumb(cv, creator) + '<span>CREATIVE</span><strong>' + escapeHtml(cv.format || 'CONTENT') + '</strong></div><div class="creative-visual-dot d1"></div><div class="creative-visual-dot d2"></div><div class="creative-visual-dot d3"></div></div>' +
        '<div class="creative-workspace-copy"><span class="detail-eyebrow">CREATIVE SIGNAL</span><h2>' + escapeHtml(cv.hook) + '</h2><p class="creative-workspace-angle">' + escapeHtml(cv.angle) + ' · ' + escapeHtml(cv.format) + (cv.videoLength ? ' · ' + escapeHtml(cv.videoLength + 's') : '') + '</p><div class="detail-badges">' + badges + '</div><p class="creative-context-line">' + links + '</p><p class="creative-workspace-description">A single execution viewed across its creative fingerprint, paid distribution and observed outcome. Use the evidence below to decide what should be preserved or changed in the next variation.</p></div>' +
      '</div>' +
      '<div class="creative-signal-panel">' +
        '<span class="detail-eyebrow">PERFORMANCE SIGNAL</span><div class="creative-signal-value ' + signalClass + '">' + fmtX(m.roas) + '<small>ROAS</small></div><strong>' + signalLabel + '</strong><p>ROAS is ' + Math.abs(Math.round(roasDelta)) + '% ' + (roasDelta >= 0 ? 'above' : 'below') + ' the account baseline.</p>' +
        '<div class="creative-signal-bars"><div><span>ROAS</span><i><b style="width:' + Math.min(100, Math.max(8, m.roas / Math.max(baseline.roas || 1, 1) * 60)) + '%"></b></i></div><div><span>CTR</span><i><b style="width:' + Math.min(100, Math.max(8, m.ctr * 500)) + '%"></b></i></div><div><span>CVR</span><i><b style="width:' + Math.min(100, Math.max(8, m.cvr * 500)) + '%"></b></i></div></div>' +
      '</div>' +
    '</div>' +
    '<div class="detail-kpi-grid">' + kpis + '</div>' +
    '<div class="creative-fingerprint">' +
      '<div class="creative-fingerprint-head"><div><span class="detail-eyebrow">CREATIVE FINGERPRINT</span><h2>What makes this execution this execution.</h2></div><span class="detail-count">5 attributes</span></div>' +
      '<div class="fingerprint-grid"><div><span>HOOK</span><strong>' + escapeHtml(cv.hook || '—') + '</strong></div><div><span>ANGLE</span><strong>' + escapeHtml(cv.angle || '—') + '</strong></div><div><span>FORMAT</span><strong>' + escapeHtml(cv.format || '—') + '</strong></div><div><span>CTA</span><strong>' + escapeHtml(cv.cta || '—') + '</strong></div><div><span>LENGTH</span><strong>' + escapeHtml(cv.videoLength ? cv.videoLength + 's' : '—') + '</strong></div></div>' +
    '</div>' +
    '<div class="detail-context-row"><div><span class="detail-eyebrow">CREATOR</span><strong>' + escapeHtml(creator ? creator.name : '—') + '</strong><span>Source</span></div><div><span class="detail-eyebrow">CAMPAIGN</span><strong>' + escapeHtml(campaign ? campaign.name : '—') + '</strong><span>Distribution context</span></div><div><span class="detail-eyebrow">CPA VS BASELINE</span><strong>' + Math.abs(Math.round(cpaDelta)) + '% ' + (cpaDelta <= 0 ? 'lower' : 'higher') + '</strong><span>Observed difference</span></div></div>' +
    '<section><div class="detail-section-head"><div><span class="detail-eyebrow">PERFORMANCE TRAJECTORY</span><h2>Outcome over time</h2></div><span class="detail-count">' + fmtCurrency(m.spend) + ' spend</span></div><div class="chart-card detail-chart-shell"><div class="chart-body" style="height:290px;"><canvas id="creativeTrendChart" role="img" aria-label="Spend and revenue over time for this creative"></canvas></div></div></section>' +
    '<section><div class="detail-section-head"><div><span class="detail-eyebrow">DISTRIBUTION</span><h2>Ads under this creative</h2></div><span class="detail-count">' + fmtNum(adsRows.length) + ' placements</span></div>' + adsTable + '</section>' +
    '<section class="creative-intelligence-panel"><div class="detail-section-head"><div><span class="detail-eyebrow">CREATIVE INTELLIGENCE</span><h2>What the system sees</h2><p class="sub">Observed signals across this execution, its attributes and the account baseline.</p></div><span class="detail-count">LIVE SIGNALS</span></div><div id="creativeIntelligenceSignals" class="creative-intelligence-grid"></div></section>' +
    '<section class="creative-testing-history"><div class="detail-section-head"><div><span class="detail-eyebrow">TESTING HISTORY</span><h2>How this creative has been tested</h2><p class="sub">Production and testing states connected to this execution.</p></div><span id="creativeTestCount" class="detail-count">LOADING</span></div><div id="creativeTestingHistory" class="creative-testing-timeline"><div class="creative-history-loading">Reading test history…</div></div></section>';
}

function mountCreativeDetail(container, creativeId) {
  container.querySelectorAll('[data-creator]').forEach(function (a) { a.addEventListener('click', function () { setPage('creators', { creatorId: a.getAttribute('data-creator') }); }); });
  container.querySelectorAll('[data-campaign]').forEach(function (a) { a.addEventListener('click', function () { setPage('campaigns', { campaignId: a.getAttribute('data-campaign') }); }); });

  renderCreativeIntelligence(creativeId);
  loadCreativeTestingHistory(creativeId);

  var d = App.data;
  var rows = d.dailyRows.filter(function (r) { return r.creativeId === creativeId; });
  var byDate = groupSum(rows, function (r) { return r.date; });
  var series = Object.keys(byDate).sort().map(function (date) { return Object.assign({ date: date }, aggregate(byDate[date])); });
  var colors = themeColors();
  var canvas = document.getElementById('creativeTrendChart');
  if (canvas) {
    App.charts.creativeTrend = new Chart(canvas, {
      type: 'line',
      data: { labels: series.map(function (r) { return fmtDateShort(r.date); }), datasets: [
        { label: 'Spend', data: series.map(function (r) { return round2(r.spend); }), borderColor: colors.neg, backgroundColor: colors.neg + '22', borderWidth: 2, pointRadius: 0, tension: 0.25 },
        { label: 'Revenue', data: series.map(function (r) { return round2(r.revenue); }), borderColor: colors.pos, backgroundColor: colors.pos + '22', borderWidth: 2, pointRadius: 0, tension: 0.25 }
      ] },
      options: chartOptsLine(colors)
    });
  }
}

function renderCreativeIntelligence(creativeId) {
  var root = document.getElementById('creativeIntelligenceSignals');
  if (!root || !App.data) return;
  var d = App.data;
  var cv = d.creatives.filter(function(c){return c.id===creativeId;})[0];
  var m = d.creativeMetrics[creativeId] || aggregate([]);
  var baseline = d.overall || aggregate([]);
  var roasDelta = baseline.roas ? ((m.roas-baseline.roas)/baseline.roas)*100 : 0;
  var cpaDelta = baseline.cpa ? ((m.cpa-baseline.cpa)/baseline.cpa)*100 : 0;

  var signals = [
    {
      type: roasDelta >= 5 ? 'POSITIVE' : roasDelta <= -5 ? 'NEGATIVE' : 'NEUTRAL',
      label:'Performance signal',
      value: fmtX(m.roas) + ' ROAS',
      text: Math.abs(Math.round(roasDelta)) + '% ' + (roasDelta >= 0 ? 'above' : 'below') + ' the account ROAS baseline.'
    },
    {
      type: cpaDelta <= -5 ? 'POSITIVE' : cpaDelta >= 5 ? 'NEGATIVE' : 'NEUTRAL',
      label:'Efficiency signal',
      value: fmtCurrency2(m.cpa) + ' CPA',
      text: Math.abs(Math.round(cpaDelta)) + '% ' + (cpaDelta <= 0 ? 'below' : 'above') + ' the account CPA baseline.'
    },
    {
      type:'ATTRIBUTE',
      label:'Creative fingerprint',
      value: (cv.hook || 'Hook') + ' · ' + (cv.angle || 'Angle'),
      text:'Preserve the observable fingerprint while changing one execution variable in the next variation.'
    }
  ];
  root.innerHTML = signals.map(function(x){
    var cls=x.type==='POSITIVE'?'good':x.type==='NEGATIVE'?'bad':'neutral';
    return '<article class="creative-intel-card '+cls+'"><div class="creative-intel-top"><span>'+escapeHtml(x.label)+'</span><b>'+escapeHtml(x.type)+'</b></div><strong>'+escapeHtml(x.value)+'</strong><p>'+escapeHtml(x.text)+'</p><i></i></article>';
  }).join('');
}

function loadCreativeTestingHistory(creativeId) {
  var root = document.getElementById('creativeTestingHistory');
  var count = document.getElementById('creativeTestCount');
  if (!root) return;
  var c = window.AuthClient || null;
  if (!c) {
    root.innerHTML='<div class="creative-history-empty">Sign in to load testing history.</div>';
    if(count) count.textContent='AUTH REQUIRED';
    return;
  }
  Promise.all([
    c.from('creative_tests').select('id,creative_id,creative_brief_id,status,platform,launch_date,created_at,updated_at').eq('creative_id',creativeId).order('created_at',{ascending:false}),
    c.from('creative_briefs').select('id,title,status,test_status,hypothesis,due_date,created_at,updated_at').eq('creative_id',creativeId).order('created_at',{ascending:false})
  ]).then(function(res){
    var tests=res[0].data||[], briefs=res[1].data||[];
    if(res[0].error) throw res[0].error;
    var events=[];
    tests.forEach(function(t){events.push({date:t.updated_at||t.created_at,type:'TEST',title:t.status||'Test',meta:(t.platform||'Instagram')+' · '+(t.launch_date||'No launch date'),status:t.status});});
    briefs.forEach(function(b){events.push({date:b.updated_at||b.created_at,type:'BRIEF',title:b.title||'Creative brief',meta:(b.status||'Draft')+' · '+(b.test_status||'Planned'),status:b.test_status||b.status});});
    events.sort(function(a,b){return String(b.date).localeCompare(String(a.date));});
    if(count) count.textContent=events.length+' EVENTS';
    if(!events.length){
      root.innerHTML='<div class="creative-history-empty"><strong>No testing history yet.</strong><span>Move this creative into Creative Operations to start a measurable test.</span><button class="link-btn" onclick="setPage(\'creativeOps\',{})">Open Creative Operations →</button></div>';
      return;
    }
    root.innerHTML=events.slice(0,8).map(function(e,i){
      var kind=e.type==='TEST'?'TEST':'BRIEF';
      return '<div class="creative-history-item"><div class="creative-history-line"><i></i>'+(i<events.length-1?'<b></b>':'')+'</div><div class="creative-history-content"><div class="creative-history-meta"><span>'+kind+'</span><time>'+escapeHtml(String(e.date).slice(0,10))+'</time></div><strong>'+escapeHtml(e.title)+'</strong><p>'+escapeHtml(e.meta)+'</p><em>'+escapeHtml(e.status||'Recorded')+'</em></div></div>';
    }).join('');
  }).catch(function(err){
    root.innerHTML='<div class="creative-history-empty"><strong>Testing history unavailable.</strong><span>'+escapeHtml(err.message||'Could not load test history.')+'</span></div>';
    if(count) count.textContent='UNAVAILABLE';
  });
}
