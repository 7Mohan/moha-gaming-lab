/**
 * lib/download/versions.ts
 * ────────────────────────────────────────────────────────────────
 * Version-aware sorting, semantic version parsing, and Android versionCode
 * comparison for Moha Gaming Lab releases.
 */

import type { App, AppRelease } from "@/types/app";

/**
 * Compares two semantic version strings safely without lexical sorting errors.
 * Returns:
 *   positive number if a > b
 *   negative number if a < b
 *   0 if equal
 *
 * Correctly evaluates:
 *   compareVersions("10.0", "2.0") > 0
 *   compareVersions("1.0.10", "1.0.2") > 0
 *   compareVersions("1.0.1", "1.0.1") === 0
 */
export function compareVersions(a: string, b: string): number {
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;

  // Clean and normalize version tags (e.g., "v1.4.0" -> "1.4.0")
  const cleanA = a.trim().replace(/^[vV]/, "");
  const cleanB = b.trim().replace(/^[vV]/, "");

  // Separate pre-release tags (e.g., "1.2.0-beta.1")
  const [mainA, preA] = cleanA.split("-");
  const [mainB, preB] = cleanB.split("-");

  const partsA = (mainA || "").split(".").map((p) => {
    const n = parseInt(p, 10);
    return isNaN(n) ? 0 : n;
  });

  const partsB = (mainB || "").split(".").map((p) => {
    const n = parseInt(p, 10);
    return isNaN(n) ? 0 : n;
  });

  const maxLen = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < maxLen; i++) {
    const valA = partsA[i] ?? 0;
    const valB = partsB[i] ?? 0;

    if (valA !== valB) {
      return valA - valB;
    }
  }

  // If main versions are equal, non-prerelease > prerelease
  if (preA && !preB) return -1;
  if (!preA && preB) return 1;
  if (preA && preB) return preA.localeCompare(preB);

  return 0;
}

export const compareVersionStrings = compareVersions;

/**
 * Compares two AppRelease objects, prioritizing Android versionCode when available,
 * then falling back to semantic version string, and finally releaseDate.
 * Sorts in descending order (latest first).
 */
export function compareReleasesDesc(a: AppRelease, b: AppRelease): number {
  // 1. versionCode takes priority if present on both
  if (
    typeof a.versionCode === "number" &&
    typeof b.versionCode === "number" &&
    !isNaN(a.versionCode) &&
    !isNaN(b.versionCode)
  ) {
    if (b.versionCode !== a.versionCode) {
      return b.versionCode - a.versionCode;
    }
  }

  // 2. Semantic version comparison
  const semverComp = compareVersions(b.version, a.version);
  if (semverComp !== 0) {
    return semverComp;
  }

  // 3. Fallback to release date timestamp
  const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
  const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
  return dateB - dateA;
}

/**
 * Returns all published/downloadable releases for an app, sorted latest first.
 */
export function getPublishedReleases(appOrReleases?: App | AppRelease[] | null): AppRelease[] {
  if (!appOrReleases) return [];
  const releases = Array.isArray(appOrReleases) ? appOrReleases : appOrReleases.releases;
  if (!Array.isArray(releases)) return [];

  return releases
    .filter((rel) => {
      // Exclude archived, draft, or unavailable releases
      const status = (rel.status || "published").toLowerCase();
      if (status === "archived" || status === "draft" || status === "review") {
        return false;
      }
      return true;
    })
    .sort(compareReleasesDesc);
}

/**
 * Determines the true latest published release for an app.
 */
export function getLatestPublishedRelease(appOrReleases?: App | AppRelease[] | null): AppRelease | null {
  const published = getPublishedReleases(appOrReleases);
  return published[0] ?? null;
}
