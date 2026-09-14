"use client";

import { useEffect, useState } from "react";

/**
 * Returns the current window scrollY value, updated on scroll.
 * Used for scroll-aware header styles.
 */
export function useScrollY(): number {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return scrollY;
}
