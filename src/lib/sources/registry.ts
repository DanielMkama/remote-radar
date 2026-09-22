/**
 * Source registry (Phase 2 §4). Every source the pipeline knows about,
 * whether active or planned. Adding a new source = write an adapter file
 * + add one line here; the pipeline (lib/opportunities/pipeline.ts) and
 * the admin page (app/admin/sources) both just iterate this list.
 */

import { createAshbySource } from "./ats/ashby";
import { createGreenhouseSource } from "./ats/greenhouse";
import { createLeverSource } from "./ats/lever";
import { PLANNED_ATS_SOURCES } from "./ats/planned-ats";
import { getOnBoardSource } from "./getonboard";
import { himalayasSource } from "./himalayas";
import { hiringCafeSource } from "./hiringcafe";
import { remoteOkSource } from "./remoteok";
import { remotiveSource } from "./remotive";
import type { OpportunitySource } from "./types";
import { weWorkRemotelySource } from "./weworkremotely";
import { wellfoundSource } from "./wellfound";

// Tier 3 company boards. Each of these was verified live (a real 200
// response with actual job data, not just a guessed slug) before being
// registered — see lib/sources/ats/greenhouse.ts, lever.ts, ashby.ts for
// why that matters (a wrong board slug returns an empty list, not an
// error, so an unverified one would silently contribute nothing forever).
const COMPANY_ATS_SOURCES: OpportunitySource[] = [
  createGreenhouseSource("canonical", "Canonical"),
  createGreenhouseSource("remotecom", "Remote.com"),
  createGreenhouseSource("wikimedia", "Wikimedia Foundation"),
  createGreenhouseSource("moniepoint", "Moniepoint"),
  createLeverSource("superside", "Superside"),
  createAshbySource("flipper", "Flipper Devices"),
  createAshbySource("duck-duck-go", "DuckDuckGo"),
];

export const SOURCE_REGISTRY: OpportunitySource[] = [
  // Tier 1
  remotiveSource,
  himalayasSource,
  wellfoundSource, // planned
  // Tier 2
  getOnBoardSource, // planned
  remoteOkSource,
  weWorkRemotelySource,
  hiringCafeSource, // planned
  // Tier 3 — verified company boards, plus the generic architecture for
  // adding more. See lib/sources/ats/greenhouse.ts, lever.ts and ashby.ts.
  ...COMPANY_ATS_SOURCES,
  ...PLANNED_ATS_SOURCES,
];

export function getEnabledSources(): OpportunitySource[] {
  return SOURCE_REGISTRY.filter((source) => source.status === "active");
}

export function getSourceById(id: string): OpportunitySource | undefined {
  return SOURCE_REGISTRY.find((source) => source.id === id);
}
