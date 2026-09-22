/**
 * Workable — generic factory for monitoring a single company's public job
 * board (Phase 2 Tier 3, implemented in Phase 3A once real companies to
 * verify it against were found). Verified against a real public account
 * (apply.workable.com/api/v1/widget/accounts/facetwealth) — no auth
 * required, and apply.workable.com's robots.txt is fully permissive
 * (empty Disallow) and explicitly signals `Content-Signal: ai-input=yes`.
 *
 * No company accounts are registered by default (see
 * lib/sources/registry.ts) — call createWorkableSource("<account-shortname>",
 * "<Company Name>") and add the result to the registry to start
 * monitoring a specific company. The account shortname is the segment
 * right after apply.workable.com/ in that company's job/apply URLs.
 */

import type { RawOpportunity } from "@/lib/opportunities/types";
import { fetchJson } from "../http";
import type { FetchContext, OpportunitySource } from "../types";

interface WorkableJob {
  title: string;
  shortcode: string;
  employment_type?: string;
  telecommuting?: boolean;
  department?: string;
  function?: string;
  experience?: string;
  industry?: string;
  url: string;
  application_url?: string;
  published_on?: string;
  country?: string;
  city?: string;
  state?: string;
  locations?: Array<{ country?: string; city?: string; region?: string | null }>;
}

interface WorkableWidgetResponse {
  name: string;
  description?: string;
  jobs: WorkableJob[];
}

/**
 * Workable's widget API has no job-description field (only an
 * account-level company blurb), so a synthetic one is built from the
 * structured fields it does give — function, department, employment
 * type, experience level, industry, location. Matters beyond just
 * passing validate.ts's minimum-length check: a bare "Design — Product"
 * (17 chars) fails that check and gets the listing silently dropped
 * before it's ever compared against the title regex, even when the
 * title itself is unambiguous (e.g. "Staff Brand Designer") — found via
 * a real ingestion run against Facet's board returning 0 design results
 * despite two clearly design-titled listings being live.
 */
function buildDescription(job: WorkableJob, company: string): string {
  const place = buildLocationText(job);
  const parts = [
    `${job.title} at ${company}.`,
    job.function ? `Function: ${job.function}.` : null,
    job.department ? `Department: ${job.department}.` : null,
    job.employment_type ? `${job.employment_type}.` : null,
    job.experience ? `Experience: ${job.experience}.` : null,
    job.industry ? `Industry: ${job.industry}.` : null,
    place ? `Location: ${place}.` : null,
  ].filter(Boolean);
  return parts.join(" ");
}

/** Some companies list a literal city named "Remote" — real place-name fields, not our own "Remote —" prefix, so it has to be filtered here or it doubles up (e.g. "Remote — Remote, Oregon, United States"). */
function isRemotePlaceholder(value: string | undefined | null): boolean {
  return !value || value.trim().toLowerCase() === "remote";
}

function buildLocationText(job: WorkableJob): string | null {
  const places = (job.locations ?? [])
    .map((l) =>
      [l.city, l.region, l.country]
        .filter((part): part is string => Boolean(part) && !isRemotePlaceholder(part))
        .join(", ")
    )
    .filter(Boolean);
  const fallback = [job.city, job.state, job.country]
    .filter((part): part is string => Boolean(part) && !isRemotePlaceholder(part))
    .join(", ");
  const place = places.join(" / ") || fallback || null;

  if (!place) return job.telecommuting ? "Remote" : null;
  return job.telecommuting ? `Remote — ${place}` : place;
}

export function createWorkableSource(account: string, companyName?: string): OpportunitySource {
  const endpoint = `https://apply.workable.com/api/v1/widget/accounts/${account}`;

  return {
    id: `workable:${account}`,
    name: `Workable (${companyName ?? account})`,
    type: "company_ats",
    kind: "company_ats",
    status: "active",
    notes: "Direct company careers page via Workable's public widget API.",

    async fetch(ctx: FetchContext): Promise<RawOpportunity[]> {
      const data = await fetchJson<WorkableWidgetResponse>(endpoint, { signal: ctx.signal });
      const company = companyName ?? data.name ?? account;

      return data.jobs.map((job): RawOpportunity => ({
        sourceId: `workable:${account}`,
        sourceItemId: job.shortcode,
        title: job.title,
        company,
        companyUrl: null,
        description: buildDescription(job, company),
        url: job.url,
        sourceUrl: job.url,
        locationText: buildLocationText(job),
        employmentTypeText: job.employment_type || null,
        salaryText: null,
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: "USD",
        salaryPeriod: null,
        tags: [job.function, job.department].filter((x): x is string => Boolean(x)),
        postedAt: job.published_on ? new Date(job.published_on).toISOString() : null,
        deadline: null,
        applicationUrl: job.application_url || job.url,
        raw: job,
      }));
    },
  };
}
