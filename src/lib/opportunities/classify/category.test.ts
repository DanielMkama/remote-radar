import { describe, expect, it } from "vitest";
import { classifyCategory } from "./category";

describe("classifyCategory", () => {
  it("maps representative design titles to the expected category", () => {
    // Phase 2 §23 / §11 example
    expect(classifyCategory("Senior Brand Designer").category).toBe("brand_design");
    expect(classifyCategory("UX Designer").category).toBe("ux_design");
    expect(classifyCategory("UI Designer").category).toBe("ui_design");
    expect(classifyCategory("Product Designer").category).toBe("product_design");
    expect(classifyCategory("Graphic Designer").category).toBe("graphic_design");
    expect(classifyCategory("Motion Designer").category).toBe("motion_design");
    expect(classifyCategory("Art Director").category).toBe("art_direction");
    expect(classifyCategory("Creative Director").category).toBe("creative_direction");
  });

  it("derives descriptive tags from title + description", () => {
    // Phase 2 §11 worked example
    const { category, tags } = classifyCategory(
      "Senior Brand Designer",
      "Own our visual identity and branding across marketing and graphic design deliverables."
    );
    expect(category).toBe("brand_design");
    expect(tags).toContain("branding");
    expect(tags).toContain("marketing");
  });

  it("falls back to 'other' when nothing matches", () => {
    expect(classifyCategory("Senior .NET Software Engineer").category).toBe("other");
  });
});
