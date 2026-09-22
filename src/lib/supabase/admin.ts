/**
 * Service-role Supabase client for TRUSTED, OUT-OF-BAND contexts only —
 * specifically scripts/ingest.ts, run directly with `tsx` (plain Node,
 * not bundled by Next.js).
 *
 * This deliberately does NOT `import "server-only"` like
 * lib/supabase/server.ts does: that guard only works when code is bundled
 * by Next (it remaps to a no-op under the "react-server" condition);
 * under plain Node it throws unconditionally, which would break the CLI.
 *
 * Because that safety net is absent here, nothing in src/app or
 * src/components should ever import this file — use
 * lib/supabase/server.ts (guarded) from Next server components and route
 * handlers instead. This file exists only so the standalone ingestion
 * script and lib/opportunities/repository.ts (which both the CLI and API
 * routes call) have a client that works outside Next's bundler too.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export function getSupabaseAdminClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "Copy .env.example to .env.local and fill in your Supabase project credentials."
    );
  }

  return createClient<Database>(url, serviceRoleKey, { auth: { persistSession: false } });
}
