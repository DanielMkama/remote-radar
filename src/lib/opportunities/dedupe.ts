/**
 * Duplicate detection (Phase 2 §15).
 *
 * The same role often appears on the company's own careers page AND one
 * or more job boards. We fingerprint on normalized company + normalized
 * title, which is the signal most likely to line up across sources even
 * when the application URL differs (company site vs. board redirect).
 *
 * When two opportunities share a fingerprint, `mergeDuplicate` decides
 * which one stays canonical: a direct company ATS listing always wins
 * over a job board, and — all else equal — the most recently discovered
 * one wins (job boards update their own copy over time too).
 */

import type { NormalizedOpportunity, SourceKind } from "./types";

/** Strips punctuation/noise so trivially different strings still match. */
function normalizeForFingerprint(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/\(.*?\)/g, " ") // "(Remote)", "(f/m/d)" etc.
    .replace(/[^a-z0-9]+/g, " ")
    .replace(
      /\b(senior|sr|junior|jr|lead|principal|staff|mid|midlevel|remote|full time|part time|contract|freelance|the|a|an)\b/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

/** Builds the duplicate_fingerprint for an opportunity from company + title. */
export function buildDuplicateFingerprint(company: string, title: string): string {
  const normalizedCompany = normalizeForFingerprint(company);
  const normalizedTitle = normalizeForFingerprint(title);
  return `${normalizedCompany}::${normalizedTitle}`;
}

const SOURCE_KIND_PRIORITY: Record<SourceKind, number> = {
  company_ats: 2,
  job_board: 1,
  hiring_signal: 0,
};

/**
 * Given an existing canonical opportunity and a newly-discovered duplicate
 * of it, returns the merged record: prefers the higher-priority source
 * (company ATS > job board > hiring signal) as canonical, keeps the
 * union of tags, and keeps whichever description/deadline is present.
 * Never drops the incoming source's URL — the pipeline records it
 * separately in `opportunity_sources` regardless of this merge result.
 *
 * incoming always wins when it's a re-fetch of the SAME origin source as
 * the existing row (existing.source === incoming.source) — that's not a
 * competing duplicate, it's just the latest read of the same fact (the
 * employer edited the listing, or a parser fix changed how we read it),
 * and treating it as a tie via strict `>` priority comparison silently
 * discarded every field this function doesn't explicitly special-case
 * (title, locationText, salary, employmentType, freshness, ...) on every
 * same-source re-ingestion — found via a real ingestion run where a
 * source-adapter fix never showed up in Supabase despite the run
 * reporting the row as "updated".
 */
export function mergeDuplicate(
  existing: NormalizedOpportunity,
  incoming: NormalizedOpportunity,
  existingSourceKind: SourceKind,
  incomingSourceKind: SourceKind
): NormalizedOpportunity {
  const incomingWins =
    existing.source === incoming.source ||
    SOURCE_KIND_PRIORITY[incomingSourceKind] > SOURCE_KIND_PRIORITY[existingSourceKind];

  const primary = incomingWins ? incoming : existing;
  const secondary = incomingWins ? existing : incoming;

  return {
    ...primary,
    id: existing.id, // the DB row identity never changes on merge
    tags: Array.from(new Set([...primary.tags, ...secondary.tags])),
    description: primary.description || secondary.description,
    deadline: primary.deadline ?? secondary.deadline,
    postedAt: primary.postedAt ?? secondary.postedAt,
    // A duplicate confirmed across sources is itself a positive signal.
    verificationStatus: incomingWins ? incoming.verificationStatus : existing.verificationStatus,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
}
