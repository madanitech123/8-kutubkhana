-- مكتبة المصباح - Phase 1: Role-based RLS (secure backend, ktb_ prefix)
-- Run after schema.sql and 001_profiles_roles.sql (and 002 if applied).

-- Helper: current user's role from ktb_profiles (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.ktb_profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Drop the old open policies (allow anon all)
DROP POLICY IF EXISTS "Allow anon all on ktb_books" ON ktb_books;
DROP POLICY IF EXISTS "Allow anon all on ktb_members" ON ktb_members;
DROP POLICY IF EXISTS "Allow anon all on ktb_loans" ON ktb_loans;
DROP POLICY IF EXISTS "Allow anon all on ktb_diary_entries" ON ktb_diary_entries;
DROP POLICY IF EXISTS "Allow anon all on ktb_categories" ON ktb_categories;
DROP POLICY IF EXISTS "Allow anon all on ktb_publishers" ON ktb_publishers;

-- Books: viewer = read, librarian/admin = full
CREATE POLICY "Books select authenticated role"
  ON ktb_books FOR SELECT
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian', 'viewer'));

CREATE POLICY "Books insert librarian admin"
  ON ktb_books FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Books update librarian admin"
  ON ktb_books FOR UPDATE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'))
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Books delete librarian admin"
  ON ktb_books FOR DELETE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

-- Members
CREATE POLICY "Members select authenticated role"
  ON ktb_members FOR SELECT
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian', 'viewer'));

CREATE POLICY "Members insert librarian admin"
  ON ktb_members FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Members update librarian admin"
  ON ktb_members FOR UPDATE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'))
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Members delete librarian admin"
  ON ktb_members FOR DELETE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

-- Loans
CREATE POLICY "Loans select authenticated role"
  ON ktb_loans FOR SELECT
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian', 'viewer'));

CREATE POLICY "Loans insert librarian admin"
  ON ktb_loans FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Loans update librarian admin"
  ON ktb_loans FOR UPDATE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'))
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Loans delete librarian admin"
  ON ktb_loans FOR DELETE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

-- Diary entries
CREATE POLICY "Diary select authenticated role"
  ON ktb_diary_entries FOR SELECT
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian', 'viewer'));

CREATE POLICY "Diary insert librarian admin"
  ON ktb_diary_entries FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Diary update librarian admin"
  ON ktb_diary_entries FOR UPDATE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'))
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Diary delete librarian admin"
  ON ktb_diary_entries FOR DELETE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

-- Categories
CREATE POLICY "Categories select authenticated role"
  ON ktb_categories FOR SELECT
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian', 'viewer'));

CREATE POLICY "Categories insert librarian admin"
  ON ktb_categories FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Categories update librarian admin"
  ON ktb_categories FOR UPDATE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'))
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Categories delete librarian admin"
  ON ktb_categories FOR DELETE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

-- Publishers
CREATE POLICY "Publishers select authenticated role"
  ON ktb_publishers FOR SELECT
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian', 'viewer'));

CREATE POLICY "Publishers insert librarian admin"
  ON ktb_publishers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Publishers update librarian admin"
  ON ktb_publishers FOR UPDATE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'))
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Publishers delete librarian admin"
  ON ktb_publishers FOR DELETE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));
