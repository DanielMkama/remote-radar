/**
 * Hiring Cafe (hiringcafe.com) — PLANNED, not implemented.
 *
 * Checked before writing this file (Phase 2 §6):
 *  - robots.txt (https://hiringcafe.com/robots.txt) disallows the pages
 *    that would actually be needed for ingestion: `/viewjob/` (individual
 *    listings), `/board/`, `/req/`, and any URL with a `?searchState=` or
 *    `?page=` query param — which is how its job search results are
 *    paginated/filtered. Only static marketing pages and a handful of
 *    sitemaps are allowed.
 *  - No public JSON API was found; a direct fetch of the homepage returns
 *    403 (bot-protected).
 *  - The sitemaps it publishes (jobs-sitemap.xml etc.) could in principle
 *    be read without touching a disallowed path, but sitemap URLs point at
 *    `/job/<slug>` pages, and turning those into structured listings would
 *    still mean scraping full HTML pages rather than a structured feed —
 *    same category of concern as Get on Board (see getonboard.ts).
 *
 * Left as an architecture placeholder pending either an official API or a
 * deliberate, rate-limited sitemap+HTML adapter (not implemented here).
 */

import type { RawOpportunity } from "@/lib/opportunities/types";
import type { OpportunitySource } from "./types";

export const hiringCafeSource: OpportunitySource = {
  id: "hiringcafe",
  name: "Hiring Cafe",
  type: "api",
  kind: "job_board",
  status: "planned",
  notes:
    "No public API found; robots.txt disallows individual job/listing pages and paginated search results. Revisit if an official feed becomes available.",

  async fetch(): Promise<RawOpportunity[]> {
    return [];
  },
};
