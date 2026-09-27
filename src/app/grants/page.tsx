import { GrantsView } from "@/components/grants/grants-view";
import { getFallbackGrants } from "@/lib/grants/fallback";
import { listGrants } from "@/lib/grants/repository";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type { Grant } from "@/lib/grants/types";

// Same reasoning as app/page.tsx: force a fresh read per request so
// deadlines crossing into "closed" and newly-ingested grants show up
// without waiting for a redeploy.
export const dynamic = "force-dynamic";

/**
 * Server component: tries Supabase first, falls back to the curated
 * dataset (normalized in-memory, no DB needed) if Supabase isn't
 * configured, the query fails, or `npm run ingest:grants` hasn't been run
 * yet. Mirrors app/page.tsx's real-vs-mock decision for Jobs.
 */
async function getGrantsPageData(): Promise<{ grants: Grant[]; dataSource: "supabase" | "fallback" }> {
  try {
    const client = getSupabaseServiceClient();
    const grants = await listGrants(client);
    if (grants.length === 0) {
      return { grants: await getFallbackGrants(), dataSource: "fallback" };
    }
    return { grants, dataSource: "supabase" };
  } catch {
    return { grants: await getFallbackGrants(), dataSource: "fallback" };
  }
}

export default async function GrantsPage() {
  const { grants, dataSource } = await getGrantsPageData();
  return <GrantsView initialGrants={grants} dataSource={dataSource} />;
}
