/**
 * lib/storage/validation.ts
 * ────────────────────────────────────────────────────────────────
 * APK file validation, magic byte inspection, path sanitization,
 * and SHA-256 cryptographic checksum calculation.
 */

import { createHash } from "node:crypto";

/** Default maximum release upload size: 100 MB */
export const DEFAULT_MAX_RELEASE_SIZE_BYTES = 100 * 1024 * 1024;

export function getMaxReleaseSizeBytes(): number {
  const envVal = process.env.MAX_APP_RELEASE_SIZE;
  if (envVal) {
    const parsed = parseInt(envVal, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_MAX_RELEASE_SIZE_BYTES;
}

/**
 * Valid APK / ZIP header magic bytes:
 * APKs are standard ZIP archives starting with 0x50 0x4B 0x03 0x04 ("PK\x03\x04")
 */
const ZIP_MAGIC_BYTES = [0x50, 0x4b, 0x03, 0x04];

/**
 * Validates that the provided buffer begins with the standard ZIP/APK magic signature.
 */
export function isValidApkMagicBytes(buffer: Buffer | Uint8Array): boolean {
  if (!buffer || buffer.length < 4) {
    return false;
  }
  return ZIP_MAGIC_BYTES.every((byte, index) => buffer[index] === byte);
}

/**
 * Permitted MIME types for Android APK distribution.
 */
export const ALLOWED_APK_MIME_TYPES = new Set([
  "application/vnd.android.package-archive",
  "application/octet-stream",
  "application/zip",
  "application/x-zip-compressed",
]);

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Comprehensive validation of an uploaded release file.
 */
export function validateApkFile(
  fileName: string,
  buffer: Buffer | Uint8Array,
  mimeType?: string
): FileValidationResult {
  // 1. Extension check
  const lowerName = (fileName || "").trim().toLowerCase();
  if (!lowerName.endsWith(".apk")) {
    return {
      valid: false,
      error: "Invalid file type. Only Android application packages (.apk) are accepted.",
    };
  }

  // 2. Minimum length check
  if (!buffer || buffer.length < 1024) {
    return {
      valid: false,
      error: "File is corrupt or empty (smaller than 1 KB).",
    };
  }

  // 3. Maximum size check
  const maxSize = getMaxReleaseSizeBytes();
  if (buffer.length > maxSize) {
    const maxMb = (maxSize / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File size exceeds the maximum allowed limit of ${maxMb} MB.`,
    };
  }

  // 4. Magic bytes validation (PK\x03\x04)
  if (!isValidApkMagicBytes(buffer)) {
    return {
      valid: false,
      error: "File signature verification failed. The uploaded file is not a valid Android APK archive.",
    };
  }

  // 5. Optional MIME type verification
  if (mimeType && !ALLOWED_APK_MIME_TYPES.has(mimeType.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported MIME type "${mimeType}". Expected Android package archive.`,
    };
  }

  return { valid: true };
}

/**
 * Sanitizes a filename to prevent path traversal, null byte injections,
 * and dangerous filesystem characters.
 */
export function sanitizeFileName(rawFileName: string): string {
  if (!rawFileName) return "release.apk";

  // Remove directory traversals and path components
  let clean = rawFileName
    .replace(/^.*[\\/]/, "") // strip leading paths
    .replace(/\0/g, "")      // strip null bytes
    .replace(/[^a-zA-Z0-9._-]/g, "_") // only safe characters
    .trim();

  // Ensure ends with .apk
  if (!clean.toLowerCase().endsWith(".apk")) {
    clean = `${clean}.apk`;
  }

  // Collapse multiple dots or underscores
  clean = clean.replace(/\.{2,}/g, ".").replace(/_{2,}/g, "_");

  return clean || "release.apk";
}

/**
 * Generates a safe, deterministic server-side storage path.
 * Format: {appId}/{releaseId}/{safeFilename}
 */
export function generateStoragePath(
  appId: string,
  releaseId: string,
  fileName: string
): string {
  const safeApp = (appId || "app").replace(/[^a-zA-Z0-9_-]/g, "");
  const safeRelease = (releaseId || "release").replace(/[^a-zA-Z0-9_.-]/g, "");
  const safeFile = sanitizeFileName(fileName);

  if (!safeApp || !safeRelease) {
    throw new Error("Invalid app or release identifier for storage path generation.");
  }

  return `${safeApp}/${safeRelease}/${safeFile}`;
}

/**
 * Computes a 64-character lowercase hexadecimal SHA-256 checksum for a buffer.
 */
export function calculateSha256(buffer: Buffer | Uint8Array): string {
  return createHash("sha256").update(buffer).digest("hex").toLowerCase();
}

/**
 * Validates whether a given string is a valid 64-character hexadecimal SHA-256 checksum.
 */
export function isValidSha256(hash?: string | null): boolean {
  if (!hash) return false;
  return /^[a-fA-F0-9]{64}$/.test(hash.trim());
}
