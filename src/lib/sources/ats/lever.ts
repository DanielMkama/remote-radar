/**
 * Lever — generic factory for monitoring a single company's public job
 * board (Phase 2 Tier 3). Verified against real public boards
 * (api.lever.co/v0/postings/palantir?mode=json) — no auth required, and
 * api.lever.co's robots.txt explicitly `Allow: /` with a 1s crawl-delay.
 *
 * No company boards are registered by default (see
 * lib/sources/registry.ts) — call createLeverSource("<company-slug>",
 * "<Company Name>") and add the result to the registry to start
 * monitoring a specific company. Lever's posting data doesn't include the
 * company's display name, hence the second argument.
 */

import type { RawOpportunity } from "@/lib/opportunities/types";
import { fetchJson } from "../http";
import type { FetchContext, OpportunitySource } from "../types";

interface LeverPosting {
  id: string;
  text: string;
  categories: {
    location?: string;
    commitment?: string;
    team?: string;
  };
  createdAt: number;
  hostedUrl: string;
  applyUrl: string;
  descriptionPlain: string;
}

export function createLeverSource(companySlug: string, companyName: string): OpportunitySource {
  const endpoint = `https://api.lever.co/v0/postings/${companySlug}?mode=json`;

  return {
    id: `lever:${companySlug}`,
    name: `Lever (${companyName})`,
    type: "company_ats",
    kind: "company_ats",
    status: "active",
    notes: "Direct company careers page via Lever's public postings API.",

    async fetch(ctx: FetchContext): Promise<RawOpportunity[]> {
      const postings = await fetchJson<LeverPosting[]>(endpoint, { signal: ctx.signal });

      return postings.map((job): RawOpportunity => ({
        sourceId: `lever:${companySlug}`,
        sourceItemId: job.id,
        title: job.text,
        company: companyName,
        companyUrl: null,
        description: job.descriptionPlain,
        url: job.hostedUrl,
        sourceUrl: job.hostedUrl,
        locationText: job.categories.location ?? null,
        employmentTypeText: job.categories.commitment ?? null,
        salaryText: null,
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: "USD",
        salaryPeriod: null,
        tags: job.categories.team ? [job.categories.team] : [],
        postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
        deadline: null,
        applicationUrl: job.applyUrl || job.hostedUrl,
        raw: job,
      }));
    },
  };
}
