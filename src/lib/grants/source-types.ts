/**
 * Source architecture for grants (mirrors src/lib/sources/types.ts's
 * OpportunitySource). Every grants data source — right now just the
 * curated/manually-researched one — implements this interface and
 * registers itself in sources/registry.ts. Adding a real scraped/API
 * source later means writing one new file + one registry entry; the
 * pipeline (lib/grants/pipeline.ts) never needs to change.
 */

import type { GrantCategory } from "./types";

/** Raw shape a source hands to the pipeline, before normalization/classification. */
export interface RawGrant {
  title: string;
  organization: string;
  organizationUrl?: string | null;
  description?: string;

  url: string;
  /** Where to actually apply, if different from `url`. Falls back to `url`. */
  applicationUrl?: string | null;

  category: GrantCategory;
  tags?: string[];

  /** Original "who can apply / where" text. */
  eligibilityText?: string | null;
  /** Original "eligible disciplines / focus areas" text. */
  focusText?: string | null;

  /** Original funding-amount text, e.g. "Up to $20,000" or "$500-$3,000". */
  amountText?: string | null;
  amountCurrency?: string | null;

  /** Original application-window text, e.g. "Deadline: Oct 15, 2026" or "Rolling". */
  windowText?: string | null;

  postedAt?: string | null;

  /** The source's own id/slug for this entry, if it has one. */
  sourceItemId?: string | null;

  /** Untouched original payload, kept for debugging/future re-parsing. */
  raw?: unknown;
}

export type GrantSourceStatus = "active" | "planned" | "disabled";

export interface GrantSource {
  id: string;
  name: string;
  status: GrantSourceStatus;
  /** One-line note on what this source is / how it's maintained — shown on the admin page. */
  notes: string;
  fetch(): Promise<RawGrant[]>;
}
