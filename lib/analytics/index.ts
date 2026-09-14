/**
 * lib/analytics/index.ts
 * ────────────────────────────────────────────────────────────────
 * Public barrel export for Moha Gaming Lab Analytics Infrastructure.
 */

export * from "./types";
export * from "./consent";
export * from "./validation";
export * from "./tracker";
export { BaseAnalyticsProvider } from "./providers/base";
export { InternalAnalyticsProvider } from "./providers/internal";
export { GA4AnalyticsProvider } from "./providers/ga4";
export { PlausibleAnalyticsProvider } from "./providers/plausible";
