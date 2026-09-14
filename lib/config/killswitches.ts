/**
 * lib/config/killswitches.ts
 * ────────────────────────────────────────────────────────────────
 * Emergency Operational Kill Switches & Feature Flags.
 *
 * Provides zero-downtime, runtime feature toggles for high-risk systems:
 * 1. Maintenance Mode (MAINTENANCE_MODE)
 * 2. Downloads Gateway (NEXT_PUBLIC_DOWNLOADS_ENABLED / DOWNLOADS_ENABLED)
 * 3. Display Ads (NEXT_PUBLIC_ADS_ENABLED / ADS_ENABLED)
 * 4. Analytics Ingestion (NEXT_PUBLIC_ANALYTICS_ENABLED / ANALYTICS_ENABLED)
 *
 * Designed to be safe against undefined values, respecting production defaults.
 */

export interface OperationalStatus {
  maintenanceMode: boolean;
  downloadsEnabled: boolean;
  adsEnabled: boolean;
  analyticsEnabled: boolean;
}

/**
 * Returns true if the application has been set into Maintenance Mode.
 * When true, public web pages receive a 503 Service Unavailable response,
 * while /admin and /api/health remain accessible.
 */
export function isMaintenanceMode(): boolean {
  return process.env.MAINTENANCE_MODE === "true";
}

/**
 * Returns true if download endpoints are active.
 * If disabled during a malware alert, broken release, or bandwidth spike,
 * public download attempts will return 503 with an explanatory message.
 */
export function isDownloadsEnabled(): boolean {
  if (process.env.DOWNLOADS_ENABLED === "false") return false;
  if (process.env.NEXT_PUBLIC_DOWNLOADS_ENABLED === "false") return false;
  return true;
}

/**
 * Returns true if monetization/ad display is active.
 * Can be flipped to false instantly if an ad network behaves maliciously or causes layout shifts.
 */
export function isAdsEnabled(): boolean {
  if (process.env.ADS_ENABLED === "false") return false;
  if (process.env.NEXT_PUBLIC_ADS_ENABLED === "false") return false;
  return true;
}

/**
 * Returns true if client-side telemetry and event logging are active.
 */
export function isAnalyticsEnabled(): boolean {
  if (process.env.ANALYTICS_ENABLED === "false") return false;
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "false") return false;
  return true;
}

/**
 * Snapshot of all operational switches for administrative dashboards or status checks.
 */
export function getOperationalStatus(): OperationalStatus {
  return {
    maintenanceMode: isMaintenanceMode(),
    downloadsEnabled: isDownloadsEnabled(),
    adsEnabled: isAdsEnabled(),
    analyticsEnabled: isAnalyticsEnabled(),
  };
}
