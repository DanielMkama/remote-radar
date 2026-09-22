/**
 * Source registry (Phase 2 §4). Every source the pipeline knows about,
 * whether active or planned. Adding a new source = write an adapter file
 * + add one line here; the pipeline (lib/opportunities/pipeline.ts) and
 * the admin page (app/admin/sources) both just iterate this list.
 */

import { PLANNED_ATS_SOURCES } from "./ats/planned-ats";
import { getOnBoardSource } from "./getonboard";
import { himalayasSource } from "./himalayas";
import { remoteOkSource } from "./remoteok";
import { remotiveSource } from "./remotive";
import type { OpportunitySource } from "./types";
import { weWorkRemotelySource } from "./weworkremotely";
import { wellfoundSource } from "./wellfound";

export const SOURCE_REGISTRY: OpportunitySource[] = [
  // Tier 1
  remotiveSource,
  himalayasSource,
  wellfoundSource, // planned
  // Tier 2
  getOnBoardSource, // planned
  remoteOkSource,
  weWorkRemotelySource,
  // Tier 3 — architecture only; no company boards registered by default.
  // See lib/sources/ats/greenhouse.ts and lever.ts to add one.
  ...PLANNED_ATS_SOURCES,
];

export function getEnabledSources(): OpportunitySource[] {
  return SOURCE_REGISTRY.filter((source) => source.status === "active");
}

export function getSourceById(id: string): OpportunitySource | undefined {
  return SOURCE_REGISTRY.find((source) => source.id === id);
}
