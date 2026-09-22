/**
 * Parses URLSearchParams into JobFilters + SortOption for /api/opportunities.
 * Kept separate from lib/jobs/filters.ts so that module stays free of any
 * HTTP/URL concerns.
 */

import { DEFAULT_FILTERS } from "./filters";
import type { JobCategory, JobFilters, JobType, SalaryDisclosure, SortOption } from "./types";

export function parseJobFilters(params: URLSearchParams): JobFilters {
  const filters: JobFilters = { ...DEFAULT_FILTERS };

  if (params.has("search")) filters.search = params.get("search") ?? "";

  if (params.has("categories")) {
    filters.categories = params.get("categories")!.split(",").filter(Boolean) as JobCategory[];
  }

  if (params.has("minSalary")) filters.minMonthlySalary = Number(params.get("minSalary"));
  if (params.has("maxSalary")) filters.maxMonthlySalary = Number(params.get("maxSalary"));

  if (params.has("worldwideOnly")) filters.worldwideOnly = params.get("worldwideOnly") === "true";

  if (params.has("employmentTypes")) {
    filters.employmentTypes = params.get("employmentTypes")!.split(",").filter(Boolean) as JobType[];
  }

  if (params.has("salaryDisclosure")) {
    filters.salaryDisclosure = params.get("salaryDisclosure") as SalaryDisclosure;
  }

  return filters;
}

export function parseSortOption(params: URLSearchParams): SortOption {
  const sort = params.get("sort");
  if (sort === "salary-desc" || sort === "salary-asc" || sort === "newest") return sort;
  return "newest";
}
