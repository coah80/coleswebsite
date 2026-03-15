-- ============================================================
-- FIX RLS: The previous migration's policies were not restrictive
-- enough. This drops ALL existing policies and creates strict ones.
--
-- Strategy:
--   anon role gets ONLY specific, narrow permissions
--   Everything else is denied by default (RLS deny-by-default)
--   service_role bypasses RLS entirely (Supabase built-in behavior)
-- ============================================================

-- --------------------------------------------------------
-- PROJECTS: public read published only, NO writes for anon
-- --------------------------------------------------------
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects FORCE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Anyone can read published projects" ON public.projects;
DROP POLICY IF EXISTS "Service role full access to projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public read" ON public.projects;
DROP POLICY IF EXISTS "Deny anon write" ON public.projects;
DROP POLICY IF EXISTS "Deny anon update" ON public.projects;
DROP POLICY IF EXISTS "Deny anon delete" ON public.projects;

-- Only policy: anon can read published projects. That's it.
CREATE POLICY "anon_read_published_projects"
  ON public.projects FOR SELECT
  TO anon
  USING (is_published = true);

-- --------------------------------------------------------
-- SOCIAL_LINKS: public read published only, NO writes for anon
-- --------------------------------------------------------
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read published social links" ON public.social_links;
DROP POLICY IF EXISTS "Service role full access to social_links" ON public.social_links;

CREATE POLICY "anon_read_published_social_links"
  ON public.social_links FOR SELECT
  TO anon
  USING (is_published = true);

-- --------------------------------------------------------
-- SUBMISSIONS: anon can only INSERT with is_approved=false,
-- and can only read approved ones. NO update/delete for anon.
-- --------------------------------------------------------
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert submissions" ON public.submissions;
DROP POLICY IF EXISTS "Anyone can read approved submissions" ON public.submissions;
DROP POLICY IF EXISTS "Service role full access to submissions" ON public.submissions;

-- Force is_approved to false on insert — attacker can't pre-approve
CREATE POLICY "anon_insert_submissions"
  ON public.submissions FOR INSERT
  TO anon
  WITH CHECK (
    is_approved = false
    AND admin_notes IS NULL
  );

-- Anon can only see approved submissions
CREATE POLICY "anon_read_approved_submissions"
  ON public.submissions FOR SELECT
  TO anon
  USING (is_approved = true);

-- --------------------------------------------------------
-- STORAGE: portfolio bucket — anon can read only
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload portfolio images" ON storage.objects;
-- Drop any default permissive policies that may exist
DROP POLICY IF EXISTS "allow public read" ON storage.objects;
DROP POLICY IF EXISTS "allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to portfolio folder 17wrxm2_0" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to portfolio folder 17wrxm2_1" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to portfolio folder 17wrxm2_2" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 17wrxm2_0" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 17wrxm2_1" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 17wrxm2_2" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates" ON storage.objects;

-- Only allow reading from portfolio bucket
CREATE POLICY "anon_read_portfolio_images"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'portfolio');

-- --------------------------------------------------------
-- NOTE: service_role bypasses RLS entirely in Supabase,
-- so the edge functions using SUPABASE_SERVICE_ROLE_KEY
-- will still have full access. No explicit policy needed.
-- --------------------------------------------------------
