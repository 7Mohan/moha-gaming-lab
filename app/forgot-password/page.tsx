"use client";

import * as React from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await res.json().catch(() => ({ success: false }));

      if (!res.ok || !data.success) {
        setError(
          data.error ||
            "Failed to send the reset email. Please try again or contact support."
        );
        setLoading(false);
        return;
      }

      // Success: show confirmation regardless of whether the email exists
      // (security: don't reveal if an account exists for this email)
      setSubmitted(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to communicate with the server. Please check your connection."
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base text-text-primary p-4 sm:p-6 relative overflow-hidden transition-colors duration-200">
      {/* Top action bar: Home & Theme Toggle */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <Link
          href="/"
          className="text-xs font-mono text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-md hover:bg-bg-elevated border border-transparent hover:border-border-default transition-colors"
        >
          ← Home
        </Link>
        <ThemeToggle />
      </div>

      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-accent/30 to-accent/10 border border-accent/40 flex items-center justify-center font-mono font-bold text-accent text-xl tracking-wider shadow-lg shadow-accent/20 group-hover:scale-105 transition-transform">
              M
            </div>
            <div className="text-left">
              <span className="block font-black tracking-wider text-xl text-text-primary">
                MOHA<span className="text-accent">.LAB</span>
              </span>
              <span className="block text-xs font-mono uppercase tracking-widest text-text-tertiary">
                Security & Access Portal
              </span>
            </div>
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-text-primary">
            Reset Your Password
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Enter your registered email address to receive secure recovery instructions.
          </p>
        </div>

        {/* Card */}
        <div className="bg-bg-surface border border-border-default rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/10 dark:shadow-black/80">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-2.5">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {submitted ? (
            <div className="space-y-4 text-center">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold mb-1">Check Your Inbox</p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  If an account matches this email, password recovery instructions have been sent. Please check your spam folder if it does not arrive within a few minutes.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-block w-full py-2.5 px-4 rounded-xl bg-accent/20 border border-accent/40 text-accent font-bold text-xs font-mono hover:bg-accent/30 transition-colors"
                >
                  ← Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5"
                >
                  Account Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-elevated border border-border-default text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed border border-emerald-400/20"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Sending recovery link...</span>
                  </>
                ) : (
                  <span>Send Recovery Instructions</span>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="text-xs font-mono text-text-tertiary hover:text-text-primary transition-colors inline-flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
