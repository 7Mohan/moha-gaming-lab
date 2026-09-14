/**
 * lib/monetization/consent.ts
 * ────────────────────────────────────────────────────────────────
 * Privacy-first consent management for Moha Gaming Lab.
 * Manages visitor cookie preferences (Essential vs Advertising).
 */

import type { ConsentStatus } from "./types";

const CONSENT_COOKIE_KEY = "mgl_consent";
const CONSENT_EVENT_NAME = "mgl:consent-changed";

/**
 * Retrieves the current visitor consent state.
 * Returns "accepted", "rejected", or "unknown" if not yet chosen.
 */
export function getStoredConsent(): ConsentStatus {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return "unknown";
  }

  try {
    // 1. Check cookies
    const match = document.cookie.match(new RegExp(`(^|;\\s*)${CONSENT_COOKIE_KEY}=([^;]*)`));
    if (match && match[2]) {
      const val = decodeURIComponent(match[2]).toLowerCase();
      if (val === "accepted" || val === "rejected") {
        return val;
      }
    }

    // 2. Check localStorage fallback
    const local = localStorage.getItem(CONSENT_COOKIE_KEY);
    if (local === "accepted" || local === "rejected") {
      return local;
    }
  } catch {
    // Storage access may be restricted in sandboxed webviews
  }

  return "unknown";
}

/**
 * Saves the visitor consent state and dispatches a reactive browser event.
 */
export function setStoredConsent(status: "accepted" | "rejected"): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  try {
    // 365-day expiry cookie with SameSite=Lax
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${CONSENT_COOKIE_KEY}=${status}; path=/; max-age=${maxAge}; SameSite=Lax`;
    localStorage.setItem(CONSENT_COOKIE_KEY, status);

    // Notify active listeners
    window.dispatchEvent(
      new CustomEvent(CONSENT_EVENT_NAME, { detail: { status } })
    );
  } catch (err) {
    console.warn("[ConsentManager] Failed to persist consent choice:", err);
  }
}

/**
 * Returns true only if the user has explicitly accepted optional advertising cookies.
 */
export function hasAdvertisingConsent(): boolean {
  return getStoredConsent() === "accepted";
}

/**
 * Subscribes a React component or listener to consent updates.
 */
export function subscribeToConsentChanges(
  callback: (status: ConsentStatus) => void
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = (event: Event) => {
    const custom = event as CustomEvent<{ status: ConsentStatus }>;
    callback(custom.detail?.status || getStoredConsent());
  };

  window.addEventListener(CONSENT_EVENT_NAME, handler);
  return () => {
    window.removeEventListener(CONSENT_EVENT_NAME, handler);
  };
}
