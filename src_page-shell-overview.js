// ================= Shell =================
function renderSidebar() {
  var groups = [
    { label:'COMMAND', ids:['overview'] },
    { label:'DATA', ids:['creators','creatives','campaigns','ads'] },
    { label:'INTELLIGENCE', ids:['intelligence','patternExplorer','creativeScorecard','comparisonInsights','recommendations'] },
    { label:'EXECUTION', ids:['creativeOps','creativeTesting'] },
    { label:'CONTROL', ids:['rights','reports'] }
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
  var nav = document.getElementById('sidebarNav');
  nav.innerHTML = html;
  var sidebar = nav ? nav.closest('.sidebar') : null;
  if (sidebar) {
    var existingSettings = sidebar.querySelector('.nav-settings');
    if (existingSettings) existingSettings.remove();
    var settingsItem = NAV_ITEMS.find(function(n){ return n.id === 'settings'; });
    if (settingsItem) {
      var settingsActive = App.page === 'settings';
      var settingsIdx = String(NAV_ITEMS.findIndex(function(n){ return n.id === 'settings'; }) + 1).padStart(2,'0');
      var settingsWrap = document.createElement('div');
      settingsWrap.className = 'nav-settings';
      settingsWrap.innerHTML = '<button class="nav-item' + (settingsActive ? ' active' : '') + '" data-page="settings" aria-current="' + (settingsActive ? 'page' : 'false') + '"><span class="nav-index">' + settingsIdx + '</span><span class="nav-label">' + escapeHtml(settingsItem.label) + '</span><span class="nav-arrow">↗</span></button>';
      sidebar.appendChild(settingsWrap);
    }
  }
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
        '<div class="overview-kicker"><span><i class="ark-status-dot"></i> PERFORMANCE OS</span><span>READY TO CONNECT <b>·</b> NO DATA LOADED</span></div>' +
        '<section class="overview-hero">' +
          '<div class="overview-hero-copy">' +
            '<span class="overview-eyebrow">ARKFLUENCE / CREATIVE PERFORMANCE OS</span>' +
            '<h2>Turn creator content into a <em>measurable growth system.</em></h2>' +
            '<p>Connect creators, creatives, campaigns and paid-media outcomes in one interactive workspace. Start with the sample dataset or connect your own data to activate the intelligence layer.</p>' +
            '<div class="overview-hero-actions">' +
              '<span class="aura aura-glow aura-lg overview-launch-aura"><button class="primary overview-launch" onclick="document.getElementById(\'btnSample\').click()">Explore sample workspace <span>↗</span></button></span>' +
              '<button class="overview-secondary" onclick="document.getElementById(\'fileInput\') && document.getElementById(\'fileInput\').click()">Upload your data</button>' +
            '</div>' +
            '<div class="overview-proof-row"><span><i></i> Creator network</span><span><i></i> Creative intelligence</span><span><i></i> Testing workflow</span><span class="overview-proof-live">● LIVE ENGINE</span></div>' +
          '</div>' +
          '<div class="overview-visual" aria-label="Creative performance system visualization">' +
            '<div class="overview-orbit orbit-one"></div><div class="overview-orbit orbit-two"></div>' +
            '<div class="aura aura-dual aura-md overview-core-aura"><div class="overview-core"><span class="core-brand">ARKFLUENCE</span><strong>ARKFLUENCE</strong><small>CREATIVE SIGNAL ENGINE</small></div></div>' +
            '<div class="overview-node node-a"><b>01</b><span>CREATORS</span><strong>Source</strong></div>' +
            '<div class="overview-node node-b"><b>02</b><span>CONTENT</span><strong>Test</strong></div>' +
            '<div class="overview-node node-c"><b>03</b><span>PERFORMANCE</span><strong>Learn</strong></div>' +
            '<div class="overview-node node-d"><b>04</b><span>ACTION</span><strong>Scale</strong></div>' +
            '<div class="overview-scan"></div>' +
          '</div>' +
        '</section>' +
        '<div class="overview-command-strip"><span class="command-strip-label">ARK / SYSTEM MAP</span><div class="command-strip-line"></div><span>04 INTELLIGENCE MODULES</span></div>' +
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
      options: chartOptsLine(colors), plugins: [arkOverviewChartMotionPlugin()]
    });
    App.charts.ovPurchases = new Chart(document.getElementById('ovPurchasesChart'), {
      type: 'bar',
      data: { labels: labels, datasets: [{ label: 'Purchases', data: d.dateSeries.map(function (r) { return r.purchases; }), backgroundColor: colors.accent, borderRadius: 3, maxBarThickness: 16 }] },
      options: chartOptsLine(colors, true), plugins: [arkOverviewChartMotionPlugin()]
    });
    App.charts.ovTopCreators = new Chart(document.getElementById('ovTopCreators'), {
      type: 'bar',
      data: { labels: topCreators.map(function (c) { return c.name; }), datasets: [{ label: 'Revenue', data: topCreators.map(function (c) { return round2(c.revenue); }), backgroundColor: colors.pos, borderRadius: 4, maxBarThickness: 22 }] },
      options: chartOptsHBar(colors), plugins: [arkOverviewChartMotionPlugin()]
    });
    App.charts.ovTopCreatives = new Chart(document.getElementById('ovTopCreatives'), {
      type: 'bar',
      data: { labels: topCreatives.map(function (c) { return c.label; }), datasets: [{ label: 'ROAS', data: topCreatives.map(function (c) { return round2(c.roas); }), backgroundColor: colors.accent, borderRadius: 4, maxBarThickness: 22 }] },
      options: chartOptsHBar(colors, 'x'), plugins: [arkOverviewChartMotionPlugin()]
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

function arkOverviewChartMotionPlugin() {
  return {
    id: 'arkOverviewChartMotion',
    afterDraw: function(chart) {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var area = chart.chartArea;
      if (!area) return;
      var ctx = chart.ctx;
      var now = performance.now();
      var phase = (now % 4200) / 4200;
      var datasets = chart.data.datasets || [];
      var isBar = chart.config.type === 'bar';
      ctx.save();

      /* Aceternity-style tracing beam: a moving luminous sweep through the data field. */
      var beamX = area.left + phase * (area.right - area.left);
      var beam = ctx.createLinearGradient(beamX - 95, 0, beamX + 95, 0);
      beam.addColorStop(0, 'rgba(169,150,255,0)');
      beam.addColorStop(.42, 'rgba(169,150,255,.025)');
      beam.addColorStop(.5, 'rgba(169,150,255,.16)');
      beam.addColorStop(.58, 'rgba(169,150,255,.025)');
      beam.addColorStop(1, 'rgba(169,150,255,0)');
      ctx.fillStyle = beam;
      ctx.fillRect(beamX - 95, area.top, 190, area.bottom - area.top);

      if (isBar) {
        var meta = chart.getDatasetMeta(0);
        var bars = meta && meta.data ? meta.data : [];
        if (bars.length) {
          var active = Math.floor(phase * bars.length) % bars.length;
          var bar = bars[active];
          if (bar) {
            var p = bar.getProps(['x','y','base','width'], true);
            var pulse = .55 + Math.sin(now / 260) * .45;
            ctx.shadowBlur = 22 * pulse;
            ctx.shadowColor = 'rgba(118,82,232,.8)';
            ctx.fillStyle = 'rgba(169,150,255,.18)';
            ctx.fillRect(p.x - p.width / 2, p.y, p.width, p.base - p.y);
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3 + pulse * 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,' + (.55 + pulse * .3) + ')';
            ctx.fill();
          }
        }
      } else {
        /* Path-following signal nodes: a real moving pulse over each plotted series. */
        datasets.forEach(function(ds, di) {
          var meta = chart.getDatasetMeta(di);
          var points = meta && meta.data ? meta.data : [];
          if (!points.length) return;
          var pos = phase * (points.length - 1);
          var idx = Math.floor(pos);
          var next = Math.min(idx + 1, points.length - 1);
          var mix = pos - idx;
          var a = points[idx], b = points[next];
          if (!a || !b) return;
          var pa = a.getProps(['x','y'], true), pb = b.getProps(['x','y'], true);
          var px = pa.x + (pb.x - pa.x) * mix;
          var py = pa.y + (pb.y - pa.y) * mix;
          var pulse = .6 + Math.sin(now / 220 + di) * .4;
          var rgb = di === 0 ? '255,117,100' : '53,214,176';
          ctx.beginPath();
          ctx.arc(px, py, 11 + pulse * 7, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(' + rgb + ',' + (.045 + pulse * .035) + ')';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(px, py, 2.5 + pulse * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(' + rgb + ',' + (.72 + pulse * .25) + ')';
          ctx.shadowBlur = 18;
          ctx.shadowColor = 'rgba(' + rgb + ',.8)';
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }
      ctx.restore();

      if (!chart.$arkMotionFrame) {
        chart.$arkMotionFrame = requestAnimationFrame(function(){
          chart.$arkMotionFrame = null;
          if (chart.canvas && chart.canvas.isConnected) chart.draw();
        });
      }
    }
  };
}
function chartOptsLine(colors, isBar) {
  return {
    responsive: true, maintainAspectRatio: false,

    /*
     * DATA ARRIVAL ANIMATION
     * The chart does not simply fade in. Every value physically grows from
     * the zero baseline to its real value, staggered across the series.
     */
    animation: {
      duration: 1700,
      easing: 'easeOutCubic',
      delay: function(ctx){
        return ctx.type === 'data' ? ctx.dataIndex * 42 : 0;
      }
    },
    animations: {
      y: {
        from: function(ctx){
          var scale = ctx.chart && ctx.chart.scales ? ctx.chart.scales.y : null;
          return scale ? scale.getPixelForValue(0) : undefined;
        },
        duration: 1500,
        easing: 'easeOutCubic'
      }
    },

    transitions: {
      active: { animation: { duration: 280 } },
      resize: { animation: { duration: 500 } }
    },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: !isBar, position: 'top', align: 'end', labels: { color: colors.text, boxWidth: 10, font: { size: 11 } } },
      tooltip: { animation: { duration: 180 }, displayColors: true, padding: 10, cornerRadius: 8 }
    },
    scales: {
      x: { ticks: { color: colors.text, maxRotation: 0, autoSkip: true, font: { size: 10 } }, grid: { display: false } },
      y: { ticks: { color: colors.text, font: { size: 10 } }, grid: { color: colors.grid } }
    }
  };
}
function chartOptsHBar(colors, axis) {
  var indexAxis = axis === 'x' ? 'x' : 'y';
  var fromAxis = indexAxis === 'y' ? 'x' : 'y';
  return {
    indexAxis: indexAxis, responsive: true, maintainAspectRatio: false,

    /* Bars physically grow from zero to their actual measured value. */
    animation: {
      duration: 1500,
      easing: 'easeOutCubic',
      delay: function(ctx){
        return ctx.type === 'data' ? ctx.dataIndex * 70 : 0;
      }
    },
    animations: {
      [fromAxis]: {
        from: function(ctx){
          var scale = ctx.chart && ctx.chart.scales ? ctx.chart.scales[fromAxis] : null;
          return scale ? scale.getPixelForValue(0) : undefined;
        },
        duration: 1350,
        easing: 'easeOutCubic'
      }
    },

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


// ================= Command palette =================
var commandPaletteBound = false;
function commandPaletteItems() {
  return NAV_ITEMS.map(function(n, i){ return { id:n.id, label:n.label, index:String(i+1).padStart(2,'0')}; });
}
function openCommandPalette() {
  var existing = document.getElementById('arkCommandPalette');
  if (!existing) {
    existing = document.createElement('div');
    existing.id = 'arkCommandPalette';
    existing.className = 'command-palette-backdrop';
    existing.innerHTML = '<div class="command-palette" role="dialog" aria-modal="true" aria-label="ARKFLUENCE command palette">' +
      '<div class="command-palette-head"><span class="command-mark">ARK</span><input id="arkCommandInput" autocomplete="off" placeholder="Jump to a workspace..." aria-label="Search workspace" /><kbd>ESC</kbd></div>' +
      '<div class="command-palette-meta"><span>Navigate</span><span><kbd>↑↓</kbd> select <kbd>↵</kbd> open</span></div>' +
      '<div id="arkCommandResults" class="command-palette-results"></div>' +
      '</div>';
    document.body.appendChild(existing);
    existing.addEventListener('click', function(e){ if(e.target === existing) closeCommandPalette(); });
    var input = document.getElementById('arkCommandInput');
    input.addEventListener('input', renderCommandResults);
    input.addEventListener('keydown', commandPaletteKeydown);
  }
  existing.classList.add('is-open');
  var input = document.getElementById('arkCommandInput');
  input.value = '';
  renderCommandResults();
  setTimeout(function(){ input.focus(); }, 20);
}
function closeCommandPalette() {
  var el = document.getElementById('arkCommandPalette');
  if (el) el.classList.remove('is-open');
}
function renderCommandResults() {
  var input = document.getElementById('arkCommandInput');
  var box = document.getElementById('arkCommandResults');
  if (!input || !box) return;
  var q = input.value.trim().toLowerCase();
  var items = commandPaletteItems().filter(function(n){ return !q || n.label.toLowerCase().indexOf(q) !== -1; });
  if (!items.length) { box.innerHTML = '<div class="command-empty">No workspace matches <strong>' + escapeHtml(q) + '</strong>.</div>'; return; }
  box.innerHTML = items.map(function(n,i){ return '<button class="command-item' + (i===0?' selected':'') + '" data-command-page="' + n.id + '"><span class="command-item-index">' + n.index + '</span><span class="command-item-label">' + escapeHtml(n.label) + '</span><span class="command-item-arrow">↗</span></button>'; }).join('');
  box.querySelectorAll('.command-item').forEach(function(btn){ btn.addEventListener('click', function(){ closeCommandPalette(); setPage(btn.getAttribute('data-command-page'), {}); }); });
}
function commandPaletteKeydown(e) {
  var box = document.getElementById('arkCommandResults');
  var items = box ? Array.prototype.slice.call(box.querySelectorAll('.command-item')) : [];
  var selected = box ? box.querySelector('.command-item.selected') : null;
  var idx = selected ? items.indexOf(selected) : 0;
  if (e.key === 'Escape') { e.preventDefault(); closeCommandPalette(); }
  else if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); idx = (idx + 1) % items.length; items.forEach(function(x){x.classList.remove('selected')}); items[idx].classList.add('selected'); items[idx].scrollIntoView({block:'nearest'}); }
  else if (e.key === 'ArrowUp' && items.length) { e.preventDefault(); idx = (idx - 1 + items.length) % items.length; items.forEach(function(x){x.classList.remove('selected')}); items[idx].classList.add('selected'); items[idx].scrollIntoView({block:'nearest'}); }
  else if (e.key === 'Enter' && selected) { e.preventDefault(); closeCommandPalette(); setPage(selected.getAttribute('data-command-page'), {}); }
}
function wireCommandPalette() {
  if (commandPaletteBound) return;
  commandPaletteBound = true;
  document.addEventListener('keydown', function(e){
    var mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); openCommandPalette(); }
    if (e.key === 'Escape') closeCommandPalette();
  });
}
wireCommandPalette();
