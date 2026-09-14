import Link from "next/link";
import type { Guide } from "@/types/guide";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Clock, Calendar, ArrowRight } from "lucide-react";

interface GuideCardProps {
  guide: Guide;
}

const difficultyBadgeVariant: Record<Guide["difficulty"], "success" | "warning" | "error" | "default"> = {
  Beginner: "success",
  Intermediate: "warning",
  Advanced: "error",
};

export function GuideCard({ guide }: GuideCardProps) {
  const dateFormatted = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(guide.publishedAt));

  return (
    <Card as="article" interactive variant="surface" className="h-full flex flex-col justify-between">
      <Link
        href={`/guides/${guide.slug}`}
        className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md p-5 flex flex-col justify-between gap-4"
        aria-label={`${guide.title} — ${guide.excerpt}`}
      >
        <div className="flex flex-col gap-3">
          {/* Top category, content type, & difficulty row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" size="sm">
                {guide.category}
              </Badge>
              <span className="text-2xs font-mono text-text-muted">
                {guide.contentType}
              </span>
            </div>

            <Badge variant={difficultyBadgeVariant[guide.difficulty]} size="sm">
              {guide.difficulty}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-text-primary leading-snug group-hover:text-accent transition-colors">
            {guide.title}
          </h3>

          {/* Excerpt */}
          <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
            {guide.excerpt}
          </p>

          {/* Related Tools / Games tags */}
          {(guide.gameIds?.length || guide.toolIds?.length) ? (
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-2xs font-mono text-text-muted">
              {guide.toolIds?.map((toolId) => (
                <span key={toolId} className="bg-bg-elevated px-1.5 py-0.5 rounded border border-border-subtle text-accent">
                  Tool: {toolId}
                </span>
              ))}
              {guide.gameIds?.map((gameId) => (
                <span key={gameId} className="bg-bg-elevated px-1.5 py-0.5 rounded border border-border-subtle text-text-secondary">
                  {gameId.replace(/-/g, " ")}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Bottom Metadata row */}
        <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2 text-xs font-mono text-text-muted">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Calendar size={12} aria-hidden="true" />
              {dateFormatted}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} aria-hidden="true" />
              {guide.readingTimeMinutes} min
            </span>
          </div>

          <span className="text-2xs font-semibold text-accent flex items-center gap-1">
            <span>Read</span>
            <ArrowRight size={11} aria-hidden="true" />
          </span>
        </div>
      </Link>
    </Card>
  );
}
