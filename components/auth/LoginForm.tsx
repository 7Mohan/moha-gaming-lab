"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  loginAction,
  syncSupabaseUserAction,
  getAuthStatusAction,
  type LoginActionResult,
} from "@/app/admin/login/actions";
import { createBrowserClient } from "@supabase/ssr";

interface LoginFormProps {
  mode?: "admin" | "user";
  defaultRedirect?: string;
}

export function LoginForm({ mode = "admin", defaultRedirect = "/admin" }: LoginFormProps) {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || defaultRedirect;

  const isAdmin = mode === "admin";

  // Active Tab: "signin" vs "register" vs "forgot"
  const [activeTab, setActiveTab] = React.useState<"signin" | "register" | "forgot">("signin");

  // Form Fields — clean inputs without hardcoded dev presets
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  // States
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [infoMessage, setInfoMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  // Already logged in state
  const [currentUser, setCurrentUser] = React.useState<{
    email: string;
    name?: string;
    isAdmin: boolean;
  } | null>(null);

  // Check URL query errors and current auth status on mount
  React.useEffect(() => {
    const err = searchParams.get("error");
    if (err) setError(decodeURIComponent(err));

    const loggedIn = searchParams.get("logged_in") || searchParams.get("signedIn");
    if (loggedIn) {
      setSuccessMessage("You are logged in! Welcome back.");
    }

    // Check if user is already signed in
    getAuthStatusAction()
      .then((status) => {
        if (status.isAuthenticated && status.email) {
          setCurrentUser({
            email: status.email,
            name: status.name,
            isAdmin: status.isAdmin,
          });
        }
      })
      .catch(() => {});
  }, [searchParams]);

  // ── 1. SIGN IN SUBMIT HANDLER ──────────────────────────────────────────
  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setInfoMessage(null);
    setLoading(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let supabaseAuthSucceeded = false;

    // A. First attempt Supabase Auth if keys are present
    if (supabaseUrl && supabaseAnonKey) {
      try {
        const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
        const { data, error: sbError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (!sbError && data?.session?.access_token) {
          supabaseAuthSucceeded = true;
          // Sync session to server to check role & set HTTP-only cookie
          const syncRes = await syncSupabaseUserAction(data.session.access_token);

          if (isAdmin && !syncRes.isAdmin) {
            setError(
              `Signed in as ${email}, but this account is not assigned an Admin role. Contact the administrator.`
            );
            setLoading(false);
            return;
          }

          setSuccessMessage("You are logged in! Redirecting...");
          setLoading(false);

          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("moha-auth-changed"));
          }

          const dest = syncRes.isAdmin ? "/admin" : redirectUrl;
          setTimeout(() => {
            window.location.href = isAdmin ? "/admin" : dest;
          }, 800);
          return;
        }
      } catch {
        // Continue to fallback check below
      }
    }

    // B. Fallback to Server Action (credentials & Prisma DB)
    if (!supabaseAuthSucceeded) {
      const formData = new FormData();
      formData.append("email", email.trim());
      formData.append("password", password);

      try {
        const res: LoginActionResult = await loginAction(null, formData);
        if (res.success) {
          setSuccessMessage("You are logged in! Redirecting...");
          setLoading(false);

          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("moha-auth-changed"));
          }

          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 800);
        } else {
          setError(
            res.error ||
              "Incorrect credentials. If you haven't created an account yet, switch to the Register tab."
          );
          setLoading(false);
        }
      } catch {
        setError("We couldn't sign you in. Please check your credentials and try again.");
        setLoading(false);
      }
    }
  }

  // ── 2. REGISTER SUBMIT HANDLER ─────────────────────────────────────────
  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setInfoMessage(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setError("Account registration service is temporarily unavailable.");
      setLoading(false);
      return;
    }

    try {
      // Route registration through our server endpoint which uses Brevo for reliable email delivery
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim() || email.split("@")[0],
        }),
      });

      const resData = await res.json();

      if (!res.ok || !resData.success) {
        setError(resData.error || "Failed to create account. Please try again.");
        setLoading(false);
        return;
      }

      setSuccessMessage(
        `Account created! A verification email has been sent to ${email} via Brevo. Please check your inbox (and spam folder) and click the link to confirm your account.`
      );
      setLoading(false);
      setActiveTab("signin");
      setConfirmPassword("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create account. Please try again.");
      setLoading(false);
    }
  }

  // ── 3. GOOGLE SIGN IN HANDLER ──────────────────────────────────────────
  async function handleGoogleSignIn() {
    setError(null);
    setSuccessMessage(null);
    setInfoMessage(null);
    setGoogleLoading(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setGoogleLoading(false);
      setError("Supabase environment configuration is missing.");
      return;
    }

    try {
      const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
      const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(
        redirectUrl
      )}`;

      // Use skipBrowserRedirect to pre-flight check if Google provider is enabled in Supabase
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          skipBrowserRedirect: true,
          redirectTo: callbackUrl,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setGoogleLoading(false);
        return;
      }

      if (data?.url) {
        // Pre-flight test the endpoint
        try {
          const preflight = await fetch(data.url, { method: "HEAD", redirect: "manual" });
          // If Supabase returned 400 validation error (provider not enabled)
          if (preflight.status === 400) {
            const bodyRes = await fetch(data.url);
            const bodyJson = await bodyRes.json().catch(() => ({}));
            if (
              bodyJson.msg?.includes("not enabled") ||
              bodyJson.error_code === "validation_failed"
            ) {
              setError(
                "Google Sign-In is not enabled in your Supabase project yet. In your Supabase Dashboard: go to Authentication → Providers → Google, toggle Enable to ON, and save your Client ID & Secret."
              );
              setGoogleLoading(false);
              return;
            }
          }
        } catch {
          // If network error during preflight, attempt standard direct redirect
        }

        // Provider is enabled! Redirect to Google
        window.location.href = data.url;
      } else {
        setError("Failed to get Google authorization URL.");
        setGoogleLoading(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initiate Google authentication.";
      setError(msg);
      setGoogleLoading(false);
    }
  }

  // ── 4. FORGOT PASSWORD SUBMIT HANDLER ──────────────────────────────────
  async function handleForgotPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setInfoMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json().catch(() => ({ success: false }));

      if (!res.ok || !data.success) {
        setError(
          data.error || "Failed to send reset email. Please try again or contact support."
        );
        setLoading(false);
        return;
      }

      setSuccessMessage(
        `A password recovery link has been sent to ${cleanEmail}. Please check your email inbox and spam folder.`
      );
      setLoading(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset email. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md z-10">
      {/* Header Branding */}
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
              {isAdmin ? "Control Hub CMS" : "Gaming Performance Portal"}
            </span>
          </div>
        </Link>
        <h1 className="text-2xl font-black tracking-tight text-text-primary">
          {activeTab === "signin"
            ? isAdmin
              ? "Admin Authentication"
              : "Sign In to Moha Lab"
            : activeTab === "register"
            ? "Create an Account"
            : "Reset Password"}
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {activeTab === "signin"
            ? isAdmin
              ? "Sign in with your administrator Google account or credentials."
              : "Access guides, benchmark profiles, and community tools."
            : activeTab === "register"
            ? "Register with your email to create an account on Moha Lab."
            : "Enter your account email to receive a secure recovery link."}
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-bg-surface border border-border-default rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/10 dark:shadow-black/80">
        {/* Active Session Status Notification */}
        {currentUser && (
          <div className="mb-6 p-4 rounded-xl bg-accent/10 border border-accent/30 text-text-primary text-sm flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <span className="font-mono text-[11px] font-bold text-accent uppercase tracking-wider">
                  You are currently logged in
                </span>
              </div>
              <p className="font-semibold text-text-primary text-xs truncate">
                {currentUser.name ? `${currentUser.name} (${currentUser.email})` : currentUser.email}
              </p>
            </div>
            <Link
              href={currentUser.isAdmin ? "/admin" : "/"}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex-shrink-0 shadow-sm"
            >
              {currentUser.isAdmin ? "Control Hub" : "Go to Home"}
            </Link>
          </div>
        )}

        {/* Tab Switcher: Sign In vs Register (or Recovery Mode banner) */}
        {activeTab === "forgot" ? (
          <div className="flex items-center justify-between mb-6 p-2 rounded-xl bg-bg-elevated border border-border-subtle">
            <span className="text-xs font-mono font-bold text-accent px-2 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span>Password Recovery</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setActiveTab("signin");
                setError(null);
                setSuccessMessage(null);
              }}
              className="px-3 py-1 rounded-lg text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors cursor-pointer"
            >
              ← Back to Sign In
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-bg-elevated rounded-xl mb-6 border border-border-subtle">
            <button
              type="button"
              onClick={() => {
                setActiveTab("signin");
                setError(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold tracking-wider transition-all ${
                activeTab === "signin"
                  ? "bg-accent/20 border border-accent/40 text-accent font-bold shadow-sm shadow-accent/10"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setError(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold tracking-wider transition-all ${
                activeTab === "register"
                  ? "bg-accent/20 border border-accent/40 text-accent font-bold shadow-sm shadow-accent/10"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Register / Sign Up
            </button>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-2.5">
            <svg
              className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Success Notification */}
        {successMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-2.5">
            <svg
              className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Info Notification */}
        {infoMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm flex items-start gap-2.5">
            <svg
              className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="leading-relaxed">{infoMessage}</span>
          </div>
        )}

        {/* ── GOOGLE SIGN-IN BUTTON (Hidden in Forgot Password mode) ──────────────────── */}
        {activeTab !== "forgot" && (
          <>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-gray-100 active:scale-[0.99] text-gray-900 font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed border border-gray-200"
            >
              {googleLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-gray-700" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  {/* Google 4-Color Icon */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* ── OR DIVIDER ───────────────────────────────────────── */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-subtle" />
              </div>
              <div className="relative flex justify-center text-xs font-mono uppercase tracking-wider">
                <span className="bg-bg-surface px-3 text-text-muted">
                  {activeTab === "signin" ? "or continue with email" : "or register with email"}
                </span>
              </div>
            </div>
          </>
        )}

        {/* ── FORM: SIGN IN, REGISTER, OR FORGOT PASSWORD ────── */}
        <form
          onSubmit={
            activeTab === "signin"
              ? handleSignIn
              : activeTab === "register"
              ? handleRegister
              : handleForgotPassword
          }
          className="space-y-4"
        >
          {/* Full Name field (Register only) */}
          {activeTab === "register" && (
            <div>
              <label
                className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5"
                htmlFor="auth-name"
              >
                Full Name
              </label>
              <input
                id="auth-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Moha Gamer"
                className="w-full px-4 py-2.5 rounded-xl bg-bg-elevated border border-border-default text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>
          )}

          {/* Email field */}
          <div>
            <label
              className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5"
              htmlFor="auth-email"
            >
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-2.5 rounded-xl bg-bg-elevated border border-border-default text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            />
          </div>

          {/* Password field (Hidden in Forgot Password mode) */}
          {activeTab !== "forgot" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className="block text-xs font-mono uppercase tracking-wider text-text-secondary"
                  htmlFor="auth-password"
                >
                  Password
                </label>
                {activeTab === "register" && (
                  <span className="text-[11px] text-text-muted font-mono">min 6 chars</span>
                )}
                {activeTab === "signin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("forgot");
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] font-mono text-accent hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                id="auth-password"
                type="password"
                required
                autoComplete={activeTab === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-bg-elevated border border-border-default text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>
          )}

          {/* Confirm Password field (Register only) */}
          {activeTab === "register" && (
            <div>
              <label
                className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5"
                htmlFor="auth-confirm-password"
              >
                Confirm Password
              </label>
              <input
                id="auth-confirm-password"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-bg-elevated border border-border-default text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed border border-emerald-400/20"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>
                  {activeTab === "signin"
                    ? "Signing you in..."
                    : activeTab === "register"
                    ? "Creating account..."
                    : "Sending recovery link..."}
                </span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      activeTab === "signin"
                        ? "M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                        : activeTab === "register"
                        ? "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                        : "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    }
                  />
                </svg>
                <span className="text-white font-bold">
                  {activeTab === "signin"
                    ? "Sign In with Password"
                    : activeTab === "register"
                    ? "Create Account"
                    : "Send Password Reset Link"}
                </span>
              </>
            )}
          </button>

          {/* Back to sign in link (Forgot Password mode only) */}
          {activeTab === "forgot" && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("signin");
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-xs font-mono text-text-tertiary hover:text-accent transition-colors cursor-pointer"
              >
                ← Remember your password? Sign in
              </button>
            </div>
          )}
        </form>

      </div>

      {/* Back to public site */}
      <div className="text-center mt-6">
        <Link
          href="/"
          className="text-xs font-mono text-text-tertiary hover:text-text-primary transition-colors inline-flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Return to Moha Gaming Lab Public Site
        </Link>
      </div>
    </div>
  );
}
