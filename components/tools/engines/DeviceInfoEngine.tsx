"use client";

import * as React from "react";
import { MetricCard, MetricGrid } from "@/components/tools/MetricCard";
import { PrivacyBadge, LimitationNotice, TechnicalNote } from "@/components/tools/LimitationNotice";

interface DeviceData {
  cores: number | string;
  memory: string;
  screenRes: string;
  viewport: string;
  dpr: number;
  maxTouch: number;
  colorDepth: number;
  gamut: string;
  os: string;
  browser: string;
  language: string;
  timezone: string;
  batteryStatus?: string;
}

export function DeviceInfoEngine() {
  const [data, setData] = React.useState<DeviceData | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect OS and Browser from UA
    const ua = navigator.userAgent;
    let detectedOs = "Unknown OS";
    if (/android/i.test(ua)) detectedOs = "Android";
    else if (/iphone|ipad|ipod/i.test(ua)) detectedOs = "iOS";
    else if (/windows/i.test(ua)) detectedOs = "Windows";
    else if (/macintosh|mac os x/i.test(ua)) detectedOs = "macOS";
    else if (/linux/i.test(ua)) detectedOs = "Linux";

    let detectedBrowser = "Modern Browser";
    if (/chrome|crios/i.test(ua) && !/edge|opr\//i.test(ua)) detectedBrowser = "Chrome / Chromium";
    else if (/firefox|fxios/i.test(ua)) detectedBrowser = "Firefox";
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) detectedBrowser = "Safari";
    else if (/edg/i.test(ua)) detectedBrowser = "Microsoft Edge";
    else if (/samsungbrowser/i.test(ua)) detectedBrowser = "Samsung Internet";

    // Detect Color Gamut
    let gamut = "sRGB";
    if (window.matchMedia && window.matchMedia("(color-gamut: p3)").matches) {
      gamut = "Display P3 (Wide Gamut)";
    }

    const deviceMemory = (navigator as unknown as { deviceMemory?: number }).deviceMemory;

    const info: DeviceData = {
      cores: navigator.hardwareConcurrency || "Unavailable",
      memory: deviceMemory ? `~${deviceMemory} GB` : "Masked by Browser",
      screenRes: `${window.screen.width} × ${window.screen.height}`,
      viewport: `${window.innerWidth} × ${window.innerHeight}`,
      dpr: window.devicePixelRatio || 1,
      maxTouch: navigator.maxTouchPoints || 0,
      colorDepth: window.screen.colorDepth || 24,
      gamut,
      os: detectedOs,
      browser: detectedBrowser,
      language: navigator.language || "en",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    };

    setData(info);

    // Battery check if supported
    if ("getBattery" in navigator) {
      (navigator as unknown as { getBattery: () => Promise<{ level: number; charging: boolean }> })
        .getBattery()
        .then((battery) => {
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  batteryStatus: `${Math.round(battery.level * 100)}% (${battery.charging ? "Charging" : "Discharging"})`,
                }
              : prev
          );
        })
        .catch(() => {});
    }
  }, []);

  if (!data) {
    return (
      <div className="p-8 text-center text-text-muted font-mono text-sm border border-border-default rounded-md bg-bg-surface">
        Inspecting local browser capabilities...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PrivacyBadge text="This information is processed locally in your browser and is not uploaded by this tool." />
      </div>

      {/* Primary Hardware Metrics */}
      <MetricGrid columns={4}>
        <MetricCard
          label="Logical CPU Cores"
          value={data.cores}
          unit="Cores"
          subtext="Available hardware concurrency threads"
          status={typeof data.cores === "number" && data.cores >= 8 ? "good" : "neutral"}
        />
        <MetricCard
          label="Device RAM Tier"
          value={data.memory}
          subtext="Estimated by navigator.deviceMemory"
          status={data.memory.includes("8") || data.memory.includes("6") ? "good" : "neutral"}
        />
        <MetricCard
          label="Display Resolution"
          value={data.screenRes}
          subtext={`Viewport: ${data.viewport}`}
          status="neutral"
        />
        <MetricCard
          label="Pixel Density (DPR)"
          value={`${data.dpr}x`}
          subtext="Device pixel ratio scaling"
          status="neutral"
        />
      </MetricGrid>

      {/* Detailed Technical Table */}
      <div className="border border-border-default bg-bg-surface rounded-md overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border-subtle bg-bg-elevated flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
            Client Environment Telemetry
          </span>
          <span className="text-2xs font-mono text-accent">100% In-Memory</span>
        </div>

        <dl className="divide-y divide-border-subtle text-xs">
          <div className="grid grid-cols-3 px-5 py-3">
            <dt className="text-text-muted font-mono">Operating System</dt>
            <dd className="col-span-2 text-text-primary font-semibold">{data.os}</dd>
          </div>
          <div className="grid grid-cols-3 px-5 py-3">
            <dt className="text-text-muted font-mono">Browser Engine</dt>
            <dd className="col-span-2 text-text-primary font-semibold">{data.browser}</dd>
          </div>
          <div className="grid grid-cols-3 px-5 py-3">
            <dt className="text-text-muted font-mono">Color Gamut</dt>
            <dd className="col-span-2 text-text-primary font-mono">{data.gamut}</dd>
          </div>
          <div className="grid grid-cols-3 px-5 py-3">
            <dt className="text-text-muted font-mono">Max Touch Points</dt>
            <dd className="col-span-2 text-text-primary font-mono">
              {data.maxTouch} simultaneous touch points
            </dd>
          </div>
          <div className="grid grid-cols-3 px-5 py-3">
            <dt className="text-text-muted font-mono">Color Depth</dt>
            <dd className="col-span-2 text-text-primary font-mono">{data.colorDepth}-bit</dd>
          </div>
          <div className="grid grid-cols-3 px-5 py-3">
            <dt className="text-text-muted font-mono">Client Timezone</dt>
            <dd className="col-span-2 text-text-primary font-mono">{data.timezone}</dd>
          </div>
          {data.batteryStatus && (
            <div className="grid grid-cols-3 px-5 py-3">
              <dt className="text-text-muted font-mono">Battery State</dt>
              <dd className="col-span-2 text-accent font-mono">{data.batteryStatus}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Notes & Limitations */}
      <div className="grid md:grid-cols-2 gap-4">
        <TechnicalNote title="Device Memory Rounding">
          <p>
            The W3C Device Memory specification intentionally clamps reported values to 0.25, 0.5, 1, 2, 4, or 8 GB. Even if your flagship Android phone has 12GB or 16GB of LPDDR5X RAM, the browser will report a maximum of ~8GB to prevent fingerprinting.
          </p>
        </TechnicalNote>

        <LimitationNotice
          title="Privacy Protections in Modern Browsers"
          limitations={[
            "Exact SoC frequencies and thermal throttle governors are inaccessible from the web sandbox.",
            "User-Agent strings are increasingly frozen to generic version numbers.",
            "Screen resolution reflects currently active window scaling, not physical subpixel layout.",
          ]}
        />
      </div>
    </div>
  );
}
