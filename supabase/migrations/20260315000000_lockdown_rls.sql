-- ============================================================
-- RLS LOCKDOWN: Only the service_role can write to projects,
-- social_links, and submissions.  The anon role can only:
--   * SELECT published projects & social_links (public website)
--   * INSERT into submissions (contact form) with rate-limit guard
-- ============================================================

-- Enable RLS on every table that matters
ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.submissions ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- PROJECTS
-- --------------------------------------------------------
-- Drop any existing permissive policies so we start clean
DROP POLICY IF EXISTS "Anyone can read published projects" ON public.projects;
DROP POLICY IF EXISTS "Service role full access to projects" ON public.projects;

-- Public can only read published projects
CREATE POLICY "Anyone can read published projects"
  ON public.projects FOR SELECT
  USING (is_published = true);

-- Service role (used by edge functions) has full access
CREATE POLICY "Service role full access to projects"
  ON public.projects FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- --------------------------------------------------------
-- SOCIAL_LINKS
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read published social links" ON public.social_links;
DROP POLICY IF EXISTS "Service role full access to social_links" ON public.social_links;

-- Public can only read published links
CREATE POLICY "Anyone can read published social links"
  ON public.social_links FOR SELECT
  USING (is_published = true);

-- Service role has full access
CREATE POLICY "Service role full access to social_links"
  ON public.social_links FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- --------------------------------------------------------
-- SUBMISSIONS
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can insert submissions" ON public.submissions;
DROP POLICY IF EXISTS "Service role full access to submissions" ON public.submissions;
DROP POLICY IF EXISTS "Anyone can read approved submissions" ON public.submissions;

-- Public can only INSERT (contact form) — no read, update, delete
CREATE POLICY "Anyone can insert submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (true);

-- Public can read approved submissions (for the wall/gallery if you have one)
CREATE POLICY "Anyone can read approved submissions"
  ON public.submissions FOR SELECT
  USING (is_approved = true);

-- Service role has full access (admin dashboard)
CREATE POLICY "Service role full access to submissions"
  ON public.submissions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- --------------------------------------------------------
-- STORAGE: portfolio bucket
-- --------------------------------------------------------
-- Revoke public upload on the portfolio bucket — only service role can upload
DROP POLICY IF EXISTS "Anyone can upload portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read portfolio images" ON storage.objects;

-- Public can view portfolio images
CREATE POLICY "Anyone can read portfolio images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio');

-- Only service role can upload/modify
CREATE POLICY "Service role can upload portfolio images"
  ON storage.objects FOR ALL
  USING (bucket_id = 'portfolio' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'portfolio' AND auth.role() = 'service_role');
