/**
 * Greenhouse — generic factory for monitoring a single company's public
 * job board (Phase 2 Tier 3: "design the system so we can later monitor
 * specific company career pages directly"). Verified against a real
 * public board (boards-api.greenhouse.io/v1/boards/airbnb/jobs) — no
 * auth required, and the API host's robots.txt only disallows /embed/.
 *
 * No company boards are registered by default (see lib/sources/registry.ts)
 * — call createGreenhouseSource("<board-token>") and add the result to the
 * registry to start monitoring a specific company.
 */

import { htmlToPlainText } from "@/lib/opportunities/html-to-text";
import type { RawOpportunity } from "@/lib/opportunities/types";
import { fetchJson } from "../http";
import type { FetchContext, OpportunitySource } from "../types";

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  updated_at: string;
  first_published: string | null;
  content: string;
  location: { name: string } | null;
  departments: Array<{ name: string }>;
  company_name?: string;
}

interface GreenhouseBoardResponse {
  jobs: GreenhouseJob[];
}

export function createGreenhouseSource(boardToken: string, companyName?: string): OpportunitySource {
  const endpoint = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;

  return {
    id: `greenhouse:${boardToken}`,
    name: `Greenhouse (${companyName ?? boardToken})`,
    type: "company_ats",
    kind: "company_ats",
    status: "active",
    notes: "Direct company careers page via Greenhouse's public board API.",

    async fetch(ctx: FetchContext): Promise<RawOpportunity[]> {
      const data = await fetchJson<GreenhouseBoardResponse>(endpoint, { signal: ctx.signal });

      return data.jobs.map((job): RawOpportunity => ({
        sourceId: `greenhouse:${boardToken}`,
        sourceItemId: String(job.id),
        title: job.title,
        company: job.company_name ?? companyName ?? boardToken,
        companyUrl: null,
        description: htmlToPlainText(job.content),
        url: job.absolute_url,
        sourceUrl: job.absolute_url,
        locationText: job.location?.name ?? null,
        employmentTypeText: null,
        salaryText: null,
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: "USD",
        salaryPeriod: null,
        tags: job.departments?.map((d) => d.name) ?? [],
        postedAt: job.first_published ?? job.updated_at ?? null,
        deadline: null,
        applicationUrl: job.absolute_url,
        raw: job,
      }));
    },
  };
}
