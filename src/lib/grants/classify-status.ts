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
 */

import type { GrantStatus } from "./types";

export interface ClassifyGrantStatusInput {
  opensAt?: string | null;
  deadline?: string | null;
  isRolling?: boolean;
  now?: Date;
}

export function classifyGrantStatus({
  opensAt,
  deadline,
  isRolling,
  now = new Date(),
}: ClassifyGrantStatusInput): GrantStatus {
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

  if (isRolling) return "rolling";

  return "unknown";
}
