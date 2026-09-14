-- ==============================================================================
-- Moha Gaming Lab — Phase 13: Ads + Monetization Architecture Migration
-- ==============================================================================

-- 1. Enums
DO $$ BEGIN
  CREATE TYPE "AdPageType" AS ENUM ('HOME', 'GAME', 'APP', 'TOOL', 'GUIDE', 'DOWNLOAD');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AdFormat" AS ENUM ('BANNER_HORIZONTAL', 'RECTANGLE_MEDIUM', 'RESPONSIVE', 'SPONSORED_CARD');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AdProviderType" AS ENUM ('ADSENSE', 'DIRECT_SPONSOR', 'AFFILIATE', 'TEST_PLACEHOLDER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AdDeviceTarget" AS ENUM ('ALL', 'MOBILE', 'DESKTOP');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "MonetizationEventType" AS ENUM ('AD_IMPRESSION', 'AD_CLICK', 'AFFILIATE_CLICK', 'SPONSORED_VIEW');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Ad Placements Table
CREATE TABLE IF NOT EXISTS "AdPlacement" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "pageType" "AdPageType" NOT NULL DEFAULT 'HOME',
  "location" TEXT NOT NULL,
  "format" "AdFormat" NOT NULL DEFAULT 'RESPONSIVE',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "provider" "AdProviderType" NOT NULL DEFAULT 'TEST_PLACEHOLDER',
  "slotId" TEXT,
  "priority" INTEGER NOT NULL DEFAULT 0 CHECK ("priority" >= 0),
  "device" "AdDeviceTarget" NOT NULL DEFAULT 'ALL',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_ad_placement_page" ON "AdPlacement"("pageType");
CREATE INDEX IF NOT EXISTS "idx_ad_placement_enabled" ON "AdPlacement"("enabled");

-- 3. Affiliate Links Table
CREATE TABLE IF NOT EXISTS "AffiliateLink" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "destinationUrl" TEXT NOT NULL CHECK ("destinationUrl" ~* '^https://'),
  "provider" TEXT,
  "campaign" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "clickCount" INTEGER NOT NULL DEFAULT 0 CHECK ("clickCount" >= 0),
  "disclosureRequired" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_affiliate_slug" ON "AffiliateLink"("slug");
CREATE INDEX IF NOT EXISTS "idx_affiliate_enabled" ON "AffiliateLink"("enabled");

-- 4. Sponsored Content Table
CREATE TABLE IF NOT EXISTS "SponsoredContent" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "sponsorName" TEXT NOT NULL,
  "sponsorUrl" TEXT NOT NULL CHECK ("sponsorUrl" ~* '^https://'),
  "sponsorLogo" TEXT,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "targetSection" "SectionType",
  "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
  "startDate" TIMESTAMPTZ,
  "endDate" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_sponsored_status" ON "SponsoredContent"("status");
CREATE INDEX IF NOT EXISTS "idx_sponsored_target" ON "SponsoredContent"("targetSection");

-- 5. Monetization Events Table
CREATE TABLE IF NOT EXISTS "MonetizationEvent" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "eventType" "MonetizationEventType" NOT NULL,
  "placementKey" TEXT,
  "affiliateSlug" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_monetization_events_type" ON "MonetizationEvent"("eventType");
CREATE INDEX IF NOT EXISTS "idx_monetization_events_created" ON "MonetizationEvent"("createdAt");

-- 6. Row Level Security Policies
ALTER TABLE "AdPlacement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AffiliateLink" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SponsoredContent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MonetizationEvent" ENABLE ROW LEVEL SECURITY;

-- AdPlacement RLS
CREATE POLICY "Public visitors can view enabled ad placements"
  ON "AdPlacement" FOR SELECT
  USING ("enabled" = true OR public.is_editor());

CREATE POLICY "Admins and Editors manage ad placements"
  ON "AdPlacement" FOR ALL
  TO authenticated
  USING (public.is_editor())
  WITH CHECK (public.is_editor());

-- AffiliateLink RLS
CREATE POLICY "Public visitors can view active affiliate records"
  ON "AffiliateLink" FOR SELECT
  USING ("enabled" = true OR public.is_editor());

CREATE POLICY "Admins and Editors manage affiliate links"
  ON "AffiliateLink" FOR ALL
  TO authenticated
  USING (public.is_editor())
  WITH CHECK (public.is_editor());

-- SponsoredContent RLS
CREATE POLICY "Public visitors view published sponsored content"
  ON "SponsoredContent" FOR SELECT
  USING ("status" = 'PUBLISHED' OR public.is_editor());

CREATE POLICY "Admins and Editors manage sponsored content"
  ON "SponsoredContent" FOR ALL
  TO authenticated
  USING (public.is_editor())
  WITH CHECK (public.is_editor());

-- MonetizationEvent RLS
CREATE POLICY "Public can record anonymous monetization telemetry"
  ON "MonetizationEvent" FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins and Editors can read monetization events"
  ON "MonetizationEvent" FOR SELECT
  TO authenticated
  USING (public.is_editor());

-- 7. Initial Seed Records (Idempotent)
INSERT INTO "AdPlacement" ("key", "name", "description", "pageType", "location", "format", "enabled", "provider")
VALUES
  ('homepage_after_hero', 'Homepage After Hero', 'Horizontal leaderboard banner below capability strip', 'HOME', 'after_hero', 'BANNER_HORIZONTAL', true, 'TEST_PLACEHOLDER'),
  ('homepage_before_footer', 'Homepage Before Footer', 'Responsive banner placed before the global footer', 'HOME', 'before_footer', 'RESPONSIVE', true, 'TEST_PLACEHOLDER'),
  ('games_hub_between_sections', 'Games Hub Divider', 'Banner placed between featured games and genres', 'GAME', 'between_sections', 'BANNER_HORIZONTAL', true, 'TEST_PLACEHOLDER'),
  ('game_after_overview', 'Game Detail Overview', 'Responsive slot below game hardware specifications', 'GAME', 'after_overview', 'RESPONSIVE', true, 'TEST_PLACEHOLDER'),
  ('apps_hub_between_sections', 'Apps Hub Divider', 'Horizontal banner between APK catalog sections', 'APP', 'between_sections', 'BANNER_HORIZONTAL', true, 'TEST_PLACEHOLDER'),
  ('app_after_overview', 'App Detail Overview', 'Separated banner below app overview and before guides', 'APP', 'after_overview', 'RESPONSIVE', true, 'TEST_PLACEHOLDER'),
  ('guide_mid_content', 'Guide Mid-Article', 'Medium rectangle placement between guide technical sections', 'GUIDE', 'mid_content', 'RECTANGLE_MEDIUM', true, 'TEST_PLACEHOLDER'),
  ('guide_after_content', 'Guide Post-Article', 'Responsive banner below guide conclusions', 'GUIDE', 'after_content', 'RESPONSIVE', true, 'TEST_PLACEHOLDER'),
  ('tool_after_result', 'Tool Result Banner', 'Placed below interactive diagnostic outputs', 'TOOL', 'after_result', 'BANNER_HORIZONTAL', true, 'TEST_PLACEHOLDER'),
  ('download_bottom', 'Download Page Footer', 'Clearly separated banner at bottom of downloads page', 'DOWNLOAD', 'bottom', 'BANNER_HORIZONTAL', true, 'TEST_PLACEHOLDER')
ON CONFLICT ("key") DO NOTHING;

-- End of Phase 13 Migration
