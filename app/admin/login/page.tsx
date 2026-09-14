"use client";

import * as React from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function AdminLoginPage() {
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

      {/* Background glow ambient effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <React.Suspense
        fallback={
          <div className="w-full max-w-md flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        }
      >
        <LoginForm mode="admin" defaultRedirect="/admin" />
      </React.Suspense>
    </div>
  );
}

