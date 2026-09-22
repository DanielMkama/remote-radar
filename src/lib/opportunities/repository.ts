/**
 * Data-access layer for the `opportunities` / `opportunity_sources` /
 * `source_runs` tables. Every function takes an already-constructed
 * Supabase client (dependency injection) so this module works the same
 * whether called from a Next server component/route handler (using
 * lib/supabase/server.ts's guarded client) or the standalone `npm run
 * ingest` CLI (using lib/supabase/admin.ts's unguarded one) — see that
 * file for why there are two.
 *
 * Read functions return `Job[]` (not `NormalizedOpportunity[]`) so
 * callers — the dashboard, the API routes — can hand results straight to
 * the existing Phase 1 filtering/sorting code in lib/jobs/filters.ts
 * without any translation step.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { opportunityToJob } from "./adapter";
import { mergeDuplicate } from "./dedupe";
import type {
  Database,
  OpportunityInsert,
  OpportunityRow,
  SourceRunInsert,
} from "@/lib/supabase/database.types";
import type { Job } from "@/lib/jobs/types";
import type { NormalizedOpportunity, SourceKind } from "./types";

type Client = SupabaseClient<Database>;

function rowToNormalized(row: OpportunityRow): NormalizedOpportunity {
  return {
    id: row.id,
    opportunityType: row.opportunity_type as NormalizedOpportunity["opportunityType"],
    title: row.title,
    company: row.company,
    companyUrl: row.company_url,
    description: row.description,
    url: row.url,
    source: row.source,
    sourceUrl: row.source_url,
    sourceId: row.source_id,
    employmentType: row.employment_type as NormalizedOpportunity["employmentType"],
    employmentTypes: row.employment_types as NormalizedOpportunity["employmentTypes"],
    locationText: row.location_text,
    locationStatus: row.location_status as NormalizedOpportunity["locationStatus"],
    salaryText: row.salary_text,
    salaryCurrency: row.salary_currency ?? "USD",
    salaryPeriod: row.salary_period as NormalizedOpportunity["salaryPeriod"],
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    normalizedMonthlyMin: row.normalized_monthly_min,
    normalizedMonthlyMax: row.normalized_monthly_max,
    salaryStatus: row.salary_status as NormalizedOpportunity["salaryStatus"],
    category: row.category as NormalizedOpportunity["category"],
    tags: row.tags,
    postedAt: row.posted_at,
    discoveredAt: row.discovered_at,
    deadline: row.deadline,
    remoteStatus: row.location_status as NormalizedOpportunity["locationStatus"],
    applicationUrl: row.application_url,
    rawSourceData: row.raw_source_data,
    verificationStatus: row.verification_status as NormalizedOpportunity["verificationStatus"],
    freshness: row.freshness as NormalizedOpportunity["freshness"],
    duplicateFingerprint: row.duplicate_fingerprint,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizedToRow(o: NormalizedOpportunity): OpportunityInsert {
  return {
    id: o.id,
    opportunity_type: o.opportunityType,
    title: o.title,
    company: o.company,
    company_url: o.companyUrl,
    description: o.description,
    url: o.url,
    source: o.source,
    source_url: o.sourceUrl,
    source_id: o.sourceId,
    employment_type: o.employmentType,
    employment_types: o.employmentTypes,
    location_text: o.locationText,
    location_status: o.locationStatus,
    salary_text: o.salaryText,
    salary_currency: o.salaryCurrency,
    salary_period: o.salaryPeriod,
    salary_min: o.salaryMin,
    salary_max: o.salaryMax,
    normalized_monthly_min: o.normalizedMonthlyMin,
    normalized_monthly_max: o.normalizedMonthlyMax,
    salary_status: o.salaryStatus,
    category: o.category,
    tags: o.tags,
    posted_at: o.postedAt,
    discovered_at: o.discoveredAt,
    deadline: o.deadline,
    application_url: o.applicationUrl,
    raw_source_data: o.rawSourceData,
    verification_status: o.verificationStatus,
    freshness: o.freshness,
    duplicate_fingerprint: o.duplicateFingerprint,
  };
}

/** Fields compared to decide "updated" vs. untouched "duplicate" on re-ingestion. */
function hasMeaningfulChanges(existing: NormalizedOpportunity, incoming: NormalizedOpportunity): boolean {
  return (
    existing.title !== incoming.title ||
    existing.description !== incoming.description ||
    existing.salaryMin !== incoming.salaryMin ||
    existing.salaryMax !== incoming.salaryMax ||
    existing.locationText !== incoming.locationText ||
    existing.deadline !== incoming.deadline ||
    existing.employmentType !== incoming.employmentType ||
    existing.freshness !== incoming.freshness
  );
}

export type UpsertOutcome = "new" | "updated" | "duplicate";

/**
 * Upserts one normalized opportunity by its duplicate_fingerprint
 * (Phase 2 §15): inserts if unseen, otherwise merges into the existing
 * canonical row (preferring a direct company-ATS source over a job
 * board) and records this discovery in `opportunity_sources` either way.
 */
export async function upsertOpportunity(
  client: Client,
  incoming: NormalizedOpportunity,
  incomingSourceKind: SourceKind,
  sourceKindOf: (sourceId: string) => SourceKind
): Promise<UpsertOutcome> {
  const { data: existingRow, error: selectError } = await client
    .from("opportunities")
    .select("*")
    .eq("duplicate_fingerprint", incoming.duplicateFingerprint)
    .maybeSingle();

  if (selectError) throw new Error(`opportunities select failed: ${selectError.message}`);

  let outcome: UpsertOutcome;
  let finalOpportunityId: string;

  if (!existingRow) {
    const { error: insertError } = await client.from("opportunities").insert(normalizedToRow(incoming));
    if (insertError) throw new Error(`opportunities insert failed: ${insertError.message}`);
    outcome = "new";
    finalOpportunityId = incoming.id;
  } else {
    const existing = rowToNormalized(existingRow);
    const changed = hasMeaningfulChanges(existing, incoming);
    outcome = changed ? "updated" : "duplicate";
    finalOpportunityId = existing.id;

    if (changed) {
      const merged = mergeDuplicate(existing, incoming, sourceKindOf(existing.source), incomingSourceKind);
      const { error: updateError } = await client
        .from("opportunities")
        .update(normalizedToRow(merged))
        .eq("id", existing.id);
      if (updateError) throw new Error(`opportunities update failed: ${updateError.message}`);
    }
  }

  const { error: sourceError } = await client.from("opportunity_sources").upsert(
    {
      opportunity_id: finalOpportunityId,
      source: incoming.source,
      source_id: incoming.sourceId,
      source_url: incoming.sourceUrl,
      discovered_at: incoming.discoveredAt,
    },
    { onConflict: "opportunity_id,source" }
  );
  if (sourceError) throw new Error(`opportunity_sources upsert failed: ${sourceError.message}`);

  return outcome;
}

export interface ListOpportunitiesOptions {
  limit?: number;
}

/**
 * Fetches opportunities and adapts them to `Job[]` for the existing
 * Phase 1 filter/sort/UI code. Deliberately does no filtering itself
 * (beyond a row limit + newest-first ordering) — lib/jobs/filters.ts
 * already does that, and duplicating filter logic in SQL would violate
 * "don't create duplicate implementations."
 */
export async function listOpportunities(client: Client, options: ListOpportunitiesOptions = {}): Promise<Job[]> {
  const { limit = 500 } = options;

  const { data, error } = await client
    .from("opportunities")
    .select("*, opportunity_sources(source)")
    .order("posted_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) throw new Error(`opportunities list failed: ${error.message}`);

  return (data ?? []).map((row) => {
    const job = opportunityToJob(rowToNormalized(row));
    const sources = (row as unknown as { opportunity_sources?: Array<{ source: string }> }).opportunity_sources;
    return { ...job, sourceCount: sources?.length ?? 1 };
  });
}

export async function getOpportunityById(client: Client, id: string): Promise<Job | null> {
  const { data, error } = await client
    .from("opportunities")
    .select("*, opportunity_sources(source)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`opportunities getById failed: ${error.message}`);
  if (!data) return null;

  const job = opportunityToJob(rowToNormalized(data));
  const sources = (data as unknown as { opportunity_sources?: Array<{ source: string }> }).opportunity_sources;
  return { ...job, sourceCount: sources?.length ?? 1 };
}

export async function recordSourceRun(client: Client, run: SourceRunInsert): Promise<void> {
  const { error } = await client.from("source_runs").insert(run);
  if (error) throw new Error(`source_runs insert failed: ${error.message}`);
}

export interface LatestSourceRun {
  source: string;
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  status: "ok" | "error";
  fetchedCount: number;
  designCount: number;
  newCount: number;
  updatedCount: number;
  duplicateCount: number;
  errorMessage: string | null;
}

/** Latest run per source, for the admin page. */
export async function listLatestSourceRuns(client: Client): Promise<LatestSourceRun[]> {
  const { data, error } = await client
    .from("source_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(`source_runs list failed: ${error.message}`);

  const bySource = new Map<string, LatestSourceRun>();
  for (const run of data ?? []) {
    if (bySource.has(run.source)) continue; // first (most recent) wins
    bySource.set(run.source, {
      source: run.source,
      lastAttemptAt: run.started_at,
      lastSuccessAt: run.status === "ok" ? run.started_at : null,
      status: run.status,
      fetchedCount: run.fetched_count,
      designCount: run.design_count,
      newCount: run.new_count,
      updatedCount: run.updated_count,
      duplicateCount: run.duplicate_count,
      errorMessage: run.error_message,
    });
  }

  // Backfill lastSuccessAt from an earlier successful run if the most
  // recent attempt for that source failed.
  for (const run of data ?? []) {
    const entry = bySource.get(run.source);
    if (entry && entry.lastSuccessAt == null && run.status === "ok") {
      entry.lastSuccessAt = run.started_at;
    }
  }

  return Array.from(bySource.values());
}
