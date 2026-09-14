"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, MessageSquare } from "lucide-react";
import { generateRequestId, logStructured } from "@/lib/observability/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [requestId, setRequestId] = React.useState<string>("");

  React.useEffect(() => {
    const id = error.digest ? `req_${error.digest}` : generateRequestId();
    setRequestId(id);

    // Structured logging for production diagnostics
    logStructured({
      level: "error",
      event: "UNCAUGHT_CLIENT_ERROR",
      requestId: id,
      error,
      metadata: {
        digest: error.digest,
        name: error.name,
      },
    });
  }, [error]);

  // Sanitize message: never display internal DB query errors or secrets to end users
  const isSafeMessage =
    error.message &&
    !error.message.includes("prisma") &&
    !error.message.includes("SELECT") &&
    !error.message.includes("INSERT") &&
    !error.message.includes("database") &&
    !error.message.includes("secret") &&
    !error.message.includes("SUPABASE") &&
    error.message.length < 200;

  const displayMessage = isSafeMessage
    ? error.message
    : "An unexpected system anomaly occurred while rendering this view. Diagnostic details have been logged.";

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-[#0A0E17] border border-status-warning/25 rounded-2xl p-6 sm:p-8 text-center shadow-2xl shadow-black/80 space-y-6">
        {/* Warning Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-status-warning/10 border border-status-warning/30 text-status-warning flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            System Telemetry Anomaly
          </h1>
          <p className="text-xs text-text-secondary leading-relaxed max-w-sm mx-auto">
            {displayMessage}
          </p>
        </div>

        {/* Request Correlation ID */}
        {requestId && (
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 inline-flex items-center gap-2">
            <span className="text-[11px] font-mono text-text-tertiary">Incident ID:</span>
            <code className="text-xs font-mono font-bold text-accent select-all">
              {requestId}
            </code>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-accent text-bg-base font-bold text-xs font-mono inline-flex items-center justify-center gap-2 hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            Try Again
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs hover:bg-white/10 transition-colors inline-flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5" aria-hidden="true" />
            Return to Home
          </Link>
        </div>

        {/* Help Link */}
        <div className="pt-2 border-t border-white/5">
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 text-2xs text-text-muted hover:text-text-secondary transition-colors"
          >
            <MessageSquare className="w-3 h-3" aria-hidden="true" />
            Report Issue with Incident ID
          </Link>
        </div>
      </div>
    </div>
  );
}
