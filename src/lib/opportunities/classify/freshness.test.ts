import { describe, expect, it } from "vitest";
import { classifyFreshness, MAX_ACTIVE_AGE_DAYS } from "./freshness";

const NOW = new Date("2026-02-01T00:00:00.000Z");

describe("classifyFreshness", () => {
  it("stays active within the 30-day window", () => {
    const postedAt = new Date(NOW.getTime() - (MAX_ACTIVE_AGE_DAYS - 1) * 86_400_000).toISOString();
    expect(classifyFreshness({ postedAt, discoveredAt: postedAt, now: NOW })).toBe("active");
  });

  it("expires once older than 30 days with no deadline given", () => {
    const postedAt = new Date(NOW.getTime() - (MAX_ACTIVE_AGE_DAYS + 1) * 86_400_000).toISOString();
    expect(classifyFreshness({ postedAt, discoveredAt: postedAt, now: NOW })).toBe("expired");
  });

  it("treats exactly 30 days old as still active (cutoff is 'more than 30')", () => {
    const postedAt = new Date(NOW.getTime() - MAX_ACTIVE_AGE_DAYS * 86_400_000).toISOString();
    expect(classifyFreshness({ postedAt, discoveredAt: postedAt, now: NOW })).toBe("active");
  });

  it("an explicit deadline overrides the age cutoff", () => {
    const postedAt = new Date(NOW.getTime() - 60 * 86_400_000).toISOString(); // 60 days old
    const futureDeadline = new Date(NOW.getTime() + 5 * 86_400_000).toISOString();
    expect(
      classifyFreshness({ postedAt, discoveredAt: postedAt, deadline: futureDeadline, now: NOW })
    ).toBe("active");
  });

  it("a past deadline expires the listing even if recently posted", () => {
    const postedAt = NOW.toISOString();
    const pastDeadline = new Date(NOW.getTime() - 86_400_000).toISOString();
    expect(
      classifyFreshness({ postedAt, discoveredAt: postedAt, deadline: pastDeadline, now: NOW })
    ).toBe("expired");
  });

  it("marks a listing no longer returned by its source as closed", () => {
    expect(
      classifyFreshness({ postedAt: NOW.toISOString(), discoveredAt: NOW.toISOString(), removedFromSource: true, now: NOW })
    ).toBe("closed");
  });
});
