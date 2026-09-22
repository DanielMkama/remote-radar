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

  describe("a specific location field is not overridden by generic worldwide language elsewhere", () => {
    // Phase 3B audit found this exact bug on real ingested data across
    // three unrelated sources: a structured location field explicitly
    // said EMEA/LATAM/India/a specific city, but the job description's
    // generic company-culture boilerplate ("global enterprise",
    // "compensation worldwide", "top global brands") made the combined
    // text match a worldwide pattern, incorrectly overriding it.
    it("Greenhouse-style: 'Home based - EMEA' + a description mentioning 'worldwide' compensation", () => {
      expect(
        classifyLocation({
          locationText: "Home based - EMEA",
          extraText: "Our approach to experience and performance in shaping compensation worldwide.",
        })
      ).toBe("region_restricted");
    });

    it("Lever-style: 'LATAM' + a description mentioning 'global' brands", () => {
      expect(
        classifyLocation({
          locationText: "LATAM",
          extraText: "You'll partner with top global brands on bold campaigns.",
        })
      ).toBe("region_restricted");
    });

    it("RemoteOK-style: a bare country + a description mentioning a 'global, remote-first' company", () => {
      expect(
        classifyLocation({
          locationText: "India",
          extraText: "We operate as a global, remote-first organization built for speed.",
        })
      ).toBe("country_restricted");
    });

    it("still resolves worldwide from the description when the location field itself is uninformative", () => {
      // Unchanged behavior: a bare "Remote" location field has no signal
      // of its own, so a clarifying description still counts.
      expect(
        classifyLocation({
          locationText: "Remote",
          extraText: "This is a global, remote-first company — work from anywhere in the world.",
        })
      ).toBe("worldwide");
    });

    it("still resolves worldwide when the location field itself explicitly says so", () => {
      expect(classifyLocation({ locationText: "Global" })).toBe("worldwide");
    });
  });
});
