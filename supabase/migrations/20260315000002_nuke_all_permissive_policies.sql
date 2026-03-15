-- ============================================================
-- NUCLEAR OPTION: Drop every single policy on projects,
-- social_links, and submissions, then recreate ONLY the ones
-- we want. Also handle storage.objects.
-- ============================================================

-- Use DO block to dynamically drop ALL policies on target tables
DO $$
DECLARE
  pol RECORD;
BEGIN
  -- Drop ALL policies on projects
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'projects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.projects', pol.policyname);
  END LOOP;

  -- Drop ALL policies on social_links
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'social_links'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.social_links', pol.policyname);
  END LOOP;

  -- Drop ALL policies on submissions
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'submissions'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.submissions', pol.policyname);
  END LOOP;

  -- Drop ALL policies on storage.objects that mention portfolio
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- ============================================================
-- Ensure RLS is ON and FORCED
-- ============================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects FORCE ROW LEVEL SECURITY;

ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links FORCE ROW LEVEL SECURITY;

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions FORCE ROW LEVEL SECURITY;

-- ============================================================
-- PROJECTS: anon can ONLY read published. Nothing else.
-- ============================================================
CREATE POLICY "projects_anon_select"
  ON public.projects FOR SELECT
  TO anon
  USING (is_published = true);

-- authenticated role also gets read-only (if supabase uses it)
CREATE POLICY "projects_authenticated_select"
  ON public.projects FOR SELECT
  TO authenticated
  USING (is_published = true);

-- ============================================================
-- SOCIAL_LINKS: anon can ONLY read published. Nothing else.
-- ============================================================
CREATE POLICY "social_links_anon_select"
  ON public.social_links FOR SELECT
  TO anon
  USING (is_published = true);

CREATE POLICY "social_links_authenticated_select"
  ON public.social_links FOR SELECT
  TO authenticated
  USING (is_published = true);

-- ============================================================
-- SUBMISSIONS: anon can INSERT (forced is_approved=false),
-- and read approved only. NO update/delete.
-- ============================================================
CREATE POLICY "submissions_anon_insert"
  ON public.submissions FOR INSERT
  TO anon
  WITH CHECK (
    is_approved = false
    AND admin_notes IS NULL
  );

CREATE POLICY "submissions_anon_select"
  ON public.submissions FOR SELECT
  TO anon
  USING (is_approved = true);

CREATE POLICY "submissions_authenticated_select"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (is_approved = true);

-- ============================================================
-- STORAGE: portfolio bucket read-only for everyone
-- ============================================================
CREATE POLICY "storage_anon_select"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'portfolio');

CREATE POLICY "storage_authenticated_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'portfolio');

-- ============================================================
-- REVOKE direct table permissions from anon as extra safety
-- (RLS should handle it, but belt + suspenders)
-- ============================================================
REVOKE INSERT, UPDATE, DELETE ON public.projects FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.social_links FROM anon;
REVOKE UPDATE, DELETE ON public.submissions FROM anon;
