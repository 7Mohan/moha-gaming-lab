"use client";

import * as React from "react";
import { RotateCcw, Hand, MousePointer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MetricCard, MetricGrid } from "@/components/tools/MetricCard";
import { LimitationNotice, TechnicalNote } from "@/components/tools/LimitationNotice";

interface TouchPoint {
  id: number;
  x: number;
  y: number;
  pressure?: number;
  pointerType: string;
}

export function TouchTestEngine() {
  const [activePoints, setActivePoints] = React.useState<TouchPoint[]>([]);
  const [eventRateHz, setEventRateHz] = React.useState<number>(0);
  const [maxTouchesObserved, setMaxTouchesObserved] = React.useState<number>(0);
  const [totalEvents, setTotalEvents] = React.useState<number>(0);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const pointsMapRef = React.useRef<Map<number, TouchPoint>>(new Map());
  const eventCountRef = React.useRef<number>(0);
  const lastSecRef = React.useRef<number>(performance.now());

  // Event frequency calculation loop
  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = performance.now();
      const elapsed = (now - lastSecRef.current) / 1000;
      if (elapsed > 0) {
        const rate = Math.round(eventCountRef.current / elapsed);
        setEventRateHz(rate);
        eventCountRef.current = 0;
        lastSecRef.current = now;
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Canvas drawing loop
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const colors = ["#00E5A0", "#38BDF8", "#F59E0B", "#EF4444", "#E879F9", "#A78BFA", "#F97316", "#34D399"];

    const draw = () => {
      const w = rect.width;
      const h = rect.height;

      // Subtle persistence trail
      ctx.fillStyle = "rgba(10, 12, 16, 0.2)";
      ctx.fillRect(0, 0, w, h);

      // Draw all active touch points
      const points = Array.from(pointsMapRef.current.values());
      points.forEach((pt, idx) => {
        const color = colors[idx % colors.length] ?? "#00E5A0";

        // Outer ripple ring
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 35, 0, Math.PI * 2);
        ctx.stroke();

        // Inner solid dot
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 14, 0, Math.PI * 2);
        ctx.fill();

        // Coordinates label
        ctx.fillStyle = "#F0F3F6";
        ctx.font = "10px monospace";
        ctx.fillText(`ID ${pt.id} [${Math.round(pt.x)}, ${Math.round(pt.y)}]`, pt.x + 20, pt.y - 10);
      });

      requestAnimationFrame(draw);
    };

    const animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const pt: TouchPoint = {
      id: e.pointerId,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure,
      pointerType: e.pointerType,
    };
    pointsMapRef.current.set(e.pointerId, pt);
    eventCountRef.current++;
    setTotalEvents((p) => p + 1);

    const active = Array.from(pointsMapRef.current.values());
    setActivePoints(active);
    setMaxTouchesObserved((prev) => Math.max(prev, active.length));
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointsMapRef.current.has(e.pointerId)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pt: TouchPoint = {
      id: e.pointerId,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure,
      pointerType: e.pointerType,
    };
    pointsMapRef.current.set(e.pointerId, pt);
    eventCountRef.current++;
    setTotalEvents((p) => p + 1);
    setActivePoints(Array.from(pointsMapRef.current.values()));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    pointsMapRef.current.delete(e.pointerId);
    setActivePoints(Array.from(pointsMapRef.current.values()));
  };

  const handleClear = () => {
    pointsMapRef.current.clear();
    setActivePoints([]);
    setMaxTouchesObserved(0);
    setEventRateHz(0);
    setTotalEvents(0);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <MetricGrid columns={4}>
        <MetricCard
          label="Active Touch Points"
          value={activePoints.length}
          unit="Fingers"
          subtext="Simultaneous contacts detected"
          status={activePoints.length >= 4 ? "good" : "neutral"}
        />
        <MetricCard
          label="Event Dispatch Rate"
          value={eventRateHz}
          unit="Hz"
          subtext="Events dispatched per second"
          status={eventRateHz >= 100 ? "good" : eventRateHz >= 60 ? "accent" : "neutral"}
        />
        <MetricCard
          label="Max Multi-Touch"
          value={maxTouchesObserved}
          unit="Points"
          subtext="Highest simultaneous contact count"
          status={maxTouchesObserved >= 5 ? "good" : "neutral"}
        />
        <MetricCard
          label="Total Touch Events"
          value={totalEvents}
          subtext="Accumulated input packets"
          status="neutral"
        />
      </MetricGrid>

      {/* Interactive Touch Zone */}
      <div className="border border-border-default bg-bg-surface rounded-md p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
            <Hand size={14} className="text-accent" />
            <span>TOUCH / POINTER TEST CANVAS — Drag, tap, and test multi-finger claw grip</span>
          </div>
          <Button variant="tertiary" size="sm" onClick={handleClear}>
            <RotateCcw size={12} className="mr-1" /> Clear Canvas
          </Button>
        </div>

        <div
          className="relative w-full h-80 rounded-md border border-border-subtle bg-bg-base overflow-hidden touch-none cursor-crosshair select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
          />

          {activePoints.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-4">
              <MousePointer size={24} className="text-text-muted mb-2 animate-bounce" />
              <p className="text-sm font-semibold text-text-secondary">
                Touch, drag, or click inside this box
              </p>
              <p className="text-xs text-text-muted max-w-sm mt-1">
                Supports multiple simultaneous fingers on mobile devices. Test your 4-finger or 6-finger claw grip for ghost touches.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <TechnicalNote title="Input Dispatch Frequency">
          <p>
            The event dispatch rate reflects how frequently your browser processes pointer packets. High-end Android gaming devices typically dispatch pointer events at 120Hz–240Hz, while standard devices dispatch at 60Hz.
          </p>
        </TechnicalNote>

        <LimitationNotice
          title="Browser Event Rate vs Digitizer Hardware Rate"
          limitations={[
            "This tool measures browser input-event behavior, not the complete end-to-end hardware touch latency.",
            "Display digitizer scan rates (e.g. 360Hz or 480Hz touch sampling) are filtered by OS kernel drivers before reaching web APIs.",
            "Certain browser gestures (like edge swipe navigation) may intercept touch events along screen edges.",
          ]}
        />
      </div>
    </div>
  );
}
