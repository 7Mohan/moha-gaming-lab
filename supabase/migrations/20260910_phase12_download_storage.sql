-- ==============================================================================
-- Moha Gaming Lab — Phase 12: Real Download Infrastructure & Storage Security
-- Target: PostgreSQL 15+ / Supabase Auth & Storage
-- File: supabase/migrations/20260910_phase12_download_storage.sql
-- ==============================================================================

-- ── 1. Enum Updates ───────────────────────────────────────────────────────────

DO $$ BEGIN
  ALTER TYPE "VerificationStatus" ADD VALUE IF NOT EXISTS 'FAILED';
EXCEPTION WHEN undefined_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE "DownloadSourceType" ADD VALUE IF NOT EXISTS 'HOSTED';
EXCEPTION WHEN undefined_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE "DownloadSourceType" ADD VALUE IF NOT EXISTS 'TRUSTED_EXTERNAL';
EXCEPTION WHEN undefined_object THEN null; END $$;

-- ── 2. Extend app_releases Table ──────────────────────────────────────────────

DO $$ BEGIN
  ALTER TABLE public.app_releases
    ADD COLUMN IF NOT EXISTS storage_path TEXT,
    ADD COLUMN IF NOT EXISTS file_name TEXT,
    ADD COLUMN IF NOT EXISTS mime_type TEXT DEFAULT 'application/vnd.android.package-archive',
    ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
    ADD COLUMN IF NOT EXISTS checksum_algorithm TEXT DEFAULT 'sha256',
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PUBLISHED',
    ADD COLUMN IF NOT EXISTS created_by TEXT,
    ADD COLUMN IF NOT EXISTS updated_by TEXT;
EXCEPTION WHEN undefined_table THEN null; END $$;

-- Add check constraints for data integrity
DO $$ BEGIN
  ALTER TABLE public.app_releases
    DROP CONSTRAINT IF EXISTS chk_app_releases_file_size_bytes,
    ADD CONSTRAINT chk_app_releases_file_size_bytes
      CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0);
EXCEPTION WHEN undefined_table THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.app_releases
    DROP CONSTRAINT IF EXISTS chk_app_releases_version_code,
    ADD CONSTRAINT chk_app_releases_version_code
      CHECK (version_code IS NULL OR version_code >= 0);
EXCEPTION WHEN undefined_table THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.app_releases
    DROP CONSTRAINT IF EXISTS chk_app_releases_sha256,
    ADD CONSTRAINT chk_app_releases_sha256
      CHECK (checksum_sha256 IS NULL OR checksum_sha256 ~* '^[a-f0-9]{64}$');
EXCEPTION WHEN undefined_table THEN null; END $$;

-- Add indexes for performance & query patterns
CREATE INDEX IF NOT EXISTS idx_app_releases_version_code ON public.app_releases(version_code);
CREATE INDEX IF NOT EXISTS idx_app_releases_status ON public.app_releases(status);
CREATE INDEX IF NOT EXISTS idx_app_releases_checksum_sha256 ON public.app_releases(checksum_sha256);
CREATE INDEX IF NOT EXISTS idx_app_releases_storage_path ON public.app_releases(storage_path);

-- ── 3. Download Events Table (Privacy-Preserving Telemetry) ────────────────────

CREATE TABLE IF NOT EXISTS public.download_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'HOSTED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_download_events_release_id ON public.download_events(release_id);
CREATE INDEX IF NOT EXISTS idx_download_events_created_at ON public.download_events(created_at);

-- Enable RLS on download_events
ALTER TABLE public.download_events ENABLE ROW LEVEL SECURITY;

-- Anonymous users cannot read download events (prevents scraping/fingerprinting)
REVOKE ALL ON public.download_events FROM anon;
GRANT INSERT ON public.download_events TO anon, authenticated;
GRANT SELECT ON public.download_events TO authenticated;

-- Service role retains full administrative privileges
GRANT ALL ON public.download_events TO service_role;

-- RLS: Only Editors & Admins can read download telemetry
DROP POLICY IF EXISTS "Editors can read download events" ON public.download_events;
CREATE POLICY "Editors can read download events"
  ON public.download_events FOR SELECT
  TO authenticated
  USING (public.is_editor());

-- Anyone can log a download event
DROP POLICY IF EXISTS "Public can insert download events" ON public.download_events;
CREATE POLICY "Public can insert download events"
  ON public.download_events FOR INSERT
  WITH CHECK (true);

-- ── 4. Supabase Storage Bucket Provisioning: 'app-releases' ────────────────────

DO $$ BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'app-releases',
    'app-releases',
    false, -- Strictly private: downloads require server validation & signed URLs
    104857600, -- 100 MB max file size
    ARRAY['application/vnd.android.package-archive', 'application/octet-stream']::text[]
  )
  ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 104857600,
    allowed_mime_types = ARRAY['application/vnd.android.package-archive', 'application/octet-stream']::text[];
EXCEPTION WHEN undefined_table THEN null; END $$;

-- ── 5. Storage RLS Policies for 'app-releases' ─────────────────────────────────

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Anonymous visitors: ZERO direct read access to bucket storage paths
-- (Downloads are authorized exclusively via server-generated signed URLs or API gateway)
DROP POLICY IF EXISTS "Public cannot browse app-releases" ON storage.objects;

-- 2. Authenticated Admin & Editor: Full management of 'app-releases' bucket
DROP POLICY IF EXISTS "Admins and Editors manage app-releases objects" ON storage.objects;
CREATE POLICY "Admins and Editors manage app-releases objects"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'app-releases' AND public.is_editor()
  )
  WITH CHECK (
    bucket_id = 'app-releases' AND public.is_editor()
  );

-- 3. Anonymous and Authors: Strictly denied from inserting/updating/deleting storage objects
DROP POLICY IF EXISTS "Deny unauthorized storage mutations" ON storage.objects;

-- ==============================================================================
-- End of Phase 12 Download Infrastructure Migration
-- ==============================================================================
