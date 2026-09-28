# Remote Jobs Radar

A personal remote-job and grant/funding aggregator built with Next.js and Supabase. It pulls listings from job boards, ATS platforms (Greenhouse, Lever, Ashby, Workable), and curated grant sources into one searchable dashboard, then classifies, deduplicates, and scores each opportunity for relevance before it hits the UI.

## Features

- **Job dashboard** — browse aggregated remote job listings with filters for category, employment type, experience level, location, and freshness.
- **Match scoring** — each job is classified and scored for relevance against your preferences.
- **Saved jobs** — bookmark listings to revisit later.
- **Grants & funding** — a parallel feed of grant/funding opportunities with their own filters and status classification (open/closing soon/closed).
- **Source admin view** — inspect the health and status of every ingestion source at `/admin/sources`.
- **Pluggable source registry** — job sources are defined once in `src/lib/sources/registry.ts` and grant sources in `src/lib/grants/sources/registry.ts`; adding a source means writing an adapter and registering it.

Current sources include Remotive, Himalayas, RemoteOK, We Work Remotely, Jobgether, Working Nomads, and a growing list of verified company boards on Greenhouse, Lever, Ashby, and Workable.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + React 19 + TypeScript
- [Supabase](https://supabase.com) for storage (Postgres) — see `supabase/schema.sql`
- Tailwind CSS + shadcn/ui + Radix primitives
- Vitest for unit tests

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up Supabase and environment variables. Copy `.env.example` to `.env.local` and fill in your Supabase project's URL and keys (Project Settings → API):

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Purpose |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (client-side reads) |
   | `SUPABASE_SERVICE_ROLE_KEY` | Server-only key; bypasses RLS, used by ingestion and `/api` routes. Never expose to the browser. |
   | `INGEST_SECRET` | Optional shared secret to enable `POST /api/ingest` over HTTP. Leave unset to keep that endpoint disabled and use `npm run ingest` locally instead. |

3. Apply the database schema in `supabase/schema.sql` to your Supabase project.

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Ingesting data

Populate the database by running the ingestion pipelines, which fetch from every active source, normalize, classify, and dedupe results before writing to Supabase:

```bash
npm run ingest         # job listings
npm run ingest:grants  # grants & funding
```

For scheduled/unattended runs, prefer these CLI commands (e.g. via cron or a CI schedule) over the HTTP endpoints — many serverless hosts cap route handler execution time well below what fetching every source sequentially can take. If `INGEST_SECRET` is set, you can instead trigger a run remotely via `POST /api/ingest` (and `/api/ingest-grants`) with an `x-ingest-secret` header matching that secret.

## Testing

```bash
npm run test        # run once
npm run test:watch  # watch mode
```

## Project structure

```
src/
  app/                 Routes (dashboard, jobs, grants, saved, settings, admin, API)
  components/          UI components (dashboard, jobs, grants, layout, shadcn primitives)
  lib/opportunities/   Job normalization, classification, dedupe, and ingestion pipeline
  lib/grants/          Grant normalization, classification, dedupe, and ingestion pipeline
  lib/sources/         Job source adapters (job boards + ATS platforms)
  lib/supabase/        Supabase client helpers (browser, server, admin)
scripts/               Standalone ingestion CLI entry points
supabase/schema.sql    Database schema
```

## Deployment

Deploy on [Vercel](https://vercel.com/new) or any Node host that supports Next.js. Set the environment variables above in your hosting provider, then trigger `npm run ingest` on a schedule (cron, GitHub Actions, etc.) to keep listings fresh.
