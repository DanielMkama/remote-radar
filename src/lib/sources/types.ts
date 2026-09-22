/**
 * Source architecture (Phase 2 §4). Every job board / ATS integration
 * implements this interface and registers itself in registry.ts. Adding a
 * new source later means writing one new file + one registry entry — the
 * pipeline (lib/opportunities/pipeline.ts) never needs to change.
 */

import type { RawOpportunity, SourceKind, SourceStatus, SourceType } from "@/lib/opportunities/types";

export interface FetchContext {
  /** Abort/timeout signal every source implementation must respect. */
  signal: AbortSignal;
}

export interface OpportunitySource {
  id: string;
  name: string;
  type: SourceType;
  /** How much we trust listings from this source, absent other signals — see classify/verification.ts. */
  kind: SourceKind;
  /**
   * "active" sources are actually fetched by the pipeline. "planned"
   * sources exist in the registry (so the admin page and docs can show
   * them) but are not fetched — see Phase 2 §6: don't pretend a source
   * works when it can't be reliably/legitimately accessed yet.
   */
  status: SourceStatus;
  /** One-line note on *why* a source is "planned" or how it's accessed — shown on the admin page. */
  notes: string;

  fetch(ctx: FetchContext): Promise<RawOpportunity[]>;
}

/** Minimum time between requests to the same source, in ms — a simple courtesy rate limit. */
export const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;
