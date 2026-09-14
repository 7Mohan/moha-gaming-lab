"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  badge?: string | number;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = "md",
  className,
  ariaLabel = "Filter selection",
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center bg-bg-surface border border-border-default rounded p-0.5 select-none",
        className
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-150 ease-out rounded-xs",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-xs",
              isSelected
                ? "bg-bg-elevated text-text-primary shadow-sm border border-border-strong font-semibold"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated/40 border border-transparent"
            )}
          >
            <span>{option.label}</span>
            {option.badge !== undefined && (
              <span
                className={cn(
                  "font-mono text-[10px] px-1.5 py-0.2 rounded-xs",
                  isSelected
                    ? "bg-accent/15 text-accent border border-accent/20"
                    : "bg-bg-surface text-text-muted border border-border-subtle"
                )}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
