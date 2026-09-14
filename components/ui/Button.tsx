import * as React from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "tertiary" | "danger" | "destructive" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  primary:
    "bg-accent text-bg-base font-semibold hover:bg-accent-dim active:bg-accent-dim shadow-sm focus-visible:ring-accent",
  secondary:
    "bg-bg-elevated border border-border-default text-text-primary hover:border-border-strong hover:bg-bg-overlay active:bg-bg-surface focus-visible:ring-border-strong",
  ghost:
    "bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-elevated active:bg-bg-surface focus-visible:ring-border-default",
  tertiary:
    "bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-elevated active:bg-bg-surface focus-visible:ring-border-default",
  outline:
    "bg-transparent border border-border-default text-text-primary hover:border-accent/40 hover:bg-accent-subtle active:bg-bg-surface focus-visible:ring-accent",
  danger:
    "bg-status-error/10 border border-status-error/30 text-status-error hover:bg-status-error/20 active:bg-status-error/30 focus-visible:ring-status-error/50",
  destructive:
    "bg-status-error/10 border border-status-error/30 text-status-error hover:bg-status-error/20 active:bg-status-error/30 focus-visible:ring-status-error/50",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded",
  md: "h-10 px-4 text-sm gap-2 rounded",
  lg: "h-12 px-5 text-base gap-2.5 rounded-md",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  const normalizedVariant = variantStyles[variant] || variantStyles.primary;
  return cn(
    "inline-flex items-center justify-center font-medium",
    "transition-all duration-150 ease-out",
    "active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
    "disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none",
    normalizedVariant,
    sizeStyles[size],
    className
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    isLoading = false,
    leftIcon,
    rightIcon,
    className,
    children,
    disabled,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || isLoading}
      aria-busy={isLoading ? "true" : undefined}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 text-current flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
});
