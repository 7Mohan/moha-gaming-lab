/**
 * lib/auth/session.ts
 * ────────────────────────────────────────────────────────────────
 * HTTP-only cookie-based session management using HMAC-SHA256 signing.
 * The session payload is base64(JSON) + HMAC signature.
 * Architecture is swappable for NextAuth/Supabase Auth without admin UI rewrite.
 */

import { cookies } from "next/headers";
import type { AdminSession, UserSession } from "./types";

const COOKIE_NAME = "moha_admin_session";
const USER_COOKIE_NAME = "moha_user_session";
const SESSION_TTL_HOURS = 8;

/**
 * Returns the session signing key from env.
 * Falls back to a per-process random key in development (sessions won't survive restarts).
 */
function getSigningKey(): string {
  const secret = process.env.ADMIN_SECRET || process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[Auth] ADMIN_SECRET must be set and at least 16 characters in production"
      );
    }
    // Dev fallback — not secure across restarts, but functional locally
    return "dev-moha-session-key-not-for-production";
  }
  return secret;
}

async function sign(payload: string, key: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(payload));
  return Buffer.from(sig).toString("base64url");
}

async function verify(payload: string, signature: string, key: string): Promise<boolean> {
  const expected = await sign(payload, key);
  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

function encodeSession(session: AdminSession): string {
  return Buffer.from(JSON.stringify(session)).toString("base64url");
}

function decodeSession(encoded: string): AdminSession | null {
  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as AdminSession;
  } catch {
    return null;
  }
}

/**
 * Creates a signed session cookie for the given session data.
 */
export async function createSession(session: AdminSession): Promise<void> {
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_TTL_HOURS * 60 * 60 * 1000);

  const payload = encodeSession({
    ...session,
    issuedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  });

  const signature = await sign(payload, getSigningKey());
  const cookieValue = `${payload}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/",
  });
}

/**
 * Reads and validates the current admin session.
 * Returns null if missing, expired, or tampered.
 */
export async function getSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(COOKIE_NAME);
    if (!cookie?.value) return null;

    const lastDot = cookie.value.lastIndexOf(".");
    if (lastDot < 0) return null;

    const payload = cookie.value.slice(0, lastDot);
    const signature = cookie.value.slice(lastDot + 1);

    const isValid = await verify(payload, signature, getSigningKey());
    if (!isValid) return null;

    const session = decodeSession(payload);
    if (!session) return null;

    // Check expiry
    if (new Date(session.expiresAt) < new Date()) return null;

    return session;
  } catch {
    return null;
  }
}

/**
 * Destroys the admin session cookie.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });
}

// ── User Session (public site) ──────────────────────────────────────────────

/**
 * Creates a signed session cookie for a regular (non-admin) user.
 */
export async function createUserSession(session: UserSession): Promise<void> {
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_TTL_HOURS * 60 * 60 * 1000);

  const payload = Buffer.from(
    JSON.stringify({ ...session, issuedAt: now.toISOString(), expiresAt: expires.toISOString() })
  ).toString("base64url");

  const signature = await sign(payload, getSigningKey());
  const cookieValue = `${payload}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set(USER_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/",
  });
}

/**
 * Reads and validates the current user session.
 * Returns null if missing, expired, or tampered.
 */
export async function getUserSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(USER_COOKIE_NAME);
    if (!cookie?.value) return null;

    const lastDot = cookie.value.lastIndexOf(".");
    if (lastDot < 0) return null;

    const payload = cookie.value.slice(0, lastDot);
    const signature = cookie.value.slice(lastDot + 1);

    const isValid = await verify(payload, signature, getSigningKey());
    if (!isValid) return null;

    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as UserSession;
    if (!session) return null;

    // Check expiry
    if (new Date(session.expiresAt) < new Date()) return null;

    return session;
  } catch {
    return null;
  }
}

/**
 * Destroys the user session cookie.
 */
export async function destroyUserSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(USER_COOKIE_NAME);
  cookieStore.set(USER_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });
}
