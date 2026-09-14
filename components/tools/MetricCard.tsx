import * as React from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";

export interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  status?: "good" | "warning" | "error" | "neutral" | "accent";
  badge?: string;
  className?: string;
  sparklineData?: number[];
}

export function MetricCard({
  label,
  value,
  unit,
  subtext,
  status = "neutral",
  badge,
  className,
}: MetricCardProps) {
  const statusColorMap = {
    good: "text-[#00E5A0]",
    accent: "text-accent",
    warning: "text-[#F59E0B]",
    error: "text-[#EF4444]",
    neutral: "text-text-primary",
  };

  const statusBorderMap = {
    good: "border-[#00E5A0]/20",
    accent: "border-accent/20",
    warning: "border-[#F59E0B]/20",
    error: "border-[#EF4444]/20",
    neutral: "border-border-default",
  };

  return (
    <div
      className={cn(
        "border bg-bg-surface rounded-md p-4 flex flex-col justify-between gap-2.5 transition-colors relative overflow-hidden",
        statusBorderMap[status],
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-mono font-medium text-text-muted uppercase tracking-wider">
          {label}
        </span>
        {badge && (
          <Badge variant={status === "good" || status === "accent" ? "accent" : status === "warning" ? "warning" : "default"} size="sm">
            {badge}
          </Badge>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 my-0.5">
        <span
          className={cn(
            "text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums leading-none",
            statusColorMap[status]
          )}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs font-mono font-semibold text-text-secondary">
            {unit}
          </span>
        )}
      </div>

      {subtext && (
        <p className="text-2xs text-text-muted leading-tight truncate">
          {subtext}
        </p>
      )}
    </div>
  );
}

export function MetricGrid({
  children,
  columns = 4,
  className,
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const colClass = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
  }[columns];

  return (
    <div className={cn("grid gap-3", colClass, className)}>
      {children}
    </div>
  );
}
