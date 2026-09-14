"use client";

import * as React from "react";
import { Play, RotateCcw, Globe } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MetricCard, MetricGrid } from "@/components/tools/MetricCard";
import { TelemetryGraph } from "@/components/tools/TelemetryGraph";
import { LimitationNotice, TechnicalNote } from "@/components/tools/LimitationNotice";

interface PingSample {
  id: number;
  rtt: number;
  status: "ok" | "slow" | "error";
}

export function NetworkTestEngine() {
  const [isRunning, setIsRunning] = React.useState(false);
  const [samples, setSamples] = React.useState<PingSample[]>([]);
  const [currentPing, setCurrentPing] = React.useState<number | null>(null);
  const [minPing, setMinPing] = React.useState<number | null>(null);
  const [avgPing, setAvgPing] = React.useState<number | null>(null);
  const [jitter, setJitter] = React.useState<number | null>(null);
  const [connectionInfo, setConnectionInfo] = React.useState<{
    effectiveType: string;
    downlink: number | string;
    rtt: number | string;
    saveData: boolean;
  }>({ effectiveType: "Unknown", downlink: "--", rtt: "--", saveData: false });

  // Read navigator.connection if available
  React.useEffect(() => {
    if (typeof navigator !== "undefined" && "connection" in navigator) {
      const conn = (navigator as unknown as { connection?: {
        effectiveType?: string;
        downlink?: number;
        rtt?: number;
        saveData?: boolean;
      } }).connection;

      if (conn) {
        setConnectionInfo({
          effectiveType: conn.effectiveType?.toUpperCase() || "Unknown",
          downlink: conn.downlink !== undefined ? `${conn.downlink} Mbps` : "--",
          rtt: conn.rtt !== undefined ? `${conn.rtt} ms` : "--",
          saveData: !!conn.saveData,
        });
      }
    }
  }, []);

  // Run sequential test
  const runTest = React.useCallback(async () => {
    setIsRunning(true);
    const newSamples: PingSample[] = [];
    const maxSamples = 12;

    for (let i = 1; i <= maxSamples; i++) {
      const start = performance.now();
      try {
        // Cache-busting fetch to static asset /favicon.ico or root head
        await fetch(`/icon.svg?_t=${Date.now()}_${i}`, {
          method: "HEAD",
          cache: "no-store",
        });
        const duration = Math.round(performance.now() - start);
        newSamples.push({
          id: i,
          rtt: duration,
          status: duration < 50 ? "ok" : duration < 100 ? "slow" : "error",
        });
      } catch {
        newSamples.push({ id: i, rtt: 150, status: "error" });
      }

      setSamples([...newSamples]);
      const lastSample = newSamples[newSamples.length - 1];
      if (lastSample) setCurrentPing(lastSample.rtt);

      // Compute aggregates
      const rtts = newSamples.map((s) => s.rtt);
      const min = Math.min(...rtts);
      const avg = Math.round(rtts.reduce((a, b) => a + b, 0) / rtts.length);

      // Standard deviation for jitter
      const variance =
        rtts.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / rtts.length;
      const stdDev = Math.round(Math.sqrt(variance));

      setMinPing(min);
      setAvgPing(avg);
      setJitter(stdDev);

      // Pause briefly between probes
      await new Promise((r) => setTimeout(r, 200));
    }
    setIsRunning(false);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Metrics */}
      <MetricGrid columns={4}>
        <MetricCard
          label="Current Latency"
          value={currentPing !== null ? currentPing : "--"}
          unit="ms"
          subtext="Round-trip time to host edge"
          status={
            currentPing === null
              ? "neutral"
              : currentPing < 40
              ? "good"
              : currentPing < 80
              ? "accent"
              : "warning"
          }
        />
        <MetricCard
          label="Average Ping"
          value={avgPing !== null ? avgPing : "--"}
          unit="ms"
          subtext={minPing !== null ? `Min: ${minPing}ms | Batch Mean` : "Mean across test batch"}
          status={avgPing !== null && avgPing < 50 ? "good" : "neutral"}
        />
        <MetricCard
          label="Network Jitter"
          value={jitter !== null ? jitter : "--"}
          unit="ms"
          subtext="Ping variance / stability"
          status={jitter !== null && jitter < 10 ? "good" : jitter !== null && jitter > 25 ? "warning" : "neutral"}
        />
        <MetricCard
          label="Connection Type"
          value={connectionInfo.effectiveType}
          subtext={`Downlink: ${connectionInfo.downlink}`}
          status="neutral"
          badge={connectionInfo.saveData ? "Data Saver" : undefined}
        />
      </MetricGrid>

      {/* Latency History Graph */}
      <TelemetryGraph
        data={samples.map((s) => s.rtt)}
        targetLine={avgPing || 30}
        targetLabel="Avg"
        unit="ms"
        height={140}
        min={0}
        max={Math.max(100, Math.max(...(samples.map((s) => s.rtt).concat([50]))) + 20)}
        lineColor="#38BDF8"
        spikeThreshold={80}
      />

      {/* Action Strip */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-md border border-border-default bg-bg-surface flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={runTest}
            disabled={isRunning}
          >
            <Play size={14} className="mr-1.5" />
            {isRunning ? "Testing Network..." : samples.length > 0 ? "Retest Latency" : "Start Latency Test"}
          </Button>
          {samples.length > 0 && (
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => {
                setSamples([]);
                setCurrentPing(null);
                setAvgPing(null);
                setMinPing(null);
                setJitter(null);
              }}
              disabled={isRunning}
            >
              <RotateCcw size={14} className="mr-1.5" /> Clear
            </Button>
          )}
        </div>

        <div className="text-2xs font-mono text-text-muted flex items-center gap-2">
          <Globe size={13} className="text-text-muted" />
          <span>Local Edge CDN Probe ({samples.length}/12 samples)</span>
        </div>
      </div>

      {/* Technical Notes & Limitations */}
      <div className="grid md:grid-cols-2 gap-4">
        <TechnicalNote title="Jitter vs Ping Explained">
          <p>
            In online competitive gaming, <strong>Jitter</strong> (latency variation) is often more destructive than a constant ping. A consistent 60ms ping allows the game prediction engine to interpolate movement smoothly, while a fluctuating 30ms–110ms ping causes desync and teleporting.
          </p>
        </TechnicalNote>

        <LimitationNotice
          title="Browser HTTP Latency vs Game UDP Ping"
          limitations={[
            "This test measures HTTP round-trip timing, which includes TCP handshakes and browser request queue overhead.",
            "Native mobile games use lightweight raw UDP packets directly to dedicated game servers, which is typically 10–25ms faster.",
            "Connection speed estimates are provided by the browser's Network Information API where permitted.",
          ]}
        />
      </div>
    </div>
  );
}
