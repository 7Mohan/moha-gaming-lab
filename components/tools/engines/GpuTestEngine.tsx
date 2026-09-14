"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MetricCard, MetricGrid } from "@/components/tools/MetricCard";
import { LimitationNotice, TechnicalNote, PrivacyBadge } from "@/components/tools/LimitationNotice";

interface GpuSpecs {
  webgl1: boolean;
  webgl2: boolean;
  vendor: string;
  renderer: string;
  unmaskedVendor: string;
  unmaskedRenderer: string;
  maxTextureSize: number;
  maxRenderbufferSize: number;
  maxVertexTextureUnits: number;
  maxCombinedTextureUnits: number;
  msaaSamples: number;
  extensionsCount: number;
  shadingLanguageVersion: string;
}

export function GpuTestEngine() {
  const [specs, setSpecs] = React.useState<GpuSpecs | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const probeGpu = React.useCallback(() => {
    try {
      const canvas = document.createElement("canvas");
      let gl = canvas.getContext("webgl2") as WebGLRenderingContext | WebGL2RenderingContext | null;
      const isWebgl2 = !!gl;

      if (!gl) {
        gl = (canvas.getContext("webgl") ||
          canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
      }

      if (!gl) {
        setError("WebGL context creation failed. Hardware acceleration may be disabled or blacklisted by your browser.");
        return;
      }

      // Check debug info extension
      const debugExt = gl.getExtension("WEBGL_debug_renderer_info");
      const unmaskedVendor = debugExt
        ? gl.getParameter(debugExt.UNMASKED_VENDOR_WEBGL) || "Masked"
        : "Extension Unavailable";
      const unmaskedRenderer = debugExt
        ? gl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL) || "Masked"
        : "Extension Unavailable";

      const maxSamples = isWebgl2
        ? (gl as WebGL2RenderingContext).getParameter((gl as WebGL2RenderingContext).MAX_SAMPLES)
        : 4;

      const info: GpuSpecs = {
        webgl1: true,
        webgl2: isWebgl2,
        vendor: gl.getParameter(gl.VENDOR) || "Generic",
        renderer: gl.getParameter(gl.RENDERER) || "Generic",
        unmaskedVendor: String(unmaskedVendor),
        unmaskedRenderer: String(unmaskedRenderer),
        maxTextureSize: Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) || 0,
        maxRenderbufferSize: Number(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)) || 0,
        maxVertexTextureUnits: Number(gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS)) || 0,
        maxCombinedTextureUnits: Number(gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS)) || 0,
        msaaSamples: Number(maxSamples) || 0,
        extensionsCount: gl.getSupportedExtensions()?.length || 0,
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || "GLSL ES",
      };

      setSpecs(info);
      setError(null);
    } catch (e) {
      setError(`GPU Probe Exception: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, []);

  React.useEffect(() => {
    probeGpu();
  }, [probeGpu]);

  if (error) {
    return (
      <div className="p-6 border border-status-error/30 bg-status-error/5 rounded-md text-status-error text-sm font-mono flex flex-col gap-3">
        <p className="font-bold">WebGL Initialization Blocked</p>
        <p className="text-xs text-text-secondary">{error}</p>
        <div>
          <Button variant="secondary" size="sm" onClick={probeGpu}>
            <RefreshCw size={13} className="mr-1.5" /> Retry Initialization
          </Button>
        </div>
      </div>
    );
  }

  if (!specs) {
    return (
      <div className="p-8 text-center text-text-muted font-mono text-sm border border-border-default rounded-md bg-bg-surface">
        Inspecting GPU capabilities safely...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PrivacyBadge text="Non-stressing probe. Zero thermal impact." />
      </div>

      {/* Primary GPU Limits */}
      <MetricGrid columns={4}>
        <MetricCard
          label="Graphics API"
          value={specs.webgl2 ? "WebGL 2.0" : "WebGL 1.0"}
          subtext={specs.shadingLanguageVersion}
          status={specs.webgl2 ? "good" : "warning"}
          badge={specs.webgl2 ? "OpenGL ES 3.0" : "Legacy ES 2.0"}
        />
        <MetricCard
          label="Max Texture Size"
          value={`${specs.maxTextureSize}px`}
          subtext="Maximum single 2D texture limit"
          status={specs.maxTextureSize >= 16384 ? "good" : "neutral"}
        />
        <MetricCard
          label="MSAA Samples"
          value={`${specs.msaaSamples}x`}
          unit="Antialiasing"
          subtext="Hardware multisample renderbuffer"
          status="neutral"
        />
        <MetricCard
          label="GL Extensions"
          value={specs.extensionsCount}
          unit="Active"
          subtext="Supported driver feature extensions"
          status="neutral"
        />
      </MetricGrid>

      {/* Unmasked Hardware Report */}
      <div className="border border-border-default bg-bg-surface rounded-md overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border-subtle bg-bg-elevated flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
            Hardware Renderer & Driver Report
          </span>
          <Button variant="tertiary" size="sm" onClick={probeGpu}>
            <RefreshCw size={12} className="mr-1" /> Re-probe
          </Button>
        </div>

        <dl className="divide-y divide-border-subtle text-xs">
          <div className="grid sm:grid-cols-3 px-5 py-3">
            <dt className="text-text-muted font-mono">Unmasked Renderer</dt>
            <dd className="sm:col-span-2 text-text-primary font-mono font-semibold break-words">
              {specs.unmaskedRenderer}
            </dd>
          </div>
          <div className="grid sm:grid-cols-3 px-5 py-3">
            <dt className="text-text-muted font-mono">Unmasked Vendor</dt>
            <dd className="sm:col-span-2 text-text-primary font-mono">{specs.unmaskedVendor}</dd>
          </div>
          <div className="grid sm:grid-cols-3 px-5 py-3">
            <dt className="text-text-muted font-mono">Composited Driver String</dt>
            <dd className="sm:col-span-2 text-text-secondary font-mono">{specs.renderer}</dd>
          </div>
          <div className="grid sm:grid-cols-3 px-5 py-3">
            <dt className="text-text-muted font-mono">Max Renderbuffer Size</dt>
            <dd className="sm:col-span-2 text-text-primary font-mono">{specs.maxRenderbufferSize} px</dd>
          </div>
          <div className="grid sm:grid-cols-3 px-5 py-3">
            <dt className="text-text-muted font-mono">Vertex Texture Units</dt>
            <dd className="sm:col-span-2 text-text-primary font-mono">{specs.maxVertexTextureUnits} units</dd>
          </div>
          <div className="grid sm:grid-cols-3 px-5 py-3">
            <dt className="text-text-muted font-mono">Combined Texture Units</dt>
            <dd className="sm:col-span-2 text-text-primary font-mono">{specs.maxCombinedTextureUnits} units</dd>
          </div>
        </dl>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <TechnicalNote title="GPU Architecture Detection">
          <p>
            If your unmasked renderer mentions <strong>Adreno (Qualcomm)</strong>, <strong>Mali (ARM / MediaTek)</strong>, or <strong>Immortalis</strong>, your browser is rendering directly through hardware-accelerated drivers rather than a software fallback (like SwiftShader).
          </p>
        </TechnicalNote>

        <LimitationNotice
          title="Safe Hardware Diagnostics"
          limitations={[
            "This diagnostic extracts configuration parameters and does not run extreme shader loops that overheat your device.",
            "Modern privacy standards (Brave, Firefox resistFingerprinting) may sanitize the unmasked vendor to prevent tracking.",
          ]}
        />
      </div>
    </div>
  );
}
