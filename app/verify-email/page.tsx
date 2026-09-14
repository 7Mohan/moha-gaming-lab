"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const confirmed = searchParams.get("confirmed") === "true";
  const email = searchParams.get("email");

  return (
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
              Identity & Access
            </span>
          </div>
        </Link>
        <h1 className="text-2xl font-black tracking-tight text-text-primary">
          {confirmed ? "Email Verified" : "Verify Your Email"}
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {confirmed
            ? "Your email has been successfully confirmed."
            : "Please verify your email address to complete registration."}
        </p>
      </div>

      {/* Card */}
      <div className="bg-bg-surface border border-border-default rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/10 dark:shadow-black/80 text-center space-y-4">
        {confirmed ? (
          <>
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Your account is ready. You may now sign in using your credentials.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-block w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-600/30"
              >
                Sign In Now
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-accent/20 text-accent mx-auto flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              A verification link was dispatched to{" "}
              <strong className="text-text-primary font-mono">{email || "your email address"}</strong>.
              Click the link in the message to activate your account.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-block w-full py-2.5 px-4 rounded-xl bg-accent/20 border border-accent/40 text-accent font-bold text-xs font-mono hover:bg-accent/30 transition-colors"
              >
                ← Return to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
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

      <React.Suspense
        fallback={
          <div className="w-full max-w-md flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        }
      >
        <VerifyEmailContent />
      </React.Suspense>
    </div>
  );
}
