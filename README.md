# Creator Performance Dashboard

A creator/creative performance analytics app for Meta-style ad campaigns, built as a single
self-contained HTML page (vanilla JS, Chart.js, PapaParse, Supabase JS). No build step, no
framework, no server required — open `dashboard.html` in a browser and it runs.

## What's in this folder

| File | What it is |
|---|---|
| `dashboard.html` | **The whole app.** Open this directly in a browser, or host it anywhere static (Vercel, Netlify, S3, GitHub Pages, a ChatGPT-built app, etc). All CSS/JS is inlined — nothing else to deploy. |
| `schema.sql` | The Postgres schema (6 tables + indexes + RLS policies) this app expects when using a live Supabase backend. Matches the project it was built against. |
| `src_*.js`, `src_*.html` | The unminified source, split by concern, for editing. `dashboard.html` is these files concatenated and inlined — see "Rebuilding" below. |

## Data model

```
creator ──▶ creative ──▶ campaign
              │
              ▼
             ads ──▶ daily_metrics (spend, impressions, clicks, purchases, revenue)
              │
              ▼
            rights (usage authorization, expiry tracking)
```

`creatives` is the primary analytical layer (not creators) — every ad hook/angle/format/CTA
combination is tracked at the creative level, then rolled up to creator and campaign views.
`daily_metrics` is the one true fact table everything else aggregates from.

## Three data modes (built into the app, switch anytime from the UI)

1. **Demo data** — click "Load sample data". Generates a realistic dataset entirely in the
   browser (8 creators, 40 creatives, 4 campaigns, 80 ads, 30 days of daily metrics) with
   believable bias patterns (e.g. testimonial hooks outperform product-demo hooks on CTR) so the
   Creative Intelligence page's auto-generated insights are directionally real, not random.
2. **Live Supabase** — Settings → Supabase → paste a project URL + anon/publishable key → Connect.
   Reads all 6 tables live. See `schema.sql` to stand up your own project, or reuse the one this
   was built against (URL/key were shared in the chat this export came from — rotate the key if
   you don't want that project readable).
3. **CSV upload** — flat creator-level CSV (`creator, spend, impressions, clicks, conversions,
   revenue` columns), no creative/campaign drill-down, useful as a quick one-off.

## Rebuilding dashboard.html from source

The src_ files are plain JS loaded in this order and inlined into one `<script>` tag inside
`src_shell-template.html` (which also gets `src_styles.html` inlined into its `<head>`):

```
src_data-engine.js       — demo data generator + core aggregation math
src_insights.js          — dynamic insight/alert generation for Creative Intelligence
src_app-core.js          — app state, formatting helpers, generic table/chart utilities
src_page-shell-overview.js
src_page-creators.js
src_page-creatives.js
src_page-campaigns.js
src_page-ads.js
src_page-intelligence.js
src_page-rights.js
src_page-reports.js
src_page-settings.js
src_boot.js               — Supabase connect/disconnect/push, theme, top-bar wiring, boot sequence
```

Simplest rebuild (Node, or ask ChatGPT/another assistant to do this):

```js
const fs = require('fs');
const shell = fs.readFileSync('src_shell-template.html', 'utf8');
const styles = fs.readFileSync('src_styles.html', 'utf8');
const files = ['data-engine','insights','app-core','page-shell-overview','page-creators',
  'page-creatives','page-campaigns','page-ads','page-intelligence','page-rights',
  'page-reports','page-settings','boot'].map(f => `src_${f}.js`);
const script = files.map(f => fs.readFileSync(f, 'utf8')).join('\n;\n');
const out = shell.replace('__STYLES__', styles).replace('__SCRIPT__', script);
fs.writeFileSync('dashboard.html', out);
```

Or just edit `dashboard.html` directly — it's plain HTML/CSS/JS, nothing generated-looking about
it once assembled.

## External dependencies (all loaded via CDN `<script>` tags, no npm install needed)

- Chart.js 4.4.1 (`cdnjs.cloudflare.com`)
- PapaParse 5.4.1 (`cdnjs.cloudflare.com`)
- @supabase/supabase-js 2.116.0 (`cdn.jsdelivr.net`) — only used in Supabase mode
- Inter + IBM Plex Mono (`fonts.googleapis.com`)

If you're moving this into an environment with different CDN restrictions (or want it fully
offline), swap these `<script>`/`<link>` tags in `src_shell-template.html` for local copies.

## Notes for continuing this in another tool

- All computed metrics (CTR, CPC, CPM, CPA, ROAS, conversion rate) derive from `daily_metrics`
  rows via `aggregate()` in `data-engine.js` — never hardcoded, so swapping in real data (Meta
  Marketing API, TikTok Ads API, Shopify, GA) just means populating the same table shapes.
- `generateInsights()` / `generateAlerts()` in `insights.js` compute the Creative Intelligence
  page's sentences from actual group averages in the dataset — also not hardcoded.
- There's a lightweight "internal composite score" (60% ROAS / 40% CPA-efficiency) used only as
  an optional, clearly-labeled secondary ranking signal — not a primary KPI anywhere in the UI.
- No multi-tenant/auth layer yet. If this becomes a real product, add a `client_id` column to
  every table and auth-scoped RLS policies before letting more than one client's data live in
  the same project.

## ARKFLUENCE V2 additions

This build adds an evidence-backed **Recommendations** page. It derives test/refresh suggestions from the loaded dataset, applies minimum-spend and sample gates, labels signal quality, and exposes the evidence used by each recommendation.

See `../v2/ARKFLUENCE_V2_ARCHITECTURE.md` and `../v2/IMPLEMENTATION_ROADMAP.md` in the V2 package for the multi-client, ingestion, attribution, and AI roadmap.