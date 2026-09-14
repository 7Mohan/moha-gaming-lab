"use client";

import { useEffect, useState } from "react";

export type WebGLCapability = "none" | "low" | "high";

/**
 * Detects WebGL capability level on the current device.
 * Returns:
 *   - "none"  → WebGL not supported, show fallback UI
 *   - "low"   → WebGL1 only or low-end GPU, use simplified scenes
 *   - "high"  → WebGL2 available, full 3D experience
 */
export function useWebGL(): WebGLCapability {
  const [capability, setCapability] = useState<WebGLCapability>("none");

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");

      // Try WebGL2 first
      const gl2 = canvas.getContext("webgl2");
      if (gl2) {
        setCapability("high");
        return;
      }

      // Fall back to WebGL1
      const gl1 =
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");
      if (gl1) {
        setCapability("low");
        return;
      }

      // No WebGL support
      setCapability("none");
    } catch {
      setCapability("none");
    }
  }, []);

  return capability;
}
