import { describe, expect, it } from "vitest";
import { isDesignRelevant } from "./relevance";

describe("isDesignRelevant", () => {
  it("matches target design role titles", () => {
    expect(isDesignRelevant("Senior Product Designer")).toBe(true);
    expect(isDesignRelevant("UI/UX Designer")).toBe(true);
    expect(isDesignRelevant("Art Director")).toBe(true);
  });

  it("rejects unrelated titles even when a description mentions 'design'", () => {
    // Phase 2 §12: avoid unrelated jobs simply because their description
    // contains the word "design" — this function only ever sees the title.
    expect(isDesignRelevant("Senior .NET Software Engineer")).toBe(false);
    expect(isDesignRelevant("Backend Engineer")).toBe(false);
  });
});
