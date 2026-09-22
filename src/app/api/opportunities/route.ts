import { NextResponse } from "next/server";
import { applyFilters } from "@/lib/jobs/filters";
import { parseJobFilters, parseSortOption } from "@/lib/jobs/query-params";
import { listOpportunities } from "@/lib/opportunities/repository";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/opportunities — list opportunities, filtered/sorted with the
 * same lib/jobs/filters.ts logic the dashboard uses. Query params:
 * search, categories (comma-separated), minSalary, maxSalary,
 * worldwideOnly, employmentTypes (comma-separated), salaryDisclosure
 * (all|disclosed|undisclosed), sort (newest|salary-desc|salary-asc).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = parseJobFilters(searchParams);
  const sort = parseSortOption(searchParams);

  try {
    const client = getSupabaseServiceClient();
    const jobs = await listOpportunities(client);
    const results = applyFilters(jobs, filters, sort);
    return NextResponse.json({ jobs: results, count: results.length, source: "supabase" });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Supabase is not configured or the request failed.",
        message: err instanceof Error ? err.message : String(err),
        jobs: [],
        count: 0,
        source: "unavailable",
      },
      { status: 503 }
    );
  }
}
