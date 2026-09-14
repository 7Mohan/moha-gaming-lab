/**
 * lib/security/rate-limit.ts
 * ────────────────────────────────────────────────────────────────
 * Lightweight in-process rate-limiter for Server Actions and API routes.
 *
 * Uses a sliding-window counter stored in module-level memory.
 * In a production multi-instance deployment, replace the MemoryStore
 * with a Redis/Upstash store without changing the public API.
 *
 * Usage:
 *   const result = await rateLimit(identifier, { limit: 5, windowMs: 60_000 });
 *   if (!result.success) throw new Error('Too many requests');
 */

export interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  /** Remaining requests in the current window */
  remaining: number;
  /** Timestamp (ms) when the window resets */
  resetAt: number;
}

// ── In-Memory Store ──────────────────────────────────────────────────────────

interface WindowEntry {
  count: number;
  resetAt: number;
}

/**
 * Module-level map — survives hot-reload in dev but resets on server restart.
 * Replace with Redis for distributed deployments.
 */
const store = new Map<string, WindowEntry>();

/**
 * Periodically purge expired entries so the map doesn't grow unbounded.
 * Runs every 5 minutes in Node.js runtimes.
 */
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Check and increment the rate-limit counter for the given identifier.
 *
 * @param identifier  A unique key — e.g. `login:${ip}` or `api:${userId}`
 * @param options     `limit` and `windowMs`
 * @returns           `{ success, remaining, resetAt }`
 */
export function rateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const { limit, windowMs } = options;

  const existing = store.get(identifier);

  if (!existing || existing.resetAt < now) {
    // New window
    const entry: WindowEntry = { count: 1, resetAt: now + windowMs };
    store.set(identifier, entry);
    return { success: true, remaining: limit - 1, resetAt: entry.resetAt };
  }

  // Existing window
  if (existing.count >= limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    success: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}

// ── Preset Limiters ──────────────────────────────────────────────────────────

/** Login attempts — 5 per minute per IP/email */
export function loginRateLimit(identifier: string): RateLimitResult {
  return rateLimit(`login:${identifier}`, { limit: 5, windowMs: 60_000 });
}

/** Password reset requests — 3 per 15 minutes per email */
export function passwordResetRateLimit(identifier: string): RateLimitResult {
  return rateLimit(`reset:${identifier}`, { limit: 3, windowMs: 15 * 60_000 });
}

/** Admin API actions — 100 per minute per session user */
export function adminActionRateLimit(userId: string): RateLimitResult {
  return rateLimit(`admin-action:${userId}`, { limit: 100, windowMs: 60_000 });
}

/** Public search API — 30 per minute per IP */
export function searchRateLimit(ip: string): RateLimitResult {
  return rateLimit(`search:${ip}`, { limit: 30, windowMs: 60_000 });
}
