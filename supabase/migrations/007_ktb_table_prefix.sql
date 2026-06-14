-- Kutubkhana: rename app tables to ktb_ prefix (shared Supabase DB)
-- Safe for DBs that already have unprefixed tables; no-op if already migrated.

DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL AND to_regclass('public.ktb_profiles') IS NULL THEN
    ALTER TABLE public.profiles RENAME TO ktb_profiles;
  END IF;
  IF to_regclass('public.books') IS NOT NULL AND to_regclass('public.ktb_books') IS NULL THEN
    ALTER TABLE public.books RENAME TO ktb_books;
  END IF;
  IF to_regclass('public.members') IS NOT NULL AND to_regclass('public.ktb_members') IS NULL THEN
    ALTER TABLE public.members RENAME TO ktb_members;
  END IF;
  IF to_regclass('public.loans') IS NOT NULL AND to_regclass('public.ktb_loans') IS NULL THEN
    ALTER TABLE public.loans RENAME TO ktb_loans;
  END IF;
  IF to_regclass('public.diary_entries') IS NOT NULL AND to_regclass('public.ktb_diary_entries') IS NULL THEN
    ALTER TABLE public.diary_entries RENAME TO ktb_diary_entries;
  END IF;
  IF to_regclass('public.categories') IS NOT NULL AND to_regclass('public.ktb_categories') IS NULL THEN
    ALTER TABLE public.categories RENAME TO ktb_categories;
  END IF;
  IF to_regclass('public.publishers') IS NOT NULL AND to_regclass('public.ktb_publishers') IS NULL THEN
    ALTER TABLE public.publishers RENAME TO ktb_publishers;
  END IF;
  IF to_regclass('public.documents') IS NOT NULL AND to_regclass('public.ktb_documents') IS NULL THEN
    ALTER TABLE public.documents RENAME TO ktb_documents;
  END IF;
END $$;

-- Role helper: read from ktb_profiles
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.ktb_profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_profiles_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ktb_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.clear_all_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_profiles_admin() THEN
    RAISE EXCEPTION 'صلاحية المدير فقط'
      USING errcode = 'P0001';
  END IF;

  DELETE FROM ktb_loans;
  DELETE FROM ktb_documents;
  DELETE FROM ktb_books;
  DELETE FROM ktb_members;
  DELETE FROM ktb_diary_entries;
  DELETE FROM ktb_categories;
  DELETE FROM ktb_publishers;
END;
$$;

GRANT EXECUTE ON FUNCTION public.clear_all_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_all_data() TO service_role;

COMMENT ON FUNCTION public.clear_all_data() IS 'Deletes all Kutubkhana (ktb_*) app data. Admin only.';
