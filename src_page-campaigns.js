PAGES.campaigns = {
  render: function () {
    if (App.mode === 'empty') return pageHeader('Campaigns', 'Budget, spend and outcomes for every campaign.') + noDataState('your campaigns');
    if (App.mode === 'csv') return pageHeader('Campaigns', 'Budget, spend and outcomes for every campaign.') + csvModeState('Campaign detail');
    if (App.params.campaignId) return renderCampaignDetail(App.params.campaignId);

    var d = App.data;
    var rows = d.campaigns.map(function (c) {
      var m = d.campaignMetrics[c.id] || aggregate([]);
      var creativesInCamp = d.creatives.filter(function (cv) { return cv.campaignId === c.id; });
      var creatorsInCamp = unique(creativesInCamp.map(function (cv) { return cv.creatorId; }));
      return Object.assign({
        id: c.id, name: c.name, objective: c.objective, budget: c.budget, status: c.status,
        creatorCount: creatorsInCamp.length, creativeCount: creativesInCamp.length
      }, m);
    });
    var sorted = sortRows(rows, App.campaignsSort, campaignColumns());
    var campaignHero = '<section class="campaign-control-hero"><div><span class="detail-eyebrow">CAMPAIGN CONTROL ROOM</span><h2>Budget is the input. Creative performance is the signal.</h2><p>Track allocation, creative mix and commercial outcome from the same operating surface.</p></div><div class="campaign-pulse"><div><span>CAMPAIGNS</span><strong>' + rows.length + '</strong></div><div><span>SPEND</span><strong>' + fmtCurrency(d.overall.spend) + '</strong></div><div><span>ROAS</span><strong>' + fmtX(d.overall.roas) + '</strong></div></div></section>';
    return '<div class="data-kicker"><span>CAMPAIGN CONTROL</span><span>Budget → spend → outcome</span></div>' + pageHeader('Campaigns', 'Budget, spend and outcomes for every campaign.') + campaignHero + tableHTML(campaignColumns(), sorted, App.campaignsSort, 'id', null, renderCampaignRowExpansion);
  },
  mount: function (container) {
    if (!isFullMode()) return;
    if (App.params.campaignId) { mountCampaignDetail(container, App.params.campaignId); return; }
    wireTable(container, App.campaignsSort, function () { mountPage(); }, function (id) { setPage('campaigns', { campaignId: id }); });
  }
};


function renderCampaignRowExpansion(row) {
  var d = App.data;
  var creatives = d.creatives.filter(function(cv){ return cv.campaignId === row.id; });
  var creatorIds = unique(creatives.map(function(cv){ return cv.creatorId; }));
  var creatorRows = creatorIds.map(function(cid){
    var creator = d.creators.filter(function(x){ return x.id === cid; })[0];
    var rows = d.dailyRows.filter(function(x){ return x.campaignId === row.id && x.creatorId === cid; });
    return Object.assign({name: creator ? creator.name : cid}, aggregate(rows));
  }).sort(function(a,b){ return (b.revenue||0)-(a.revenue||0); });
  var topCreators = creatorRows.slice(0,3);
  var maxRevenue = Math.max.apply(null, topCreators.map(function(x){return x.revenue||0;}).concat([1]));
  var pctBudget = row.budget ? Math.min(100,(row.spend/row.budget)*100) : 0;

  return '<div class="grid-insight-panel">' +
    '<div class="grid-insight-main">' +
      '<div class="grid-insight-eyebrow">CAMPAIGN SIGNAL</div>' +
      '<div class="grid-insight-title">' + escapeHtml(row.name) + '<span>LIVE PERFORMANCE PROFILE</span></div>' +
      '<div class="grid-insight-flow"><span>BUDGET</span><i>→</i><span>CREATIVE MIX</span><i>→</i><span>OUTCOME</span></div>' +
    '</div>' +
    '<div class="grid-insight-metrics">' +
      '<div><span>Budget used</span><strong>' + pctBudget.toFixed(0) + '%</strong><small>' + fmtCurrency(row.spend) + ' / ' + fmtCurrency(row.budget) + '</small></div>' +
      '<div><span>Revenue</span><strong>' + fmtCurrency(row.revenue) + '</strong><small>' + fmtX(row.roas) + ' ROAS</small></div>' +
      '<div><span>Purchases</span><strong>' + fmtNum(row.purchases) + '</strong><small>' + fmtCurrency2(row.cpa) + ' CPA</small></div>' +
    '</div>' +
    '<div class="grid-insight-creators"><div class="grid-insight-section-label">TOP CREATOR SIGNALS</div>' +
      (topCreators.length ? topCreators.map(function(x,i){
        var pct = Math.max(5,Math.min(100,((x.revenue||0)/maxRevenue)*100));
        return '<div class="grid-creator-signal"><span class="grid-rank">0'+(i+1)+'</span><strong>'+escapeHtml(x.name)+'</strong><span class="grid-creator-bar"><i style="width:'+pct.toFixed(1)+'%"></i></span><b>'+fmtCurrency(x.revenue)+'</b></div>';
      }).join('') : '<div class="grid-empty-signal">No creator performance signal available.</div>') +
    '</div>' +
    '<div class="grid-insight-footer"><span>' + creatives.length + ' creatives</span><span>' + creatorIds.length + ' creators</span><button type="button" class="btn-small" onclick="setPage(\'campaigns\',{campaignId:\'' + escapeHtml(row.id) + '\'})">OPEN CAMPAIGN WORKSPACE →</button></div>' +
  '</div>';
}

function campaignColumns() {
  return [
    { key: 'name', label: 'Campaign', align: 'left' },
    { key: 'objective', label: 'Objective', align: 'left' },
    { key: 'budget', label: 'Budget', format: function (r) { return fmtCurrency(r.budget); } },
    { key: 'spend', label: 'Spend', format: function (r) { return fmtCurrency(r.spend); } },
    { key: 'revenue', label: 'Revenue', format: function (r) { return fmtCurrency(r.revenue); } },
    { key: 'purchases', label: 'Purchases', format: function (r) { return fmtNum(r.purchases); } },
    { key: 'cpa', label: 'CPA', format: function (r) { return fmtCurrency2(r.cpa); } },
    { key: 'roas', label: 'ROAS', format: function (r) { return fmtX(r.roas); } },
    { key: 'creatorCount', label: 'Creators', format: function (r) { return fmtNum(r.creatorCount); } },
    { key: 'creativeCount', label: 'Creatives', format: function (r) { return fmtNum(r.creativeCount); } },
    { key: 'status', label: 'Status', align: 'left', format: function (r) { return badge(r.status, r.status === 'Active' ? 'good' : (r.status === 'Paused' ? 'warn' : '')); } }
  ];
}

function renderCampaignDetail(campaignId) {
  var d = App.data;
  var camp = d.campaigns.filter(function (c) { return c.id === campaignId; })[0];
  if (!camp) return '<div class="empty">Campaign not found.</div>';
  var m = d.campaignMetrics[campaignId] || aggregate([]);
  var pctBudget = camp.budget ? Math.min(100, (m.spend / camp.budget) * 100) : 0;

  var backBtn = '<button class="link-btn" onclick="setPage(\'campaigns\',{})">\u2190 All campaigns</button>';
  var infoCard = '<div class="detail-card"><div><div class="detail-name">' + escapeHtml(camp.name) + '</div>' +
    '<div class="detail-meta">' + escapeHtml(camp.objective) + ' \u00b7 ' + badge(camp.status, camp.status === 'Active' ? 'good' : 'warn') + '</div>' +
    '<div class="budget-bar"><div class="budget-fill" style="width:' + pctBudget.toFixed(0) + '%;"></div></div>' +
    '<div class="detail-meta">' + fmtCurrency(m.spend) + ' spent of ' + fmtCurrency(camp.budget) + ' budget (' + pctBudget.toFixed(0) + '%)</div>' +
    '</div></div>';

  var kpis = [
    kpiCard('Spend', fmtCurrency(m.spend)), kpiCard('Revenue', fmtCurrency(m.revenue)), kpiCard('Purchases', fmtNum(m.purchases)),
    kpiCard('CPA', fmtCurrency2(m.cpa)), kpiCard('ROAS', fmtX(m.roas)), kpiCard('CTR', fmtPct(m.ctr))
  ].join('');

  var creatives = d.creatives.filter(function (cv) { return cv.campaignId === campaignId; }).map(function (cv) {
    var creator = d.creators.filter(function (c) { return c.id === cv.creatorId; })[0];
    return Object.assign({ id: cv.id, creatorName: creator ? creator.name : cv.creatorId, hook: cv.hook }, d.creativeMetrics[cv.id] || aggregate([]));
  });
  var creativesTable = tableHTML([
    { key: 'id', label: 'Creative', align: 'left' }, { key: 'creatorName', label: 'Creator', align: 'left' }, { key: 'hook', label: 'Hook', align: 'left' },
    { key: 'spend', label: 'Spend', format: function (r) { return fmtCurrency(r.spend); } },
    { key: 'cpa', label: 'CPA', format: function (r) { return fmtCurrency2(r.cpa); } },
    { key: 'roas', label: 'ROAS', format: function (r) { return fmtX(r.roas); } }
  ], creatives, { key: 'spend', dir: 'desc' }, 'id');

  var creatorIds = unique(creatives.map(function (cv) { return cv.creatorId ? cv.creatorId : null; }));
  var creatorRows = unique(d.creatives.filter(function (cv) { return cv.campaignId === campaignId; }).map(function (cv) { return cv.creatorId; }))
    .map(function (cid) {
      var creator = d.creators.filter(function (c) { return c.id === cid; })[0];
      var rows = d.dailyRows.filter(function (r) { return r.campaignId === campaignId && r.creatorId === cid; });
      return Object.assign({ id: cid, name: creator ? creator.name : cid }, aggregate(rows));
    });
  var creatorsTable = tableHTML(creatorColumns(), creatorRows, { key: 'spend', dir: 'desc' }, 'id');

  return '<div class="detail-kicker"><span>CAMPAIGN WORKSPACE</span><span>Budget → creative mix → outcome</span></div>' +
    pageHeader(camp.name, 'Campaign detail', backBtn) +
    '<div class="detail-hero campaign-detail-hero">' + infoCard + '<div class="campaign-hero-side"><span class="detail-eyebrow">BUDGET PULSE</span><strong>' + pctBudget.toFixed(0) + '%</strong><span>of allocated budget used</span></div></div>' +
    '<div class="detail-kpi-grid">' + kpis + '</div>' +
    '<section><h2>Performance over time</h2><div class="chart-card"><div class="chart-body" style="height:260px;"><canvas id="campaignTrendChart" role="img" aria-label="Spend and revenue over time for this campaign"></canvas></div></div></section>' +
    '<section><h2>Creatives in this campaign</h2>' + creativesTable + '</section>' +
    '<section><h2>Creators in this campaign</h2>' + creatorsTable + '</section>';
}

function mountCampaignDetail(container, campaignId) {
  var d = App.data;
  container.querySelectorAll('.clickable-row').forEach(function (tr) {
    var id = tr.getAttribute('data-row-id');
    if (id && id.indexOf('cv') === 0) tr.addEventListener('click', function () { setPage('creatives', { creativeId: id }); });
    else if (id) tr.addEventListener('click', function () { setPage('creators', { creatorId: id }); });
  });
  var rows = d.dailyRows.filter(function (r) { return r.campaignId === campaignId; });
  var byDate = groupSum(rows, function (r) { return r.date; });
  var series = Object.keys(byDate).sort().map(function (date) { return Object.assign({ date: date }, aggregate(byDate[date])); });
  var colors = themeColors();
  var canvas = document.getElementById('campaignTrendChart');
  if (canvas) {
    App.charts.campaignTrend = new Chart(canvas, {
      type: 'line',
      data: { labels: series.map(function (r) { return fmtDateShort(r.date); }), datasets: [
        { label: 'Spend', data: series.map(function (r) { return round2(r.spend); }), borderColor: colors.neg, backgroundColor: colors.neg + '22', borderWidth: 2, pointRadius: 0, tension: 0.25 },
        { label: 'Revenue', data: series.map(function (r) { return round2(r.revenue); }), borderColor: colors.pos, backgroundColor: colors.pos + '22', borderWidth: 2, pointRadius: 0, tension: 0.25 }
      ] },
      options: chartOptsLine(colors)
    });
  }
}