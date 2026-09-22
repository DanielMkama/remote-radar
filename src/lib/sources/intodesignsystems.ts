/**
 * Into Design Systems — a curated, hand-verified job board for Design
 * System roles. No REST API, but the homepage embeds its full current
 * listing as a single schema.org JSON-LD `ItemList` of `JobPosting`
 * items (254 at last check) — real structured data, not scraping.
 * robots.txt is fully permissive and explicitly names ClaudeBot/
 * anthropic-ai as welcome; the site also runs an MCP server for agents
 * (https://jobs.intodesignsystems.com/mcp) but plain JSON-LD is simpler
 * and sufficient here, matching how every other source in this pipeline
 * is a plain HTTP fetch rather than a bespoke protocol client.
 *
 * Each JobPosting's `url` already points at the employer's own
 * application page (e.g. coinbase.com/careers/..., an ATS board), not an
 * intodesignsystems.com redirect — better provenance than most sources.
 */

import type { RawOpportunity } from "@/lib/opportunities/types";
import type { JobType } from "@/lib/jobs/types";
import { fetchText } from "./http";
import type { FetchContext, OpportunitySource } from "./types";

interface SchemaJobPosting {
  "@type": "JobPosting";
  title: string;
  description?: string;
  hiringOrganization?: { name?: string };
  jobLocation?: { address?: { addressLocality?: string; addressCountry?: string } };
  datePosted?: string;
  employmentType?: string;
  directApply?: boolean;
  url: string;
}

interface SchemaItemList {
  "@type": "ItemList";
  itemListElement: Array<{ "@type": "ListItem"; item: SchemaJobPosting }>;
}

const PAGE_URL = "https://jobs.intodesignsystems.com/";

const EMPLOYMENT_TYPE_MAP: Record<string, JobType> = {
  FULL_TIME: "full-time",
  PART_TIME: "part-time",
  CONTRACTOR: "contract",
  TEMPORARY: "contract",
  INTERN: "internship",
};

/** Finds the ItemList/JobPosting block among the page's JSON-LD script tags (there are a few — Person/Organization/WebSite ones too). */
function extractJobPostings(html: string): SchemaJobPosting[] {
  const blocks = html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g);
  for (const block of blocks) {
    try {
      const data = JSON.parse(block[1]) as SchemaItemList | Record<string, unknown>;
      if (data["@type"] === "ItemList" && Array.isArray((data as SchemaItemList).itemListElement)) {
        return (data as SchemaItemList).itemListElement.map((li) => li.item);
      }
    } catch {
      // Not JSON, or not the block we want — try the next script tag.
    }
  }
  return [];
}

function toRaw(job: SchemaJobPosting): RawOpportunity {
  const locality = job.jobLocation?.address?.addressLocality;
  const country = job.jobLocation?.address?.addressCountry;
  const locationText = [locality, country].filter(Boolean).join(", ") || null;

  return {
    sourceId: "intodesignsystems",
    sourceItemId: job.url,
    title: job.title,
    company: job.hiringOrganization?.name ?? "Unknown",
    companyUrl: null,
    description: job.description ?? job.title,
    url: job.url,
    sourceUrl: PAGE_URL,
    locationText,
    employmentTypeText: job.employmentType ? EMPLOYMENT_TYPE_MAP[job.employmentType] ?? null : null,
    salaryText: null,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: "USD",
    salaryPeriod: null,
    tags: ["design-systems"],
    postedAt: job.datePosted ?? null,
    deadline: null,
    applicationUrl: job.url,
    raw: job,
  };
}

export const intoDesignSystemsSource: OpportunitySource = {
  id: "intodesignsystems",
  name: "Into Design Systems",
  type: "api",
  kind: "job_board",
  status: "active",
  notes: "Curated design-systems job board; structured schema.org JSON-LD embedded in the page (no REST API).",

  async fetch(ctx: FetchContext): Promise<RawOpportunity[]> {
    const html = await fetchText(PAGE_URL, { signal: ctx.signal });
    return extractJobPostings(html).map(toRaw);
  },
};
