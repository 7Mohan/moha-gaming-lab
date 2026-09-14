"use client";

import * as React from "react";

/* ── FPS data — realistic session, not a smooth curve ──────── */
const RAW_FPS = [54, 60, 57, 72, 88, 79, 95, 91, 102, 98, 108, 112, 105, 114, 118, 116, 120, 119, 117, 120];

/* ── Diagnostic phases cycling on the hero panel ─────────── */
const PHASES = [
  {
    id: "analyze",
    label: "ANALYZING",
    status: "Profiling device hardware",
    color: "#3B82F6",
    fps: "---",
    ping: "---",
    cpu: "--",
    temp: "--",
    progress: 30,
  },
  {
    id: "diagnose",
    label: "DIAGNOSING",
    status: "Detecting frame drop sources",
    color: "#F59E0B",
    fps: "74",
    ping: "42ms",
    cpu: "91%",
    temp: "47°C",
    progress: 60,
  },
  {
    id: "optimize",
    label: "OPTIMIZING",
    status: "Applying performance profile",
    color: "#00E5A0",
    fps: "108",
    ping: "18ms",
    cpu: "72%",
    temp: "41°C",
    progress: 85,
  },
  {
    id: "play",
    label: "READY",
    status: "Stable 120 FPS · Snapdragon 888",
    color: "#00E5A0",
    fps: "120",
    ping: "8ms",
    cpu: "68%",
    temp: "38°C",
    progress: 100,
  },
] as const;

/* ── FPS sparkline (SVG-only, no deps) ────────────────────── */
function FpsSparkline({ phase }: { phase: (typeof PHASES)[number] }) {
  const W = 200;
  const H = 52;
  const max = 120;
  const min = 40;
  const range = max - min;

  // Phase-specific FPS data for different states
  const phaseData: Record<string, number[]> = {
    analyze:  [54, 50, 57, 52, 48, 55, 60, 55, 52, 58, 54, 57, 53, 60, 56, 54, 58, 55, 53, 57],
    diagnose: [54, 60, 57, 72, 65, 79, 70, 91, 88, 75, 82, 90, 78, 85, 74, 80, 88, 79, 84, 74],
    optimize: [74, 80, 90, 95, 88, 98, 102, 105, 100, 108, 104, 110, 107, 112, 108, 114, 110, 116, 112, 108],
    play:     [54, 60, 57, 72, 88, 79, 95, 91, 102, 98, 108, 112, 105, 114, 118, 116, 120, 119, 117, 120],
  };

  const data = phaseData[phase.id] ?? RAW_FPS;
  const xs = data.map((_, i) => (i / (data.length - 1)) * W);
  const ys = data.map((v) => H - ((v - min) / range) * H);

  const linePath = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${ys[i]!.toFixed(1)}`).join(" ");
  const fillPath = `${linePath} L ${W} ${H} L 0 ${H} Z`;
  const lastX = xs[xs.length - 1]!;
  const lastY = ys[ys.length - 1]!;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      preserveAspectRatio="none"
      aria-label="FPS performance over time"
    >
      <defs>
        <linearGradient id="fps-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={phase.color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={phase.color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#fps-grad)" />
      <path
        d={linePath}
        fill="none"
        stroke={phase.color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <circle cx={lastX} cy={lastY} r="2.5" fill={phase.color}>
        <animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/* ── Single stat row ──────────────────────────────────────── */
function StatRow({
  label,
  value,
  color,
  pct,
}: {
  label: string;
  value: string;
  color: string;
  pct: number;
}) {
  return (
    <div className="hero-stat-row">
      <span className="hero-stat-label">{label}</span>
      <div className="hero-stat-track">
        <div
          className="hero-stat-fill"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>
      <span className="hero-stat-value" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

/* ── Progress ring indicator ─────────────────────────────── */
function PhaseProgress({ pct, color }: { pct: number; color: string }) {
  const r = 12;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <circle cx="17" cy="17" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
      <circle
        cx="17"
        cy="17"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 17 17)"
        style={{ transition: "stroke-dasharray 0.9s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s ease" }}
      />
    </svg>
  );
}

/* ── Main export ──────────────────────────────────────────── */
export function AnimatedHero() {
  const [phaseIndex, setPhaseIndex] = React.useState(0);
  const phase = PHASES[phaseIndex]!;

  /* Cycle through phases automatically */
  React.useEffect(() => {
    const id = setInterval(() => {
      setPhaseIndex((i) => (i + 1) % PHASES.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const cpuPct  = phase.cpu  === "--" ? 15 : parseInt(phase.cpu);
  const tempPct = phase.temp === "--" ? 10 : parseInt(phase.temp);
  const pingPct = phase.ping === "---" ? 5 : Math.min(100, Math.round((parseInt(phase.ping) / 80) * 100));

  return (
    <div className="hero-device-wrap" aria-label="Moha Gaming Lab performance diagnostics interface">
      {/* Ambient glow */}
      <div
        className="hero-glow-bg"
        style={{ background: `radial-gradient(circle, rgba(0,229,160,0.06) 0%, transparent 70%)` }}
        aria-hidden="true"
      />

      {/* Phone shell */}
      <div className="hero-phone">
        {/* Pill notch */}
        <div className="hero-phone-notch" aria-hidden="true" />

        {/* Screen */}
        <div className="hero-phone-screen">

          {/* Top bar */}
          <div className="hero-screen-topbar">
            <span className="hero-screen-app-name">Moha Lab</span>
            <span className="hero-live-dot" aria-label="Live">
              <span className="hero-live-dot-inner" style={{ backgroundColor: phase.color }} />
              {phase.label}
            </span>
          </div>

          {/* FPS readout + progress ring */}
          <div className="hero-fps-block" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span
                className="hero-fps-number"
                style={{
                  color: phase.color,
                  transition: "color 0.4s ease",
                }}
              >
                {phase.fps}
              </span>
              <div className="hero-fps-meta">
                <span className="hero-fps-unit" style={{ color: `${phase.color}88` }}>FPS</span>
                <span className="hero-fps-stable">
                  {phase.id === "play" ? "stable" : phase.id}
                </span>
              </div>
            </div>

            {/* Phase progress ring */}
            <PhaseProgress pct={phase.progress} color={phase.color} />
          </div>

          {/* Graph */}
          <div className="hero-graph-wrap">
            <FpsSparkline phase={phase} />
          </div>

          {/* Stats */}
          <div className="hero-stats">
            <StatRow
              label="Ping"
              value={phase.ping === "---" ? "---" : phase.ping}
              pct={pingPct}
              color="#60A5FA"
            />
            <StatRow
              label="CPU"
              value={phase.cpu === "--" ? "---" : phase.cpu}
              pct={cpuPct}
              color="#A78BFA"
            />
            <StatRow
              label="Temp"
              value={phase.temp === "--" ? "---" : phase.temp}
              pct={tempPct}
              color="#34D399"
            />
          </div>

          {/* Status strip */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.04)",
              paddingTop: "8px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <span style={{
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              backgroundColor: phase.color,
              flexShrink: 0,
              display: "block",
              transition: "background-color 0.4s ease",
            }} aria-hidden="true" />
            <span style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "7.5px",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "#4E5967",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {phase.status}
            </span>
          </div>

        </div>

        {/* Home bar */}
        <div className="hero-phone-home" aria-hidden="true" />
      </div>

      {/* Phase indicator dots */}
      <div
        style={{ display: "flex", gap: "6px", alignItems: "center" }}
        role="tablist"
        aria-label="Diagnostic phase"
      >
        {PHASES.map((p, i) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={i === phaseIndex}
            aria-label={p.label}
            onClick={() => setPhaseIndex(i)}
            style={{
              width: i === phaseIndex ? "20px" : "5px",
              height: "5px",
              borderRadius: "3px",
              border: "none",
              backgroundColor: i === phaseIndex ? "#00E5A0" : "rgba(255,255,255,0.15)",
              transition: "width 0.3s ease, background-color 0.3s ease",
              cursor: "pointer",
              padding: 0,
            }}
          />
        ))}
      </div>

      {/* Caption */}
      <p className="hero-device-caption">
        Demonstrates the diagnostic cycle — real data requires device access
      </p>
    </div>
  );
}
