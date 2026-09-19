-- Creator Performance Dashboard — Supabase schema
-- Matches the live project at https://gylaptyzritzwvhkimot.supabase.co
-- Run this in the Supabase SQL editor (or `supabase db push`) to recreate the schema elsewhere.

create table creators (
  id text primary key,
  name text not null,
  followers integer,
  niche text,
  location text,
  color text
);

create table campaigns (
  id text primary key,
  name text not null,
  objective text,
  budget numeric,
  status text,
  aov numeric
);

-- Creatives are the primary analytical layer: creator -> creative -> campaign
create table creatives (
  id text primary key,
  creator_id text references creators(id) on delete cascade,
  campaign_id text references campaigns(id) on delete cascade,
  hook text,
  angle text,
  format text,
  cta text,
  video_length integer,
  length_bucket text,
  launch_date date
);

-- Ads are placements under a creative (e.g. Feed, Reels, Stories, Audience Network)
create table ads (
  id text primary key,
  creative_id text references creatives(id) on delete cascade,
  creator_id text references creators(id) on delete cascade,
  campaign_id text references campaigns(id) on delete cascade,
  placement text
);

-- One row per ad per day. Everything else (CTR, CPA, ROAS, etc.) aggregates up from here.
create table daily_metrics (
  id bigint generated always as identity primary key,
  date date not null,
  ad_id text references ads(id) on delete cascade,
  creative_id text references creatives(id) on delete cascade,
  creator_id text references creators(id) on delete cascade,
  campaign_id text references campaigns(id) on delete cascade,
  spend numeric not null default 0,
  impressions integer not null default 0,
  clicks integer not null default 0,
  purchases integer not null default 0,
  revenue numeric not null default 0
);

-- Usage rights per creative
create table rights (
  id bigint generated always as identity primary key,
  creative_id text references creatives(id) on delete cascade,
  creator_id text references creators(id) on delete cascade,
  platform text,
  auth_type text,
  start_date date,
  expiry_date date
);

create index idx_creatives_creator on creatives(creator_id);
create index idx_creatives_campaign on creatives(campaign_id);
create index idx_ads_creative on ads(creative_id);
create index idx_daily_metrics_date on daily_metrics(date);
create index idx_daily_metrics_ad on daily_metrics(ad_id);
create index idx_daily_metrics_creative on daily_metrics(creative_id);
create index idx_daily_metrics_creator on daily_metrics(creator_id);
create index idx_daily_metrics_campaign on daily_metrics(campaign_id);
create index idx_rights_creative on rights(creative_id);
create index idx_rights_creator on rights(creator_id);

-- Row level security: this backs a client-side dashboard that reads with the
-- public anon/publishable key, so anonymous read access is allowed.
-- No anon write policies exist on purpose — writes should go through the
-- service role key or the Supabase dashboard, not the browser key.
alter table creators enable row level security;
alter table campaigns enable row level security;
alter table creatives enable row level security;
alter table ads enable row level security;
alter table daily_metrics enable row level security;
alter table rights enable row level security;

create policy "public read" on creators for select using (true);
create policy "public read" on campaigns for select using (true);
create policy "public read" on creatives for select using (true);
create policy "public read" on ads for select using (true);
create policy "public read" on daily_metrics for select using (true);
create policy "public read" on rights for select using (true);