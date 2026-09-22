/**
 * Opportunity lifecycle / freshness (Phase 2 §22).
 *
 * We don't assume a listing stays open forever. Where a source gives a
 * deadline, that's authoritative. Otherwise we fall back to a documented,
 * conservative age cutoff: a listing not reconfirmed by a re-fetch within
 * MAX_ACTIVE_AGE_DAYS is presumed expired.
 *
 * Product rule: nothing should stay featured on the dashboard for more
 * than one month. jobMatchesFilters() (lib/jobs/filters.ts) unconditionally
 * drops any job whose isActive is false, and the Job adapter sets
 * isActive = (freshness === "active") — so once a listing crosses this
 * cutoff it disappears from the dashboard automatically, without needing
 * to already know it's closed.
 */

import type { FreshnessStatus } from "../types";

/** Nothing stays featured for more than one month without being reconfirmed by a re-fetch. */
export const MAX_ACTIVE_AGE_DAYS = 30;

export interface ClassifyFreshnessInput {
  deadline?: string | null;
  /** Set by the pipeline when a previously-seen listing is no longer returned by its source. */
  removedFromSource?: boolean;
  postedAt?: string | null;
  discoveredAt: string;
  now?: Date;
}

export function classifyFreshness({
  deadline,
  removedFromSource,
  postedAt,
  discoveredAt,
  now = new Date(),
}: ClassifyFreshnessInput): FreshnessStatus {
  if (removedFromSource) return "closed";

  if (deadline) {
    const deadlineDate = new Date(deadline);
    if (!Number.isNaN(deadlineDate.getTime())) {
      return deadlineDate.getTime() < now.getTime() ? "expired" : "active";
    }
  }

  const referenceDate = postedAt ?? discoveredAt;
  const parsed = new Date(referenceDate);
  if (Number.isNaN(parsed.getTime())) return "unknown";

  const ageDays = (now.getTime() - parsed.getTime()) / 86_400_000;
  return ageDays > MAX_ACTIVE_AGE_DAYS ? "expired" : "active";
}
