# IMPLEMENTATION_ORDER.md

## Project
Repository: `sani1415/8-kutubkhana`

## Goal
Make the system safer for real use **without changing the current UI and user workflow unless necessary**.

## Important rule
For the first phase, **do not redesign the app** and **do not migrate the stack**.  
Keep the same screens, same navigation, and same core behavior.

---

## Phase 1 — Secure the backend first

### Task 1: Fix Supabase security policies
Current priority: **highest**

Do these first:
- Remove the current open/unsafe policies that allow overly broad access.
- Require authenticated users for app data access.
- Apply role-based rules for:
  - `admin`
  - `librarian`
  - `viewer`

Expected role behavior:
- `viewer`: read only
- `librarian`: create/update normal library data
- `admin`: full access including user/role management and dangerous actions

Target tables:
- `books`
- `members`
- `loans`
- `diary_entries`
- `categories`
- `publishers`
- `profiles`

Output:
- New SQL migration for proper RLS policies
- Clear notes for first admin setup

---

## Phase 2 — Enforce permissions in backend, not only UI

### Task 2: Keep current UI behavior, but enforce the same rules in database/backend
Do **not** rely only on hidden buttons or front-end checks.

Check these actions carefully:
- Add book
- Edit book
- Delete book
- Add member
- Edit member
- Delete member
- Add loan
- Return loan
- Delete loan
- Add/edit/delete diary
- Add/edit/delete category
- Add/edit/delete publisher
- Export backup
- Delete all data
- Change user roles

Output:
- A simple permission matrix
- Matching backend enforcement

---

## Phase 3 — Add basic data integrity protection

### Task 3: Prevent broken or invalid data
Add safety checks for the most important records.

Must protect at least these cases:
- A book cannot be loaned twice at the same time
- Required book fields must not be empty
- Invalid numeric values should be blocked
- A loan return date must not break date logic
- Related deletions should not leave the system inconsistent

Minimum checks:
- `books.name` required
- `books.author` required
- `books.category` required
- `books.cabinet` required
- `books.parts >= 1`
- `books.copies >= 1`
- loan status must stay consistent with book availability

Output:
- SQL constraints where appropriate
- Matching app-side validation where needed

---

## Phase 4 — Fix dangerous actions

### Task 4: Review and secure destructive operations
Keep the same features, but make them safe.

Review these carefully:
- Delete single book
- Bulk delete books
- Delete member
- Delete loan
- Delete category
- Delete publisher
- Delete all data

Expected behavior:
- Prevent deletion when it would break related records
- Restrict dangerous actions to admin only
- Add strong confirmation where necessary
- Keep behavior predictable and consistent

Output:
- Safe delete rules
- Updated backend enforcement
- Minimal UI changes only if truly needed

---

## Phase 5 — Backup and audit after security is stable

### Task 5: Add recovery and accountability
Do this after Phases 1–4 are complete.

Add:
- Reliable backup export
- Restore strategy
- Audit log of important changes

Audit should include at least:
- book create/update/delete
- member create/update/delete
- loan create/return/delete
- role changes
- bulk imports
- delete-all operations

Output:
- `audit_logs` design
- backup/restore plan
- minimal admin-facing access to logs

---

## Best first sprint
If you want the smallest safe implementation batch, do only these 4 first:

1. Secure Supabase RLS policies  
2. Enforce roles in backend  
3. Add basic data integrity checks  
4. Review dangerous delete actions  

---

## What should NOT be done now
For this phase, do **not** prioritize:
- UI redesign
- React/Vite migration
- Tailwind migration
- extra reports
- visual improvements
- large feature expansion

---

## Final instruction for Cursor
Implement the system in this order:
1. Security
2. Permissions
3. Data integrity
4. Dangerous action review
5. Backup/audit

Do not make unnecessary behavior changes in the first phase.
Keep the current user-facing workflow as stable as possible.
