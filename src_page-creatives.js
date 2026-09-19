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

    return pageHeader('Creatives', 'The core analytical layer \u2014 every ad creative, with hook, angle and format performance.', viewToggle) +
      quickStats + filters + body;
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

  var backBtn = '<button class="link-btn" onclick="setPage(\'creatives\',{})">\u2190 All creatives</button>';
  var badges = [badge(cv.hook), badge(cv.angle), badge(cv.format), cv.videoLength ? badge(cv.videoLength + 's') : '', badge(cv.cta)].join(' ');
  var links = '<a href="javascript:void(0)" class="link-inline" data-creator="' + cv.creatorId + '">' + escapeHtml(creator ? creator.name : '') + '</a> \u00b7 ' +
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

  return pageHeader(creativeId, 'Creative detail', backBtn) +
    '<div class="detail-card"><div>' + badges + '<div class="detail-meta" style="margin-top:8px;">' + links + '</div></div></div>' +
    kpis +
    '<section><h2>Performance over time</h2><div class="chart-card"><div class="chart-body" style="height:260px;"><canvas id="creativeTrendChart" role="img" aria-label="Spend and revenue over time for this creative"></canvas></div></div></section>' +
    '<section><h2>Ads under this creative</h2>' + adsTable + '</section>';
}

function mountCreativeDetail(container, creativeId) {
  container.querySelectorAll('[data-creator]').forEach(function (a) { a.addEventListener('click', function () { setPage('creators', { creatorId: a.getAttribute('data-creator') }); }); });
  container.querySelectorAll('[data-campaign]').forEach(function (a) { a.addEventListener('click', function () { setPage('campaigns', { campaignId: a.getAttribute('data-campaign') }); }); });

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