/**
 * lib/monetization/providers/index.ts
 * ────────────────────────────────────────────────────────────────
 * Ad Provider Factory for Moha Gaming Lab.
 */

import type { IAdProvider, AdProviderType } from "../types";
import { TestPlaceholderProvider } from "./test-provider";
import { GoogleAdSenseProvider } from "./adsense-provider";
import { DirectSponsorProvider } from "./direct-sponsor-provider";
import { getActiveProviderType } from "../config";

const providerRegistry: Record<AdProviderType, IAdProvider> = {
  TEST_PLACEHOLDER: new TestPlaceholderProvider(),
  ADSENSE: new GoogleAdSenseProvider(),
  DIRECT_SPONSOR: new DirectSponsorProvider(),
  AFFILIATE: new DirectSponsorProvider(), // Re-uses direct partner card layout
};

/**
 * Returns the requested or active ad provider instance.
 */
export function getAdProvider(type?: AdProviderType): IAdProvider {
  const targetType = type || getActiveProviderType();
  return providerRegistry[targetType] || providerRegistry.TEST_PLACEHOLDER;
}
