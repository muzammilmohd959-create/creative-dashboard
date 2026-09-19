function groupMetricsByDimension(data, dimKey, excludeValue) {
  var creativeById = {};
  data.creatives.forEach(function (cv) { creativeById[cv.id] = cv; });
  var buckets = {};
  data.dailyRows.forEach(function (r) {
    var cv = creativeById[r.creativeId];
    var val = cv[dimKey];
    if (excludeValue && val === excludeValue) return;
    if (!buckets[val]) buckets[val] = [];
    buckets[val].push(r);
  });
  var out = {};
  Object.keys(buckets).forEach(function (k) { out[k] = aggregate(buckets[k]); });
  return out;
}

function pctDiff(a, b) {
  if (!b) return null;
  return ((a - b) / Math.abs(b)) * 100;
}

function bestKey(groupMap, metric, higherIsBetter) {
  var keys = Object.keys(groupMap);
  if (!keys.length) return null;
  keys.sort(function (a, b) {
    var d = groupMap[a][metric] - groupMap[b][metric];
    return higherIsBetter ? -d : d;
  });
  return keys[0];
}
function worstKey(groupMap, metric, higherIsBetter) {
  return bestKey(groupMap, metric, !higherIsBetter);
}

function generateInsights(data) {
  var insights = [];

  // 1. Hooks — CTR
  var byHook = groupMetricsByDimension(data, 'hook');
  var bestHook = bestKey(byHook, 'ctr', true), worstHook = worstKey(byHook, 'ctr', true);
  if (bestHook && worstHook && bestHook !== worstHook) {
    var diff1 = pctDiff(byHook[bestHook].ctr, byHook[worstHook].ctr);
    insights.push({
      category: 'Hooks',
      text: bestHook + ' hooks generated ' + Math.round(diff1) + '% higher CTR than ' + worstHook.toLowerCase() + ' hooks.',
      detail: (byHook[bestHook].ctr * 100).toFixed(2) + '% CTR vs ' + (byHook[worstHook].ctr * 100).toFixed(2) + '%',
      magnitude: Math.abs(diff1)
    });
  }

  // 2. Angles — CPA (lower is better)
  var byAngle = groupMetricsByDimension(data, 'angle');
  var bestAngle = bestKey(byAngle, 'cpa', false), worstAngle = worstKey(byAngle, 'cpa', false);
  if (bestAngle && worstAngle && bestAngle !== worstAngle) {
    var diff2 = pctDiff(byAngle[worstAngle].cpa, byAngle[bestAngle].cpa);
    insights.push({
      category: 'Angles',
      text: bestAngle + ' angles produced ' + Math.round(diff2) + '% lower CPA than ' + worstAngle.toLowerCase() + ' angles.',
      detail: '$' + byAngle[bestAngle].cpa.toFixed(2) + ' CPA vs $' + byAngle[worstAngle].cpa.toFixed(2),
      magnitude: Math.abs(diff2)
    });
  }

  // 3. Creators — CPA vs account average
  var overall = aggregate(data.dailyRows);
  var byCreator = groupMetricsByDimension(data, 'creatorId');
  var creatorNames = {};
  data.creators.forEach(function (c) { creatorNames[c.id] = c.name; });
  var bestCreator = bestKey(byCreator, 'cpa', false);
  if (bestCreator) {
    var diff3 = pctDiff(overall.cpa, byCreator[bestCreator].cpa);
    insights.push({
      category: 'Creators',
      text: creatorNames[bestCreator] + ' generated ' + Math.round(diff3) + '% lower CPA than the account average.',
      detail: '$' + byCreator[bestCreator].cpa.toFixed(2) + ' vs $' + overall.cpa.toFixed(2) + ' average',
      magnitude: Math.abs(diff3)
    });
  }

  // 4. Formats — CTR
  var byFormat = groupMetricsByDimension(data, 'format');
  var bestFormat = bestKey(byFormat, 'ctr', true), worstFormat = worstKey(byFormat, 'ctr', true);
  if (bestFormat && worstFormat && bestFormat !== worstFormat) {
    var diff4 = pctDiff(byFormat[bestFormat].ctr, byFormat[worstFormat].ctr);
    insights.push({
      category: 'Formats',
      text: bestFormat + ' creative generated ' + Math.round(diff4) + '% higher CTR than ' + worstFormat.toLowerCase() + '.',
      detail: (byFormat[bestFormat].ctr * 100).toFixed(2) + '% CTR vs ' + (byFormat[worstFormat].ctr * 100).toFixed(2) + '%',
      magnitude: Math.abs(diff4)
    });
  }

  // 5. Video length — lowest average CPA (superlative, excluding n/a for static formats)
  var byLength = groupMetricsByDimension(data, 'lengthBucket', 'n/a');
  var bestLength = bestKey(byLength, 'cpa', false);
  if (bestLength) {
    insights.push({
      category: 'Video length',
      text: bestLength + ' videos generated the lowest average CPA, at $' + byLength[bestLength].cpa.toFixed(2) + '.',
      detail: 'Across ' + Object.keys(byLength).length + ' length groups tested',
      magnitude: 100 - (byLength[bestLength].cpa / overall.cpa) * 100
    });
  }

  // 6. CTAs — CTR
  var byCta = groupMetricsByDimension(data, 'cta');
  var bestCta = bestKey(byCta, 'ctr', true), worstCta = worstKey(byCta, 'ctr', true);
  if (bestCta && worstCta && bestCta !== worstCta) {
    var diff6 = pctDiff(byCta[bestCta].ctr, byCta[worstCta].ctr);
    insights.push({
      category: 'CTAs',
      text: '"' + bestCta + '" CTAs generated ' + Math.round(diff6) + '% higher CTR than "' + worstCta + '".',
      detail: (byCta[bestCta].ctr * 100).toFixed(2) + '% CTR vs ' + (byCta[worstCta].ctr * 100).toFixed(2) + '%',
      magnitude: Math.abs(diff6)
    });
  }

  // 7. Campaigns — ROAS vs account average
  var byCampaign = groupMetricsByDimension(data, 'campaignId');
  var campaignNames = {};
  data.campaigns.forEach(function (c) { campaignNames[c.id] = c.name; });
  var bestCampaign = bestKey(byCampaign, 'roas', true);
  if (bestCampaign) {
    var diff7 = pctDiff(byCampaign[bestCampaign].roas, overall.roas);
    insights.push({
      category: 'Campaigns',
      text: campaignNames[bestCampaign] + ' is running ' + Math.round(Math.abs(diff7)) + '% ' + (diff7 >= 0 ? 'above' : 'below') + ' the account average ROAS.',
      detail: byCampaign[bestCampaign].roas.toFixed(2) + 'x vs ' + overall.roas.toFixed(2) + 'x average',
      magnitude: Math.abs(diff7)
    });
  }

  insights.sort(function (a, b) { return b.magnitude - a.magnitude; });
  return insights;
}

function generateAlerts(data) {
  var alerts = [];
  var overall = aggregate(data.dailyRows);
  var cvById = {}; data.creatives.forEach(function (c) { cvById[c.id] = c; });

  // creatives above 1.3x average CPA
  var creativeMetrics = data.creatives.map(function (cv) {
    var rows = data.dailyRows.filter(function (r) { return r.creativeId === cv.id; });
    return Object.assign({}, cv, aggregate(rows));
  });
  var highCpaCount = creativeMetrics.filter(function (c) { return c.cpa > overall.cpa * 1.3 && c.spend > 100; }).length;
  if (highCpaCount > 0) {
    alerts.push({ level: 'warn', text: highCpaCount + ' creative' + (highCpaCount === 1 ? '' : 's') + ' running above target CPA (over $' + Math.round(overall.cpa * 1.3) + ').' });
  }

  var lowRoasCount = creativeMetrics.filter(function (c) { return c.roas < 2 && c.spend > 100; }).length;
  if (lowRoasCount > 0) {
    alerts.push({ level: 'warn', text: lowRoasCount + ' creative' + (lowRoasCount === 1 ? '' : 's') + ' running below 2x ROAS.' });
  }

  var expiringSoon = data.rights.filter(function (r) { return r.daysRemaining <= 7; }).length;
  if (expiringSoon > 0) {
    alerts.push({ level: 'danger', text: expiringSoon + ' usage rights expiring or expired within 7 days.' });
  }

  data.campaigns.forEach(function (camp) {
    var rows = data.dailyRows.filter(function (r) { return r.campaignId === camp.id; });
    var agg = aggregate(rows);
    if (agg.spend > camp.budget) {
      alerts.push({ level: 'danger', text: camp.name + ' has spent ' + Math.round((agg.spend / camp.budget) * 100) + '% of budget.' });
    }
  });

  if (!alerts.length) {
    alerts.push({ level: 'ok', text: 'No performance alerts — all campaigns are within target ranges.' });
  }
  return alerts;
}