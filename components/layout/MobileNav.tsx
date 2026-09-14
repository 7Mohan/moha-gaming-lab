"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Menu, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { navItems } from "@/lib/nav";
import { useSearch } from "@/features/search/SearchProvider";
import { getAuthStatusAction, logoutAction } from "@/app/admin/login/actions";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Inline search button rendered inside the mobile nav drawer */
function SearchInMobileNav({ onClose }: { onClose: () => void }) {
  const { open: openSearch } = useSearch();
  return (
    <button
      type="button"
      onClick={() => { onClose(); setTimeout(openSearch, 50); }}
      className="flex items-center gap-3 w-full px-4 py-3 rounded-md text-sm font-medium mb-3 text-text-secondary hover:text-accent hover:bg-accent/5 border border-border-subtle transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
    >
      <Search size={15} aria-hidden="true" />
      <span>Search</span>
      <span className="ml-auto text-xs font-mono text-text-muted">⌘K</span>
    </button>
  );
}


export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const [auth, setAuth] = React.useState<{
    isAuthenticated: boolean;
    isAdmin: boolean;
    name?: string;
    email?: string;
  } | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      getAuthStatusAction()
        .then(async (res) => {
          if (res.isAuthenticated) {
            setAuth(res);
          } else {
            // Check Supabase browser client fallback
            const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            if (url && key) {
              try {
                const { createBrowserClient } = await import("@supabase/ssr");
                const supabase = createBrowserClient(url, key);
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                  const ADMIN_EMAILS = ["4mohabashir@gmail.com"];
                  const userEmail = session.user.email?.toLowerCase() || "";
                  const role = (session.user.app_metadata?.role || session.user.user_metadata?.role || "") as string;
                  const isRoleAdmin = role.toLowerCase() === "admin" || ADMIN_EMAILS.includes(userEmail);
                  setAuth({
                    isAuthenticated: true,
                    isAdmin: isRoleAdmin,
                    name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || userEmail.split("@")[0],
                    email: session.user.email,
                  });
                  return;
                }
              } catch {}
            }
            setAuth({ isAuthenticated: false, isAdmin: false });
          }
        })
        .catch(() => {
          setAuth({ isAuthenticated: false, isAdmin: false });
        });
    }
  }, [isOpen]);

  // Close on route change
  React.useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Trap focus and prevent body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-bg-base/90 backdrop-blur-sm transition-opacity duration-200",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
        className={cn(
          "fixed top-0 right-0 bottom-0 z-50 w-72 bg-bg-surface border-l border-border-default",
          "flex flex-col transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-[3.75rem] border-b border-border-subtle">
          <span className="font-mono text-xs text-text-muted uppercase tracking-widest">
            Menu
          </span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="Mobile navigation">
          {/* Search button */}
          <SearchInMobileNav onClose={onClose} />

          {/* Theme switcher */}
          <div className="mb-3">
            <ThemeToggle showLabel />
          </div>

          {/* Sign In button */}
          {auth?.isAuthenticated ? (
            <div className="flex items-center justify-between p-3 rounded-md mb-3 bg-accent/10 border border-accent/20">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-text-primary">{auth.name || auth.email}</span>
                <span className="text-2xs font-mono text-accent">{auth.isAdmin ? "Admin Console" : "Active Member"}</span>
              </div>
              <div className="flex items-center gap-2">
                {auth.isAdmin && (
                  <Link href="/admin" onClick={onClose} className="text-xs font-medium text-accent hover:underline">
                    Dashboard
                  </Link>
                )}
                <form action={logoutAction}>
                  <button type="submit" className="text-xs text-status-error hover:underline ml-2">
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-md text-sm font-medium mb-3 text-text-primary bg-accent/10 hover:bg-accent/20 border border-accent/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              <svg
                className="w-4 h-4 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>Sign In / Admin</span>
            </Link>
          )}
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 rounded-md text-sm font-medium mb-1",
                  "transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                  isActive
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border-subtle">
          <p className="text-2xs font-mono text-text-muted">
            © {new Date().getFullYear()} Moha Gaming Lab
          </p>
        </div>
      </div>
    </>
  );
}

export function MobileMenuButton({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
      aria-controls="mobile-nav"
      className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 lg:hidden"
    >
      {isOpen ? (
        <X size={20} aria-hidden="true" />
      ) : (
        <Menu size={20} aria-hidden="true" />
      )}
    </button>
  );
}
