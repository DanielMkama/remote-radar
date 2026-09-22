/**
 * Salary normalization utilities.
 *
 * Job boards express pay in wildly different shapes: $12/hour, $40,000/year,
 * $1,500/month, etc. To filter and sort jobs consistently we normalize every
 * salary to an ESTIMATED monthly figure.
 *
 * IMPORTANT: the normalized value is always a derived estimate. It is never
 * presented as a number the employer actually stated. Callers should keep
 * showing the original `salary.min/max/period` alongside
 * `salary.normalizedMonthly` so users can see both.
 *
 * --- Documented conversion assumptions ---
 * - Hourly -> Monthly: hourly rate * 40 hours/week * 52 weeks/year / 12 months
 *   = hourly rate * 173.33 hours/month.
 *   Assumes a standard full-time 40-hour work week.
 * - Yearly -> Monthly: yearly amount / 12.
 * - Monthly -> Monthly: passed through unchanged.
 */

import type { SalaryInfo, SalaryPeriod } from "./types";

export const HOURS_PER_WEEK = 40;
export const WEEKS_PER_YEAR = 52;
export const MONTHS_PER_YEAR = 12;
/** Standard full-time hours/month used for hourly -> monthly conversion. */
export const HOURS_PER_MONTH = (HOURS_PER_WEEK * WEEKS_PER_YEAR) / MONTHS_PER_YEAR; // 173.33...

/**
 * Convert a single numeric amount, expressed in `period`, to an estimated
 * monthly amount. Returns null if amount or period is missing.
 */
export function toMonthlyEstimate(
  amount: number | null | undefined,
  period: SalaryPeriod | null | undefined
): number | null {
  if (amount == null || period == null) return null;

  switch (period) {
    case "hour":
      return round2(amount * HOURS_PER_MONTH);
    case "month":
      return round2(amount);
    case "year":
      return round2(amount / MONTHS_PER_YEAR);
    default:
      return null;
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Build a full SalaryInfo object (original + normalized) from raw stated
 * salary fields. This is the single entry point sources should use when
 * ingesting a job so the normalized figures are always computed the same
 * way.
 */
export function buildSalaryInfo(input: {
  min: number | null;
  max: number | null;
  currency: string;
  period: SalaryPeriod | null;
}): SalaryInfo {
  return {
    min: input.min,
    max: input.max,
    currency: input.currency,
    period: input.period,
    normalizedMonthly: {
      min: toMonthlyEstimate(input.min, input.period),
      max: toMonthlyEstimate(input.max, input.period),
    },
  };
}

/**
 * Human-readable label for a salary, e.g. "$500 – $2,000/mo" or
 * "$12/hr (~$2,080/mo est.)". Falls back gracefully when data is partial.
 */
export function formatSalary(salary: SalaryInfo): string {
  const { min, max, currency, period } = salary;
  if (min == null && max == null) return "Not disclosed";

  const symbol = currencySymbol(currency);
  const periodAbbr = period ? periodAbbreviation(period) : "";
  const range =
    min != null && max != null
      ? `${symbol}${formatNumber(min)} – ${symbol}${formatNumber(max)}`
      : min != null
      ? `${symbol}${formatNumber(min)}+`
      : `Up to ${symbol}${formatNumber(max as number)}`;

  const stated = periodAbbr ? `${range}/${periodAbbr}` : range;

  // For non-monthly periods, append the estimated monthly equivalent so
  // it's easy to compare jobs at a glance without hiding the original figure.
  if (period && period !== "month") {
    const estMin = salary.normalizedMonthly.min;
    const estMax = salary.normalizedMonthly.max;
    const est =
      estMin != null && estMax != null
        ? `${symbol}${formatNumber(estMin)} – ${symbol}${formatNumber(estMax)}`
        : estMin != null
        ? `${symbol}${formatNumber(estMin)}+`
        : estMax != null
        ? `up to ${symbol}${formatNumber(estMax)}`
        : null;
    if (est) return `${stated} (~${est}/mo est.)`;
  }

  return stated;
}

/** Compact label for just the normalized monthly estimate, e.g. "$500–$2,000/mo est." */
export function formatNormalizedMonthly(salary: SalaryInfo): string {
  const { min, max } = salary.normalizedMonthly;
  const symbol = currencySymbol(salary.currency);
  if (min == null && max == null) return "Unknown";
  if (min != null && max != null) {
    return `${symbol}${formatNumber(min)} – ${symbol}${formatNumber(max)}/mo`;
  }
  const value = min ?? max;
  return `${symbol}${formatNumber(value as number)}/mo`;
}

function periodAbbreviation(period: SalaryPeriod): string {
  switch (period) {
    case "hour":
      return "hr";
    case "month":
      return "mo";
    case "year":
      return "yr";
  }
}

function currencySymbol(currency: string): string {
  switch (currency) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    default:
      return `${currency} `;
  }
}

function formatNumber(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}
