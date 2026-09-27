/**
 * Grant source registry (mirrors src/lib/sources/registry.ts). Adding a
 * new source later — a real scraper/API for a specific funder or
 * aggregator — means writing one new file implementing GrantSource +
 * adding it here; the pipeline never needs to change.
 */

import type { GrantSource } from "../source-types";
import { curatedGrantsSource } from "./curated";

export const GRANT_SOURCE_REGISTRY: GrantSource[] = [curatedGrantsSource];

export function getEnabledGrantSources(): GrantSource[] {
  return GRANT_SOURCE_REGISTRY.filter((s) => s.status === "active");
}
