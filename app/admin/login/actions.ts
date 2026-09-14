"use server";

import { z } from "zod";
import { createSession, getSession, destroySession, createUserSession, getUserSession, destroyUserSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { recordAudit } from "@/lib/admin/audit";
import { hasDatabaseUrl } from "@/lib/env";
import type { AdminRole, AdminSession, UserSession } from "@/lib/auth/types";
import { loginRateLimit } from "@/lib/security/rate-limit";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export interface LoginActionResult {
  success: boolean;
  error?: string;
}

export async function loginAction(
  prevState: LoginActionResult | null,
  formData: FormData
): Promise<LoginActionResult> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  // Rate limit: 5 attempts per minute per email
  const rl = loginRateLimit(email);
  if (!rl.success) {
    return {
      success: false,
      error: "Too many login attempts. Please wait a minute and try again.",
    };
  }

  let session: AdminSession | null = null;

  // 1. Primary: Authenticate with Supabase Auth if configured (Source of Truth)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error: sbError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!sbError && data?.user) {
        const user = data.user;
        const DESIGNATED_ADMIN_EMAILS = [
          "4mohabashir@gmail.com",
          process.env.ADMIN_EMAIL?.toLowerCase(),
        ].filter(Boolean);

        let rawRole: string | undefined =
          (user.app_metadata?.role as string) ||
          (user.user_metadata?.role as string);

        if (DESIGNATED_ADMIN_EMAILS.includes(email)) {
          rawRole = "ADMIN";
        }

        const normalizedRole = rawRole?.toUpperCase();
        const isValidAdminRole =
          normalizedRole === "ADMIN" ||
          normalizedRole === "EDITOR" ||
          normalizedRole === "AUTHOR";

        if (!isValidAdminRole) {
          return {
            success: false,
            error: "Access denied. Your account does not have administrative privileges.",
          };
        }

        session = {
          userId: user.id,
          email,
          name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            email.split("@")[0] ||
            "Admin",
          role: normalizedRole as AdminRole,
          issuedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
        };
      }
    } catch {
      // Supabase connection issue; try Prisma DB below
    }
  }

  // 2. Secondary: Authenticate against persistent Prisma database if configured
  if (!session && hasDatabaseUrl()) {
    try {
      const { prisma } = await import("@/lib/db/prisma");
      const user = await prisma.adminUser.findUnique({
        where: { email },
      });

      if (user && user.isActive) {
        const matches = await verifyPassword(password, user.passwordHash);
        if (matches) {
          session = {
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role as AdminRole,
            issuedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
          };

          // Update lastLoginAt
          await prisma.adminUser.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          }).catch(() => {});
        }
      }
    } catch {
      // Database not reachable
    }
  }

  if (!session) {
    return {
      success: false,
      error: "The credentials you entered are incorrect.",
    };
  }

  // Create signed session cookie
  await createSession(session);

  // Record audit log
  await recordAudit({
    userId: session.userId,
    action: "LOGIN",
    entityType: "AdminUser",
    entityId: session.userId,
    metadata: { role: session.role, email: session.email },
  });

  return { success: true };
}

export interface SupabaseSyncResult {
  success: boolean;
  isAdmin: boolean;
  role?: string;
  error?: string;
}

export async function syncSupabaseUserAction(accessToken: string): Promise<SupabaseSyncResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    return { success: false, isAdmin: false, error: "Supabase not configured on server" };
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, serviceKey);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return { success: false, isAdmin: false, error: error?.message || "Invalid authentication session" };
    }

    const email = user.email?.toLowerCase() || "";
    const DESIGNATED_ADMIN_EMAILS = [
      "4mohabashir@gmail.com",
      process.env.ADMIN_EMAIL?.toLowerCase(),
    ].filter(Boolean);

    let rawRole: string | undefined =
      (user.app_metadata?.role as string) ||
      (user.user_metadata?.role as string);

    if (DESIGNATED_ADMIN_EMAILS.includes(email)) {
      rawRole = "ADMIN";
    }

    if (!rawRole && hasDatabaseUrl() && email) {
      try {
        const { prisma } = await import("@/lib/db/prisma");
        const dbUser = await prisma.adminUser.findUnique({ where: { email } });
        if (dbUser) rawRole = dbUser.role;
      } catch {
        // ignore DB error
      }
    }

    const normalizedRole = rawRole?.toUpperCase();
    const isAdmin =
      normalizedRole === "ADMIN" ||
      normalizedRole === "EDITOR" ||
      normalizedRole === "AUTHOR";

    if (isAdmin) {
      await destroyUserSession();
      const session: AdminSession = {
        userId: user.id,
        email,
        name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          email.split("@")[0] ||
          "Admin",
        role: normalizedRole as AdminRole,
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
      };

      await createSession(session);

      await recordAudit({
        userId: session.userId,
        action: "LOGIN",
        entityType: "AdminUser",
        entityId: session.userId,
        metadata: {
          provider: "supabase_auth",
          role: session.role,
          email: session.email,
        },
      }).catch(() => {});

      return { success: true, isAdmin: true, role: normalizedRole };
    }

    // Regular user — explicitly destroy any existing admin session so it cannot leak!
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

    return { success: true, isAdmin: false };
  } catch (err: unknown) {
    return {
      success: false,
      isAdmin: false,
      error: err instanceof Error ? err.message : "Authentication synchronization failed",
    };
  }
}

export async function getAuthStatusAction(): Promise<{
  isAuthenticated: boolean;
  isAdmin: boolean;
  email?: string;
  name?: string;
  role?: string;
  avatarUrl?: string;
}> {
  // First check admin session
  const session = await getSession();
  if (session) {
    return {
      isAuthenticated: true,
      isAdmin:
        session.role === "ADMIN" ||
        session.role === "EDITOR" ||
        session.role === "AUTHOR",
      email: session.email,
      name: session.name,
      role: session.role,
    };
  }

  // Then check regular user session
  const userSession = await getUserSession();
  if (userSession) {
    return {
      isAuthenticated: true,
      isAdmin: false,
      email: userSession.email,
      name: userSession.name,
      role: userSession.role,
      avatarUrl: userSession.avatarUrl,
    };
  }

  return { isAuthenticated: false, isAdmin: false };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  await destroyUserSession();
}


