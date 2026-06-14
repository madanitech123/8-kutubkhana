-- مكتبة المصباح - Profiles & roles (Option B: custom table, ktb_ prefix)
-- Run in Supabase Dashboard → SQL Editor (after schema.sql)

-- Profiles: one row per app user (synced with auth.users)
CREATE TABLE IF NOT EXISTS ktb_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'librarian', 'viewer')),
  display_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ktb_profiles ENABLE ROW LEVEL SECURITY;

-- Helper: returns true if current user is admin (SECURITY DEFINER avoids RLS recursion)
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

-- Users can read own profile; admins can read all (no self-query to avoid 500)
CREATE POLICY "Profiles read own or admin all"
  ON ktb_profiles FOR SELECT
  USING (auth.uid() = user_id OR public.is_profiles_admin());

-- Users can insert their own profile (first-time signup: creates row with role viewer)
CREATE POLICY "Users can insert own profile"
  ON ktb_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only admins can update any profile (e.g. change role)
CREATE POLICY "Only admins can update profiles"
  ON ktb_profiles FOR UPDATE
  USING (public.is_profiles_admin())
  WITH CHECK (public.is_profiles_admin());

-- Only admins can delete profiles (e.g. remove user from app)
CREATE POLICY "Only admins can delete profiles"
  ON ktb_profiles FOR DELETE
  USING (public.is_profiles_admin());

-- Optional: trigger to set updated_at
CREATE OR REPLACE FUNCTION profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON ktb_profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON ktb_profiles
  FOR EACH ROW EXECUTE PROCEDURE profiles_updated_at();

-- IMPORTANT: Set the first admin manually after first user signs up, e.g.:
-- UPDATE ktb_profiles SET role = 'admin' WHERE email = 'your-admin@example.com';
