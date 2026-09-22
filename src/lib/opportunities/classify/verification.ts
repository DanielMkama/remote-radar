/**
 * Source-confidence classification (Phase 2 §16). Deliberately simple:
 * we never claim a listing is confirmed just because it looks plausible.
 */

import type { SourceKind, VerificationStatus } from "../types";

export function classifyVerification(sourceKind: SourceKind, hasApplicationUrl: boolean): VerificationStatus {
  if (sourceKind === "company_ats") return "verified";
  if (sourceKind === "job_board" && hasApplicationUrl) return "likely";
  return "unverified";
}
