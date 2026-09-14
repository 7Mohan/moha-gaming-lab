"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface TelemetrySparklineProps {
  /** Array of numeric data points (e.g. FPS readings or frame times) */
  data: number[];
  /** Optional target baseline line (e.g. 60 or 120 FPS) */
  targetLine?: number;
  /** Width of the SVG viewbox */
  width?: number;
  /** Height of the SVG viewbox */
  height?: number;
  /** Accent color variant */
  color?: "accent" | "warning" | "error" | "info";
  /** Optional aria-label for accessibility */
  label?: string;
  className?: string;
}

const colorMap = {
  accent: { stroke: "#00E5A0", fill: "rgba(0, 229, 160, 0.08)", target: "rgba(0, 229, 160, 0.25)" },
  warning: { stroke: "#F59E0B", fill: "rgba(245, 158, 11, 0.08)", target: "rgba(245, 158, 11, 0.25)" },
  error: { stroke: "#EF4444", fill: "rgba(239, 68, 68, 0.08)", target: "rgba(239, 68, 68, 0.25)" },
  info: { stroke: "#3B82F6", fill: "rgba(59, 130, 246, 0.08)", target: "rgba(59, 130, 246, 0.25)" },
};

export function TelemetrySparkline({
  data,
  targetLine,
  width = 240,
  height = 56,
  color = "accent",
  label = "Performance telemetry trend line",
  className,
}: TelemetrySparklineProps) {
  const gradientId = React.useId();
  const theme = colorMap[color] || colorMap.accent;

  if (!data || data.length < 2) {
    return (
      <div className="h-10 flex items-center justify-center text-xs font-mono text-text-muted">
        Insufficient telemetry data
      </div>
    );
  }

  const minVal = Math.min(...data, targetLine !== undefined ? targetLine - 5 : Infinity);
  const maxVal = Math.max(...data, targetLine !== undefined ? targetLine + 5 : -Infinity);
  const range = maxVal - minVal || 1;

  // Compute points with padding
  const paddingY = 6;
  const usableHeight = height - paddingY * 2;
  const stepX = width / (data.length - 1);

  const points = data.map((val, idx) => {
    const x = idx * stepX;
    const normalizedY = (val - minVal) / range;
    const y = height - paddingY - normalizedY * usableHeight;
    return { x, y, val };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    return `${acc} ${idx === 0 ? "M" : "L"} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
  }, "");

  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  // Target line Y coordinate
  let targetY: number | null = null;
  if (targetLine !== undefined) {
    const normTarget = (targetLine - minVal) / range;
    targetY = height - paddingY - normTarget * usableHeight;
  }

  return (
    <div className={cn("relative w-full overflow-hidden select-none", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto block overflow-visible"
        role="img"
        aria-label={label}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.stroke} stopOpacity="0.18" />
            <stop offset="100%" stopColor={theme.stroke} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Target baseline if defined */}
        {targetY !== null && (
          <line
            x1="0"
            y1={targetY}
            x2={width}
            y2={targetY}
            stroke={theme.target}
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}

        {/* Area fill */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* Trend stroke */}
        <path
          d={pathD}
          fill="none"
          stroke={theme.stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Last data point marker */}
        {points.length > 0 && points[points.length - 1] && (
          <circle
            cx={points[points.length - 1]!.x}
            cy={points[points.length - 1]!.y}
            r="2.5"
            fill={theme.stroke}
          />
        )}
      </svg>
    </div>
  );
}
