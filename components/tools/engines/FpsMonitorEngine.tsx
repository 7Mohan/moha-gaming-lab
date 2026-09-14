"use client";

import * as React from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MetricCard, MetricGrid } from "@/components/tools/MetricCard";
import { TelemetryGraph } from "@/components/tools/TelemetryGraph";
import { LimitationNotice, TechnicalNote } from "@/components/tools/LimitationNotice";

export function FpsMonitorEngine() {
  const [isRunning, setIsRunning] = React.useState(true);
  const [currentFps, setCurrentFps] = React.useState<number>(0);
  const [avgFps, setAvgFps] = React.useState<number>(0);
  const [frameTimeMs, setFrameTimeMs] = React.useState<number>(0);
  const [onePercentLow, setOnePercentLow] = React.useState<number>(0);
  const [frameHistory, setFrameHistory] = React.useState<number[]>([]);
  const [totalFrames, setTotalFrames] = React.useState<number>(0);

  const frameIntervalsRef = React.useRef<number[]>([]);
  const lastTimestampRef = React.useRef<number>(0);
  const animFrameIdRef = React.useRef<number | null>(null);
  const isRunningRef = React.useRef(true);
  isRunningRef.current = isRunning;

  React.useEffect(() => {
    let lastUiUpdate = performance.now();
    let frameCounter = 0;

    const loop = (now: number) => {
      if (!isRunningRef.current) return;

      if (lastTimestampRef.current > 0) {
        const delta = now - lastTimestampRef.current;
        if (delta > 0 && delta < 200) {
          frameIntervalsRef.current.push(delta);
          if (frameIntervalsRef.current.length > 200) {
            frameIntervalsRef.current.shift();
          }
        }
      }
      lastTimestampRef.current = now;
      frameCounter++;

      // Update UI metrics every 100ms
      if (now - lastUiUpdate > 100 && frameIntervalsRef.current.length >= 5) {
        const intervals = frameIntervalsRef.current;
        const lastDelta = intervals[intervals.length - 1] ?? 16.6;
        const instantFps = Math.round(1000 / lastDelta);

        const sum = intervals.reduce((a, b) => a + b, 0);
        const meanDelta = sum / intervals.length;
        const averageFps = Math.round(1000 / meanDelta);

        // Calculate 1% Lows: sort frame times ascending, get top 1% slowest frames
        const sorted = [...intervals].sort((a, b) => b - a);
        const onePercentIndex = Math.max(0, Math.floor(sorted.length * 0.01));
        const slowestSample = sorted[onePercentIndex] ?? 16.6;
        const calculatedLow = Math.round(1000 / slowestSample);

        setCurrentFps(instantFps);
        setAvgFps(averageFps);
        setFrameTimeMs(Number(lastDelta.toFixed(2)));
        setOnePercentLow(calculatedLow);
        setTotalFrames((prev) => prev + frameCounter);
        frameCounter = 0;

        setFrameHistory((prev) => {
          const next = [...prev, lastDelta];
          return next.slice(-60);
        });

        lastUiUpdate = now;
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    if (isRunning) {
      lastTimestampRef.current = performance.now();
      animFrameIdRef.current = requestAnimationFrame(loop);
    }

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isRunning]);

  const handleReset = () => {
    frameIntervalsRef.current = [];
    lastTimestampRef.current = performance.now();
    setFrameHistory([]);
    setCurrentFps(0);
    setAvgFps(0);
    setFrameTimeMs(0);
    setOnePercentLow(0);
    setTotalFrames(0);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Metric Cards */}
      <MetricGrid columns={4}>
        <MetricCard
          label="Current FPS"
          value={currentFps > 0 ? currentFps : "--"}
          unit="FPS"
          subtext="Instantaneous frame delivery"
          status={currentFps >= 58 ? "good" : currentFps >= 45 ? "accent" : "warning"}
        />
        <MetricCard
          label="Rolling Average"
          value={avgFps > 0 ? avgFps : "--"}
          unit="FPS"
          subtext="3-second moving window"
          status={avgFps >= 58 ? "good" : "neutral"}
        />
        <MetricCard
          label="Frame Time"
          value={frameTimeMs > 0 ? frameTimeMs : "--"}
          unit="ms"
          subtext="Target: 16.6ms (60Hz) / 8.3ms (120Hz)"
          status={frameTimeMs <= 17 ? "good" : "warning"}
        />
        <MetricCard
          label="1% Low FPS"
          value={onePercentLow > 0 ? onePercentLow : "--"}
          unit="FPS"
          subtext="Micro-stutter severity floor"
          status={onePercentLow >= 50 ? "good" : onePercentLow >= 30 ? "warning" : "error"}
        />
      </MetricGrid>

      {/* Frame Delivery Timeline */}
      <TelemetryGraph
        data={frameHistory}
        targetLine={16.67}
        targetLabel="60Hz Target"
        unit="ms"
        height={160}
        min={0}
        max={Math.max(33.33, Math.max(...(frameHistory.length ? frameHistory : [20])) + 5)}
        spikeThreshold={25}
        lineColor="#00E5A0"
      />

      {/* Control Strip */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-md border border-border-default bg-bg-surface flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant={isRunning ? "secondary" : "primary"}
            size="sm"
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? (
              <>
                <Pause size={14} className="mr-1.5" /> Pause Monitor
              </>
            ) : (
              <>
                <Play size={14} className="mr-1.5" /> Resume Monitor
              </>
            )}
          </Button>
          <Button variant="tertiary" size="sm" onClick={handleReset}>
            <RotateCcw size={14} className="mr-1.5" /> Reset Buffer
          </Button>
        </div>

        <div className="text-2xs font-mono text-text-muted flex items-center gap-3">
          <span>Frames Sampled: <strong className="text-text-primary">{totalFrames}</strong></span>
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span>Red dots indicate frame delivery spikes (&gt;25ms)</span>
        </div>
      </div>

      {/* Engineering notes */}
      <div className="grid md:grid-cols-2 gap-4">
        <TechnicalNote title="Frame Pacing vs Pure FPS">
          <p>
            An average of 60 FPS can still feel stuttery if frame times alternate irregularly between 8ms and 25ms. The <strong>1% Lows</strong> metric reveals the bottom 1% slowest frames that cause perceptible hitching in fast camera pans.
          </p>
        </TechnicalNote>

        <LimitationNotice
          title="Browser-Side Measurement Scope"
          limitations={[
            "This monitor evaluates browser rendering performance in this tab only.",
            "It does NOT monitor frame delivery of separate Android game APK processes.",
            "For in-game Android APK monitoring, refer to Moha FPS Toolkit in our Apps section.",
          ]}
        />
      </div>
    </div>
  );
}
