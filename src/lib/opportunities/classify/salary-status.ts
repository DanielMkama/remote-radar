/**
 * Salary status classification. Reuses lib/jobs/salary.ts's normalization
 * math (toMonthlyEstimate) rather than re-implementing hourly/yearly
 * conversion — see that file for the documented conversion assumptions.
 */

import { toMonthlyEstimate } from "@/lib/jobs/salary";
import type { SalaryPeriod } from "@/lib/jobs/types";
import type { SalaryStatus } from "../types";

export interface TargetSalaryRange {
  minMonthlyUsd: number;
  maxMonthlyUsd: number;
}

export const DEFAULT_TARGET_RANGE: TargetSalaryRange = { minMonthlyUsd: 500, maxMonthlyUsd: 2000 };

/**
 * Classifies a salary against the target monthly USD range. Uses "overlap"
 * semantics (consistent with lib/jobs/filters.ts's jobMatchesFilters): a
 * range that partially overlaps the target still counts as within_range,
 * since the point is "worth a look", not "entirely inside the window".
 * Boundary values (exactly $500 or $2,000) count as within_range.
 */
export function classifySalaryStatus(
  normalizedMonthlyMin: number | null,
  normalizedMonthlyMax: number | null,
  target: TargetSalaryRange = DEFAULT_TARGET_RANGE
): SalaryStatus {
  if (normalizedMonthlyMin == null && normalizedMonthlyMax == null) return "unknown";

  const effectiveMin = normalizedMonthlyMin ?? normalizedMonthlyMax!;
  const effectiveMax = normalizedMonthlyMax ?? normalizedMonthlyMin!;

  if (effectiveMax < target.minMonthlyUsd) return "below_range";
  if (effectiveMin > target.maxMonthlyUsd) return "above_range";
  return "within_range";
}

/** Convenience: classify directly from an original salary amount + period (e.g. "$12/hour"). */
export function classifySalaryStatusFromOriginal(
  amountMin: number | null,
  amountMax: number | null,
  period: SalaryPeriod | null,
  target: TargetSalaryRange = DEFAULT_TARGET_RANGE
): SalaryStatus {
  return classifySalaryStatus(
    toMonthlyEstimate(amountMin, period),
    toMonthlyEstimate(amountMax, period),
    target
  );
}
