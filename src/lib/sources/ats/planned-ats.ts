/**
 * Tier 3 ATS platforms with a registry entry but no working adapter yet
 * (Phase 2 §5: "Create the architecture but do not necessarily implement
 * every adapter yet"). Each of these does have a public per-company API
 * in principle (similar shape to Greenhouse/Lever — a board/company
 * identifier in the URL, no auth for public boards), but implementing
 * and verifying five more adapters without a concrete company to test
 * against isn't worth doing speculatively. Follow the createGreenhouseSource
 * / createLeverSource pattern in this directory when one is needed.
 */

import type { RawOpportunity } from "@/lib/opportunities/types";
import type { OpportunitySource } from "../types";

function plannedAtsSource(id: string, name: string, note: string): OpportunitySource {
  return {
    id,
    name,
    type: "company_ats",
    kind: "company_ats",
    status: "planned",
    notes: note,
    async fetch(): Promise<RawOpportunity[]> {
      return [];
    },
  };
}

export const PLANNED_ATS_SOURCES: OpportunitySource[] = [
  plannedAtsSource("ashby", "Ashby", "Has a public API per-company; no adapter implemented yet."),
  plannedAtsSource("workable", "Workable", "Has a public API per-company; no adapter implemented yet."),
  plannedAtsSource(
    "smartrecruiters",
    "SmartRecruiters",
    "Has a public API per-company; no adapter implemented yet."
  ),
  plannedAtsSource("teamtailor", "Teamtailor", "Has a public API per-company; no adapter implemented yet."),
  plannedAtsSource("recruitee", "Recruitee", "Has a public API per-company; no adapter implemented yet."),
];
