/**
 * Raw -> Grant. Mirrors src/lib/opportunities/normalize.ts's role: ties
 * together the window/amount parsers and status classifier into one
 * function, with no side effects (no DB, no network), so it's trivially
 * unit-testable and reusable both by the real ingestion pipeline and by
 * the in-memory fallback used when Supabase isn't configured yet (see
 * lib/grants/fallback.ts).
 */

import { classifyGrantStatus } from "./classify-status";
import { buildGrantFingerprint, buildGrantId } from "./dedupe";
import { parseGrantAmount } from "./parse-amount";
import { parseGrantWindow } from "./parse-window";
import { stripDashes } from "@/lib/text";
import type { RawGrant } from "./source-types";
import type { Grant } from "./types";

export interface NormalizeGrantContext {
  sourceId: string;
  sourceUrl: string;
  now?: Date;
}

export function normalizeGrant(raw: RawGrant, ctx: NormalizeGrantContext): Grant {
  const now = ctx.now ?? new Date();
  const discoveredAt = now.toISOString();

  const { opensAt, deadline, isRolling } = parseGrantWindow(raw.windowText);
  const parsedAmount = parseGrantAmount(raw.amountText);
  const applicationUrl = raw.applicationUrl ?? raw.url;

  const status = classifyGrantStatus({ opensAt, deadline, isRolling, now });

  // Fingerprinted/id'd from the RAW (pre-strip) text, not the display text
  // below: this id must stay stable across a display-only change like
  // dash-stripping, or every dash-containing title would mint a brand new
  // id on the next ingestion run and duplicate itself in Supabase instead
  // of updating in place (see lib/grants/repository.ts's upsert-by-
  // fingerprint logic).
  const fingerprint = buildGrantFingerprint(raw.organization, raw.title);

  return {
    id: buildGrantId(fingerprint),
    title: stripDashes(raw.title.trim()),
    organization: stripDashes(raw.organization.trim()),
    organizationUrl: raw.organizationUrl ?? null,
    description: stripDashes(raw.description?.trim() || ""),

    url: raw.url,
    applicationUrl,
    source: ctx.sourceId,

    category: raw.category,
    tags: (raw.tags ?? []).map(stripDashes),

    eligibilityText: raw.eligibilityText ? stripDashes(raw.eligibilityText) : null,
    focusText: raw.focusText ? stripDashes(raw.focusText) : null,

    amount: {
      text: raw.amountText ? stripDashes(raw.amountText) : null,
      currency: raw.amountCurrency ?? parsedAmount.currency,
      min: parsedAmount.min,
      max: parsedAmount.max,
    },

    windowText: raw.windowText ? stripDashes(raw.windowText) : null,
    opensAt,
    deadline,
    isRolling,
    status,

    postedAt: raw.postedAt ?? null,
    discoveredAt,
    createdAt: discoveredAt,
    updatedAt: discoveredAt,
  };
}
