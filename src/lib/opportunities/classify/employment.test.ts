import { describe, expect, it } from "vitest";
import { classifyEmploymentTypes, classifyPrimaryEmploymentType } from "./employment";

describe("classifyPrimaryEmploymentType", () => {
  // Phase 2 §23 examples
  it("maps common wording to the normalized type", () => {
    expect(classifyPrimaryEmploymentType("Full-time")).toBe("full_time");
    expect(classifyPrimaryEmploymentType("Part-time")).toBe("part_time");
    expect(classifyPrimaryEmploymentType("Contract")).toBe("contract");
    expect(classifyPrimaryEmploymentType("Freelance")).toBe("freelance");
  });

  it("returns unknown when nothing matches", () => {
    expect(classifyPrimaryEmploymentType("Senior Designer")).toBe("unknown");
    expect(classifyPrimaryEmploymentType(null)).toBe("unknown");
  });
});

describe("classifyEmploymentTypes", () => {
  it("preserves both types when a listing mentions full-time and part-time", () => {
    expect(classifyEmploymentTypes("Full-time or Part-time")).toEqual(["full_time", "part_time"]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(classifyEmploymentTypes("Senior Designer")).toEqual([]);
  });
});
