import type { App, AppCategory, AppArchitecture, VerificationStatus } from "@/types/app";

export const APP_CATEGORIES: AppCategory[] = [
  "Gaming Tools",
  "Performance",
  "Diagnostics",
  "Network",
  "Customization",
  "Game Utilities",
  "Device Utilities",
  "Development",
];

export const APP_ARCHITECTURES: AppArchitecture[] = [
  "arm64-v8a",
  "armeabi-v7a",
  "x86_64",
  "universal",
];

export const VERIFICATION_STATUSES: VerificationStatus[] = [
  "verified",
  "pending",
  "unverified",
  "unavailable",
];

export interface AppFilters {
  query?: string;
  category?: string;
  architecture?: string;
  minAndroid?: string;
  verification?: string;
  requiresRoot?: string; // "all" | "no-root" | "root-only"
}

/**
 * Multi-field token-based search and filter engine for Android apps.
 */
export function filterApps(appsList: App[], filters: AppFilters): App[] {
  let result = appsList;

  // 1. Text Query
  if (filters.query && filters.query.trim().length > 0) {
    const tokens = filters.query.toLowerCase().trim().split(/\s+/);
    result = result.filter((app) => {
      const searchable = [
        app.name,
        app.excerpt,
        app.description,
        app.developer,
        app.packageName ?? "",
        app.category,
        ...app.tags,
        ...app.features,
      ]
        .join(" ")
        .toLowerCase();

      return tokens.every((token) => searchable.includes(token));
    });
  }

  // 2. Category Filter
  if (filters.category && filters.category !== "all") {
    result = result.filter(
      (app) => app.category.toLowerCase() === filters.category!.toLowerCase()
    );
  }

  // 3. Architecture Filter
  if (filters.architecture && filters.architecture !== "all") {
    result = result.filter((app) =>
      app.architectures.includes(filters.architecture as AppArchitecture) ||
      app.architectures.includes("universal")
    );
  }

  // 4. Min Android Version Filter
  if (filters.minAndroid && filters.minAndroid !== "all") {
    const targetMin = parseFloat(filters.minAndroid);
    result = result.filter((app) => {
      const appMin = parseFloat(app.minAndroidVersion);
      return isNaN(appMin) || isNaN(targetMin) || appMin <= targetMin;
    });
  }

  // 5. Verification Status Filter
  if (filters.verification && filters.verification !== "all") {
    result = result.filter((app) => {
      const latest = app.releases[0];
      return latest && latest.verificationStatus === filters.verification;
    });
  }

  // 6. Root Requirement Filter
  if (filters.requiresRoot && filters.requiresRoot !== "all") {
    if (filters.requiresRoot === "no-root") {
      result = result.filter((app) => !app.requiresRoot);
    } else if (filters.requiresRoot === "root-only") {
      result = result.filter((app) => app.requiresRoot);
    }
  }

  return result;
}
