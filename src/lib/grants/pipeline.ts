/**
 * The grants ingestion pipeline (mirrors src/lib/opportunities/pipeline.ts):
 *
 *   Source -> fetch() -> Raw -> Normalize -> Upsert -> Supabase
 *
 * No separate "validate" stage like jobs has (no design-relevance/unpaid
 * rules apply to grants) — every RawGrant a source returns is assumed
 * eligible for listing. One source failing is caught and reported
 * per-source; it never stops the others from running.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, GrantSourceRunInsert } from "@/lib/supabase/database.types";
import { normalizeGrant } from "./normalize";
import { recordGrantSourceRun, upsertGrant, type UpsertGrantOutcome } from "./repository";
import { getEnabledGrantSources } from "./sources/registry";
import type { GrantSource } from "./source-types";

export interface GrantSourceRunStats {
  sourceId: string;
  sourceName: string;
  status: "ok" | "error";
  errorMessage?: string;
  fetched: number;
  newCount: number;
  updatedCount: number;
  duplicateCount: number;
  startedAt: string;
  finishedAt: string;
}

export interface GrantIngestionSummary {
  results: GrantSourceRunStats[];
  totals: {
    fetched: number;
    newCount: number;
    updatedCount: number;
    duplicateCount: number;
  };
}

export interface RunGrantIngestionOptions {
  /** Supabase client to persist results to. Omit for a dry run (fetch + normalize only, nothing written). */
  client?: SupabaseClient<Database> | null;
  /** Defaults to every "active" source in the registry. */
  sources?: GrantSource[];
}

export async function runGrantIngestion(options: RunGrantIngestionOptions = {}): Promise<GrantIngestionSummary> {
  const sources = options.sources ?? getEnabledGrantSources();
  const client = options.client ?? null;

  const results: GrantSourceRunStats[] = [];

  for (const source of sources) {
    const startedAt = new Date().toISOString();
    const stats: GrantSourceRunStats = {
      sourceId: source.id,
      sourceName: source.name,
      status: "ok",
      fetched: 0,
      newCount: 0,
      updatedCount: 0,
      duplicateCount: 0,
      startedAt,
      finishedAt: startedAt,
    };

    try {
      const raw = await source.fetch();
      stats.fetched = raw.length;

      for (const rawGrant of raw) {
        const normalized = normalizeGrant(rawGrant, { sourceId: source.id, sourceUrl: rawGrant.url });

        if (client) {
          const outcome: UpsertGrantOutcome = await upsertGrant(client, {
            grant: normalized,
            sourceUrl: rawGrant.url,
            sourceItemId: rawGrant.sourceItemId ?? null,
          });
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
      const runRecord: GrantSourceRunInsert = {
        source: source.id,
        status: stats.status,
        started_at: stats.startedAt,
        finished_at: stats.finishedAt,
        fetched_count: stats.fetched,
        eligible_count: stats.fetched,
        new_count: stats.newCount,
        updated_count: stats.updatedCount,
        duplicate_count: stats.duplicateCount,
        error_message: stats.errorMessage ?? null,
      };
      try {
        await recordGrantSourceRun(client, runRecord);
      } catch {
        // Recording the run's own history failing shouldn't fail the run itself.
      }
    }
  }

  const totals = results.reduce(
    (acc, r) => ({
      fetched: acc.fetched + r.fetched,
      newCount: acc.newCount + r.newCount,
      updatedCount: acc.updatedCount + r.updatedCount,
      duplicateCount: acc.duplicateCount + r.duplicateCount,
    }),
    { fetched: 0, newCount: 0, updatedCount: 0, duplicateCount: 0 }
  );

  return { results, totals };
}
