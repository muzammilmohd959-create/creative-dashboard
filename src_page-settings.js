PAGES.settings = {
  render: function () {
    var modeLabel = App.mode === 'demo' ? 'Demo data (full hierarchy, in-browser)' :
      (App.mode === 'supabase' ? 'Live Supabase project (full hierarchy)' :
      (App.mode === 'csv' ? 'Custom CSV (flat creator data)' : 'No data loaded'));
    var modeMeta = App.mode === 'demo' ? '8 creators \u00b7 40 creatives \u00b7 4 campaigns \u00b7 80 ads \u00b7 30 days of daily metrics, generated in your browser' :
      (App.mode === 'supabase' ? App.data.creators.length + ' creators \u00b7 ' + App.data.creatives.length + ' creatives \u00b7 ' + App.data.campaigns.length + ' campaigns \u00b7 ' + App.data.ads.length + ' ads, read live from ' + App.supabaseUrl :
      (App.mode === 'csv' ? App.data.creators.length + ' creators loaded from CSV' : 'Load sample data, connect Supabase, or upload a CSV from any page.'));

    var sources = [
      { name: 'Meta Marketing API', desc: 'Spend, impressions, clicks, ad-level performance' },
      { name: 'TikTok Ads API', desc: 'Spend, impressions, clicks, ad-level performance' },
      { name: 'Shopify', desc: 'Purchases and revenue for attribution' },
      { name: 'Google Analytics', desc: 'On-site conversion and traffic data' }
    ];
    var sourcesHtml = sources.map(function (s) {
      return '<div class="source-row"><div><div class="source-name">' + escapeHtml(s.name) + '</div><div class="source-desc">' + escapeHtml(s.desc) + '</div></div>' +
        '<div><span class="tag">Not connected</span> <button disabled title="Connect this data source once API integration is built">Connect</button></div></div>';
    }).join('');

    var supabaseConnected = App.mode === 'supabase';
    var supabaseSection = '<section><h2>Supabase</h2>' +
      '<p class="sub">Reads the same creator \u2192 creative \u2192 campaign \u2192 ad \u2192 daily_metrics / rights tables this dashboard is modeled on, straight from your project (read-only, via the public anon/publishable key).</p>' +
      (supabaseConnected
        ? '<div class="detail-card"><div><div class="detail-name">Connected</div><div class="detail-meta">' + escapeHtml(App.supabaseUrl) + '</div></div></div>' +
          '<div class="filter-row"><button id="btnSupaDisconnect">Disconnect</button><button id="btnSupaRefresh">Refresh data</button></div>'
        : '<div class="filter-row" style="align-items:stretch;">' +
          '<input id="supaUrl" type="text" placeholder="https://xxxxx.supabase.co" value="' + escapeHtml(App.supabaseUrl) + '" style="flex:1 1 260px; padding:7px 10px; border-radius:6px; border:1px solid var(--border); background:var(--surface); color:var(--text); font-size:12.5px;">' +
          '<input id="supaKey" type="password" placeholder="anon / publishable key" value="' + escapeHtml(App.supabaseKey) + '" style="flex:1 1 220px; padding:7px 10px; border-radius:6px; border:1px solid var(--border); background:var(--surface); color:var(--text); font-size:12.5px;">' +
          '<button id="btnSupaConnect" class="primary">Connect</button></div>' +
          '<p class="foot-note" id="supaStatus"></p>') +
      (App.mode === 'demo' ? '<p class="foot-note">Have an empty Supabase project? <button id="btnSupaPush" style="margin-left:4px;">Push this demo dataset to Supabase</button> once connected.</p>' : '') +
      '</section>';

    return '<div class="data-kicker"><span>SYSTEM CONTROL</span><span>Data → integrations → workspace</span></div>' + pageHeader('Settings', 'App mode, theme, and data source connections.') +
      '<section class="settings-hero"><div><span class="ops-eyebrow">ARKFLUENCE SYSTEM CONTROL</span><h2>Configure the workspace behind the intelligence layer.</h2><p>Control the data mode, visual system and connected performance sources that power your creator → creative → media workflow.</p></div><div class="settings-orb"><span>WORKSPACE</span><strong>OS</strong><small>system control</small></div></section>' +
      '<section><h2 class="settings-section-title">Workspace data</h2><div class="detail-card"><div><div class="detail-name">' + escapeHtml(modeLabel) + '</div>' +
      '<div class="detail-meta">' + modeMeta + '</div></div></div></section>' +
      '<section><h2>Appearance</h2><div class="filter-row"><button id="themeLight">Light</button><button id="themeDark">Dark</button><button id="themeSystem">Match system</button></div></section>' +
      supabaseSection +
      '<section><h2>Other data source connections</h2><p class="sub">Not implemented yet. See the notes below for how live connections would slot in.</p>' + sourcesHtml + '</section>' +
      '<section><h2>About</h2><p class="sub">Creator Performance dashboard \u2014 tracks the full path from creator \u2192 creative \u2192 campaign \u2192 ad \u2192 spend \u2192 impressions \u2192 clicks \u2192 purchases \u2192 revenue, with creatives as the primary analytical layer.</p></section>';
  },
  mount: function () {
    var l = document.getElementById('themeLight'), dk = document.getElementById('themeDark'), s = document.getElementById('themeSystem');
    if (l) l.addEventListener('click', function () { setTheme('light'); });
    if (dk) dk.addEventListener('click', function () { setTheme('dark'); });
    if (s) s.addEventListener('click', function () { setTheme(null); });

    var connectBtn = document.getElementById('btnSupaConnect');
    if (connectBtn) connectBtn.addEventListener('click', function () {
      var url = document.getElementById('supaUrl').value.trim();
      var key = document.getElementById('supaKey').value.trim();
      var status = document.getElementById('supaStatus');
      if (!url || !key) { status.textContent = 'Enter both the project URL and the anon/publishable key.'; return; }
      status.textContent = 'Connecting\u2026';
      connectSupabase(url, key, function (err) {
        if (err) { var s2 = document.getElementById('supaStatus'); if (s2) s2.textContent = 'Could not connect: ' + err; }
      });
    });
    var disconnectBtn = document.getElementById('btnSupaDisconnect');
    if (disconnectBtn) disconnectBtn.addEventListener('click', disconnectSupabase);
    var refreshBtn = document.getElementById('btnSupaRefresh');
    if (refreshBtn) refreshBtn.addEventListener('click', function () {
      connectSupabase(App.supabaseUrl, App.supabaseKey, function (err) {
        if (err) alert('Could not refresh: ' + err);
      });
    });
    var pushBtn = document.getElementById('btnSupaPush');
    if (pushBtn) pushBtn.addEventListener('click', function () {
      pushBtn.disabled = true; pushBtn.textContent = 'Pushing\u2026';
      pushDemoDataToSupabase(function (err) {
        pushBtn.disabled = false;
        pushBtn.textContent = err ? 'Push failed \u2014 try again' : 'Pushed \u2713';
      });
    });
  }
};