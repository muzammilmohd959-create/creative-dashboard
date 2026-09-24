PAGES.reports = {
  render: function () {
    if (App.mode === 'empty') return '<div class="data-kicker"><span>CLIENT REPORTING</span><span>Performance → evidence → action</span></div>' + pageHeader('Reports', 'A client-ready summary of performance, winners and recommendations.') + noDataState('report generation');
    if (App.mode === 'csv') return pageHeader('Reports', 'A client-ready summary of performance, winners and recommendations.') + csvModeState('Full reports');

    var actions = '<button id="btnGenReport" class="primary">Generate report</button> <button id="btnPrintReport">Print / save as PDF</button>';
    return pageHeader('Reports', 'A client-ready summary of performance, winners and recommendations.', actions) +
      '<div id="reportOutput"></div>';
  },
  mount: function (container) {
    if (!isFullMode()) return;
    var gen = document.getElementById('btnGenReport');
    var out = document.getElementById('reportOutput');
    function build() { out.innerHTML = buildReportHtml(App.data); }
    build();
    if (gen) gen.addEventListener('click', build);
    var pr = document.getElementById('btnPrintReport');
    if (pr) pr.addEventListener('click', function () { window.print(); });
  }
};

function buildReportHtml(d) {
  var o = d.overall;
  var topCreators = d.creators.map(function (c) { return Object.assign({ id: c.id, name: c.name }, d.creatorMetrics[c.id] || aggregate([])); })
    .sort(function (a, b) { return b.roas - a.roas; }).slice(0, 5);
  var topCreatives = d.creatives.map(function (cv) { return Object.assign({ id: cv.id, hook: cv.hook, angle: cv.angle }, d.creativeMetrics[cv.id] || aggregate([])); })
    .filter(function (c) { return c.spend > 50; }).sort(function (a, b) { return b.roas - a.roas; }).slice(0, 5);
  var winningHooks = unique(topCreatives.map(function (c) { return c.hook; })).slice(0, 3);
  var winningAngles = unique(topCreatives.map(function (c) { return c.angle; })).slice(0, 3);

  var campaignRows = d.campaigns.map(function (c) { return Object.assign({ id: c.id, name: c.name, budget: c.budget }, d.campaignMetrics[c.id] || aggregate([])); });

  var recs = [];
  var highCpaCreatives = d.creatives.filter(function (cv) { var m = d.creativeMetrics[cv.id]; return m && m.spend > 100 && m.cpa > o.cpa * 1.3; });
  if (highCpaCreatives.length) recs.push('Pause or refresh ' + highCpaCreatives.length + ' creative(s) running over 30% above blended CPA ($' + Math.round(o.cpa * 1.3) + ').');
  if (winningHooks.length) recs.push('Shift incremental budget toward ' + winningHooks.join(' and ').toLowerCase() + '-style hooks, which are driving the strongest ROAS.');
  var expiring = d.rights.filter(function (r) { return r.daysRemaining <= 30; }).length;
  if (expiring) recs.push('Renew or replace usage rights for ' + expiring + ' creative(s) expiring within 30 days to avoid a content gap.');
  var overBudget = campaignRows.filter(function (c) { return c.spend > c.budget; });
  if (overBudget.length) recs.push(overBudget.map(function (c) { return c.name; }).join(', ') + ' ' + (overBudget.length === 1 ? 'is' : 'are') + ' pacing over budget \u2014 review allocation.');
  if (!recs.length) recs.push('Performance is within target ranges across all active campaigns \u2014 no urgent action needed.');

  function rowsToHtml(cols, rows) { return tableHTML(cols, rows, { key: 'roas', dir: 'desc' }, null); }

  return '<div class="report">' +
    '<div class="report-head"><h2>Creator Performance Report</h2><p class="sub">Generated ' + escapeHtml(d.generatedAt) + ' \u00b7 Demo data</p></div>' +
    '<section><h3>Campaign summary</h3>' + rowsToHtml(campaignColumnsForReport(), campaignRows) + '</section>' +
    '<section><h3>Creator performance (top 5 by ROAS)</h3>' + rowsToHtml(creatorColumns(), topCreators) + '</section>' +
    '<section><h3>Creative performance (top 5 by ROAS)</h3>' + rowsToHtml([
      { key: 'id', label: 'Creative', align: 'left' }, { key: 'hook', label: 'Hook', align: 'left' }, { key: 'angle', label: 'Angle', align: 'left' },
      { key: 'spend', label: 'Spend', format: function (r) { return fmtCurrency(r.spend); } },
      { key: 'cpa', label: 'CPA', format: function (r) { return fmtCurrency2(r.cpa); } },
      { key: 'roas', label: 'ROAS', format: function (r) { return fmtX(r.roas); } }
    ], topCreatives) + '</section>' +
    '<section><h3>Winning hooks &amp; angles</h3><p>' + winningHooks.map(function (h) { return badge(h, 'good'); }).join(' ') + ' &nbsp; ' + winningAngles.map(function (a) { return badge(a, 'good'); }).join(' ') + '</p></section>' +
    '<section><h3>Performance trends</h3><p class="sub">Blended CPA is ' + fmtCurrency2(o.cpa) + ' and blended ROAS is ' + fmtX(o.roas) + ' across ' + fmtCurrency(o.spend) + ' of spend over the last 30 days.</p></section>' +
    '<section><h3>Recommendations</h3><ul class="rec-list">' + recs.map(function (r) { return '<li>' + escapeHtml(r) + '</li>'; }).join('') + '</ul></section>' +
    '</div>';
}

function campaignColumnsForReport() {
  return [
    { key: 'name', label: 'Campaign', align: 'left' },
    { key: 'budget', label: 'Budget', format: function (r) { return fmtCurrency(r.budget); } },
    { key: 'spend', label: 'Spend', format: function (r) { return fmtCurrency(r.spend); } },
    { key: 'revenue', label: 'Revenue', format: function (r) { return fmtCurrency(r.revenue); } },
    { key: 'purchases', label: 'Purchases', format: function (r) { return fmtNum(r.purchases); } },
    { key: 'cpa', label: 'CPA', format: function (r) { return fmtCurrency2(r.cpa); } },
    { key: 'roas', label: 'ROAS', format: function (r) { return fmtX(r.roas); } }
  ];
}