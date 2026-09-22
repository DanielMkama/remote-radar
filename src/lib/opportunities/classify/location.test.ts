import { describe, expect, it } from "vitest";
import { classifyLocation } from "./location";

describe("classifyLocation", () => {
  it("classifies explicit worldwide language as worldwide", () => {
    // Phase 2 §23 examples
    expect(classifyLocation({ locationText: "Remote only • Everywhere" })).toBe("worldwide");
    expect(
      classifyLocation({ locationText: "Open to candidates from all countries" })
    ).toBe("worldwide");
    expect(classifyLocation({ locationText: "Work from anywhere" })).toBe("worldwide");
    expect(classifyLocation({ locationText: "Worldwide" })).toBe("worldwide");
  });

  it("classifies a named single country as country_restricted, not worldwide", () => {
    // Phase 2 §23 examples
    expect(classifyLocation({ locationText: "Remote — United States" })).toBe(
      "country_restricted"
    );
    expect(classifyLocation({ locationText: "Candidates must reside in Canada" })).toBe(
      "country_restricted"
    );
  });

  it("classifies a named region as region_restricted", () => {
    expect(classifyLocation({ locationText: "Remote — Europe" })).toBe("region_restricted");
    expect(classifyLocation({ locationText: "Remote — LATAM" })).toBe("region_restricted");
  });

  it("classifies timezone wording as timezone_restricted, even when it names a country", () => {
    // "US time zones only" mentions a country (US) but describes a timezone
    // constraint, not a residency one — timezone must win.
    expect(classifyLocation({ locationText: "US time zones only" })).toBe("timezone_restricted");
  });

  it("does not assume bare 'Remote' means worldwide", () => {
    // Phase 2 §23: Remote → location_unclear unless additional evidence exists
    expect(classifyLocation({ locationText: "Remote" })).toBe("location_unclear");
  });

  it("treats missing location text as location_unclear", () => {
    expect(classifyLocation({ locationText: null })).toBe("location_unclear");
    expect(classifyLocation({})).toBe("location_unclear");
  });

  it("picks up worldwide wording from extra text (e.g. description) too", () => {
    expect(
      classifyLocation({ locationText: "Remote", extraText: "We hire from anywhere in the world." })
    ).toBe("worldwide");
  });
});
