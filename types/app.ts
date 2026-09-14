/**
 * App Data Models & Types — Moha Gaming Lab
 * Scalable architecture for Android gaming utilities and download management.
 */

export type AppCategory =
  | "Gaming Tools"
  | "Performance"
  | "Diagnostics"
  | "Network"
  | "Customization"
  | "Game Utilities"
  | "Device Utilities"
  | "Development";

export type AppPlatform = "android";

export type AppArchitecture =
  | "arm64-v8a"
  | "armeabi-v7a"
  | "x86_64"
  | "universal";

export type VerificationStatus =
  | "verified"
  | "unverified"
  | "pending"
  | "failed"
  | "unavailable";

export type DownloadSource =
  | "hosted"
  | "github_release"
  | "official_site"
  | "fdroid"
  | "trusted_external"
  | "direct"
  | "unverified";

export type PermissionProtectionLevel =
  | "normal"
  | "dangerous"
  | "signature"
  | "special";

export interface AppPermission {
  id: string;
  name: string;
  protectionLevel: PermissionProtectionLevel;
  reason: string;
}

export interface AppRelease {
  id?: string;
  version: string;
  versionCode?: number;
  releaseDate: string; // ISO 8601 YYYY-MM-DD
  androidMinVersion: string;
  targetSdkVersion?: number;
  architectures: AppArchitecture[];
  fileSize?: number; // bytes
  downloadUrl?: string;
  sourceUrl?: string;
  sourceName: string;
  sourceType: DownloadSource;
  checksumSha256?: string;
  checksumMd5?: string;
  checksumAlgorithm?: string;
  verificationStatus: VerificationStatus;
  verificationEvidence?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  storagePath?: string;
  fileName?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  status?: "published" | "draft" | "review" | "archived";
  createdBy?: string;
  updatedBy?: string;
  changelog: string[];
}

export interface AppInstallGuide {
  prerequisites: string[];
  installationSteps: string[];
  specialSetup?: {
    type: "adb" | "shizuku" | "root" | "none";
    instructions: string[];
    commands?: string[];
  };
  uninstallSteps: string[];
  troubleshooting?: {
    issue: string;
    resolution: string;
  }[];
}

export type AppStatus = "active" | "stable" | "beta" | "deprecated" | "coming-soon";

export interface App {
  id: string;
  slug: string;
  name: string;
  excerpt: string;
  description: string;
  category: AppCategory;
  tags: string[];
  platform: AppPlatform;
  packageName?: string;
  developer: string;
  developerUrl?: string;
  license: string;
  iconUrl?: string;
  requiresRoot: boolean;
  requiresShizuku?: boolean;
  minAndroidVersion: string;
  minApiLevel: number;
  targetSdkVersion?: number;
  architectures: AppArchitecture[];
  releases: AppRelease[];
  permissions: AppPermission[];
  features: string[];
  installGuide: AppInstallGuide;
  relatedGames: string[];
  relatedTools: string[];
  relatedGuides: string[];
  featured: boolean;
  status: AppStatus;
}

/** Helper to generate SEO metadata */
export function buildAppOgTitle(app: App): string {
  return `${app.name} Android Download (v${app.releases[0]?.version ?? "Latest"}) | Moha Gaming Lab`;
}

export function buildAppOgDescription(app: App): string {
  return `${app.excerpt} Android ${app.minAndroidVersion}+ compatible. Verified source, architecture info, and checksums.`;
}
