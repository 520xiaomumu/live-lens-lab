-- Fix RLS policies on deployments table

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can read deployments" ON public.deployments;
DROP POLICY IF EXISTS "Service role can insert deployments" ON public.deployments;
DROP POLICY IF EXISTS "Service role can update deployments" ON public.deployments;
DROP POLICY IF EXISTS "Service role can delete deployments" ON public.deployments;

-- Create restrictive policies for read (only active deployments)
CREATE POLICY "Public can read active deployments only"
  ON public.deployments FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Service role policies for write operations (used by Edge Functions)
CREATE POLICY "Service role can insert deployments"
  ON public.deployments FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update deployments"
  ON public.deployments FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "Service role can delete deployments"
  ON public.deployments FOR DELETE
  TO service_role
  USING (true);

-- Service role can read all deployments (including unpublished)
CREATE POLICY "Service role can read all deployments"
  ON public.deployments FOR SELECT
  TO service_role
  USING (true);

-- Fix storage policies

-- Drop overly permissive storage policies
DROP POLICY IF EXISTS "Service role can upload to html-pages" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete from html-pages" ON storage.objects;

-- Create restrictive storage policies (service_role only for write)
CREATE POLICY "Service role can upload to html-pages"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'html-pages');

CREATE POLICY "Service role can delete from html-pages"
  ON storage.objects FOR DELETE
  TO service_role
  USING (bucket_id = 'html-pages');