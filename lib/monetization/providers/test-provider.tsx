/**
 * lib/monetization/providers/test-provider.tsx
 * ────────────────────────────────────────────────────────────────
 * Development & Test Mode Ad Provider for Moha Gaming Lab.
 * Renders an accessible, high-contrast, non-deceptive placeholder.
 * Never generates fake clicks or simulated revenue.
 */

import * as React from "react";
import type { IAdProvider, AdPlacementConfig, AdDimensions } from "../types";

export class TestPlaceholderProvider implements IAdProvider {
  getProviderName(): string {
    return "Test / Placeholder Provider";
  }

  renderSlot({
    placement,
    dimensions,
    className,
  }: {
    placement: AdPlacementConfig;
    dimensions: AdDimensions;
    isTestMode: boolean;
    className?: string;
  }): React.ReactNode {
    const isMediumRectangle = placement.format === "RECTANGLE_MEDIUM";

    return (
      <div
        className={`w-full flex items-center justify-center p-3 rounded-xl border border-dashed border-border-strong bg-bg-surface/50 text-text-muted transition-colors select-none ${className || ""}`}
        style={{
          minHeight: `${dimensions.minHeight}px`,
          maxWidth: dimensions.maxWidth ? `${dimensions.maxWidth}px` : undefined,
        }}
        data-ad-placement={placement.key}
        data-ad-format={placement.format}
      >
        <div className={`flex ${isMediumRectangle ? "flex-col text-center" : "flex-row"} items-center justify-center gap-2 text-xs font-mono`}>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-bg-elevated border border-border-subtle text-accent text-[10px] uppercase font-bold tracking-wider">
            <span>Ad Preview</span>
          </div>
          <div className="text-2xs text-text-secondary truncate max-w-xs">
            <span className="font-semibold text-white">{placement.name}</span>
            <span className="text-text-muted"> ({placement.format})</span>
          </div>
        </div>
      </div>
    );
  }
}
