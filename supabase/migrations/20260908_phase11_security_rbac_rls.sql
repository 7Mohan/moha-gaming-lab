-- ==============================================================================
-- Moha Gaming Lab — Phase 11: Production Security Hardening & RBAC / RLS Migration
-- Target: PostgreSQL 15+ / Supabase Auth
-- File: supabase/migrations/20260908_phase11_security_rbac_rls.sql
-- ==============================================================================

-- ── 1. Create Enums if not existing ───────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('ADMIN', 'EDITOR', 'AUTHOR', 'USER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('ACTIVE', 'SUSPENDED', 'DISABLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ── 2. User Profiles Table (Linked to auth.users.id) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'USER',
  status user_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Index for role and status lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ── 3. Security Definer Helper Functions ───────────────────────────────────────
-- Set search_path to prevent search_path hijacking attacks

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() AND status = 'ACTIVE';
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'ADMIN'
      AND status = 'ACTIVE'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_editor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('ADMIN', 'EDITOR')
      AND status = 'ACTIVE'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_author()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('ADMIN', 'EDITOR', 'AUTHOR')
      AND status = 'ACTIVE'
  );
$$;

-- ── 4. Automatic Profile Creation Trigger ──────────────────────────────────────
-- Safely inserts profile on new auth.users signup.
-- Defaults to USER role. Only hardcoded SuperAdmin gets ADMIN on signup.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  default_role user_role := 'USER';
BEGIN
  -- Designate Sole SuperAdmin
  IF LOWER(NEW.email) = '4mohabashir@gmail.com' THEN
    default_role := 'ADMIN';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, status)
  VALUES (
    NEW.id,
    LOWER(NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    default_role,
    'ACTIVE'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 5. Enable Row Level Security (RLS) on Exposed Tables ────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.app_releases ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.download_sources ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.seo_metadata ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN null; END $$;

-- ── 6. Explicit PostgreSQL Grants (Least Privilege) ────────────────────────────

-- Revoke all default table privileges from public/anon
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

-- Grants for anon: only read public catalog tables
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.profiles TO authenticated;
-- anon cannot read user profiles or emails
REVOKE SELECT ON public.profiles FROM anon;

-- Anon can read published content tables
DO $$ BEGIN
  GRANT SELECT ON public.games, public.apps, public.tools, public.guides,
                  public.categories, public.tags, public.seo_metadata,
                  public.download_sources, public.app_releases TO anon;
EXCEPTION WHEN undefined_table THEN null; END $$;

-- Authenticated roles can select content
DO $$ BEGIN
  GRANT SELECT ON public.games, public.apps, public.tools, public.guides,
                  public.categories, public.tags, public.seo_metadata,
                  public.download_sources, public.app_releases TO authenticated;
EXCEPTION WHEN undefined_table THEN null; END $$;

-- Authenticated roles can insert/update according to RLS policies
DO $$ BEGIN
  GRANT INSERT, UPDATE, DELETE ON public.games, public.apps, public.tools,
                                  public.guides, public.categories, public.tags,
                                  public.app_releases, public.download_sources,
                                  public.seo_metadata TO authenticated;
EXCEPTION WHEN undefined_table THEN null; END $$;

-- Service role retains full administrative privileges
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- ── 7. RLS Policies: Profiles ──────────────────────────────────────────────────

-- Users can read their own profile; Admins can read all profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_admin());

-- Users can update their own name and avatar; Role elevation is strictly forbidden
DROP POLICY IF EXISTS "Users can update own details" ON public.profiles;
CREATE POLICY "Users can update own details"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (
    -- If not admin, the user cannot change their role or status
    public.is_admin() OR (
      id = auth.uid() AND
      role = (SELECT role FROM public.profiles WHERE id = auth.uid()) AND
      status = (SELECT status FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Only Admin can insert or delete profiles directly
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
CREATE POLICY "Admins can manage profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── 8. RLS Policies: Content Tables (Games, Apps, Tools, Guides) ────────────────

-- Helper macro for Content Tables:
-- 1. Public (anon + authenticated) can SELECT if status = 'PUBLISHED'
-- 2. Authors can SELECT their own drafts/reviews (where author_id = auth.uid())
-- 3. Editors & Admins can SELECT all (including DRAFT, REVIEW, ARCHIVED)
-- 4. Authors can INSERT drafts (status in ('DRAFT', 'REVIEW'))
-- 5. Authors CANNOT publish directly (status = 'PUBLISHED' requires is_editor())
-- 6. Authors CANNOT delete records (requires is_admin() or is_editor() where allowed)

-- GUIDES
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can view published guides" ON public.guides;
  CREATE POLICY "Public can view published guides"
    ON public.guides FOR SELECT
    USING (
      status = 'PUBLISHED' OR
      (auth.role() = 'authenticated' AND (
        author_id = auth.uid() OR
        public.is_editor()
      ))
    );

  DROP POLICY IF EXISTS "Authors can insert draft guides" ON public.guides;
  CREATE POLICY "Authors can insert draft guides"
    ON public.guides FOR INSERT
    TO authenticated
    WITH CHECK (
      public.is_author() AND (
        public.is_editor() OR status IN ('DRAFT', 'REVIEW')
      )
    );

  DROP POLICY IF EXISTS "Authors can update own draft guides" ON public.guides;
  CREATE POLICY "Authors can update own draft guides"
    ON public.guides FOR UPDATE
    TO authenticated
    USING (
      public.is_editor() OR (public.is_author() AND author_id = auth.uid())
    )
    WITH CHECK (
      -- If not editor, cannot transition status to PUBLISHED or change author_id
      public.is_editor() OR (
        status IN ('DRAFT', 'REVIEW') AND
        author_id = auth.uid()
      )
    );

  DROP POLICY IF EXISTS "Admins and Editors can delete guides" ON public.guides;
  CREATE POLICY "Admins and Editors can delete guides"
    ON public.guides FOR DELETE
    TO authenticated
    USING (public.is_editor());
EXCEPTION WHEN undefined_table THEN null; END $$;

-- GAMES
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can view published games" ON public.games;
  CREATE POLICY "Public can view published games"
    ON public.games FOR SELECT
    USING (status = 'PUBLISHED' OR public.is_author());

  DROP POLICY IF EXISTS "Authors and Editors can manage games" ON public.games;
  CREATE POLICY "Authors and Editors can manage games"
    ON public.games FOR INSERT
    TO authenticated
    WITH CHECK (
      public.is_author() AND (public.is_editor() OR status IN ('DRAFT', 'REVIEW'))
    );

  DROP POLICY IF EXISTS "Editors can update games" ON public.games;
  CREATE POLICY "Editors can update games"
    ON public.games FOR UPDATE
    TO authenticated
    USING (public.is_author())
    WITH CHECK (public.is_editor() OR status IN ('DRAFT', 'REVIEW'));

  DROP POLICY IF EXISTS "Only Admins can delete games" ON public.games;
  CREATE POLICY "Only Admins can delete games"
    ON public.games FOR DELETE
    TO authenticated
    USING (public.is_admin());
EXCEPTION WHEN undefined_table THEN null; END $$;

-- APPS & RELEASES
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can view published apps" ON public.apps;
  CREATE POLICY "Public can view published apps"
    ON public.apps FOR SELECT
    USING (status = 'PUBLISHED' OR public.is_author());

  DROP POLICY IF EXISTS "Authors and Editors can insert apps" ON public.apps;
  CREATE POLICY "Authors and Editors can insert apps"
    ON public.apps FOR INSERT
    TO authenticated
    WITH CHECK (
      public.is_author() AND (public.is_editor() OR status IN ('DRAFT', 'REVIEW'))
    );

  DROP POLICY IF EXISTS "Authors and Editors can update apps" ON public.apps;
  CREATE POLICY "Authors and Editors can update apps"
    ON public.apps FOR UPDATE
    TO authenticated
    USING (public.is_author())
    WITH CHECK (public.is_editor() OR status IN ('DRAFT', 'REVIEW'));

  DROP POLICY IF EXISTS "Only Admins can delete apps" ON public.apps;
  CREATE POLICY "Only Admins can delete apps"
    ON public.apps FOR DELETE
    TO authenticated
    USING (public.is_admin());

  -- App Releases
  DROP POLICY IF EXISTS "Public can view verified releases" ON public.app_releases;
  CREATE POLICY "Public can view verified releases"
    ON public.app_releases FOR SELECT
    USING (verification_status = 'VERIFIED' OR public.is_author());

  DROP POLICY IF EXISTS "Authors can insert releases" ON public.app_releases;
  CREATE POLICY "Authors can insert releases"
    ON public.app_releases FOR INSERT
    TO authenticated
    WITH CHECK (
      public.is_author() AND (
        public.is_editor() OR verification_status IN ('PENDING', 'UNVERIFIED')
      )
    );

  DROP POLICY IF EXISTS "Editors can verify releases" ON public.app_releases;
  CREATE POLICY "Editors can verify releases"
    ON public.app_releases FOR UPDATE
    TO authenticated
    USING (public.is_author())
    WITH CHECK (
      public.is_editor() OR verification_status IN ('PENDING', 'UNVERIFIED')
    );
EXCEPTION WHEN undefined_table THEN null; END $$;

-- ── 9. RLS Policies: Audit Logs (Internal Security) ────────────────────────────

DO $$ BEGIN
  -- Anonymous visitors: ZERO access to audit logs
  -- Authors: ZERO access to audit logs
  -- Editors: READ ONLY
  -- Admins: READ ONLY
  -- Mutations: ONLY server via service_role
  DROP POLICY IF EXISTS "Admins and Editors can view audit logs" ON public.audit_logs;
  CREATE POLICY "Admins and Editors can view audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.is_editor());

  DROP POLICY IF EXISTS "No client mutations to audit logs" ON public.audit_logs;
  -- No INSERT/UPDATE/DELETE policy for authenticated -> clients cannot forge audit logs!
EXCEPTION WHEN undefined_table THEN null; END $$;

-- ==============================================================================
-- End of Phase 11 Security Migration
-- ==============================================================================
