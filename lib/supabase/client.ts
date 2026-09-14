/**
 * lib/supabase/client.ts
 * ────────────────────────────────────────────────────────────────
 * Supabase browser client for Client Components.
 * Uses @supabase/ssr createBrowserClient which handles cookie-based auth tokens
 * in browser storage seamlessly across client-side requests.
 * 
 * SECURITY: Only uses NEXT_PUBLIC_ credentials. Never import service keys here.
 */

import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
}
