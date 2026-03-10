-- مكتبة المصباح - Document archive with optional book link (Option C)
-- Run after 005_dangerous_actions.sql.

-- Documents table: metadata + optional link to book
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'أخرى',
  document_date DATE,
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  file_paths JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE documents IS 'أرشيف الوثائق: صور/مستندات مع ربط اختياري بكتاب';
COMMENT ON COLUMN documents.file_paths IS 'Array of storage paths, e.g. ["doc-id/filename.jpg"]';

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS: same as other app tables (viewer read, librarian/admin full)
CREATE POLICY "Documents select authenticated role"
  ON documents FOR SELECT
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian', 'viewer'));

CREATE POLICY "Documents insert librarian admin"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Documents update librarian admin"
  ON documents FOR UPDATE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'))
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Documents delete librarian admin"
  ON documents FOR DELETE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

-- Trigger updated_at
CREATE OR REPLACE FUNCTION documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS documents_updated_at ON documents;
CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE PROCEDURE documents_updated_at();

-- Storage bucket for document images (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('document-archive', 'document-archive', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: read for authenticated with role, write for librarian/admin
CREATE POLICY "Document archive read authenticated role"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'document-archive'
    AND auth.uid() IS NOT NULL
    AND public.get_user_role() IN ('admin', 'librarian', 'viewer')
  );

CREATE POLICY "Document archive insert librarian admin"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'document-archive'
    AND auth.uid() IS NOT NULL
    AND public.get_user_role() IN ('admin', 'librarian')
  );

CREATE POLICY "Document archive update librarian admin"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'document-archive'
    AND auth.uid() IS NOT NULL
    AND public.get_user_role() IN ('admin', 'librarian')
  );

CREATE POLICY "Document archive delete librarian admin"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'document-archive'
    AND auth.uid() IS NOT NULL
    AND public.get_user_role() IN ('admin', 'librarian')
  );
