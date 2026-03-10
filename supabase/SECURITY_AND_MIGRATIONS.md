# Backend security: where it lives and what to do

This file clarifies how security is implemented so that reviewers (and tools like ChatGPT) don’t conclude “schema.sql is still open.”

## Where the real security is

- **`schema.sql`** is the **initial** schema: tables + RLS enabled + **temporary** “allow anon all” policies so the app can work before hardening.
- **Security is in the migrations**, not in changing `schema.sql`:
  - **`001_profiles_roles.sql`** – `profiles` table and profile RLS.
  - **`002_profiles_rls_fix.sql`** – Fixes profile RLS recursion (if needed).
  - **`003_rls_role_based.sql`** – **Removes** the anon-all policies and **adds** role-based RLS (authenticated only; viewer/librarian/admin).
  - **`004_data_integrity.sql`** – Constraints (required fields, parts/copies ≥ 1, one active loan per book, return_date ≥ loan_date).
  - **`005_dangerous_actions.sql`** – Admin-only `clear_all_data()` RPC.

So: **the backend is secured only after these migrations are applied.** The repo is “secure” in the sense that the SQL is written; it is **not** secure until you run it in your Supabase project.

## What you must do

1. In **Supabase Dashboard → SQL Editor**, run in order:
   - `schema.sql` (if the project is new),
   - then `001_profiles_roles.sql`,
   - then `002_profiles_rls_fix.sql` (if you had 500s on profiles),
   - then **`003_rls_role_based.sql`** (this is the one that removes anon-all and enforces roles),
   - then `004_data_integrity.sql`,
   - then `005_dangerous_actions.sql`.
2. Set your first admin (see `FIRST_ADMIN_SETUP.md`).

Until **003** (and the rest) are applied, the database still has the open policies from `schema.sql`. So ChatGPT’s concern (“backend security still not finished”) is correct **if migrations have not been run**. The correction: the secure SQL **does exist** in the repo, in the migration files; it is not in `schema.sql` by design.

## Summary for reviewers

| Question | Answer |
|----------|--------|
| Is `schema.sql` still “anon all”? | Yes, on purpose. It’s the baseline. |
| Where is the secure RLS? | In **`migrations/003_rls_role_based.sql`** (drops anon policies, adds role-based policies). |
| Where is `clear_all_data`? | In **`migrations/005_dangerous_actions.sql`**. |
| Is the backend secure now? | Only after you run 001 → 002 → 003 → 004 → 005 in your Supabase project. |
