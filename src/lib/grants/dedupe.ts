/**
 * Duplicate detection for grants (mirrors src/lib/opportunities/dedupe.ts).
 * Fingerprints on normalized organization + normalized title, since the
 * same program is sometimes listed on the funder's own site AND a grants
 * aggregator under slightly different link/URL text.
 */

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
