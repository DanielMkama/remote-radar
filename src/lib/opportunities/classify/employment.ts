/**
 * Employment-type classification (Phase 2 §10).
 *
 * Returns every employment type the source text mentions (a listing can
 * legitimately say "Full-time or Part-time"), plus a single "primary"
 * value for places that need one (filters, the Phase 1 Job.jobType field).
 */

import type { EmploymentType } from "../types";

const PATTERNS: Array<{ type: EmploymentType; pattern: RegExp }> = [
  { type: "full_time", pattern: /\bfull[\s\-]?time\b/i },
  { type: "part_time", pattern: /\bpart[\s\-]?time\b/i },
  { type: "contract", pattern: /\bcontract(?:or)?\b/i },
  { type: "freelance", pattern: /\bfreelance\b/i },
];

/** Returns every employment type mentioned in the text, in the order above. Empty if none matched. */
export function classifyEmploymentTypes(text: string | null | undefined): EmploymentType[] {
  if (!text) return [];
  const found = PATTERNS.filter(({ pattern }) => pattern.test(text)).map(({ type }) => type);
  return found;
}

/** Convenience: the single best-guess type, "unknown" if nothing matched. */
export function classifyPrimaryEmploymentType(text: string | null | undefined): EmploymentType {
  return classifyEmploymentTypes(text)[0] ?? "unknown";
}
