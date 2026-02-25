-- Fix 500 on profiles: avoid RLS recursion by using a SECURITY DEFINER helper
-- Run this in Supabase SQL Editor if you get 500 on GET/POST /rest/v1/profiles

-- Helper: returns true if current user has role 'admin' (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_profiles_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Drop existing policies so we can recreate them
DROP POLICY IF EXISTS "Profiles read own or admin all" ON profiles;
DROP POLICY IF EXISTS "Only admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON profiles;

-- SELECT: own row or admin (uses helper, no self-query)
CREATE POLICY "Profiles read own or admin all"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id OR public.is_profiles_admin());

-- UPDATE: only admin (uses helper)
CREATE POLICY "Only admins can update profiles"
  ON profiles FOR UPDATE
  USING (public.is_profiles_admin())
  WITH CHECK (public.is_profiles_admin());

-- DELETE: only admin (uses helper)
CREATE POLICY "Only admins can delete profiles"
  ON profiles FOR DELETE
  USING (public.is_profiles_admin());
