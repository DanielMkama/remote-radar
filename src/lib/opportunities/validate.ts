/**
 * Quality-check / validation stage (Phase 2 §7, §12). Runs after
 * normalization and before deduplication. Anything that fails is dropped
 * from ingestion entirely (not stored) — these are the product's hard
 * exclusions (internships, unpaid roles, not-design), distinct from
 * salary/location "store but classify" handling (§13–§14), which
 * intentionally does NOT reject here.
 */

import { requiresSeniorExperience } from "./classify/experience";
import { isDesignRelevant } from "./classify/relevance";
import type { NormalizedOpportunity } from "./types";

export interface ValidationResult {
  valid: boolean;
  reasons: string[];
}

const INTERNSHIP_PATTERN = /\bintern(?:ship)?\b/i;
const UNPAID_PATTERN = /\bunpaid\b|\bvolunteer\b|\bno pay\b|\bno compensation\b|\bequity[\s\-]?only\b/i;

export function validateOpportunity(o: NormalizedOpportunity): ValidationResult {
  const reasons: string[] = [];

  if (!o.title || o.title.trim().length < 3) reasons.push("missing or too-short title");
  if (!o.company || o.company.trim().length < 1) reasons.push("missing company");
  if (!isValidUrl(o.applicationUrl) && !isValidUrl(o.url)) reasons.push("no valid application/listing URL");
  if (!o.description || o.description.trim().length < 20) reasons.push("description too short to be a real listing");

  if (!isDesignRelevant(o.title)) reasons.push("title does not match a target design role");

  if (INTERNSHIP_PATTERN.test(o.title)) reasons.push("internship (excluded by product rules)");

  if (UNPAID_PATTERN.test(`${o.title} ${o.salaryText ?? ""} ${o.description}`)) {
    reasons.push("unpaid/volunteer role (excluded by product rules)");
  }

  if (requiresSeniorExperience(`${o.title} ${o.description}`)) {
    reasons.push("requires 5+ years of experience (senior roles excluded by product rules)");
  }

  return { valid: reasons.length === 0, reasons };
}

function isValidUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
