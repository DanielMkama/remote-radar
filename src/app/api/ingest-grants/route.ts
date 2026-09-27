import { NextResponse } from "next/server";
import { runGrantIngestion } from "@/lib/grants/pipeline";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * POST /api/ingest-grants — triggers a grants ingestion run (mirrors
 * /api/ingest for jobs). Protected by the same shared secret
 * (INGEST_SECRET) rather than full auth.
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
    const summary = await runGrantIngestion({ client });
    return NextResponse.json(summary);
  } catch (err) {
    return NextResponse.json(
      { error: "Grants ingestion failed to start.", message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
