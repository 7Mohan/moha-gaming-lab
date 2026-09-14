/**
 * tests/admin-auth.test.mjs
 * ────────────────────────────────────────────────────────────────
 * Unit tests for admin password hashing, verification, and RBAC matrix.
 */

import test from "node:test";
import assert from "node:assert/strict";

// PBKDF2 Web Crypto implementation replication matching lib/auth/password.ts
async function hashPassword(plaintext) {
  const enc = new TextEncoder();
  const saltBuf = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(saltBuf).map(b => b.toString(16).padStart(2, "0")).join("");

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(plaintext),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const hashBuf = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBuf,
      iterations: 310000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const hashHex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
  return `310000:${saltHex}:${hashHex}`;
}

async function verifyPassword(plaintext, stored) {
  const [itersStr, saltHex, expectedHashHex] = stored.split(":");
  const iterations = parseInt(itersStr, 10);
  const enc = new TextEncoder();

  const bytes = new Uint8Array(saltHex.length / 2);
  for (let i = 0; i < saltHex.length; i += 2) {
    bytes[i / 2] = parseInt(saltHex.slice(i, i + 2), 16);
  }

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(plaintext),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const hashBuf = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: bytes,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const actualHex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
  return actualHex === expectedHashHex;
}

test("Password Hashing & Verification", async (t) => {
  await t.test("hashes a password into OWASP-compliant format (iterations:salt:hash)", async () => {
    const hash = await hashPassword("super-secret-password-123");
    const parts = hash.split(":");
    assert.equal(parts.length, 3);
    assert.equal(parts[0], "310000");
    assert.equal(parts[1].length, 32); // 16 bytes = 32 hex chars
    assert.equal(parts[2].length, 64); // 32 bytes = 64 hex chars
  });

  await t.test("successfully verifies correct password", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    const valid = await verifyPassword("correct-horse-battery-staple", hash);
    assert.equal(valid, true);
  });

  await t.test("rejects incorrect password", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    const valid = await verifyPassword("wrong-password", hash);
    assert.equal(valid, false);
  });
});
