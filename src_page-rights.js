PAGES.rights = {
  render: function () {
    if (App.mode === 'empty') return pageHeader('Rights management', 'Usage rights and authorization status for every creative.') + noDataState('rights management');
    if (App.mode === 'csv') return pageHeader('Rights management', 'Usage rights and authorization status for every creative.') + csvModeState('Rights management');

    var d = App.data;
    var creatorById = {}; d.creators.forEach(function (c) { creatorById[c.id] = c; });
    var rows = d.rights.map(function (r) {
      return Object.assign({}, r, {
        creatorName: creatorById[r.creatorId] ? creatorById[r.creatorId].name : r.creatorId,
        status: rightsStatus(r.daysRemaining)
      });
    });

    var counts = { Expired: 0, 'Expiring within 7 days': 0, 'Expiring within 30 days': 0, Active: 0 };
    rows.forEach(function (r) { counts[r.status] = (counts[r.status] || 0) + 1; });
    var summary = '<div class="kpi-grid">' +
      kpiCard('Expired', counts.Expired) + kpiCard('Expiring \u2264 7 days', counts['Expiring within 7 days']) +
      kpiCard('Expiring \u2264 30 days', counts['Expiring within 30 days']) + kpiCard('Active', counts.Active) + '</div>';

    var f = App.rightsFilter;
    if (f.status) rows = rows.filter(function (r) { return r.status === f.status; });
    function opt(val, label, cur) { return '<option value="' + escapeHtml(val) + '"' + (cur === val ? ' selected' : '') + '>' + escapeHtml(label) + '</option>'; }
    var filters = '<div class="filter-row"><select id="rightsFiltStatus">' +
      opt('', 'All statuses', f.status) + opt('Expired', 'Expired', f.status) + opt('Expiring within 7 days', 'Expiring within 7 days', f.status) +
      opt('Expiring within 30 days', 'Expiring within 30 days', f.status) + opt('Active', 'Active', f.status) + '</select></div>';

    var sorted = sortRows(rows, App.rightsSort, rightsColumns());
    return pageHeader('Rights management', 'Usage rights and authorization status for every creative.') + summary + filters +
      tableHTML(rightsColumns(), sorted, App.rightsSort, null, 'No rights records match this filter.');
  },
  mount: function (container) {
    if (!isFullMode()) return;
    var el = document.getElementById('rightsFiltStatus');
    if (el) el.addEventListener('change', function () { App.rightsFilter.status = el.value; mountPage(); });
    wireTable(container, App.rightsSort, function () { mountPage(); });
  }
};

function rightsColumns() {
  return [
    { key: 'creatorName', label: 'Creator', align: 'left' },
    { key: 'creativeId', label: 'Creative', align: 'left' },
    { key: 'platform', label: 'Platform', align: 'left' },
    { key: 'authType', label: 'Authorization', align: 'left' },
    { key: 'startDate', label: 'Start date', align: 'left' },
    { key: 'expiryDate', label: 'Expiry date', align: 'left' },
    { key: 'daysRemaining', label: 'Days remaining', format: function (r) { return r.daysRemaining < 0 ? ('\u2212' + Math.abs(r.daysRemaining)) : r.daysRemaining; } },
    { key: 'status', label: 'Status', align: 'left', format: function (r) { return statusBadge(r.status); } }
  ];
}