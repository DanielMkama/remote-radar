/**
 * Working Nomads — public JSON API (api/exposed_jobs/), no key required.
 * robots.txt is fully permissive (`Disallow:` empty = allow all). Like
 * Himalayas/RemoteOK, query params don't filter server-side (verified
 * empirically: ?category=design returns the identical payload), so this
 * pages the general feed and relies on our own relevance filter
 * downstream. No salary or explicit employment-type field in the
 * response — those get classified from title/description like any
 * source that doesn't provide them structured.
 */

import { htmlToPlainText } from "@/lib/opportunities/html-to-text";
import type { RawOpportunity } from "@/lib/opportunities/types";
import { fetchJson } from "./http";
import type { FetchContext, OpportunitySource } from "./types";

interface WorkingNomadsJob {
  url: string;
  title: string;
  description: string;
  company_name: string;
  location: string;
  tags: string;
  pub_date: string;
}

const ENDPOINT = "https://www.workingnomads.com/api/exposed_jobs/";

function toRaw(job: WorkingNomadsJob): RawOpportunity {
  const tags = job.tags
    ? job.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  return {
    sourceId: "workingnomads",
    sourceItemId: job.url,
    title: job.title,
    company: job.company_name,
    companyUrl: null,
    description: htmlToPlainText(job.description),
    url: job.url,
    sourceUrl: job.url,
    locationText: job.location || null,
    employmentTypeText: null,
    salaryText: null,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: "USD",
    salaryPeriod: null,
    tags,
    postedAt: job.pub_date ? new Date(job.pub_date).toISOString() : null,
    deadline: null,
    applicationUrl: job.url,
    raw: job,
  };
}

export const workingNomadsSource: OpportunitySource = {
  id: "workingnomads",
  name: "Working Nomads",
  type: "api",
  kind: "job_board",
  status: "active",
  notes: "Public JSON API (no key required). No server-side category filtering.",

  async fetch(ctx: FetchContext): Promise<RawOpportunity[]> {
    const jobs = await fetchJson<WorkingNomadsJob[]>(ENDPOINT, { signal: ctx.signal });
    return jobs.map(toRaw);
  },
};
