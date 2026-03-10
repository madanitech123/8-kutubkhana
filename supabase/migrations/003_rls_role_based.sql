-- مكتبة المصباح - Phase 1: Role-based RLS (secure backend)
-- Run after schema.sql and 001_profiles_roles.sql (and 002 if applied).
-- Requires authenticated users; viewer = read-only, librarian = CRUD, admin = full.

-- Helper: current user's role from profiles (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Drop the old open policies (allow anon all)
DROP POLICY IF EXISTS "Allow anon all on books" ON books;
DROP POLICY IF EXISTS "Allow anon all on members" ON members;
DROP POLICY IF EXISTS "Allow anon all on loans" ON loans;
DROP POLICY IF EXISTS "Allow anon all on diary_entries" ON diary_entries;
DROP POLICY IF EXISTS "Allow anon all on categories" ON categories;
DROP POLICY IF EXISTS "Allow anon all on publishers" ON publishers;

-- Books: viewer = read, librarian/admin = full
CREATE POLICY "Books select authenticated role"
  ON books FOR SELECT
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian', 'viewer'));

CREATE POLICY "Books insert librarian admin"
  ON books FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Books update librarian admin"
  ON books FOR UPDATE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'))
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Books delete librarian admin"
  ON books FOR DELETE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

-- Members
CREATE POLICY "Members select authenticated role"
  ON members FOR SELECT
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian', 'viewer'));

CREATE POLICY "Members insert librarian admin"
  ON members FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Members update librarian admin"
  ON members FOR UPDATE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'))
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Members delete librarian admin"
  ON members FOR DELETE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

-- Loans
CREATE POLICY "Loans select authenticated role"
  ON loans FOR SELECT
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian', 'viewer'));

CREATE POLICY "Loans insert librarian admin"
  ON loans FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Loans update librarian admin"
  ON loans FOR UPDATE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'))
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Loans delete librarian admin"
  ON loans FOR DELETE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

-- Diary entries
CREATE POLICY "Diary select authenticated role"
  ON diary_entries FOR SELECT
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian', 'viewer'));

CREATE POLICY "Diary insert librarian admin"
  ON diary_entries FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Diary update librarian admin"
  ON diary_entries FOR UPDATE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'))
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Diary delete librarian admin"
  ON diary_entries FOR DELETE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

-- Categories
CREATE POLICY "Categories select authenticated role"
  ON categories FOR SELECT
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian', 'viewer'));

CREATE POLICY "Categories insert librarian admin"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Categories update librarian admin"
  ON categories FOR UPDATE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'))
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Categories delete librarian admin"
  ON categories FOR DELETE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

-- Publishers
CREATE POLICY "Publishers select authenticated role"
  ON publishers FOR SELECT
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian', 'viewer'));

CREATE POLICY "Publishers insert librarian admin"
  ON publishers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Publishers update librarian admin"
  ON publishers FOR UPDATE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'))
  WITH CHECK (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));

CREATE POLICY "Publishers delete librarian admin"
  ON publishers FOR DELETE
  USING (auth.uid() IS NOT NULL AND public.get_user_role() IN ('admin', 'librarian'));
