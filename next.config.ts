import type { NextConfig } from "next";

// Derive Supabase hostname for CSP connect-src (safe fallback if env not set at build time)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
let supabaseHostname = "*.supabase.co";
if (supabaseUrl) {
  try {
    const formattedUrl = supabaseUrl.startsWith("http") ? supabaseUrl : `https://${supabaseUrl}`;
    supabaseHostname = new URL(formattedUrl).hostname;
  } catch {
    supabaseHostname = "*.supabase.co";
  }
}

const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy — tuned for Next.js + Supabase + Google Fonts
const csp = [
  "default-src 'self'",
  // Next.js App Router streaming hydration chunks and JSON-LD require 'unsafe-inline'
  isDev
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  `img-src 'self' data: blob: https://${supabaseHostname} https://lh3.googleusercontent.com https://avatars.githubusercontent.com`,
  `connect-src 'self' https://${supabaseHostname} wss://${supabaseHostname}`,
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
]
  .filter(Boolean)
  .join("; ");

const nextConfig: NextConfig = {
  // Production hardening & optimization
  poweredByHeader: false,
  compress: true,
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,

  // Enable experimental features for better performance
  transpilePackages: ["three"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },

  // Image optimization settings
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Supabase Storage avatars and media
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
      // Google OAuth avatars
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // GitHub OAuth avatars
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },

  // Security headers applied on every response
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: csp },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), payment=()",
        },
        // HSTS — only meaningful in production over HTTPS
        ...(!isDev
          ? [
              {
                key: "Strict-Transport-Security",
                value: "max-age=63072000; includeSubDomains; preload",
              },
            ]
          : []),
      ],
    },
  ],
};

export default nextConfig;
