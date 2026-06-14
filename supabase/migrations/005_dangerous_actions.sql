-- مكتبة المصباح - Phase 4: Dangerous actions (admin-only clear all, safe deletes)
-- Run after 004_data_integrity.sql.

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

COMMENT ON FUNCTION public.clear_all_data() IS 'Deletes all Kutubkhana (ktb_*) app data. Admin only. Used by Settings → حذف كل البيانات.';
