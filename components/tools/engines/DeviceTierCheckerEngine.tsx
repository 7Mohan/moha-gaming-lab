"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { MetricCard, MetricGrid } from "@/components/tools/MetricCard";
import { LimitationNotice, TechnicalNote } from "@/components/tools/LimitationNotice";

export function DeviceTierCheckerEngine() {
  const [tierData, setTierData] = React.useState<{
    tier: "Flagship High-End" | "Mid-Range Tier" | "Entry / Budget Tier";
    tierColor: "good" | "accent" | "warning";
    score: number;
    cores: number;
    ram: string;
    dpr: number;
    recPreset: string;
    recFps: string;
    bottleneck: string;
  } | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const cores = navigator.hardwareConcurrency || 4;
    const deviceMemory = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 4;
    const dpr = window.devicePixelRatio || 1;

    let score = 0;
    if (cores >= 8) score += 40;
    else if (cores >= 6) score += 30;
    else score += 15;

    if (deviceMemory >= 8) score += 40;
    else if (deviceMemory >= 6) score += 32;
    else if (deviceMemory >= 4) score += 24;
    else score += 12;

    if (dpr >= 2.5) score += 20;
    else if (dpr >= 2.0) score += 15;
    else score += 10;

    let tier: "Flagship High-End" | "Mid-Range Tier" | "Entry / Budget Tier" = "Mid-Range Tier";
    let tierColor: "good" | "accent" | "warning" = "accent";
    let recPreset = "Balanced / Smooth";
    let recFps = "60 FPS";
    let bottleneck = "Memory Bandwidth under 3D Load";

    if (score >= 80) {
      tier = "Flagship High-End";
      tierColor = "good";
      recPreset = "Smooth / 90–120 FPS Target";
      recFps = "90–120 FPS";
      bottleneck = "Thermal dissipation in extended sessions";
    } else if (score < 50) {
      tier = "Entry / Budget Tier";
      tierColor = "warning";
      recPreset = "Smooth Graphics / Low Shadow Quality";
      recFps = "30–45 FPS Stable";
      bottleneck = "CPU Core architecture & RAM capacity";
    }

    setTierData({
      tier,
      tierColor,
      score,
      cores,
      ram: `~${deviceMemory} GB`,
      dpr,
      recPreset,
      recFps,
      bottleneck,
    });
  }, []);

  if (!tierData) {
    return (
      <div className="p-8 text-center text-text-muted font-mono text-sm border border-border-default rounded-md bg-bg-surface">
        Evaluating device gaming tier...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <MetricGrid columns={4}>
        <MetricCard
          label="Gaming Device Tier"
          value={tierData.tier.split(" ")[0] ?? "Mid-Range"}
          subtext={tierData.tier}
          status={tierData.tierColor}
          badge={`Score: ${tierData.score}/100`}
        />
        <MetricCard
          label="Recommended Target"
          value={tierData.recFps}
          unit="Ceiling"
          subtext="Optimal competitive rate"
          status="good"
        />
        <MetricCard
          label="Graphic Preset"
          value={tierData.recPreset.split(" ")[0] ?? "Balanced"}
          subtext={tierData.recPreset}
          status="neutral"
        />
        <MetricCard
          label="Primary Bottleneck"
          value={tierData.bottleneck.split(" ")[0] ?? "Memory"}
          subtext={tierData.bottleneck}
          status="warning"
        />
      </MetricGrid>

      {/* Tier Classification Details */}
      <div className="border border-border-default bg-bg-surface rounded-md p-5 flex flex-col gap-4">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
          Hardware Bracket Recommendation
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          Based on your client environment ({tierData.cores} CPU threads, {tierData.ram} detected memory, {tierData.dpr}x display density), your device is categorized into the <strong>{tierData.tier}</strong>.
        </p>
        <div className="p-4 rounded-xs border border-border-subtle bg-bg-elevated flex items-start gap-3">
          <CheckCircle2 size={16} className="text-accent flex-shrink-0 mt-0.5" />
          <div className="text-xs text-text-secondary leading-relaxed">
            <strong className="text-text-primary block mb-1">Recommended Optimization Strategy:</strong>
            Prioritize high frame rate stability over graphic fidelity. In competitive titles like PUBG Mobile or CoD Mobile, select <strong>&quot;Smooth&quot;</strong> graphic quality and maximize the in-game Frame Rate slider to <strong>{tierData.recFps}</strong>.
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <TechnicalNote title="Tier Scoring Model">
          <p>
            Scores are normalized against modern Android gaming requirements: 8+ big/medium CPU cores for physics calculations, 6GB+ RAM for texture caching, and high-DPI buffers.
          </p>
        </TechnicalNote>

        <LimitationNotice
          limitations={[
            "Browser APIs mask exact GPU core frequency and vapor chamber thermal dissipation capacity.",
            "Actual in-game performance depends on thermal headroom and whether your device is actively charging.",
          ]}
        />
      </div>
    </div>
  );
}
