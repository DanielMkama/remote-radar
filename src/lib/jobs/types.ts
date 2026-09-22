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

/** Job board / origin of a listing. Phase 1 only ships Remotive. */
export type JobSource = "remotive";

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
}

/** Filter criteria applied to a job list. All fields optional/combinable. */
export interface JobFilters {
  search?: string;
  categories?: JobCategory[];
  minMonthlySalary?: number;
  maxMonthlySalary?: number;
  worldwideOnly?: boolean;
}

export type SortOption = "newest" | "salary-desc" | "salary-asc";

/** Shape of the editable preferences on the Settings page. */
export interface UserPreferences {
  minMonthlySalary: number;
  maxMonthlySalary: number;
  worldwideOnly: boolean;
  categories: JobCategory[];
}
