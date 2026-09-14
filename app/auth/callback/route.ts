import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createSession, createUserSession, destroySession, destroyUserSession } from "@/lib/auth/session";
import { recordAudit } from "@/lib/admin/audit";
import type { AdminRole, AdminSession, UserSession } from "@/lib/auth/types";
import { hasDatabaseUrl } from "@/lib/env";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectParam = requestUrl.searchParams.get("redirect") || "/admin";

  if (!code) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("Missing authorization code")}`, requestUrl.origin)
    );
  }

  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("Supabase environment configuration missing")}`, requestUrl.origin)
    );
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignore set cookie errors in server route
        }
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data?.user) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(error?.message || "Failed to complete Google authentication")}`,
        requestUrl.origin
      )
    );
  }

  const user = data.user;
  const email = user.email?.toLowerCase() || "";

  // ── Determine Role ──────────────────────────────────────────────────────────
  const DESIGNATED_ADMIN_EMAILS = [
    "4mohabashir@gmail.com",
    process.env.ADMIN_EMAIL?.toLowerCase(),
  ].filter(Boolean);

  // Check Supabase metadata: app_metadata or user_metadata
  let rawRole: string | undefined =
    (user.app_metadata?.role as string) ||
    (user.user_metadata?.role as string);

  if (DESIGNATED_ADMIN_EMAILS.includes(email)) {
    rawRole = "ADMIN";
  }

  // Check Prisma DB if connected
  if (!rawRole && hasDatabaseUrl() && email) {
    try {
      const { prisma } = await import("@/lib/db/prisma");
      const dbUser = await prisma.adminUser.findUnique({ where: { email } });
      if (dbUser) {
        rawRole = dbUser.role;
      }
    } catch {
      // Database not reachable or unconfigured
    }
  }

  const normalizedRole = rawRole?.toUpperCase();
  const isValidAdminRole =
    normalizedRole === "ADMIN" ||
    normalizedRole === "EDITOR" ||
    normalizedRole === "AUTHOR";

  if (isValidAdminRole) {
    const adminRole = normalizedRole as AdminRole;
    const session: AdminSession = {
      userId: user.id,
      email,
      name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        email.split("@")[0] ||
        "Admin",
      role: adminRole,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    };

    await destroyUserSession();
    // Create secure HTTP-only session cookie for the CMS
    await createSession(session);

    // Audit log
    await recordAudit({
      userId: session.userId,
      action: "LOGIN",
      entityType: "AdminUser",
      entityId: session.userId,
      metadata: {
        provider: "google_oauth",
        role: session.role,
        email: session.email,
      },
    }).catch(() => {});

    // Redirect to requested admin destination or password reset
    const destination =
      redirectParam === "/reset-password"
        ? "/reset-password"
        : redirectParam.startsWith("/admin")
        ? `${redirectParam}?logged_in=true`
        : "/admin?logged_in=true";
    return NextResponse.redirect(new URL(destination, requestUrl.origin));
  }

  // Regular (non-admin) user — wipe any previous admin session so it cannot bleed over
  await destroySession();

  const userSession: UserSession = {
    userId: user.id,
    email,
    name:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      email.split("@")[0] ||
      "User",
    role: "USER",
    avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture,
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
  };
  await createUserSession(userSession);

  // Redirect to the original destination (public site page) or homepage
  const publicDest = redirectParam.startsWith("/admin") ? "/" : redirectParam;
  return NextResponse.redirect(new URL(publicDest, requestUrl.origin));
}
