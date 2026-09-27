/**
 * The curated/manually-researched grants source. This is the ONLY active
 * grants source right now: most funders don't expose a public API the way
 * job boards do, so the ingestion pipeline's "fetch" step for this source
 * is just returning the maintained CURATED_GRANTS array from
 * curated-grants.ts, rather than a network call.
 *
 * To add more opportunities (from a new link the user provides, or
 * further research): add a new RawGrant entry to CURATED_GRANTS in
 * curated-grants.ts, then re-run `npm run ingest:grants` (or just restart
 * the dev server — this same data is also used as the in-memory fallback
 * when Supabase isn't configured; see lib/grants/fallback.ts).
 */

import type { GrantSource, RawGrant } from "../source-types";
import { CURATED_GRANTS } from "./curated-grants";
import { CURATED_GRANTS_BATCH_2 } from "./curated-grants-batch-2";

export const curatedGrantsSource: GrantSource = {
  id: "curated-research",
  name: "Curated Research",
  status: "active",
  notes:
    "Manually researched from funder websites, grant aggregators and user-provided links (not a live API) - see curated-grants*.ts.",
  async fetch(): Promise<RawGrant[]> {
    return [...CURATED_GRANTS, ...CURATED_GRANTS_BATCH_2];
  },
};
