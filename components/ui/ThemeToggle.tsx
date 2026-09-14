"use client";

import * as React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/features/theme/ThemeProvider";
import { cn } from "@/lib/cn";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function ThemeToggle({
  className = "",
  showLabel = false,
  size = "md",
}: ThemeToggleProps) {
  const { theme, toggleTheme, isMounted } = useTheme();

  const isLight = isMounted ? theme === "light" : false;
  const title = isLight ? "Switch to Dark Mode" : "Switch to Light Mode";

  if (showLabel) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle Dark / Light Mode"
        title={title}
        className={cn(
          "flex items-center justify-between w-full px-4 py-3 rounded-md text-sm font-medium",
          "text-text-secondary hover:text-text-primary hover:bg-bg-elevated border border-border-subtle",
          "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 flex items-center justify-center text-accent">
            {isLight ? <Moon size={16} /> : <Sun size={16} />}
          </div>
          <span>
            Theme: <strong className="text-text-primary capitalize">{isMounted ? theme : "System"}</strong>
          </span>
        </div>
        <span className="text-2xs font-mono text-accent uppercase tracking-widest px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
          {isLight ? "Set Dark" : "Set Light"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={title}
      title={title}
      suppressHydrationWarning
      className={cn(
        "relative flex items-center justify-center rounded-md transition-all duration-200 cursor-pointer",
        "text-text-secondary hover:text-text-primary hover:bg-bg-elevated",
        "border border-transparent hover:border-border-default",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
        size === "sm" ? "h-7 w-7 px-1.5" : "h-8 w-8 px-2",
        className
      )}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {/* Sun Icon (default in dark mode, hidden in light mode via CSS) */}
        <Sun
          size={16}
          className={cn(
            "transition-all duration-300 absolute transform",
            isMounted
              ? isLight
                ? "rotate-90 scale-0 opacity-0 pointer-events-none"
                : "rotate-0 scale-100 opacity-100 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]"
              : "rotate-0 scale-100 opacity-100 text-amber-400"
          )}
          aria-hidden="true"
        />

        {/* Moon Icon (visible in light mode, hidden in dark mode) */}
        <Moon
          size={16}
          className={cn(
            "transition-all duration-300 absolute transform",
            isMounted
              ? isLight
                ? "rotate-0 scale-100 opacity-100 text-accent drop-shadow-[0_0_8px_rgba(0,179,122,0.3)]"
                : "-rotate-90 scale-0 opacity-0 pointer-events-none"
              : "scale-0 opacity-0"
          )}
          aria-hidden="true"
        />
      </div>
      <span className="sr-only">{title}</span>
    </button>
  );
}
