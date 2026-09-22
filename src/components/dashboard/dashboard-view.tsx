"use client";

import { useMemo, useState } from "react";
import { SummaryCards } from "./summary-cards";
import { JobFiltersBar } from "./job-filters-bar";
import { JobList } from "@/components/jobs/job-list";
import { MOCK_JOBS } from "@/lib/jobs/mock-data";
import { applyFilters, DEFAULT_FILTERS } from "@/lib/jobs/filters";
import type { JobFilters, SortOption } from "@/lib/jobs/types";

// Filters start from the target criteria (lib/jobs/filters.ts). Settings
// (/settings) manages the same shape of preferences independently for
// Phase 1; wiring them together is a natural Phase 2 step once there's a
// user account to persist the connection against.
export function DashboardView() {
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOption>("newest");

  const results = useMemo(() => applyFilters(MOCK_JOBS, filters, sort), [filters, sort]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Remote Design Radar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Remote design opportunities matched to your criteria.
        </p>
      </div>

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
