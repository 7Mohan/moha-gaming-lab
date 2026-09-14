/**
 * lib/security/checksum.ts
 * ────────────────────────────────────────────────────────────────
 * Cryptographic checksum verification and format inspection.
 */

/**
 * Validates whether a given string is a valid SHA-256 hex string (64 characters).
 */
export function isValidSha256(hash: string): boolean {
  if (!hash || typeof hash !== "string") return false;
  return /^[a-fA-F0-9]{64}$/.test(hash.trim());
}

/**
 * Validates whether a given string is a valid MD5 hex string (32 characters).
 */
export function isValidMd5(hash: string): boolean {
  if (!hash || typeof hash !== "string") return false;
  return /^[a-fA-F0-9]{32}$/.test(hash.trim());
}

/**
 * Constant-time string comparison to prevent timing attacks when verifying hashes.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
