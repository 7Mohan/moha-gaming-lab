"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { getAuthStatusAction, logoutAction, syncSupabaseUserAction } from "@/app/admin/login/actions";
import { createBrowserClient } from "@supabase/ssr";

export function HeaderAuthButton() {
  const [auth, setAuth] = React.useState<{
    isAuthenticated: boolean;
    isAdmin: boolean;
    name?: string;
    email?: string;
    role?: string;
    avatarUrl?: string;
  } | null>(null);

  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        // 1. Check server-side session first
        const status = await getAuthStatusAction();
        if (mounted && status.isAuthenticated) {
          setAuth({
            isAuthenticated: true,
            isAdmin: status.isAdmin,
            name: status.name,
            email: status.email,
            role: status.role,
            avatarUrl: status.avatarUrl,
          });
          return;
        }
      } catch {}

      // 2. Fallback: Check Supabase browser client
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (url && key) {
        try {
          const supabase = createBrowserClient(url, key);
          const {
            data: { session },
          } = await supabase.auth.getSession();

          const user = session?.user;

          if (user && mounted) {
            const ADMIN_EMAILS = ["4mohabashir@gmail.com"];
            const userEmail = user.email?.toLowerCase() || "";
            const role = (
              user.app_metadata?.role ||
              user.user_metadata?.role ||
              ""
            ) as string;

            const isRoleAdmin =
              role.toLowerCase() === "admin" ||
              role.toLowerCase() === "editor" ||
              role.toLowerCase() === "author" ||
              ADMIN_EMAILS.includes(userEmail);

            setAuth({
              isAuthenticated: true,
              isAdmin: isRoleAdmin,
              name:
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                userEmail.split("@")[0] ||
                "User",
              email: user.email,
              role: isRoleAdmin ? "ADMIN" : "USER",
              avatarUrl:
                user.user_metadata?.avatar_url || user.user_metadata?.picture,
            });

            // If we have an active browser session but server session is missing, sync it
            if (session.access_token) {
              syncSupabaseUserAction(session.access_token).catch(() => {});
            }
            return;
          }
        } catch {}
      }

      if (mounted) {
        setAuth({ isAuthenticated: false, isAdmin: false });
      }
    }

    checkAuth();

    // Listen for custom auth events
    const handleAuthChanged = () => {
      checkAuth();
    };
    window.addEventListener("moha-auth-changed", handleAuthChanged);

    // Listen for Supabase auth changes in real time
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;
    if (url && key) {
      try {
        const supabase = createBrowserClient(url, key);
        const { data } = supabase.auth.onAuthStateChange(() => {
          checkAuth();
        });
        authListener = data;
      } catch {}
    }

    return () => {
      mounted = false;
      window.removeEventListener("moha-auth-changed", handleAuthChanged);
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    await logoutAction();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      try {
        const supabase = createBrowserClient(url, key);
        await supabase.auth.signOut();
      } catch {}
    }
    setAuth({ isAuthenticated: false, isAdmin: false });
    window.location.href = "/";
  }

  // Loading skeleton — prevents layout shift while auth is resolving
  if (auth === null) {
    return <div className="w-20 h-8 rounded-md bg-white/5 animate-pulse" />;
  }

  if (!auth.isAuthenticated) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-mono font-medium text-text-primary bg-accent/10 hover:bg-accent/20 border border-accent/25 hover:border-accent/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        aria-label="Sign In"
      >
        <svg
          className="w-3.5 h-3.5 text-accent"
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
        <span>Sign In</span>
      </Link>
    );
  }

  const roleLabel = auth.isAdmin
    ? auth.role === "EDITOR"
      ? "EDITOR"
      : auth.role === "AUTHOR"
      ? "AUTHOR"
      : "ADMIN"
    : null;

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 px-2.5 h-8 rounded-md text-xs font-mono font-medium text-text-primary bg-bg-elevated hover:bg-bg-overlay border border-border-default hover:border-accent/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        {auth.avatarUrl ? (
          <Image
            src={auth.avatarUrl}
            alt={auth.name || "User"}
            width={20}
            height={20}
            className="w-5 h-5 rounded-full object-cover border border-accent/30"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-[10px]">
            {(auth.name || auth.email || "U").charAt(0).toUpperCase()}
          </div>
        )}
        <span className="max-w-[110px] truncate hidden sm:inline">
          {auth.name || auth.email}
        </span>
        {roleLabel && (
          <span className="hidden md:inline px-1.5 py-0.5 rounded text-[10px] bg-accent/20 text-accent font-bold">
            {roleLabel}
          </span>
        )}
        <svg
          className={`w-3.5 h-3.5 text-text-tertiary transition-transform ${menuOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-60 bg-bg-surface border border-border-default rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/70 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 border-b border-border-subtle">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-mono text-emerald-500 font-bold uppercase tracking-wider">
                  Signed In
                </span>
              </div>
              <p className="text-xs font-bold text-text-primary truncate">{auth.name}</p>
              <p className="text-[11px] font-mono text-text-muted truncate">{auth.email}</p>
              {roleLabel && (
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-accent/15 text-accent font-bold uppercase tracking-wider border border-accent/30">
                  {roleLabel}
                </span>
              )}
            </div>

            <div className="py-1">
              {auth.isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-accent hover:bg-accent/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                  Admin CMS Control Hub
                </Link>
              )}
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
              >
                Home
              </Link>
            </div>

            <div className="pt-1 border-t border-border-subtle">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
