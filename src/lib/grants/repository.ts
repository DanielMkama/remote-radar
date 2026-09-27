/**
 * Data-access layer for the `grants` / `grant_sources` / `grant_source_runs`
 * tables. Mirrors src/lib/opportunities/repository.ts: every function
 * takes an already-constructed Supabase client so this module works the
 * same from a Next server component/route handler (lib/supabase/server.ts)
 * or the standalone `npm run ingest:grants` CLI (lib/supabase/admin.ts).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { classifyGrantStatus } from "./classify-status";
import { buildGrantFingerprint, mergeGrantDuplicate } from "./dedupe";
import type {
  Database,
  GrantInsert,
  GrantRow,
  GrantSourceRunInsert,
} from "@/lib/supabase/database.types";
import type { Grant, GrantCategory, GrantStatus } from "./types";

type Client = SupabaseClient<Database>;

function rowToGrant(row: GrantRow): Grant {
  return {
    id: row.id,
    title: row.title,
    organization: row.organization,
    organizationUrl: row.organization_url,
    description: row.description,
    url: row.url,
    applicationUrl: row.application_url,
    source: row.source,
    category: row.category as GrantCategory,
    tags: row.tags,
    eligibilityText: row.eligibility_text,
    focusText: row.focus_text,
    amount: {
      text: row.amount_text,
      currency: row.amount_currency,
      min: row.amount_min,
      max: row.amount_max,
    },
    windowText: row.window_text,
    opensAt: row.opens_at,
    deadline: row.deadline,
    isRolling: row.is_rolling,
    status: row.status as GrantStatus,
    postedAt: row.posted_at,
    discoveredAt: row.discovered_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function grantToRow(g: Grant, fingerprint: string, sourceUrl: string, sourceId: string | null): GrantInsert {
  return {
    id: g.id,
    title: g.title,
    organization: g.organization,
    organization_url: g.organizationUrl,
    description: g.description,
    url: g.url,
    application_url: g.applicationUrl,
    source: g.source,
    source_url: sourceUrl,
    source_id: sourceId,
    category: g.category,
    tags: g.tags,
    eligibility_text: g.eligibilityText,
    focus_text: g.focusText,
    amount_text: g.amount.text,
    amount_currency: g.amount.currency,
    amount_min: g.amount.min,
    amount_max: g.amount.max,
    window_text: g.windowText,
    opens_at: g.opensAt,
    deadline: g.deadline,
    is_rolling: g.isRolling,
    posted_at: g.postedAt,
    discovered_at: g.discoveredAt,
    raw_source_data: null,
    status: g.status,
    duplicate_fingerprint: fingerprint,
  };
}

export type UpsertGrantOutcome = "new" | "updated" | "duplicate";

/**
 * Fields compared to decide "updated" vs. untouched "duplicate" on
 * re-ingestion (mirrors opportunities/repository.ts's hasMeaningfulChanges
 * — must include OUR derived fields like `status`, not just raw source
 * text, so a parser/classifier fix is picked up on the next ingestion run).
 */
function hasMeaningfulChanges(existing: Grant, incoming: Grant): boolean {
  return (
    existing.title !== incoming.title ||
    existing.description !== incoming.description ||
    existing.eligibilityText !== incoming.eligibilityText ||
    existing.focusText !== incoming.focusText ||
    existing.amount.text !== incoming.amount.text ||
    existing.windowText !== incoming.windowText ||
    existing.opensAt !== incoming.opensAt ||
    existing.deadline !== incoming.deadline ||
    existing.isRolling !== incoming.isRolling ||
    existing.status !== incoming.status ||
    existing.category !== incoming.category
  );
}

export interface UpsertGrantParams {
  grant: Grant;
  sourceUrl: string;
  sourceItemId: string | null;
}

export async function upsertGrant(client: Client, params: UpsertGrantParams): Promise<UpsertGrantOutcome> {
  const { grant: incoming, sourceUrl, sourceItemId } = params;
  const fingerprint = buildGrantFingerprint(incoming.organization, incoming.title);

  const { data: existingRow, error: selectError } = await client
    .from("grants")
    .select("*")
    .eq("duplicate_fingerprint", fingerprint)
    .maybeSingle();

  if (selectError) throw new Error(`grants select failed: ${selectError.message}`);

  let outcome: UpsertGrantOutcome;
  let finalGrantId: string;

  if (!existingRow) {
    const { error: insertError } = await client
      .from("grants")
      .insert(grantToRow(incoming, fingerprint, sourceUrl, sourceItemId));
    if (insertError) throw new Error(`grants insert failed: ${insertError.message}`);
    outcome = "new";
    finalGrantId = incoming.id;
  } else {
    const existing = rowToGrant(existingRow);
    const changed = hasMeaningfulChanges(existing, incoming);
    outcome = changed ? "updated" : "duplicate";
    finalGrantId = existing.id;

    if (changed) {
      const merged = mergeGrantDuplicate(existing, incoming);
      const { error: updateError } = await client
        .from("grants")
        .update(grantToRow(merged, fingerprint, sourceUrl, sourceItemId))
        .eq("id", existing.id);
      if (updateError) throw new Error(`grants update failed: ${updateError.message}`);
    }
  }

  const { error: sourceError } = await client.from("grant_sources").upsert(
    {
      grant_id: finalGrantId,
      source: incoming.source,
      source_id: sourceItemId,
      source_url: sourceUrl,
      discovered_at: incoming.discoveredAt,
    },
    { onConflict: "grant_id,source" }
  );
  if (sourceError) throw new Error(`grant_sources upsert failed: ${sourceError.message}`);

  return outcome;
}

export interface ListGrantsOptions {
  limit?: number;
}

/**
 * Fetches grants and recomputes `status` against the current time rather
 * than trusting the persisted column — same reasoning as
 * opportunities/adapter.ts's freshness recompute: without this, a grant
 * would stay "open" on the dashboard past its deadline until the next
 * `npm run ingest:grants` happened to touch that row again.
 */
export async function listGrants(client: Client, options: ListGrantsOptions = {}): Promise<Grant[]> {
  const { limit = 500 } = options;

  const { data, error } = await client
    .from("grants")
    .select("*, grant_sources(source)")
    .order("deadline", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) throw new Error(`grants list failed: ${error.message}`);

  return (data ?? []).map((row) => {
    const grant = rowToGrant(row);
    const recomputed = { ...grant, status: classifyGrantStatus(grant) };
    const sources = (row as unknown as { grant_sources?: Array<{ source: string }> }).grant_sources;
    return { ...recomputed, sourceCount: sources?.length ?? 1 };
  });
}

export async function getGrantById(client: Client, id: string): Promise<Grant | null> {
  const { data, error } = await client
    .from("grants")
    .select("*, grant_sources(source)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`grants getById failed: ${error.message}`);
  if (!data) return null;

  const grant = rowToGrant(data);
  const recomputed = { ...grant, status: classifyGrantStatus(grant) };
  const sources = (data as unknown as { grant_sources?: Array<{ source: string }> }).grant_sources;
  return { ...recomputed, sourceCount: sources?.length ?? 1 };
}

export async function recordGrantSourceRun(client: Client, run: GrantSourceRunInsert): Promise<void> {
  const { error } = await client.from("grant_source_runs").insert(run);
  if (error) throw new Error(`grant_source_runs insert failed: ${error.message}`);
}

export interface LatestGrantSourceRun {
  source: string;
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  status: "ok" | "error";
  fetchedCount: number;
  eligibleCount: number;
  newCount: number;
  updatedCount: number;
  duplicateCount: number;
  errorMessage: string | null;
}

/** Latest run per source, for a future admin page (mirrors listLatestSourceRuns). */
export async function listLatestGrantSourceRuns(client: Client): Promise<LatestGrantSourceRun[]> {
  const { data, error } = await client
    .from("grant_source_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(`grant_source_runs list failed: ${error.message}`);

  const bySource = new Map<string, LatestGrantSourceRun>();
  for (const run of data ?? []) {
    if (bySource.has(run.source)) continue;
    bySource.set(run.source, {
      source: run.source,
      lastAttemptAt: run.started_at,
      lastSuccessAt: run.status === "ok" ? run.started_at : null,
      status: run.status,
      fetchedCount: run.fetched_count,
      eligibleCount: run.eligible_count,
      newCount: run.new_count,
      updatedCount: run.updated_count,
      duplicateCount: run.duplicate_count,
      errorMessage: run.error_message,
    });
  }

  for (const run of data ?? []) {
    const entry = bySource.get(run.source);
    if (entry && entry.lastSuccessAt == null && run.status === "ok") {
      entry.lastSuccessAt = run.started_at;
    }
  }

  return Array.from(bySource.values());
}
