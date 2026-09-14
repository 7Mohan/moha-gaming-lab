"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

function ResetPasswordForm() {
  const router = useRouter();

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = React.useState(false);
  const [hasValidSession, setHasValidSession] = React.useState(true);

  React.useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setError("Supabase configuration is missing.");
      setSessionChecked(true);
      return;
    }

    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

    // Verify recovery session or hash tokens
    supabase.auth.getSession().then(({ data: { session } }) => {
      // If we have hash parameters (#access_token=...&type=recovery), Supabase client handles them
      const isRecovery =
        typeof window !== "undefined" &&
        (window.location.hash.includes("type=recovery") ||
          window.location.search.includes("code=") ||
          session !== null);

      setHasValidSession(Boolean(session || isRecovery));
      setSessionChecked(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasValidSession(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

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
      setError("Supabase configuration is missing.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setSuccessMessage("Your password has been successfully updated! Redirecting to sign in...");
      setLoading(false);

      setTimeout(() => {
        router.push("/login?signedIn=true");
      }, 1500);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update password. Your reset link may have expired."
      );
      setLoading(false);
    }
  }

  const isMinLength = password.length >= 6;
  const isMatching = password.length > 0 && password === confirmPassword;

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
              Gaming Performance Portal
            </span>
          </div>
        </Link>
        <h1 className="text-2xl font-black tracking-tight text-text-primary">
          Choose a New Password
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Enter your new credentials below to regain access to your account.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-bg-surface border border-border-default rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/10 dark:shadow-black/80">
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

        {sessionChecked && !hasValidSession ? (
          <div className="space-y-4 text-center">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
              <p className="font-semibold mb-1">Reset Session Expired or Invalid</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                The recovery link may have already been used or expired. Please request a new password reset link from the login page.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-block w-full py-2.5 px-4 rounded-xl bg-accent/20 border border-accent/40 text-accent font-bold text-xs font-mono hover:bg-accent/30 transition-colors"
            >
              ← Go to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* New Password */}
            <div>
              <label
                className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5"
                htmlFor="new-password"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl bg-bg-elevated border border-border-default text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label
                className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5"
                htmlFor="confirm-new-password"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirm-new-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl bg-bg-elevated border border-border-default text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Checklist */}
            <div className="p-3 rounded-xl bg-bg-elevated border border-border-subtle space-y-1.5 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isMinLength ? "bg-emerald-400" : "bg-text-muted"}`} />
                <span className={isMinLength ? "text-emerald-400 font-medium" : "text-text-muted"}>
                  At least 6 characters
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isMatching ? "bg-emerald-400" : "bg-text-muted"}`} />
                <span className={isMatching ? "text-emerald-400 font-medium" : "text-text-muted"}>
                  Passwords match
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isMinLength || !isMatching}
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
                  <span>Updating password...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save New Password</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Back to sign in link */}
      <div className="text-center mt-6">
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
    </div>
  );
}

export default function ResetPasswordPage() {
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
        <ResetPasswordForm />
      </React.Suspense>
    </div>
  );
}
