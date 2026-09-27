#!/usr/bin/env -S npx tsx
/**
 * `npm run ingest:grants` — manual grants ingestion run (mirrors
 * scripts/ingest.ts for jobs).
 *
 * Runs entirely outside Next.js (plain Node via tsx), so it loads
 * .env.local itself. If Supabase credentials aren't configured, it still
 * fetches and normalizes the curated grants data (a "dry run") and prints
 * the same report — it just skips the database write step.
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const { runGrantIngestion } = await import("../src/lib/grants/pipeline");
  const { getSupabaseAdminClient } = await import("../src/lib/supabase/admin");
  const { getEnabledGrantSources, GRANT_SOURCE_REGISTRY } = await import("../src/lib/grants/sources/registry");

  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log("Grants & Funding — ingestion\n");

  const disabledSources = GRANT_SOURCE_REGISTRY.filter((s) => s.status !== "active");
  if (disabledSources.length > 0) {
    console.log(
      `Skipping ${disabledSources.length} non-active source(s): ${disabledSources.map((s) => s.name).join(", ")}\n`
    );
  }

  if (!hasSupabaseConfig) {
    console.log(
      "No Supabase credentials found in .env.local — running in DRY RUN mode.\n" +
        "Sources will be fetched and normalized, but nothing will be written to a database.\n"
    );
  }

  const client = hasSupabaseConfig ? getSupabaseAdminClient() : null;
  const sources = getEnabledGrantSources();

  if (sources.length === 0) {
    console.log("No active grant sources configured. Nothing to do.");
    return;
  }

  const summary = await runGrantIngestion({ client });

  for (const r of summary.results) {
    console.log(r.sourceName);
    if (r.status === "error") {
      console.log(`  ERROR: ${r.errorMessage}\n`);
      continue;
    }
    console.log(`  fetched: ${r.fetched}`);
    if (client) {
      console.log(`  new: ${r.newCount}`);
      console.log(`  updated: ${r.updatedCount}`);
      console.log(`  duplicates: ${r.duplicateCount}`);
    }
    console.log("");
  }

  console.log("Total");
  console.log(`  fetched: ${summary.totals.fetched}`);
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
  console.error("Grants ingestion run crashed:", err);
  process.exit(1);
});
