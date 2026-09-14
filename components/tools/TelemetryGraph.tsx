"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface TelemetryGraphProps {
  data: number[];
  targetLine?: number;
  targetLabel?: string;
  unit?: string;
  height?: number;
  min?: number;
  max?: number;
  className?: string;
  lineColor?: string;
  spikeThreshold?: number;
}

export function TelemetryGraph({
  data,
  targetLine,
  targetLabel,
  unit = "ms",
  height = 160,
  min: customMin,
  max: customMax,
  className,
  lineColor = "#00E5A0",
  spikeThreshold,
}: TelemetryGraphProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Background grid
    ctx.strokeStyle = "#1A1F26";
    ctx.lineWidth = 1;

    // Horizontal grid lines
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = (h / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (data.length < 2) {
      // Waiting for data state
      ctx.fillStyle = "#525C68";
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Waiting for telemetry stream...", w / 2, h / 2);
      return;
    }

    const dataMin = customMin !== undefined ? customMin : Math.min(...data);
    const dataMax = customMax !== undefined ? customMax : Math.max(...data);
    const range = Math.max(dataMax - dataMin, 1);

    const getY = (val: number) => {
      const normalized = (val - dataMin) / range;
      // Invert Y so higher values are higher up
      return h - normalized * (h - 24) - 12;
    };

    // Draw target line if provided
    if (targetLine !== undefined && targetLine >= dataMin && targetLine <= dataMax) {
      const targetY = getY(targetLine);
      ctx.strokeStyle = "rgba(139, 148, 158, 0.4)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, targetY);
      ctx.lineTo(w, targetY);
      ctx.stroke();
      ctx.setLineDash([]);

      if (targetLabel) {
        ctx.fillStyle = "#8B949E";
        ctx.font = "10px monospace";
        ctx.textAlign = "right";
        ctx.fillText(`${targetLabel} (${targetLine}${unit})`, w - 8, targetY - 4);
      }
    }

    // Step width
    const stepX = w / Math.max(data.length - 1, 1);

    // Draw filled area under line
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let i = 0; i < data.length; i++) {
      const val = data[i] ?? 0;
      const x = i * stepX;
      const y = getY(val);
      if (i === 0) ctx.lineTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "rgba(0, 229, 160, 0.15)");
    gradient.addColorStop(1, "rgba(0, 229, 160, 0.0)");
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw main telemetry stroke
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const val = data[i] ?? 0;
      const x = i * stepX;
      const y = getY(val);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Highlight spikes if threshold provided
    if (spikeThreshold !== undefined) {
      ctx.fillStyle = "#EF4444";
      for (let i = 0; i < data.length; i++) {
        const val = data[i] ?? 0;
        if (val >= spikeThreshold) {
          const x = i * stepX;
          const y = getY(val);
          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw current (latest) point marker
    const lastVal = data[data.length - 1] ?? 0;
    const lastX = (data.length - 1) * stepX;
    const lastY = getY(lastVal);
    ctx.fillStyle = lineColor;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fill();
  }, [data, targetLine, targetLabel, unit, height, customMin, customMax, lineColor, spikeThreshold]);

  const latestVal = data.length > 0 ? (data[data.length - 1] ?? 0) : null;

  return (
    <div className={cn("border border-border-default bg-bg-surface rounded-md p-3 relative", className)}>
      <div className="flex items-center justify-between gap-2 mb-2 text-2xs font-mono text-text-muted">
        <span>LIVE TELEMETRY STREAM</span>
        {latestVal !== null && (
          <span className="text-accent font-semibold tabular-nums">
            {latestVal.toFixed(1)} {unit}
          </span>
        )}
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: `${height}px`, display: "block" }}
        className="rounded-xs"
      />
    </div>
  );
}
