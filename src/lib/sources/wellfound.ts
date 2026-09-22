/**
 * Wellfound (formerly AngelList Talent) — PLANNED, not implemented.
 *
 * Checked before writing this file (Phase 2 §6):
 *  - No public job-listing API. AngelList's old public API was retired.
 *  - robots.txt disallows crawling `/_jobs/`, the internal endpoint the
 *    site's own SPA uses to load listings — scraping that would ignore an
 *    explicit robots.txt rule.
 *  - The public job pages require sign-in for full listing details in
 *    many cases and are behind bot-detection, so reliable, legitimate
 *    access isn't currently available.
 *
 * Left as an architecture placeholder: flipping `status` to "active" once
 * a legitimate access path exists (an official API, a partnership feed,
 * etc.) is the only change needed here.
 */

import type { RawOpportunity } from "@/lib/opportunities/types";
import type { OpportunitySource } from "./types";

export const wellfoundSource: OpportunitySource = {
  id: "wellfound",
  name: "Wellfound",
  type: "api",
  kind: "job_board",
  status: "planned",
  notes:
    "No public API; robots.txt disallows the internal listing endpoint (/_jobs/) and full listings require sign-in. Revisit if an official feed becomes available.",

  async fetch(): Promise<RawOpportunity[]> {
    return [];
  },
};
