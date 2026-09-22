-- Remote Design Radar — Phase 1 schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a
-- fresh project. Safe to re-run: uses IF NOT EXISTS guards.

create extension if not exists "pgcrypto";

create table if not exists jobs (
  id                uuid primary key default gen_random_uuid(),

  -- Source identity
  external_id       text not null,          -- id assigned by the source board (e.g. Remotive's job id)
  source            text not null,          -- e.g. 'remotive'

  -- Core listing fields
  title             text not null,
  company           text not null,
  company_logo      text,
  url               text not null,
  description       text,
  location          text,                   -- raw location string as stated by the source

  -- Salary — original, as stated by the source. Never overwritten with an estimate.
  salary_min        numeric,
  salary_max        numeric,
  salary_currency   text default 'USD',
  salary_period     text check (salary_period in ('hour', 'month', 'year')),

  job_type          text,                   -- full-time / part-time / contract / freelance / internship
  category          text,                   -- one of the target design categories, or 'other'
  tags              text[] default '{}',

  posted_at         timestamptz,            -- when the source published the listing
  collected_at      timestamptz not null default now(), -- when our ingestion pulled it in

  match_score       integer,                -- 0–100, computed against user criteria

  is_worldwide      boolean not null default false,
  is_active         boolean not null default true,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint jobs_source_external_id_unique unique (source, external_id)
);

-- Indexes to support the dashboard's filters and sorts.
create index if not exists idx_jobs_source        on jobs (source);
create index if not exists idx_jobs_external_id    on jobs (external_id);
create index if not exists idx_jobs_posted_at      on jobs (posted_at desc);
create index if not exists idx_jobs_salary_min     on jobs (salary_min);
create index if not exists idx_jobs_salary_max     on jobs (salary_max);
create index if not exists idx_jobs_is_worldwide   on jobs (is_worldwide);
create index if not exists idx_jobs_category       on jobs (category);

-- Keep updated_at current on every row change.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists jobs_set_updated_at on jobs;
create trigger jobs_set_updated_at
  before update on jobs
  for each row
  execute function set_updated_at();

-- Row Level Security: enabled for when auth lands in a later phase.
-- Phase 1 has no auth, so this policy allows public read access, which is
-- fine for a personal read-only job board. Writes are expected to go
-- through the service role key (ingestion), which bypasses RLS.
alter table jobs enable row level security;

drop policy if exists "Public read access" on jobs;
create policy "Public read access"
  on jobs for select
  using (true);

-- =============================================================================
-- Phase 2 — real ingestion pipeline
-- =============================================================================
-- `opportunities` is the production data store the dashboard reads from
-- once Supabase is configured (see src/lib/opportunities/repository.ts).
-- The Phase 1 `jobs` table above is left untouched — nothing here depends
-- on it, and nothing drops it.

create table if not exists opportunities (
  id                      uuid primary key default gen_random_uuid(),

  opportunity_type        text not null default 'job'
                             check (opportunity_type in ('job', 'contract', 'freelance', 'hiring_signal')),

  title                   text not null,
  company                 text not null,
  company_url             text,
  description             text not null default '',

  url                     text not null,
  source                  text not null,          -- canonical/current source id, e.g. 'remotive'
  source_url              text not null,
  source_id               text,                    -- the canonical source's own id for this listing

  employment_type         text not null default 'unknown'
                             check (employment_type in ('full_time', 'part_time', 'contract', 'freelance', 'unknown')),
  employment_types        text[] not null default '{}', -- every type the listing mentioned

  location_text           text,                    -- original, never discarded
  location_status         text not null default 'location_unclear'
                             check (location_status in
                               ('worldwide', 'region_restricted', 'country_restricted', 'timezone_restricted', 'location_unclear')),

  salary_text             text,                    -- original, never discarded
  salary_currency         text default 'USD',
  salary_period            text check (salary_period in ('hour', 'month', 'year')),
  salary_min              numeric,
  salary_max              numeric,
  normalized_monthly_min  numeric,                 -- estimated USD/month — derived, see lib/jobs/salary.ts
  normalized_monthly_max  numeric,
  salary_status           text not null default 'unknown'
                             check (salary_status in ('within_range', 'below_range', 'above_range', 'unknown')),

  category                text not null default 'other',
  tags                    text[] not null default '{}',

  posted_at               timestamptz,
  discovered_at           timestamptz not null default now(),
  deadline                timestamptz,

  application_url         text not null,

  raw_source_data         jsonb,

  verification_status     text not null default 'unverified'
                             check (verification_status in ('verified', 'likely', 'unverified')),
  freshness               text not null default 'unknown'
                             check (freshness in ('active', 'expired', 'closed', 'unknown')),
  duplicate_fingerprint   text not null,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  constraint opportunities_duplicate_fingerprint_unique unique (duplicate_fingerprint)
);

create index if not exists idx_opportunities_source                 on opportunities (source);
create index if not exists idx_opportunities_company                on opportunities (company);
create index if not exists idx_opportunities_category               on opportunities (category);
create index if not exists idx_opportunities_employment_type        on opportunities (employment_type);
create index if not exists idx_opportunities_location_status        on opportunities (location_status);
create index if not exists idx_opportunities_salary_status          on opportunities (salary_status);
create index if not exists idx_opportunities_posted_at              on opportunities (posted_at desc);
create index if not exists idx_opportunities_discovered_at          on opportunities (discovered_at desc);
create index if not exists idx_opportunities_normalized_salary_min  on opportunities (normalized_monthly_min);
create index if not exists idx_opportunities_normalized_salary_max  on opportunities (normalized_monthly_max);
create index if not exists idx_opportunities_duplicate_fingerprint  on opportunities (duplicate_fingerprint);

drop trigger if exists opportunities_set_updated_at on opportunities;
create trigger opportunities_set_updated_at
  before update on opportunities
  for each row
  execute function set_updated_at();

alter table opportunities enable row level security;

drop policy if exists "Public read access" on opportunities;
create policy "Public read access"
  on opportunities for select
  using (true);

-- `opportunity_sources`: every place a canonical opportunity was seen.
-- When the same job appears on 3 boards, `opportunities` has ONE row and
-- this table has up to 3 (one per source) — see Phase 2 §15.
create table if not exists opportunity_sources (
  id              uuid primary key default gen_random_uuid(),
  opportunity_id  uuid not null references opportunities(id) on delete cascade,
  source          text not null,
  source_id       text,
  source_url      text not null,
  discovered_at   timestamptz not null default now(),

  constraint opportunity_sources_unique unique (opportunity_id, source)
);

create index if not exists idx_opportunity_sources_opportunity_id on opportunity_sources (opportunity_id);
create index if not exists idx_opportunity_sources_source         on opportunity_sources (source);

alter table opportunity_sources enable row level security;

drop policy if exists "Public read access" on opportunity_sources;
create policy "Public read access"
  on opportunity_sources for select
  using (true);

-- `source_runs`: ingestion run history, powers the /admin/sources page.
create table if not exists source_runs (
  id                uuid primary key default gen_random_uuid(),
  source            text not null,
  status            text not null check (status in ('ok', 'error')),
  started_at        timestamptz not null,
  finished_at       timestamptz not null,
  fetched_count     integer not null default 0,
  design_count      integer not null default 0,
  worldwide_count   integer not null default 0,
  in_range_count    integer not null default 0,
  new_count         integer not null default 0,
  updated_count     integer not null default 0,
  duplicate_count   integer not null default 0,
  error_message     text,
  created_at        timestamptz not null default now()
);

create index if not exists idx_source_runs_source       on source_runs (source);
create index if not exists idx_source_runs_started_at    on source_runs (started_at desc);

alter table source_runs enable row level security;

drop policy if exists "Public read access" on source_runs;
create policy "Public read access"
  on source_runs for select
  using (true);
