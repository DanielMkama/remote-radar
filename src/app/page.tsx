import { DashboardView } from "@/components/dashboard/dashboard-view";
import { MOCK_JOBS } from "@/lib/jobs/mock-data";
import { listOpportunities } from "@/lib/opportunities/repository";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type { Job } from "@/lib/jobs/types";

/**
 * Server component: tries Supabase first, falls back to mock data if
 * Supabase isn't configured, the query fails, or there simply aren't any
 * opportunities yet (e.g. `npm run ingest` hasn't been run). This is the
 * one place that decides real-vs-mock — DashboardView itself doesn't care
 * which it got.
 */
async function getDashboardJobs(): Promise<{ jobs: Job[]; dataSource: "supabase" | "mock"; error?: string }> {
  try {
    const client = getSupabaseServiceClient();
    const jobs = await listOpportunities(client);
    if (jobs.length === 0) {
      return { jobs: MOCK_JOBS, dataSource: "mock" };
    }
    return { jobs, dataSource: "supabase" };
  } catch (err) {
    return { jobs: MOCK_JOBS, dataSource: "mock", error: err instanceof Error ? err.message : String(err) };
  }
}

export default async function DashboardPage() {
  const { jobs, dataSource } = await getDashboardJobs();
  return <DashboardView initialJobs={jobs} dataSource={dataSource} />;
}
