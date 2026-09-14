"use server";

import { requireAdmin } from "@/lib/auth/guards";
import { recordAudit } from "@/lib/admin/audit";
import { hasDatabaseUrl } from "@/lib/env";
import { createClient, type User } from "@supabase/supabase-js";

export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "EDITOR" | "AUTHOR" | "USER";
  isSuperAdmin: boolean;
  avatarUrl?: string;
  createdAt: string;
  lastSignInAt?: string;
  provider: string;
}

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Supabase service role configuration is missing on the server.");
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Lists all registered users from Supabase Auth.
 * Protected: requires ADMIN role.
 */
export async function listUsersAction(): Promise<ActionResult<ManagedUser[]>> {
  try {
    await requireAdmin();
    const supabase = getAdminClient();

    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const SUPERADMIN_EMAIL = "4mohabashir@gmail.com";

    const users: ManagedUser[] = (data.users || []).map((u: User) => {
      const email = (u.email || "").toLowerCase();
      const isSuperAdmin = email === SUPERADMIN_EMAIL;

      const rawRole =
        u.app_metadata?.role ||
        u.user_metadata?.role ||
        (isSuperAdmin ? "admin" : "user");

      const normalized = rawRole.toUpperCase();
      const validRole = (["ADMIN", "EDITOR", "AUTHOR"].includes(normalized)
        ? normalized
        : "USER") as "ADMIN" | "EDITOR" | "AUTHOR" | "USER";

      const name =
        u.user_metadata?.full_name ||
        u.user_metadata?.name ||
        email.split("@")[0] ||
        "Gamer";

      const avatarUrl =
        u.user_metadata?.avatar_url ||
        u.user_metadata?.picture ||
        undefined;

      const provider = u.app_metadata?.provider || (u.app_metadata?.providers?.[0]) || "email";

      return {
        id: u.id,
        email: u.email || "",
        name,
        role: isSuperAdmin ? "ADMIN" : validRole,
        isSuperAdmin,
        avatarUrl,
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at || undefined,
        provider,
      };
    });

    // Sort: SuperAdmin first, then ADMIN, then EDITOR, then AUTHOR, then USER
    const roleWeight = { ADMIN: 4, EDITOR: 3, AUTHOR: 2, USER: 1 };
    users.sort((a, b) => {
      if (a.isSuperAdmin) return -1;
      if (b.isSuperAdmin) return 1;
      return (roleWeight[b.role] || 0) - (roleWeight[a.role] || 0);
    });

    return { success: true, data: users };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load user list.",
    };
  }
}

/**
 * Updates a user's role in Supabase metadata.
 * Protected: requires ADMIN role.
 */
export async function updateUserRoleAction(
  userId: string,
  newRole: "ADMIN" | "EDITOR" | "AUTHOR" | "USER"
): Promise<ActionResult<{ userId: string; role: string }>> {
  try {
    const adminSession = await requireAdmin();
    const supabase = getAdminClient();

    // Fetch user to verify they exist and aren't primary SuperAdmin
    const { data: userData, error: fetchErr } = await supabase.auth.admin.getUserById(userId);
    if (fetchErr || !userData.user) {
      return { success: false, error: fetchErr?.message || "User not found." };
    }

    const targetUser = userData.user;
    const targetEmail = (targetUser.email || "").toLowerCase();

    // Guard: Prevent demoting primary SuperAdmin
    if (targetEmail === "4mohabashir@gmail.com" && newRole !== "ADMIN") {
      return {
        success: false,
        error: "Cannot change the role of the primary SuperAdmin account.",
      };
    }

    const roleLower = newRole.toLowerCase();

    // Update in Supabase
    const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
      app_metadata: {
        ...targetUser.app_metadata,
        role: roleLower,
      },
      user_metadata: {
        ...targetUser.user_metadata,
        role: roleLower,
      },
    });

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // Sync to Prisma DB if configured
    if (hasDatabaseUrl() && targetEmail) {
      try {
        const { prisma } = await import("@/lib/db/prisma");
        if (newRole === "USER") {
          await prisma.adminUser.delete({ where: { email: targetEmail } }).catch(() => {});
        } else {
          await prisma.adminUser.upsert({
            where: { email: targetEmail },
            update: { role: newRole },
            create: {
              email: targetEmail,
              name: targetUser.user_metadata?.full_name || targetEmail.split("@")[0],
              role: newRole,
              passwordHash: "SUPABASE_OAUTH_MANAGED",
            },
          }).catch(() => {});
        }
      } catch {}
    }

    // Audit log
    await recordAudit({
      userId: adminSession.userId,
      action: "UPDATE",
      entityType: "AdminUser",
      entityId: userId,
      metadata: {
        action: "ROLE_CHANGE",
        targetEmail,
        newRole,
        assignedBy: adminSession.email,
      },
    }).catch(() => {});

    return { success: true, data: { userId, role: newRole } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update role.",
    };
  }
}

/**
 * Assigns a role to a user by entering their email address.
 * Useful for quickly promoting someone without browsing the entire list.
 */
export async function assignUserRoleByEmailAction(
  email: string,
  newRole: "ADMIN" | "EDITOR" | "AUTHOR" | "USER"
): Promise<ActionResult<{ userId: string; role: string; email: string }>> {
  try {
    await requireAdmin();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { success: false, error: "Please enter a valid email address." };
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      return { success: false, error: error.message };
    }

    const match = (data.users || []).find(
      (u: User) => (u.email || "").toLowerCase() === cleanEmail
    );

    if (!match) {
      return {
        success: false,
        error: `No user with email "${cleanEmail}" was found. Make sure they have signed in or registered first.`,
      };
    }

    const updateRes = await updateUserRoleAction(match.id, newRole);
    if (!updateRes.success) {
      return { success: false, error: updateRes.error };
    }

    return {
      success: true,
      data: { userId: match.id, role: newRole, email: cleanEmail },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to assign role.",
    };
  }
}
