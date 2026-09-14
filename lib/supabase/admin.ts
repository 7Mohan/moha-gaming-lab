/**
 * lib/supabase/admin.ts
 * ────────────────────────────────────────────────────────────────
 * Supabase Admin client with elevated privileges (service_role).
 * 
 * CRITICAL SECURITY INVARIANTS (Section 18):
 * - NEVER import or execute this file in Client Components.
 * - NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser or in NEXT_PUBLIC_ env.
 * - This client bypasses PostgreSQL Row Level Security (RLS).
 * - ONLY use for administrative user management (listing users, updating roles)
 *   after server-side authorization guards (requireAdmin()) have verified the caller.
 */

import { createClient } from "@supabase/supabase-js";

let adminClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "[SECURITY VIOLATION] Supabase Admin Client (service_role) cannot be instantiated in browser environments."
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}
