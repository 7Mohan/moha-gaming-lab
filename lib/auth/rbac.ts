/**
 * lib/auth/rbac.ts
 * ────────────────────────────────────────────────────────────────
 * Role-Based Access Control — explicit permission map.
 * Used by guards.ts to enforce server-side authorization.
 * Never rely solely on hidden UI elements.
 */

import type { AdminRole } from "./types";

export type AdminAction =
  | "create"
  | "read"
  | "update"
  | "updateOwn"
  | "delete"
  | "publish"
  | "archive"
  | "verify"
  | "submitReview"
  | "manageSettings"
  | "manageUsers";

/**
 * Explicit permission matrix.
 * Principle: deny by default — only grant what's explicitly listed.
 */
const PERMISSIONS: Record<AdminRole, Set<AdminAction>> = {
  ADMIN: new Set([
    "create",
    "read",
    "update",
    "updateOwn",
    "delete",
    "publish",
    "archive",
    "verify",
    "submitReview",
    "manageSettings",
    "manageUsers",
  ]),
  EDITOR: new Set([
    "create",
    "read",
    "update",
    "updateOwn",
    "publish",
    "archive",
    "submitReview",
    "verify",
  ]),
  AUTHOR: new Set([
    "create",
    "read",
    "updateOwn",
    "submitReview",
  ]),
};

/**
 * Returns true if the given role has the specified permission.
 * This is the single authorization gate — call it in every Server Action.
 *
 * @example
 * if (!can(session.role, 'publish')) {
 *   throw new Error('Forbidden');
 * }
 */
export function can(role: AdminRole, action: AdminAction): boolean {
  return PERMISSIONS[role]?.has(action) ?? false;
}

/**
 * Returns all permissions for a given role (useful for frontend display).
 */
export function getPermissions(role: AdminRole): AdminAction[] {
  return Array.from(PERMISSIONS[role] ?? []);
}

/**
 * Returns the display label for a role.
 */
export function getRoleLabel(role: AdminRole): string {
  const labels: Record<AdminRole, string> = {
    ADMIN: "Administrator",
    EDITOR: "Editor",
    AUTHOR: "Author",
  };
  return labels[role] ?? role;
}
