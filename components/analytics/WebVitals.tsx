"use client";

/**
 * components/analytics/WebVitals.tsx
 * ────────────────────────────────────────────────────────────────
 * Real User Measurement (RUM) Core Web Vitals monitor.
 * Emits CLS, FCP, FID, INP, LCP, TTFB to the analytics pipeline.
 */

import { useReportWebVitals } from "next/web-vitals";
import { trackWebVitalsMetric } from "@/lib/analytics/tracker";
import type { WebVitalsMetric } from "@/lib/analytics/types";

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Determine rating threshold if not already provided by Next.js
    let rating: "good" | "needs-improvement" | "poor" = "good";

    switch (metric.name) {
      case "CLS":
        rating = metric.value <= 0.1 ? "good" : metric.value <= 0.25 ? "needs-improvement" : "poor";
        break;
      case "LCP":
        rating = metric.value <= 2500 ? "good" : metric.value <= 4000 ? "needs-improvement" : "poor";
        break;
      case "INP":
        rating = metric.value <= 200 ? "good" : metric.value <= 500 ? "needs-improvement" : "poor";
        break;
      case "FCP":
        rating = metric.value <= 1800 ? "good" : metric.value <= 3000 ? "needs-improvement" : "poor";
        break;
      case "TTFB":
        rating = metric.value <= 800 ? "good" : metric.value <= 1800 ? "needs-improvement" : "poor";
        break;
      default:
        rating = "good";
    }

    const payload: WebVitalsMetric = {
      id: metric.id,
      name: metric.name as WebVitalsMetric["name"],
      value: Math.round(metric.value * 100) / 100,
      rating,
      delta: metric.delta ? Math.round(metric.delta * 100) / 100 : undefined,
      navigationType: (metric as unknown as { navigationType?: string }).navigationType,
    };

    trackWebVitalsMetric(payload);
  });

  return null;
}
