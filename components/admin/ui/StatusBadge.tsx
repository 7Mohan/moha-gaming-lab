import * as React from "react";

export type ContentStatus =
  | "PUBLISHED"
  | "DRAFT"
  | "REVIEW"
  | "ARCHIVED"
  | "VERIFIED"
  | "UNVERIFIED"
  | "FLAGGED"
  | string;

interface StatusBadgeProps {
  status: ContentStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const norm = (status || "").toUpperCase();

  const configs: Record<
    string,
    { bg: string; text: string; border: string; icon: React.ReactNode; label: string }
  > = {
    PUBLISHED: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
      label: "Published",
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    DRAFT: {
      bg: "bg-slate-500/10",
      text: "text-slate-300",
      border: "border-slate-500/30",
      label: "Draft",
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    REVIEW: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/30",
      label: "In Review",
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    ARCHIVED: {
      bg: "bg-rose-500/10",
      text: "text-rose-400",
      border: "border-rose-500/30",
      label: "Archived",
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
    },
    VERIFIED: {
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
      border: "border-cyan-500/30",
      label: "Verified",
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    UNVERIFIED: {
      bg: "bg-zinc-500/10",
      text: "text-zinc-400",
      border: "border-zinc-500/30",
      label: "Unverified",
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
  };

  const config = configs[norm] || {
    bg: "bg-white/5",
    text: "text-text-secondary",
    border: "border-white/10",
    label: norm,
    icon: <span className="w-1.5 h-1.5 rounded-full bg-current" />,
  };

  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-mono font-medium border ${config.bg} ${config.text} ${config.border} ${pad}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
}
