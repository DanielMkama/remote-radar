/**
 * Opportunity -> Job. This is what lets the entire Phase 1 dashboard UI
 * (job cards, filters, detail page, salary formatting) work unmodified
 * against real, richer Phase 2 data: every place that reads a `Job`
 * doesn't need to know `Opportunity` exists at all.
 */

import { computeMatchScore } from "@/lib/jobs/filters";
import type { Job, JobCategory, JobType } from "@/lib/jobs/types";
import { classifyFreshness } from "./classify/freshness";
import type { DesignCategory, EmploymentType, NormalizedOpportunity } from "./types";

/**
 * DesignCategory (Phase 2, §11) -> JobCategory (Phase 1). A few Phase 2
 * categories don't have a dedicated Phase 1 bucket and fall back to the
 * closest existing one — "creative-design" is Phase 1's general-purpose
 * bucket for direction/illustration/motion work.
 */
const CATEGORY_TO_JOB_CATEGORY: Record<DesignCategory, JobCategory> = {
  graphic_design: "graphic-design",
  ui_design: "ui-design",
  ux_design: "ux-design",
  product_design: "product-design",
  visual_design: "visual-design",
  brand_design: "brand-design",
  web_design: "web-design",
  marketing_design: "marketing-design",
  content_design: "content-design",
  motion_design: "creative-design",
  creative_direction: "creative-design",
  art_direction: "creative-design",
  illustration: "creative-design",
  presentation_design: "creative-design",
  other: "other",
};

const EMPLOYMENT_TYPE_TO_JOB_TYPE: Record<EmploymentType, JobType> = {
  full_time: "full-time",
  part_time: "part-time",
  contract: "contract",
  freelance: "freelance",
  unknown: "unspecified",
};

export function opportunityToJob(o: NormalizedOpportunity): Job {
  const category = CATEGORY_TO_JOB_CATEGORY[o.category] ?? "other";
  const isWorldwide = o.locationStatus === "worldwide";

  // Recomputed against the current time rather than trusting the persisted
  // `freshness` column: that value is only as fresh as the last ingestion
  // run, so without this, a listing would stay "active" on the dashboard
  // past its 30-day cutoff (Phase 2 §22) until the next `npm run ingest`
  // happened to touch that row again.
  const freshness = classifyFreshness({
    deadline: o.deadline,
    postedAt: o.postedAt,
    discoveredAt: o.discoveredAt,
  });

  const salary = {
    min: o.salaryMin,
    max: o.salaryMax,
    currency: o.salaryCurrency,
    period: o.salaryPeriod,
    normalizedMonthly: { min: o.normalizedMonthlyMin, max: o.normalizedMonthlyMax },
  };

  return {
    id: o.id,
    externalId: o.sourceId ?? o.id,
    // Job.source is a plain display string; unrecognized/new source ids
    // still work since formatSource() falls back to the raw string.
    source: o.source as Job["source"],
    title: o.title,
    company: o.company,
    companyLogo: null,
    url: o.applicationUrl || o.url,
    description: o.description,
    location: o.locationText ?? "Not specified",
    salary,
    jobType: EMPLOYMENT_TYPE_TO_JOB_TYPE[o.employmentType],
    category,
    tags: o.tags,
    postedAt: o.postedAt ?? o.discoveredAt,
    collectedAt: o.discoveredAt,
    matchScore: computeMatchScore({ isWorldwide, category, salary }),
    isWorldwide,
    isActive: freshness === "active",
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,

    verificationStatus: o.verificationStatus,
    freshness,
    isDirectApplication: o.verificationStatus === "verified",
  };
}
