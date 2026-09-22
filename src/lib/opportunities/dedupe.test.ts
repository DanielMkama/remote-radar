import { describe, expect, it } from "vitest";
import { buildDuplicateFingerprint, mergeDuplicate } from "./dedupe";
import type { NormalizedOpportunity } from "./types";

function makeOpportunity(overrides: Partial<NormalizedOpportunity> = {}): NormalizedOpportunity {
  return {
    id: "id-1",
    opportunityType: "job",
    title: "Product Designer",
    company: "Acme Inc",
    companyUrl: null,
    description: "A design role.",
    url: "https://example.com/job",
    source: "remotive",
    sourceUrl: "https://example.com/job",
    sourceId: null,
    employmentType: "full_time",
    employmentTypes: ["full_time"],
    locationText: "Worldwide",
    locationStatus: "worldwide",
    salaryText: null,
    salaryCurrency: "USD",
    salaryPeriod: null,
    salaryMin: null,
    salaryMax: null,
    normalizedMonthlyMin: null,
    normalizedMonthlyMax: null,
    salaryStatus: "unknown",
    category: "product_design",
    tags: ["ux"],
    postedAt: "2026-01-01T00:00:00.000Z",
    discoveredAt: "2026-01-01T00:00:00.000Z",
    deadline: null,
    remoteStatus: "worldwide",
    applicationUrl: "https://example.com/apply",
    rawSourceData: null,
    verificationStatus: "likely",
    freshness: "active",
    duplicateFingerprint: "acme inc::product designer",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildDuplicateFingerprint", () => {
  it("produces the same fingerprint for the same company/title across sources", () => {
    // Phase 2 §15/§23: the same job posted with different casing/seniority
    // wording on multiple boards must resolve to the same fingerprint.
    const a = buildDuplicateFingerprint("Acme Inc", "Senior Product Designer");
    const b = buildDuplicateFingerprint("ACME INC", "Product Designer (Remote)");
    expect(a).toBe(b);
  });

  it("produces different fingerprints for genuinely different roles", () => {
    const a = buildDuplicateFingerprint("Acme Inc", "Product Designer");
    const b = buildDuplicateFingerprint("Acme Inc", "Brand Designer");
    expect(a).not.toBe(b);
  });
});

describe("mergeDuplicate", () => {
  it("prefers a direct company ATS listing as canonical over a job board", () => {
    const existing = makeOpportunity({ id: "existing-id", source: "remotive", tags: ["ux"] });
    const incoming = makeOpportunity({
      id: "incoming-id",
      source: "greenhouse:acme",
      tags: ["product-design"],
      description: "Direct company posting.",
    });

    const merged = mergeDuplicate(existing, incoming, "job_board", "company_ats");

    expect(merged.id).toBe("existing-id"); // DB row identity never changes
    expect(merged.source).toBe("greenhouse:acme"); // but canonical source becomes the ATS
    expect(merged.tags.sort()).toEqual(["product-design", "ux"].sort()); // union of tags
  });

  it("keeps the existing job board as canonical when the incoming source isn't higher priority", () => {
    const existing = makeOpportunity({ id: "existing-id", source: "remotive" });
    const incoming = makeOpportunity({ id: "incoming-id", source: "himalayas" });

    const merged = mergeDuplicate(existing, incoming, "job_board", "job_board");

    expect(merged.source).toBe("remotive");
  });
});
