"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { SummaryCards } from "./summary-cards";
import { JobFiltersBar } from "./job-filters-bar";
import { JobList } from "@/components/jobs/job-list";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { applyFilters, DEFAULT_FILTERS } from "@/lib/jobs/filters";
import { usePreferences } from "@/context/preferences-context";
import type { Job, JobFilters, SortOption } from "@/lib/jobs/types";

interface DashboardViewProps {
  /** Supplied by app/page.tsx (server component): real Supabase data, or mock data as a fallback. */
  initialJobs: Job[];
  dataSource: "supabase" | "mock";
}

// Filters are derived from the user's saved Settings (/settings) on every
// render — see `filters` below — until the user edits a filter directly on
// the dashboard itself, at which point `overrides` takes over completely
// (snapshotting the full filter set as it stood at that edit) so further
// dashboard tweaks aren't fought by the live preferences value. Navigating
// away and back remounts this component, clearing `overrides` and reseeding
// from Settings again. Deriving at render time (rather than copying into
// state inside an effect) also sidesteps SSR/hydration timing: preferences
// come from localStorage, which isn't available on the server, so the first
// correct client value only exists once `usePreferences()` has hydrated —
// computing from it at render time always uses whatever's current.
export function DashboardView({ initialJobs, dataSource }: DashboardViewProps) {
  const { preferences } = usePreferences();
  const [overrides, setOverrides] = useState<JobFilters | null>(null);
  const [sort, setSort] = useState<SortOption>("newest");

  const filters: JobFilters = useMemo(
    () =>
      overrides ?? {
        ...DEFAULT_FILTERS,
        categories: preferences.categories,
        minMonthlySalary: preferences.minMonthlySalary,
        maxMonthlySalary: preferences.maxMonthlySalary,
        worldwideOnly: preferences.worldwideOnly,
      },
    [overrides, preferences]
  );

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

      <JobFiltersBar filters={filters} onFiltersChange={setOverrides} sort={sort} onSortChange={setSort} />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {results.length} job{results.length === 1 ? "" : "s"} found
        </p>
        <div className="flex items-center gap-2">
          <Switch
            id="worldwide-only"
            checked={filters.worldwideOnly ?? false}
            onCheckedChange={(checked) => setOverrides({ ...filters, worldwideOnly: checked })}
          />
          <Label htmlFor="worldwide-only" className="cursor-pointer text-sm text-muted-foreground">
            Worldwide only
          </Label>
        </div>
      </div>

      <JobList jobs={results} />
    </div>
  );
}
