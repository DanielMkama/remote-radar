/**
 * Core domain types for Remote Design Radar.
 *
 * These types mirror the `jobs` table in Supabase (see
 * `supabase/schema.sql`) plus the derived/normalized fields the app
 * computes client-side (e.g. `salary.normalizedMonthly`).
 */

/** Job categories we actively track. Keys match the `category` column. */
export type JobCategory =
  | "graphic-design"
  | "ui-design"
  | "ux-design"
  | "visual-design"
  | "product-design"
  | "brand-design"
  | "web-design"
  | "marketing-design"
  | "creative-design"
  | "content-design"
  /** Anything outside the target roles. Used to demonstrate filtering it out. */
  | "other";

export const JOB_CATEGORIES: { value: JobCategory; label: string }[] = [
  { value: "graphic-design", label: "Graphic Design" },
  { value: "ui-design", label: "UI Design" },
  { value: "ux-design", label: "UX Design" },
  { value: "visual-design", label: "Visual Design" },
  { value: "product-design", label: "Product Design" },
  { value: "brand-design", label: "Brand Design" },
  { value: "web-design", label: "Web Design" },
  { value: "marketing-design", label: "Marketing Design" },
  { value: "creative-design", label: "Creative Design" },
  { value: "content-design", label: "Content Design" },
];

/** How the employer expressed the pay rate. */
export type SalaryPeriod = "hour" | "month" | "year";

export type SalaryCurrency = "USD" | "EUR" | "GBP" | string;

/** Employment arrangement as stated by the source. */
export type JobType =
  | "full-time"
  | "part-time"
  | "contract"
  | "freelance"
  | "internship"
  | "unspecified";

/**
 * Job board / origin of a listing. Phase 1 only shipped "remotive"; Phase 2
 * adds the sources actually implemented in lib/sources/. Kept as a plain
 * string union (not reusing SourceId from lib/sources/types.ts) so this
 * file has no dependency on the ingestion layer — mock data and the UI
 * only need to know these are display strings.
 */
export type JobSource =
  | "remotive"
  | "himalayas"
  | "remoteok"
  | "weworkremotely"
  | "wellfound"
  | "getonboard"
  | "greenhouse"
  | "lever";

/**
 * Salary exactly as the employer/source stated it, with a normalized
 * monthly estimate attached. The normalized figure is ALWAYS derived
 * (never presented as an employer-stated number) — see lib/jobs/salary.ts.
 */
export interface SalaryInfo {
  /** Original minimum, as stated by the source. Null if unknown. */
  min: number | null;
  /** Original maximum, as stated by the source. Null if unknown. */
  max: number | null;
  currency: SalaryCurrency;
  /** Original period the min/max are expressed in. */
  period: SalaryPeriod | null;
  /**
   * Estimated monthly equivalent, derived from min/max/period using the
   * documented conversion assumptions in lib/jobs/salary.ts. This is an
   * ESTIMATE, not a stated monthly salary.
   */
  normalizedMonthly: {
    min: number | null;
    max: number | null;
  };
}

export interface Job {
  id: string;
  externalId: string;
  source: JobSource;
  title: string;
  company: string;
  companyLogo: string | null;
  url: string;
  description: string;
  location: string;
  salary: SalaryInfo;
  jobType: JobType;
  category: JobCategory;
  tags: string[];
  postedAt: string;
  collectedAt: string;
  matchScore: number;
  isWorldwide: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // --- Phase 2 additions. All optional: mock jobs and any other existing
  // Job producer don't need to set these, and existing UI code that
  // doesn't read them is unaffected. Populated by
  // lib/opportunities/adapter.ts from the richer Opportunity model. ---
  /** How many distinct sources reported this same opportunity (see lib/opportunities/dedupe.ts). */
  sourceCount?: number;
  /** How confident we are this is a real, currently-open opportunity. */
  verificationStatus?: "verified" | "likely" | "unverified";
  /** Lifecycle state — see lib/opportunities/freshness.ts. */
  freshness?: "active" | "expired" | "closed" | "unknown";
  /** True when the application URL points at the company's own careers page/ATS. */
  isDirectApplication?: boolean;
}

/** How a job's salary compares to the filter's target range. */
export type SalaryDisclosure = "all" | "disclosed" | "undisclosed";

/** Filter criteria applied to a job list. All fields optional/combinable. */
export interface JobFilters {
  search?: string;
  categories?: JobCategory[];
  minMonthlySalary?: number;
  maxMonthlySalary?: number;
  worldwideOnly?: boolean;
  /** Employment types to include. Undefined/empty means "any". */
  employmentTypes?: JobType[];
  /** Whether to require/exclude/ignore disclosed salary. Defaults to "all". */
  salaryDisclosure?: SalaryDisclosure;
}

export type SortOption = "newest" | "salary-desc" | "salary-asc";

/** Shape of the editable preferences on the Settings page. */
export interface UserPreferences {
  minMonthlySalary: number;
  maxMonthlySalary: number;
  worldwideOnly: boolean;
  categories: JobCategory[];
}
