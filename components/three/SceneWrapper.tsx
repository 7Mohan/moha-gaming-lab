"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useWebGL } from "@/hooks/useWebGL";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Dynamically import the actual 3D canvas — never on SSR, never blocking
const DeviceScene = dynamic(
  () => import("./DeviceScene").then((m) => m.DeviceScene),
  {
    ssr: false,
    loading: () => <SceneSkeleton />,
  }
);

interface SceneWrapperProps {
  /** Which 3D scene to render */
  scene: "device";
  /** Explicit height class, e.g. "h-[480px]" */
  heightClass?: string;
  className?: string;
}

/**
 * SceneWrapper — the entry point for all 3D content.
 *
 * Responsibilities:
 *  - Detect WebGL capability
 *  - Detect reduced-motion preference
 *  - Lazy-load heavy 3D component only when needed
 *  - Show graceful fallback if WebGL unavailable or motion is reduced
 *  - Never block page render
 */
class SceneErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown) {
    console.warn("3D Scene caught error:", error);
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function SceneWrapper({
  scene,
  heightClass = "h-[420px]",
  className = "",
}: SceneWrapperProps) {
  const capability = useWebGL();
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // SSR / hydration: show skeleton until client mounts
  if (!mounted) return <SceneSkeleton heightClass={heightClass} />;

  // Accessibility: respect reduced-motion preference
  if (reducedMotion) return <ReducedMotionFallback heightClass={heightClass} />;

  // No WebGL support
  if (capability === "none") return <NoWebGLFallback heightClass={heightClass} />;

  return (
    <div
      className={`relative ${heightClass} ${className}`}
      aria-label="3D interactive scene"
      role="img"
    >
      <SceneErrorBoundary fallback={<NoWebGLFallback heightClass={heightClass} />}>
        <React.Suspense fallback={<SceneSkeleton heightClass={heightClass} />}>
          {scene === "device" && (
            <DeviceScene capability={capability} />
          )}
        </React.Suspense>
      </SceneErrorBoundary>
    </div>
  );
}

// --- Fallback components ---

function SceneSkeleton({ heightClass = "h-[420px]" }: { heightClass?: string }) {
  return (
    <div
      className={`${heightClass} flex items-center justify-center bg-bg-surface border border-border-subtle rounded-lg`}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        <span className="label-mono text-text-muted">Loading scene</span>
      </div>
    </div>
  );
}

function ReducedMotionFallback({ heightClass = "h-[420px]" }: { heightClass?: string }) {
  return (
    <div
      className={`${heightClass} flex items-center justify-center bg-bg-surface border border-border-subtle rounded-lg`}
      role="img"
      aria-label="Android device visualization (static — animations disabled)"
    >
      <div className="flex flex-col items-center gap-4 text-center px-6">
        <div className="w-16 h-28 border-2 border-border-strong rounded-2xl flex items-end justify-center pb-3">
          <div className="w-6 h-1 bg-border-strong rounded-full" />
        </div>
        <p className="text-xs font-mono text-text-muted">
          3D scene hidden — reduced motion enabled
        </p>
      </div>
    </div>
  );
}

function NoWebGLFallback({ heightClass = "h-[420px]" }: { heightClass?: string }) {
  return (
    <div
      className={`${heightClass} flex items-center justify-center bg-bg-surface border border-border-subtle rounded-lg`}
      role="img"
      aria-label="Android device visualization (static — WebGL unavailable)"
    >
      <div className="flex flex-col items-center gap-4 text-center px-6">
        <div className="w-16 h-28 border-2 border-border-strong rounded-2xl flex items-end justify-center pb-3">
          <div className="w-6 h-1 bg-border-strong rounded-full" />
        </div>
        <p className="text-xs font-mono text-text-muted">
          3D unavailable on this device
        </p>
      </div>
    </div>
  );
}
