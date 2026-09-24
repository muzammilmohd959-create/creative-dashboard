// ================= Shell =================
function renderSidebar() {
  var groups = [
    { label:'COMMAND', ids:['overview'] },
    { label:'DATA', ids:['creators','creatives','campaigns','ads'] },
    { label:'INTELLIGENCE', ids:['intelligence','patternExplorer','creativeScorecard','comparisonInsights','recommendations'] },
    { label:'EXECUTION', ids:['creativeOps','creativeTesting'] },
    { label:'CONTROL', ids:['rights','reports','settings'] }
  ];
  var html = groups.map(function(group){
    var items = group.ids.map(function(id){
      var item = NAV_ITEMS.find(function(n){ return n.id === id; });
      if (!item) return '';
      var active = App.page === item.id;
      var idx = String(NAV_ITEMS.findIndex(function(n){ return n.id === item.id; }) + 1).padStart(2,'0');
      return '<button class="nav-item' + (active ? ' active' : '') + '" data-page="' + item.id + '" aria-current="' + (active ? 'page' : 'false') + '"><span class="nav-index">' + idx + '</span><span class="nav-label">' + escapeHtml(item.label) + '</span><span class="nav-arrow">↗</span></button>';
    }).join('');
    return '<div class="nav-group"><div class="nav-group-label">' + group.label + '</div>' + items + '</div>';
  }).join('');
  document.getElementById('sidebarNav').innerHTML = html;
  document.querySelectorAll('.nav-item').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setPage(btn.getAttribute('data-page'), {});
    });
  });
}

function setPage(page, params) {
  var previous = App.page;
  App.page = page;
  App.params = params || {};
  renderSidebar();
  var container = document.getElementById('pageContent');
  if (container && previous !== page) {
    container.classList.add('page-transition-out');
    setTimeout(function(){
      mountPage();
      window.scrollTo({top:0,behavior:'smooth'});
    }, 140);
  } else {
    mountPage();
    window.scrollTo(0, 0);
  }
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
    if (App.mode === 'empty') {
      return pageHeader('Overview', 'The command center for creator content, creative testing and measurable growth.') +
        '<div class="overview-kicker"><span>PERFORMANCE OS</span><span>Workspace ready · No performance data loaded</span></div>' +
        '<section class="overview-hero">' +
          '<div class="overview-hero-copy">' +
            '<span class="overview-eyebrow">ARKFLUENCE / CREATIVE PERFORMANCE OS</span>' +
            '<h2>Turn creator content into a <em>measurable growth system.</em></h2>' +
            '<p>Connect creators, creatives, campaigns and paid-media outcomes in one interactive workspace. Start with the sample dataset or connect your own data to activate the intelligence layer.</p>' +
            '<div class="overview-hero-actions">' +
              '<button class="primary overview-launch" onclick="document.getElementById(\'btnSample\').click()">Explore sample workspace <span>↗</span></button>' +
              '<button class="overview-secondary" onclick="document.getElementById(\'fileInput\') && document.getElementById(\'fileInput\').click()">Upload your data</button>' +
            '</div>' +
            '<div class="overview-proof-row"><span><i></i> Creator network</span><span><i></i> Creative intelligence</span><span><i></i> Testing workflow</span></div>' +
          '</div>' +
          '<div class="overview-visual" aria-label="Creative performance system visualization">' +
            '<div class="overview-orbit orbit-one"></div><div class="overview-orbit orbit-two"></div>' +
            '<div class="overview-core"><span class="core-brand">ARKFLUENCE</span><strong>ARKFLUENCE</strong><small>CREATIVE SIGNAL ENGINE</small></div>' +
            '<div class="overview-node node-a"><b>01</b><span>CREATORS</span><strong>Source</strong></div>' +
            '<div class="overview-node node-b"><b>02</b><span>CONTENT</span><strong>Test</strong></div>' +
            '<div class="overview-node node-c"><b>03</b><span>PERFORMANCE</span><strong>Learn</strong></div>' +
            '<div class="overview-node node-d"><b>04</b><span>ACTION</span><strong>Scale</strong></div>' +
            '<div class="overview-scan"></div>' +
          '</div>' +
        '</section>' +
        '<section class="overview-feature-grid">' +
          '<button class="overview-feature" onclick="setPage(\'intelligence\',{})"><span class="feature-num">01</span><div><strong>Creative Intelligence</strong><p>Trace the signals behind performance and move from raw metrics to evidence.</p></div><span class="feature-arrow">↗</span></button>' +
          '<button class="overview-feature" onclick="setPage(\'patternExplorer\',{})"><span class="feature-num">02</span><div><strong>Pattern Explorer</strong><p>Compare hooks, angles, formats, creators and campaigns across a selected range.</p></div><span class="feature-arrow">↗</span></button>' +
          '<button class="overview-feature" onclick="setPage(\'creativeOps\',{})"><span class="feature-num">03</span><div><strong>Creative Operations</strong><p>Turn evidence into briefs, creator assignments, testing and production decisions.</p></div><span class="feature-arrow">↗</span></button>' +
          '<button class="overview-feature" onclick="setPage(\'recommendations\',{})"><span class="feature-num">04</span><div><strong>Recommendations</strong><p>Translate observed performance signals into the next creative action.</p></div><span class="feature-arrow">↗</span></button>' +
        '</section>' +
        '<section class="overview-flow">' +
          '<div class="overview-flow-head"><div><span class="overview-eyebrow">THE OPERATING LOOP</span><h2>From content to compounding creative knowledge.</h2></div><span class="overview-live-pill"><i></i> SYSTEM READY</span></div>' +
          '<div class="overview-flow-steps"><div><b>01</b><strong>Creators</strong><span>Source the right voices</span></div><i>→</i><div><b>02</b><strong>Creative</strong><span>Capture the execution</span></div><i>→</i><div><b>03</b><strong>Testing</strong><span>Measure paid outcomes</span></div><i>→</i><div><b>04</b><strong>Intelligence</strong><span>Find repeatable signals</span></div><i>→</i><div><b>05</b><strong>Action</strong><span>Brief the next variation</span></div></div>' +
        '</section>';
    }

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
        '<button class="primary" onclick="setPage(\'intelligence\',{})">Explore intelligence →</button></section>' : '';

    var body;
    if (App.mode === 'csv') {
      body = '<section><h2>Creators</h2>' + csvModeState('Time series and creative-level views') + '</section>';
    } else {
      var topCreators = d.creators.map(function (c) { return Object.assign({ name: c.name }, d.creatorMetrics[c.id] || {}); }).sort(function (a,b) { return b.revenue-a.revenue; }).slice(0,5);
      var topCreatives = d.creatives.map(function (cv) { return Object.assign({ label: cv.id }, d.creativeMetrics[cv.id] || {}); }).filter(function(c){return c.spend>50;}).sort(function(a,b){return b.roas-a.roas;}).slice(0,5);
      body =
        '<section class="overview-data-hero"><div><span class="overview-eyebrow">LIVE PERFORMANCE</span><h2>What is happening across the system.</h2><p>Use the command center to move from account-level outcomes into the creative signals driving them.</p></div><div class="overview-data-badge"><span>RANGE</span><strong>' + escapeHtml(App.dateRangeLabel || 'Active') + '</strong></div></section>' +
        '<section><div class="charts-grid">' +
          '<div class="chart-card overview-chart-large"><div class="chart-title"><span>Performance trajectory</span><small>Spend vs revenue</small></div><div class="chart-body"><canvas id="ovSpendRevChart" role="img" aria-label="Line chart of daily spend and revenue"></canvas></div></div>' +
          '<div class="chart-card"><div class="chart-title"><span>Conversion pulse</span><small>Purchases by day</small></div><div class="chart-body"><canvas id="ovPurchasesChart" role="img" aria-label="Bar chart of daily purchases"></canvas></div></div>' +
        '</div></section>' +
        '<section><div class="overview-module-head"><div><span class="overview-eyebrow">LEADERBOARD</span><h2>Where the signal is strongest.</h2></div><button class="link-btn" onclick="setPage(\'creatives\',{})">Open creative library →</button></div><div class="charts-grid">' +
          '<div class="chart-card"><div class="chart-title"><span>Top creators</span><small>Revenue contribution</small></div><div class="chart-body"><canvas id="ovTopCreators" role="img" aria-label="Bar chart of top creators by revenue"></canvas></div></div>' +
          '<div class="chart-card"><div class="chart-title"><span>Top creatives</span><small>ROAS · sampled spend</small></div><div class="chart-body"><canvas id="ovTopCreatives" role="img" aria-label="Bar chart of top creatives by ROAS"></canvas></div></div>' +
        '</div></section>' +
        '<section><div class="charts-grid"><div class="chart-card"><div class="chart-title"><span>Performance alerts</span><small>Requires attention</small></div>' + renderAlertsList(d.alerts) + '</div><div class="chart-card"><div class="chart-title"><span>Creative intelligence</span><small>Observed signals</small></div>' + renderInsightsSummary(d.insights) + '</div></div></section>';
    }
    return pageHeader('Overview', 'Your creative performance command center — what is happening, what is working, and what to do next.') +
      '<div class="overview-kicker"><span>PERFORMANCE OS</span><span>Selected range · ' + (App.dateRangeLabel || 'Active') + '</span></div>' +
      (App.mode !== 'empty' ? '<div class="overview-hero-strip"><div><span class="overview-eyebrow">ARKFLUENCE COMMAND CENTER</span><strong>Creator content → paid performance → next action.</strong></div><div class="overview-strip-dots"><i></i><i></i><i></i></div></div>' : '') +
      kpis + signalHtml + body;
  },
  mount: function () {
    if (!isFullMode()) return;
    var d = App.data, colors = themeColors();
    var topCreators = d.creators.map(function (c) { return Object.assign({ name: c.name }, d.creatorMetrics[c.id] || {}); }).sort(function (a,b) { return b.revenue-a.revenue; }).slice(0,5);
    var topCreatives = d.creatives.map(function (cv) { return Object.assign({ label: cv.id }, d.creativeMetrics[cv.id] || {}); }).filter(function(c){return c.spend>50;}).sort(function(a,b){return b.roas-a.roas;}).slice(0,5);
    var labels = d.dateSeries.map(function (r) { return fmtDateShort(r.date); });
    App.charts.ovSpendRev = new Chart(document.getElementById('ovSpendRevChart'), {
      type: 'line',
      data: { labels: labels, datasets: [
        { label: 'Spend', data: d.dateSeries.map(function (r) { return round2(r.spend); }), borderColor: colors.neg, backgroundColor: colors.neg + '22', borderWidth: 2, pointRadius: 0, tension: 0.25 },
        { label: 'Revenue', data: d.dateSeries.map(function (r) { return round2(r.revenue); }), borderColor: colors.pos, backgroundColor: colors.pos + '22', borderWidth: 2, pointRadius: 0, tension: 0.25 }
      ]},
      options: chartOptsLine(colors)
    });
    App.charts.ovPurchases = new Chart(document.getElementById('ovPurchasesChart'), {
      type: 'bar',
      data: { labels: labels, datasets: [{ label: 'Purchases', data: d.dateSeries.map(function (r) { return r.purchases; }), backgroundColor: colors.accent, borderRadius: 3, maxBarThickness: 16 }] },
      options: chartOptsLine(colors, true)
    });
    App.charts.ovTopCreators = new Chart(document.getElementById('ovTopCreators'), {
      type: 'bar',
      data: { labels: topCreators.map(function (c) { return c.name; }), datasets: [{ label: 'Revenue', data: topCreators.map(function (c) { return round2(c.revenue); }), backgroundColor: colors.pos, borderRadius: 4, maxBarThickness: 22 }] },
      options: chartOptsHBar(colors)
    });
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
    animation: { duration: 1100, easing: 'easeOutQuart', delay: function(ctx){ return ctx.type === 'data' ? ctx.dataIndex * 18 : 0; } },
    transitions: { active: { animation: { duration: 220 } } },
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { display: !isBar, position: 'top', align: 'end', labels: { color: colors.text, boxWidth: 10, font: { size: 11 } } }, tooltip: { animation: { duration: 180 }, displayColors: true, padding: 10, cornerRadius: 8 } },
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
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  container.querySelectorAll('.chart-card,.kpi,.intelligence-card,.rec-card,.pattern-card,.comparison-card,.compare-card,.scorecard-card,.test-center-card,.ops-card,.creative-card,.detail-surface,.overview-feature,.overview-flow,.overview-data-hero,.overview-hero-strip').forEach(function(el){
    if (el.dataset.interactiveBound) return;
    el.dataset.interactiveBound = '1';
    el.classList.add('motion-surface');
    el.addEventListener('pointermove', function(e){
      if (reduce) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX-r.left)/r.width*100).toFixed(1)+'%');
      el.style.setProperty('--my', ((e.clientY-r.top)/r.height*100).toFixed(1)+'%');
    });
    el.addEventListener('pointerleave', function(){
      el.style.removeProperty('--mx'); el.style.removeProperty('--my');
    });
  });
  if (!reduce && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {threshold:0.08, rootMargin:'0px 0px -30px 0px'});
    container.querySelectorAll('.chart-card,.kpi,.overview-feature,.overview-flow,.overview-data-hero,.overview-hero-strip,.ops-column,.ops-card,.test-center-card,.intelligence-card,.rec-card,.pattern-card,.scorecard-card,.comparison-card,.compare-card,.detail-surface').forEach(function(el){
      if (!el.classList.contains('motion-reveal')) {
        el.classList.add('motion-reveal');
        observer.observe(el);
      }
    });
  }
  container.querySelectorAll('.primary,.link-btn,.overview-launch,.overview-secondary').forEach(function(btn){
    if (btn.dataset.magneticBound) return;
    btn.dataset.magneticBound='1';
    btn.classList.add('magnetic');
    btn.addEventListener('pointermove',function(e){
      if(reduce) return;
      var r=btn.getBoundingClientRect();
      var x=(e.clientX-(r.left+r.width/2))/r.width*10;
      var y=(e.clientY-(r.top+r.height/2))/r.height*8;
      btn.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px)';
    });
    btn.addEventListener('pointerleave',function(){btn.style.transform='';});
  });
}
