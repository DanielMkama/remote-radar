import { describe, expect, it } from "vitest";
import { opportunityToJob } from "./adapter";
import type { NormalizedOpportunity } from "./types";

function makeOpportunity(overrides: Partial<NormalizedOpportunity> = {}): NormalizedOpportunity {
  const now = new Date().toISOString();
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
    tags: [],
    postedAt: now,
    discoveredAt: now,
    deadline: null,
    remoteStatus: "worldwide",
    applicationUrl: "https://example.com/apply",
    rawSourceData: null,
    // Stored value deliberately stale/wrong, to prove opportunityToJob
    // doesn't just trust it.
    verificationStatus: "likely",
    freshness: "active",
    duplicateFingerprint: "acme inc::product designer",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("opportunityToJob", () => {
  it("is active for a recently-posted opportunity", () => {
    expect(opportunityToJob(makeOpportunity()).isActive).toBe(true);
  });

  it("disappears from the dashboard (isActive: false) once older than 30 days, regardless of the stored freshness column", () => {
    const oldDate = new Date(Date.now() - 45 * 86_400_000).toISOString();
    const job = opportunityToJob(
      makeOpportunity({ postedAt: oldDate, discoveredAt: oldDate, freshness: "active" })
    );
    expect(job.isActive).toBe(false);
    expect(job.freshness).toBe("expired");
  });

  it("stays active past 30 days when a future deadline says otherwise", () => {
    const oldDate = new Date(Date.now() - 45 * 86_400_000).toISOString();
    const futureDeadline = new Date(Date.now() + 5 * 86_400_000).toISOString();
    const job = opportunityToJob(
      makeOpportunity({ postedAt: oldDate, discoveredAt: oldDate, deadline: futureDeadline })
    );
    expect(job.isActive).toBe(true);
  });
});
