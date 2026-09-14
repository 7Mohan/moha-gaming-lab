/**
 * lib/security/redirect.ts
 * ────────────────────────────────────────────────────────────────
 * Safe redirect helpers — prevents open redirect vulnerabilities.
 *
 * An open redirect occurs when an application uses an attacker-controlled
 * URL for a redirect. This module validates all redirect targets before use.
 */

/** Prefixes that are always safe to redirect to */
const SAFE_PREFIXES = ["/admin", "/"];

/**
 * Validates a redirect target and returns a safe URL.
 *
 * Rules:
 * - Must be a relative path (no protocol)
 * - Must start with an allowed prefix
 * - Cannot contain null bytes or control characters
 * - Cannot be protocol-relative (//)
 *
 * @param target   The raw redirect target from query params or user input
 * @param fallback Safe fallback URL (defaults to "/")
 * @returns        The original target if safe, otherwise the fallback
 */
export function sanitizeRedirectUrl(
  target: string | null | undefined,
  fallback = "/"
): string {
  if (!target || typeof target !== "string") return fallback;

  // Strip whitespace
  const trimmed = target.trim();
  if (!trimmed) return fallback;

  // Block protocol-relative URLs (//evil.com)
  if (trimmed.startsWith("//")) return fallback;

  // Block absolute URLs (http://, https://, ftp://, etc.)
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) return fallback;

  // Block null bytes and control characters
  if (/[\x00-\x1f\x7f]/.test(trimmed)) return fallback;

  // Must start with /
  if (!trimmed.startsWith("/")) return fallback;

  // Must start with an allowed prefix
  const isSafe = SAFE_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
  if (!isSafe) return fallback;

  return trimmed;
}

/**
 * Validates and returns a safe admin redirect URL.
 * Fallback is always "/admin".
 */
export function sanitizeAdminRedirect(
  target: string | null | undefined
): string {
  return sanitizeRedirectUrl(target, "/admin");
}

/**
 * Validates a `next` parameter from a login form and returns a safe path.
 * Only allows /admin/* destinations.
 *
 * @param next     The raw `next` query parameter
 * @returns        Safe /admin path or "/admin" fallback
 */
export function sanitizeLoginNext(next: string | null | undefined): string {
  const safe = sanitizeRedirectUrl(next, "/admin");
  // Extra check: login `next` must be under /admin
  if (!safe.startsWith("/admin")) return "/admin";
  return safe;
}

/**
 * Builds a login URL with a sanitized `next` parameter.
 *
 * @param next   The destination after login
 * @param origin The request origin (e.g. "https://example.com")
 * @returns      A URL object pointing to /admin/login?next=<safe>
 */
export function buildLoginUrl(next: string | null | undefined, origin: string): URL {
  const loginUrl = new URL("/admin/login", origin);
  const safeNext = sanitizeLoginNext(next);
  loginUrl.searchParams.set("next", safeNext);
  return loginUrl;
}
