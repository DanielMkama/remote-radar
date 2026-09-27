/**
 * Raw -> Grant. Mirrors src/lib/opportunities/normalize.ts's role: ties
 * together the window/amount parsers and status classifier into one
 * function, with no side effects (no DB, no network), so it's trivially
 * unit-testable and reusable both by the real ingestion pipeline and by
 * the in-memory fallback used when Supabase isn't configured yet (see
 * lib/grants/fallback.ts).
 */

import { classifyGrantStatus } from "./classify-status";
import { parseGrantAmount } from "./parse-amount";
import { parseGrantWindow } from "./parse-window";
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

  return {
    id: crypto.randomUUID(),
    title: raw.title.trim(),
    organization: raw.organization.trim(),
    organizationUrl: raw.organizationUrl ?? null,
    description: raw.description?.trim() || "",

    url: raw.url,
    applicationUrl,
    source: ctx.sourceId,

    category: raw.category,
    tags: raw.tags ?? [],

    eligibilityText: raw.eligibilityText ?? null,
    focusText: raw.focusText ?? null,

    amount: {
      text: raw.amountText ?? null,
      currency: raw.amountCurrency ?? parsedAmount.currency,
      min: parsedAmount.min,
      max: parsedAmount.max,
    },

    windowText: raw.windowText ?? null,
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
