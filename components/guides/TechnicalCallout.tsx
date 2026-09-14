import * as React from "react";
import type { CalloutType } from "@/types/guide";
import { AlertTriangle, Info, Lightbulb, AlertCircle } from "lucide-react";

interface TechnicalCalloutProps {
  type: CalloutType;
  title?: string;
  content: string;
}

const calloutConfig: Record<
  CalloutType,
  {
    icon: React.ElementType;
    borderColor: string;
    bgColor: string;
    iconColor: string;
    defaultTitle: string;
  }
> = {
  important: {
    icon: AlertCircle,
    borderColor: "border-accent/40",
    bgColor: "bg-accent/5",
    iconColor: "text-accent",
    defaultTitle: "Important Notice",
  },
  warning: {
    icon: AlertTriangle,
    borderColor: "border-status-warning/40",
    bgColor: "bg-status-warning/5",
    iconColor: "text-status-warning",
    defaultTitle: "Technical Warning",
  },
  tip: {
    icon: Lightbulb,
    borderColor: "border-accent/40",
    bgColor: "bg-bg-elevated",
    iconColor: "text-accent",
    defaultTitle: "Optimization Tip",
  },
  note: {
    icon: Info,
    borderColor: "border-border-default",
    bgColor: "bg-bg-surface",
    iconColor: "text-text-muted",
    defaultTitle: "Technical Note",
  },
};

export function TechnicalCallout({ type, title, content }: TechnicalCalloutProps) {
  const config = calloutConfig[type] || calloutConfig.note;
  const Icon = config.icon;
  const displayTitle = title ?? config.defaultTitle;

  return (
    <aside
      className={`my-6 p-4 rounded-md border ${config.borderColor} ${config.bgColor} flex items-start gap-3 text-xs leading-relaxed`}
      aria-label={displayTitle}
    >
      <Icon size={16} className={`${config.iconColor} flex-shrink-0 mt-0.5`} aria-hidden="true" />
      <div className="flex flex-col gap-1 min-w-0">
        <span className="font-mono font-semibold text-text-primary uppercase tracking-wider text-2xs">
          {displayTitle}
        </span>
        <p className="text-text-secondary leading-relaxed">
          {content}
        </p>
      </div>
    </aside>
  );
}
