/**
 * Server-side Supabase client, using the service role key.
 *
 * For server components, route handlers, and (in a later phase) the
 * ingestion job. Never import this from a "use client" file — the service
 * role key must stay server-only.
 *
 * Phase 1 doesn't call this yet; it's here so ingestion/API code added
 * later has a ready-made entry point.
 */
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let serverClient: SupabaseClient<Database> | null = null;

/** Returns a singleton server Supabase client authenticated with the service role key. */
export function getSupabaseServiceClient(): SupabaseClient<Database> {
  if (serverClient) return serverClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "Copy .env.example to .env.local and fill in your Supabase project credentials."
    );
  }

  serverClient = createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return serverClient;
}
