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
