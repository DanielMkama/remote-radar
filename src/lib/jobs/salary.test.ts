import { describe, expect, it } from "vitest";
import { toMonthlyEstimate } from "./salary";

describe("toMonthlyEstimate", () => {
  it("converts hourly to monthly (documented assumption: 40hr/week, 52wk/year)", () => {
    // Phase 2 §23: $12/hour → approximately $2,080/month
    expect(toMonthlyEstimate(12, "hour")).toBeCloseTo(2080, 0);
  });

  it("converts yearly to monthly", () => {
    // Phase 2 §23: $40,000/year → approximately $3,333/month
    expect(toMonthlyEstimate(40000, "year")).toBeCloseTo(3333.33, 1);
  });

  it("passes monthly through unchanged", () => {
    expect(toMonthlyEstimate(1500, "month")).toBe(1500);
  });

  it("returns null when amount or period is missing", () => {
    expect(toMonthlyEstimate(null, "month")).toBeNull();
    expect(toMonthlyEstimate(1500, null)).toBeNull();
    expect(toMonthlyEstimate(undefined, undefined)).toBeNull();
  });
});
