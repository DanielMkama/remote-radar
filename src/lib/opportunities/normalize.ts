/**
 * Raw -> Normalized (Phase 2 §7's "Normalize" stage). Ties together every
 * classifier plus lib/jobs/salary.ts's normalization math into one
 * NormalizedOpportunity. Deliberately has no side effects (no DB, no
 * network) so it's trivially unit-testable.
 */

import { buildSalaryInfo } from "@/lib/jobs/salary";
import { classifyCategory } from "./classify/category";
import { classifyEmploymentTypes } from "./classify/employment";
import { classifyFreshness } from "./classify/freshness";
import { classifyLocation } from "./classify/location";
import { classifySalaryStatus } from "./classify/salary-status";
import { classifyVerification } from "./classify/verification";
import { buildDuplicateFingerprint } from "./dedupe";
import { stripEmDashes } from "./html-to-text";
import type { NormalizedOpportunity, OpportunityType, RawOpportunity, SourceKind } from "./types";

export interface NormalizeContext {
  sourceKind: SourceKind;
  now?: Date;
}

export function normalizeOpportunity(raw: RawOpportunity, ctx: NormalizeContext): NormalizedOpportunity {
  const now = ctx.now ?? new Date();
  const discoveredAt = now.toISOString();

  const salary = buildSalaryInfo({
    min: raw.salaryMin,
    max: raw.salaryMax,
    currency: raw.salaryCurrency ?? "USD",
    period: raw.salaryPeriod,
  });

  const locationStatus = classifyLocation({
    locationText: raw.locationText,
    extraText: raw.description,
  });

  const employmentTypes = classifyEmploymentTypes(
    `${raw.employmentTypeText ?? ""} ${raw.title}`
  );
  const employmentType = employmentTypes[0] ?? "unknown";

  const { category, tags: derivedTags } = classifyCategory(raw.title, raw.description);
  const tags = Array.from(new Set([...raw.tags, ...derivedTags]));

  const applicationUrl = raw.applicationUrl ?? raw.url;

  const verificationStatus = classifyVerification(ctx.sourceKind, Boolean(applicationUrl));

  const freshness = classifyFreshness({
    deadline: raw.deadline,
    postedAt: raw.postedAt,
    discoveredAt,
    now,
  });

  const opportunityType: OpportunityType =
    ctx.sourceKind === "hiring_signal"
      ? "hiring_signal"
      : employmentType === "freelance"
      ? "freelance"
      : employmentType === "contract"
      ? "contract"
      : "job";

  return {
    id: crypto.randomUUID(),
    opportunityType,

    // Dashes are stripped here, centrally, after classification has already
    // run on the original text — so pattern matching (e.g. "Remote — US")
    // is unaffected, but nothing the UI ends up displaying keeps an em/en
    // dash, regardless of which source adapter produced it.
    title: stripEmDashes(raw.title.trim()),
    company: stripEmDashes(raw.company.trim()),
    companyUrl: raw.companyUrl,
    description: stripEmDashes(raw.description),

    url: raw.url,
    source: raw.sourceId,
    sourceUrl: raw.sourceUrl,
    sourceId: raw.sourceItemId,

    employmentType,
    employmentTypes,

    locationText: raw.locationText ? stripEmDashes(raw.locationText) : raw.locationText,
    locationStatus,

    salaryText: raw.salaryText ? stripEmDashes(raw.salaryText) : raw.salaryText,
    salaryCurrency: salary.currency,
    salaryPeriod: salary.period,
    salaryMin: salary.min,
    salaryMax: salary.max,
    normalizedMonthlyMin: salary.normalizedMonthly.min,
    normalizedMonthlyMax: salary.normalizedMonthly.max,
    salaryStatus: classifySalaryStatus(salary.normalizedMonthly.min, salary.normalizedMonthly.max),

    category,
    tags: tags.map(stripEmDashes),

    postedAt: raw.postedAt,
    discoveredAt,
    deadline: raw.deadline,

    remoteStatus: locationStatus,
    applicationUrl,

    rawSourceData: raw.raw,

    verificationStatus,
    freshness,
    duplicateFingerprint: buildDuplicateFingerprint(raw.company, raw.title),

    createdAt: discoveredAt,
    updatedAt: discoveredAt,
  };
}
