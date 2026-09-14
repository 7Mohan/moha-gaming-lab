/**
 * lib/supabase/server.ts
 * ────────────────────────────────────────────────────────────────
 * Supabase server client for Server Components, Server Actions, and Route Handlers.
 * Uses @supabase/ssr createServerClient with Next.js cookies() API.
 * 
 * SECURITY: Uses NEXT_PUBLIC_SUPABASE_ANON_KEY with the incoming request's
 * session cookies. This executes within the context of the authenticated user
 * and respects all PostgreSQL Row Level Security (RLS) policies.
 */

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll can fail when invoked from a Server Component (read-only cookie store).
          // This is expected in Next.js Server Components.
        }
      },
    },
  });
}
