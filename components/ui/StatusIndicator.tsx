import * as React from "react";
import { cn } from "@/lib/cn";

export type StatusType =
  | "stable"
  | "good"
  | "moderate"
  | "warning"
  | "critical"
  | "available"
  | "coming-soon"
  | "unsupported"
  | "beta"
  | "online"
  | "offline"
  | "deprecated";

interface StatusIndicatorProps {
  status: StatusType;
  showLabel?: boolean;
  variant?: "dot" | "badge" | "minimal";
  className?: string;
}

interface StatusConfig {
  label: string;
  dotClass: string;
  badgeBg: string;
  badgeBorder: string;
  textClass: string;
  symbol: string;
}

const statusConfig: Record<StatusType, StatusConfig> = {
  stable: {
    label: "Stable",
    dotClass: "bg-status-success shadow-[0_0_8px_rgba(0,229,160,0.5)]",
    badgeBg: "bg-status-success/10",
    badgeBorder: "border-status-success/30",
    textClass: "text-status-success",
    symbol: "\u2713",
  },
  good: {
    label: "Good",
    dotClass: "bg-status-success",
    badgeBg: "bg-status-success/10",
    badgeBorder: "border-status-success/20",
    textClass: "text-status-success",
    symbol: "\u2713",
  },
  available: {
    label: "Available",
    dotClass: "bg-status-success animate-pulse-accent",
    badgeBg: "bg-status-success/10",
    badgeBorder: "border-status-success/30",
    textClass: "text-status-success",
    symbol: "\u25CF",
  },
  online: {
    label: "Available",
    dotClass: "bg-status-success animate-pulse-accent",
    badgeBg: "bg-status-success/10",
    badgeBorder: "border-status-success/30",
    textClass: "text-status-success",
    symbol: "\u25CF",
  },
  moderate: {
    label: "Moderate",
    dotClass: "bg-status-warning",
    badgeBg: "bg-status-warning/10",
    badgeBorder: "border-status-warning/25",
    textClass: "text-status-warning",
    symbol: "\u25B2",
  },
  warning: {
    label: "Warning",
    dotClass: "bg-status-warning shadow-[0_0_8px_rgba(245,158,11,0.4)]",
    badgeBg: "bg-status-warning/10",
    badgeBorder: "border-status-warning/35",
    textClass: "text-status-warning",
    symbol: "\u26A0",
  },
  critical: {
    label: "Critical",
    dotClass: "bg-status-error shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse",
    badgeBg: "bg-status-error/10",
    badgeBorder: "border-status-error/40",
    textClass: "text-status-error",
    symbol: "!",
  },
  offline: {
    label: "Offline",
    dotClass: "bg-status-error",
    badgeBg: "bg-status-error/10",
    badgeBorder: "border-status-error/30",
    textClass: "text-status-error",
    symbol: "\u2715",
  },
  beta: {
    label: "Beta",
    dotClass: "bg-status-info",
    badgeBg: "bg-status-info/10",
    badgeBorder: "border-status-info/25",
    textClass: "text-status-info",
    symbol: "\u03B2",
  },
  "coming-soon": {
    label: "Coming Soon",
    dotClass: "bg-text-muted",
    badgeBg: "bg-bg-elevated",
    badgeBorder: "border-border-default",
    textClass: "text-text-muted",
    symbol: "\u25CB",
  },
  unsupported: {
    label: "Unsupported",
    dotClass: "bg-text-muted/60",
    badgeBg: "bg-bg-surface",
    badgeBorder: "border-border-subtle",
    textClass: "text-text-muted",
    symbol: "-",
  },
  deprecated: {
    label: "Deprecated",
    dotClass: "bg-text-muted/40",
    badgeBg: "bg-bg-surface",
    badgeBorder: "border-border-subtle",
    textClass: "text-text-muted",
    symbol: "-",
  },
};

export function StatusIndicator({
  status,
  showLabel = true,
  variant = "dot",
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status] || statusConfig.available;

  if (variant === "badge") {
    return (
      <span
        role="status"
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs border text-2xs font-mono uppercase tracking-wider font-semibold",
          config.badgeBg,
          config.badgeBorder,
          config.textClass,
          className
        )}
      >
        <span className="text-[9px] leading-none" aria-hidden="true">
          {config.symbol}
        </span>
        {showLabel && <span>{config.label}</span>}
      </span>
    );
  }

  return (
    <span
      role="status"
      className={cn("inline-flex items-center gap-1.5", className)}
    >
      <span
        className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", config.dotClass)}
        aria-hidden="true"
      />
      {showLabel && (
        <span
          className={cn(
            "font-mono text-2xs uppercase tracking-widest font-medium flex items-center gap-1",
            config.textClass
          )}
        >
          <span>{config.label}</span>
        </span>
      )}
    </span>
  );
}
