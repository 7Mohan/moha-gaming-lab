/**
 * lib/auth/password.ts
 * ────────────────────────────────────────────────────────────────
 * Password hashing and verification using Web Crypto API (PBKDF2).
 * No native Node.js bcrypt dependency — works on Edge Runtime.
 * 310,000 iterations of PBKDF2-SHA256 — OWASP recommended minimum.
 */

const ALGORITHM = "PBKDF2";
const HASH = "SHA-256";
const ITERATIONS = 310_000;
const KEY_LENGTH = 32; // 256 bits
const SALT_LENGTH = 16; // 128-bit salt

/**
 * Converts a buffer to a hex string.
 */
function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Converts a hex string back to Uint8Array.
 */
function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Hashes a plaintext password using PBKDF2-SHA256.
 * Returns a string in format: `iterations:saltHex:hashHex`
 */
export async function hashPassword(plaintext: string): Promise<string> {
  const enc = new TextEncoder();
  const saltBuf = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const saltHex = bufToHex(saltBuf.buffer as ArrayBuffer);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(plaintext),
    ALGORITHM,
    false,
    ["deriveBits"]
  );

  const hashBuf = await crypto.subtle.deriveBits(
    {
      name: ALGORITHM,
      salt: saltBuf,
      iterations: ITERATIONS,
      hash: HASH,
    },
    keyMaterial,
    KEY_LENGTH * 8
  );

  const hashHex = bufToHex(hashBuf);
  return `${ITERATIONS}:${saltHex}:${hashHex}`;
}

/**
 * Verifies a plaintext password against a stored PBKDF2 hash string.
 * Uses constant-time comparison to prevent timing attacks.
 */
export async function verifyPassword(plaintext: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 3) return false;

  const [itersStr, saltHex, expectedHashHex] = parts;
  const iterations = parseInt(itersStr!, 10);
  if (isNaN(iterations) || iterations < 1) return false;

  const enc = new TextEncoder();
  const saltBuf = hexToBuf(saltHex!);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(plaintext),
    ALGORITHM,
    false,
    ["deriveBits"]
  );

  const hashBuf = await crypto.subtle.deriveBits(
    {
      name: ALGORITHM,
      salt: saltBuf.buffer as ArrayBuffer,
      iterations,
      hash: HASH,
    },
    keyMaterial,
    KEY_LENGTH * 8
  );

  const actualHashHex = bufToHex(hashBuf);

  // Constant-time comparison
  if (actualHashHex.length !== expectedHashHex!.length) return false;
  let diff = 0;
  for (let i = 0; i < actualHashHex.length; i++) {
    diff |= actualHashHex.charCodeAt(i) ^ expectedHashHex!.charCodeAt(i);
  }
  return diff === 0;
}
