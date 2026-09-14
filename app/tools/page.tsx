import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";
import { getPublishedTools } from "@/lib/services/tool-service";
import { ToolsHubClient } from "@/components/tools/ToolsHubClient";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: "Gaming Diagnostics & Performance Tools",
  description:
    "Practical client-side tools for diagnosing Android and web gaming performance — FPS monitors, refresh rate testing, latency analysis, WebGL GPU diagnostics, and touch sampling.",
  path: "/tools",
});

export default async function ToolsPage() {
  const tools = await getPublishedTools();
  return (
    <div className="container-content section">
      {/* Header Section */}
      <div className="flex flex-col gap-3 mb-10">
        <div className="flex items-center gap-2">
          <span className="label-mono text-accent">Performance Laboratory</span>
          <span className="text-text-muted text-xs">•</span>
          <span className="text-2xs font-mono text-text-muted flex items-center gap-1">
            <ShieldCheck size={12} className="text-accent" />
            100% In-Browser Diagnostics
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
          Gaming Diagnostic Tools
        </h1>

        <p className="text-text-secondary text-sm sm:text-base max-w-2xl leading-relaxed">
          Practical tools for diagnosing and understanding gaming performance. Real browser-level metrics for refresh rates, frame pacing, network jitter, touch sampling, and GPU capabilities.
        </p>
      </div>

      {/* Interactive Hub Client Island */}
      <ToolsHubClient initialTools={tools} />
    </div>
  );
}
