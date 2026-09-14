/**
 * lib/monetization/providers/adsense-provider.tsx
 * ────────────────────────────────────────────────────────────────
 * Google AdSense Provider implementation for Moha Gaming Lab.
 * Sandboxed, asynchronous, and Core Web Vitals-compliant.
 */

import * as React from "react";
import type { IAdProvider, AdPlacementConfig, AdDimensions } from "../types";

export class GoogleAdSenseProvider implements IAdProvider {
  private clientId: string;

  constructor(clientId?: string) {
    this.clientId = clientId || process.env.NEXT_PUBLIC_AD_CLIENT_ID || "";
  }

  getProviderName(): string {
    return "Google AdSense";
  }

  renderSlot({
    placement,
    dimensions,
    isTestMode,
    className,
  }: {
    placement: AdPlacementConfig;
    dimensions: AdDimensions;
    isTestMode: boolean;
    className?: string;
  }): React.ReactNode {
    return (
      <AdSenseSlotInner
        clientId={this.clientId}
        placement={placement}
        dimensions={dimensions}
        isTestMode={isTestMode}
        className={className}
      />
    );
  }
}

interface AdSenseSlotInnerProps {
  clientId: string;
  placement: AdPlacementConfig;
  dimensions: AdDimensions;
  isTestMode: boolean;
  className?: string;
}

function AdSenseSlotInner({
  clientId,
  placement,
  dimensions,
  isTestMode,
  className,
}: AdSenseSlotInnerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = React.useState(false);
  const [adError, setAdError] = React.useState(false);

  React.useEffect(() => {
    if (isTestMode || !clientId) return;

    try {
      // Ensure adsbygoogle array exists
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      win.adsbygoogle = win.adsbygoogle || [];
      win.adsbygoogle.push({});
      setAdLoaded(true);
    } catch {
      setAdError(true);
    }
  }, [clientId, isTestMode]);

  // Fallback if test mode or no client ID configured
  if (isTestMode || !clientId || adError) {
    return (
      <div
        className={`w-full flex items-center justify-center p-3 rounded-xl border border-border-default bg-bg-surface text-text-muted ${className || ""}`}
        style={{
          minHeight: `${dimensions.minHeight}px`,
          maxWidth: dimensions.maxWidth ? `${dimensions.maxWidth}px` : undefined,
        }}
      >
        <span className="text-2xs font-mono text-text-muted">
          AdSense slot: {placement.slotId || placement.key} (Test Mode)
        </span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-ad-status={adLoaded ? "filled" : "loading"}
      className={`w-full flex justify-center overflow-hidden ${className || ""}`}
      style={{
        minHeight: `${dimensions.minHeight}px`,
        maxWidth: dimensions.maxWidth ? `${dimensions.maxWidth}px` : undefined,
      }}
    >
      <ins
        className="adsbygoogle"
        style={{
          display: "block",
          minHeight: `${dimensions.minHeight}px`,
          width: "100%",
        }}
        data-ad-client={clientId}
        data-ad-slot={placement.slotId || "default"}
        data-ad-format={placement.format === "BANNER_HORIZONTAL" ? "horizontal" : "auto"}
        data-full-width-responsive="true"
      />
    </div>
  );
}
