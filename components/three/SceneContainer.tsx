"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { SceneWrapper } from "./SceneWrapper";

export interface SceneContainerProps {
  scene?: "device";
  title?: string;
  chipset?: string;
  statusText?: string;
  heightClass?: string;
  className?: string;
}

/**
 * SceneContainer — Design System 3D Viewport Architecture
 *
 * Rules:
 *  1. 3D is strictly contained within a technical diagnostic HUD viewport.
 *  2. Connects 3D device to gaming performance telemetry and live diagnostics.
 *  3. Never renders arbitrary floating celestial bodies, random neon or unrelated game art.
 *  4. Provides accessible fallbacks for reduced-motion and non-WebGL environments.
 */
export function SceneContainer({
  scene = "device",
  title = "Android Hardware Diagnostics",
  chipset = "Snapdragon 888 / Adreno 660",
  statusText = "LIVE 120Hz VULKAN",
  heightClass = "h-[420px]",
  className,
}: SceneContainerProps) {
  return (
    <div
      className={cn(
        "hud-frame flex flex-col justify-between overflow-hidden bg-bg-surface border border-border-default rounded-md",
        className
      )}
    >
      {/* Corner reticles */}
      <span className="hud-reticle-tl" aria-hidden="true" />
      <span className="hud-reticle-tr" aria-hidden="true" />
      <span className="hud-reticle-bl" aria-hidden="true" />
      <span className="hud-reticle-br" aria-hidden="true" />

      {/* Viewport Top Bar */}
      <div className="px-3.5 py-2.5 border-b border-border-subtle flex items-center justify-between gap-3 text-2xs font-mono bg-bg-elevated/40">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-accent" aria-hidden="true" />
          <span className="font-semibold text-text-primary uppercase tracking-wider">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-3 text-text-muted">
          <span className="hidden sm:inline">{chipset}</span>
          <span className="text-accent/80 font-semibold">{statusText}</span>
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <div className={cn("relative w-full flex-1 flex items-center justify-center", heightClass)}>
        <SceneWrapper scene={scene} heightClass="h-full w-full" />
      </div>

      {/* Viewport Bottom Status Bar */}
      <div className="px-3.5 py-2 border-t border-border-subtle flex items-center justify-between text-[10px] font-mono text-text-muted bg-bg-elevated/20">
        <span className="flex items-center gap-1.5">
          <span className="text-accent" aria-hidden="true">&bull;</span>
          <span>INTERACTION: DRAG TO ROTATE DEVICE</span>
        </span>
        <span className="text-text-secondary">FRAME BUFFER: SYNCED</span>
      </div>
    </div>
  );
}
