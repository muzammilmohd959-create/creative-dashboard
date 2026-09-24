// ================= Formatting helpers =================
function fmtCurrency(v) { return '$' + Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 0 }); }
function fmtCurrency2(v) { return '$' + Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtPct(v) { return (Number(v || 0) * 100).toFixed(2) + '%'; }
function fmtPct1(v) { return (Number(v || 0) * 100).toFixed(1) + '%'; }
function fmtNum(v) { return Number(v || 0).toLocaleString(); }
function fmtX(v) { return Number(v || 0).toFixed(2) + 'x'; }
function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function fmtDateShort(iso) {
  var d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ================= App state =================
var App = {
  data: null,
  mode: 'empty', // 'demo' | 'csv' | 'supabase' | 'empty'
  supabaseUrl: '',
  supabaseKey: '',
  supabaseClient: null,
  page: 'overview',
  params: {},
  charts: {},
  dateRange: { preset: '30d', start: '', end: '' },
  creativesFilter: { creator: '', campaign: '', hook: '', angle: '', format: '', perf: '' },
  creativesSort: { key: 'spend', dir: 'desc' },
  creativesView: 'table', // 'table' | 'library'
  creatorsSort: { key: 'spend', dir: 'desc' },
  campaignsSort: { key: 'spend', dir: 'desc' },
  adsSort: { key: 'spend', dir: 'desc' },
  adsFilter: { creator: '', campaign: '', placement: '' },
  rightsSort: { key: 'daysRemaining', dir: 'asc' },
  rightsFilter: { status: '' },
  creatorDetailTab: 'overview',
  campaignDetailTab: 'overview',
  showInternalScore: false
};

var NAV_ITEMS = [
  { id: 'overview', label: 'Overview' },
  { id: 'creators', label: 'Creators' },
  { id: 'creatives', label: 'Creatives' },
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'ads', label: 'Ad performance' },
  { id: 'intelligence', label: 'Creative intelligence' },
  { id: 'patternExplorer', label: 'Pattern explorer' },
  { id: 'creativeScorecard', label: 'Creative scorecard' },
  { id: 'comparisonInsights', label: 'Comparison insights' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'creativeOps', label: 'Creative operations' },
  { id: 'creativeTesting', label: 'Creative testing' },
  { id: 'rights', label: 'Rights management' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' }
];

// ================= Mode helpers =================
// 'demo' and 'supabase' both carry the full creator->creative->campaign->ad hierarchy;
// 'csv' is a flat creator-only dataset with no drill-down detail.
function isFullMode() { return App.mode === 'demo' || App.mode === 'supabase'; }

// ================= Data enrichment =================
function aggMap(rows, keyFn) {
  var groups = groupSum(rows, keyFn);
  var out = {};
  Object.keys(groups).forEach(function (k) { out[k] = aggregate(groups[k]); });
  return out;
}

function enrichDemoData(raw) {
  raw.creatorMetrics = aggMap(raw.dailyRows, function (r) { return r.creatorId; });
  raw.campaignMetrics = aggMap(raw.dailyRows, function (r) { return r.campaignId; });
  raw.creativeMetrics = aggMap(raw.dailyRows, function (r) { return r.creativeId; });
  raw.adMetrics = aggMap(raw.dailyRows, function (r) { return r.adId; });
  var byDate = groupSum(raw.dailyRows, function (r) { return r.date; });
  raw.dateSeries = Object.keys(byDate).sort().map(function (d) {
    var m = aggregate(byDate[d]);
    return Object.assign({ date: d }, m);
  });
  raw.overall = aggregate(raw.dailyRows);
  raw.insights = generateInsights(raw);
  raw.evidenceInsights = buildEvidenceInsights(raw);
  raw.recommendations = buildRecommendations(raw);
  raw.alerts = generateAlerts(raw);
  return raw;
}


function buildEvidenceInsights(data) {
  var overall = aggregate(data.dailyRows);
  var creatorById = {}; data.creators.forEach(function(c){ creatorById[c.id]=c; });
  var dimensions = [
    { key:'hook', label:'Hook', metric:'ctr', higher:true },
    { key:'angle', label:'Angle', metric:'cpa', higher:false },
    { key:'format', label:'Format', metric:'roas', higher:true },
    { key:'cta', label:'CTA', metric:'ctr', higher:true },
    { key:'lengthBucket', label:'Video length', metric:'cpa', higher:false, exclude:'n/a' }
  ];
  var out=[];
  dimensions.forEach(function(dim){
    var groups=groupMetricsByDimension(data, dim.key, dim.exclude);
    var keys=Object.keys(groups).filter(function(k){ return groups[k].spend>=100 && groups[k].impressions>=1000; });
    if(keys.length<2) return;
    keys.sort(function(a,b){ return dim.higher ? groups[b][dim.metric]-groups[a][dim.metric] : groups[a][dim.metric]-groups[b][dim.metric]; });
    var win=keys[0], base=aggregate(data.dailyRows), delta=dim.metric==='ctr' ? pctDiff(groups[win].ctr,base.ctr) : pctDiff(groups[win][dim.metric],base[dim.metric]);
    var quality=groups[win].spend>=500 && groups[win].purchases>=10 ? 'strong' : (groups[win].spend>=250 ? 'moderate':'directional');
    out.push({category:dim.label, winner:win, metric:dim.metric, value:groups[win][dim.metric], baseline:base[dim.metric], delta:delta, spend:groups[win].spend, purchases:groups[win].purchases, sampleSize:groups[win].impressions, quality:quality});
  });
  // Creator signal: compare creator CPA to blended CPA with minimum spend.
  var byCreator=groupMetricsByDimension(data,'creatorId');
  Object.keys(byCreator).forEach(function(id){
    var m=byCreator[id]; if(m.spend<250 || !m.purchases) return;
    var delta=pctDiff(overall.cpa,m.cpa);
    if(delta!==null && Math.abs(delta)>=10) out.push({category:'Creator', winner:(creatorById[id]||{}).name||id, metric:'cpa', value:m.cpa, baseline:overall.cpa, delta:delta, spend:m.spend, purchases:m.purchases, sampleSize:m.impressions, quality:m.spend>=500?'strong':'moderate'});
  });
  return out.sort(function(a,b){ return Math.abs(b.delta||0)-Math.abs(a.delta||0); });
}

function buildRecommendations(data) {
  var evidence=buildEvidenceInsights(data), recs=[];
  evidence.slice(0,6).forEach(function(e){
    var direction=e.metric==='cpa' ? (e.value<e.baseline?'lower':'higher') : (e.value>e.baseline?'higher':'lower');
    var pct=Math.round(Math.abs(e.delta||0));
    recs.push({type:'Test', priority:e.quality==='strong'?'High':e.quality==='moderate'?'Medium':'Explore', title:'Test more '+String(e.winner).toLowerCase()+' '+e.category.toLowerCase(), body:e.category+' group shows '+pct+'% '+direction+' '+e.metric.toUpperCase()+' versus the blended baseline.', evidence:e});
  });
  var fatigue=[];
  data.creatives.forEach(function(cv){
    var rows=data.dailyRows.filter(function(r){return r.creativeId===cv.id;});
    if(rows.length<14) return;
    var sorted=rows.slice().sort(function(a,b){return a.date.localeCompare(b.date);});
    var mid=Math.floor(sorted.length/2), first=aggregate(sorted.slice(0,mid)), last=aggregate(sorted.slice(mid));
    if(first.ctr>0 && last.ctr<first.ctr*0.75 && last.spend>100) fatigue.push({cv:cv, drop:pctDiff(last.ctr,first.ctr), spend:last.spend});
  });
  fatigue.sort(function(a,b){return a.drop-b.drop;});
  fatigue.slice(0,3).forEach(function(x){recs.push({type:'Refresh',priority:'High',title:'Refresh '+x.cv.id+' creative',body:'CTR declined '+Math.round(Math.abs(x.drop))+'% between the first and second half of its observed run.',evidence:{creative:x.cv.id,ctrDrop:x.drop,spend:x.spend}});});
  return recs;
}

function buildCsvData(rows) {
  var creators = rows.map(function (r, i) {
    return { id: 'csv' + i, name: r.name, followers: null, niche: '\u2014', location: '\u2014', color: '#2B5FD9' };
  });
  var creatorMetrics = {};
  rows.forEach(function (r, i) {
    creatorMetrics['csv' + i] = aggregate([{ spend: r.spend, impressions: r.impressions, clicks: r.clicks, purchases: r.conversions, revenue: r.revenue }]);
  });
  var overall = aggregate(rows.map(function (r) { return { spend: r.spend, impressions: r.impressions, clicks: r.clicks, purchases: r.conversions, revenue: r.revenue }; }));
  return {
    creators: creators, campaigns: [], creatives: [], ads: [], dailyRows: [], rights: [],
    creatorMetrics: creatorMetrics, campaignMetrics: {}, creativeMetrics: {}, adMetrics: {}, dateSeries: [],
    overall: overall, insights: [],
    alerts: [{ level: 'ok', text: 'Custom CSV data loaded. Creative, campaign, ad and rights detail need the full demo dataset \u2014 load sample data to explore those pages.' }]
  };
}

// ================= Chart registry =================
function destroyChart(id) {
  if (App.charts[id]) { App.charts[id].destroy(); delete App.charts[id]; }
}
function destroyAllCharts() {
  Object.keys(App.charts).forEach(function (id) { App.charts[id].destroy(); });
  App.charts = {};
}
function themeColors() {
  var isDark = (document.documentElement.getAttribute('data-theme') === 'dark') ||
    (!document.documentElement.hasAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
  return {
    isDark: isDark,
    text: isDark ? '#8B93A3' : '#5B6472',
    grid: isDark ? '#232837' : '#E3E6EB',
    accent: isDark ? '#6E93F5' : '#2B5FD9',
    pos: isDark ? '#34D8B9' : '#0F7B6C',
    neg: isDark ? '#FF7A63' : '#C1432E'
  };
}

// ================= Generic sortable table =================

// ================= Global date range =================
function dateRangeBounds(data) {
  var rows = (data && data.dailyRows) || [];
  var dates = rows.map(function(r){ return r.date; }).filter(Boolean).sort();
  return { min: dates[0] || '', max: dates[dates.length - 1] || '' };
}
function isoDaysAgo(endIso, days) {
  var d = new Date(endIso + 'T00:00:00');
  d.setDate(d.getDate() - days + 1);
  return d.toISOString().slice(0,10);
}
function resolveDateRange(data) {
  var b = dateRangeBounds(data);
  var end = App.dateRange.end || b.max;
  var start = App.dateRange.start;
  if (App.dateRange.preset && App.dateRange.preset !== 'custom') {
    var n = App.dateRange.preset === '7d' ? 7 : App.dateRange.preset === '14d' ? 14 : App.dateRange.preset === '30d' ? 30 : App.dateRange.preset === '90d' ? 90 : 0;
    start = n ? isoDaysAgo(end, n) : b.min;
  }
  if (!start) start = b.min;
  if (!end) end = b.max;
  if (b.min && start < b.min) start = b.min;
  if (b.max && end > b.max) end = b.max;
  return { start: start, end: end, min: b.min, max: b.max };
}
function filteredDailyRows(data) {
  var r = resolveDateRange(data);
  return ((data && data.dailyRows) || []).filter(function(row){
    return (!r.start || row.date >= r.start) && (!r.end || row.date <= r.end);
  });
}
function applyDateRange(data) {
  if (!data) return data;
  var rows = filteredDailyRows(data);
  var out = Object.assign({}, data, { dailyRows: rows, dateRange: resolveDateRange(data) });
  var byDate = groupSum(rows, function(r){ return r.date; });
  out.dateSeries = Object.keys(byDate).sort().map(function(d){
    return Object.assign({date:d}, aggregate(byDate[d]));
  });
  out.overall = aggregate(rows);
  out.creatorMetrics = aggMap(rows, function(r){ return r.creatorId; });
  out.campaignMetrics = aggMap(rows, function(r){ return r.campaignId; });
  out.creativeMetrics = aggMap(rows, function(r){ return r.creativeId; });
  out.adMetrics = aggMap(rows, function(r){ return r.adId; });
  out.insights = typeof generateInsights === 'function' ? generateInsights(out) : (data.insights || []);
  out.evidenceInsights = typeof buildEvidenceInsights === 'function' ? buildEvidenceInsights(out) : (data.evidenceInsights || []);
  out.recommendations = typeof buildRecommendations === 'function' ? buildRecommendations(out) : (data.recommendations || []);
  out.alerts = typeof generateAlerts === 'function' ? generateAlerts(out) : (data.alerts || []);
  return out;
}
function setDateRangePreset(preset) {
  App.dateRange.preset = preset;
  App.dateRange.start = '';
  App.dateRange.end = '';
  if (typeof window.renderCurrentPage === 'function') window.renderCurrentPage();
}
function setCustomDateRange(start, end) {
  App.dateRange.preset = 'custom';
  App.dateRange.start = start || '';
  App.dateRange.end = end || '';
  if (typeof window.renderCurrentPage === 'function') window.renderCurrentPage();
}
function renderGlobalDateRange() {
  if (!App.data) return '';
  var r = resolveDateRange(App.data);
  return '<div class="global-date-range" aria-label="Date range">' +
    '<span class="date-range-label">Date range</span>' +
    '<button class="date-preset '+(App.dateRange.preset==='7d'?'active':'')+'" onclick="setDateRangePreset(\'7d\')">7D</button>' +
    '<button class="date-preset '+(App.dateRange.preset==='14d'?'active':'')+'" onclick="setDateRangePreset(\'14d\')">14D</button>' +
    '<button class="date-preset '+(App.dateRange.preset==='30d'?'active':'')+'" onclick="setDateRangePreset(\'30d\')">30D</button>' +
    '<button class="date-preset '+(App.dateRange.preset==='90d'?'active':'')+'" onclick="setDateRangePreset(\'90d\')">90D</button>' +
    '<button class="date-preset '+(App.dateRange.preset==='all'?'active':'')+'" onclick="setDateRangePreset(\'all\')">All</button>' +
    '<span class="date-range-values">'+fmtDateShort(r.start)+' – '+fmtDateShort(r.end)+'</span>' +
    '</div>';
}

function sortRows(rows, sortState, columns) {
  var col = columns.filter(function (c) { return c.key === sortState.key; })[0];
  var getVal = col && col.sortValue ? col.sortValue : function (r) { return r[sortState.key]; };
  return rows.slice().sort(function (a, b) {
    var va = getVal(a), vb = getVal(b), cmp;
    if (typeof va === 'string') cmp = va.localeCompare(vb); else cmp = (va - vb);
    return sortState.dir === 'asc' ? cmp : -cmp;
  });
}

function tableHTML(columns, rows, sortState, rowIdKey, emptyMsg) {
  if (!rows.length) return '<div class="empty">' + (emptyMsg || 'No data to show.') + '</div>';
  var thead = '<thead><tr>' + columns.map(function (c) {
    var arrow = sortState && sortState.key === c.key ? (sortState.dir === 'asc' ? ' \u25B2' : ' \u25BC') : '';
    return '<th data-sort-key="' + c.key + '" style="text-align:' + (c.align || 'right') + '">' + escapeHtml(c.label) + '<span class="arrow">' + arrow + '</span></th>';
  }).join('') + '</tr></thead>';
  var tbody = '<tbody>' + rows.map(function (r) {
    var rowAttr = rowIdKey ? ' data-row-id="' + escapeHtml(r[rowIdKey]) + '" class="clickable-row"' : '';
    return '<tr' + rowAttr + '>' + columns.map(function (c) {
      var val = c.format ? c.format(r) : escapeHtml(r[c.key]);
      return '<td style="text-align:' + (c.align || 'right') + '">' + val + '</td>';
    }).join('') + '</tr>';
  }).join('') + '</tbody>';
  return '<div class="table-wrap"><table>' + thead + tbody + '</table></div>';
}

function wireTable(container, sortState, rerender, onRowClick) {
  container.querySelectorAll('[data-sort-key]').forEach(function (th) {
    th.addEventListener('click', function () {
      var key = th.getAttribute('data-sort-key');
      if (sortState.key === key) sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
      else { sortState.key = key; sortState.dir = 'desc'; }
      rerender();
    });
  });
  if (onRowClick) {
    container.querySelectorAll('.clickable-row').forEach(function (tr) {
      tr.addEventListener('click', function () { onRowClick(tr.getAttribute('data-row-id')); });
    });
  }
}

// ================= KPI card helper =================
function kpiCard(label, value, sub) {
  return '<div class="kpi"><div class="label">' + escapeHtml(label) + '</div><div class="value">' + value + '</div>' +
    (sub ? '<div class="kpi-sub">' + sub + '</div>' : '') + '</div>';
}

function badge(text, kind) {
  return '<span class="tag ' + (kind || '') + '">' + escapeHtml(text) + '</span>';
}

function statusBadge(status) {
  var kind = status === 'Expired' ? 'bad' : (status === 'Expiring within 7 days' ? 'bad' : (status === 'Expiring within 30 days' ? 'warn' : 'good'));
  return badge(status, kind);
}

function thumb(creative, creator) {
  var color = (creator && creator.color) || '#2B5FD9';
  var initials = creative.format ? creative.format.slice(0, 2).toUpperCase() : 'CV';
  return '<div class="thumb" style="background:linear-gradient(135deg,' + color + '33,' + color + '11); color:' + color + ';">' +
    '<span>' + escapeHtml(initials) + '</span></div>';
}