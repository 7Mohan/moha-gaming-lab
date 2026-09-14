/**
 * tests/download-infrastructure.test.mjs
 * ────────────────────────────────────────────────────────────────
 * Comprehensive Automated Test Suite for Phase 12:
 * Real Download Infrastructure, Storage, & File Verification.
 */

import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  compareVersionStrings,
  compareReleasesDesc,
  getLatestPublishedRelease,
} from "../lib/download/versions.ts";
import {
  validateApkFile,
  sanitizeFileName,
  generateStoragePath,
  isValidSha256,
  calculateSha256,
} from "../lib/storage/validation.ts";
import { isSafeDownloadUrl, isTrustedDomain } from "../lib/download-security.ts";

test("Phase 12: Version Comparison & Numerical Sorting", async (t) => {
  await t.test("Semantic version comparison correctly orders multi-digit numbers", () => {
    // 10.0 must be greater than 2.0 (lexical sorting would fail this)
    assert.ok(compareVersionStrings("10.0.0", "2.0.0") > 0);
    assert.ok(compareVersionStrings("2.0.0", "10.0.0") < 0);

    // Patch ordering
    assert.ok(compareVersionStrings("1.0.10", "1.0.2") > 0);
    assert.ok(compareVersionStrings("1.0.1", "1.0.0") > 0);
    assert.strictEqual(compareVersionStrings("2.4.1", "2.4.1"), 0);
  });

  await t.test("compareReleasesDesc prioritizes versionCode over version string", () => {
    const relA = { version: "1.0.0", versionCode: 200 };
    const relB = { version: "2.0.0", versionCode: 100 };

    // relA has higher versionCode (200 > 100), so relA comes first
    const sorted = [relB, relA].sort(compareReleasesDesc);
    assert.strictEqual(sorted[0].versionCode, 200);
  });

  await t.test("getLatestPublishedRelease excludes draft and archived releases", () => {
    const releases = [
      { id: "rel-1", version: "3.0.0", versionCode: 300, status: "draft" },
      { id: "rel-2", version: "2.5.0", versionCode: 250, status: "published" },
      { id: "rel-3", version: "2.0.0", versionCode: 200, status: "published" },
      { id: "rel-4", version: "1.0.0", versionCode: 100, status: "archived" },
    ];

    const latest = getLatestPublishedRelease(releases);
    assert.ok(latest);
    assert.strictEqual(latest.version, "2.5.0");
    assert.strictEqual(latest.status, "published");
  });
});

test("Phase 12: APK File Validation & Magic Bytes", async (t) => {
  await t.test("Valid APK magic bytes (0x50 0x4B 0x03 0x04) are accepted", () => {
    const validApk = Buffer.alloc(2048);
    validApk[0] = 0x50;
    validApk[1] = 0x4b;
    validApk[2] = 0x03;
    validApk[3] = 0x04;

    const res = validateApkFile("test-app.apk", validApk, "application/vnd.android.package-archive");
    assert.strictEqual(res.valid, true);
  });

  await t.test("Invalid magic bytes (e.g. text/exe renamed to .apk) are rejected", () => {
    const fakeApk = Buffer.alloc(2048);
    fakeApk.write("MZ\x90\x00\x03\x00\x00\x00"); // Windows PE header
    const res = validateApkFile("malicious.apk", fakeApk);
    assert.strictEqual(res.valid, false);
    assert.match(res.error || "", /signature|not a valid Android APK/i);
  });

  await t.test("Non-APK file extensions are rejected", () => {
    const validBuffer = Buffer.alloc(2048);
    validBuffer[0] = 0x50;
    validBuffer[1] = 0x4b;
    validBuffer[2] = 0x03;
    validBuffer[3] = 0x04;

    const res = validateApkFile("package.exe", validBuffer);
    assert.strictEqual(res.valid, false);
    assert.match(res.error || "", /\.apk/i);
  });

  await t.test("Corrupt or empty file (< 1KB) is rejected", () => {
    const tinyBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
    const res = validateApkFile("tiny.apk", tinyBuffer);
    assert.strictEqual(res.valid, false);
    assert.match(res.error || "", /smaller than 1 KB/i);
  });
});

test("Phase 12: Storage Path Sanitization & Security", async (t) => {
  await t.test("Directory traversal sequences are completely sanitized", () => {
    const dangerous = "../../../../../etc/passwd";
    const sanitized = sanitizeFileName(dangerous);
    assert.ok(!sanitized.includes(".."));
    assert.ok(!sanitized.includes("/"));
    assert.ok(!sanitized.includes("\\"));
  });

  await t.test("generateStoragePath constructs predictable safe server keys", () => {
    const path = generateStoragePath("app-fps-booster", "1.4.2", "app-release.apk");
    assert.strictEqual(path, "app-fps-booster/1.4.2/app-release.apk");
  });

  await t.test("Malicious characters and control bytes are removed or replaced", () => {
    const malicious = "cool_app\x00<script>.apk";
    const sanitized = sanitizeFileName(malicious);
    assert.strictEqual(sanitized, "cool_app_script_.apk");
    assert.ok(!sanitized.includes("\x00"));
    assert.ok(!sanitized.includes("<"));
    assert.ok(!sanitized.includes(">"));
  });
});

test("Phase 12: Cryptographic SHA-256 Checksum", async (t) => {
  await t.test("calculateSha256 produces exact 64-character hex hash", () => {
    const data = Buffer.from("Moha Gaming Lab Verified APK Payload 2026");
    const expected = crypto.createHash("sha256").update(data).digest("hex");

    const calculated = calculateSha256(data);
    assert.strictEqual(calculated, expected);
    assert.strictEqual(isValidSha256(calculated), true);
  });

  await t.test("isValidSha256 rejects invalid length or non-hex hashes", () => {
    assert.strictEqual(isValidSha256("abc"), false);
    assert.strictEqual(isValidSha256("g".repeat(64)), false); // 'g' is not hex
    assert.strictEqual(isValidSha256("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"), true);
  });
});

test("Phase 12: External Source Security & Open Redirect Protection", async (t) => {
  await t.test("Safe HTTPS download URLs are permitted", () => {
    assert.strictEqual(isSafeDownloadUrl("https://github.com/developer/app/releases/download/v1/app.apk"), true);
    assert.strictEqual(isSafeDownloadUrl("https://f-droid.org/repo/app.apk"), true);
  });

  await t.test("Unsafe protocols and loopbacks are rejected", () => {
    assert.strictEqual(isSafeDownloadUrl("javascript:alert(1)"), false);
    assert.strictEqual(isSafeDownloadUrl("data:text/html,<script>alert(1)</script>"), false);
    assert.strictEqual(isSafeDownloadUrl("file:///C:/Windows/System32"), false);
    assert.strictEqual(isSafeDownloadUrl("http://insecure-site.com/app.apk"), false);
    assert.strictEqual(isSafeDownloadUrl("http://localhost:3000/app.apk"), false);
    assert.strictEqual(isSafeDownloadUrl("https://127.0.0.1/app.apk"), false);
  });

  await t.test("isTrustedDomain verifies official repositories", () => {
    assert.strictEqual(isTrustedDomain("https://github.com/test/releases/app.apk"), true);
    assert.strictEqual(isTrustedDomain("https://f-droid.org/packages/app.apk"), true);
    assert.strictEqual(isTrustedDomain("https://malicious-external-mirror.xyz/app.apk"), false);
  });
});
