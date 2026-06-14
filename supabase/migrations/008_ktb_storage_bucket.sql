-- Kutubkhana: migrate document storage bucket to ktb-document-archive prefix
-- Safe when old bucket is empty (no file migration needed).

INSERT INTO storage.buckets (id, name, public)
VALUES ('ktb-document-archive', 'ktb-document-archive', false)
ON CONFLICT (id) DO NOTHING;

-- Remove legacy bucket policies (document-archive)
DROP POLICY IF EXISTS "Document archive read authenticated role" ON storage.objects;
DROP POLICY IF EXISTS "Document archive insert librarian admin" ON storage.objects;
DROP POLICY IF EXISTS "Document archive update librarian admin" ON storage.objects;
DROP POLICY IF EXISTS "Document archive delete librarian admin" ON storage.objects;

-- Remove ktb policies if re-running migration
DROP POLICY IF EXISTS "Ktb document archive read authenticated role" ON storage.objects;
DROP POLICY IF EXISTS "Ktb document archive insert librarian admin" ON storage.objects;
DROP POLICY IF EXISTS "Ktb document archive update librarian admin" ON storage.objects;
DROP POLICY IF EXISTS "Ktb document archive delete librarian admin" ON storage.objects;

CREATE POLICY "Ktb document archive read authenticated role"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ktb-document-archive'
    AND auth.uid() IS NOT NULL
    AND public.get_user_role() IN ('admin', 'librarian', 'viewer')
  );

CREATE POLICY "Ktb document archive insert librarian admin"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ktb-document-archive'
    AND auth.uid() IS NOT NULL
    AND public.get_user_role() IN ('admin', 'librarian')
  );

CREATE POLICY "Ktb document archive update librarian admin"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'ktb-document-archive'
    AND auth.uid() IS NOT NULL
    AND public.get_user_role() IN ('admin', 'librarian')
  );

CREATE POLICY "Ktb document archive delete librarian admin"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'ktb-document-archive'
    AND auth.uid() IS NOT NULL
    AND public.get_user_role() IN ('admin', 'librarian')
  );

-- Legacy bucket `document-archive` (if empty): delete manually in Supabase Dashboard
-- → Storage → document-archive → Delete bucket
-- Direct DELETE on storage.buckets is blocked by Supabase protect_delete().
