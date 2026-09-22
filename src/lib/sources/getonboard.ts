/**
 * Get on Board (getonbrd.com) — PLANNED, not implemented.
 *
 * Checked before writing this file (Phase 2 §6):
 *  - robots.txt places no disallow on job pages, but no public JSON API
 *    or RSS/sitemap feed for listings was found (checked /api/v1/postings,
 *    /search/jobs.json, /jobs.rss — all 404/406). Only full HTML listing
 *    pages are available.
 *  - Per the "prefer APIs, RSS, structured endpoints" rule, ingesting
 *    this source would mean parsing full HTML pages, which is more
 *    fragile and more scraping-like than every other Phase 2 source.
 *
 * Left as an architecture placeholder pending either an official API or a
 * deliberate, rate-limited HTML adapter (not implemented here).
 */

import type { RawOpportunity } from "@/lib/opportunities/types";
import type { OpportunitySource } from "./types";

export const getOnBoardSource: OpportunitySource = {
  id: "getonboard",
  name: "Get on Board",
  type: "api",
  kind: "job_board",
  status: "planned",
  notes: "No public API or feed found (checked common endpoints); only full HTML pages are available.",

  async fetch(): Promise<RawOpportunity[]> {
    return [];
  },
};
