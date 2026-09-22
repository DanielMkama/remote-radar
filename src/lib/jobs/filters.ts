/**
 * Job filtering + sorting.
 *
 * These functions operate on in-memory `Job[]` arrays. In Phase 1 that array
 * comes from `mock-data.ts`; later phases can feed it from Supabase instead
 * without changing this module's API.
 */

import { JOB_CATEGORIES, type Job, type JobCategory, type JobFilters, type SortOption } from "./types";

/** All target design roles, used as the default category selection. */
export const TARGET_CATEGORIES: JobCategory[] = JOB_CATEGORIES.map((c) => c.value);

/**
 * Default filter values, matching the target criteria this tool exists to
 * apply: worldwide design roles paying $500–$2,000/month. An empty
 * `categories` array means "no restriction"; the default starts scoped to
 * the target roles so irrelevant categories are excluded out of the box.
 */
export const DEFAULT_FILTERS: JobFilters = {
  search: "",
  categories: TARGET_CATEGORIES,
  minMonthlySalary: 500,
  maxMonthlySalary: 2000,
  worldwideOnly: true,
};

/**
 * Returns true if `job` satisfies every constraint in `filters`.
 *
 * Salary matching: a job passes the salary filter if its normalized
 * monthly range overlaps the requested [min, max] window at all (rather
 * than requiring the job's entire range to fit inside it). Jobs with no
 * salary information pass the salary filter, since we can't disqualify
 * a job we have no data for — the mock data / detail UI should make the
 * "not disclosed" state visible instead.
 */
export function jobMatchesFilters(job: Job, filters: JobFilters): boolean {
  if (!job.isActive) return false;

  if (filters.search && filters.search.trim().length > 0) {
    const q = filters.search.trim().toLowerCase();
    const haystack = `${job.title} ${job.company} ${job.tags.join(" ")}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }

  if (filters.categories && filters.categories.length > 0) {
    if (!filters.categories.includes(job.category)) return false;
  }

  if (filters.worldwideOnly && !job.isWorldwide) return false;

  const { min: jobMin, max: jobMax } = job.salary.normalizedMonthly;
  const hasSalaryData = jobMin != null || jobMax != null;

  if (hasSalaryData) {
    const effectiveMin = jobMin ?? jobMax!;
    const effectiveMax = jobMax ?? jobMin!;

    if (filters.minMonthlySalary != null && effectiveMax < filters.minMonthlySalary) {
      return false;
    }
    if (filters.maxMonthlySalary != null && effectiveMin > filters.maxMonthlySalary) {
      return false;
    }
  }

  return true;
}

export function filterJobs(jobs: Job[], filters: JobFilters): Job[] {
  return jobs.filter((job) => jobMatchesFilters(job, filters));
}

export function sortJobs(jobs: Job[], sortBy: SortOption): Job[] {
  const sorted = [...jobs];
  switch (sortBy) {
    case "newest":
      return sorted.sort(
        (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
      );
    case "salary-desc":
      return sorted.sort((a, b) => salaryRank(b) - salaryRank(a));
    case "salary-asc":
      return sorted.sort((a, b) => salaryRank(a) - salaryRank(b));
    default:
      return sorted;
  }
}

/** Best-known monthly figure for a job, used to rank jobs with partial data. */
function salaryRank(job: Job): number {
  const { min, max } = job.salary.normalizedMonthly;
  if (max != null) return max;
  if (min != null) return min;
  return -1;
}

/** Convenience: filter then sort in one call. */
export function applyFilters(jobs: Job[], filters: JobFilters, sortBy: SortOption): Job[] {
  return sortJobs(filterJobs(jobs, filters), sortBy);
}

/**
 * Rule-based match score (0–100), NOT AI matching. It's a simple weighted
 * heuristic against the target criteria, used to populate `matchScore` for
 * mock data and to power the "Strong Matches" summary card. A real scoring
 * engine (configurable weights, profile-based) is a later phase.
 *
 * Weights: worldwide (40) + target category (30) + salary fit (30).
 */
export function computeMatchScore(
  job: Pick<Job, "isWorldwide" | "category" | "salary">,
  target: { minMonthlySalary: number; maxMonthlySalary: number } = {
    minMonthlySalary: 500,
    maxMonthlySalary: 2000,
  }
): number {
  let score = 0;

  if (job.isWorldwide) score += 40;
  if (job.category !== "other") score += 30;

  const { min, max } = job.salary.normalizedMonthly;
  if (min == null && max == null) {
    score += 15; // unknown salary: neutral credit
  } else {
    const effectiveMin = min ?? max!;
    const effectiveMax = max ?? min!;
    const fullyWithin =
      effectiveMin >= target.minMonthlySalary && effectiveMax <= target.maxMonthlySalary;
    const overlaps =
      effectiveMax >= target.minMonthlySalary && effectiveMin <= target.maxMonthlySalary;
    if (fullyWithin) score += 30;
    else if (overlaps) score += 15;
  }

  return Math.round(score);
}

/** Threshold at/above which a job counts as a "strong match" on the dashboard. */
export const STRONG_MATCH_THRESHOLD = 80;
