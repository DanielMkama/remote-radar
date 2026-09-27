"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { GrantFiltersBar } from "./grant-filters-bar";
import { GrantList } from "./grant-list";
import { applyGrantFilters, DEFAULT_FILTERS } from "@/lib/grants/filters";
import type { Grant, GrantFilters, GrantSortOption } from "@/lib/grants/types";

interface GrantsViewProps {
  /** Supplied by app/grants/page.tsx (server component): real Supabase data, or curated fallback data. */
  initialGrants: Grant[];
  dataSource: "supabase" | "fallback";
}

export function GrantsView({ initialGrants, dataSource }: GrantsViewProps) {
  const [filters, setFilters] = useState<GrantFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<GrantSortOption>("deadline-asc");

  const results = useMemo(() => applyGrantFilters(initialGrants, filters, sort), [initialGrants, filters, sort]);

  const openCount = useMemo(
    () => initialGrants.filter((g) => g.status === "open" || g.status === "rolling").length,
    [initialGrants]
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Grants & Funding</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Grants, fellowships and funding opportunities for creative, tech, business and community projects.{" "}
          {openCount} currently open or rolling.
        </p>
      </div>

      {dataSource === "fallback" && (
        <div className="flex items-start gap-2 rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            Showing the curated research dataset directly (Supabase not connected or empty). Connect Supabase and
            run <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">npm run ingest:grants</code> to
            populate the database with the same data.
          </p>
        </div>
      )}

      <GrantFiltersBar filters={filters} onFiltersChange={setFilters} sort={sort} onSortChange={setSort} />

      <p className="text-sm text-muted-foreground">
        {results.length} opportunit{results.length === 1 ? "y" : "ies"} found
      </p>

      <GrantList grants={results} />
    </div>
  );
}
