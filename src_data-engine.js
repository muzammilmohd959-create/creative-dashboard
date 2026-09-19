// ---------- Seeded RNG (mulberry32) so demo data is stable across a session ----------
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
var rng = mulberry32(42);
function rand(min, max) { return min + rng() * (max - min); }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function pick(arr) { return arr[Math.floor(rng() * arr.length)]; }
function round2(n) { return Math.round(n * 100) / 100; }

// ---------- Reference config ----------
var HOOKS = ['Testimonial', 'Product demo', 'Problem/solution', 'Before & after', 'Founder story', 'UGC unboxing'];
var ANGLES = ['Social proof', 'Pain point', 'Curiosity', 'Urgency/offer', 'Educational', 'Lifestyle'];
var FORMATS = ['UGC video', 'Studio video', 'Static image', 'Carousel', 'Meme/text'];
var CTAS = ['Shop now', 'Learn more', 'Get offer', 'Sign up'];
var PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Facebook'];
var AUTH_TYPES = ['Organic usage rights', 'Paid usage rights (whitelisting)', 'Full buyout'];
var NICHES = ['Beauty', 'Fitness', 'Home & lifestyle', 'Tech', 'Fashion', 'Food', 'Parenting', 'Finance'];
var LOCATIONS = ['Los Angeles, US', 'Austin, US', 'London, UK', 'Toronto, CA', 'Sydney, AU', 'Berlin, DE', 'Miami, US', 'Chicago, US'];
var PLACEMENTS = ['Feed', 'Reels', 'Stories', 'Audience Network'];

var HOOK_CTR_MULT = { 'Testimonial': 1.28, 'UGC unboxing': 1.22, 'Before & after': 1.15, 'Founder story': 1.05, 'Problem/solution': 1.0, 'Product demo': 0.85 };
var ANGLE_CTR_MULT = { 'Urgency/offer': 1.15, 'Curiosity': 1.12, 'Social proof': 1.08, 'Lifestyle': 1.0, 'Pain point': 0.95, 'Educational': 0.9 };
var FORMAT_CTR_MULT = { 'UGC video': 1.2, 'Carousel': 1.05, 'Studio video': 1.0, 'Meme/text': 0.95, 'Static image': 0.8 };

var HOOK_CPA_MULT = { 'Testimonial': 0.85, 'UGC unboxing': 0.9, 'Before & after': 0.95, 'Founder story': 1.0, 'Problem/solution': 1.05, 'Product demo': 1.2 };
var ANGLE_CPA_MULT = { 'Social proof': 0.85, 'Urgency/offer': 0.9, 'Pain point': 0.95, 'Curiosity': 1.0, 'Lifestyle': 1.05, 'Educational': 1.15 };
var LEN_CPA_MULT = { '<15s': 1.05, '15-30s': 0.82, '30-60s': 0.95, '60s+': 1.15 };

function lengthBucket(seconds) {
  if (seconds < 15) return '<15s';
  if (seconds < 30) return '15-30s';
  if (seconds < 60) return '30-60s';
  return '60s+';
}

// ---------- Data generation ----------
function generateDemoData() {
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var DAYS = 30;

  var creators = [];
  for (var i = 0; i < 8; i++) {
    creators.push({
      id: 'cr' + i,
      name: pick(['Maya Chen', 'Jordan Lee', 'Priya Nair', 'Sam Okafor', 'Elena Petrova', 'Diego Ramos', 'Aisha Bello', 'Kenji Watanabe'].slice(i, i + 1)) || ('Creator ' + (i + 1)),
      followers: randInt(18000, 620000),
      niche: NICHES[i % NICHES.length],
      location: LOCATIONS[i % LOCATIONS.length],
      quality: rand(0.85, 1.2), // per-creator skill multiplier (lower CPA, higher CTR when > 1)
      color: pick(['#2B5FD9', '#0F7B6C', '#C1432E', '#9757D7', '#D98A2B', '#2BA0D9', '#D92B6B', '#4C9F2B'])
    });
  }
  creators[0].name = 'Maya Chen'; creators[1].name = 'Jordan Lee'; creators[2].name = 'Priya Nair';
  creators[3].name = 'Sam Okafor'; creators[4].name = 'Elena Petrova'; creators[5].name = 'Diego Ramos';
  creators[6].name = 'Aisha Bello'; creators[7].name = 'Kenji Watanabe';

  var campaignNames = ['Spring conversions', 'Retargeting always-on', 'New market launch', 'Holiday push'];
  var campaigns = campaignNames.map(function (name, i) {
    return {
      id: 'cp' + i,
      name: name,
      objective: pick(['Conversions', 'Conversions', 'Catalog sales']),
      budget: randInt(35000, 95000),
      status: i === 3 ? 'Scheduled' : (i === 2 ? 'Paused' : 'Active'),
      aov: rand(85, 165)
    };
  });

  var creatives = [];
  for (var c = 0; c < 40; c++) {
    var creatorId = 'cr' + (c % 8);
    var campaignId = 'cp' + (c % 4);
    var hook = pick(HOOKS), angle = pick(ANGLES), format = pick(FORMATS), cta = pick(CTAS);
    var videoLength = format.indexOf('image') >= 0 || format.indexOf('Meme') >= 0 ? 0 : randInt(8, 75);
    var bucket = format.indexOf('image') >= 0 || format.indexOf('Meme') >= 0 ? 'n/a' : lengthBucket(videoLength);
    creatives.push({
      id: 'cv' + (c + 1),
      creatorId: creatorId,
      campaignId: campaignId,
      hook: hook, angle: angle, format: format, cta: cta,
      videoLength: videoLength, lengthBucket: bucket,
      launchDate: addDays(today, -randInt(5, 28)),
      ctrBase: 0.012 * (HOOK_CTR_MULT[hook] || 1) * (ANGLE_CTR_MULT[angle] || 1) * (FORMAT_CTR_MULT[format] || 1),
      cpaBase: 30 * (HOOK_CPA_MULT[hook] || 1) * (ANGLE_CPA_MULT[angle] || 1) * (LEN_CPA_MULT[bucket] || 1),
      cpmBase: rand(9, 19)
    });
  }

  // apply creator quality after creatives exist
  creatives.forEach(function (cv) {
    var creator = creators.filter(function (x) { return x.id === cv.creatorId; })[0];
    cv.ctrBase = cv.ctrBase * (0.7 + creator.quality * 0.3);
    cv.cpaBase = cv.cpaBase / (0.7 + creator.quality * 0.3);
  });

  var ads = [];
  var dailyRows = [];
  creatives.forEach(function (cv) {
    var campaign = campaigns.filter(function (x) { return x.id === cv.campaignId; })[0];
    var numAds = 2;
    for (var a = 0; a < numAds; a++) {
      var adId = cv.id + '-ad' + (a + 1);
      var placement = PLACEMENTS[(ads.length) % PLACEMENTS.length];
      ads.push({ id: adId, creativeId: cv.id, creatorId: cv.creatorId, campaignId: cv.campaignId, placement: placement });

      var baseDailySpend = rand(18, 70);
      for (var d = DAYS - 1; d >= 0; d--) {
        var date = addDays(today, -d);
        var noise = rand(0.75, 1.25);
        var spend = round2(baseDailySpend * noise * (0.9 + 0.2 * Math.sin(d / 4)));
        var impressions = Math.round((spend / cv.cpmBase) * 1000);
        var clicks = Math.round(impressions * cv.ctrBase * rand(0.85, 1.15));
        clicks = Math.max(clicks, spend > 0 ? 1 : 0);
        var purchases = Math.round((spend / cv.cpaBase) * rand(0.8, 1.2));
        purchases = Math.max(0, purchases);
        var revenue = round2(purchases * campaign.aov * rand(0.9, 1.1));

        dailyRows.push({
          date: fmtDate(date), adId: adId, creativeId: cv.id, creatorId: cv.creatorId, campaignId: cv.campaignId,
          spend: spend, impressions: impressions, clicks: clicks, purchases: purchases, revenue: revenue
        });
      }
    }
  });

  // Rights management: one record per creative
  var rights = creatives.map(function (cv, i) {
    var start = addDays(cv.launchDate, -randInt(0, 10));
    var expiryOffset;
    var mod = i % 10;
    if (mod === 0) expiryOffset = -randInt(1, 20);       // expired
    else if (mod === 1 || mod === 2) expiryOffset = randInt(1, 7);   // expiring this week
    else if (mod === 3 || mod === 4) expiryOffset = randInt(8, 30);  // expiring this month
    else expiryOffset = randInt(31, 240);                 // healthy
    var expiry = addDays(today, expiryOffset);
    return {
      creativeId: cv.id, creatorId: cv.creatorId,
      platform: PLATFORMS[i % PLATFORMS.length],
      authType: AUTH_TYPES[i % AUTH_TYPES.length],
      startDate: fmtDate(start), expiryDate: fmtDate(expiry),
      daysRemaining: expiryOffset
    };
  });

  return { creators: creators, campaigns: campaigns, creatives: creatives, ads: ads, dailyRows: dailyRows, rights: rights, generatedAt: fmtDate(today) };
}

function addDays(date, n) { var d = new Date(date); d.setDate(d.getDate() + n); return d; }
function fmtDate(d) { return d.toISOString().slice(0, 10); }

// ---------- Aggregation ----------
function aggregate(rows) {
  var spend = 0, impressions = 0, clicks = 0, purchases = 0, revenue = 0;
  for (var i = 0; i < rows.length; i++) {
    spend += rows[i].spend; impressions += rows[i].impressions; clicks += rows[i].clicks;
    purchases += rows[i].purchases; revenue += rows[i].revenue;
  }
  var ctr = impressions ? clicks / impressions : 0;
  var cpc = clicks ? spend / clicks : 0;
  var cpm = impressions ? (spend / impressions) * 1000 : 0;
  var cpa = purchases ? spend / purchases : 0;
  var roas = spend ? revenue / spend : 0;
  var cvr = clicks ? purchases / clicks : 0;
  return { spend: spend, impressions: impressions, clicks: clicks, purchases: purchases, revenue: revenue, ctr: ctr, cpc: cpc, cpm: cpm, cpa: cpa, roas: roas, cvr: cvr };
}

function groupSum(rows, keyFn) {
  var map = {};
  rows.forEach(function (r) {
    var k = keyFn(r);
    if (!map[k]) map[k] = [];
    map[k].push(r);
  });
  return map;
}

function rightsStatus(daysRemaining) {
  if (daysRemaining < 0) return 'Expired';
  if (daysRemaining <= 7) return 'Expiring within 7 days';
  if (daysRemaining <= 30) return 'Expiring within 30 days';
  return 'Active';
}