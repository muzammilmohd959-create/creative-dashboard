PAGES.creators = {
  render: function () {
    if (App.mode === 'empty') return pageHeader('Creators', 'Every creator in your program, ranked by outcomes.') + noDataState('your creator roster');
    if (App.params.creatorId) return renderCreatorDetail(App.params.creatorId);

    var d = App.data;
    var rows = d.creators.map(function (c) {
      var m = d.creatorMetrics[c.id] || aggregate([]);
      return Object.assign({ id: c.id, name: c.name }, m);
    });
    var sorted = sortRows(rows, App.creatorsSort, creatorColumns());
    var scoreCol = App.showInternalScore ? [{ key: 'score', label: 'Internal score*', align: 'right', format: function (r) { return internalScore(r, rows).toFixed(1); } }] : [];

    var toggle = '<label class="chk"><input type="checkbox" id="toggleScore"' + (App.showInternalScore ? ' checked' : '') + '> Show internal score</label>';

    var creatorHero = '<section class="creator-network-hero"><div><span class="detail-eyebrow">CREATOR NETWORK</span><h2>People are the creative distribution layer.</h2><p>See who is producing content, where that content is being deployed, and how creator-level outcomes connect back to the performance system.</p><div class="creator-network-flow"><span>CREATOR</span><i>→</i><span>CONTENT</span><i>→</i><span>PAID</span><i>→</i><strong>OUTCOME</strong></div></div><div class="creator-network-visual"><div class="cn-ring r1"></div><div class="cn-ring r2"></div><div class="cn-core"><span>NETWORK</span><strong>' + rows.length + '</strong><small>creators</small></div><i></i><b></b><em></em></div></section>';
    var networkPulse = '<div class="network-pulse"><span>LIVE NETWORK</span><strong>' + rows.length + '</strong><small>active creator profiles</small></div>';
    return '<div class="data-kicker"><span>CREATOR NETWORK</span><span>People → content → performance</span></div>' + pageHeader('Creators', 'Every creator in your program, ranked by outcomes.', toggle) +
      creatorHero + '<div class="creator-network-strip">' + networkPulse + '<div><span>CONTENT OUTPUT</span><strong>' + d.creatives.length + '</strong><small>tracked creatives</small></div><div><span>PAID DISTRIBUTION</span><strong>' + d.ads.length + '</strong><small>ad placements</small></div><div><span>OUTCOME SIGNAL</span><strong>' + fmtX(d.overall.roas) + '</strong><small>blended ROAS</small></div></div>' + tableHTML(creatorColumns().concat(scoreCol), sorted, App.creatorsSort, 'id') +
      (App.showInternalScore ? '<p class="foot-note">*Internal score is an optional blended metric (60% ROAS, 40% CPA efficiency) for quick triage — not a primary KPI.</p>' : '');
  },
  mount: function (container) {
    if (App.mode === 'empty') return;
    if (App.params.creatorId) { mountCreatorDetail(container, App.params.creatorId); return; }
    wireTable(container, App.creatorsSort, function () { mountPage(); }, function (id) { setPage('creators', { creatorId: id }); });
    var cb = document.getElementById('toggleScore');
    if (cb) cb.addEventListener('change', function () { App.showInternalScore = cb.checked; mountPage(); });
  }
};

function creatorColumns() {
  return [
    { key: 'name', label: 'Creator', align: 'left' },
    { key: 'spend', label: 'Spend', format: function (r) { return fmtCurrency(r.spend); } },
    { key: 'purchases', label: 'Purchases', format: function (r) { return fmtNum(r.purchases); } },
    { key: 'cpa', label: 'CPA', format: function (r) { return fmtCurrency2(r.cpa); } },
    { key: 'revenue', label: 'Revenue', format: function (r) { return fmtCurrency(r.revenue); } },
    { key: 'roas', label: 'ROAS', format: function (r) { return fmtX(r.roas); } }
  ];
}

function internalScore(row, allRows) {
  var maxRoas = Math.max.apply(null, allRows.map(function (r) { return r.roas; }).concat([0.0001]));
  var maxCpa = Math.max.apply(null, allRows.map(function (r) { return r.cpa; }).concat([0.0001]));
  var roasPart = maxRoas ? row.roas / maxRoas : 0;
  var cpaPart = maxCpa ? 1 - (row.cpa / maxCpa) : 0;
  return Math.max(0, (roasPart * 0.6 + cpaPart * 0.4) * 100);
}

function renderCreatorDetail(creatorId) {
  var d = App.data;
  var creator = d.creators.filter(function (c) { return c.id === creatorId; })[0];
  if (!creator) return '<div class="empty">Creator not found.</div>';
  var m = d.creatorMetrics[creatorId] || aggregate([]);

  var tabs = ['overview', 'creatives', 'campaigns', 'trend', 'rights', 'library'];
  var tabLabels = { overview: 'Overview', creatives: 'Creatives', campaigns: 'Campaigns', trend: 'Performance over time', rights: 'Rights', library: 'Content library' };
  var tabNav = '<div class="subtabs">' + tabs.map(function (t) {
    return '<button class="subtab' + (App.creatorDetailTab === t ? ' active' : '') + '" data-tab="' + t + '">' + tabLabels[t] + '</button>';
  }).join('') + '</div>';

  var backBtn = '<button class="link-btn" data-page="creators" onclick="setPage(\'creators\',{})">← All creators</button>';

  var infoCard = '<div class="detail-card">' +
    '<div class="avatar" style="background:' + creator.color + '22; color:' + creator.color + ';">' + escapeHtml(creator.name.split(' ').map(function (w) { return w[0]; }).join('')) + '</div>' +
    '<div><div class="detail-name">' + escapeHtml(creator.name) + '</div>' +
    '<div class="detail-meta">' + escapeHtml(creator.niche) + ' · ' + escapeHtml(creator.location) + ' · ' + fmtNum(creator.followers) + ' followers</div></div></div>';

  var kpis = [
    kpiCard('Spend', fmtCurrency(m.spend)), kpiCard('Revenue', fmtCurrency(m.revenue)), kpiCard('Purchases', fmtNum(m.purchases)),
    kpiCard('CPA', fmtCurrency2(m.cpa)), kpiCard('ROAS', fmtX(m.roas)), kpiCard('CTR', fmtPct(m.ctr))
  ].join('');

  var body = '<div class="creator-workspace-status"><span><i></i> WORKSPACE ACTIVE</span><span>CREATOR → CONTENT → PERFORMANCE</span></div><div id="creatorTabBody"></div>';
  return '<div class="detail-kicker"><span>CREATOR WORKSPACE</span><span>Profile → content → performance</span></div>' +
    '<div class="detail-hero creator-detail-hero">' +
      '<div class="detail-hero-main">' + infoCard + '<div class="detail-hero-copy"><span class="detail-eyebrow">CREATOR PERFORMANCE</span><h2>One creator. One performance story.</h2><p>Explore content, campaign contribution, trend and rights without leaving the creator workspace.</p></div></div>' +
      '<div class="detail-hero-orbit" aria-hidden="true"><span></span><i></i><b></b><em></em></div>' +
    '</div>' + tabNav + '<div class="detail-kpi-grid">' + kpis + '</div>' + body;
}

function mountCreatorDetail(container, creatorId) {
  container.querySelectorAll('[data-tab]').forEach(function (btn) {
    btn.addEventListener('click', function () { App.creatorDetailTab = btn.getAttribute('data-tab'); mountPage(); });
  });
  var body = document.getElementById('creatorTabBody');
  var d = App.data;
  var creatives = d.creatives.filter(function (cv) { return cv.creatorId === creatorId; });

  if (App.creatorDetailTab === 'overview') {
    var m = d.creatorMetrics[creatorId] || aggregate([]);
    body.innerHTML = '<section class="detail-surface"><div class="detail-section-head"><div><span class="detail-eyebrow">SNAPSHOT</span><h2>Performance at a glance</h2></div><span class="detail-count">' + creatives.length + ' creatives</span></div><p class="sub">' + creatives.length + ' creatives across '
      unique(creatives.map(function (c) { return c.campaignId; })).length + ' campaigns · CPC ' + fmtCurrency2(m.cpc) +
      ' · Conversion rate ' + fmtPct1(m.cvr) + '</p></section>';
  } else if (App.creatorDetailTab === 'creatives') {
    var rows = creatives.map(function (cv) { return Object.assign({ id: cv.id, hookAngle: cv.hook + ' / ' + cv.angle, format: cv.format }, d.creativeMetrics[cv.id] || {}); });
    var sorted = sortRows(rows, App.creativesSort, creativeMiniColumns());
    body.innerHTML = '<section><h2>Creatives</h2>' + tableHTML(creativeMiniColumns(), sorted, App.creativesSort, 'id') + '</section>';
    wireTable(body, App.creativesSort, function () { mountPage(); }, function (id) { setPage('creatives', { creativeId: id }); });
  } else if (App.creatorDetailTab === 'campaigns') {
    var campIds = unique(creatives.map(function (c) { return c.campaignId; }));
    var rows2 = campIds.map(function (cid) {
      var camp = d.campaigns.filter(function (c) { return c.id === cid; })[0];
      var rows = d.dailyRows.filter(function (r) { return r.creatorId === creatorId && r.campaignId === cid; });
      return Object.assign({ id: cid, name: camp ? camp.name : cid }, aggregate(rows));
    });
    body.innerHTML = '<section><h2>Campaigns</h2>' + tableHTML(campaignMiniColumns(), rows2, { key: 'spend', dir: 'desc' }, 'id') + '</section>';
    body.querySelectorAll('.clickable-row').forEach(function (tr) {
      tr.addEventListener('click', function () { setPage('campaigns', { campaignId: tr.getAttribute('data-row-id') }); });
    });
  } else if (App.creatorDetailTab === 'trend') {
    var rows3 = d.dailyRows.filter(function (r) { return r.creatorId === creatorId; });
    var byDate = groupSum(rows3, function (r) { return r.date; });
    var series = Object.keys(byDate).sort().map(function (date) { return Object.assign({ date: date }, aggregate(byDate[date])); });
    body.innerHTML = '<section><h2>Performance over time</h2><div class="chart-card"><div class="chart-body" style="height:280px;"><canvas id="creatorTrendChart" role="img" aria-label="Spend and revenue over time for this creator"></canvas></div></div></section>';
    var colors = themeColors();
    destroyChart('creatorTrend');
    App.charts.creatorTrend = new Chart(document.getElementById('creatorTrendChart'), {
      type: 'line',
      data: { labels: series.map(function (r) { return fmtDateShort(r.date); }), datasets: [
        { label: 'Spend', data: series.map(function (r) { return round2(r.spend); }), borderColor: colors.neg, backgroundColor: colors.neg + '22', borderWidth: 2, pointRadius: 0, tension: 0.25 },
        { label: 'Revenue', data: series.map(function (r) { return round2(r.revenue); }), borderColor: colors.pos, backgroundColor: colors.pos + '22', borderWidth: 2, pointRadius: 0, tension: 0.25 }
      ] },
      options: chartOptsLine(colors)
    });
  } else if (App.creatorDetailTab === 'rights') {
    var rights = d.rights.filter(function (r) { return r.creatorId === creatorId; }).map(function (r) {
      return Object.assign({}, r, { status: rightsStatus(r.daysRemaining) });
    });
    body.innerHTML = '<section><h2>Rights</h2>' + tableHTML(rightsColumns(), rights, App.rightsSort, null, 'No rights records for this creator.') + '</section>';
  } else if (App.creatorDetailTab === 'library') {
    body.innerHTML = '<section><h2>Content library</h2>' + renderCreativeGrid(creatives) + '</section>';
    wireLibraryClicks(body);
  }
}

function unique(arr) { var seen = {}; return arr.filter(function (x) { if (seen[x]) return false; seen[x] = true; return true; }); }

function creativeMiniColumns() {
  return [
    { key: 'id', label: 'Creative', align: 'left' },
    { key: 'spend', label: 'Spend', format: function (r) { return fmtCurrency(r.spend); } },
    { key: 'ctr', label: 'CTR', format: function (r) { return fmtPct(r.ctr); } },
    { key: 'cpa', label: 'CPA', format: function (r) { return fmtCurrency2(r.cpa); } },
    { key: 'roas', label: 'ROAS', format: function (r) { return fmtX(r.roas); } }
  ];
}
function campaignMiniColumns() {
  return [
    { key: 'name', label: 'Campaign', align: 'left' },
    { key: 'spend', label: 'Spend', format: function (r) { return fmtCurrency(r.spend); } },
    { key: 'purchases', label: 'Purchases', format: function (r) { return fmtNum(r.purchases); } },
    { key: 'cpa', label: 'CPA', format: function (r) { return fmtCurrency2(r.cpa); } },
    { key: 'roas', label: 'ROAS', format: function (r) { return fmtX(r.roas); } }
  ];
}
