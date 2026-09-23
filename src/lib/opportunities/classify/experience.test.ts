import { describe, expect, it } from "vitest";
import { minYearsExperienceRequired, requiresSeniorExperience } from "./experience";

describe("requiresSeniorExperience", () => {
  it("flags an explicit range like '5 to 10 years'", () => {
    expect(requiresSeniorExperience("Requires 5 to 10 years of experience")).toBe(true);
  });

  it("flags a dash range and a plus form", () => {
    expect(requiresSeniorExperience("7-9 years of experience")).toBe(true);
    expect(requiresSeniorExperience("5+ years of experience")).toBe(true);
  });

  it("allows filler words between 'years' and 'experience'", () => {
    expect(requiresSeniorExperience("6+ years of relevant industry experience")).toBe(true);
  });

  it("does not flag junior-level requirements below the threshold", () => {
    expect(requiresSeniorExperience("4+ years of UI design experience")).toBe(false);
    expect(requiresSeniorExperience("2-3 years of experience")).toBe(false);
  });

  it("does not flag unrelated mentions of years", () => {
    expect(requiresSeniorExperience("We've been fully remote for 10 years.")).toBe(false);
    expect(requiresSeniorExperience("Founded 10 years ago in Berlin.")).toBe(false);
    expect(requiresSeniorExperience(null)).toBe(false);
  });

  it("uses the range's lower bound as the required minimum", () => {
    expect(minYearsExperienceRequired("5 to 10 years of experience")).toBe(5);
  });
});
