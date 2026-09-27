/**
 * Grant lifecycle status (mirrors src/lib/opportunities/classify/freshness.ts).
 *
 * Where a source gives a real deadline, that's authoritative: past it, the
 * grant is "closed"; before it (or before opensAt, if given), "upcoming"
 * or "open". Rolling programs (no fixed deadline, apply anytime) are their
 * own status rather than being forced into open/closed. Recomputed at
 * read time (see lib/grants/repository.ts) so a listing flips to "closed"
 * automatically as its deadline passes, without needing a fresh ingestion
 * run to notice — same reasoning as classifyFreshness.
 *
 * When NEITHER a deadline nor an explicit "rolling" signal is available
 * (a link-only source with no stated application window), this defaults
 * to "rolling" rather than a dead-end "unknown" status: nothing we know
 * of blocks applying right now, which is functionally what "rolling"
 * means here, and it keeps every card actionable instead of a shrug.
 */

import type { GrantStatus } from "./types";

export interface ClassifyGrantStatusInput {
  opensAt?: string | null;
  deadline?: string | null;
  /**
   * Kept for callers/future use (e.g. formatGrantDeadline shows "Rolling"
   * explicitly when a source said so) — no longer branched on here, since
   * both an explicit "rolling" signal and no signal at all now converge
   * on the same "rolling" result below.
   */
  isRolling?: boolean;
  now?: Date;
}

export function classifyGrantStatus({ opensAt, deadline, now = new Date() }: ClassifyGrantStatusInput): GrantStatus {
  const nowMs = now.getTime();

  if (deadline) {
    const deadlineDate = new Date(deadline);
    if (!Number.isNaN(deadlineDate.getTime()) && deadlineDate.getTime() < nowMs) {
      return "closed";
    }
  }

  if (opensAt) {
    const opensDate = new Date(opensAt);
    if (!Number.isNaN(opensDate.getTime()) && opensDate.getTime() > nowMs) {
      return "upcoming";
    }
  }

  if (deadline) {
    const deadlineDate = new Date(deadline);
    if (!Number.isNaN(deadlineDate.getTime())) {
      return "open";
    }
  }

  return "rolling";
}
