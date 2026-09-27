/**
 * Grant filtering + sorting (mirrors src/lib/jobs/filters.ts). Operates on
 * in-memory `Grant[]` arrays, whether they came from Supabase or the
 * fallback curated data.
 */

import type { Grant, GrantFilters, GrantSortOption } from "./types";

export const DEFAULT_FILTERS: GrantFilters = {
  search: "",
  categories: [],
  statuses: [],
};

export function grantMatchesFilters(grant: Grant, filters: GrantFilters): boolean {
  if (filters.search && filters.search.trim().length > 0) {
    const q = filters.search.trim().toLowerCase();
    const haystack = `${grant.title} ${grant.organization} ${grant.focusText ?? ""} ${grant.tags.join(" ")}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }

  if (filters.categories && filters.categories.length > 0) {
    if (!filters.categories.includes(grant.category)) return false;
  }

  if (filters.statuses && filters.statuses.length > 0) {
    if (!filters.statuses.includes(grant.status)) return false;
  }

  return true;
}

export function filterGrants(grants: Grant[], filters: GrantFilters): Grant[] {
  return grants.filter((grant) => grantMatchesFilters(grant, filters));
}

/** Best-known funding figure for a grant, used to rank grants with partial amount data. */
function amountRank(grant: Grant): number {
  const { min, max } = grant.amount;
  if (max != null) return max;
  if (min != null) return min;
  return -1;
}

export function sortGrants(grants: Grant[], sortBy: GrantSortOption): Grant[] {
  const sorted = [...grants];
  switch (sortBy) {
    case "deadline-asc":
      return sorted.sort((a, b) => {
        // Grants with no known deadline (rolling/unknown) sort after ones with a real date.
        if (a.deadline == null && b.deadline == null) return 0;
        if (a.deadline == null) return 1;
        if (b.deadline == null) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
    case "newest":
      return sorted.sort((a, b) => new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime());
    case "amount-desc":
      return sorted.sort((a, b) => amountRank(b) - amountRank(a));
    case "title-asc":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return sorted;
  }
}

export function applyGrantFilters(grants: Grant[], filters: GrantFilters, sortBy: GrantSortOption): Grant[] {
  return sortGrants(filterGrants(grants, filters), sortBy);
}
