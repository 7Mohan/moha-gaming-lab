import * as React from "react";
import { AlertCircle, ShieldCheck, Info } from "lucide-react";
import { cn } from "@/lib/cn";

export function LimitationNotice({
  title = "Browser Sandbox Limitation",
  limitations,
  className,
}: {
  title?: string;
  limitations: string[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border border-border-default bg-bg-surface rounded-md p-4 sm:p-5 flex flex-col gap-3",
        className
      )}
    >
      <div className="flex items-center gap-2 text-status-warning">
        <AlertCircle size={16} aria-hidden="true" className="flex-shrink-0" />
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <ul className="flex flex-col gap-2" role="list">
        {limitations.map((limit, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2.5 text-xs text-text-secondary leading-relaxed"
          >
            <span
              className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-status-warning/60 mt-1.5"
              aria-hidden="true"
            />
            <span>{limit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TechnicalNote({
  title = "Engineering Notes",
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border border-border-subtle bg-bg-elevated/60 rounded-md p-4 flex flex-col gap-2",
        className
      )}
    >
      <div className="flex items-center gap-2 text-text-secondary">
        <Info size={14} aria-hidden="true" className="text-accent flex-shrink-0" />
        <span className="text-2xs font-mono font-bold uppercase tracking-wider text-text-primary">
          {title}
        </span>
      </div>
      <div className="text-xs text-text-secondary leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export function PrivacyBadge({
  text = "Local Computation Only — Zero Data Uploaded",
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-xs border border-accent/20 bg-accent/5 text-2xs font-mono font-medium text-accent",
        className
      )}
    >
      <ShieldCheck size={13} aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}
