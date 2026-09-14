"use client";

import * as React from "react";
import Link from "next/link";
import { useScrollY } from "@/hooks/useScrollY";
import { Navigation } from "./Navigation";
import { MobileNav, MobileMenuButton } from "./MobileNav";
import { cn } from "@/lib/cn";
import { useSearch } from "@/features/search/SearchProvider";
import { HeaderAuthButton } from "./HeaderAuthButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Header() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const scrollY = useScrollY();
  const isScrolled = scrollY > 8;
  const { open: openSearch } = useSearch();

  return (
    <>
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>

      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-30 h-[3.75rem]",
          "flex items-center",
          "transition-all duration-200",
          isScrolled
            ? "bg-bg-base/95 backdrop-blur-md border-b border-border-subtle shadow-lg shadow-black/20"
            : "bg-transparent border-b border-transparent"
        )}
      >
        <div className="container-content flex items-center justify-between w-full">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-md"
            aria-label="Moha Gaming Lab — Home"
          >
            {/* Logo mark */}
            <div
              className="w-7 h-7 rounded flex items-center justify-center bg-accent/10 border border-accent/20 group-hover:bg-accent/20 transition-colors"
              aria-hidden="true"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M2 7L5.5 3.5L7 5L9 2.5L12 7L9 11.5L7 9L5.5 10.5L2 7Z"
                  stroke="#00E5A0"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Wordmark */}
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold text-text-primary tracking-tight">
                Moha Gaming Lab
              </span>
              <span className="text-2xs font-mono text-text-muted uppercase tracking-widest">
                Android Performance
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <Navigation className="hidden lg:flex" />

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search button — opens global modal on click */}
            <button
              type="button"
              onClick={openSearch}
              aria-label="Search (Ctrl+K)"
              title="Search (Ctrl+K)"
              className="hidden sm:flex items-center gap-2 px-2.5 h-8 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 border border-transparent hover:border-border-default"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <circle cx="7" cy="7" r="4.5" />
                <path d="M10.5 10.5L13.5 13.5" strokeLinecap="round" />
              </svg>
              <span className="text-xs font-mono text-text-muted hidden xl:block">
                ⌘K
              </span>
            </button>

            {/* Dark / Light Mode Toggle Button */}
            <ThemeToggle />

            {/* User Auth Status / Sign In button */}
            <HeaderAuthButton />

            <MobileMenuButton
              isOpen={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            />
          </div>
        </div>
      </header>

      <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
