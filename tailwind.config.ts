import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background scale
        bg: {
          base: "var(--bg-base, #0A0C10)",
          surface: "var(--bg-surface, #11141A)",
          elevated: "var(--bg-elevated, #171B22)",
          overlay: "var(--bg-overlay, #1E232B)",
        },
        // Border scale
        border: {
          subtle: "var(--border-subtle, #1A1F26)",
          DEFAULT: "var(--border-default, #242B35)",
          strong: "var(--border-strong, #343E4C)",
          accent: "var(--border-accent, rgba(0, 229, 160, 0.4))",
        },
        // Primary accent: terminal emerald-teal (performance + engineering)
        accent: {
          DEFAULT: "var(--accent, #00E5A0)",
          dim: "var(--accent-dim, #00B87F)",
          muted: "var(--accent-muted, rgba(0, 229, 160, 0.12))",
          glow: "var(--accent-glow, rgba(0, 229, 160, 0.22))",
        },
        // `primary` is an alias for `accent` so that bg-primary, from-primary,
        // shadow-primary, border-primary etc. all work without re-theming.
        primary: {
          DEFAULT: "var(--accent, #00E5A0)",
          hover:   "var(--accent-dim, #00B87F)",
        },
        // Text scale
        text: {
          primary: "var(--text-primary, #F0F3F6)",
          secondary: "var(--text-secondary, #8B949E)",
          muted: "var(--text-muted, #525C68)",
          inverse: "var(--text-inverse, #0A0C10)",
        },
        // Functional / Telemetry colors
        status: {
          success: "var(--status-success, #00E5A0)",
          warning: "var(--status-warning, #F59E0B)",
          error: "var(--status-error, #EF4444)",
          info: "var(--status-info, #3B82F6)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }], // 11px
        "xs": ["0.75rem", { lineHeight: "1.125rem" }], // 12px
        "sm": ["0.8125rem", { lineHeight: "1.25rem" }], // 13px
        "base": ["0.9375rem", { lineHeight: "1.5rem" }], // 15px
        "lg": ["1.125rem", { lineHeight: "1.75rem" }], // 18px
        "xl": ["1.25rem", { lineHeight: "1.75rem" }], // 20px
        "2xl": ["1.5rem", { lineHeight: "2rem" }], // 24px
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }], // 30px
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }], // 36px
        "5xl": ["3rem", { lineHeight: "1.1" }], // 48px
      },
      spacing: {
        4.5: "1.125rem",
        18: "4.5rem",
        22: "5.5rem",
        128: "32rem",
      },
      screens: {
        xs: "375px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1440px",
      },
      borderRadius: {
        xs: "2px",
        sm: "4px",
        DEFAULT: "4px",
        md: "6px",
        lg: "8px",
        xl: "12px",
      },
      boxShadow: {
        none: "none",
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.4)",
        DEFAULT: "0 4px 12px -2px rgba(0, 0, 0, 0.5)",
        md: "0 4px 12px -2px rgba(0, 0, 0, 0.5)",
        lg: "0 12px 28px -4px rgba(0, 0, 0, 0.65)",
        glow: "0 0 16px -2px rgba(0, 229, 160, 0.15)",
      },
      transitionDuration: {
        fast: "150ms",
        DEFAULT: "200ms",
        normal: "250ms",
        slow: "400ms",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.16, 1, 0.3, 1)",
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      animation: {
        "fade-in": "fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-accent": "pulseAccent 2.4s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseAccent: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
