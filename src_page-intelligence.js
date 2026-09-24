PAGES.intelligence = {
  render: function () {
    if (App.mode === 'empty') return pageHeader('Creative intelligence', 'Evidence-backed patterns calculated from the selected date range.') + noDataState('creative intelligence');
    if (App.mode === 'csv') return pageHeader('Creative intelligence', 'Evidence-backed patterns calculated from the selected date range.') + csvModeState('Creative intelligence');

    var d = App.data;
    var evidence = d.evidenceInsights || [];
    var lead = evidence[0] || null;
    var cards = evidence.slice(0, 8).map(function (i, idx) {
      var metricLabel = i.metric === 'cpa' ? 'CPA' : (i.metric === 'roas' ? 'ROAS' : (i.metric === 'ctr' ? 'CTR' : i.metric.toUpperCase()));
      var direction = i.metric === 'cpa' ? (i.delta < 0 ? 'lower' : 'higher') : (i.delta > 0 ? 'higher' : 'lower');
      var signalClass = (i.metric === 'cpa' ? i.delta < 0 : i.delta > 0) ? 'signal-positive' : 'signal-neutral';
      return '<article class="insight-card evidence-card intelligence-card">' +
        '<div class="intelligence-card-top"><span class="insight-cat">' + escapeHtml(i.category) + '</span><span class="intelligence-rank">0' + (idx + 1) + '</span></div>' +
        '<div class="intelligence-quality ' + signalClass + '">' + escapeHtml(i.quality || 'directional') + ' evidence</div>' +
        '<div class="insight-text">' + escapeHtml(String(i.winner)) + '</div>' +
        '<div class="insight-detail">' + Math.round(Math.abs(i.delta || 0)) + '% ' + direction + ' ' + metricLabel +
        ' · ' + fmtCurrency(i.spend) + ' spend · ' + fmtNum(i.purchases) + ' purchases</div>' +
        '<div class="evidence-bar"><span>Baseline</span><strong>' +
        (i.metric === 'cpa' ? fmtCurrency2(i.baseline) : i.metric === 'ctr' ? fmtPct(i.baseline) : fmtX(i.baseline)) +
        '</strong><span>Observed</span><strong>' +
        (i.metric === 'cpa' ? fmtCurrency2(i.value) : i.metric === 'ctr' ? fmtPct(i.value) : fmtX(i.value)) +
        '</strong></div>' +
        '</article>';
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

    var leadHTML = lead
      ? '<section class="intel-hero">' +
          '<div class="intel-hero-copy"><div class="intel-eyebrow">LEADING SIGNAL · ' + escapeHtml(lead.quality || 'directional') + '</div>' +
          '<h2>' + escapeHtml(String(lead.winner)) + '</h2>' +
          '<p>' + Math.round(Math.abs(lead.delta || 0)) + '% ' + (lead.metric === 'cpa' ? (lead.delta < 0 ? 'lower' : 'higher') : (lead.delta > 0 ? 'higher' : 'lower')) + ' ' + escapeHtml(lead.metric === 'cpa' ? 'CPA' : String(lead.metric).toUpperCase()) +
          ' than baseline, backed by ' + fmtCurrency(lead.spend) + ' spend and ' + fmtNum(lead.purchases) + ' purchases.</p></div>' +
          '<div class="intel-hero-stats"><div><span>Baseline</span><strong>' + (lead.metric === 'cpa' ? fmtCurrency2(lead.baseline) : lead.metric === 'ctr' ? fmtPct(lead.baseline) : fmtX(lead.baseline)) + '</strong></div>' +
          '<div><span>Observed</span><strong>' + (lead.metric === 'cpa' ? fmtCurrency2(lead.value) : lead.metric === 'ctr' ? fmtPct(lead.value) : fmtX(lead.value)) + '</strong></div></div>' +
        '</section>'
      : '<div class="empty">Not enough spend or impressions to establish evidence-backed patterns.</div>';

    return pageHeader('Creative intelligence', 'The signal layer between performance data and the next creative decision.') +
      '<div class="intel-kicker"><span>CREATIVE SIGNALS</span><span>Selected range · evidence engine</span></div>' +
      leadHTML +
      '<section><div class="intel-section-head"><div><h2>Evidence signals</h2><p class="sub">Observed relationships that clear the intelligence engine thresholds.</p></div><span class="intel-count">' + fmtNum(evidence.length) + ' signals</span></div>' +
      '<div class="insight-grid intelligence-grid">' + (cards || '<div class="empty">No evidence-backed signals yet.</div>') + '</div></section>' +
      '<section><div class="intel-section-head"><div><h2>Best performing combinations</h2><p class="sub">Hook + angle + format combinations above the minimum spend threshold.</p></div></div>' + combosTable + '</section>';
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
