import { describe, expect, it } from "vitest";
import { validateOpportunity } from "./validate";
import type { NormalizedOpportunity } from "./types";

function makeOpportunity(overrides: Partial<NormalizedOpportunity> = {}): NormalizedOpportunity {
  return {
    id: "id-1",
    opportunityType: "job",
    title: "Senior Product Designer",
    company: "Acme Inc",
    companyUrl: null,
    description: "We are hiring a product designer to own our core flows end to end.",
    url: "https://example.com/jobs/1",
    source: "remotive",
    sourceUrl: "https://example.com/jobs/1",
    sourceId: "1",
    employmentType: "full_time",
    employmentTypes: ["full_time"],
    locationText: "Worldwide",
    locationStatus: "worldwide",
    salaryText: "$1,500/month",
    salaryCurrency: "USD",
    salaryPeriod: "month",
    salaryMin: 1500,
    salaryMax: 1500,
    normalizedMonthlyMin: 1500,
    normalizedMonthlyMax: 1500,
    salaryStatus: "within_range",
    category: "product_design",
    tags: [],
    postedAt: "2026-01-01T00:00:00.000Z",
    discoveredAt: "2026-01-01T00:00:00.000Z",
    deadline: null,
    remoteStatus: "worldwide",
    applicationUrl: "https://example.com/apply/1",
    rawSourceData: null,
    verificationStatus: "likely",
    freshness: "active",
    duplicateFingerprint: "acme inc::product designer",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("validateOpportunity", () => {
  it("accepts a well-formed, design-relevant opportunity", () => {
    expect(validateOpportunity(makeOpportunity()).valid).toBe(true);
  });

  it("rejects internships", () => {
    const result = validateOpportunity(makeOpportunity({ title: "Product Design Intern" }));
    expect(result.valid).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/internship/);
  });

  it("rejects unpaid/volunteer roles", () => {
    const result = validateOpportunity(
      makeOpportunity({ description: "This is an unpaid volunteer opportunity for a good cause." })
    );
    expect(result.valid).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/unpaid/);
  });

  it("rejects senior roles requiring 5+ years of experience", () => {
    const result = validateOpportunity(
      makeOpportunity({ description: "You'll need 5 to 10 years of experience leading design teams." })
    );
    expect(result.valid).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/senior/);
  });

  it("accepts a 'Senior'-titled role whose stated requirement is below the threshold", () => {
    const result = validateOpportunity(
      makeOpportunity({ description: "You'll need 3+ years of experience leading design teams." })
    );
    expect(result.valid).toBe(true);
  });

  it("rejects titles that aren't design-relevant", () => {
    const result = validateOpportunity(
      makeOpportunity({ title: "Senior .NET Software Engineer", duplicateFingerprint: "acme inc::senior net software engineer" })
    );
    expect(result.valid).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/design role/);
  });

  it("rejects opportunities with no valid application/listing URL", () => {
    const result = validateOpportunity(makeOpportunity({ url: "not-a-url", applicationUrl: "not-a-url" }));
    expect(result.valid).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/URL/);
  });

  it("rejects a missing or too-short description", () => {
    const result = validateOpportunity(makeOpportunity({ description: "Too short" }));
    expect(result.valid).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/description/);
  });
});
