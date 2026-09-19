function setTheme(mode) {
  if (mode === 'light' || mode === 'dark') {
    document.documentElement.setAttribute('data-theme', mode);
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  try { window.localStorage.setItem('cpd-theme', mode || ''); } catch (e) {}
  if (App.data) mountPage();
}
function loadTheme() {
  try {
    var t = window.localStorage.getItem('cpd-theme');
    if (t) document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
}

function setModeIndicator() {
  var el = document.getElementById('modeIndicator');
  if (App.mode === 'demo') { el.textContent = 'DEMO DATA'; el.style.display = 'inline-flex'; }
  else if (App.mode === 'csv') { el.textContent = 'CUSTOM CSV'; el.style.display = 'inline-flex'; }
  else if (App.mode === 'supabase') { el.textContent = 'LIVE \u00b7 SUPABASE'; el.style.display = 'inline-flex'; }
  else { el.style.display = 'none'; }
}

function loadSampleData() {
  var raw = generateDemoData();
  App.rawData = enrichDemoData(raw);
  App.data = App.rawData;
  App.mode = 'demo';
  App.params = {};
  try { window.localStorage.setItem('cpd-mode', 'demo'); } catch (e) {}
  setModeIndicator();
  mountPage();
}

function clearData() {
  App.rawData = null;
  App.data = null;
  App.mode = 'empty';
  App.params = {};
  try { window.localStorage.removeItem('cpd-mode'); } catch (e) {}
  setModeIndicator();
  mountPage();
}

function loadCsvData(rows) {
  App.rawData = buildCsvData(rows);
  App.data = App.rawData;
  App.mode = 'csv';
  App.params = {};
  setModeIndicator();
  mountPage();
}

function wireTopBar() {
  document.getElementById('btnSample').addEventListener('click', loadSampleData);
  document.getElementById('btnClear').addEventListener('click', clearData);
  document.getElementById('btnUpload').addEventListener('click', function () { document.getElementById('fileInput').click(); });
  document.getElementById('fileInput').addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: function (results) {
        var rows = results.data.map(function (row) {
          var norm = {};
          Object.keys(row).forEach(function (k) { norm[k.trim().toLowerCase()] = row[k]; });
          function pick(){ for (var i = 0; i < arguments.length; i++) { if (norm[arguments[i]] !== undefined) return norm[arguments[i]]; } return 0; }
          return {
            name: pick('creator', 'creator name', 'name') || 'Unnamed',
            spend: parseFloat(pick('spend', 'spend ($)')) || 0,
            impressions: parseFloat(pick('impressions')) || 0,
            clicks: parseFloat(pick('clicks')) || 0,
            conversions: parseFloat(pick('conversions', 'purchases')) || 0,
            revenue: parseFloat(pick('revenue', 'revenue ($)')) || 0
          };
        }).filter(function (r) { return r.name && r.name !== 'Unnamed'; });
        if (!rows.length) { alert('Could not find creator rows in that CSV. Expected columns like creator, spend, impressions, clicks, conversions, revenue.'); return; }
        loadCsvData(rows);
        e.target.value = '';
      },
      error: function () { alert('Could not read that CSV. Check the file and try again.'); }
    });
  });
}

// ================= Supabase =================
function mapSupabaseData(raw) {
  var creators = (raw.creators || []).map(function (c) {
    return { id: c.id, name: c.name, followers: c.followers, niche: c.niche, location: c.location, color: c.color || '#2B5FD9' };
  });
  var campaigns = (raw.campaigns || []).map(function (c) {
    return { id: c.id, name: c.name, objective: c.objective, budget: Number(c.budget) || 0, status: c.status, aov: Number(c.aov) || 0 };
  });
  var creatives = (raw.creatives || []).map(function (c) {
    return {
      id: c.id, creatorId: c.creator_id, campaignId: c.campaign_id, hook: c.hook, angle: c.angle,
      format: c.format, cta: c.cta, videoLength: c.video_length, lengthBucket: c.length_bucket,
      launchDate: c.launch_date ? new Date(c.launch_date + 'T00:00:00') : null
    };
  });
  var ads = (raw.ads || []).map(function (a) {
    return { id: a.id, creativeId: a.creative_id, creatorId: a.creator_id, campaignId: a.campaign_id, placement: a.placement };
  });
  var dailyRows = (raw.dailyMetrics || []).map(function (r) {
    return {
      date: r.date, adId: r.ad_id, creativeId: r.creative_id, creatorId: r.creator_id, campaignId: r.campaign_id,
      spend: Number(r.spend) || 0, impressions: Number(r.impressions) || 0, clicks: Number(r.clicks) || 0,
      purchases: Number(r.purchases) || 0, revenue: Number(r.revenue) || 0
    };
  });
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var rights = (raw.rights || []).map(function (r) {
    var expiry = new Date(r.expiry_date + 'T00:00:00');
    var daysRemaining = Math.round((expiry - today) / 86400000);
    return {
      creativeId: r.creative_id, creatorId: r.creator_id, platform: r.platform, authType: r.auth_type,
      startDate: r.start_date, expiryDate: r.expiry_date, daysRemaining: daysRemaining
    };
  });
  return { creators: creators, campaigns: campaigns, creatives: creatives, ads: ads, dailyRows: dailyRows, rights: rights, generatedAt: fmtDate(today) };
}

function connectSupabase(url, key, callback) {
  if (!window.supabase || !window.supabase.createClient) {
    if (callback) callback('Supabase client library did not load.');
    return;
  }
  var client;
  try { client = window.supabase.createClient(url, key); } catch (e) { if (callback) callback(e.message); return; }

  Promise.all([
    client.from('creators').select('*'),
    client.from('campaigns').select('*'),
    client.from('creatives').select('*'),
    client.from('ads').select('*'),
    client.from('daily_metrics').select('*'),
    client.from('rights').select('*')
  ]).then(function (results) {
    for (var i = 0; i < results.length; i++) {
      if (results[i].error) throw new Error(results[i].error.message);
    }
    var raw = {
      creators: results[0].data, campaigns: results[1].data, creatives: results[2].data,
      ads: results[3].data, dailyMetrics: results[4].data, rights: results[5].data
    };
    if (!raw.creators || !raw.creators.length) throw new Error('Connected, but the creators table is empty. Push demo data or seed your tables first.');

    App.rawData = enrichDemoData(mapSupabaseData(raw));
    App.data = App.rawData;
    App.mode = 'supabase';
    App.supabaseUrl = url; App.supabaseKey = key; App.supabaseClient = client;
    App.params = {};
    try {
      window.localStorage.setItem('cpd-supabase-url', url);
      window.localStorage.setItem('cpd-supabase-key', key);
      window.localStorage.setItem('cpd-mode', 'supabase');
    } catch (e) {}
    setModeIndicator();
    mountPage();
    if (callback) callback(null);
  }).catch(function (err) {
    if (callback) callback(err.message || String(err));
  });
}

function disconnectSupabase() {
  App.supabaseClient = null;
  App.rawData = null;
  App.data = null;
  App.mode = 'empty';
  App.params = {};
  try {
    window.localStorage.removeItem('cpd-supabase-url');
    window.localStorage.removeItem('cpd-supabase-key');
    window.localStorage.removeItem('cpd-mode');
  } catch (e) {}
  setModeIndicator();
  mountPage();
}

function pushDemoDataToSupabase(callback) {
  if (!App.supabaseClient) { if (callback) callback('Not connected.'); return; }
  if (App.mode !== 'demo') { if (callback) callback('Load sample data first.'); return; }
  var client = App.supabaseClient;
  var d = App.data;

  var creatorsRows = d.creators.map(function (c) { return { id: c.id, name: c.name, followers: c.followers, niche: c.niche, location: c.location, color: c.color }; });
  var campaignsRows = d.campaigns.map(function (c) { return { id: c.id, name: c.name, objective: c.objective, budget: c.budget, status: c.status, aov: round2(c.aov) }; });
  var creativesRows = d.creatives.map(function (c) {
    return { id: c.id, creator_id: c.creatorId, campaign_id: c.campaignId, hook: c.hook, angle: c.angle, format: c.format, cta: c.cta, video_length: c.videoLength, length_bucket: c.lengthBucket, launch_date: fmtDate(c.launchDate) };
  });
  var adsRows = d.ads.map(function (a) { return { id: a.id, creative_id: a.creativeId, creator_id: a.creatorId, campaign_id: a.campaignId, placement: a.placement }; });
  var dailyRows = d.dailyRows.map(function (r) {
    return { date: r.date, ad_id: r.adId, creative_id: r.creativeId, creator_id: r.creatorId, campaign_id: r.campaignId, spend: r.spend, impressions: r.impressions, clicks: r.clicks, purchases: r.purchases, revenue: r.revenue };
  });
  var rightsRows = d.rights.map(function (r) {
    return { creative_id: r.creativeId, creator_id: r.creatorId, platform: r.platform, auth_type: r.authType, start_date: r.startDate, expiry_date: r.expiryDate };
  });

  function chunk(arr, size) { var out = []; for (var i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size)); return out; }

  client.from('creators').upsert(creatorsRows)
    .then(function (r) { if (r.error) throw new Error(r.error.message); return client.from('campaigns').upsert(campaignsRows); })
    .then(function (r) { if (r.error) throw new Error(r.error.message); return client.from('creatives').upsert(creativesRows); })
    .then(function (r) { if (r.error) throw new Error(r.error.message); return client.from('ads').upsert(adsRows); })
    .then(function (r) {
      if (r.error) throw new Error(r.error.message);
      var dailyChunks = chunk(dailyRows, 500);
      return dailyChunks.reduce(function (p, c) {
        return p.then(function () { return client.from('daily_metrics').insert(c); }).then(function (res) { if (res.error) throw new Error(res.error.message); });
      }, Promise.resolve());
    })
    .then(function () { return client.from('rights').insert(rightsRows); })
    .then(function (r) {
      if (r.error) throw new Error(r.error.message);
      if (callback) callback(null);
    })
    .catch(function (err) { if (callback) callback(err.message || String(err)); });
}

function tryAutoReconnectSupabase() {
  try {
    var mode = window.localStorage.getItem('cpd-mode');
    if (mode !== 'supabase') return;
    var url = window.localStorage.getItem('cpd-supabase-url');
    var key = window.localStorage.getItem('cpd-supabase-key');
    if (url && key) connectSupabase(url, key);
  } catch (e) {}
}

(function boot() {
  loadTheme();
  wireTopBar();
  setModeIndicator();
  renderSidebar();
  mountPage();
  tryAutoReconnectSupabase();
})();