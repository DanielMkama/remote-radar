/**
 * Duplicate detection for grants (mirrors src/lib/opportunities/dedupe.ts).
 * Fingerprints on normalized organization + normalized title, since the
 * same program is sometimes listed on the funder's own site AND a grants
 * aggregator under slightly different link/URL text.
 */

import { createHash } from "node:crypto";
import type { Grant } from "./types";

function normalizeForFingerprint(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/\(.*?\)/g, " ") // parenthetical asides
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|a|an|grant|grants|program|programme|fund|foundation|fellowship)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildGrantFingerprint(organization: string, title: string): string {
  return `${normalizeForFingerprint(organization)}::${normalizeForFingerprint(title)}`;
}

/**
 * Deterministic, UUID-shaped id derived from a grant's fingerprint.
 *
 * MUST be deterministic, not crypto.randomUUID(): the curated fallback
 * data (lib/grants/fallback.ts) is re-normalized from scratch on every
 * cold server process — the Next.js build process that statically
 * generates /grants/[id] pages, and each separate request that renders
 * the /grants list, are different process instances with no shared
 * memory. A random id would (and did) mean the link baked into the list
 * page pointed at an id the detail page's own re-normalization never
 * produces, so every grant 404'd. Hashing the same fingerprint used for
 * dedup guarantees the same input always yields the same id, and also
 * means two sources describing the "same" grant naturally converge on one
 * id even before they've been merged into one DB row.
 */
export function buildGrantId(fingerprint: string): string {
  const hex = createHash("sha256").update(fingerprint).digest("hex");
  const version4 = "4" + hex.slice(13, 16);
  const variantNibble = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    version4,
    variantNibble + hex.slice(17, 20),
    hex.slice(20, 32),
  ].join("-");
}

/**
 * Given an existing canonical grant and a newly-discovered duplicate,
 * returns the merged record. Unlike jobs (where source "kind" ranks
 * company-ATS over job boards), every grant source is currently
 * equally-trusted curated research, so the simpler rule applies: the
 * incoming (freshest re-ingested) record wins for anything it actually
 * states, falling back to the existing value only where the incoming
 * record is missing that field — so a later, more complete research pass
 * can fill in gaps without clobbering them with blanks.
 */
export function mergeGrantDuplicate(existing: Grant, incoming: Grant): Grant {
  return {
    ...incoming,
    id: existing.id,
    tags: Array.from(new Set([...incoming.tags, ...existing.tags])),
    description: incoming.description || existing.description,
    eligibilityText: incoming.eligibilityText ?? existing.eligibilityText,
    focusText: incoming.focusText ?? existing.focusText,
    amount: {
      text: incoming.amount.text ?? existing.amount.text,
      currency: incoming.amount.currency ?? existing.amount.currency,
      min: incoming.amount.min ?? existing.amount.min,
      max: incoming.amount.max ?? existing.amount.max,
    },
    windowText: incoming.windowText ?? existing.windowText,
    opensAt: incoming.opensAt ?? existing.opensAt,
    deadline: incoming.deadline ?? existing.deadline,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
}
