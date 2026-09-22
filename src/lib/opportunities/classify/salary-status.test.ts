import { describe, expect, it } from "vitest";
import { classifySalaryStatus, classifySalaryStatusFromOriginal } from "./salary-status";

describe("classifySalaryStatus", () => {
  it("treats the boundary values as within_range", () => {
    // Phase 2 §23: $500/month → within_range, $2,000/month → within_range
    expect(classifySalaryStatus(500, 500)).toBe("within_range");
    expect(classifySalaryStatus(2000, 2000)).toBe("within_range");
  });

  it("treats just outside the boundary as below/above range", () => {
    // Phase 2 §23: $499/month → below_range, $2,001/month → above_range
    expect(classifySalaryStatus(499, 499)).toBe("below_range");
    expect(classifySalaryStatus(2001, 2001)).toBe("above_range");
  });

  it("is unknown when no salary data is present", () => {
    expect(classifySalaryStatus(null, null)).toBe("unknown");
  });

  it("counts a partial overlap with the target range as within_range", () => {
    expect(classifySalaryStatus(1800, 2500)).toBe("within_range");
  });
});

describe("classifySalaryStatusFromOriginal", () => {
  it("normalizes $12/hour before classifying (~$2,080/mo, just above the $2,000 ceiling)", () => {
    expect(classifySalaryStatusFromOriginal(12, 12, "hour")).toBe("above_range");
  });

  it("normalizes a lower hourly rate that does land within range", () => {
    // $10/hour → ~$1,733/mo, within $500-$2,000
    expect(classifySalaryStatusFromOriginal(10, 10, "hour")).toBe("within_range");
  });

  it("normalizes $40,000/year before classifying (~$3,333/mo, above range)", () => {
    expect(classifySalaryStatusFromOriginal(40000, 40000, "year")).toBe("above_range");
  });
});
