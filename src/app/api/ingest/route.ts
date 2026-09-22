import { NextResponse } from "next/server";
import { runIngestion } from "@/lib/opportunities/pipeline";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * POST /api/ingest — triggers an ingestion run. Protected by a shared
 * secret (INGEST_SECRET, server-only env var) rather than full auth,
 * which Phase 1/2 deliberately don't build — see .env.example.
 *
 * For scheduled/unattended runs prefer `npm run ingest` (e.g. via a cron
 * job or CI schedule) over calling this endpoint: many serverless hosts
 * cap route-handler execution time well below what fetching every source
 * sequentially can take, whereas the CLI has no such limit.
 */
export async function POST(request: Request) {
  const expectedSecret = process.env.INGEST_SECRET;
  if (!expectedSecret) {
    return NextResponse.json(
      { error: "INGEST_SECRET is not configured on the server; ingestion endpoint is disabled." },
      { status: 503 }
    );
  }

  const providedSecret = request.headers.get("x-ingest-secret");
  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = getSupabaseServiceClient();
    const summary = await runIngestion({ client });
    return NextResponse.json(summary);
  } catch (err) {
    return NextResponse.json(
      { error: "Ingestion failed to start.", message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
