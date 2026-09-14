import test from "node:test";
import assert from "node:assert/strict";

// Validation logic tests
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA256_REGEX = /^[a-fA-F0-9]{64}$/;
const MD5_REGEX = /^[a-fA-F0-9]{32}$/;

function isSafeUrl(urlStr) {
  if (!urlStr || typeof urlStr !== "string") return false;
  const trimmed = urlStr.trim().toLowerCase();
  const disallowed = ["javascript:", "data:", "file:", "vbscript:", "blob:", "about:"];
  for (const scheme of disallowed) {
    if (trimmed.startsWith(scheme)) return false;
  }
  if (urlStr.startsWith("/") && !urlStr.startsWith("//")) return true;
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

test("Validation: Slugs", () => {
  // Valid slugs
  assert.equal(SLUG_REGEX.test("pubg-mobile"), true);
  assert.equal(SLUG_REGEX.test("shizuku-manager"), true);
  assert.equal(SLUG_REGEX.test("refresh-rate"), true);
  assert.equal(SLUG_REGEX.test("touch120"), true);

  // Invalid slugs (should fail)
  assert.equal(SLUG_REGEX.test("PUBG_MOBILE"), false);
  assert.equal(SLUG_REGEX.test("../traversal"), false);
  assert.equal(SLUG_REGEX.test("slug with spaces"), false);
  assert.equal(SLUG_REGEX.test("-leading-hyphen"), false);
  assert.equal(SLUG_REGEX.test("trailing-hyphen-"), false);
  assert.equal(SLUG_REGEX.test("double--hyphens"), false);
  assert.equal(SLUG_REGEX.test("<script>alert(1)</script>"), false);
});

test("Validation: URLs & Security Protocols", () => {
  // Valid safe URLs
  assert.equal(isSafeUrl("https://github.com/moha/lab"), true);
  assert.equal(isSafeUrl("http://localhost:3000"), true);
  assert.equal(isSafeUrl("/games/pubg-mobile"), true);

  // Dangerous / unsafe schemes (must be blocked)
  assert.equal(isSafeUrl("javascript:alert('xss')"), false);
  assert.equal(isSafeUrl("JAVASCRIPT:alert(1)"), false);
  assert.equal(isSafeUrl("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="), false);
  assert.equal(isSafeUrl("file:///etc/passwd"), false);
  assert.equal(isSafeUrl("vbscript:msgbox(1)"), false);
  assert.equal(isSafeUrl("//malicious-external-domain.com"), false); // Protocol-relative bypass blocked
});

test("Validation: Pagination Bounds", () => {
  function validatePagination(page, limit) {
    const p = Number(page);
    const l = Number(limit);
    if (!Number.isInteger(p) || p < 1) return null;
    if (!Number.isInteger(l) || l < 1 || l > 100) return null;
    return { page: p, limit: l };
  }

  assert.deepEqual(validatePagination(1, 20), { page: 1, limit: 20 });
  assert.deepEqual(validatePagination("2", "50"), { page: 2, limit: 50 });

  // Invalid bounds (must be rejected)
  assert.equal(validatePagination(0, 20), null);
  assert.equal(validatePagination(-5, 20), null);
  assert.equal(validatePagination(1, 0), null);
  assert.equal(validatePagination(1, 101), null); // Exceeds limit 100
  assert.equal(validatePagination("abc", 20), null);
});

test("Validation: Cryptographic Checksums", () => {
  const validSha256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  const validMd5 = "d41d8cd98f00b204e9800998ecf8427e";

  assert.equal(SHA256_REGEX.test(validSha256), true);
  assert.equal(MD5_REGEX.test(validMd5), true);

  // Invalid hashes
  assert.equal(SHA256_REGEX.test("too-short"), false);
  assert.equal(SHA256_REGEX.test("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b85Z"), false); // invalid hex 'Z'
  assert.equal(MD5_REGEX.test("not-a-hash"), false);
});
