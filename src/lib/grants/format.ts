/** Presentation helpers for grant cards and the detail view (mirrors src/lib/format.ts). */

import type { Grant, GrantCategory, GrantStatus } from "./types";

const CATEGORY_LABELS: Record<GrantCategory, string> = {
  arts_music: "Arts – Music",
  arts_visual_photography: "Arts – Visual/Photography",
  arts_film_media: "Arts – Film/Media",
  arts_theater_performance: "Arts – Theater/Performance",
  arts_multidisciplinary: "Arts – Multidisciplinary",
  arts_residencies: "Arts – Residencies & Mobility",
  business_creative_entrepreneur: "Creative Entrepreneur / Business",
  tech_nonprofit_tech: "Tech / Nonprofit Tech",
  community_civic: "Community & Civic",
  other: "Other",
};

export function formatGrantCategory(category: string): string {
  return CATEGORY_LABELS[category as GrantCategory] ?? category;
}

const STATUS_LABELS: Record<GrantStatus, string> = {
  open: "Open now",
  upcoming: "Opens soon",
  rolling: "Rolling / ongoing",
  closed: "Closed",
  unknown: "Check site",
};

export function formatGrantStatus(status: string): string {
  return STATUS_LABELS[status as GrantStatus] ?? status;
}

/** Formats a grant's funding amount, preferring the source's own wording over the parsed numbers. */
export function formatGrantAmount(amount: Grant["amount"]): string {
  if (amount.text) return amount.text;

  if (amount.min != null || amount.max != null) {
    const currency = amount.currency ?? "USD";
    const fmt = (n: number) => `${currency} ${n.toLocaleString("en-US")}`;
    if (amount.min != null && amount.max != null && amount.min !== amount.max) {
      return `${fmt(amount.min)}–${fmt(amount.max)}`;
    }
    return fmt(amount.max ?? amount.min ?? 0);
  }

  return "Amount not stated";
}

/** "Deadline: Oct 15, 2026" style label for a grant's structured deadline, falling back to its original window text. */
export function formatGrantDeadline(grant: Pick<Grant, "deadline" | "opensAt" | "isRolling" | "windowText">): string {
  if (grant.deadline) {
    const date = new Date(grant.deadline);
    if (!Number.isNaN(date.getTime())) {
      const label = date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
      return `Deadline: ${label}`;
    }
  }
  if (grant.opensAt) {
    const date = new Date(grant.opensAt);
    if (!Number.isNaN(date.getTime())) {
      const label = date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
      return `Opens: ${label}`;
    }
  }
  if (grant.isRolling) return "Rolling";
  return grant.windowText ?? "See application window";
}
