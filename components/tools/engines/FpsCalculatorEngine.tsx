"use client";

import * as React from "react";
import { MetricCard, MetricGrid } from "@/components/tools/MetricCard";
import { LimitationNotice, TechnicalNote } from "@/components/tools/LimitationNotice";

interface SocOption {
  id: string;
  name: string;
  tier: "flagship" | "upper-mid" | "mid" | "budget";
  gpu: string;
  thermalProfile: "excellent" | "moderate" | "hot";
  baseScore: number;
}

const SOC_DATABASE: SocOption[] = [
  { id: "snapdragon-8-gen-3", name: "Snapdragon 8 Gen 3", tier: "flagship", gpu: "Adreno 750", thermalProfile: "moderate", baseScore: 98 },
  { id: "snapdragon-8-gen-2", name: "Snapdragon 8 Gen 2", tier: "flagship", gpu: "Adreno 740", thermalProfile: "excellent", baseScore: 92 },
  { id: "snapdragon-8-gen-1", name: "Snapdragon 8 Gen 1", tier: "flagship", gpu: "Adreno 730", thermalProfile: "hot", baseScore: 82 },
  { id: "snapdragon-870", name: "Snapdragon 870 / 865", tier: "upper-mid", gpu: "Adreno 650", thermalProfile: "excellent", baseScore: 78 },
  { id: "snapdragon-7-plus-gen-2", name: "Snapdragon 7+ Gen 2 / 7+ Gen 3", tier: "upper-mid", gpu: "Adreno 725", thermalProfile: "moderate", baseScore: 85 },
  { id: "dimensity-9300", name: "MediaTek Dimensity 9300 / 9200", tier: "flagship", gpu: "Immortalis-G720", thermalProfile: "moderate", baseScore: 94 },
  { id: "dimensity-8300", name: "MediaTek Dimensity 8300 / 8200", tier: "upper-mid", gpu: "Mali-G615", thermalProfile: "excellent", baseScore: 80 },
  { id: "snapdragon-695", name: "Snapdragon 695 / 680", tier: "budget", gpu: "Adreno 619 / 610", thermalProfile: "moderate", baseScore: 48 },
  { id: "helio-g99", name: "MediaTek Helio G99 / G96", tier: "budget", gpu: "Mali-G57 MC2", thermalProfile: "moderate", baseScore: 45 },
];

export function FpsCalculatorEngine() {
  const [selectedSoc, setSelectedSoc] = React.useState<string>("snapdragon-8-gen-2");
  const [displayHz, setDisplayHz] = React.useState<number>(120);
  const [genre, setGenre] = React.useState<"br" | "fps" | "moba" | "open-world">("br");
  const [graphicsPreset, setGraphicsPreset] = React.useState<"smooth" | "balanced" | "high">("smooth");

  const soc = SOC_DATABASE.find((s) => s.id === selectedSoc) ?? SOC_DATABASE[0]!;

  // Calculate sustained projections
  const genreLoadMultiplier = {
    br: 0.88,        // PUBG / Free Fire
    fps: 0.95,       // CoD Mobile / Standoff 2
    moba: 1.0,       // MLBB / Wild Rift
    "open-world": 0.72, // Genshin / Wuthering Waves
  }[genre];

  const graphicsPenalty = {
    smooth: 1.0,
    balanced: 0.85,
    high: 0.7,
  }[graphicsPreset];

  const thermalDropRate = soc.thermalProfile === "hot" ? 0.22 : soc.thermalProfile === "moderate" ? 0.12 : 0.05;

  const rawCap = Math.round((soc.baseScore / 100) * displayHz * genreLoadMultiplier * graphicsPenalty);
  const targetFpsCeiling = Math.min(displayHz, Math.max(30, rawCap));
  const sustainedFps = Math.round(targetFpsCeiling * (1 - thermalDropRate));
  const dropPercent = Math.round(thermalDropRate * 100);

  return (
    <div className="flex flex-col gap-6">
      {/* Configuration Sliders & Selectors */}
      <div className="border border-border-default bg-bg-surface rounded-md p-5 flex flex-col gap-5">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
          Hardware & Workload Parameters
        </h3>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* SoC Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-text-muted">SoC Chipset</label>
            <select
              value={selectedSoc}
              onChange={(e) => setSelectedSoc(e.target.value)}
              className="bg-bg-base border border-border-subtle rounded-xs px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
            >
              {SOC_DATABASE.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.gpu})
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Rate */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-text-muted">Display Panel</label>
            <select
              value={displayHz}
              onChange={(e) => setDisplayHz(Number(e.target.value))}
              className="bg-bg-base border border-border-subtle rounded-xs px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
            >
              <option value={60}>60 Hz Standard</option>
              <option value={90}>90 Hz Smooth</option>
              <option value={120}>120 Hz Flagship</option>
              <option value={144}>144 Hz Gaming</option>
            </select>
          </div>

          {/* Genre */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-text-muted">Game Workload</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value as typeof genre)}
              className="bg-bg-base border border-border-subtle rounded-xs px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="br">Battle Royale (PUBG/FF)</option>
              <option value="fps">Tactical FPS (CoD Mobile)</option>
              <option value="moba">MOBA (Mobile Legends)</option>
              <option value="open-world">Heavy 3D (Open World)</option>
            </select>
          </div>

          {/* Preset */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-text-muted">Graphics Preset</label>
            <select
              value={graphicsPreset}
              onChange={(e) => setGraphicsPreset(e.target.value as typeof graphicsPreset)}
              className="bg-bg-base border border-border-subtle rounded-xs px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="smooth">Smooth / Low (Competitive)</option>
              <option value="balanced">Balanced / Medium</option>
              <option value="high">High / Ultra Graphics</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calculated Projections Grid */}
      <MetricGrid columns={4}>
        <MetricCard
          label="Initial FPS Target"
          value={targetFpsCeiling}
          unit="FPS"
          subtext="Target frame ceiling (first 5 mins)"
          status={targetFpsCeiling >= 90 ? "good" : targetFpsCeiling >= 60 ? "accent" : "warning"}
        />
        <MetricCard
          label="Sustained FPS"
          value={sustainedFps}
          unit="FPS"
          subtext="15–20 minute sustained thermal load"
          status={sustainedFps >= 60 ? "good" : "warning"}
        />
        <MetricCard
          label="Thermal Drop Risk"
          value={`~${dropPercent}%`}
          subtext={`Silicon Profile: ${soc.thermalProfile.toUpperCase()}`}
          status={soc.thermalProfile === "excellent" ? "good" : soc.thermalProfile === "moderate" ? "warning" : "error"}
        />
        <MetricCard
          label="Recommended Setting"
          value={soc.tier === "flagship" ? "90/120 FPS" : soc.tier === "upper-mid" ? "60–90 FPS" : "60 FPS Smooth"}
          subtext="Optimal competitive setting"
          status="neutral"
        />
      </MetricGrid>

      <div className="grid md:grid-cols-2 gap-4">
        <TechnicalNote title="Thermal Dissipation Dynamics">
          <p>
            Mobile SoCs share power budgets with display panels and cellular radios. In sustained sessions exceeding 15 minutes, device chassis temperatures hit 42°C–45°C thermal thresholds, causing kernel governors to drop CPU big-core clocks by 15%–30%.
          </p>
        </TechnicalNote>

        <LimitationNotice
          title="Algorithmic Projection Basis"
          limitations={[
            "Projections are algorithmic estimates based on silicon TDP benchmarks across standard ambient room temperatures (22°C).",
            "Thick phone cases or playing while charging increase thermal throttling severity by up to 2x.",
          ]}
        />
      </div>
    </div>
  );
}
