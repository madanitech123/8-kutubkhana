-- مكتبة المصباح - Phase 4: Dangerous actions (admin-only clear all, safe deletes)
-- Run after 004_data_integrity.sql.

-- Admin-only "delete all data". Only admins can execute; runs in correct order to respect FKs.
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

  DELETE FROM loans;
  DELETE FROM books;
  DELETE FROM members;
  DELETE FROM diary_entries;
  DELETE FROM categories;
  DELETE FROM publishers;
END;
$$;

-- Allow authenticated users to call; function itself enforces admin
GRANT EXECUTE ON FUNCTION public.clear_all_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_all_data() TO service_role;

COMMENT ON FUNCTION public.clear_all_data() IS 'Deletes all app data. Admin only. Used by Settings → حذف كل البيانات.';
