/**
 * Core domain types for the Grants section — funding opportunities
 * (grants, fellowships, prizes, accelerator cash) for creative, tech,
 * business and community projects.
 *
 * Deliberately its own module, not layered onto src/lib/opportunities/:
 * that module's "Opportunity" already means job/contract/freelance
 * listings throughout this codebase. A grant has a different shape
 * (funding amount instead of salary, a real application window instead of
 * an optional deadline, eligibility instead of employment type) and a
 * different ingestion pattern (curated/manually-researched data, not a
 * public per-source API) — see src/lib/grants/sources/curated-grants.ts.
 */

export type GrantCategory =
  | "arts_music"
  | "arts_visual_photography"
  | "arts_film_media"
  | "arts_theater_performance"
  | "arts_multidisciplinary"
  | "arts_residencies"
  | "business_creative_entrepreneur"
  | "tech_nonprofit_tech"
  | "community_civic"
  | "other";

export const GRANT_CATEGORIES: { value: GrantCategory; label: string }[] = [
  { value: "arts_music", label: "Arts – Music" },
  { value: "arts_visual_photography", label: "Arts – Visual/Photography" },
  { value: "arts_film_media", label: "Arts – Film/Media" },
  { value: "arts_theater_performance", label: "Arts – Theater/Performance" },
  { value: "arts_multidisciplinary", label: "Arts – Multidisciplinary" },
  { value: "arts_residencies", label: "Arts – Residencies & Mobility" },
  { value: "business_creative_entrepreneur", label: "Creative Entrepreneur / Business" },
  { value: "tech_nonprofit_tech", label: "Tech / Nonprofit Tech" },
  { value: "community_civic", label: "Community & Civic Projects" },
  { value: "other", label: "Other" },
];

/**
 * Lifecycle state, recomputed at read time from opensAt/deadline/isRolling
 * (mirrors src/lib/opportunities/classify/freshness.ts's approach) so a
 * listing flips from "open" to "closed" automatically as its deadline
 * passes, without needing a fresh ingestion run to notice.
 */
export type GrantStatus = "open" | "closed" | "upcoming" | "rolling" | "unknown";

export const GRANT_STATUSES: { value: GrantStatus; label: string }[] = [
  { value: "open", label: "Open now" },
  { value: "upcoming", label: "Opens soon" },
  { value: "rolling", label: "Rolling / ongoing" },
  { value: "closed", label: "Closed" },
  { value: "unknown", label: "Unknown" },
];

export interface GrantAmount {
  /** Original, exactly as stated by the source. Never overwritten with an estimate. */
  text: string | null;
  currency: string | null;
  min: number | null;
  max: number | null;
}

export interface Grant {
  id: string;
  title: string;
  organization: string;
  organizationUrl: string | null;
  description: string;

  url: string;
  applicationUrl: string;
  source: string;

  category: GrantCategory;
  tags: string[];

  /** Original "who can apply / where" text — never discarded, since eligibility rules are too varied to fully structure. */
  eligibilityText: string | null;
  /** Original "eligible disciplines / focus areas" text. */
  focusText: string | null;

  amount: GrantAmount;

  /** Original application-window text, e.g. "Open Sep 1-Oct 28, 2026". Always shown, even when parsing below is imprecise. */
  windowText: string | null;
  opensAt: string | null;
  deadline: string | null;
  isRolling: boolean;
  status: GrantStatus;

  postedAt: string | null;
  discoveredAt: string;
  createdAt: string;
  updatedAt: string;

  /** How many distinct sources reported this same grant (see lib/grants/dedupe.ts). */
  sourceCount?: number;
}

export type GrantSortOption = "deadline-asc" | "newest" | "amount-desc" | "title-asc";

export interface GrantFilters {
  search?: string;
  categories?: GrantCategory[];
  statuses?: GrantStatus[];
}
