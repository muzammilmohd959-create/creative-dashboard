// ================= Shell =================
function renderSidebar() {
  var html = NAV_ITEMS.map(function (item) {
    var active = App.page === item.id;
    return '<button class="nav-item' + (active ? ' active' : '') + '" data-page="' + item.id + '">' + escapeHtml(item.label) + '</button>';
  }).join('');
  document.getElementById('sidebarNav').innerHTML = html;
  document.querySelectorAll('.nav-item').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setPage(btn.getAttribute('data-page'), {});
    });
  });
}

function setPage(page, params) {
  App.page = page;
  App.params = params || {};
  renderSidebar();
  mountPage();
  window.scrollTo(0, 0);
}

var PAGES = {}; // filled in by each page module: { render: fn, mount: fn }

function mountPage() {
  destroyAllCharts();
  if (App.rawData) App.data = applyDateRange(App.rawData);
  var container = document.getElementById('pageContent');
  var mod = PAGES[App.page];
  if (!mod) { container.innerHTML = '<div class="empty">Page not found.</div>'; return; }
  container.classList.remove('page-enter','page-enter-active');
  void container.offsetWidth;
  container.classList.add('page-enter');
  container.innerHTML = mod.render();
  requestAnimationFrame(function () { container.classList.add('page-enter-active'); });
  if (mod.mount) mod.mount(container);
  wireInteractiveSurfaces(container);
}

function noDataState(what) {
  return '<div class="empty big">' +
    '<p><strong>No data loaded yet.</strong></p>' +
    '<p>Load the sample dataset to explore ' + escapeHtml(what) + ', or upload your own CSV for a flat creator-level view.</p>' +
    '<button class="primary" onclick="document.getElementById(\'btnSample\').click()">Load sample data</button>' +
    '</div>';
}

function csvModeState(what) {
  return '<div class="empty big">' +
    '<p><strong>Not available in CSV mode.</strong></p>' +
    '<p>' + escapeHtml(what) + ' needs the full demo dataset (creators \u2192 creatives \u2192 campaigns \u2192 ads).</p>' +
    '<button class="primary" onclick="document.getElementById(\'btnSample\').click()">Load sample data</button>' +
    '</div>';
}

// ================= Overview page =================
PAGES.overview = {
  render: function () {
    if (App.mode === 'empty') return pageHeader('Overview', 'Account-wide performance across every creator, creative and campaign.') + noDataState('your account overview');
    var d = App.data, o = d.overall;
    var kpis = [
      kpiCard('Spend', fmtCurrency(o.spend), 'Total media spend'),
      kpiCard('Revenue', fmtCurrency(o.revenue), 'Attributed revenue'),
      kpiCard('Purchases', fmtNum(o.purchases), 'Conversions'),
      kpiCard('CPA', fmtCurrency2(o.cpa), 'Cost per purchase'),
      kpiCard('ROAS', fmtX(o.roas), 'Return on ad spend'),
      kpiCard('CTR', fmtPct(o.ctr), 'Click-through rate'),
      kpiCard('CPC', fmtCurrency2(o.cpc), 'Cost per click'),
      kpiCard('Conversion rate', fmtPct1(o.cvr), 'Click → purchase')
    ].join('');

    var signal = (d.evidenceInsights || [])[0];
    var signalHtml = signal
      ? '<section class="overview-signal"><div><span class="insight-cat">LEADING SIGNAL</span><h2>' + escapeHtml(String(signal.winner)) + '</h2><p>' +
        Math.round(Math.abs(signal.delta || 0)) + '% ' + (signal.metric === 'cpa' ? (signal.delta < 0 ? 'lower CPA' : 'higher CPA') : (signal.delta > 0 ? 'higher ' + String(signal.metric).toUpperCase() : 'lower ' + String(signal.metric).toUpperCase())) +
        ' than baseline · ' + fmtCurrency(signal.spend) + ' spend · ' + fmtNum(signal.purchases) + ' purchases.</p></div>' +
        '<button class="primary" onclick="setPage(\'intelligence\',{})">Explore intelligence →</button></section>'
      : '';

    var body;
    if (App.mode === 'csv') {
      body = '<section><h2>Creators</h2>' + csvModeState('Time series and creative-level views') + '</section>';
    } else {
      body =
        '<section><div class="charts-grid">' +
        '<div class="chart-card"><div class="chart-title">Spend vs revenue over time</div>' +
        '<div class="chart-body"><canvas id="ovSpendRevChart" role="img" aria-label="Line chart of daily spend and revenue"></canvas></div></div>' +
        '<div class="chart-card"><div class="chart-title">Purchases over time</div>' +
        '<div class="chart-body"><canvas id="ovPurchasesChart" role="img" aria-label="Bar chart of daily purchases"></canvas></div></div>' +
        '</div></section>' +
        '<section><div class="charts-grid">' +
        '<div class="chart-card"><div class="chart-title">Top creators by revenue</div>' +
        '<div class="chart-body"><canvas id="ovTopCreators" role="img" aria-label="Bar chart of top creators by revenue"></canvas></div></div>' +
        '<div class="chart-card"><div class="chart-title">Top creatives by ROAS</div>' +
        '<div class="chart-body"><canvas id="ovTopCreatives" role="img" aria-label="Bar chart of top creatives by ROAS"></canvas></div></div>' +
        '</div></section>' +
        '<section><div class="charts-grid">' +
        '<div class="chart-card"><div class="chart-title">Performance alerts</div>' + renderAlertsList(d.alerts) + '</div>' +
        '<div class="chart-card"><div class="chart-title">Creative intelligence summary</div>' + renderInsightsSummary(d.insights) + '</div>' +
        '</div></section>';
    }
    return pageHeader('Overview', 'Your creative performance command center — what is happening, what is working, and what to do next.') + '<div class="overview-kicker"><span>PERFORMANCE OS</span><span>Selected range · '+(App.dateRangeLabel || 'Active')+'</span></div>' + kpis + signalHtml + body;
  },
  mount: function () {
    if (!isFullMode()) return;
    var d = App.data, colors = themeColors();

    var labels = d.dateSeries.map(function (r) { return fmtDateShort(r.date); });
    App.charts.ovSpendRev = new Chart(document.getElementById('ovSpendRevChart'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          { label: 'Spend', data: d.dateSeries.map(function (r) { return round2(r.spend); }), borderColor: colors.neg, backgroundColor: colors.neg + '22', borderWidth: 2, pointRadius: 0, tension: 0.25 },
          { label: 'Revenue', data: d.dateSeries.map(function (r) { return round2(r.revenue); }), borderColor: colors.pos, backgroundColor: colors.pos + '22', borderWidth: 2, pointRadius: 0, tension: 0.25 }
        ]
      },
      options: chartOptsLine(colors)
    });

    App.charts.ovPurchases = new Chart(document.getElementById('ovPurchasesChart'), {
      type: 'bar',
      data: { labels: labels, datasets: [{ label: 'Purchases', data: d.dateSeries.map(function (r) { return r.purchases; }), backgroundColor: colors.accent, borderRadius: 3, maxBarThickness: 16 }] },
      options: chartOptsLine(colors, true)
    });

    var topCreators = d.creators.map(function (c) { return Object.assign({ name: c.name }, d.creatorMetrics[c.id] || {}); })
      .sort(function (a, b) { return b.revenue - a.revenue; }).slice(0, 5);
    App.charts.ovTopCreators = new Chart(document.getElementById('ovTopCreators'), {
      type: 'bar',
      data: { labels: topCreators.map(function (c) { return c.name; }), datasets: [{ label: 'Revenue', data: topCreators.map(function (c) { return round2(c.revenue); }), backgroundColor: colors.pos, borderRadius: 4, maxBarThickness: 22 }] },
      options: chartOptsHBar(colors)
    });

    var topCreatives = d.creatives.map(function (cv) { return Object.assign({ label: cv.id }, d.creativeMetrics[cv.id] || {}); })
      .filter(function (c) { return c.spend > 50; })
      .sort(function (a, b) { return b.roas - a.roas; }).slice(0, 5);
    App.charts.ovTopCreatives = new Chart(document.getElementById('ovTopCreatives'), {
      type: 'bar',
      data: { labels: topCreatives.map(function (c) { return c.label; }), datasets: [{ label: 'ROAS', data: topCreatives.map(function (c) { return round2(c.roas); }), backgroundColor: colors.accent, borderRadius: 4, maxBarThickness: 22 }] },
      options: chartOptsHBar(colors, 'x')
    });
  }
};

function pageHeader(title, subtitle, actionsHtml) {
  var range = App.data ? renderGlobalDateRange() : '';
  return '<div class="page-head"><div><h1>' + escapeHtml(title) + '</h1><p class="sub">' + escapeHtml(subtitle) + '</p></div>' +
    '<div class="page-actions">' + range + (actionsHtml || '') + '</div></div>';
}

function renderAlertsList(alerts) {
  if (!alerts || !alerts.length) return '<div class="empty">No alerts.</div>';
  return '<ul class="alert-list">' + alerts.map(function (a) {
    return '<li class="alert alert-' + a.level + '">' + escapeHtml(a.text) + '</li>';
  }).join('') + '</ul>';
}

function renderInsightsSummary(insights) {
  if (!insights || !insights.length) return '<div class="empty">No insights yet.</div>';
  return '<ul class="insight-list">' + insights.slice(0, 3).map(function (i) {
    return '<li><span class="insight-cat">' + escapeHtml(i.category) + '</span>' + escapeHtml(i.text) + '</li>';
  }).join('') + '</ul><button class="link-btn" data-page="intelligence" onclick="setPage(\'intelligence\',{})">View all insights \u2192</button>';
}

function chartOptsLine(colors, isBar) {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: !isBar, position: 'top', align: 'end', labels: { color: colors.text, boxWidth: 10, font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: colors.text, maxRotation: 0, autoSkip: true, font: { size: 10 } }, grid: { display: false } },
      y: { ticks: { color: colors.text, font: { size: 10 } }, grid: { color: colors.grid } }
    }
  };
}
function chartOptsHBar(colors, axis) {
  var indexAxis = axis === 'x' ? 'x' : 'y';
  return {
    indexAxis: indexAxis, responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: colors.text, font: { size: 10 } }, grid: { color: colors.grid } },
      y: { ticks: { color: colors.text, font: { size: 10 } }, grid: { display: false } }
    }
  };
}

function wireInteractiveSurfaces(container) {
  container.querySelectorAll('.chart-card,.kpi,.intelligence-card,.rec-card,.pattern-card,.comparison-card,.compare-card,.scorecard-card,.test-center-card,.ops-card,.creative-card,.detail-surface').forEach(function(el){
    if (el.dataset.interactiveBound) return;
    el.dataset.interactiveBound = '1';
    el.addEventListener('pointermove', function(e){
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX-r.left)/r.width*100).toFixed(1)+'%');
      el.style.setProperty('--my', ((e.clientY-r.top)/r.height*100).toFixed(1)+'%');
    });
    el.addEventListener('pointerleave', function(){
      el.style.removeProperty('--mx'); el.style.removeProperty('--my');
    });
  });
}
