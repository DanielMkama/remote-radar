/**
 * Ashby — generic factory for monitoring a single company's public job
 * board (Phase 2 Tier 3). Verified against real public boards
 * (api.ashbyhq.com/posting-api/job-board/flipper) — no auth required.
 * This is a distinct host from jobs.ashbyhq.com (the hosted board UI);
 * that host's robots.txt disallows crawling its own /api/ path, but that
 * rule doesn't apply here — api.ashbyhq.com is Ashby's dedicated public
 * job-board API host, the same pattern as Greenhouse's boards-api.* vs.
 * job-boards.* split.
 *
 * No company boards are registered by default (see
 * lib/sources/registry.ts) — call createAshbySource("<job-board-name>",
 * "<Company Name>") and add the result to the registry to start
 * monitoring a specific company. The job-board name is usually (but not
 * always) the same slug as the company's jobs.ashbyhq.com/<slug> URL —
 * verify with a manual fetch first, since a wrong slug returns a valid
 * empty `{"jobs":[]}` response rather than an error.
 */

import { htmlToPlainText } from "@/lib/opportunities/html-to-text";
import type { RawOpportunity } from "@/lib/opportunities/types";
import { fetchJson } from "../http";
import type { FetchContext, OpportunitySource } from "../types";

interface AshbyJobPosting {
  id: string;
  title: string;
  department?: string;
  team?: string;
  employmentType?: string;
  location?: string;
  isRemote?: boolean;
  publishedAt?: string;
  jobUrl: string;
  applyUrl?: string;
  descriptionHtml?: string;
  descriptionPlain?: string;
}

interface AshbyBoardResponse {
  jobs: AshbyJobPosting[];
}

export function createAshbySource(boardName: string, companyName: string): OpportunitySource {
  const endpoint = `https://api.ashbyhq.com/posting-api/job-board/${boardName}`;

  return {
    id: `ashby:${boardName}`,
    name: `Ashby (${companyName})`,
    type: "company_ats",
    kind: "company_ats",
    status: "active",
    notes: "Direct company careers page via Ashby's public job-board API.",

    async fetch(ctx: FetchContext): Promise<RawOpportunity[]> {
      const data = await fetchJson<AshbyBoardResponse>(endpoint, { signal: ctx.signal });

      return data.jobs.map((job): RawOpportunity => {
        const locationText = job.isRemote
          ? job.location
            ? `Remote — ${job.location}`
            : "Remote"
          : job.location ?? null;

        return {
          sourceId: `ashby:${boardName}`,
          sourceItemId: job.id,
          title: job.title,
          company: companyName,
          companyUrl: null,
          description: job.descriptionPlain ?? htmlToPlainText(job.descriptionHtml ?? ""),
          url: job.jobUrl,
          sourceUrl: job.jobUrl,
          locationText,
          employmentTypeText: job.employmentType ?? null,
          salaryText: null,
          salaryMin: null,
          salaryMax: null,
          salaryCurrency: "USD",
          salaryPeriod: null,
          tags: job.team ? [job.team] : job.department ? [job.department] : [],
          postedAt: job.publishedAt ?? null,
          deadline: null,
          applicationUrl: job.applyUrl || job.jobUrl,
          raw: job,
        };
      });
    },
  };
}
