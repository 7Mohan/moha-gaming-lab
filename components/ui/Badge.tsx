import * as React from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant =
  | "default"
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-bg-elevated border border-border-default text-text-secondary",
  accent: "bg-accent/10 border border-accent/25 text-accent",
  success: "bg-status-success/10 border border-status-success/25 text-status-success",
  warning: "bg-status-warning/10 border border-status-warning/30 text-status-warning",
  error: "bg-status-error/10 border border-status-error/30 text-status-error",
  info: "bg-status-info/10 border border-status-info/25 text-status-info",
  outline: "bg-transparent border border-border-strong text-text-secondary hover:border-text-muted",
};

const sizeStyles = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-2 py-0.5 text-2xs",
};

export function Badge({
  variant = "default",
  size = "md",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-xs font-mono uppercase tracking-wider font-semibold select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
