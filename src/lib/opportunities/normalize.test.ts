import { describe, expect, it } from "vitest";
import { normalizeOpportunity } from "./normalize";
import type { RawOpportunity } from "./types";

function makeRaw(overrides: Partial<RawOpportunity> = {}): RawOpportunity {
  return {
    sourceId: "remotive",
    sourceItemId: "123",
    title: "Senior Brand Designer",
    company: "Acme Inc",
    companyUrl: "https://acme.example",
    description: "Own our visual identity and branding across every channel.",
    url: "https://example.com/jobs/123",
    sourceUrl: "https://example.com/jobs/123",
    locationText: "Worldwide",
    employmentTypeText: "Full-time",
    salaryText: "$40,000/year",
    salaryMin: 40000,
    salaryMax: 40000,
    salaryCurrency: "USD",
    salaryPeriod: "year",
    tags: ["remote"],
    postedAt: "2026-01-01T00:00:00.000Z",
    deadline: null,
    applicationUrl: "https://example.com/apply/123",
    raw: { id: 123 },
    ...overrides,
  };
}

describe("normalizeOpportunity", () => {
  it("ties classification, salary normalization, and dedupe fingerprinting together", () => {
    const normalized = normalizeOpportunity(makeRaw(), { sourceKind: "job_board" });

    expect(normalized.locationStatus).toBe("worldwide");
    expect(normalized.employmentType).toBe("full_time");
    expect(normalized.category).toBe("brand_design");
    // $40,000/year → ~$3,333/month (above the $500-$2,000 target range)
    expect(normalized.normalizedMonthlyMin).toBeCloseTo(3333.33, 1);
    expect(normalized.salaryStatus).toBe("above_range");
    expect(normalized.duplicateFingerprint).toBe("acme inc::brand designer");
    // Original stated figures must never be discarded (Phase 2 §2/§8).
    expect(normalized.salaryText).toBe("$40,000/year");
    expect(normalized.locationText).toBe("Worldwide");
  });

  it("classifies a company-ATS source as more verified than a hiring signal", () => {
    const atsResult = normalizeOpportunity(makeRaw(), { sourceKind: "company_ats" });
    const signalResult = normalizeOpportunity(makeRaw(), { sourceKind: "hiring_signal" });

    expect(atsResult.verificationStatus).toBe("verified");
    expect(signalResult.verificationStatus).toBe("unverified");
  });

  it("never invents a salary when the source doesn't provide one", () => {
    const normalized = normalizeOpportunity(
      makeRaw({ salaryText: null, salaryMin: null, salaryMax: null, salaryPeriod: null }),
      { sourceKind: "job_board" }
    );

    expect(normalized.normalizedMonthlyMin).toBeNull();
    expect(normalized.normalizedMonthlyMax).toBeNull();
    expect(normalized.salaryStatus).toBe("unknown");
  });
});
