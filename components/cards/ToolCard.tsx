import Link from "next/link";
import type { Tool } from "@/types/tool";
import { Card } from "@/components/ui/Card";
import { CATEGORY_LABELS } from "@/lib/tools";
import { ArrowRight, Globe, Smartphone, Monitor } from "lucide-react";

interface ToolCardProps {
  tool: Tool;
}

const platformIcons = {
  web: <Globe size={11} aria-hidden="true" />,
  android: <Smartphone size={11} aria-hidden="true" />,
  windows: <Monitor size={11} aria-hidden="true" />,
};

export function ToolCard({ tool }: ToolCardProps) {
  return (
    <Card as="article" interactive variant="surface" className="h-full">
      <Link
        href={`/tools/${tool.slug}`}
        className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md p-5 flex flex-col justify-between gap-4 group"
        aria-label={`${tool.name} — ${tool.shortDescription}`}
      >
        <div className="flex flex-col gap-3">
          {/* Top metadata bar */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-2xs font-mono font-bold text-accent uppercase tracking-wider">
                {CATEGORY_LABELS[tool.category] || tool.category}
              </span>
              <span className="text-text-muted text-2xs">•</span>
              <span className="text-2xs font-mono text-text-muted capitalize">
                {tool.difficulty}
              </span>
            </div>

            {/* Status indicator */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-mono font-medium border bg-accent/10 border-accent/25 text-accent">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span>LIVE</span>
            </span>
          </div>

          {/* Tool Title */}
          <div>
            <h3 className="text-base font-bold text-text-primary group-hover:text-accent transition-colors leading-snug">
              {tool.name}
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed mt-1 line-clamp-2">
              {tool.shortDescription}
            </p>
          </div>

          {/* What it measures chip preview */}
          {tool.whatItMeasures.length > 0 && (
            <div className="pt-2 border-t border-border-subtle">
              <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider block mb-1">
                MEASURES:
              </span>
              <p className="text-2xs font-mono text-text-muted line-clamp-1">
                {tool.whatItMeasures.slice(0, 2).join(" • ")}
              </p>
            </div>
          )}
        </div>

        {/* Bottom bar: Platforms + Action */}
        <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1.5">
            {tool.platforms.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-bg-base border border-border-subtle text-[10px] font-mono text-text-muted uppercase"
                title={`Supported on ${p}`}
              >
                {platformIcons[p]}
                <span>{p}</span>
              </span>
            ))}
          </div>

          <span className="text-xs font-mono font-semibold text-accent group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
            <span>Launch Tool</span>
            <ArrowRight size={12} aria-hidden="true" />
          </span>
        </div>
      </Link>
    </Card>
  );
}
