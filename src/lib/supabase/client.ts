/**
 * Browser Supabase client.
 *
 * Phase 1 doesn't read from Supabase yet (the dashboard runs entirely on
 * mock data), but this is wired up so the real `jobs` table can be swapped
 * in later without restructuring. Safe to import even when env vars aren't
 * set yet — it throws only when actually invoked, not at import time.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let browserClient: SupabaseClient<Database> | null = null;

/** Returns a singleton browser Supabase client. Requires the two `NEXT_PUBLIC_*` env vars. */
export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copy .env.example to .env.local and fill in your Supabase project credentials."
    );
  }

  browserClient = createClient<Database>(url, anonKey);
  return browserClient;
}
