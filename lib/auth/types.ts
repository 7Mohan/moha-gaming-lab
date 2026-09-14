/**
 * lib/auth/types.ts
 * ────────────────────────────────────────────────────────────────
 * Auth session types, role definitions, and permission contracts.
 * Architected to be compatible with next-auth session shape for future migration.
 */

export type AdminRole = "ADMIN" | "EDITOR" | "AUTHOR";
export type UserRole = AdminRole | "USER";

/**
 * The session payload stored in the signed HTTP-only cookie.
 * Keep this minimal — only IDs and role. Never store passwords or secrets.
 */
export interface AdminSession {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  /** ISO timestamp of session creation */
  issuedAt: string;
  /** ISO timestamp of session expiry */
  expiresAt: string;
}

/**
 * Session for regular (non-admin) users signed in via OAuth or email.
 * Stored in a separate cookie so it doesn't conflict with admin sessions.
 */
export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  /** ISO timestamp of session creation */
  issuedAt: string;
  /** ISO timestamp of session expiry */
  expiresAt: string;
}

/**
 * Context passed to Server Actions / route handlers.
 */
export interface AuthContext {
  session: AdminSession;
  isAuthenticated: true;
}

export interface UnauthenticatedContext {
  isAuthenticated: false;
}

export type MaybeAuthContext = AuthContext | UnauthenticatedContext;

/**
 * Result shape for login operations.
 */
export type LoginResult =
  | { success: true; session: AdminSession }
  | { success: false; error: string };
