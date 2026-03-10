# Permission matrix (مكتبة المصباح)

Who can do what. **Backend** = Supabase RLS (database). **UI** = app hides/shows actions by role.

| Action | Viewer | Librarian | Admin | Backend (RLS) |
|--------|--------|-----------|-------|----------------|
| **Books** | | | | |
| View / list books | ✅ | ✅ | ✅ | ✅ SELECT |
| Add book | ❌ | ✅ | ✅ | ✅ INSERT |
| Edit book | ❌ | ✅ | ✅ | ✅ UPDATE |
| Delete book | ❌ | ✅ | ✅ | ✅ DELETE |
| Bulk delete books | ❌ | ✅ | ✅ | ✅ DELETE |
| **Members** | | | | |
| View / list members | ✅ | ✅ | ✅ | ✅ SELECT |
| Add member | ❌ | ✅ | ✅ | ✅ INSERT |
| Edit member | ❌ | ✅ | ✅ | ✅ UPDATE |
| Delete member | ❌ | ✅ | ✅ | ✅ DELETE |
| **Loans** | | | | |
| View / list loans | ✅ | ✅ | ✅ | ✅ SELECT |
| Add loan | ❌ | ✅ | ✅ | ✅ INSERT |
| Return loan | ❌ | ✅ | ✅ | ✅ UPDATE |
| Delete loan | ❌ | ✅ | ✅ | ✅ DELETE |
| **Diary** | | | | |
| View diary | ✅ | ✅ | ✅ | ✅ SELECT |
| Add diary entry | ❌ | ✅ | ✅ | ✅ INSERT |
| Edit diary entry | ❌ | ✅ | ✅ | ✅ UPDATE |
| Delete diary entry | ❌ | ✅ | ✅ | ✅ DELETE |
| **Categories** | | | | |
| View categories | ✅ | ✅ | ✅ | ✅ SELECT |
| Add category | ❌ | ✅ | ✅ | ✅ INSERT |
| Edit category | ❌ | ✅ | ✅ | ✅ UPDATE |
| Delete category | ❌ | ✅ | ✅ | ✅ DELETE |
| **Publishers** | | | | |
| View publishers | ✅ | ✅ | ✅ | ✅ SELECT |
| Add publisher | ❌ | ✅ | ✅ | ✅ INSERT |
| Edit publisher | ❌ | ✅ | ✅ | ✅ UPDATE |
| Delete publisher | ❌ | ✅ | ✅ | ✅ DELETE |
| **Settings / dangerous** | | | | |
| Export backup (Excel) | ❌ | ✅* | ✅ | N/A (uses data already loaded) |
| Delete all data | ❌ | ❌ | ✅ | ✅ RPC admin-only (005) |
| Change user roles | ❌ | ❌ | ✅ | ✅ UPDATE on `profiles` (admin only) |

\* Export backup is currently inside the admin-only Settings block in the UI; RLS does not apply to client-side export (user only exports what they can already read).

## Enforcement summary

- **Phase 1 (003_rls_role_based.sql):** RLS enforces SELECT for viewer; SELECT + INSERT + UPDATE + DELETE for librarian and admin on `books`, `members`, `loans`, `diary_entries`, `categories`, `publishers`. Profiles: only admins can UPDATE/DELETE.
- **UI:** Buttons and nav use `canEdit()` (librarian or admin) and `isAdmin()` (admin only). Settings admin block (users, backup, delete all) is shown only to admin.
- **Phase 4** will restrict “delete all data” to admin-only in backend and add stronger confirmations.

## Quick reference

- **viewer:** read-only (all app data).
- **librarian:** full CRUD on books, members, loans, diary, categories, publishers; no user/role management; no delete-all in UI.
- **admin:** everything, including user/role management and delete-all.
