import * as React from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    helperText,
    error,
    leftIcon,
    rightIcon,
    className,
    id: customId,
    disabled,
    required,
    ...props
  },
  ref
) {
  const generatedId = React.useId();
  const inputId = customId || generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1.5 w-full text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-mono font-medium text-text-secondary tracking-wider uppercase flex items-center gap-1"
        >
          <span>{label}</span>
          {required && <span className="text-status-error">*</span>}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-text-muted">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? errorId : helperText ? helperId : undefined
          }
          className={cn(
            "w-full h-10 bg-bg-elevated border rounded text-sm text-text-primary placeholder:text-text-muted",
            "transition-colors duration-150 ease-out",
            "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-bg-base",
            leftIcon ? "pl-9" : "pl-3.5",
            rightIcon ? "pr-9" : "pr-3.5",
            error
              ? "border-status-error/60 focus:border-status-error focus:ring-status-error/40 text-status-error"
              : "border-border-default hover:border-border-strong focus:border-accent/40 focus:ring-accent/40",
            disabled && "opacity-45 cursor-not-allowed bg-bg-surface",
            className
          )}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 flex items-center text-text-muted">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p id={errorId} className="text-xs text-status-error font-mono flex items-center gap-1">
          <span aria-hidden="true">[!]</span>
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-text-muted font-mono">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});
