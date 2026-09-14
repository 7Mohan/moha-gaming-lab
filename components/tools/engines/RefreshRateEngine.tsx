"use client";

import * as React from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MetricCard, MetricGrid } from "@/components/tools/MetricCard";
import { TelemetryGraph } from "@/components/tools/TelemetryGraph";
import { LimitationNotice, TechnicalNote } from "@/components/tools/LimitationNotice";

export function RefreshRateEngine() {
  const [isRunning, setIsRunning] = React.useState(true);
  const [fps, setFps] = React.useState<number>(0);
  const [frameInterval, setFrameInterval] = React.useState<number>(0);
  const [detectedTier, setDetectedTier] = React.useState<string>("Detecting...");
  const [history, setHistory] = React.useState<number[]>([]);
  const [screenSpecs, setScreenSpecs] = React.useState<{
    res: string;
    dpr: number;
    colorDepth: number;
  }>({ res: "...", dpr: 1, colorDepth: 24 });

  const frameTimesRef = React.useRef<number[]>([]);
  const lastTimeRef = React.useRef<number>(0);
  const animFrameIdRef = React.useRef<number | null>(null);
  const isRunningRef = React.useRef(true);
  isRunningRef.current = isRunning;

  // Screen specs
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setScreenSpecs({
        res: `${window.screen.width} × ${window.screen.height}`,
        dpr: window.devicePixelRatio || 1,
        colorDepth: window.screen.colorDepth || 24,
      });
    }
  }, []);

  // Measurement loop
  React.useEffect(() => {
    let lastUiUpdate = performance.now();

    const loop = (now: number) => {
      if (!isRunningRef.current) return;

      if (lastTimeRef.current > 0) {
        const delta = now - lastTimeRef.current;
        if (delta > 0 && delta < 100) {
          frameTimesRef.current.push(delta);
          if (frameTimesRef.current.length > 120) {
            frameTimesRef.current.shift();
          }
        }
      }
      lastTimeRef.current = now;

      // Batch UI updates every 150ms to keep UI responsive
      if (now - lastUiUpdate > 150 && frameTimesRef.current.length >= 10) {
        const samples = frameTimesRef.current;
        const avgDelta = samples.reduce((a, b) => a + b, 0) / samples.length;
        const calculatedHz = Math.round(1000 / avgDelta);

        setFps(calculatedHz);
        setFrameInterval(Number(avgDelta.toFixed(2)));

        // Determine closest standard refresh rate tier
        if (calculatedHz >= 220) setDetectedTier("240 Hz High-Speed");
        else if (calculatedHz >= 155) setDetectedTier("165 Hz E-Sports");
        else if (calculatedHz >= 135) setDetectedTier("144 Hz Gaming");
        else if (calculatedHz >= 110) setDetectedTier("120 Hz Flagship");
        else if (calculatedHz >= 80) setDetectedTier("90 Hz Smooth");
        else if (calculatedHz >= 50) setDetectedTier("60 Hz Standard");
        else setDetectedTier(`${calculatedHz} Hz (Throttled)`);

        setHistory((prev) => {
          const next = [...prev, calculatedHz];
          return next.slice(-40);
        });

        lastUiUpdate = now;
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    if (isRunning) {
      lastTimeRef.current = performance.now();
      animFrameIdRef.current = requestAnimationFrame(loop);
    }

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isRunning]);

  const handleReset = () => {
    frameTimesRef.current = [];
    lastTimeRef.current = performance.now();
    setHistory([]);
    setFps(0);
    setFrameInterval(0);
    setDetectedTier("Detecting...");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Live Measurement Grid */}
      <MetricGrid columns={4}>
        <MetricCard
          label="Observed Rate"
          value={fps > 0 ? fps : "--"}
          unit="Hz"
          subtext="Composited requestAnimationFrame frequency"
          status={fps >= 90 ? "good" : fps >= 55 ? "accent" : "warning"}
          badge={detectedTier}
        />
        <MetricCard
          label="Frame Interval"
          value={frameInterval > 0 ? frameInterval : "--"}
          unit="ms"
          subtext="Target delta between frames"
          status="neutral"
        />
        <MetricCard
          label="Screen Resolution"
          value={screenSpecs.res}
          subtext={`Pixel Ratio: ${screenSpecs.dpr}x`}
          status="neutral"
        />
        <MetricCard
          label="Color Depth"
          value={screenSpecs.colorDepth}
          unit="bit"
          subtext="Subpixel color range"
          status="neutral"
        />
      </MetricGrid>

      {/* Real-time Telemetry Graph */}
      <TelemetryGraph
        data={history}
        targetLine={fps >= 100 ? 120 : fps >= 80 ? 90 : 60}
        targetLabel="Target"
        unit="Hz"
        height={140}
        min={30}
        max={Math.max(144, fps + 15)}
        spikeThreshold={100}
      />

      {/* Controls Bar */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-md border border-border-default bg-bg-surface flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant={isRunning ? "secondary" : "primary"}
            size="sm"
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? (
              <>
                <Pause size={14} className="mr-1.5" /> Pause Stream
              </>
            ) : (
              <>
                <Play size={14} className="mr-1.5" /> Resume Stream
              </>
            )}
          </Button>
          <Button variant="tertiary" size="sm" onClick={handleReset}>
            <RotateCcw size={14} className="mr-1.5" /> Reset Sampling
          </Button>
        </div>

        <div className="text-2xs font-mono text-text-muted flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span>Active Sampling Window (120 frames)</span>
        </div>
      </div>

      {/* Technical Notes & Limitations */}
      <div className="grid md:grid-cols-2 gap-4">
        <TechnicalNote title="Compositor vs Panel Refresh">
          <p>
            This tool measures the actual rate at which your browser compositor executes <code className="text-accent font-mono">requestAnimationFrame</code> callbacks. On most devices with vsync enabled, this matches your display refresh rate unless throttled by browser power-saving or thermal policies.
          </p>
        </TechnicalNote>

        <LimitationNotice
          limitations={[
            "Browsers cannot directly read physical display panel timings or LTPO dynamic Hz switching.",
            "Android battery saver mode typically locks browser compositing to 60Hz even on 120Hz panels.",
            "Certain OEM Android skins (MIUI/ColorOS) enforce strict 60Hz caps on browser applications.",
          ]}
        />
      </div>
    </div>
  );
}
