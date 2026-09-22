/**
 * Design category + tag classification (Phase 2 §11). Deterministic
 * keyword rules, checked against the title first (most reliable signal),
 * ordered from most specific to most generic so e.g. "Senior Brand
 * Designer" resolves to brand_design rather than the more generic
 * graphic_design.
 *
 * A few of the Phase 2 §12 "relevant title" roles (Digital Designer,
 * Communication Designer, Creative Designer) don't have their own bucket
 * in the §11 category list — they're mapped to the closest existing
 * category (documented inline) rather than left as "other", since they
 * did pass the relevance check and are genuinely design roles.
 */

import type { DesignCategory } from "../types";

const CATEGORY_PATTERNS: Array<{ category: DesignCategory; pattern: RegExp }> = [
  { category: "brand_design", pattern: /\bbrand(?:ing)?\b/i },
  { category: "motion_design", pattern: /\bmotion\b|\banimat(?:or|ion)\b/i },
  { category: "creative_direction", pattern: /\bcreative direct(?:or|ion)\b|\bhead of creative\b|\bhead of design\b/i },
  { category: "art_direction", pattern: /\bart direct(?:or|ion)\b/i },
  { category: "illustration", pattern: /\billustrat(?:or|ion)\b/i },
  { category: "presentation_design", pattern: /\bpresentation designers?\b|\bdeck designers?\b/i },
  { category: "product_design", pattern: /\bproduct designers?\b/i },
  { category: "ux_design", pattern: /\bux designers?\b|\bux\/ui\b|\buser experience designers?\b/i },
  { category: "ui_design", pattern: /\bui designers?\b|\bui\/ux\b|\buser interface designers?\b/i },
  { category: "web_design", pattern: /\bweb designers?\b/i },
  { category: "marketing_design", pattern: /\bmarketing designers?\b/i },
  { category: "content_design", pattern: /\bcontent designers?\b/i },
  { category: "graphic_design", pattern: /\bgraphic designers?\b/i },
  // Hybrid/generalist titles that passed the relevance check but don't map
  // to a more specific bucket above — grouped under visual_design.
  { category: "visual_design", pattern: /\bvisual designers?\b|\bdigital designers?\b|\bcommunication designers?\b|\bcreative designers?\b/i },
];

const TAG_KEYWORDS: Array<{ tag: string; pattern: RegExp }> = [
  { tag: "branding", pattern: /\bbrand(?:ing)?\b/i },
  { tag: "visual-identity", pattern: /\bvisual identity\b/i },
  { tag: "typography", pattern: /\btypograph\w*\b/i },
  { tag: "illustration", pattern: /\billustrat\w*\b/i },
  { tag: "motion", pattern: /\bmotion\b|\banimat\w*\b/i },
  { tag: "ui", pattern: /\bui\b/i },
  { tag: "ux", pattern: /\bux\b/i },
  { tag: "web-design", pattern: /\bweb design\w*\b/i },
  { tag: "marketing", pattern: /\bmarketing\b/i },
  { tag: "content-design", pattern: /\bcontent design\w*\b/i },
  { tag: "product-design", pattern: /\bproduct design\w*\b/i },
  { tag: "art-direction", pattern: /\bart direct\w*\b/i },
  { tag: "presentation", pattern: /\bpresentation\b|\bdeck design\w*\b/i },
  { tag: "graphic-design", pattern: /\bgraphic design\w*\b/i },
];

export interface CategoryClassification {
  category: DesignCategory;
  tags: string[];
}

/**
 * Classifies a design category from the title (falling back to the
 * description if the title alone doesn't match — this should be rare
 * since callers are expected to have already run isDesignRelevant on the
 * title), plus derives a small set of descriptive tags from title +
 * description. Does not require the title to have passed relevance —
 * callers that skip that check will just get "other".
 */
export function classifyCategory(title: string, description = ""): CategoryClassification {
  const match =
    CATEGORY_PATTERNS.find(({ pattern }) => pattern.test(title)) ??
    CATEGORY_PATTERNS.find(({ pattern }) => pattern.test(description));

  const category = match?.category ?? "other";

  const tagSource = `${title} ${description}`;
  const tags = TAG_KEYWORDS.filter(({ pattern }) => pattern.test(tagSource)).map(({ tag }) => tag);

  return { category, tags: Array.from(new Set(tags)).slice(0, 6) };
}
