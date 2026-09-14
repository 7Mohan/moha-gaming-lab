/**
 * lib/monetization/providers/direct-sponsor-provider.tsx
 * ────────────────────────────────────────────────────────────────
 * Direct Sponsor & Partner Card Provider for Moha Gaming Lab.
 * Clean, technical, and non-deceptive partner highlight.
 */

import * as React from "react";
import type { IAdProvider, AdPlacementConfig, AdDimensions } from "../types";
import { ExternalLink } from "lucide-react";

export class DirectSponsorProvider implements IAdProvider {
  getProviderName(): string {
    return "Direct Sponsor";
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
    return (
      <div
        data-placement={placement.key}
        className={`w-full p-4 rounded-xl border border-border-default bg-bg-surface hover:border-border-strong transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className || ""}`}
        style={{
          minHeight: `${dimensions.minHeight}px`,
          maxWidth: dimensions.maxWidth ? `${dimensions.maxWidth}px` : undefined,
        }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
              Sponsored
            </span>
            <h4 className="text-xs font-bold text-text-primary">
              Hardware Optimization Partner
            </h4>
          </div>
          <p className="text-2xs text-text-muted leading-relaxed">
            Support independent Android gaming benchmarking and high-FPS telemetry.
          </p>
        </div>

        <a
          href="/contact?topic=sponsorship"
          className="px-3 py-1.5 rounded-lg bg-bg-elevated hover:bg-bg-overlay border border-border-subtle text-xs font-mono text-text-secondary hover:text-white transition-all flex items-center gap-1.5 shrink-0 self-end sm:self-auto cursor-pointer"
          rel="sponsored noopener"
        >
          <span>Learn More</span>
          <ExternalLink size={12} />
        </a>
      </div>
    );
  }
}
