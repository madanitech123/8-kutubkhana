-- مكتبة المصباح - Phase 3: Data integrity (constraints + one active loan per book)
-- Run after 003_rls_role_based.sql.

-- ---------------------------------------------------------------------------
-- Books: required fields and valid numbers
-- ---------------------------------------------------------------------------

-- Backfill empty required fields so CHECK constraints can be added
UPDATE books SET name = 'بدون عنوان' WHERE trim(name) = '';
UPDATE books SET author = 'غير محدد' WHERE trim(author) = '';
UPDATE books SET category = 'عام' WHERE trim(category) = '';
UPDATE books SET cabinet = '-' WHERE trim(cabinet) = '';

-- Ensure numeric defaults before adding CHECK
UPDATE books SET parts = 1 WHERE parts IS NULL OR parts < 1;
UPDATE books SET copies = 1 WHERE copies IS NULL OR copies < 1;

-- Required and valid values
ALTER TABLE books ADD CONSTRAINT books_name_not_empty
  CHECK (trim(name) <> '');

ALTER TABLE books ADD CONSTRAINT books_author_not_empty
  CHECK (trim(author) <> '');

ALTER TABLE books ADD CONSTRAINT books_category_not_empty
  CHECK (trim(category) <> '');

ALTER TABLE books ADD CONSTRAINT books_cabinet_not_empty
  CHECK (trim(cabinet) <> '');

ALTER TABLE books ADD CONSTRAINT books_parts_min
  CHECK (parts >= 1);

ALTER TABLE books ADD CONSTRAINT books_copies_min
  CHECK (copies >= 1);

-- ---------------------------------------------------------------------------
-- Loans: one active loan per book, return_date >= loan_date
-- ---------------------------------------------------------------------------

-- Resolve duplicate active loans: keep latest per book, mark older as returned
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY book_id ORDER BY created_at DESC NULLS LAST) AS rn
  FROM loans
  WHERE status = 'معار'
),
dupes AS (
  SELECT id FROM ranked WHERE rn > 1
)
UPDATE loans
SET return_date = COALESCE(loan_date, current_date), status = 'مُرجع'
FROM dupes
WHERE loans.id = dupes.id;

-- At most one active (معار) loan per book
CREATE UNIQUE INDEX loans_one_active_per_book
  ON loans (book_id)
  WHERE (status = 'معار');

-- Fix any existing bad data (return_date < loan_date) before adding CHECK
UPDATE loans
SET return_date = loan_date
WHERE return_date IS NOT NULL AND loan_date IS NOT NULL AND return_date < loan_date;

-- Return date must not be before loan date
ALTER TABLE loans ADD CONSTRAINT loans_return_after_loan
  CHECK (
    return_date IS NULL
    OR loan_date IS NULL
    OR return_date >= loan_date
  );
