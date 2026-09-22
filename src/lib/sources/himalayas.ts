/**
 * Himalayas — public JSON API (himalayas.app/jobs/api), self-documented
 * via a changelog embedded in its own response and not disallowed by
 * robots.txt. It doesn't support server-side search/category filtering
 * (query params other than cursor/offset/limit are silently ignored — an
 * empirical check, not a documented behavior), so we page through the
 * most recent listings and apply our own relevance filter downstream.
 * That means each run covers "recently posted" listings rather than the
 * full historical archive — reasonable for a periodic ingestion job.
 */

import { htmlToPlainText } from "@/lib/opportunities/html-to-text";
import type { RawOpportunity } from "@/lib/opportunities/types";
import type { SalaryPeriod } from "@/lib/jobs/types";
import { fetchJson, sleep } from "./http";
import type { FetchContext, OpportunitySource } from "./types";

interface HimalayasJob {
  title: string;
  excerpt: string;
  companyName: string;
  companySlug: string;
  companyLogo?: string;
  employmentType: string | null;
  minSalary: number | null;
  maxSalary: number | null;
  salaryPeriod: string | null;
  currency: string | null;
  locationRestrictions: string[] | null;
  categories: string[];
  description: string;
  pubDate: number;
  expiryDate: number | null;
  applicationLink: string;
  guid: string;
}

interface HimalayasResponse {
  jobs: HimalayasJob[];
  nextCursor: string | null;
}

const ENDPOINT = "https://himalayas.app/jobs/api";
const PAGES_PER_RUN = 3;
const PAGE_SIZE = 100;

const PERIOD_MAP: Record<string, SalaryPeriod> = {
  hourly: "hour",
  monthly: "month",
  annual: "year",
  yearly: "year",
};

function toRaw(job: HimalayasJob): RawOpportunity {
  const restrictions = job.locationRestrictions ?? [];
  const locationText =
    restrictions.length === 0 ? "Worldwide" : `Restricted to: ${restrictions.join(", ")}`;

  return {
    sourceId: "himalayas",
    sourceItemId: job.guid,
    title: job.title,
    company: job.companyName,
    companyUrl: job.companySlug ? `https://himalayas.app/companies/${job.companySlug}` : null,
    description: htmlToPlainText(job.description || job.excerpt),
    url: job.applicationLink,
    sourceUrl: job.guid,
    locationText,
    employmentTypeText: job.employmentType,
    salaryText:
      job.minSalary != null || job.maxSalary != null
        ? `${job.minSalary ?? "?"}–${job.maxSalary ?? "?"} ${job.currency ?? ""} (${job.salaryPeriod ?? "unknown period"})`
        : null,
    salaryMin: job.minSalary,
    salaryMax: job.maxSalary,
    salaryCurrency: job.currency,
    salaryPeriod: job.salaryPeriod ? PERIOD_MAP[job.salaryPeriod.toLowerCase()] ?? null : null,
    tags: job.categories ?? [],
    postedAt: job.pubDate ? new Date(job.pubDate * 1000).toISOString() : null,
    deadline: job.expiryDate ? new Date(job.expiryDate * 1000).toISOString() : null,
    applicationUrl: job.applicationLink,
    raw: job,
  };
}

export const himalayasSource: OpportunitySource = {
  id: "himalayas",
  name: "Himalayas",
  type: "api",
  kind: "job_board",
  status: "active",
  notes: "Public JSON API (no key required). Pages the most recent listings only.",

  async fetch(ctx: FetchContext): Promise<RawOpportunity[]> {
    const jobs: HimalayasJob[] = [];
    let cursor: string | null = null;

    for (let page = 0; page < PAGES_PER_RUN; page++) {
      const query = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (cursor) query.set("cursor", cursor);

      const data: HimalayasResponse = await fetchJson<HimalayasResponse>(
        `${ENDPOINT}?${query.toString()}`,
        { signal: ctx.signal }
      );
      jobs.push(...data.jobs);

      cursor = data.nextCursor;
      if (!cursor) break;
      await sleep(300);
    }

    return jobs.map(toRaw);
  },
};
