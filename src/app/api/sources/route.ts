import { NextResponse } from "next/server";
import { listLatestSourceRuns } from "@/lib/opportunities/repository";
import { SOURCE_REGISTRY } from "@/lib/sources/registry";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** GET /api/sources — the source registry plus each source's latest run, if Supabase is configured. */
export async function GET() {
  const registry = SOURCE_REGISTRY.map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type,
    kind: s.kind,
    status: s.status,
    notes: s.notes,
  }));

  try {
    const client = getSupabaseServiceClient();
    const runs = await listLatestSourceRuns(client);
    const runsBySource = new Map(runs.map((r) => [r.source, r]));
    return NextResponse.json({
      sources: registry.map((s) => ({ ...s, lastRun: runsBySource.get(s.id) ?? null })),
    });
  } catch {
    return NextResponse.json({
      sources: registry.map((s) => ({ ...s, lastRun: null })),
      note: "Supabase is not configured; run history is unavailable.",
    });
  }
}
