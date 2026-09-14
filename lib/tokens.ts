/**
 * Moha Gaming Lab — Design System Tokens
 * Source of truth for design tokens used across UI components, WebGL rendering, and calculators.
 */

export const TOKENS = {
  colors: {
    bg: {
      base: "#0A0C10",
      surface: "#11141A",
      elevated: "#171B22",
      overlay: "#1E232B",
    },
    border: {
      subtle: "#1A1F26",
      default: "#242B35",
      strong: "#343E4C",
      accent: "rgba(0, 229, 160, 0.4)",
    },
    accent: {
      DEFAULT: "#00E5A0",
      dim: "#00B87F",
      muted: "rgba(0, 229, 160, 0.12)",
      glow: "rgba(0, 229, 160, 0.22)",
      subtle: "rgba(0, 229, 160, 0.05)",
    },
    text: {
      primary: "#F0F3F6",
      secondary: "#8B949E",
      muted: "#525C68",
      inverse: "#0A0C10",
      accent: "#00E5A0",
    },
    status: {
      success: "#00E5A0",
      warning: "#F59E0B",
      error: "#EF4444",
      info: "#3B82F6",
    },
  },
  typography: {
    fontFamily: {
      sans: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
      mono: 'var(--font-mono, "Geist Mono", SFMono-Regular, Menlo, Monaco, Consolas, monospace)',
    },
    scale: {
      display: { size: "clamp(2.25rem, 5vw, 3.5rem)", lineHeight: "1.1", tracking: "-0.03em", weight: "700" },
      h1: { size: "2.25rem", lineHeight: "1.2", tracking: "-0.025em", weight: "700" },
      h2: { size: "1.75rem", lineHeight: "1.25", tracking: "-0.02em", weight: "600" },
      h3: { size: "1.25rem", lineHeight: "1.3", tracking: "-0.015em", weight: "600" },
      h4: { size: "1rem", lineHeight: "1.4", tracking: "-0.01em", weight: "600" },
      bodyLarge: { size: "1.125rem", lineHeight: "1.6", tracking: "normal", weight: "400" },
      body: { size: "0.9375rem", lineHeight: "1.6", tracking: "normal", weight: "400" },
      bodySmall: { size: "0.8125rem", lineHeight: "1.5", tracking: "normal", weight: "400" },
      caption: { size: "0.75rem", lineHeight: "1.4", tracking: "0.04em", weight: "500" },
      mono: { size: "0.8125rem", lineHeight: "1.4", tracking: "0.05em", weight: "500" },
    },
  },
  spacing: {
    1: "0.25rem", // 4px
    2: "0.5rem",  // 8px
    3: "0.75rem", // 12px
    4: "1rem",    // 16px
    5: "1.25rem", // 20px
    6: "1.5rem",  // 24px
    8: "2rem",    // 32px
    10: "2.5rem", // 40px
    12: "3rem",   // 48px
    16: "4rem",   // 64px
    20: "5rem",   // 80px
  },
  layout: {
    headerHeight: "3.75rem",
    maxContentWidth: "1280px",
    readingWidth: "768px",
    gutters: {
      mobile: "1rem",
      tablet: "1.5rem",
      desktop: "2.5rem",
    },
  },
  radius: {
    none: "0px",
    xs: "2px",
    sm: "4px",
    md: "6px",
    lg: "8px",
    xl: "12px",
    full: "9999px",
  },
  shadows: {
    none: "none",
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.4)",
    md: "0 4px 12px -2px rgba(0, 0, 0, 0.5)",
    lg: "0 12px 28px -4px rgba(0, 0, 0, 0.65)",
    accentGlow: "0 0 16px -2px rgba(0, 229, 160, 0.15)",
  },
  motion: {
    fast: "150ms",
    normal: "250ms",
    slow: "400ms",
    ease: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
  telemetry: {
    fpsThresholds: {
      critical: 45,
      moderate: 60,
      good: 90,
      stable: 120,
    },
    latencyThresholds: {
      stable: 20,
      good: 50,
      moderate: 80,
      critical: 120,
    },
    thermalThresholds: {
      normal: 38,
      warm: 42,
      critical: 46,
    },
  },
} as const;

export type DesignTokens = typeof TOKENS;
