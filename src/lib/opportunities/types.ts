/**
 * The Opportunity model — Phase 2's internal, richer representation of a
 * discovered listing. Every source adapter produces a `RawOpportunity`,
 * the pipeline turns it into a `NormalizedOpportunity`, and
 * `lib/opportunities/adapter.ts` projects that down to the existing
 * `Job` type (lib/jobs/types.ts) so the Phase 1 dashboard UI doesn't need
 * to change at all.
 *
 * Job ⊂ Opportunity, conceptually: Job is "what the UI needs to render a
 * card", Opportunity is "everything we know about a discovered listing".
 */

import type { JobCategory, JobType, SalaryCurrency, SalaryPeriod } from "@/lib/jobs/types";

export type OpportunityType = "job" | "contract" | "freelance" | "hiring_signal";

export type EmploymentType = "full_time" | "part_time" | "contract" | "freelance" | "unknown";

export type LocationStatus =
  | "worldwide"
  | "region_restricted"
  | "country_restricted"
  | "timezone_restricted"
  | "location_unclear";

export type SalaryStatus = "within_range" | "below_range" | "above_range" | "unknown";

/**
 * Controlled design-category vocabulary (Phase 2 §11). Distinct from the
 * Phase 1 `JobCategory` (kebab-case, 10 categories); see
 * `lib/opportunities/classify/category.ts` for the mapping between them.
 */
export type DesignCategory =
  | "graphic_design"
  | "ui_design"
  | "ux_design"
  | "product_design"
  | "visual_design"
  | "brand_design"
  | "web_design"
  | "marketing_design"
  | "content_design"
  | "motion_design"
  | "creative_direction"
  | "art_direction"
  | "illustration"
  | "presentation_design"
  | "other";

/** How confident we are that this is a real, currently-open opportunity. */
export type VerificationStatus = "verified" | "likely" | "unverified";

/** Lifecycle state — see lib/opportunities/classify/freshness.ts. */
export type FreshnessStatus = "active" | "expired" | "closed" | "unknown";

/** How the source's underlying system is best described, for source-confidence and canonical-source ranking. */
export type SourceKind = "company_ats" | "job_board" | "hiring_signal";

/**
 * What a source adapter's `fetch()` returns: minimally-touched data in
 * roughly the source's own shape, plus the bookkeeping needed to trace it
 * back. `normalize()` turns this into a `NormalizedOpportunity`.
 */
export interface RawOpportunity {
  sourceId: string;
  /** The source's own id for this listing, if it has one. */
  sourceItemId: string | null;
  title: string;
  company: string;
  companyUrl: string | null;
  description: string;
  /** Where a person would go to read/apply for this listing (may equal sourceUrl). */
  url: string;
  /** The canonical page this was discovered on (e.g. the API endpoint's web equivalent). */
  sourceUrl: string;
  /** Free-text location exactly as the source wrote it. Never discarded. */
  locationText: string | null;
  /** Free-text employment type exactly as the source wrote it. */
  employmentTypeText: string | null;
  /** Free-text salary exactly as the source wrote it (e.g. "$90k - $105k", "$12/hr"). */
  salaryText: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: SalaryPeriod | null;
  tags: string[];
  postedAt: string | null;
  deadline: string | null;
  applicationUrl: string | null;
  /** The untouched payload from the source, kept for debugging/reprocessing. */
  raw: unknown;
}

/**
 * The full normalized shape, produced by the pipeline and persisted to
 * Supabase's `opportunities` table (see supabase/schema.sql). Field names
 * are camelCase here; `lib/opportunities/repository.ts` maps to/from the
 * snake_case DB columns.
 */
export interface NormalizedOpportunity {
  id: string;
  opportunityType: OpportunityType;

  title: string;
  company: string;
  companyUrl: string | null;
  description: string;

  url: string;
  source: string;
  sourceUrl: string;
  sourceId: string | null;

  employmentType: EmploymentType;
  /** All employment types the listing mentions (e.g. both full- and part-time). */
  employmentTypes: EmploymentType[];

  locationText: string | null;
  locationStatus: LocationStatus;

  salaryText: string | null;
  salaryCurrency: SalaryCurrency;
  salaryPeriod: SalaryPeriod | null;
  salaryMin: number | null;
  salaryMax: number | null;
  /** Estimated USD/month — derived, never presented as employer-stated. See lib/jobs/salary.ts. */
  normalizedMonthlyMin: number | null;
  normalizedMonthlyMax: number | null;
  salaryStatus: SalaryStatus;

  category: DesignCategory;
  tags: string[];

  postedAt: string | null;
  discoveredAt: string;
  deadline: string | null;

  remoteStatus: LocationStatus;
  applicationUrl: string;

  rawSourceData: unknown;

  verificationStatus: VerificationStatus;
  freshness: FreshnessStatus;
  duplicateFingerprint: string;

  createdAt: string;
  updatedAt: string;
}

/** Registered source metadata, independent of whether it's currently enabled. */
export type SourceType = "api" | "rss" | "company_ats";
export type SourceStatus = "active" | "planned" | "disabled" | "error";
