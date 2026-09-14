"use client";

import * as React from "react";
import { Maximize2, Minimize2, Eye, Sliders, Activity } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MetricCard, MetricGrid } from "@/components/tools/MetricCard";
import { LimitationNotice, TechnicalNote } from "@/components/tools/LimitationNotice";

export function DisplayTestEngine() {
  const [activeTab, setActiveTab] = React.useState<"dead-pixel" | "contrast" | "motion">("dead-pixel");
  const [pixelColor, setPixelColor] = React.useState<string>("#FFFFFF");
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [motionSpeed, setMotionSpeed] = React.useState<number>(10);
  const [aspectRatio, setAspectRatio] = React.useState<string>("Detecting...");

  const testContainerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const w = window.screen.width;
      const h = window.screen.height;
      const ratio = (Math.max(w, h) / Math.min(w, h)).toFixed(2);
      if (Math.abs(Number(ratio) - 1.78) < 0.05) setAspectRatio("16:9 (Standard)");
      else if (Math.abs(Number(ratio) - 2.17) < 0.05) setAspectRatio("19.5:9 (Modern Mobile)");
      else if (Math.abs(Number(ratio) - 2.22) < 0.05) setAspectRatio("20:9 (Tall Mobile)");
      else if (Math.abs(Number(ratio) - 2.33) < 0.05) setAspectRatio("21:9 (Ultra-wide)");
      else setAspectRatio(`${ratio}:1`);
    }
  }, []);

  const toggleFullscreen = () => {
    const el = testContainerRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  React.useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const COLORS = [
    { label: "White", hex: "#FFFFFF" },
    { label: "Black", hex: "#000000" },
    { label: "Red", hex: "#FF0000" },
    { label: "Green", hex: "#00FF00" },
    { label: "Blue", hex: "#0000FF" },
    { label: "Cyan", hex: "#00FFFF" },
    { label: "Magenta", hex: "#FF00FF" },
    { label: "Yellow", hex: "#FFFF00" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <MetricGrid columns={4}>
        <MetricCard
          label="Aspect Ratio"
          value={aspectRatio}
          subtext="Screen width/height proportion"
          status="neutral"
        />
        <MetricCard
          label="Current Test Mode"
          value={
            activeTab === "dead-pixel"
              ? "Pixel Check"
              : activeTab === "contrast"
              ? "Contrast Band"
              : "Motion Clarity"
          }
          subtext="Selected diagnostic canvas"
          status="accent"
        />
        <MetricCard
          label="Display Fullscreen"
          value={isFullscreen ? "Active" : "Standard"}
          subtext="Click test area for immersion"
          status={isFullscreen ? "good" : "neutral"}
        />
        <MetricCard
          label="Test Speed"
          value={`${motionSpeed} px/f`}
          subtext="Pixel velocity for motion test"
          status="neutral"
        />
      </MetricGrid>

      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-md border border-border-default bg-bg-surface flex-wrap">
        <Button
          variant={activeTab === "dead-pixel" ? "primary" : "tertiary"}
          size="sm"
          onClick={() => setActiveTab("dead-pixel")}
        >
          <Eye size={13} className="mr-1.5" /> Dead Pixel Check
        </Button>
        <Button
          variant={activeTab === "contrast" ? "primary" : "tertiary"}
          size="sm"
          onClick={() => setActiveTab("contrast")}
        >
          <Sliders size={13} className="mr-1.5" /> 256-Step Contrast Ramp
        </Button>
        <Button
          variant={activeTab === "motion" ? "primary" : "tertiary"}
          size="sm"
          onClick={() => setActiveTab("motion")}
        >
          <Activity size={13} className="mr-1.5" /> Motion Ghosting Test
        </Button>
      </div>

      {/* Interactive Display Canvas Area */}
      <div
        ref={testContainerRef}
        className="border border-border-default rounded-md overflow-hidden relative min-h-[340px] flex flex-col items-center justify-center transition-colors"
        style={{
          backgroundColor: activeTab === "dead-pixel" ? pixelColor : "#0A0C10",
        }}
      >
        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-xs bg-black/70 backdrop-blur border border-white/20 text-white text-xs font-mono flex items-center gap-1.5 hover:bg-black/90 transition-colors"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
        </button>

        {/* 1. Dead Pixel Mode */}
        {activeTab === "dead-pixel" && (
          <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-center gap-2 flex-wrap bg-black/80 backdrop-blur border border-white/20 p-2.5 rounded-md">
            <span className="text-2xs font-mono text-text-muted mr-1">PRIMARY TEST:</span>
            {COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => setPixelColor(c.hex)}
                className={`px-3 py-1 rounded-xs text-xs font-mono transition-transform ${
                  pixelColor === c.hex
                    ? "ring-2 ring-accent scale-105 font-bold"
                    : "opacity-80 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: c.hex,
                  color: c.hex === "#FFFFFF" || c.hex === "#FFFF00" || c.hex === "#00FFFF" ? "#000" : "#FFF",
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* 2. Contrast Mode */}
        {activeTab === "contrast" && (
          <div className="w-full h-full p-8 flex flex-col justify-center gap-6">
            <p className="text-xs font-mono text-center text-text-muted">
              Inspect for distinct separation across 16 luminance bands. If adjacent steps merge, display gamma or black crush is occurring.
            </p>
            <div className="flex h-16 w-full rounded-xs overflow-hidden border border-border-strong">
              {Array.from({ length: 16 }).map((_, i) => {
                const val = Math.round((i / 15) * 255);
                return (
                  <div
                    key={i}
                    className="flex-1 h-full flex items-end justify-center pb-1 text-[9px] font-mono select-none"
                    style={{
                      backgroundColor: `rgb(${val}, ${val}, ${val})`,
                      color: val > 128 ? "#000" : "#FFF",
                    }}
                  >
                    {Math.round((i / 15) * 100)}%
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Motion Clarity Mode */}
        {activeTab === "motion" && (
          <div className="w-full h-full p-6 flex flex-col justify-between relative overflow-hidden">
            <p className="text-xs font-mono text-center text-text-muted mb-4">
              A high-contrast moving bar. If you observe smearing or purple trailing behind the bar, the display has slow pixel response times (common on VA/IPS panels).
            </p>
            <div className="relative w-full h-32 border-y border-border-subtle bg-bg-surface overflow-hidden">
              <div
                className="absolute top-0 bottom-0 w-8 bg-accent"
                style={{
                  animation: `slideMotion ${2 / (motionSpeed / 5)}s linear infinite alternate`,
                }}
              />
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
              <span className="text-xs font-mono text-text-muted">Speed:</span>
              {[5, 10, 20].map((spd) => (
                <Button
                  key={spd}
                  variant={motionSpeed === spd ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setMotionSpeed(spd)}
                >
                  {spd}x
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes slideMotion {
          from { left: 0%; }
          to { left: calc(100% - 32px); }
        }
      `}</style>

      <div className="grid md:grid-cols-2 gap-4">
        <TechnicalNote title="AMOLED Black Crush & Burn-in">
          <p>
            On AMOLED mobile panels, pixels turn off completely for pure black (#000000). The 0%–10% gradient test reveals whether your screen suffers from &quot;black crush&quot; (inability to distinguish near-black dark shadow details in competitive games).
          </p>
        </TechnicalNote>

        <LimitationNotice
          limitations={[
            "This test is a visual diagnostic tool; it cannot programmatically read hardware subpixel failures.",
            "Set device screen brightness to maximum and disable 'Eye Comfort / True Tone' filters for accurate color evaluation.",
          ]}
        />
      </div>
    </div>
  );
}
