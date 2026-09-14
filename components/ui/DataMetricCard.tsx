import * as React from "react";
import { cn } from "@/lib/cn";
import { Card } from "./Card";
import { StatusIndicator, type StatusType } from "./StatusIndicator";
import { TelemetrySparkline } from "./TelemetrySparkline";

export interface DataMetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  status: StatusType;
  benchmarkNote?: string;
  variance?: string;
  sparklineData?: number[];
  targetLine?: number;
  className?: string;
}

export function DataMetricCard({
  title,
  value,
  unit,
  status,
  benchmarkNote = "Sample Benchmark Data",
  variance,
  sparklineData,
  targetLine,
  className,
}: DataMetricCardProps) {
  return (
    <Card variant="hud" className={cn("p-4 flex flex-col justify-between gap-3", className)}>
      {/* Top row: Title + Status Indicator */}
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-2xs uppercase tracking-widest text-text-secondary font-semibold">
          {title}
        </span>
        <StatusIndicator status={status} variant="badge" />
      </div>

      {/* Center readout: Large tabular metric */}
      <div className="flex items-baseline gap-2 pt-1">
        <span className="text-3xl font-bold font-mono text-text-primary tracking-tight tabular-nums">
          {value}
        </span>
        <span className="text-xs font-mono text-accent font-semibold tracking-wider">
          {unit}
        </span>
        {variance && (
          <span className="text-2xs font-mono text-text-muted ml-auto">
            {variance}
          </span>
        )}
      </div>

      {/* Sparkline trend if data is provided */}
      {sparklineData && sparklineData.length > 1 && (
        <div className="pt-1 pb-1 border-t border-border-subtle/50">
          <TelemetrySparkline
            data={sparklineData}
            targetLine={targetLine}
            height={44}
            color={
              status === "critical"
                ? "error"
                : status === "warning" || status === "moderate"
                ? "warning"
                : "accent"
            }
          />
        </div>
      )}

      {/* Bottom disclaimer: Honest sample data attribution */}
      <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[10px] font-mono text-text-muted">
        <span className="truncate">{benchmarkNote}</span>
        <span className="text-accent/60 flex-shrink-0">TELEMETRY</span>
      </div>
    </Card>
  );
}
