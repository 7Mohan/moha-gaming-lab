"use client";

import * as React from "react";
import { Check, X, AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MetricCard, MetricGrid } from "@/components/tools/MetricCard";
import { LimitationNotice, TechnicalNote } from "@/components/tools/LimitationNotice";

interface CapabilityTest {
  id: string;
  name: string;
  category: "Graphics" | "Compute" | "Input" | "Audio/Video" | "Storage";
  description: string;
  test: () => Promise<"Supported" | "Unavailable" | "Blocked" | "Unknown">;
}

const TESTS: CapabilityTest[] = [
  {
    id: "webgl1",
    name: "WebGL 1.0",
    category: "Graphics",
    description: "Standard hardware-accelerated 3D graphics rendering in HTML5 canvas.",
    test: async () => {
      try {
        const c = document.createElement("canvas");
        return !!(c.getContext("webgl") || c.getContext("experimental-webgl")) ? "Supported" : "Unavailable";
      } catch {
        return "Blocked";
      }
    },
  },
  {
    id: "webgl2",
    name: "WebGL 2.0",
    category: "Graphics",
    description: "OpenGL ES 3.0-equivalent graphics API supporting transform feedback and uniform buffer objects.",
    test: async () => {
      try {
        const c = document.createElement("canvas");
        return !!c.getContext("webgl2") ? "Supported" : "Unavailable";
      } catch {
        return "Blocked";
      }
    },
  },
  {
    id: "webgpu",
    name: "WebGPU",
    category: "Graphics",
    description: "Modern explicit low-level compute and 3D graphics API succeeding WebGL.",
    test: async () => {
      try {
        if (!("gpu" in navigator)) return "Unavailable";
        const gpu = (navigator as unknown as { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
        if (!gpu) return "Unavailable";
        const adapter = await gpu.requestAdapter();
        return adapter ? "Supported" : "Unavailable";
      } catch {
        return "Blocked";
      }
    },
  },
  {
    id: "wasm",
    name: "WebAssembly (Wasm)",
    category: "Compute",
    description: "Near-native binary execution format powering browser-based game engines and emulators.",
    test: async () => {
      try {
        return typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function" ? "Supported" : "Unavailable";
      } catch {
        return "Blocked";
      }
    },
  },
  {
    id: "gamepad",
    name: "Gamepad API",
    category: "Input",
    description: "Low-latency controller input mapping for Xbox, PlayStation, and mobile Bluetooth gamepads.",
    test: async () => {
      try {
        return "getGamepads" in navigator ? "Supported" : "Unavailable";
      } catch {
        return "Blocked";
      }
    },
  },
  {
    id: "pointer",
    name: "Pointer Lock & Events",
    category: "Input",
    description: "Captures mouse and cursor movements indefinitely for first-person shooter camera control.",
    test: async () => {
      try {
        return "requestPointerLock" in Element.prototype && "PointerEvent" in window ? "Supported" : "Unavailable";
      } catch {
        return "Blocked";
      }
    },
  },
  {
    id: "workers",
    name: "Web Workers",
    category: "Compute",
    description: "Background multi-threading to offload game physics and network parsing from UI thread.",
    test: async () => {
      try {
        return typeof Worker !== "undefined" ? "Supported" : "Unavailable";
      } catch {
        return "Blocked";
      }
    },
  },
  {
    id: "offscreen",
    name: "OffscreenCanvas",
    category: "Graphics",
    description: "Renders graphics directly inside a Web Worker thread without blocking DOM interactions.",
    test: async () => {
      try {
        return typeof OffscreenCanvas !== "undefined" ? "Supported" : "Unavailable";
      } catch {
        return "Blocked";
      }
    },
  },
  {
    id: "audio",
    name: "Web Audio API",
    category: "Audio/Video",
    description: "Low-latency spatial audio engine for real-time 3D positional game sound effects.",
    test: async () => {
      try {
        return typeof AudioContext !== "undefined" || typeof (window as unknown as { webkitAudioContext: unknown }).webkitAudioContext !== "undefined" ? "Supported" : "Unavailable";
      } catch {
        return "Blocked";
      }
    },
  },
  {
    id: "webcodecs",
    name: "WebCodecs API",
    category: "Audio/Video",
    description: "Low-overhead hardware-accelerated video stream decoding for cloud gaming platforms.",
    test: async () => {
      try {
        return typeof (window as unknown as { VideoDecoder: unknown }).VideoDecoder !== "undefined" ? "Supported" : "Unavailable";
      } catch {
        return "Unavailable";
      }
    },
  },
  {
    id: "indexeddb",
    name: "IndexedDB Storage",
    category: "Storage",
    description: "Large-capacity client-side transactional object database for offline game files.",
    test: async () => {
      try {
        return typeof indexedDB !== "undefined" ? "Supported" : "Unavailable";
      } catch {
        return "Blocked";
      }
    },
  },
  {
    id: "fullscreen",
    name: "Fullscreen API",
    category: "Graphics",
    description: "Allows the browser window to occupy the complete display without browser URL chrome.",
    test: async () => {
      try {
        return document.fullscreenEnabled || (document as unknown as { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled ? "Supported" : "Unavailable";
      } catch {
        return "Blocked";
      }
    },
  },
];

export function BrowserTestEngine() {
  const [results, setResults] = React.useState<Record<string, "Supported" | "Unavailable" | "Blocked" | "Unknown">>({});
  const [isScanning, setIsScanning] = React.useState(true);

  const runAllTests = React.useCallback(async () => {
    setIsScanning(true);
    const newResults: Record<string, "Supported" | "Unavailable" | "Blocked" | "Unknown"> = {};

    for (const testItem of TESTS) {
      try {
        const res = await testItem.test();
        newResults[testItem.id] = res;
      } catch {
        newResults[testItem.id] = "Blocked";
      }
    }

    setResults(newResults);
    setIsScanning(false);
  }, []);

  React.useEffect(() => {
    runAllTests();
  }, [runAllTests]);

  const supportedCount = Object.values(results).filter((r) => r === "Supported").length;

  return (
    <div className="flex flex-col gap-6">
      <MetricGrid columns={4}>
        <MetricCard
          label="Gaming Readiness"
          value={isScanning ? "Scanning..." : `${supportedCount}/${TESTS.length}`}
          unit="APIs"
          subtext="Tested modern gaming web standards"
          status={supportedCount >= 10 ? "good" : "warning"}
        />
        <MetricCard
          label="3D Acceleration"
          value={results["webgl2"] === "Supported" ? "WebGL 2.0" : results["webgl1"] === "Supported" ? "WebGL 1.0" : "None"}
          subtext="Canvas GPU acceleration tier"
          status={results["webgl2"] === "Supported" ? "good" : "warning"}
        />
        <MetricCard
          label="Next-Gen WebGPU"
          value={results["webgpu"] || "Checking..."}
          subtext="Modern compute pipeline"
          status={results["webgpu"] === "Supported" ? "good" : "neutral"}
        />
        <MetricCard
          label="Wasm Binary Engine"
          value={results["wasm"] || "Checking..."}
          subtext="Low-level assembly execution"
          status={results["wasm"] === "Supported" ? "good" : "warning"}
        />
      </MetricGrid>

      {/* Standards Matrix */}
      <div className="border border-border-default bg-bg-surface rounded-md overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border-subtle bg-bg-elevated flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
            Feature Detection Matrix
          </span>
          <Button variant="tertiary" size="sm" onClick={runAllTests} disabled={isScanning}>
            <RotateCcw size={12} className="mr-1" /> Re-scan
          </Button>
        </div>

        <div className="divide-y divide-border-subtle">
          {TESTS.map((t) => {
            const status = results[t.id] || "Unknown";
            const isSupported = status === "Supported";
            const isUnavailable = status === "Unavailable";

            return (
              <div
                key={t.id}
                className="px-5 py-3.5 flex items-start justify-between gap-4 hover:bg-bg-elevated/40 transition-colors"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary">
                      {t.name}
                    </span>
                    <span className="text-2xs font-mono text-text-muted px-1.5 py-0.5 rounded-xs bg-bg-base border border-border-subtle">
                      {t.category}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed max-w-xl">
                    {t.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5 font-mono text-xs">
                  {isSupported ? (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-xs bg-status-success/10 text-status-success border border-status-success/20">
                      <Check size={12} /> Supported
                    </span>
                  ) : isUnavailable ? (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-xs bg-status-warning/10 text-status-warning border border-status-warning/20">
                      <X size={12} /> Unavailable
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-xs bg-status-error/10 text-status-error border border-status-error/20">
                      <AlertCircle size={12} /> {status}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <TechnicalNote title="W3C Standards Conformance">
          <p>
            Feature detection verifies that your current browser binary exposes the required global constructor interfaces and that security policies do not block context creation.
          </p>
        </TechnicalNote>

        <LimitationNotice
          limitations={[
            "An API reporting 'Supported' indicates interface availability; underlying GPU drivers must still function properly.",
            "WebGPU is progressively rolling out on Android and may require chrome://flags enablement.",
          ]}
        />
      </div>
    </div>
  );
}
