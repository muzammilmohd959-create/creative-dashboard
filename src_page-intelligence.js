PAGES.intelligence = {
  render: function () {
    if (App.mode === 'empty') return pageHeader('Creative intelligence', 'Evidence-backed patterns calculated from the selected date range.') + noDataState('creative intelligence');
    if (App.mode === 'csv') return pageHeader('Creative intelligence', 'Evidence-backed patterns calculated from the selected date range.') + csvModeState('Creative intelligence');

    var d = App.data;
    var evidence = d.evidenceInsights || [];
    var cards = evidence.slice(0, 8).map(function (i) {
      var metricLabel = i.metric === 'cpa' ? 'CPA' : (i.metric === 'roas' ? 'ROAS' : (i.metric === 'ctr' ? 'CTR' : i.metric.toUpperCase()));
      var direction = i.metric === 'cpa' ? (i.delta < 0 ? 'lower' : 'higher') : (i.delta > 0 ? 'higher' : 'lower');
      return '<div class="insight-card evidence-card">' +
        '<div class="insight-cat">' + escapeHtml(i.category) + ' · ' + escapeHtml(i.quality || 'directional') + '</div>' +
        '<div class="insight-text">' + escapeHtml(String(i.winner)) + '</div>' +
        '<div class="insight-detail">' + Math.round(Math.abs(i.delta || 0)) + '% ' + direction + ' ' + metricLabel +
        ' · ' + fmtCurrency(i.spend) + ' spend · ' + fmtNum(i.purchases) + ' purchases</div>' +
        '<div class="evidence-bar"><span>Baseline ' + escapeHtml(metricLabel) + '</span><strong>' +
        (i.metric === 'cpa' ? fmtCurrency2(i.baseline) : i.metric === 'ctr' ? fmtPct(i.baseline) : fmtX(i.baseline)) +
        '</strong><span>Observed</span><strong>' +
        (i.metric === 'cpa' ? fmtCurrency2(i.value) : i.metric === 'ctr' ? fmtPct(i.value) : fmtX(i.value)) +
        '</strong></div>' +
        '</div>';
    }).join('');

    var combos = bestCombos(d);
    var combosTable = tableHTML([
      { key: 'combo', label: 'Hook + angle + format', align: 'left' },
      { key: 'n', label: 'Creatives', format: function (r) { return fmtNum(r.n); } },
      { key: 'spend', label: 'Spend', format: function (r) { return fmtCurrency(r.spend); } },
      { key: 'ctr', label: 'CTR', format: function (r) { return fmtPct(r.ctr); } },
      { key: 'cpa', label: 'CPA', format: function (r) { return fmtCurrency2(r.cpa); } },
      { key: 'roas', label: 'ROAS', format: function (r) { return fmtX(r.roas); } }
    ], combos, { key: 'roas', dir: 'desc' }, null);

    return pageHeader('Creative intelligence', 'Evidence-backed patterns calculated from the selected date range.') +
      '<section><div class="insight-grid">' + (cards || '<div class="empty">Not enough spend or impressions to establish evidence-backed patterns.</div>') + '</div></section>' +
      '<section><h2>Best performing combinations</h2><p class="sub">Only combinations above the minimum spend threshold are included.</p>' + combosTable + '</section>';
  },
  mount: function () {}
};

function bestCombos(d) {
  var creativeById = {}; d.creatives.forEach(function (cv) { creativeById[cv.id] = cv; });
  var buckets = groupSum(d.dailyRows, function (r) {
    var cv = creativeById[r.creativeId];
    return cv.hook + ' / ' + cv.angle + ' / ' + cv.format;
  });
  return Object.keys(buckets).map(function (k) {
    var agg = aggregate(buckets[k]);
    var n = unique(buckets[k].map(function (r) { return r.creativeId; })).length;
    return Object.assign({ combo: k, n: n }, agg);
  }).filter(function (r) { return r.spend > 150; }).sort(function (a, b) { return b.roas - a.roas; }).slice(0, 8);
}
