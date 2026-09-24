PAGES.ads = {
  render: function () {
    if (App.mode === 'empty') return pageHeader('Ad performance', 'The lowest grain \u2014 every ad placement under every creative.') + noDataState('ad-level performance');
    if (App.mode === 'csv') return pageHeader('Ad performance', 'The lowest grain \u2014 every ad placement under every creative.') + csvModeState('Ad-level detail');

    var d = App.data;
    var f = App.adsFilter;
    var rows = d.ads.map(function (a) {
      var creator = d.creators.filter(function (c) { return c.id === a.creatorId; })[0];
      var campaign = d.campaigns.filter(function (c) { return c.id === a.campaignId; })[0];
      return Object.assign({
        id: a.id, creativeId: a.creativeId, creatorId: a.creatorId, campaignId: a.campaignId, placement: a.placement,
        creatorName: creator ? creator.name : a.creatorId, campaignName: campaign ? campaign.name : a.campaignId
      }, d.adMetrics[a.id] || aggregate([]));
    });
    if (f.creator) rows = rows.filter(function (r) { return r.creatorId === f.creator; });
    if (f.campaign) rows = rows.filter(function (r) { return r.campaignId === f.campaign; });
    if (f.placement) rows = rows.filter(function (r) { return r.placement === f.placement; });

    function opt(val, label, cur) { return '<option value="' + escapeHtml(val) + '"' + (cur === val ? ' selected' : '') + '>' + escapeHtml(label) + '</option>'; }
    var filters = '<div class="filter-row">' +
      '<select id="adFiltCreator"><option value="">All creators</option>' + d.creators.map(function (c) { return opt(c.id, c.name, f.creator); }).join('') + '</select>' +
      '<select id="adFiltCampaign"><option value="">All campaigns</option>' + d.campaigns.map(function (c) { return opt(c.id, c.name, f.campaign); }).join('') + '</select>' +
      '<select id="adFiltPlacement"><option value="">All placements</option>' + PLACEMENTS.map(function (p) { return opt(p, p, f.placement); }).join('') + '</select>' +
      '<button id="adFiltReset">Reset</button></div>';

    var sorted = sortRows(rows, App.adsSort, adColumns());
    var adHero = '<section class="ad-performance-hero"><div><span class="detail-eyebrow">DISTRIBUTION LAYER</span><h2>See exactly where creative performance is being bought.</h2><p>Placement-level evidence connects the creative fingerprint to paid distribution and downstream outcome.</p></div><div class="ad-scan"><i></i><span>PLACEMENT SIGNAL</span><strong>' + rows.length + '</strong><small>visible ads</small></div></section>';
    return '<div class="data-kicker"><span>AD PERFORMANCE</span><span>Creative → placement → outcome</span></div>' + pageHeader('Ad performance', 'The lowest grain \u2014 every ad placement under every creative.') + adHero + filters + tableHTML(adColumns(), sorted, App.adsSort, 'id', 'No ads match these filters.');
  },
  mount: function (container) {
    if (!isFullMode()) return;
    var map = { adFiltCreator: 'creator', adFiltCampaign: 'campaign', adFiltPlacement: 'placement' };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('change', function () { App.adsFilter[map[id]] = el.value; mountPage(); });
    });
    var reset = document.getElementById('adFiltReset');
    if (reset) reset.addEventListener('click', function () { App.adsFilter = { creator: '', campaign: '', placement: '' }; mountPage(); });
    wireTable(container, App.adsSort, function () { mountPage(); }, function (id) {
      var ad = App.data.ads.filter(function (a) { return a.id === id; })[0];
      if (ad) setPage('creatives', { creativeId: ad.creativeId });
    });
  }
};

function adColumns() {
  return [
    { key: 'id', label: 'Ad', align: 'left' },
    { key: 'creativeId', label: 'Creative', align: 'left' },
    { key: 'creatorName', label: 'Creator', align: 'left' },
    { key: 'campaignName', label: 'Campaign', align: 'left' },
    { key: 'placement', label: 'Placement', align: 'left' },
    { key: 'spend', label: 'Spend', format: function (r) { return fmtCurrency(r.spend); } },
    { key: 'impressions', label: 'Impr.', format: function (r) { return fmtNum(r.impressions); } },
    { key: 'clicks', label: 'Clicks', format: function (r) { return fmtNum(r.clicks); } },
    { key: 'ctr', label: 'CTR', format: function (r) { return fmtPct(r.ctr); } },
    { key: 'cpc', label: 'CPC', format: function (r) { return fmtCurrency2(r.cpc); } },
    { key: 'purchases', label: 'Purchases', format: function (r) { return fmtNum(r.purchases); } },
    { key: 'cpa', label: 'CPA', format: function (r) { return fmtCurrency2(r.cpa); } },
    { key: 'revenue', label: 'Revenue', format: function (r) { return fmtCurrency(r.revenue); } },
    { key: 'roas', label: 'ROAS', format: function (r) { return fmtX(r.roas); } }
  ];
}