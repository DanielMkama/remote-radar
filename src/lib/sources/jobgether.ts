/**
 * Jobgether — public JSON API, explicitly documented for AI-agent
 * consumption (self-described at /astroapi/ai/jobs/docs: "Intended for AI
 * agents/assistants answering user job-search queries") and explicitly
 * allowed by robots.txt. Unlike Himalayas/RemoteOK, it supports real
 * server-side filtering, so we ask for design keywords and full/part-time
 * directly rather than paging through everything and filtering downstream.
 *
 * Uses /api/v1/jobs, not the /astroapi/ai/jobs.json alias this file's
 * exploratory checks first found — that alias is deprecated and sunsets
 * 2026-09-28 per the docs endpoint's `versioning.currentlyDeprecated`.
 *
 * Every listing's `url` is Jobgether's own listing page, not the
 * employer's original posting (an explicit note in the API docs) — same
 * shape as Remotive/Himalayas/RemoteOK, all of which redirect through the
 * board rather than linking the employer directly.
 */

import type { RawOpportunity } from "@/lib/opportunities/types";
import type { SalaryCurrency, SalaryPeriod } from "@/lib/jobs/types";
import { fetchJson } from "./http";
import type { FetchContext, OpportunitySource } from "./types";

interface JobgetherJob {
  id: string;
  title: string;
  company: string;
  url: string;
  location: string;
  remote: string;
  contractType: string;
  experience?: string;
  salaryRange?: string;
  jobFunctions: string[];
  postedAt: string;
}

interface JobgetherResponse {
  jobs: JobgetherJob[];
  pagination: { page: number; limit: number; hasMore: boolean };
}

const ENDPOINT = "https://jobgether.com/api/v1/jobs";
const KEYWORDS = ["designer", "design engineer", "creative technologist"];
const MAX_PAGES_PER_KEYWORD = 2;
const PAGE_LIMIT = 25;

const CONTRACT_TYPE_MAP: Record<string, string> = {
  "Full time": "full-time",
  "Part time": "part-time",
};

/** Parses "120000-135000 CAD" / "146000-146000 USD" into structured fields. Annual is the only period this API's examples ever show — documented assumption, same spirit as lib/jobs/salary.ts's hourly/yearly conversions. */
function parseSalaryRange(range: string | undefined): {
  min: number | null;
  max: number | null;
  currency: SalaryCurrency;
  period: SalaryPeriod | null;
} {
  if (!range) return { min: null, max: null, currency: "USD", period: null };

  const match = range.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)\s+([A-Z]{3})$/);
  if (!match) return { min: null, max: null, currency: "USD", period: null };

  return { min: Number(match[1]), max: Number(match[2]), currency: match[3], period: "year" };
}

function toRaw(job: JobgetherJob): RawOpportunity {
  const salary = parseSalaryRange(job.salaryRange);

  return {
    sourceId: "jobgether",
    sourceItemId: job.id,
    title: job.title,
    company: job.company.trim(),
    companyUrl: null,
    description: [job.jobFunctions.join(", "), job.experience].filter(Boolean).join(" — ") || job.title,
    url: job.url,
    sourceUrl: job.url,
    locationText: job.location || null,
    employmentTypeText: CONTRACT_TYPE_MAP[job.contractType] ?? job.contractType,
    salaryText: job.salaryRange ?? null,
    salaryMin: salary.min,
    salaryMax: salary.max,
    salaryCurrency: salary.currency,
    salaryPeriod: salary.period,
    tags: job.jobFunctions,
    postedAt: job.postedAt,
    deadline: null,
    applicationUrl: job.url,
    raw: job,
  };
}

export const jobgetherSource: OpportunitySource = {
  id: "jobgether",
  name: "Jobgether",
  type: "api",
  kind: "job_board",
  status: "active",
  notes: "Public JSON API with real keyword/contract-type filtering (no key required).",

  async fetch(ctx: FetchContext): Promise<RawOpportunity[]> {
    const seen = new Map<string, JobgetherJob>();

    for (const keyword of KEYWORDS) {
      for (let page = 1; page <= MAX_PAGES_PER_KEYWORD; page++) {
        const query = new URLSearchParams({
          keyword,
          contractType: "full-time,part-time",
          limit: String(PAGE_LIMIT),
          page: String(page),
          sort: "date",
        });

        const data = await fetchJson<JobgetherResponse>(`${ENDPOINT}?${query.toString()}`, {
          signal: ctx.signal,
        });

        for (const job of data.jobs) seen.set(job.id, job);

        if (!data.pagination.hasMore) break;
      }
    }

    return Array.from(seen.values()).map(toRaw);
  },
};
