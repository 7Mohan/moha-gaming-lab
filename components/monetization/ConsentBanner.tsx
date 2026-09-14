"use client";

import * as React from "react";
import Link from "next/link";
import { getStoredConsent, setStoredConsent, subscribeToConsentChanges } from "@/lib/monetization/consent";
import type { ConsentStatus } from "@/lib/monetization/types";
import { ShieldCheck, Cookie } from "lucide-react";

export function ConsentBanner() {
  const [consent, setConsent] = React.useState<ConsentStatus>("accepted"); // default to accepted to avoid flash during SSR
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    setConsent(getStoredConsent());
    return subscribeToConsentChanges((newStatus) => {
      setConsent(newStatus);
    });
  }, []);

  if (!isClient || consent !== "unknown") {
    return null;
  }

  const handleAcceptAll = () => {
    setStoredConsent("accepted");
  };

  const handleEssentialOnly = () => {
    setStoredConsent("rejected");
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Privacy & Cookie Preferences"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-4 rounded-2xl bg-bg-surface/95 backdrop-blur-md border border-border-default shadow-2xl shadow-black/40 text-xs flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start gap-2.5">
        <div className="p-2 rounded-xl bg-accent/10 text-accent shrink-0 mt-0.5">
          <Cookie size={16} aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-text-primary">
            <span>Privacy & Cookie Preferences</span>
          </div>
          <p className="text-text-secondary leading-relaxed text-[11px]">
            We use essential cookies to maintain secure sessions. With your consent, we also load non-invasive contextual telemetry to support our independent benchmarking.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border-subtle">
        <Link
          href="/privacy"
          className="text-[11px] font-mono text-accent hover:underline flex items-center gap-1"
        >
          <ShieldCheck size={12} />
          <span>Privacy Policy</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleEssentialOnly}
            className="px-3 py-1.5 rounded-lg bg-bg-elevated hover:bg-bg-overlay text-text-secondary hover:text-white font-mono text-[11px] border border-border-subtle transition-all cursor-pointer"
          >
            Essential Only
          </button>
          <button
            type="button"
            onClick={handleAcceptAll}
            className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/90 text-black font-mono text-[11px] font-bold shadow-md shadow-accent/20 transition-all cursor-pointer"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
