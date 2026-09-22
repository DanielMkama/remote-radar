"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { SummaryCards } from "./summary-cards";
import { JobFiltersBar } from "./job-filters-bar";
import { JobList } from "@/components/jobs/job-list";
import { applyFilters, DEFAULT_FILTERS } from "@/lib/jobs/filters";
import type { Job, JobFilters, SortOption } from "@/lib/jobs/types";

interface DashboardViewProps {
  /** Supplied by app/page.tsx (server component): real Supabase data, or mock data as a fallback. */
  initialJobs: Job[];
  dataSource: "supabase" | "mock";
}

// Filters start from the target criteria (lib/jobs/filters.ts). Settings
// (/settings) manages the same shape of preferences independently for
// Phase 1; wiring them together is a natural later step once there's a
// user account to persist the connection against.
export function DashboardView({ initialJobs, dataSource }: DashboardViewProps) {
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOption>("newest");

  const results = useMemo(() => applyFilters(initialJobs, filters, sort), [initialJobs, filters, sort]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Remote Design Radar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Remote design opportunities matched to your criteria.
        </p>
      </div>

      {dataSource === "mock" && (
        <div className="flex items-start gap-2 rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            Showing sample data. Connect Supabase (see .env.example) and run{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">npm run ingest</code> to
            populate this dashboard with real, live opportunities.
          </p>
        </div>
      )}

      <SummaryCards
        jobs={results}
        targetMin={filters.minMonthlySalary ?? DEFAULT_FILTERS.minMonthlySalary!}
        targetMax={filters.maxMonthlySalary ?? DEFAULT_FILTERS.maxMonthlySalary!}
      />

      <JobFiltersBar filters={filters} onFiltersChange={setFilters} sort={sort} onSortChange={setSort} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {results.length} job{results.length === 1 ? "" : "s"} found
        </p>
      </div>

      <JobList jobs={results} />
    </div>
  );
}
