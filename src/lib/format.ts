/** Presentation helpers shared across job cards and detail views. */

/** "Today", "3 days ago", "2 weeks ago" style relative label for a date string. */
export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return "1 month ago";
  return `${Math.floor(diffDays / 30)} months ago`;
}

/** Absolute date label, e.g. "Sep 21, 2026", for tooltips/detail pages. */
export function formatAbsoluteDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const JOB_TYPE_LABELS: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  freelance: "Freelance",
  internship: "Internship",
  unspecified: "Unspecified",
};

export function formatJobType(jobType: string): string {
  return JOB_TYPE_LABELS[jobType] ?? jobType;
}

const CATEGORY_LABELS: Record<string, string> = {
  "graphic-design": "Graphic Design",
  "ui-design": "UI Design",
  "ux-design": "UX Design",
  "visual-design": "Visual Design",
  "product-design": "Product Design",
  "brand-design": "Brand Design",
  "web-design": "Web Design",
  "marketing-design": "Marketing Design",
  "creative-design": "Creative Design",
  "content-design": "Content Design",
  other: "Other",
};

export function formatCategory(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

const SOURCE_LABELS: Record<string, string> = {
  remotive: "Remotive",
  himalayas: "Himalayas",
  remoteok: "Remote OK",
  weworkremotely: "We Work Remotely",
  wellfound: "Wellfound",
  getonboard: "Get on Board",
  greenhouse: "Greenhouse",
  lever: "Lever",
};

export function formatSource(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}
