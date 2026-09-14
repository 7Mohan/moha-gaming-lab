"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { StatusIndicator, type StatusType } from "@/components/ui/StatusIndicator";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Card } from "@/components/ui/Card";
import { TelemetryBar } from "@/components/ui/TelemetryBar";
import { DataMetricCard } from "@/components/ui/DataMetricCard";
import { AppCard } from "@/components/cards/AppCard";
import { ToolCard } from "@/components/cards/ToolCard";
import { GameCard } from "@/components/cards/GameCard";
import { GuideCard } from "@/components/cards/GuideCard";
import { SceneContainer } from "@/components/three/SceneContainer";
import { apps } from "@/data/apps";
import { tools } from "@/data/tools";
import { games } from "@/data/games";
import { guides } from "@/data/guides";
import { Search, ShieldAlert, Activity, Zap, CheckCircle2 } from "lucide-react";

export default function DesignSystemPage() {
  const [activeTab, setActiveTab] = React.useState<
    "overview" | "tokens" | "buttons" | "inputs" | "status" | "metrics" | "cards" | "3d" | "states"
  >("overview");

  const [simulatedFilter, setSimulatedFilter] = React.useState("all");
  const [btnLoading, setBtnLoading] = React.useState(false);
  const [inputVal, setInputVal] = React.useState("");

  // Realistic sample benchmark data (Snapdragon 888 120Hz test session)
  const sampleFpsData = [120, 119.8, 120, 119.5, 118.2, 120, 119.9, 114.1, 119.2, 120, 119.7, 120, 120, 119.6];
  const sampleJitterData = [12, 13, 11, 14, 18, 12, 11, 12, 13, 21, 14, 12, 11];

  return (
    <div className="container-content section py-10">
      {/* Page Header */}
      <div className="flex flex-col gap-3 pb-8 border-b border-border-default mb-8">
        <div className="flex items-center gap-2">
          <Badge variant="accent">Internal Engineering Lab</Badge>
          <span className="text-2xs font-mono text-text-muted">v1.2.0 • Design System</span>
        </div>
        <h1 className="text-display text-text-primary">
          Moha Gaming Lab Design System
        </h1>
        <p className="text-body-lg text-text-secondary max-w-3xl">
          Visual architecture and production components for gaming performance engineering,
          hardware telemetry, and Android optimization.
        </p>
        <div className="flex items-center gap-4 text-xs font-mono text-text-muted pt-1">
          <span>PRINCIPLE: <strong className="text-accent">Function first. Visual impact second.</strong></span>
          <span>•</span>
          <span>THEME: Deep Neutral Dark (#0A0C10)</span>
          <span>•</span>
          <span>ACCENT: Emerald Terminal (#00E5A0)</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8 overflow-x-auto pb-2">
        <SegmentedControl
          value={activeTab}
          onChange={(val) => setActiveTab(val as typeof activeTab)}
          options={[
            { value: "overview", label: "Overview & Rules" },
            { value: "tokens", label: "Design Tokens" },
            { value: "buttons", label: "Buttons" },
            { value: "inputs", label: "Inputs & Filters" },
            { value: "status", label: "Status & Badges" },
            { value: "metrics", label: "Data Telemetry" },
            { value: "cards", label: "Card Hierarchy" },
            { value: "3d", label: "3D Viewport" },
            { value: "states", label: "UX States & A11y" },
          ]}
        />
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card variant="hud" className="p-5 flex flex-col gap-2">
              <span className="label-mono">Personality</span>
              <h3 className="text-lg font-bold text-text-primary">Performance Laboratory</h3>
              <p className="text-sm text-text-secondary">
                Closer to an engineering test bench than a flashy esports website. Restraint, precision,
                and high information density.
              </p>
            </Card>

            <Card variant="hud" className="p-5 flex flex-col gap-2">
              <span className="label-mono">Typography</span>
              <h3 className="text-lg font-bold text-text-primary">Engineered Hierarchy</h3>
              <p className="text-sm text-text-secondary">
                Geometric high-contrast headings paired with tabular monospace for telemetry values.
                Zero generic AI Inter slop.
              </p>
            </Card>

            <Card variant="hud" className="p-5 flex flex-col gap-2">
              <span className="label-mono">Honest Data</span>
              <h3 className="text-lg font-bold text-text-primary">Real Telemetry Grounding</h3>
              <p className="text-sm text-text-secondary">
                No fake metrics or generic SaaS claims. Every telemetry graph explicitly attributes
                its test environment (e.g. Snapdragon 888 benchmark).
              </p>
            </Card>
          </div>

          <div className="hud-frame p-6 bg-bg-surface flex flex-col gap-4">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-accent" />
              Anti-AI-Slop Strict Enforcement
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 bg-bg-elevated border border-border-default rounded">
                <span className="text-status-error block font-bold mb-1">[X] FORBIDDEN</span>
                <span className="text-text-secondary">Purple-to-blue neon gradients, rainbow gaming bars, glow blobbing</span>
              </div>
              <div className="p-3 bg-bg-elevated border border-border-default rounded">
                <span className="text-status-error block font-bold mb-1">[X] FORBIDDEN</span>
                <span className="text-text-secondary">Pill-shaped buttons, balloon cards with 32px radius</span>
              </div>
              <div className="p-3 bg-bg-elevated border border-border-default rounded">
                <span className="text-status-error block font-bold mb-1">[X] FORBIDDEN</span>
                <span className="text-text-secondary">Fake user reviews, fake counter animations (+999% FPS)</span>
              </div>
              <div className="p-3 bg-bg-elevated border border-border-default rounded">
                <span className="text-status-error block font-bold mb-1">[X] FORBIDDEN</span>
                <span className="text-text-secondary">Random floating 3D planets, cubes, or non-product props</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. DESIGN TOKENS TAB */}
      {activeTab === "tokens" && (
        <div className="flex flex-col gap-10">
          {/* Colors */}
          <section className="flex flex-col gap-4">
            <h2 className="text-h2 text-text-primary">1. Color Palette Tokens</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { name: "bg-base", hex: "#0A0C10", desc: "Main dark canvas" },
                { name: "bg-surface", hex: "#11141A", desc: "Standard card surface" },
                { name: "bg-elevated", hex: "#171B22", desc: "Inputs & elevated panels" },
                { name: "border-default", hex: "#242B35", desc: "Standard structural border" },
                { name: "accent", hex: "#00E5A0", desc: "Terminal emerald accent" },
                { name: "text-primary", hex: "#F0F3F6", desc: "High contrast body/headers" },
              ].map((c) => (
                <div key={c.name} className="p-3 bg-bg-surface border border-border-default rounded flex flex-col gap-2">
                  <div
                    className="w-full h-12 rounded border border-border-subtle"
                    style={{ backgroundColor: c.hex }}
                  />
                  <div>
                    <span className="font-mono text-xs font-semibold text-text-primary block">{c.name}</span>
                    <span className="font-mono text-[10px] text-accent block">{c.hex}</span>
                    <span className="text-2xs text-text-muted mt-1 block">{c.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Semantic Status Colors */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
              {[
                { name: "status-success", hex: "#00E5A0", label: "Stable / Optimal" },
                { name: "status-warning", hex: "#F59E0B", label: "Moderate / Warm" },
                { name: "status-error", hex: "#EF4444", label: "Critical / Throttle" },
                { name: "status-info", hex: "#3B82F6", label: "Telemetry / Beta" },
              ].map((c) => (
                <div key={c.name} className="p-3 bg-bg-surface border border-border-default rounded flex items-center gap-3">
                  <div className="w-6 h-6 rounded flex-shrink-0" style={{ backgroundColor: c.hex }} />
                  <div>
                    <span className="font-mono text-xs font-semibold text-text-primary block">{c.name}</span>
                    <span className="text-2xs text-text-muted">{c.label} ({c.hex})</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Typography Scale */}
          <section className="flex flex-col gap-4">
            <h2 className="text-h2 text-text-primary">2. Typography Scale</h2>
            <div className="bg-bg-surface border border-border-default rounded-md divide-y divide-border-subtle overflow-hidden">
              <div className="p-4 flex items-baseline justify-between flex-wrap gap-2">
                <span className="text-display">Display — 44px/56px</span>
                <span className="font-mono text-2xs text-text-muted">clamp(2.25rem, 5vw, 3.5rem) / 700</span>
              </div>
              <div className="p-4 flex items-baseline justify-between flex-wrap gap-2">
                <span className="text-h1">H1 Heading — 36px</span>
                <span className="font-mono text-2xs text-text-muted">clamp(1.875rem, 4vw, 2.25rem) / 700</span>
              </div>
              <div className="p-4 flex items-baseline justify-between flex-wrap gap-2">
                <span className="text-h2">H2 Section Heading — 28px</span>
                <span className="font-mono text-2xs text-text-muted">clamp(1.5rem, 3vw, 1.75rem) / 600</span>
              </div>
              <div className="p-4 flex items-baseline justify-between flex-wrap gap-2">
                <span className="text-h3">H3 Card Heading — 20px</span>
                <span className="font-mono text-2xs text-text-muted">1.25rem / 600</span>
              </div>
              <div className="p-4 flex items-baseline justify-between flex-wrap gap-2">
                <span className="text-body-lg">Body Large — 18px Technical introduction paragraph</span>
                <span className="font-mono text-2xs text-text-muted">1.125rem / 400</span>
              </div>
              <div className="p-4 flex items-baseline justify-between flex-wrap gap-2">
                <span className="text-body">Body — 15px Standard technical readable text</span>
                <span className="font-mono text-2xs text-text-muted">0.9375rem / 400</span>
              </div>
              <div className="p-4 flex items-baseline justify-between flex-wrap gap-2">
                <span className="text-data text-accent font-semibold text-lg">119.8 FPS • 8.3ms • 41.2°C</span>
                <span className="font-mono text-2xs text-text-muted">font-mono / tabular-nums</span>
              </div>
            </div>
          </section>

          {/* Radius Scale */}
          <section className="flex flex-col gap-4">
            <h2 className="text-h2 text-text-primary">3. Border Radius Discipline (No Pill-Mania)</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { name: "radius-none", px: "0px", usage: "Dividers, rules" },
                { name: "radius-xs", px: "2px", usage: "Indicators, tiny tags" },
                { name: "radius-sm", px: "4px", usage: "Buttons, inputs, badges" },
                { name: "radius-md", px: "6px", usage: "Standard cards, dropdowns" },
                { name: "radius-lg", px: "8px", usage: "Large panels, modals" },
              ].map((r) => (
                <div key={r.name} className="p-3 bg-bg-surface border border-border-default rounded flex flex-col gap-2">
                  <div
                    className="w-full h-10 bg-bg-elevated border border-accent/40"
                    style={{ borderRadius: r.px }}
                  />
                  <div>
                    <span className="font-mono text-xs font-semibold text-text-primary block">{r.name} ({r.px})</span>
                    <span className="text-2xs text-text-muted block">{r.usage}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* 3. BUTTONS TAB */}
      {activeTab === "buttons" && (
        <div className="flex flex-col gap-8">
          <div className="hud-frame p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-h2 text-text-primary">Button System</h2>
                <p className="text-sm text-text-secondary">
                  High-contrast actions with tactile feedback and explicit purpose.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBtnLoading(!btnLoading)}
              >
                Toggle Loading State ({btnLoading ? "ON" : "OFF"})
              </Button>
            </div>

            {/* Variants Matrix */}
            <div className="flex flex-col gap-4">
              <span className="label-mono">Variants</span>
              <div className="flex flex-wrap gap-3 items-center">
                <Button variant="primary" isLoading={btnLoading}>
                  Run Diagnostic
                </Button>
                <Button variant="secondary" isLoading={btnLoading}>
                  View App & Downloads
                </Button>
                <Button variant="outline" isLoading={btnLoading}>
                  Configure Profile
                </Button>
                <Button variant="ghost" isLoading={btnLoading}>
                  View Documentation
                </Button>
                <Button variant="destructive" isLoading={btnLoading}>
                  Reset Kernel Tweaks
                </Button>
              </div>
            </div>

            {/* Sizes Matrix */}
            <div className="flex flex-col gap-4 pt-4 border-t border-border-subtle">
              <span className="label-mono">Sizes Scale</span>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" variant="secondary">Small (32px)</Button>
                <Button size="md" variant="secondary">Medium (40px)</Button>
                <Button size="lg" variant="secondary">Large (48px)</Button>
              </div>
            </div>

            {/* With Icons */}
            <div className="flex flex-col gap-4 pt-4 border-t border-border-subtle">
              <span className="label-mono">With Icons</span>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="primary"
                  leftIcon={<Activity className="w-4 h-4" />}
                >
                  Start Benchmark
                </Button>
                <Button
                  variant="secondary"
                  rightIcon={<Zap className="w-4 h-4 text-accent" />}
                >
                  Apply Tweak
                </Button>
                <Button
                  variant="outline"
                  leftIcon={<Search className="w-4 h-4" />}
                >
                  Search Database
                </Button>
                <Button variant="secondary" disabled>
                  Hardware Unsupported
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. INPUTS TAB */}
      {activeTab === "inputs" && (
        <div className="flex flex-col gap-8 max-w-2xl">
          <div className="hud-frame p-6 flex flex-col gap-6">
            <h2 className="text-h2 text-text-primary">Input & Control Controls</h2>

            <div className="flex flex-col gap-4">
              <Input
                label="Target Framerate"
                placeholder="e.g. 120"
                helperText="Expected display refresh rate for benchmark evaluation"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
              />

              <Input
                label="Search Diagnostic Database"
                placeholder="Search games, tools, apps, and guides..."
                leftIcon={<Search className="w-4 h-4" />}
              />

              <Input
                label="Device Chipset ID"
                defaultValue="SD888_001"
                error="Thermal throttle warning: SoC exceeds 44°C ceiling"
                leftIcon={<ShieldAlert className="w-4 h-4" />}
              />

              <Input
                label="Disabled Control"
                defaultValue="System locked by kernel policy"
                disabled
              />
            </div>

            <div className="pt-4 border-t border-border-subtle flex flex-col gap-3">
              <span className="label-mono">Segmented Filter Control</span>
              <SegmentedControl
                value={simulatedFilter}
                onChange={setSimulatedFilter}
                options={[
                  { value: "all", label: "All Hardware", badge: "24" },
                  { value: "snapdragon", label: "Snapdragon", badge: "16" },
                  { value: "mediatek", label: "Dimensity", badge: "6" },
                  { value: "exynos", label: "Exynos", badge: "2" },
                ]}
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. STATUS INDICATORS TAB */}
      {activeTab === "status" && (
        <div className="flex flex-col gap-8">
          <div className="hud-frame p-6 flex flex-col gap-6">
            <div>
              <h2 className="text-h2 text-text-primary">Status System</h2>
              <p className="text-sm text-text-secondary">
                Triple-channel accessibility: shape symbol + semantic dot + text label.
              </p>
            </div>

            {/* All 9 statuses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { status: "stable" as StatusType, desc: "Framerate rock-solid (±1 FPS variance)" },
                { status: "good" as StatusType, desc: "Nominal performance without throttling" },
                { status: "moderate" as StatusType, desc: "Minor frame pacing drops under load" },
                { status: "warning" as StatusType, desc: "SoC thermal limit approaching 42°C" },
                { status: "critical" as StatusType, desc: "Heavy thermal throttle or packet loss" },
                { status: "available" as StatusType, desc: "Tool or app live & verified" },
                { status: "beta" as StatusType, desc: "Experimental optimization module" },
                { status: "coming-soon" as StatusType, desc: "In development" },
                { status: "unsupported" as StatusType, desc: "Target Android version incompatible" },
              ].map((item) => (
                <div key={item.status} className="p-3 bg-bg-surface border border-border-default rounded flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <StatusIndicator status={item.status} />
                    <StatusIndicator status={item.status} variant="badge" />
                  </div>
                  <span className="text-2xs text-text-muted">{item.desc}</span>
                </div>
              ))}
            </div>

            {/* Badges system */}
            <div className="pt-4 border-t border-border-subtle flex flex-col gap-3">
              <span className="label-mono">Metadata Badges</span>
              <div className="flex flex-wrap gap-2">
                <Badge variant="accent">Android 14 Ready</Badge>
                <Badge variant="success">Vulkan 1.3</Badge>
                <Badge variant="warning">Root Optional</Badge>
                <Badge variant="error">High Thermal</Badge>
                <Badge variant="info">Kernel 5.15</Badge>
                <Badge variant="default">Snapdragon 8 Gen 2</Badge>
                <Badge variant="outline">Adreno 740</Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. DATA TELEMETRY TAB */}
      {activeTab === "metrics" && (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h2 className="text-h2 text-text-primary">Technical Performance Telemetry</h2>
            <p className="text-sm text-text-secondary max-w-2xl">
              Honest diagnostic metrics for FPS stability, frame pacing, and hardware thermals.
              All sample telemetry is explicitly credited to test baselines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DataMetricCard
              title="Snapdragon 888 FPS"
              value="119.4"
              unit="FPS"
              status="stable"
              variance="1% Low: 114.1 FPS"
              sparklineData={sampleFpsData}
              targetLine={120}
              benchmarkNote="PUBG Mobile 120Hz Test Session"
            />

            <DataMetricCard
              title="Frame-Time Variance"
              value="8.3"
              unit="MS"
              status="good"
              variance="99th %: 9.2ms"
              sparklineData={[8.3, 8.4, 8.3, 8.2, 8.6, 8.3, 8.4, 9.1, 8.3, 8.2]}
              targetLine={8.33}
              benchmarkNote="Snapdragon Adreno Vulkan Renderer"
            />

            <DataMetricCard
              title="Network Jitter"
              value="14"
              unit="MS"
              status="moderate"
              variance="Packet Drop: 0.0%"
              sparklineData={sampleJitterData}
              targetLine={15}
              benchmarkNote="US-East Low-Latency Gaming Node"
            />
          </div>

          {/* Hardware Telemetry Progress Bars */}
          <div className="hud-frame p-6 flex flex-col gap-5">
            <span className="label-mono">Hardware Telemetry Gauges</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <TelemetryBar label="CPU Load" value={68} max={100} unit="%" warningThreshold={75} />
              <TelemetryBar label="GPU Load" value={84} max={100} unit="%" warningThreshold={80} />
              <TelemetryBar label="SoC Temperature" value={41.8} max={50} unit="°C" warningThreshold={42} criticalThreshold={46} />
              <TelemetryBar label="Battery Drain" value={13.2} max={25} unit="%/h" warningThreshold={18} criticalThreshold={22} />
            </div>
          </div>
        </div>
      )}

      {/* 7. CARDS HIERARCHY TAB */}
      {activeTab === "cards" && (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-h2 text-text-primary">Purpose-Built Card Hierarchy</h2>
            <p className="text-sm text-text-secondary">
              Cards differ intentionally based on what problem they solve.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <span className="label-mono block mb-2">1. App Card</span>
              {apps[0] && <AppCard app={apps[0]} />}
            </div>
            <div>
              <span className="label-mono block mb-2">2. Tool Card</span>
              {tools[0] && <ToolCard tool={tools[0]} />}
            </div>
            <div>
              <span className="label-mono block mb-2">3. Game Card</span>
              {games[0] && <GameCard game={games[0]} />}
            </div>
            <div>
              <span className="label-mono block mb-2">4. Guide Card</span>
              {guides[0] && <GuideCard guide={guides[0]} />}
            </div>
          </div>
        </div>
      )}

      {/* 8. 3D VIEWPORT TAB */}
      {activeTab === "3d" && (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-h2 text-text-primary">3D Laboratory Viewport Integration</h2>
            <p className="text-sm text-text-secondary">
              Strict containment within an engineering HUD frame with interactive drag rotation,
              telemetry waveform on screen, and zero random floating space props.
            </p>
          </div>

          <div className="max-w-2xl">
            <SceneContainer
              title="Android Gaming Lab Device Model"
              chipset="Adreno 660 / Vulkan 1.3"
              statusText="120Hz SYNCED"
              heightClass="h-[440px]"
            />
          </div>
        </div>
      )}

      {/* 9. UX STATES & A11Y TAB */}
      {activeTab === "states" && (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Loading State */}
            <Card variant="surface" className="p-5 flex flex-col gap-3">
              <span className="label-mono">Loading State</span>
              <div className="space-y-2.5 animate-pulse">
                <div className="h-4 bg-bg-elevated rounded w-3/4" />
                <div className="h-3 bg-bg-elevated rounded w-full" />
                <div className="h-3 bg-bg-elevated rounded w-5/6" />
                <div className="h-8 bg-bg-elevated rounded w-1/3 mt-2" />
              </div>
              <span className="text-2xs font-mono text-text-muted mt-2">
                Accessible loading placeholder with zero layout shift
              </span>
            </Card>

            {/* Empty State */}
            <Card variant="surface" className="p-5 flex flex-col items-center justify-center text-center gap-2">
              <span className="label-mono">Empty State</span>
              <div className="w-10 h-10 rounded bg-bg-elevated border border-border-default flex items-center justify-center text-text-muted my-2">
                <Search className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-text-primary">No Diagnostics Found</h4>
              <p className="text-2xs text-text-secondary">
                No optimization profiles match your current chipset filter.
              </p>
              <Button size="sm" variant="outline" className="mt-2">
                Reset Filter
              </Button>
            </Card>

            {/* Error State */}
            <Card variant="hud" className="p-5 flex flex-col gap-2">
              <span className="label-mono text-status-error">Error State</span>
              <div className="flex items-center gap-2 text-status-error font-mono text-sm font-bold">
                <ShieldAlert className="w-4 h-4" />
                <span>Kernel Telemetry Offline</span>
              </div>
              <p className="text-2xs text-text-secondary">
                Failed to poll Android SysFS node for GPU frequency data.
              </p>
              <Button size="sm" variant="destructive" className="mt-2 self-start">
                Retry Diagnostic Connection
              </Button>
            </Card>
          </div>

          {/* Keyboard Focus Testing Area */}
          <div className="hud-frame p-6 flex flex-col gap-3">
            <h3 className="text-h3 text-text-primary">Accessibility Focus Ring Verification</h3>
            <p className="text-sm text-text-secondary">
              Press <kbd className="px-1.5 py-0.5 bg-bg-elevated border border-border-default rounded text-xs font-mono">Tab</kbd> to
              verify high-contrast focus rings (`outline: 2px solid var(--accent)`) across all interactive controls.
            </p>
            <div className="flex flex-wrap gap-3 items-center pt-2">
              <Button variant="primary">Focusable Button 1</Button>
              <Button variant="secondary">Focusable Button 2</Button>
              <Button variant="outline">Focusable Button 3</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
