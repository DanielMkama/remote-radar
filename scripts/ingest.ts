#!/usr/bin/env -S npx tsx
/**
 * `npm run ingest` — manual ingestion run (Phase 2 §19).
 *
 * Runs entirely outside Next.js (plain Node via tsx), so it loads
 * .env.local itself. If Supabase credentials aren't configured, it still
 * fetches, normalizes, classifies, and validates every enabled source
 * (a "dry run") and prints the same report — it just skips the database
 * write step and says so, rather than failing outright. That's
 * deliberate: it means this command is useful for checking a source
 * adapter works even before a Supabase project is wired up.
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  // Imported after env vars are loaded, and dynamically so a missing
  // Supabase config doesn't crash the import graph before we can decide
  // whether to run in dry-run mode.
  const { runIngestion } = await import("../src/lib/opportunities/pipeline");
  const { getSupabaseAdminClient } = await import("../src/lib/supabase/admin");
  const { getEnabledSources, SOURCE_REGISTRY } = await import("../src/lib/sources/registry");

  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log("Remote Design Radar — ingestion\n");

  const plannedSources = SOURCE_REGISTRY.filter((s) => s.status !== "active");
  if (plannedSources.length > 0) {
    console.log(`Skipping ${plannedSources.length} planned (not-yet-implemented) source(s): ${plannedSources.map((s) => s.name).join(", ")}\n`);
  }

  if (!hasSupabaseConfig) {
    console.log(
      "No Supabase credentials found in .env.local — running in DRY RUN mode.\n" +
        "Sources will be fetched and classified, but nothing will be written to a database.\n"
    );
  }

  const client = hasSupabaseConfig ? getSupabaseAdminClient() : null;
  const sources = getEnabledSources();

  if (sources.length === 0) {
    console.log("No active sources configured. Nothing to do.");
    return;
  }

  const summary = await runIngestion({ client });

  for (const r of summary.results) {
    console.log(r.sourceName);
    if (r.status === "error") {
      console.log(`  ERROR: ${r.errorMessage}\n`);
      continue;
    }
    console.log(`  fetched: ${r.fetched}`);
    console.log(`  design opportunities: ${r.designOpportunities}`);
    console.log(`  worldwide: ${r.worldwide}`);
    console.log(`  salary in range: ${r.salaryInRange}`);
    if (client) {
      console.log(`  new: ${r.newCount}`);
      console.log(`  updated: ${r.updatedCount}`);
      console.log(`  duplicates: ${r.duplicateCount}`);
    }
    if (r.rejected > 0) {
      console.log(`  rejected (not design-relevant / internship / unpaid / invalid): ${r.rejected}`);
    }
    console.log("");
  }

  console.log("Total");
  console.log(`  fetched: ${summary.totals.fetched}`);
  console.log(`  design opportunities: ${summary.totals.designOpportunities}`);
  console.log(`  worldwide: ${summary.totals.worldwide}`);
  console.log(`  within salary range: ${summary.totals.salaryInRange}`);
  if (client) {
    console.log(`  new: ${summary.totals.newCount}`);
    console.log(`  updated: ${summary.totals.updatedCount}`);
    console.log(`  duplicates: ${summary.totals.duplicateCount}`);
  } else {
    console.log("\n  (dry run — nothing was written to Supabase)");
  }

  const failedSources = summary.results.filter((r) => r.status === "error");
  if (failedSources.length > 0) {
    console.log(`\n${failedSources.length} source(s) failed but did not stop the others:`);
    for (const f of failedSources) console.log(`  - ${f.sourceName}: ${f.errorMessage}`);
  }
}

main().catch((err) => {
  console.error("Ingestion run crashed:", err);
  process.exit(1);
});
