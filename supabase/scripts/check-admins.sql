-- Check who has admin role (run in Supabase Dashboard → SQL Editor)
-- Project: 8-kutubkhana

SELECT
  email,
  role,
  display_name,
  created_at
FROM public.ktb_profiles
WHERE role = 'admin'
ORDER BY email;
