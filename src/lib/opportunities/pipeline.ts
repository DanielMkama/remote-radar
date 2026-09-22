/**
 * The ingestion pipeline (Phase 2 §7):
 *
 *   Source -> Fetch -> Raw -> Normalize -> Validate -> Dedupe -> Supabase
 *
 * Each stage is a small, independently-testable function elsewhere in
 * this directory; this file just sequences them per source and collects
 * stats. One source failing (network error, bad response, timeout) is
 * caught and reported per-source — it never stops the other sources from
 * running (Phase 2 "failure handling" acceptance criterion).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SourceRunInsert } from "@/lib/supabase/database.types";
import { getEnabledSources } from "@/lib/sources/registry";
import type { OpportunitySource } from "@/lib/sources/types";
import { normalizeOpportunity } from "./normalize";
import { recordSourceRun, upsertOpportunity, type UpsertOutcome } from "./repository";
import { validateOpportunity } from "./validate";

export interface SourceRunStats {
  sourceId: string;
  sourceName: string;
  status: "ok" | "error";
  errorMessage?: string;
  fetched: number;
  designOpportunities: number;
  worldwide: number;
  salaryInRange: number;
  newCount: number;
  updatedCount: number;
  duplicateCount: number;
  rejected: number;
  startedAt: string;
  finishedAt: string;
}

export interface IngestionSummary {
  results: SourceRunStats[];
  totals: {
    fetched: number;
    designOpportunities: number;
    worldwide: number;
    salaryInRange: number;
    newCount: number;
    updatedCount: number;
    duplicateCount: number;
  };
}

export interface RunIngestionOptions {
  /** Supabase client to persist results to. Omit for a dry run (fetch + classify only, nothing written). */
  client?: SupabaseClient<Database> | null;
  /** Defaults to every "active" source in the registry. */
  sources?: OpportunitySource[];
  /** Per-source overall timeout, as a backstop above each adapter's own per-request timeouts. */
  sourceTimeoutMs?: number;
}

const DEFAULT_SOURCE_TIMEOUT_MS = 45_000;

export async function runIngestion(options: RunIngestionOptions = {}): Promise<IngestionSummary> {
  const sources = options.sources ?? getEnabledSources();
  const client = options.client ?? null;
  const timeoutMs = options.sourceTimeoutMs ?? DEFAULT_SOURCE_TIMEOUT_MS;

  const sourceKindById = new Map(sources.map((s) => [s.id, s.kind]));
  const sourceKindOf = (id: string) => sourceKindById.get(id) ?? "job_board";

  const results: SourceRunStats[] = [];

  for (const source of sources) {
    const startedAt = new Date().toISOString();
    const stats: SourceRunStats = {
      sourceId: source.id,
      sourceName: source.name,
      status: "ok",
      fetched: 0,
      designOpportunities: 0,
      worldwide: 0,
      salaryInRange: 0,
      newCount: 0,
      updatedCount: 0,
      duplicateCount: 0,
      rejected: 0,
      startedAt,
      finishedAt: startedAt,
    };

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      let raw;
      try {
        raw = await source.fetch({ signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }

      stats.fetched = raw.length;

      for (const rawOpportunity of raw) {
        const normalized = normalizeOpportunity(rawOpportunity, { sourceKind: source.kind });
        const { valid } = validateOpportunity(normalized);

        if (!valid) {
          stats.rejected++;
          continue;
        }

        stats.designOpportunities++;
        if (normalized.locationStatus === "worldwide") stats.worldwide++;
        if (normalized.salaryStatus === "within_range") stats.salaryInRange++;

        if (client) {
          const outcome: UpsertOutcome = await upsertOpportunity(client, normalized, source.kind, sourceKindOf);
          if (outcome === "new") stats.newCount++;
          else if (outcome === "updated") stats.updatedCount++;
          else stats.duplicateCount++;
        }
      }
    } catch (err) {
      stats.status = "error";
      stats.errorMessage = err instanceof Error ? err.message : String(err);
    }

    stats.finishedAt = new Date().toISOString();
    results.push(stats);

    if (client) {
      const runRecord: SourceRunInsert = {
        source: source.id,
        status: stats.status,
        started_at: stats.startedAt,
        finished_at: stats.finishedAt,
        fetched_count: stats.fetched,
        design_count: stats.designOpportunities,
        worldwide_count: stats.worldwide,
        in_range_count: stats.salaryInRange,
        new_count: stats.newCount,
        updated_count: stats.updatedCount,
        duplicate_count: stats.duplicateCount,
        error_message: stats.errorMessage ?? null,
      };
      try {
        await recordSourceRun(client, runRecord);
      } catch {
        // Recording the run's own history failing shouldn't fail the run itself.
      }
    }
  }

  const totals = results.reduce(
    (acc, r) => ({
      fetched: acc.fetched + r.fetched,
      designOpportunities: acc.designOpportunities + r.designOpportunities,
      worldwide: acc.worldwide + r.worldwide,
      salaryInRange: acc.salaryInRange + r.salaryInRange,
      newCount: acc.newCount + r.newCount,
      updatedCount: acc.updatedCount + r.updatedCount,
      duplicateCount: acc.duplicateCount + r.duplicateCount,
    }),
    { fetched: 0, designOpportunities: 0, worldwide: 0, salaryInRange: 0, newCount: 0, updatedCount: 0, duplicateCount: 0 }
  );

  return { results, totals };
}
