/**
 * In-memory fallback grants list, used when Supabase isn't configured (or
 * the `grants` table is empty because `npm run ingest:grants` hasn't been
 * run yet) — mirrors src/lib/jobs/mock-data.ts's role for the Jobs
 * dashboard, but built from the SAME real curated data the ingestion
 * pipeline uses, rather than fake sample entries, since that data already
 * exists and is more useful to show by default.
 */

import { normalizeGrant } from "./normalize";
import { curatedGrantsSource } from "./sources/curated";
import type { Grant } from "./types";

let cached: Grant[] | null = null;

export async function getFallbackGrants(): Promise<Grant[]> {
  if (cached) return cached;

  const raw = await curatedGrantsSource.fetch();
  cached = raw.map((rawGrant) =>
    normalizeGrant(rawGrant, { sourceId: curatedGrantsSource.id, sourceUrl: rawGrant.url })
  );
  return cached;
}
