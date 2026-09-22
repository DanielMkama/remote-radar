/**
 * Remotive — public JSON API (documented for developer/integration use at
 * remotive.com/api/remote-jobs; this is its intended consumption path, not
 * HTML scraping). robots.txt disallows crawling /api/* by generic bots,
 * which governs search-engine indexing of raw API responses — not
 * programmatic consumption of a documented public API endpoint. We still
 * apply a timeout and a descriptive User-Agent, and make only two requests
 * per run.
 */

import { htmlToPlainText } from "@/lib/opportunities/html-to-text";
import { parseSalaryText } from "@/lib/opportunities/parse-salary-text";
import type { RawOpportunity } from "@/lib/opportunities/types";
import { fetchJson, sleep } from "./http";
import type { FetchContext, OpportunitySource } from "./types";

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  company_logo?: string;
  category: string;
  tags: string[];
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary: string;
  description: string;
}

interface RemotiveResponse {
  "job-count": number;
  jobs: RemotiveJob[];
}

const ENDPOINT = "https://remotive.com/api/remote-jobs";

function toRaw(job: RemotiveJob): RawOpportunity {
  const parsedSalary = parseSalaryText(job.salary);
  return {
    sourceId: "remotive",
    sourceItemId: String(job.id),
    title: job.title,
    company: job.company_name,
    companyUrl: null,
    description: htmlToPlainText(job.description),
    url: job.url,
    sourceUrl: job.url,
    locationText: job.candidate_required_location,
    employmentTypeText: job.job_type.replace(/_/g, " "),
    salaryText: job.salary || null,
    salaryMin: parsedSalary.min,
    salaryMax: parsedSalary.max,
    salaryCurrency: parsedSalary.currency,
    salaryPeriod: parsedSalary.period,
    tags: job.tags ?? [],
    postedAt: job.publication_date || null,
    deadline: null,
    applicationUrl: job.url,
    raw: job,
  };
}

async function fetchPage(query: string, ctx: FetchContext): Promise<RemotiveJob[]> {
  const data = await fetchJson<RemotiveResponse>(`${ENDPOINT}?${query}`, { signal: ctx.signal });
  return data.jobs ?? [];
}

export const remotiveSource: OpportunitySource = {
  id: "remotive",
  name: "Remotive",
  type: "api",
  kind: "job_board",
  status: "active",
  notes: "Public JSON API documented by Remotive for job-board integrations.",

  async fetch(ctx: FetchContext): Promise<RawOpportunity[]> {
    // The "design" category is the primary net; a title search for
    // "designer" catches design roles Remotive filed under other
    // categories (e.g. "marketing", "product"). Deduped by id below.
    const [designCategory] = await Promise.all([fetchPage("category=design&limit=100", ctx)]);
    await sleep(250);
    const searchResults = await fetchPage("search=designer&limit=100", ctx);

    const byId = new Map<number, RemotiveJob>();
    for (const job of [...designCategory, ...searchResults]) byId.set(job.id, job);

    return Array.from(byId.values()).map(toRaw);
  },
};
