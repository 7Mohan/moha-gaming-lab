/**
 * tests/production-smoke.test.mjs
 * ────────────────────────────────────────────────────────────────
 * Moha Gaming Lab — Phase 16 Production Smoke Test Suite
 *
 * Validates:
 * 1. Health check endpoints (/api/health and /api/health/ready)
 * 2. Operational kill switches and runtime feature toggles
 * 3. Production infrastructure artifacts (Dockerfile, compose, CI/CD, .gitignore)
 * 4. Production environment configuration template completeness
 * 5. Download emergency controls and publication enforcement
 * 6. Operational runbooks and incident response documentation
 */

import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();

describe("Phase 16: Production Smoke Test Suite", () => {

  describe("1. Operational Kill Switches & Feature Flags", () => {
    let killswitches;

    before(async () => {
      // Dynamic import of the compiled/source killswitch module
      killswitches = await import("../lib/config/killswitches.ts");
    });

    test("defaults: all core services active and maintenance mode disabled", () => {
      delete process.env.MAINTENANCE_MODE;
      delete process.env.DOWNLOADS_ENABLED;
      delete process.env.NEXT_PUBLIC_DOWNLOADS_ENABLED;
      delete process.env.ADS_ENABLED;
      delete process.env.NEXT_PUBLIC_ADS_ENABLED;
      delete process.env.ANALYTICS_ENABLED;
      delete process.env.NEXT_PUBLIC_ANALYTICS_ENABLED;

      assert.strictEqual(killswitches.isMaintenanceMode(), false, "Maintenance mode should be false by default");
      assert.strictEqual(killswitches.isDownloadsEnabled(), true, "Downloads should be enabled by default");
      assert.strictEqual(killswitches.isAdsEnabled(), true, "Ads should be enabled by default");
      assert.strictEqual(killswitches.isAnalyticsEnabled(), true, "Analytics should be enabled by default");
    });

    test("maintenance mode triggers when MAINTENANCE_MODE='true'", () => {
      process.env.MAINTENANCE_MODE = "true";
      assert.strictEqual(killswitches.isMaintenanceMode(), true);
      delete process.env.MAINTENANCE_MODE;
    });

    test("downloads killswitch triggers when DOWNLOADS_ENABLED='false'", () => {
      process.env.DOWNLOADS_ENABLED = "false";
      assert.strictEqual(killswitches.isDownloadsEnabled(), false);
      delete process.env.DOWNLOADS_ENABLED;

      process.env.NEXT_PUBLIC_DOWNLOADS_ENABLED = "false";
      assert.strictEqual(killswitches.isDownloadsEnabled(), false);
      delete process.env.NEXT_PUBLIC_DOWNLOADS_ENABLED;
    });

    test("ads killswitch triggers when ADS_ENABLED='false'", () => {
      process.env.ADS_ENABLED = "false";
      assert.strictEqual(killswitches.isAdsEnabled(), false);
      delete process.env.ADS_ENABLED;

      process.env.NEXT_PUBLIC_ADS_ENABLED = "false";
      assert.strictEqual(killswitches.isAdsEnabled(), false);
      delete process.env.NEXT_PUBLIC_ADS_ENABLED;
    });

    test("getOperationalStatus returns complete operational state snapshot", () => {
      const status = killswitches.getOperationalStatus();
      assert.ok(typeof status.maintenanceMode === "boolean");
      assert.ok(typeof status.downloadsEnabled === "boolean");
      assert.ok(typeof status.adsEnabled === "boolean");
      assert.ok(typeof status.analyticsEnabled === "boolean");
    });
  });

  describe("2. Health Check Endpoints & Readiness Probes", () => {
    test("app/api/health/route.ts exists, exports GET, and enforces no-store cache control", () => {
      const healthPath = path.join(ROOT_DIR, "app", "api", "health", "route.ts");
      assert.ok(fs.existsSync(healthPath), "Health check route file must exist");

      const content = fs.readFileSync(healthPath, "utf8");
      assert.ok(content.includes("export async function GET"), "Must export GET handler");
      assert.ok(content.includes('"Cache-Control"'), "Must define Cache-Control header");
      assert.ok(content.includes("no-store"), "Cache-Control must specify no-store");
      assert.ok(content.includes('status: "ok"'), 'Must return status: "ok"');
    });

    test("app/api/health/ready/route.ts exists, exports GET, and defines readiness probe", () => {
      const readyPath = path.join(ROOT_DIR, "app", "api", "health", "ready", "route.ts");
      assert.ok(fs.existsSync(readyPath), "Readiness route file must exist");

      const content = fs.readFileSync(readyPath, "utf8");
      assert.ok(content.includes("export async function GET"), "Must export GET handler");
      assert.ok(content.includes('"Cache-Control"'), "Must define Cache-Control header");
      assert.ok(content.includes("no-store"), "Cache-Control must specify no-store");
      assert.ok(content.includes('status: isReady ? "ready" : "unready"'), "Must dynamically report ready status");
      assert.ok(content.includes("checks"), "Must include backing dependency checks");
    });
  });

  describe("3. Production Infrastructure Artifacts", () => {
    test(".gitignore exists and contains critical secret exclusions", () => {
      const gitignorePath = path.join(ROOT_DIR, ".gitignore");
      assert.ok(fs.existsSync(gitignorePath), ".gitignore must exist");

      const content = fs.readFileSync(gitignorePath, "utf8");
      assert.ok(content.includes(".env"), "Must ignore .env");
      assert.ok(content.includes("node_modules"), "Must ignore node_modules");
      assert.ok(content.includes("/.next/"), "Must ignore .next build folder");
    });

    test(".env.production.example contains all required production configuration keys", () => {
      const envPath = path.join(ROOT_DIR, ".env.production.example");
      assert.ok(fs.existsSync(envPath), ".env.production.example must exist");

      const content = fs.readFileSync(envPath, "utf8");
      const requiredKeys = [
        "NODE_ENV",
        "NEXT_PUBLIC_SITE_URL",
        "MAINTENANCE_MODE",
        "NEXT_PUBLIC_DOWNLOADS_ENABLED",
        "NEXT_PUBLIC_ADS_ENABLED",
        "NEXT_PUBLIC_ANALYTICS_ENABLED",
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "DATABASE_URL",
        "ADMIN_EMAIL",
        "ADMIN_SECRET",
        "BREVO_API_KEY",
        "SUPABASE_STORAGE_BUCKET",
      ];

      for (const key of requiredKeys) {
        assert.ok(
          content.includes(key),
          `Missing critical production env key in template: ${key}`
        );
      }
    });

    test("Dockerfile is multi-stage and defines non-root user and healthcheck", () => {
      const dockerfilePath = path.join(ROOT_DIR, "Dockerfile");
      assert.ok(fs.existsSync(dockerfilePath), "Dockerfile must exist");

      const content = fs.readFileSync(dockerfilePath, "utf8");
      assert.ok(content.includes("FROM node:20-alpine AS deps"), "Must use Node 20 alpine deps stage");
      assert.ok(content.includes("FROM node:20-alpine AS builder"), "Must use builder stage");
      assert.ok(content.includes("FROM node:20-alpine AS runner"), "Must use runner stage");
      assert.ok(content.includes("USER nextjs"), "Must run as non-root user nextjs");
      assert.ok(content.includes("HEALTHCHECK"), "Must specify container HEALTHCHECK");
      assert.ok(content.includes("/api/health"), "Healthcheck must probe /api/health");
    });

    test("docker-compose.yml exists and defines port, environment, and healthcheck", () => {
      const composePath = path.join(ROOT_DIR, "docker-compose.yml");
      assert.ok(fs.existsSync(composePath), "docker-compose.yml must exist");

      const content = fs.readFileSync(composePath, "utf8");
      assert.ok(content.includes("3000:3000"), "Must expose port 3000");
      assert.ok(content.includes(".env.production"), "Must reference .env.production");
      assert.ok(content.includes("healthcheck:"), "Must configure compose healthcheck");
    });

    test(".github/workflows/ci.yml exists and validates lint, tsc, tests, and build", () => {
      const ciPath = path.join(ROOT_DIR, ".github", "workflows", "ci.yml");
      assert.ok(fs.existsSync(ciPath), "CI workflow must exist");

      const content = fs.readFileSync(ciPath, "utf8");
      assert.ok(content.includes("npm run lint"), "CI must run lint");
      assert.ok(content.includes("npx tsc --noEmit"), "CI must check TypeScript");
      assert.ok(content.includes("node --test tests/*.test.mjs"), "CI must run test suites");
      assert.ok(content.includes("npm run build"), "CI must build Next.js application");
    });

    test(".github/workflows/deploy.yml exists and configures production release", () => {
      const deployPath = path.join(ROOT_DIR, ".github", "workflows", "deploy.yml");
      assert.ok(fs.existsSync(deployPath), "Deploy workflow must exist");

      const content = fs.readFileSync(deployPath, "utf8");
      assert.ok(content.includes("branches: [main]"), "Must trigger on push to main");
      assert.ok(content.includes("prisma migrate deploy"), "Must run database migrations");
    });
  });

  describe("4. Operations Runbooks & Documentation", () => {
    const requiredDocs = [
      { file: "RUNBOOK.md", keys: ["Production Deployment", "Instant Rollback Procedures", "Database Operations", "Storage & Download", "Monitoring"] },
      { file: "INCIDENT_RESPONSE.md", keys: ["Severity Classification Matrix", "Incident Response Workflow", "Emergency Containment Playbook", "Post-Mortem"] },
      { file: "DISASTER_RECOVERY.md", keys: ["Recovery Point Objective", "Recovery Time Objective", "Database Backup & Recovery", "Storage & Artifact"] },
      { file: "DEPLOYMENT_GUIDE.md", keys: ["Production Architecture Overview", "Infrastructure Prerequisites", "Hosting Option A", "DNS & Cloudflare"] },
    ];

    for (const doc of requiredDocs) {
      test(`docs/operations/${doc.file} exists and contains required sections`, () => {
        const filePath = path.join(ROOT_DIR, "docs", "operations", doc.file);
        assert.ok(fs.existsSync(filePath), `Documentation ${doc.file} must exist`);

        const content = fs.readFileSync(filePath, "utf8");
        for (const key of doc.keys) {
          assert.ok(
            content.includes(key),
            `docs/operations/${doc.file} must contain section: "${key}"`
          );
        }
      });
    }
  });

  describe("5. Security Headers & Hardening Config", () => {
    test("next.config.ts disables poweredByHeader and enables compression and CSP", () => {
      const configPath = path.join(ROOT_DIR, "next.config.ts");
      const content = fs.readFileSync(configPath, "utf8");

      assert.ok(content.includes("poweredByHeader: false"), "Must disable X-Powered-By header");
      assert.ok(content.includes("compress: true"), "Must enable gzip/brotli compression");
      assert.ok(content.includes("Content-Security-Policy"), "Must configure CSP");
      assert.ok(content.includes("Strict-Transport-Security"), "Must configure HSTS");
      assert.ok(content.includes("X-Frame-Options"), "Must configure X-Frame-Options: DENY");
    });

    test("middleware.ts implements defense-in-depth routing gates", () => {
      const middlewarePath = path.join(ROOT_DIR, "middleware.ts");
      const content = fs.readFileSync(middlewarePath, "utf8");

      assert.ok(content.includes("isMaintenanceMode"), "Middleware must check maintenance mode");
      assert.ok(content.includes("Retry-After"), "Maintenance response must include Retry-After header");
      assert.ok(content.includes("isProtectedAdminRoute"), "Middleware must guard /admin routes");
      assert.ok(content.includes("sanitizeRedirect"), "Middleware must prevent open-redirect vulnerabilities");
    });
  });

});
