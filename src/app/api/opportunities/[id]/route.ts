import { NextResponse } from "next/server";
import { getOpportunityById } from "@/lib/opportunities/repository";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** GET /api/opportunities/:id */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const client = getSupabaseServiceClient();
    const job = await getOpportunityById(client, id);
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ job });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Supabase is not configured or the request failed.",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 503 }
    );
  }
}
