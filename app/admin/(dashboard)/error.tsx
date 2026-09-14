"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isAuthError =
    error?.name === "AuthorizationError" ||
    error?.message?.toLowerCase().includes("permission") ||
    error?.message?.toLowerCase().includes("forbidden") ||
    error?.message?.toLowerCase().includes("role");

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0E131F] border border-rose-500/20 rounded-2xl p-6 sm:p-8 text-center shadow-2xl shadow-black/50">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <h1 className="text-xl font-bold text-white mb-2">
          {isAuthError ? "Access Denied" : "Something went wrong"}
        </h1>

        <p className="text-xs text-text-secondary mb-6 leading-relaxed">
          {isAuthError
            ? "You don't have permission to access this area."
            : error.message || "An unexpected error occurred during administrative operation."}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/admin"
            className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-primary text-black font-bold text-xs font-mono inline-flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Dashboard
          </Link>

          {!isAuthError && (
            <button
              type="button"
              onClick={() => reset()}
              className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs hover:bg-white/10 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
