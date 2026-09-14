"use client";

import * as React from "react";

export type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isMounted: boolean;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "moha_theme";
const COOKIE_KEY = "moha_theme";

/**
 * Script injected into <head> to prevent Flash of Unstyled Content (FOUC)
 * Runs synchronously before any DOM painting.
 */
export function ThemeScript() {
  const scriptContent = `
(function() {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var theme = stored ? stored : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.style.colorScheme = 'dark';
    }
  } catch (e) {}
})();
`;
  return (
    <script
      dangerouslySetInnerHTML={{ __html: scriptContent }}
      suppressHydrationWarning
    />
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("dark");
  const [isMounted, setIsMounted] = React.useState(false);

  // Sync initial state from HTML class on mount
  React.useEffect(() => {
    setIsMounted(true);
    const isLight = document.documentElement.classList.contains("light");
    setThemeState(isLight ? "light" : "dark");

    // Listen to system theme changes if user has not set an explicit override
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        applyTheme(e.matches ? "light" : "dark");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    const root = document.documentElement;

    if (newTheme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
      root.style.colorScheme = "dark";
    }

    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
      // Also store in cookie for server-side persistence
      document.cookie = `${COOKIE_KEY}=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {
      console.warn("Theme storage error:", e);
    }
  };

  const toggleTheme = React.useCallback(() => {
    applyTheme(theme === "light" ? "dark" : "light");
  }, [theme]);

  const setTheme = React.useCallback((t: Theme) => {
    applyTheme(t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isMounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
