-- مكتبة المصباح - Document archive with optional book link (ktb_ prefix)
-- Run after 005_dangerous_actions.sql.

CREATE TABLE IF NOT EXISTS ktb_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'أخرى',
  document_date DATE,
  book_id UUID REFERENCES ktb_books(id) ON DELETE SET NULL,
  file_paths JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE ktb_documents IS 'أرشيف الوثائق: صور/مستندات مع ربط اختياري بكتاب';
COMMENT ON COLUMN ktb_documents.file_paths IS 'Array of storage paths, e.g. ["doc-id/filename.jpg"]';

ALTER TABLE ktb_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Documents select authenticated role"
  ON ktb_documents FOR SELECT
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian', 'viewer'));

CREATE POLICY "Documents insert librarian admin"
  ON ktb_documents FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Documents update librarian admin"
  ON ktb_documents FOR UPDATE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'))
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Documents delete librarian admin"
  ON ktb_documents FOR DELETE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE OR REPLACE FUNCTION documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS documents_updated_at ON ktb_documents;
CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON ktb_documents
  FOR EACH ROW EXECUTE PROCEDURE documents_updated_at();

-- Storage bucket for document images (private, ktb_ prefix)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ktb-document-archive', 'ktb-document-archive', false)
ON CONFLICT (id) DO NOTHING;

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
