/**
 * lib/security/permissions.ts
 * ────────────────────────────────────────────────────────────────
 * Content status visibility guards and administrative role contracts.
 * Strictly prevents exposure of DRAFT and REVIEW content to public users.
 */

import { env } from "../env";

export type Role = "ADMIN" | "EDITOR" | "AUTHOR" | "PUBLIC";

export interface RequestContext {
  role: Role;
  isAdmin: boolean;
}

/**
 * Resolves request permissions from authorization header or admin secret.
 */
export function resolvePermissions(authHeader?: string | null): RequestContext {
  if (!authHeader) {
    return { role: "PUBLIC", isAdmin: false };
  }

  // If Bearer matches ADMIN_SECRET, grant ADMIN role
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (env.ADMIN_SECRET && token === env.ADMIN_SECRET) {
    return { role: "ADMIN", isAdmin: true };
  }

  return { role: "PUBLIC", isAdmin: false };
}

/**
 * Filter predicate ensuring only published content is publicly visible.
 */
export function isPubliclyVisible(status: string, ctx: RequestContext): boolean {
  if (ctx.isAdmin) return true; // Admins can view drafts and review content
  return status === "PUBLISHED";
}
