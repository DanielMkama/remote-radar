/**
 * Best-effort parser for free-text salary strings from sources that don't
 * give structured salary fields (e.g. Remotive's "$90k - $105k", "$12/hr").
 *
 * Deliberately conservative: if we can't confidently determine BOTH a
 * numeric amount and a pay period, we return "unknown" rather than guess
 * — per Phase 2 §8, we never invent salary information a source didn't
 * provide. The one documented convention we do apply: a bare "$90k"
 * style figure with no explicit period is assumed annual, since that's
 * the near-universal convention for "k"-suffixed compensation figures on
 * job boards.
 */

import type { SalaryCurrency, SalaryPeriod } from "@/lib/jobs/types";

export interface ParsedSalaryText {
  min: number | null;
  max: number | null;
  currency: SalaryCurrency;
  period: SalaryPeriod | null;
}

const UNKNOWN: ParsedSalaryText = { min: null, max: null, currency: "USD", period: null };

const CURRENCY_SYMBOLS: Array<{ symbol: string; currency: SalaryCurrency }> = [
  { symbol: "$", currency: "USD" },
  { symbol: "€", currency: "EUR" },
  { symbol: "£", currency: "GBP" },
];

const NUMBER_PATTERN = /(\d[\d,]*(?:\.\d+)?)\s*(k)?/gi;

export function parseSalaryText(text: string | null | undefined): ParsedSalaryText {
  if (!text || !text.trim()) return UNKNOWN;

  const currency = CURRENCY_SYMBOLS.find((c) => text.includes(c.symbol))?.currency ?? "USD";

  const period = detectPeriod(text);
  if (!period) return { ...UNKNOWN, currency };

  const amounts: number[] = [];
  for (const match of text.matchAll(NUMBER_PATTERN)) {
    const raw = Number(match[1].replace(/,/g, ""));
    if (Number.isNaN(raw)) continue;
    amounts.push(match[2] ? raw * 1000 : raw);
  }

  if (amounts.length === 0) return { ...UNKNOWN, currency };

  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  return { min, max, currency, period };
}

function detectPeriod(text: string): SalaryPeriod | null {
  if (/\/\s?hr\b|\bper hour\b|\bhourly\b|\bhour\b/i.test(text)) return "hour";
  if (/\/\s?mo\b|\bper month\b|\bmonthly\b|\bmonth\b/i.test(text)) return "month";
  if (/\/\s?yr\b|\bper year\b|\bannual(?:ly)?\b|\byear\b/i.test(text)) return "year";
  // Bare "$90k" convention: a "k"-suffixed figure with no other period hint is assumed annual.
  if (/\d\s*k\b/i.test(text)) return "year";
  return null;
}
