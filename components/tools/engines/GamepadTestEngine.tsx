"use client";

import * as React from "react";
import { Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MetricCard, MetricGrid } from "@/components/tools/MetricCard";
import { LimitationNotice, TechnicalNote, PrivacyBadge } from "@/components/tools/LimitationNotice";

interface GamepadState {
  id: string;
  index: number;
  connected: boolean;
  buttons: { pressed: boolean; value: number }[];
  axes: number[];
}

export function GamepadTestEngine() {
  const [gamepads, setGamepads] = React.useState<GamepadState[]>([]);
  const [selectedPad, setSelectedPad] = React.useState<number>(0);
  const [, setHasDetected] = React.useState(false);

  React.useEffect(() => {
    let animId: number;

    const pollGamepads = () => {
      if (typeof navigator !== "undefined" && "getGamepads" in navigator) {
        const rawPads = navigator.getGamepads ? navigator.getGamepads() : [];
        const active: GamepadState[] = [];

        for (let i = 0; i < rawPads.length; i++) {
          const pad = rawPads[i];
          if (pad && pad.connected) {
            active.push({
              id: pad.id,
              index: pad.index,
              connected: pad.connected,
              buttons: pad.buttons.map((b) => ({
                pressed: b.pressed,
                value: Number(b.value.toFixed(2)),
              })),
              axes: pad.axes.map((a) => Number(a.toFixed(3))),
            });
          }
        }

        setGamepads(active);
        if (active.length > 0) setHasDetected(true);
      }

      animId = requestAnimationFrame(pollGamepads);
    };

    animId = requestAnimationFrame(pollGamepads);
    return () => cancelAnimationFrame(animId);
  }, []);

  const activeGamepad = gamepads.find((g) => g.index === selectedPad) || gamepads[0];

  // Calculate drift on left & right stick
  const leftX = activeGamepad?.axes[0] ?? 0;
  const leftY = activeGamepad?.axes[1] ?? 0;
  const rightX = activeGamepad?.axes[2] ?? 0;
  const rightY = activeGamepad?.axes[3] ?? 0;

  const leftMagnitude = Math.sqrt(leftX * leftX + leftY * leftY);
  const rightMagnitude = Math.sqrt(rightX * rightX + rightY * rightY);

  const BUTTON_NAMES = [
    "A / Cross",
    "B / Circle",
    "X / Square",
    "Y / Triangle",
    "LB / L1",
    "RB / R1",
    "LT / L2",
    "RT / R2",
    "Back / Select",
    "Start / Options",
    "L3 (Left Click)",
    "R3 (Right Click)",
    "D-Pad Up",
    "D-Pad Down",
    "D-Pad Left",
    "D-Pad Right",
    "Home / Guide",
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PrivacyBadge text="Real-time in-memory polling. Zero controller telemetry stored." />
      </div>

      <MetricGrid columns={4}>
        <MetricCard
          label="Controllers"
          value={gamepads.length}
          unit="Active"
          subtext="Connected via Bluetooth/USB"
          status={gamepads.length > 0 ? "good" : "neutral"}
        />
        <MetricCard
          label="Left Stick Magnitude"
          value={leftMagnitude.toFixed(3)}
          subtext={leftMagnitude > 0.1 ? "Active deflection" : "Centered / Idle"}
          status={leftMagnitude > 0.08 ? "accent" : "good"}
        />
        <MetricCard
          label="Right Stick Magnitude"
          value={rightMagnitude.toFixed(3)}
          subtext={rightMagnitude > 0.1 ? "Active deflection" : "Centered / Idle"}
          status={rightMagnitude > 0.08 ? "accent" : "good"}
        />
        <MetricCard
          label="Controller Status"
          value={gamepads.length > 0 ? "Connected" : "Waiting"}
          subtext={gamepads.length > 0 ? "Receiving inputs" : "Press any button"}
          status={gamepads.length > 0 ? "good" : "warning"}
        />
      </MetricGrid>

      {/* Controller Selector / Waiting State */}
      {gamepads.length === 0 || !activeGamepad ? (
        <div className="p-8 border border-border-default bg-bg-surface rounded-md flex flex-col items-center justify-center text-center gap-3">
          <Gamepad2 size={36} className="text-accent animate-pulse" />
          <h3 className="text-base font-semibold text-text-primary">
            Connect a Gamepad & Press Any Button
          </h3>
          <p className="text-xs text-text-secondary max-w-md">
            Browsers require at least one button press on your paired Bluetooth or USB-C controller before the Gamepad API security policy exposes device data to this web page.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Active Gamepad Header */}
          <div className="p-4 border border-border-default bg-bg-surface rounded-md flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <div>
                <h3 className="text-sm font-semibold text-text-primary font-mono truncate max-w-md">
                  {activeGamepad.id}
                </h3>
                <span className="text-2xs font-mono text-text-muted">
                  Slot #{activeGamepad.index} • {activeGamepad.buttons.length} Buttons • {activeGamepad.axes.length} Analog Axes
                </span>
              </div>
            </div>

            {gamepads.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-text-muted">Switch:</span>
                {gamepads.map((g) => (
                  <Button
                    key={g.index}
                    variant={selectedPad === g.index ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setSelectedPad(g.index)}
                  >
                    Pad #{g.index}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Analog Sticks Visualizer */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Left Stick */}
            <div className="border border-border-default bg-bg-surface rounded-md p-5 flex flex-col items-center gap-4">
              <span className="text-xs font-mono font-semibold text-text-primary uppercase tracking-wider">
                Left Analog Stick (Movement)
              </span>
              <div className="relative w-40 h-40 rounded-full border-2 border-border-strong bg-bg-base flex items-center justify-center">
                {/* Crosshairs */}
                <div className="absolute inset-x-0 top-1/2 h-px bg-border-subtle" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-border-subtle" />
                <div className="absolute inset-4 rounded-full border border-border-subtle border-dashed" />

                {/* Stick Dot */}
                <div
                  className="w-8 h-8 rounded-full bg-accent/80 border-2 border-accent shadow-md transition-transform duration-75"
                  style={{
                    transform: `translate(${leftX * 55}px, ${leftY * 55}px)`,
                  }}
                />
              </div>
              <div className="font-mono text-xs text-text-muted flex gap-4">
                <span>X: <strong className="text-text-primary">{leftX.toFixed(3)}</strong></span>
                <span>Y: <strong className="text-text-primary">{leftY.toFixed(3)}</strong></span>
              </div>
            </div>

            {/* Right Stick */}
            <div className="border border-border-default bg-bg-surface rounded-md p-5 flex flex-col items-center gap-4">
              <span className="text-xs font-mono font-semibold text-text-primary uppercase tracking-wider">
                Right Analog Stick (Camera / Aim)
              </span>
              <div className="relative w-40 h-40 rounded-full border-2 border-border-strong bg-bg-base flex items-center justify-center">
                {/* Crosshairs */}
                <div className="absolute inset-x-0 top-1/2 h-px bg-border-subtle" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-border-subtle" />
                <div className="absolute inset-4 rounded-full border border-border-subtle border-dashed" />

                {/* Stick Dot */}
                <div
                  className="w-8 h-8 rounded-full bg-status-info/80 border-2 border-status-info shadow-md transition-transform duration-75"
                  style={{
                    transform: `translate(${rightX * 55}px, ${rightY * 55}px)`,
                  }}
                />
              </div>
              <div className="font-mono text-xs text-text-muted flex gap-4">
                <span>X: <strong className="text-text-primary">{rightX.toFixed(3)}</strong></span>
                <span>Y: <strong className="text-text-primary">{rightY.toFixed(3)}</strong></span>
              </div>
            </div>
          </div>

          {/* Button Grid Matrix */}
          <div className="border border-border-default bg-bg-surface rounded-md p-5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary block mb-4">
              Button & Trigger Input States
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {activeGamepad.buttons.map((btn, idx) => {
                const name = BUTTON_NAMES[idx] || `Button ${idx}`;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xs border text-xs font-mono flex items-center justify-between transition-colors ${
                      btn.pressed
                        ? "bg-accent/20 border-accent text-accent font-bold shadow-sm"
                        : "bg-bg-elevated/40 border-border-subtle text-text-secondary"
                    }`}
                  >
                    <span className="truncate pr-1">{name}</span>
                    <span className="text-2xs tabular-nums opacity-80 font-semibold">
                      {btn.value > 0 ? btn.value.toFixed(2) : "0"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <TechnicalNote title="Stick Drift Diagnosis">
          <p>
            When both thumbsticks are at rest and untouched, the magnitude should read below <strong>0.050</strong>. A magnitude consistently reading above 0.080 indicates physical stick drift caused by potentiometer wear or dirt, which can be compensated for by increasing in-game deadzones.
          </p>
        </TechnicalNote>

        <LimitationNotice
          limitations={[
            "Browsers only poll gamepads when the tab is focused and active in the foreground.",
            "Specialized paddle buttons or audio jacks on certain third-party controllers may not map through generic W3C indices.",
          ]}
        />
      </div>
    </div>
  );
}
