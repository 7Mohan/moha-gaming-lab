"use client";

import * as React from "react";
import type { AdFormat, AdPlacementConfig } from "@/lib/monetization/types";
import {
  getDimensionsForFormat,
  getPlacementConfig,
  isAdTestMode,
  isMonetizationEnabled,
} from "@/lib/monetization/config";
import { getAdProvider } from "@/lib/monetization/providers";
import { trackMonetizationEvent } from "@/lib/monetization/analytics";

interface AdSlotProps {
  placement: string | AdPlacementConfig;
  format?: AdFormat;
  className?: string;
  fallback?: React.ReactNode;
}

export function AdSlot({
  placement,
  format: overrideFormat,
  className,
  fallback,
}: AdSlotProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const [hasReportedImpression, setHasReportedImpression] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  // Resolve placement config
  const config: AdPlacementConfig | null = React.useMemo(() => {
    if (typeof placement === "string") {
      return getPlacementConfig(placement);
    }
    return placement;
  }, [placement]);

  const activeFormat = overrideFormat || config?.format || "RESPONSIVE";
  const dimensions = getDimensionsForFormat(activeFormat);
  const isEnabled = isMonetizationEnabled() && (config ? config.enabled : true);
  const isTest = isAdTestMode();

  // Lazy loading via IntersectionObserver with 200px pre-load margin
  React.useEffect(() => {
    if (!isEnabled || isVisible) return;

    const currentElem = containerRef.current;
    if (!currentElem) return;

    // If IntersectionObserver is not supported, render immediately
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "200px 0px" }
    );

    observer.observe(currentElem);

    return () => {
      observer.disconnect();
    };
  }, [isEnabled, isVisible]);

  // Track anonymous impression when slot becomes visible
  React.useEffect(() => {
    if (isVisible && !hasReportedImpression && config) {
      setHasReportedImpression(true);
      trackMonetizationEvent({
        eventType: "AD_IMPRESSION",
        placementKey: config.key,
      });
    }
  }, [isVisible, hasReportedImpression, config]);

  // If monetization is disabled or placement is disabled, render nothing
  if (!isEnabled || !config) {
    return null;
  }

  // If slot had a script error, render fallback or collapse cleanly
  if (hasError) {
    return fallback ? <>{fallback}</> : null;
  }

  const provider = getAdProvider(config.provider);

  return (
    <div
      ref={containerRef}
      className={`my-6 flex flex-col items-center justify-center ${className || ""}`}
      role="region"
      aria-label="Advertisement"
    >
      {/* Subtle, honest label */}
      <div className="w-full flex justify-center pb-1">
        <span className="text-[10px] font-mono tracking-widest text-text-muted uppercase select-none opacity-60">
          Advertisement
        </span>
      </div>

      {/* CLS-Protected Container */}
      <div
        className="w-full flex justify-center items-center overflow-hidden"
        style={{
          minHeight: `${dimensions.minHeight}px`,
          maxWidth: dimensions.maxWidth ? `${dimensions.maxWidth}px` : undefined,
        }}
      >
        {isVisible ? (
          <AdSlotErrorBoundary onError={() => setHasError(true)}>
            {provider.renderSlot({
              placement: config,
              dimensions,
              isTestMode: isTest,
            })}
          </AdSlotErrorBoundary>
        ) : (
          // Pre-allocated space while off-screen to guarantee 0 CLS
          <div
            className="w-full"
            style={{ minHeight: `${dimensions.minHeight}px` }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}

class AdSlotErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}
