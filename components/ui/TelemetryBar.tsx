import * as React from "react";
import { cn } from "@/lib/cn";

export interface TelemetryBarProps {
  label: string;
  value: number; // e.g. 64% or 42°C
  max?: number;
  unit?: string;
  warningThreshold?: number;
  criticalThreshold?: number;
  className?: string;
  size?: "sm" | "md";
}

export function TelemetryBar({
  label,
  value,
  max = 100,
  unit = "%",
  warningThreshold = 75,
  criticalThreshold = 90,
  className,
  size = "md",
}: TelemetryBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  let statusColor = "bg-accent";
  let textColor = "text-text-primary";

  if (value >= criticalThreshold) {
    statusColor = "bg-status-error";
    textColor = "text-status-error";
  } else if (value >= warningThreshold) {
    statusColor = "bg-status-warning";
    textColor = "text-status-warning";
  }

  return (
    <div className={cn("flex flex-col gap-1.5 w-full", className)}>
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-text-secondary uppercase tracking-wider text-2xs">
          {label}
        </span>
        <span className={cn("font-semibold", textColor)}>
          {value}
          <span className="text-text-muted text-2xs ml-0.5">{unit}</span>
        </span>
      </div>

      <div
        className={cn(
          "w-full bg-bg-surface border border-border-default rounded-xs overflow-hidden",
          size === "sm" ? "h-1.5" : "h-2"
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label}: ${value}${unit}`}
      >
        <div
          className={cn("h-full transition-all duration-300 ease-out rounded-xs", statusColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
