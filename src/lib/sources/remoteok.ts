/**
 * Remote OK — public JSON API (remoteok.com/api). robots.txt explicitly
 * `Allow: /` with only a 1s crawl-delay and no disallow on /api, and even
 * carries an explicit allowance block for AI/agent crawlers including
 * anthropic-ai/ClaudeBot. We still add our own timeout + descriptive UA
 * and a single request per run (the API returns everything in one page).
 */

import { htmlToPlainText } from "@/lib/opportunities/html-to-text";
import type { RawOpportunity } from "@/lib/opportunities/types";
import { fetchJson } from "./http";
import type { FetchContext, OpportunitySource } from "./types";

interface RemoteOkJob {
  id?: string;
  slug?: string;
  date?: string;
  company?: string;
  position?: string;
  tags?: string[];
  description?: string;
  location?: string;
  apply_url?: string;
  url?: string;
  salary_min?: number;
  salary_max?: number;
}

const ENDPOINT = "https://remoteok.com/api";

function isJobEntry(entry: RemoteOkJob): entry is Required<Pick<RemoteOkJob, "id" | "position" | "company">> &
  RemoteOkJob {
  // The API's first array element is a legal/metadata notice, not a job.
  return typeof entry.id === "string" && typeof entry.position === "string" && typeof entry.company === "string";
}

function toRaw(job: RemoteOkJob): RawOpportunity {
  const hasSalary = Boolean(job.salary_min || job.salary_max);
  const url = job.apply_url || job.url || `https://remoteok.com/remote-jobs/${job.id}`;

  return {
    sourceId: "remoteok",
    sourceItemId: job.id ?? job.slug ?? null,
    title: job.position ?? "",
    company: job.company ?? "",
    companyUrl: null,
    description: htmlToPlainText(job.description),
    url,
    sourceUrl: `https://remoteok.com/remote-jobs/${job.id}`,
    locationText: job.location || null,
    // RemoteOK rarely states employment type explicitly; scan tags + title.
    employmentTypeText: `${(job.tags ?? []).join(" ")} ${job.position ?? ""}`,
    salaryText: hasSalary ? `$${job.salary_min ?? "?"} - $${job.salary_max ?? "?"} /year` : null,
    // 0 is RemoteOK's "not provided" sentinel, not a real salary of $0.
    salaryMin: job.salary_min || null,
    salaryMax: job.salary_max || null,
    salaryCurrency: "USD",
    salaryPeriod: hasSalary ? "year" : null,
    tags: job.tags ?? [],
    postedAt: job.date || null,
    deadline: null,
    applicationUrl: job.apply_url || job.url || null,
    raw: job,
  };
}

export const remoteOkSource: OpportunitySource = {
  id: "remoteok",
  name: "Remote OK",
  type: "api",
  kind: "job_board",
  status: "active",
  notes: "Public JSON API; robots.txt explicitly allows it (1s crawl-delay respected).",

  async fetch(ctx: FetchContext): Promise<RawOpportunity[]> {
    const data = await fetchJson<RemoteOkJob[]>(ENDPOINT, { signal: ctx.signal });
    return data.filter(isJobEntry).map(toRaw);
  },
};
