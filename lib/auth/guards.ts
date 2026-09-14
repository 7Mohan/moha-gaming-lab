/**
 * lib/auth/guards.ts
 * ────────────────────────────────────────────────────────────────
 * Server-side authentication and authorization guards.
 * Call these at the top of every admin Server Action and route handler.
 * They throw/redirect when access requirements are not met.
 */

import { redirect } from "next/navigation";
import { getSession } from "./session";
import { can } from "./rbac";
import type { AdminSession } from "./types";
import type { AdminAction } from "./rbac";

/**
 * Retrieves the current session or redirects to /admin/login.
 * Use at the top of every protected admin Server Component / Action.
 */
export async function requireSession(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}

/**
 * Requires the current user to have ADMIN role.
 * Throws 403 if authenticated but wrong role.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await requireSession();
  if (session.role !== "ADMIN") {
    throw new AuthorizationError("Administrator role required.");
  }
  return session;
}

/**
 * Requires the current user to have at least EDITOR role.
 */
export async function requireEditor(): Promise<AdminSession> {
  const session = await requireSession();
  if (session.role !== "ADMIN" && session.role !== "EDITOR") {
    throw new AuthorizationError("Editor role or higher required.");
  }
  return session;
}

/**
 * Requires the current user to have a specific permission.
 * ADMIN always passes.
 */
export async function requirePermission(action: AdminAction): Promise<AdminSession> {
  const session = await requireSession();
  if (!can(session.role, action)) {
    throw new AuthorizationError(
      `Your role (${session.role}) does not have permission to: ${action}`
    );
  }
  return session;
}

/**
 * Typed authorization error — caught by Server Action error boundaries.
 * Returns 403 to the client without leaking internals.
 */
export class AuthorizationError extends Error {
  readonly code = "FORBIDDEN";
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Typed not-found error for admin operations.
 */
export class AdminNotFoundError extends Error {
  readonly code = "NOT_FOUND";
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`);
    this.name = "AdminNotFoundError";
  }
}

/**
 * Typed validation error wrapper for Server Actions.
 */
export class AdminValidationError extends Error {
  readonly code = "VALIDATION_ERROR";
  readonly fields: Record<string, string[]>;
  constructor(fields: Record<string, string[]>) {
    super("Validation failed");
    this.name = "AdminValidationError";
    this.fields = fields;
  }
}

/**
 * Wraps a Server Action with standard error handling.
 * Returns a discriminated union: { success } | { error }.
 */
export async function guardedAction<T>(
  fn: () => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: string; code: string; fields?: Record<string, string[]> }> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return { success: false, error: err.message, code: "FORBIDDEN" };
    }
    if (err instanceof AdminValidationError) {
      return { success: false, error: "Validation failed", code: "VALIDATION_ERROR", fields: err.fields };
    }
    if (err instanceof AdminNotFoundError) {
      return { success: false, error: err.message, code: "NOT_FOUND" };
    }
    // Do not expose internal errors to client
    const msg = process.env.NODE_ENV === "development"
      ? String(err instanceof Error ? err.message : err)
      : "An unexpected error occurred";
    return { success: false, error: msg, code: "INTERNAL_ERROR" };
  }
}
