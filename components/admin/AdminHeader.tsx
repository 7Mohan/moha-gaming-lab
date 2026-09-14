"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminSession } from "@/lib/auth/types";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface AdminHeaderProps {
  session: AdminSession;
  collapsed: boolean;
  onOpenMobile: () => void;
}

export function AdminHeader({ session, collapsed, onOpenMobile }: AdminHeaderProps) {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .slice(1); // omit 'admin'

  const breadcrumbs = segments.map((seg, i) => {
    const href = "/admin/" + segments.slice(0, i + 1).join("/");
    const label =
      seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
    return { label, href, isLast: i === segments.length - 1 };
  });

  return (
    <header
      className={`fixed top-0 right-0 z-20 h-16 bg-[#0E131F]/90 backdrop-blur-md border-b border-white/10 transition-all duration-200 left-0 ${
        collapsed ? "md:left-16" : "md:left-64"
      }`}
    >
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger + Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobile}
            className="md:hidden p-2 -ml-2 rounded-lg text-text-tertiary hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Open sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Breadcrumb Trail */}
          <nav className="flex items-center gap-1.5 text-xs font-mono text-text-tertiary truncate">
            <Link
              href="/admin"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <span>Control Hub</span>
            </Link>
            {breadcrumbs.map((b) => (
              <React.Fragment key={b.href}>
                <span className="text-white/20">/</span>
                {b.isLast ? (
                  <span className="text-white font-medium truncate">{b.label}</span>
                ) : (
                  <Link href={b.href} className="hover:text-white transition-colors truncate">
                    {b.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Right: Quick actions, Status, User */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Quick Create Link */}
          <div className="hidden sm:flex items-center gap-2">
            <Link
              href="/admin/games/new"
              className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-text-secondary hover:text-white transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Game</span>
            </Link>
            <Link
              href="/admin/apps/new"
              className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-text-secondary hover:text-white transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>App</span>
            </Link>
            <Link
              href="/admin/guides/new"
              className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-text-secondary hover:text-white transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Guide</span>
            </Link>
          </div>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Role badge */}
          <div className="flex items-center gap-2">
            <span className="hidden lg:inline text-xs text-text-tertiary">Signed in as</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              {session.name}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
