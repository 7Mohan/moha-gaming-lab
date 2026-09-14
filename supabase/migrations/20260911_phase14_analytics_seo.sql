-- supabase/migrations/20260911_phase14_analytics_seo.sql
-- ────────────────────────────────────────────────────────────────
-- Moha Gaming Lab — Phase 14: Analytics, SEO & Growth Infrastructure
-- ────────────────────────────────────────────────────────────────

-- 1. Analytics Events Table (Privacy-Safe Telemetry)
CREATE TABLE IF NOT EXISTS "AnalyticsEvent" (
    "id" TEXT PRIMARY KEY,
    "eventName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "path" TEXT,
    "contentType" TEXT,
    "contentSlug" TEXT,
    "anonymousSessionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AnalyticsEvent_eventName_idx" ON "AnalyticsEvent"("eventName");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_category_idx" ON "AnalyticsEvent"("category");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_path_idx" ON "AnalyticsEvent"("path");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_contentSlug_idx" ON "AnalyticsEvent"("contentSlug");

-- 2. Redirects Table (301 Permanent Redirects for Slugs & Legacy URLs)
CREATE TABLE IF NOT EXISTS "Redirect" (
    "id" TEXT PRIMARY KEY,
    "sourcePath" TEXT NOT NULL UNIQUE,
    "targetPath" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL DEFAULT 301,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "lastHitAt" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Redirect_sourcePath_idx" ON "Redirect"("sourcePath");
CREATE INDEX IF NOT EXISTS "Redirect_enabled_idx" ON "Redirect"("enabled");

-- 3. Campaigns Table (Attribution & UTM Tracking)
CREATE TABLE IF NOT EXISTS "Campaign" (
    "id" TEXT PRIMARY KEY,
    "slug" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "medium" TEXT,
    "campaign" TEXT,
    "targetUrl" TEXT NOT NULL,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Campaign_slug_idx" ON "Campaign"("slug");
CREATE INDEX IF NOT EXISTS "Campaign_source_idx" ON "Campaign"("source");

-- ────────────────────────────────────────────────────────────────
-- Row Level Security (RLS) Policies
-- ────────────────────────────────────────────────────────────────

ALTER TABLE "AnalyticsEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Redirect" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Campaign" ENABLE ROW LEVEL SECURITY;

-- AnalyticsEvent: Public cannot read; Service role / Authenticated Admins can read
DROP POLICY IF EXISTS "Public cannot read analytics" ON "AnalyticsEvent";
CREATE POLICY "Public cannot read analytics" ON "AnalyticsEvent"
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM "AdminUser"
            WHERE "AdminUser"."id" = auth.uid()::text
            AND "AdminUser"."isActive" = true
            AND "AdminUser"."role" IN ('ADMIN', 'EDITOR', 'AUTHOR')
        )
    );

DROP POLICY IF EXISTS "Allow anonymous event insertion" ON "AnalyticsEvent";
CREATE POLICY "Allow anonymous event insertion" ON "AnalyticsEvent"
    FOR INSERT
    WITH CHECK (true);

-- Redirect: Public can read active redirects
DROP POLICY IF EXISTS "Public can read active redirects" ON "Redirect";
CREATE POLICY "Public can read active redirects" ON "Redirect"
    FOR SELECT
    USING ("enabled" = true OR auth.role() = 'service_role');

-- Redirect: Admins and Editors can manage redirects
DROP POLICY IF EXISTS "Admins can manage redirects" ON "Redirect";
CREATE POLICY "Admins can manage redirects" ON "Redirect"
    FOR ALL
    USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM "AdminUser"
            WHERE "AdminUser"."id" = auth.uid()::text
            AND "AdminUser"."isActive" = true
            AND "AdminUser"."role" IN ('ADMIN', 'EDITOR')
        )
    );

-- Campaign: Public can read active campaigns for attribution
DROP POLICY IF EXISTS "Public can read active campaigns" ON "Campaign";
CREATE POLICY "Public can read active campaigns" ON "Campaign"
    FOR SELECT
    USING ("enabled" = true OR auth.role() = 'service_role');

-- Campaign: Admins and Editors can manage campaigns
DROP POLICY IF EXISTS "Admins can manage campaigns" ON "Campaign";
CREATE POLICY "Admins can manage campaigns" ON "Campaign"
    FOR ALL
    USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM "AdminUser"
            WHERE "AdminUser"."id" = auth.uid()::text
            AND "AdminUser"."isActive" = true
            AND "AdminUser"."role" IN ('ADMIN', 'EDITOR')
        )
    );
