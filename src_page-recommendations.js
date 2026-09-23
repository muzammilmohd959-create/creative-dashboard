/* ARKFLUENCE Recommendations — insight to action */
PAGES.recommendations = {
  render: function () {
    if (App.mode === 'empty') return pageHeader('Recommendations','Turn evidence-backed performance patterns into the next creative test.') + noDataState('recommendations');
    if (App.mode === 'csv') return pageHeader('Recommendations','Turn evidence-backed performance patterns into the next creative test.') + csvModeState('recommendations');
    var d = App.data;
    var evidence = d.evidenceInsights || [];
    var cards = evidence.map(function(i, idx){
      var metric = i.metric === 'cpa' ? 'CPA' : (i.metric === 'ctr' ? 'CTR' : (i.metric === 'roas' ? 'ROAS' : String(i.metric||'').toUpperCase()));
      var direction = i.metric === 'cpa' ? (i.delta < 0 ? 'lower' : 'higher') : (i.delta > 0 ? 'higher' : 'lower');
      var proof = Math.round(Math.abs(i.delta || 0)) + '% ' + direction + ' ' + metric + ' · ' + fmtCurrency(i.spend) + ' spend · ' + fmtNum(i.purchases) + ' purchases';
      var hypothesis = 'Test more ' + String(i.winner) + ' creative executions because this pattern is outperforming the comparison baseline.';
      return '<article class="rec-card">' +
        '<div class="rec-top"><span class="insight-cat">' + escapeHtml(i.category) + ' · ' + escapeHtml(i.quality || 'directional') + '</span><span class="rec-index">REC-' + String(idx+1).padStart(2,'0') + '</span></div>' +
        '<h2>' + escapeHtml(String(i.winner)) + '</h2>' +
        '<p class="rec-proof">' + escapeHtml(proof) + '</p>' +
        '<div class="rec-evidence"><span>Baseline</span><strong>' + escapeHtml(i.metric === 'cpa' ? fmtCurrency2(i.baseline) : i.metric === 'ctr' ? fmtPct(i.baseline) : fmtX(i.baseline)) + '</strong><span>Observed</span><strong>' + escapeHtml(i.metric === 'cpa' ? fmtCurrency2(i.value) : i.metric === 'ctr' ? fmtPct(i.value) : fmtX(i.value)) + '</strong></div>' +
        '<p class="rec-action"><strong>Suggested test:</strong> ' + escapeHtml(hypothesis) + '</p>' +
        '<button class="primary rec-create" data-category="' + escapeHtml(i.category) + '" data-winner="' + escapeHtml(String(i.winner)) + '" data-proof="' + escapeHtml(proof) + '">Create creative brief →</button>' +
      '</article>';
    }).join('');
    return pageHeader('Recommendations','Evidence-backed actions for the next creative testing cycle.') +
      '<div class="rec-intro"><strong>' + fmtNum(evidence.length) + ' evidence-backed opportunities</strong><span>Minimum spend and performance thresholds are applied by the intelligence engine.</span></div>' +
      '<section><div class="recommendation-grid">' + (cards || '<div class="empty">No evidence-backed recommendations yet.</div>') + '</div></section>';
  },
  mount: function (container) {
    container.querySelectorAll('.rec-create').forEach(function(btn){
      btn.addEventListener('click', function(){
        setPage('creativeOps', { prefill: {
          title: 'Test ' + btn.getAttribute('data-winner'),
          objective: 'Validate a repeatable performance pattern',
          hypothesis: btn.getAttribute('data-winner') + ' has shown ' + btn.getAttribute('data-proof') + '. Test a new execution against the current baseline.',
          brief: 'Create a new creator-led execution around the winning pattern. Preserve the core hook/angle/format signal while introducing a fresh variation, clear CTA and measurable test setup.',
          platform: 'Instagram'
        }});
      });
    });
  }
};