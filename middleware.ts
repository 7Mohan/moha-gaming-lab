/**
 * middleware.ts
 * ────────────────────────────────────────────────────────────────
 * Next.js Edge Middleware — Defense-in-Depth Route Protection
 *
 * Responsibilities:
 * 1. Refresh Supabase SSR session tokens on every request (keeps cookies fresh)
 * 2. Protect /admin/* routes — redirect to /admin/login if no valid session cookie
 * 3. Block open-redirect attacks on the `next` query parameter
 * 4. Apply security headers on every response
 *
 * NOTE: This middleware runs BEFORE any page/route handler.
 * The per-page guards (requireSession, requireAdmin) remain as a second layer.
 */

import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isMaintenanceMode } from "@/lib/config/killswitches";

// ── Constants ────────────────────────────────────────────────────────────────

/** Routes under /admin that are publicly accessible (login, etc.) */
const PUBLIC_ADMIN_ROUTES = new Set([
  "/admin/login",
]);

/** The name of the session cookie set by lib/auth/session.ts */
const ADMIN_COOKIE_NAME = "moha_admin_session";

/** Allowed redirect target prefixes (open-redirect protection) */
const ALLOWED_REDIRECT_PREFIXES = ["/admin", "/"];

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Validates and sanitizes a `next` redirect parameter.
 * Returns the sanitized path or a safe fallback.
 */
function sanitizeRedirect(next: string | null, origin: string): string {
  if (!next) return "/admin";

  try {
    // If it starts with http/https it could be an open redirect — block it
    if (/^https?:\/\//i.test(next)) return "/admin";

    // Must start with an allowed prefix
    const safe = ALLOWED_REDIRECT_PREFIXES.some((p) => next.startsWith(p));
    if (!safe) return "/admin";

    // Strip any protocol-relative URLs
    if (next.startsWith("//")) return "/admin";

    // Verify it's a valid relative path (no null bytes etc.)
    const url = new URL(next, origin);
    if (url.origin !== origin) return "/admin";

    return next;
  } catch {
    return "/admin";
  }
}

/**
 * Returns true if the request is for a protected admin route.
 */
function isProtectedAdminRoute(pathname: string): boolean {
  if (!pathname.startsWith("/admin")) return false;
  // Allow public admin sub-routes
  if (PUBLIC_ADMIN_ROUTES.has(pathname)) return false;
  // Allow logout route (it clears the session itself)
  if (pathname === "/admin/logout") return false;
  return true;
}

/**
 * Checks whether the admin session cookie is present and structurally valid
 * (has the payload.signature format). Full cryptographic verification
 * happens server-side in lib/auth/session.ts — this is a lightweight gate.
 */
function hasSessionCookie(request: NextRequest): boolean {
  const cookie = request.cookies.get(ADMIN_COOKIE_NAME);
  if (!cookie?.value) return false;
  // Must contain at least one dot separating payload from signature
  const parts = cookie.value.split(".");
  return parts.length >= 2 && Boolean(parts[0] && parts[0].length > 0);
}

// ── Security Headers ─────────────────────────────────────────────────────────

function applySecurityHeaders(response: NextResponse): NextResponse {
  let supabaseHostname = "*.supabase.co";
  const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (rawSupabaseUrl) {
    try {
      const formattedUrl = rawSupabaseUrl.startsWith("http") ? rawSupabaseUrl : `https://${rawSupabaseUrl}`;
      supabaseHostname = new URL(formattedUrl).hostname;
    } catch {
      supabaseHostname = "*.supabase.co";
    }
  }

  const csp = [
    "default-src 'self'",
    // Scripts: Next.js App Router streaming hydration chunks and JSON-LD require 'unsafe-inline'
    process.env.NODE_ENV === "production"
      ? "script-src 'self' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    // Styles: Tailwind injects styles
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Fonts
    "font-src 'self' https://fonts.gstatic.com",
    // Images: allow Supabase storage, data URIs, and blob for avatars
    `img-src 'self' data: blob: https://${supabaseHostname} https://lh3.googleusercontent.com https://avatars.githubusercontent.com`,
    // Connect: API calls and Supabase Realtime
    `connect-src 'self' https://${supabaseHostname} wss://${supabaseHostname}`,
    // Frames: deny embedding entirely
    "frame-ancestors 'none'",
    // Forms: only submit to same origin
    "form-action 'self'",
    // Base URI: restrict to same origin
    "base-uri 'self'",
    // Object: no Flash/plugins
    "object-src 'none'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );

  // HSTS — only in production (not dev, where we use HTTP)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return response;
}

// ── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Canonical SEO Enforcement: 301 Redirect trailing slashes (e.g. /games/ -> /games)
  if (pathname.length > 1 && pathname.endsWith("/")) {
    const cleanUrl = new URL(request.nextUrl);
    cleanUrl.pathname = pathname.slice(0, -1);
    return NextResponse.redirect(cleanUrl, { status: 301 });
  }

  // 0. Maintenance Mode Check (bypasses /admin and /api/health)
  if (isMaintenanceMode()) {
    const isHealth = pathname.startsWith("/api/health");
    const isAdmin = pathname.startsWith("/admin");

    if (!isHealth && !isAdmin) {
      if (pathname.startsWith("/api/")) {
        const jsonResp = NextResponse.json(
          {
            error: "Service Unavailable",
            message: "Moha Gaming Lab is currently undergoing scheduled maintenance. Please try again shortly.",
            retryAfter: 300,
          },
          {
            status: 503,
            headers: {
              "Retry-After": "300",
              "Cache-Control": "no-store, no-cache, must-revalidate",
            },
          }
        );
        return applySecurityHeaders(jsonResp);
      }

      const maintenanceHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scheduled Maintenance | Moha Gaming Lab</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #030712;
      color: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }
    .card {
      max-width: 480px;
      padding: 2.5rem;
      background: rgba(17, 24, 39, 0.85);
      border: 1px solid rgba(75, 85, 99, 0.4);
      border-radius: 1rem;
      backdrop-filter: blur(12px);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.2);
      border-radius: 9999px;
      margin-bottom: 1.25rem;
    }
    h1 {
      font-size: 1.75rem;
      font-weight: 800;
      margin-bottom: 0.75rem;
      color: #ffffff;
    }
    p {
      color: #9ca3af;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }
    .status {
      font-size: 0.875rem;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Scheduled System Maintenance</div>
    <h1>Upgrading Systems</h1>
    <p>Moha Gaming Lab is currently undergoing scheduled infrastructure maintenance to enhance reliability and performance. We will be back online shortly.</p>
    <div class="status">Estimated recovery: Under 10 minutes &bull; Status 503</div>
  </div>
</body>
</html>`;

      const htmlResp = new NextResponse(maintenanceHtml, {
        status: 503,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Retry-After": "300",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
      return applySecurityHeaders(htmlResp);
    }
  }

  // 1. Check for protected admin routes
  if (isProtectedAdminRoute(pathname)) {
    if (!hasSessionCookie(request)) {
      // Redirect to login with sanitized `next` parameter
      const next = sanitizeRedirect(pathname, request.nextUrl.origin);
      const loginUrl = new URL("/admin/login", request.nextUrl.origin);
      loginUrl.searchParams.set("next", next);

      const redirectResponse = NextResponse.redirect(loginUrl);
      return applySecurityHeaders(redirectResponse);
    }
  }

  // 2. If already logged in admin visiting /admin/login, redirect to dashboard
  if (pathname === "/admin/login" && hasSessionCookie(request)) {
    const dashboardUrl = new URL("/admin", request.nextUrl.origin);
    const redirectResponse = NextResponse.redirect(dashboardUrl);
    return applySecurityHeaders(redirectResponse);
  }

  // 3. Refresh Supabase SSR session tokens (keeps cookies active)
  const { response } = await updateSession(request);

  // 4. Return with security headers applied
  return applySecurityHeaders(response);
}

export const config = {
  /*
   * Match all routes EXCEPT:
   * - _next/static (static files)
   * - _next/image (image optimization)
   * - favicon.ico, robots.txt, sitemap.xml
   * - Public assets
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2|ttf|eot)).*)",
  ],
};
