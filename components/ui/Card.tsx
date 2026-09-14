import * as React from "react";
import { cn } from "@/lib/cn";

export interface CardProps {
  className?: string;
  children: React.ReactNode;
  /** Makes the card interactive (subtle hover & focus rings) */
  interactive?: boolean;
  /** Visual surface variant */
  variant?: "surface" | "elevated" | "outlined" | "hud";
  /** Render as a different semantic element */
  as?: "div" | "article" | "section" | "li";
}

const variantStyles = {
  surface: "bg-bg-surface border border-border-default",
  elevated: "bg-bg-elevated border border-border-default shadow-sm",
  outlined: "bg-transparent border border-border-default",
  hud: "hud-frame",
};

export function Card({
  className,
  children,
  interactive = false,
  variant = "surface",
  as: Tag = "div",
}: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-md relative",
        variantStyles[variant],
        "transition-colors duration-150 ease-out",
        interactive && [
          "cursor-pointer",
          "hover:border-border-strong hover:bg-bg-elevated/70",
          "focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/40",
        ],
        className
      )}
    >
      {variant === "hud" && (
        <>
          <span className="hud-reticle-tl" aria-hidden="true" />
          <span className="hud-reticle-tr" aria-hidden="true" />
          <span className="hud-reticle-bl" aria-hidden="true" />
          <span className="hud-reticle-br" aria-hidden="true" />
        </>
      )}
      {children}
    </Tag>
  );
}

export interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export function CardHeader({ className, children }: CardHeaderProps) {
  return (
    <div className={cn("px-4 py-3.5 border-b border-border-subtle flex items-center justify-between gap-3", className)}>
      {children}
    </div>
  );
}

export interface CardBodyProps {
  className?: string;
  children: React.ReactNode;
}

export function CardBody({ className, children }: CardBodyProps) {
  return (
    <div className={cn("p-4", className)}>
      {children}
    </div>
  );
}

export interface CardFooterProps {
  className?: string;
  children: React.ReactNode;
}

export function CardFooter({ className, children }: CardFooterProps) {
  return (
    <div className={cn("px-4 py-3 border-t border-border-subtle flex items-center justify-between gap-3", className)}>
      {children}
    </div>
  );
}
